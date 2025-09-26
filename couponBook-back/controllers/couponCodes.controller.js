"use strict";

const {
  CouponCode,
  CouponBook,
} = require("../models");
const asyncH = require("../utils/asyncH");
const HttpError = require("../utils/HttpError");
const { codeGenerationQueue } = require("../lib/queue");
const { Sequelize, Op } = require("sequelize");

module.exports = {
  // GET /v1/codes?bookId=1&status=AVAILABLE&page=1&limit=20
  list: asyncH(async (req, res) => {
    const { 
      bookId, 
      status, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    const where = {};

    if (bookId) {
      where.book_id = bookId;
    }

    if (status) {
      where.status = status;
    }

    // Búsqueda por código (coincidencia exacta)
    if (search) {
      where.code = {
        [Op.iLike]: search
      };
    }

    // Calcular offset para la paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Obtener el total de registros para la paginación
    const totalCount = await CouponCode.count({ where });

    // Obtener los códigos con paginación
    const codes = await CouponCode.findAll({
      where,
      order: [["created_at", "DESC"]],
      limit: limitInt,
      offset: offset,
      include: [
        {
          model: CouponBook,
          as: 'book',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(totalCount / limitInt);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      data: codes,
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
  }),

  // GET /v1/codes/:id
  get: asyncH(async (req, res) => {
    const code =
      await CouponCode.findByPk(
        req.params.id
      );

    if (!code) {
      throw new HttpError(
        404,
        "CouponCode not found"
      );
    }

    res.json({ data: code });
  }),

  // PATCH /v1/codes/:id/disable
  disable: asyncH(async (req, res) => {
    const code =
      await CouponCode.findByPk(
        req.params.id
      );

    if (!code) {
      throw new HttpError(
        404,
        "CouponCode not found"
      );
    }

    if (code.status === "REDEEMED") {
      throw new HttpError(
        409,
        "Cannot disable a redeemed code"
      );
    }

    await code.update({
      status: "DISABLED",
    });

    res.json({ data: code });
  }),

  // PATCH /v1/codes/:id/enable
  enable: asyncH(async (req, res) => {
    const code =
      await CouponCode.findByPk(
        req.params.id
      );

    if (!code) {
      throw new HttpError(
        404,
        "CouponCode not found"
      );
    }

    if (code.status !== "DISABLED") {
      throw new HttpError(
        409,
        "Only disabled codes can be re-enabled"
      );
    }

    await code.update({
      status: "AVAILABLE",
    });

    res.json({ data: code });
  }),

  // POST /v1/codes/generate
  generateCodes: asyncH(async (req, res) => {
    const { bookId, quantity, pattern, useQueue = true } = req.body;

    if (!bookId || !quantity) {
      throw new HttpError(
        400,
        "bookId and quantity are required"
      );
    }

    if (quantity <= 0) {
      throw new HttpError(
        400,
        "Quantity must be greater than 0"
      );
    }

    // Verificar que el book existe
    const book = await CouponBook.findByPk(bookId);
    if (!book) {
      throw new HttpError(
        404,
        "CouponBook not found"
      );
    }

    if (book.status === "ARCHIVED") {
      throw new HttpError(
        409,
        "Cannot generate codes for archived book"
      );
    }

    // Verificar límite de códigos
    const existingCodesCount = await CouponCode.count({
      where: { book_id: bookId }
    });

    const maxCodes = book.total_codes || Infinity;
    if (existingCodesCount + quantity > maxCodes) {
      throw new HttpError(
        409,
        `Cannot generate ${quantity} codes. Maximum allowed: ${maxCodes}, existing: ${existingCodesCount}`
      );
    }

    const codePattern = pattern || book.code_pattern || "CODE-####$$$$****";

    if (useQueue) {
      const job = await codeGenerationQueue.add('generate-codes', {
        bookId,
        quantity,
        pattern: codePattern,
        batchSize: Math.min(1000, Math.max(100, Math.floor(quantity / 10))), // Ajustar tamaño de lote
      }, {
        priority: quantity > 10000 ? 1 : 5, // Prioridad más alta para cantidades muy grandes
      });

      res.status(202).json({
        message: `Job encolado para generar ${quantity} códigos en segundo plano`,
        data: {
          jobId: job.id,
          bookId,
          quantity,
          pattern: codePattern,
          status: 'queued',
          estimatedTime: Math.ceil(quantity / 1000) * 30, // Estimación aproximada en segundos
        }
      });
    }
  }),

  // GET /v1/codes/job/:jobId
  getJobStatus: asyncH(async (req, res) => {
    const { jobId } = req.params;

    try {
      const job = await codeGenerationQueue.getJob(jobId);
      
      if (!job) {
        throw new HttpError(404, "Job not found");
      }

      const state = await job.getState();
      const progress = job.progress();
      const returnValue = job.returnvalue;
      const failedReason = job.failedReason;

      res.json({
        data: {
          jobId: job.id,
          state,
          progress,
          data: job.data,
          returnValue,
          failedReason,
          createdAt: new Date(job.timestamp),
          processedAt: job.processedOn ? new Date(job.processedOn) : null,
          finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        }
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, "Error retrieving job status");
    }
  }),

  // GET /v1/codes/jobs
  listJobs: asyncH(async (req, res) => {
    const { status = 'all', limit = 10, offset = 0 } = req.query;
    
    try {
      let jobs;
      
      switch (status) {
        case 'waiting':
          jobs = await codeGenerationQueue.getWaiting(offset, offset + parseInt(limit) - 1);
          break;
        case 'active':
          jobs = await codeGenerationQueue.getActive(offset, offset + parseInt(limit) - 1);
          break;
        case 'completed':
          jobs = await codeGenerationQueue.getCompleted(offset, offset + parseInt(limit) - 1);
          break;
        case 'failed':
          jobs = await codeGenerationQueue.getFailed(offset, offset + parseInt(limit) - 1);
          break;
        default:
          // Obtener jobs de todos los estados
          const [waiting, active, completed, failed] = await Promise.all([
            codeGenerationQueue.getWaiting(0, 4),
            codeGenerationQueue.getActive(0, 4),
            codeGenerationQueue.getCompleted(0, 4),
            codeGenerationQueue.getFailed(0, 4),
          ]);
          jobs = [...waiting, ...active, ...completed, ...failed];
      }

      const jobsWithState = await Promise.all(
        jobs.map(async (job) => {
          const state = await job.getState();
          const progress = job.progress();
          return {
            jobId: job.id,
            state,
            progress,
            data: job.data,
            createdAt: new Date(job.timestamp),
            processedAt: job.processedOn ? new Date(job.processedOn) : null,
            finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
          };
        })
      );

      res.json({
        data: jobsWithState,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: jobsWithState.length,
        }
      });
    } catch (error) {
      throw new HttpError(500, "Error retrieving jobs");
    }
  }),

};

// Función auxiliar para generar códigos basados en patrón
function generateCodeFromPattern(pattern) {
  return pattern.replace(/#/g, () => Math.floor(Math.random() * 10))
                .replace(/\$/g, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
                .replace(/\*/g, () => String.fromCharCode(97 + Math.floor(Math.random() * 26)));
}
