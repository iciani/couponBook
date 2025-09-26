"use strict";

const {
  CouponBook,
  CouponCode,
} = require("../models");
const asyncH = require("../utils/asyncH");
const HttpError = require("../utils/HttpError");

module.exports = {
  // GET /v1/coupons
  list: asyncH(async (req, res) => {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    // Obtener todos los books
    const books =
      await CouponBook.findAll({
        where,
        order: [["created_at", "DESC"]],
      });

    // Obtener el conteo de códigos para cada book
    const booksWithCodesCount =
      await Promise.all(
        books.map(async book => {
          const codesCount =
            await CouponCode.count({
              where: {
                book_id: book.id,
              },
            });

          return {
            ...book.toJSON(),
            codes_count: codesCount,
          };
        })
      );

    res.json({
      data: booksWithCodesCount,
    });
  }),

  // GET /v1/coupons/:id
  get: asyncH(async (req, res) => {
    const book =
      await CouponBook.findByPk(
        req.params.id
      );

    if (!book) {
      throw new HttpError(
        404,
        "CouponBook not found"
      );
    }

    res.json({ data: book });
  }),

  // POST /v1/coupons
  create: asyncH(async (req, res) => {
    const created = await CouponBook.create({
      ...req.body,
      status: "ACTIVE", // Siempre activo por defecto
    });

    res.status(201).json({ data: created });
  }),

  // PATCH /v1/coupons/:id
  update: asyncH(async (req, res) => {
    const book = await CouponBook.findByPk(req.params.id);

    if (!book) {
      throw new HttpError(404, "CouponBook not found");
    }

    await book.update(req.body);

    res.json({ data: book });
  }),

  // POST /v1/coupons/:id/pause
  pause: asyncH(async (req, res) => {
    const book =
      await CouponBook.findByPk(
        req.params.id
      );

    if (!book) {
      throw new HttpError(
        404,
        "CouponBook not found"
      );
    }

    if (book.status === "ARCHIVED") {
      throw new HttpError(
        409,
        "Archived books cannot be paused"
      );
    }

    await book.update({
      status: "PAUSED",
    });

    res.json({ data: book });
  }),

  // POST /v1/coupons/:id/archive
  archive: asyncH(async (req, res) => {
    const book =
      await CouponBook.findByPk(
        req.params.id
      );

    if (!book) {
      throw new HttpError(
        404,
        "CouponBook not found"
      );
    }

    await book.update({
      status: "ARCHIVED",
    });

    res.json({ data: book });
  }),

  // POST /v1/coupons/:id/reactivate
  reactivate: asyncH(async (req, res) => {
    const book =
      await CouponBook.findByPk(
        req.params.id
      );

    if (!book) {
      throw new HttpError(
        404,
        "CouponBook not found"
      );
    }

    if (book.status === "ARCHIVED") {
      throw new HttpError(
        409,
        "Archived books cannot be reactivated"
      );
    }

    await book.update({
      status: "ACTIVE",
    });

    res.json({ data: book });
  }),

  // POST /v1/coupons/:id/codes
  enqueueCodesJob: asyncH(
    async (req, res) => {
      const book =
        await CouponBook.findByPk(
          req.params.id
        );

      if (!book) {
        throw new HttpError(
          404,
          "CouponBook not found"
        );
      }

      if (book.status === "ARCHIVED") {
        throw new HttpError(
          409,
          "Cannot add codes to archived book"
        );
      }

      const {
        uploadType,
        fileUrl,
        total,
        pattern,
      } = req.body;

      const job = {
        id: `job_${Date.now()}`,
        bookId: book.id,
        type: uploadType, // "csv" | "generate"
        params:
          uploadType === "csv"
            ? { fileUrl }
            : {
                total,
                pattern:
                  pattern ||
                  book.code_pattern,
              },
        status: "QUEUED",
      };

      res.status(202).json({ job });
    }
  ),

};
