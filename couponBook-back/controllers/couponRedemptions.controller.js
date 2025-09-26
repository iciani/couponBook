"use strict";

const {
  CouponRedemption,
  CouponCode,
  CouponBook,
  CouponAssignment,
  User,
  sequelize,
} = require("../models");
const asyncH = require("../utils/asyncH");
const HttpError = require("../utils/HttpError");
const redis = require("../lib/redis");

module.exports = {

  // POST /v1/redemptions/lock/:code - Lock temporal de cupón
  lockCoupon: asyncH(async (req, res) => {
    const { code } = req.params;
    const lockDuration = 180; // 3 minutos en segundos
    const lockKey = `coupon_lock:${code}`;

    try {

      const existingLock = await redis.get(lockKey);
      if (existingLock) {
        const lockData = JSON.parse(existingLock);
        throw new HttpError(409, `El cupón ya está bloqueado por otro usuario (${lockData.userName}) y expira en ${Math.ceil((new Date(lockData.expiresAt) - new Date()) / 1000 / 60)} minutos`);
      }

      // Buscar el cupón
      const coupon = await CouponCode.findOne({
        where: { code: code },
        paranoid: false
      });

      if (!coupon) {
        throw new HttpError(404, "Coupon not found");
      }

      if (coupon.status !== 'ASSIGNED') {
        throw new HttpError(400, `Coupon is not assigned. Current status: ${coupon.status}`);
      }

      // Obtener la asignación activa del cupón
      const assignment = await CouponAssignment.findOne({
        where: {
          coupon_id: coupon.id
        },
        include: [{
          model: User,
          as: "user",
          paranoid: false
        }],
        paranoid: false
      });

      if (!assignment) {
        throw new HttpError(400, "This coupon is not assigned to any user");
      }

      const user = assignment.user;

      const book = await CouponBook.findByPk(coupon.book_id, {
        paranoid: false
      });

      if (!user) {
        throw new HttpError(404, "Assigned user not found");
      }

      if (!book) {
        throw new HttpError(404, "Book not found");
      }

      // Verificar límites de redención
      if (!book.allow_multiple_redemptions_per_user) {
        // Si no permite múltiples redenciones, verificar que no haya sido canjeado
        const existingRedemption = await CouponRedemption.findOne({
          where: {
            coupon_id: coupon.id
          },
          include: [{
            model: CouponAssignment,
            as: "assignment",
            where: {
              user_id: user.id
            },
            required: true
          }],
          paranoid: false
        });

        // Verificar si la redención pertenece al usuario actual
        if (existingRedemption) {
          const assignment = await CouponAssignment.findOne({
            where: {
              id: existingRedemption.assignment_id,
              user_id: user.id
            }
          });
          
          if (assignment) {
            throw new HttpError(400, "This coupon has already been redeemed");
          }
        }
      } else if (book.per_user_max_redemptions != null) {
        // Si permite múltiples redenciones pero tiene límite, verificar que no haya excedido el límite
        const redemptions = await CouponRedemption.findAll({
          where: {
            coupon_id: coupon.id
          },
          paranoid: false
        });

        // Contar solo las redenciones del usuario actual
        let redemptionCount = 0;
        for (const redemption of redemptions) {
          const assignment = await CouponAssignment.findOne({
            where: {
              id: redemption.assignment_id,
              user_id: user.id
            }
          });
          
          if (assignment) {
            redemptionCount++;
          }
        }

        if (redemptionCount >= book.per_user_max_redemptions) {
          throw new HttpError(400, `Maximum redemptions limit reached for this coupon. Limit: ${book.per_user_max_redemptions}, Current: ${redemptionCount}`);
        }
      }

      // Crear el lock temporal en Redis
      const lockData = {
        couponId: coupon.id,
        code: coupon.code,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        bookName: book.name,
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + lockDuration * 1000).toISOString()
      };

      await redis.setex(lockKey, lockDuration, JSON.stringify(lockData));

      res.json({
        message: "Coupon locked successfully",
        data: {
          locked: true,
          coupon: {
            id: coupon.id,
            code: coupon.code,
            book: {
              id: book.id,
              name: book.name
            },
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            }
          },
          lock: {
            expiresIn: lockDuration,
            expiresAt: lockData.expiresAt
          }
        }
      });

    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      console.error('Error locking coupon:', error);
      throw new HttpError(500, 'Error locking coupon');
    }
  }),

  // DELETE /v1/redemptions/lock/:code - Liberar lock manualmente
  unlockCoupon: asyncH(async (req, res) => {
    const { code } = req.params;
    const lockKey = `coupon_lock:${code}`;

    try {
      const lockData = await redis.get(lockKey);
      if (!lockData) {
        throw new HttpError(404, "No active lock found for this coupon");
      }

      await redis.del(lockKey);

      res.json({
        message: "Coupon lock released successfully",
        data: {
          released: true,
          code: code
        }
      });

    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      console.error('Error unlocking coupon:', error);
      throw new HttpError(500, 'Error unlocking coupon');
    }
  }),

  // POST /v1/redemptions/redeem/:code - Canjear un cupón
  redeem: asyncH(async (req, res) => {
    const { code } = req.params;
    const lockKey = `coupon_lock:${code}`;

    try {
      // 1. Verificar que el cupón esté bloqueado en Redis
      const lockData = await redis.get(lockKey);
      if (!lockData) {
        throw new HttpError(400, "Coupon is not locked. Please lock it first.");
      }

      const parsedLockData = JSON.parse(lockData);
      const userId = parsedLockData.userId;

      // Verificar que el lock no haya expirado
      const now = new Date();
      const expiresAt = new Date(parsedLockData.expiresAt);
      if (now > expiresAt) {
        await redis.del(lockKey);
        throw new HttpError(400, "Coupon lock has expired. Please lock the coupon again.");
      }

      // 2. Una sola consulta: obtener cupón con assignment y book
      const coupon = await CouponCode.findOne({
        where: { code: code },
        include: [{
          model: CouponAssignment,
          as: "assignments",
          where: { user_id: userId },
          required: true,
          include: [{
            model: User,
            as: "user",
            attributes: ['id', 'name', 'email']
          }]
        }, {
          model: CouponBook,
          as: "book",
          attributes: ['id', 'name', 'allow_multiple_redemptions_per_user', 'per_user_max_redemptions']
        }],
        paranoid: false
      });

      if (!coupon) {
        await redis.del(lockKey);
        throw new HttpError(404, "Coupon not found");
      }

      if (!coupon.assignments || coupon.assignments.length === 0) {
        await redis.del(lockKey);
        throw new HttpError(400, "Coupon is not assigned to this user");
      }

      const assignment = coupon.assignments[0];
      const book = coupon.book;

      // 3. Verificar estado del cupón
      const validStatuses = ['ASSIGNED', 'TEMP_LOCKED'];
      if (book.allow_multiple_redemptions_per_user && coupon.status === 'REDEEMED') {
        // Si permite múltiples redenciones, verificar límite
        if (book.per_user_max_redemptions != null) {
          const redemptionCount = await CouponRedemption.count({
            where: { coupon_id: coupon.id },
            include: [{
              model: CouponAssignment,
              as: "assignment",
              where: { user_id: userId },
              required: true
            }],
            paranoid: false
          });

          if (redemptionCount >= book.per_user_max_redemptions) {
            await redis.del(lockKey);
            throw new HttpError(400, `Maximum redemptions limit reached. Limit: ${book.per_user_max_redemptions}, Current: ${redemptionCount}`);
          }
        }
        validStatuses.push('REDEEMED');
      }

      if (!validStatuses.includes(coupon.status)) {
        await redis.del(lockKey);
        throw new HttpError(400, `Coupon is not available for redemption. Current status: ${coupon.status}`);
      }

      // 4. Crear la redención y actualizar estado en una transacción
      const transaction = await sequelize.transaction();
      
      try {
        const redemption = await CouponRedemption.create({
          coupon_id: coupon.id,
          assignment_id: assignment.id,
          redeemed_at: new Date(),
        }, { transaction });

        await CouponCode.update(
          {
            status: 'REDEEMED',
            used_at: new Date(),
          },
          {
            where: { id: coupon.id },
            transaction
          }
        );

        await transaction.commit();

        // 5. Eliminar el lock
        await redis.del(lockKey);

        res.json({
          message: "Coupon redeemed successfully",
          data: {
            redemption: {
              id: redemption.id,
              coupon_code: coupon.code,
              book_name: book.name,
              user: {
                id: assignment.user.id,
                name: assignment.user.name,
                email: assignment.user.email
              },
              status: 'REDEEMED',
              redeemed_at: redemption.redeemed_at
            }
          }
        });

      } catch (transactionError) {
        await transaction.rollback();
        await redis.del(lockKey);
        throw transactionError;
      }

    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      
      throw new HttpError(500, 'Error redeeming coupon');
    }
  }),

  // GET /v1/redemptions - Listar canjes
  list: asyncH(async (req, res) => {
    const { 
      page = 1, 
      limit = 20,
      status,
      userId,
      bookId
    } = req.query;

    const where = {};
    if (status) { where.status = status; }
    
    // Para userId y bookId, necesitamos usar includes
    const include = [];
    if (userId) {
      include.push({
        model: CouponAssignment,
        where: { user_id: userId },
        required: true
      });
    }
    if (bookId) {
      include.push({
        model: CouponCode,
        where: { book_id: bookId },
        required: true
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    try {
      const totalCount = await CouponRedemption.count({ 
        where
      });
      
      const redemptions = await CouponRedemption.findAll({
        where,
        order: [["redeemed_at", "DESC"]],
        limit: limitInt,
        offset: offset,
        include: [
          {
            model: CouponCode,
            as: 'couponCode',
            attributes: ['code'],
            include: [{
              model: CouponBook,
              as: 'book',
              attributes: ['name']
            }]
          },
          {
            model: CouponAssignment,
            as: 'assignment',
            attributes: ['id', 'user_id', 'assigned_at'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['name', 'email']
            }]
          }
        ]
      });

      const totalPages = Math.ceil(totalCount / limitInt);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      // Mapear los datos para el frontend
      const mappedRedemptions = redemptions.map(redemption => ({
        ...redemption.toJSON(),
        user: redemption.assignment?.user || null,
        coupon_code: redemption.couponCode?.code || null,
        book_name: redemption.couponCode?.book?.name || null,
        status: 'REDEEMED'
      }));

      res.json({
        data: mappedRedemptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: limitInt,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? parseInt(page) + 1 : null,
          prevPage: hasPrevPage ? parseInt(page) - 1 : null
        }
      });
    } catch (error) {
      console.error('Error listing redemptions:', error);
      throw new HttpError(500, 'Error listing redemptions');
    }
  }),
};
