"use strict";

const { Sequelize } = require("sequelize");
const {
  CouponAssignment,
  CouponBook,
  CouponCode,
  User,
} = require("../models");
const asyncH = require("../utils/asyncH");
const HttpError = require("../utils/HttpError");

module.exports = {
  // POST /v1/assignments/random - Asignar cupones aleatorios a un usuario
  assignRandomCoupons: asyncH(async (req, res) => {
    const { bookId, userId, quantity } = req.body;

    if (!bookId || !userId || !quantity) {
      throw new HttpError(400, "bookId, userId, and quantity are required");
    }

    if (quantity <= 0) {
      throw new HttpError(400, "Quantity must be greater than 0");
    }

    // Verificar que el book existe
    const book = await CouponBook.findByPk(bookId);
    if (!book) {
      throw new HttpError(404, "Book not found");
    }

    // Verificar que el book esté activo
    if (book.status !== "ACTIVE") {
      throw new HttpError(409, "CouponBook is not ACTIVE");
    }

    // Verificar fechas del book
    const now = new Date();
    if (book.start_at && now < book.start_at) {
      throw new HttpError(409, "CouponBook not started yet");
    }

    if (book.end_at && now > book.end_at) {
      throw new HttpError(409, "CouponBook already ended");
    }

    // Verificar límite por usuario si existe
    if (book.per_user_max_assigned_codes != null) {
      const current = await CouponAssignment.count({
        where: {
          user_id: userId,
        },
        include: [{
          model: CouponCode,
          where: { book_id: bookId },
          required: true
        }]
      });

      if (current >= book.per_user_max_assigned_codes) {
        throw new HttpError(403, "Per-user assignment limit reached for this CouponBook");
      }
    }

    // Verificar que el usuario existe
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email']
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    // Verificar cantidad disponible sin traer todos los registros
    const availableCount = await CouponCode.count({
      where: {
        book_id: bookId,
        status: 'AVAILABLE'
      }
    });

    if (availableCount < quantity) {
      throw new HttpError(400, `Not enough available coupons. Found ${availableCount}, needed ${quantity}`);
    }

    const assignments = await CouponAssignment.sequelize.transaction(async (t) => {
      
      const randomCoupons = await CouponCode.findAll({
        where: {
          book_id: bookId,
          status: 'AVAILABLE'
        },
        limit: quantity,
        order: CouponAssignment.sequelize.random(), // Usar random() de PostgreSQL
        transaction: t,
        lock: true // Lock para evitar condiciones de carrera
      });

      if (randomCoupons.length < quantity) {
        throw new HttpError(400, `Not enough available coupons after lock. Found ${randomCoupons.length}, needed ${quantity}`);
      }

      const now = new Date();
      const assignments = [];

      // Actualizar todos los cupones de una vez
      const couponIds = randomCoupons.map(c => c.id);
      await CouponCode.update(
        {
          status: 'ASSIGNED',
          assigned_at: now
        },
        {
          where: { id: couponIds },
          transaction: t
        }
      );

      // Crear todas las asignaciones de una vez
      const assignmentData = randomCoupons.map(coupon => ({
        coupon_id: coupon.id,
        user_id: userId,
        assigned_at: now
      }));

      const createdAssignments = await CouponAssignment.bulkCreate(assignmentData, {
        transaction: t,
        returning: ['id', 'coupon_id', 'user_id', 'assigned_at', 'created_at', 'updated_at']
      });

      return createdAssignments;
    });

    res.json({
      message: `Successfully assigned ${quantity} coupons to user ${user.name}`,
      data: {
        assignments,
        totalAssigned: assignments.length,
        user: { id: user.id, name: user.name, email: user.email }
      }
    });
  }),

  // POST /v1/assignments/specific - Asignar un cupón específico a un usuario
  assignSpecificCoupon: asyncH(async (req, res) => {
    const { code, userId } = req.body;

    if (!code || !userId) {
      throw new HttpError(400, "code and userId are required");
    }

    // Buscar el cupón con su book
    const coupon = await CouponCode.findOne({
      where: {
        code: code,
        status: 'AVAILABLE'
      },
      include: [{
        model: CouponBook,
        as: 'book',
        attributes: ['id', 'name', 'status', 'start_at', 'end_at', 'per_user_max_assigned_codes']
      }]
    });

    if (!coupon) {
      throw new HttpError(404, "Coupon not found or not available");
    }

    const book = coupon.book;

    // Verificar que el book esté activo
    if (book.status !== "ACTIVE") {
      throw new HttpError(409, "CouponBook is not ACTIVE");
    }

    // Verificar fechas del book
    const now = new Date();
    if (book.start_at && now < book.start_at) {
      throw new HttpError(409, "CouponBook not started yet");
    }
    if (book.end_at && now > book.end_at) {
      throw new HttpError(409, "CouponBook already ended");
    }

    // Verificar límite por usuario si existe
    if (book.per_user_max_assigned_codes != null) {
      const current = await CouponAssignment.count({
        where: {
          user_id: userId,
        },
        include: [{
          model: CouponCode,
          where: { book_id: book.id },
          required: true
        }]
      });

      if (current >= book.per_user_max_assigned_codes) {
        throw new HttpError(403, "Per-user assignment limit reached for this CouponBook");
      }
    }

    // Verificar que el usuario existe
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email']
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    // Usar transacción para asegurar consistencia
    const result = await CouponAssignment.sequelize.transaction(async (t) => {
      // Actualizar el cupón
      await coupon.update({
        status: 'ASSIGNED',
        assigned_at: new Date()
      }, { transaction: t });

      // Crear nueva asignación
      const assignment = await CouponAssignment.create({
        coupon_id: coupon.id,
        user_id: userId,
        assigned_at: new Date()
      });

      return { assignment, coupon };
    });

    res.json({
      message: `Successfully assigned coupon ${code} to user ${user.name}`,
      data: {
        assignment: result.assignment,
        coupon: {
          id: result.coupon.id,
          code: result.coupon.code,
          book_name: book.name
        },
        user: { id: user.id, name: user.name, email: user.email }
      }
    });
  }),

  // GET /v1/assignments/:id
  get: asyncH(async (req, res) => {
    const assignment =
      await CouponAssignment.findByPk(
        req.params.id,
        {
          include: [
            {
              model: CouponCode,
              as: "code",
              include: [{
                model: CouponBook,
                as: "book",
              }]
            },
            { model: User, as: "user" },
          ],
        }
      );

    if (!assignment) {
      throw new HttpError(
        404,
        "CouponAssignment not found"
      );
    }

    res.json({ data: assignment });
  }),

  // GET /v1/assignments/user/:userId
  listByUser: asyncH(
    async (req, res) => {
      const { bookId, status } =
        req.query;
      const { userId } = req.params;

      const where = { user_id: userId };
      
      // Para bookId y status, necesitamos usar include
      const couponCodeWhere = {};
      if (bookId) {
        couponCodeWhere.book_id = bookId;
      }
      if (status) {
        couponCodeWhere.status = status;
      }

      const assignments =
        await CouponAssignment.findAll({
          where,
          attributes: ['id', 'coupon_id', 'user_id', 'assigned_at', 'created_at', 'updated_at'],
          include: [
            {
              model: CouponCode,
              as: "code",
              where: couponCodeWhere,
              required: true,
              include: [{
                model: CouponBook,
                as: "book",
              }]
            },
            {
              model: User,
              as: "user",
            },
          ],
          order: [
            ["created_at", "DESC"],
          ],
        });

      res.json({
        data: assignments,
      });
    }
  ),

  // DELETE /v1/assignments/:id - Desasignar cupón
  unassignCoupon: asyncH(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      throw new HttpError(400, "Assignment ID is required");
    }

    // Buscar la asignación
    const assignment = await CouponAssignment.findByPk(id, {
      include: [
        {
          model: CouponCode,
          as: "code",
        },
        {
          model: User,
          as: "user",
        },
      ],
    });

    if (!assignment) {
      throw new HttpError(404, "Assignment not found");
    }

    if (!assignment.code) {
      throw new HttpError(400, "Coupon code not found for this assignment");
    }

    if (assignment.code.status !== "ASSIGNED") {
      throw new HttpError(400, "Only assigned coupons can be unassigned");
    }

    // Actualizar el cupón para que esté disponible
    await CouponCode.update(
      {
        status: "AVAILABLE",
        assigned_at: null,
      },
      {
        where: { id: assignment.coupon_id },
      }
    );

    // Eliminar la asignación (soft delete)
    await assignment.destroy();

    res.json({
      message: "Coupon unassigned successfully",
      data: {
        assignmentId: id,
        code: assignment.code.code,
        user: assignment.user.name,
      },
    });
  }),
};
