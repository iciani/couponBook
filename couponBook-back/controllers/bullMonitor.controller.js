
"use strict";

const { codeGenerationQueue } = require("../lib/queue");
const { CouponBook } = require("../models");
const asyncH = require("../utils/asyncH");
const HttpError = require("../utils/HttpError");

module.exports = {
  // GET /v1/bull-monitor/stats
  getStats: asyncH(async (req, res) => {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        codeGenerationQueue.getWaiting(),
        codeGenerationQueue.getActive(),
        codeGenerationQueue.getCompleted(),
        codeGenerationQueue.getFailed(),
        codeGenerationQueue.getDelayed(),
      ]);

      const stats = {
        totalJobs: waiting.length + active.length + completed.length + failed.length + delayed.length,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        queues: [
          {
            name: "code generation",
            displayName: "Generación de Códigos",
            stats: {
              waiting: waiting.length,
              active: active.length,
              completed: completed.length,
              failed: failed.length,
              delayed: delayed.length,
            }
          }
        ]
      };

      res.json({ data: stats });
    } catch (error) {
      console.error("Error getting Bull stats:", error);
      throw new HttpError(500, "Error retrieving queue statistics");
    }
  }),

  // GET /v1/bull-monitor/jobs
  getJobs: asyncH(async (req, res) => {
    try {
      const { status = 'all', limit = 50, offset = 0 } = req.query;
      
      let jobs = [];
      
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
        case 'delayed':
          jobs = await codeGenerationQueue.getDelayed(offset, offset + parseInt(limit) - 1);
          break;
        default:
          // Obtener jobs de todos los estados
          const [waiting, active, completed, failed, delayed] = await Promise.all([
            codeGenerationQueue.getWaiting(0, 9),
            codeGenerationQueue.getActive(0, 9),
            codeGenerationQueue.getCompleted(0, 9),
            codeGenerationQueue.getFailed(0, 9),
            codeGenerationQueue.getDelayed(0, 9),
          ]);
          jobs = [...waiting, ...active, ...completed, ...failed, ...delayed];
      }

      // Procesar jobs para incluir información adicional
      const jobsWithDetails = await Promise.all(
        jobs.map(async (job) => {
          const state = await job.getState();
          const progress = job.progress();
          const returnValue = job.returnvalue;
          const failedReason = job.failedReason;

          // Obtener información del book
          let bookInfo = null;
          if (job.data && job.data.bookId) {
            try {
              // Convertir bookId a número si es necesario
              const bookId = parseInt(job.data.bookId);
              const book = await CouponBook.findByPk(bookId, {
                attributes: ['id', 'name', 'description', 'code_pattern', 'total_codes']
              });
              if (book) {
                bookInfo = {
                  id: book.id,
                  name: book.name,
                  description: book.description,
                  code_pattern: book.code_pattern,
                  total_codes: book.total_codes
                };
              }
            } catch (error) {
              console.error(`Error fetching book info for job ${job.id}:`, error);
            }
          }

          return {
            id: job.id,
            queue: 'code generation',
            status: state,
            progress: progress,
            data: {
              ...job.data,
              bookInfo: bookInfo
            },
            returnValue: returnValue,
            failedReason: failedReason,
            createdAt: new Date(job.timestamp),
            processedAt: job.processedOn ? new Date(job.processedOn) : null,
            finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
            attempts: job.attemptsMade,
            maxAttempts: job.opts.attempts || 1,
            delay: job.opts.delay || 0,
            priority: job.opts.priority || 0,
          };
        })
      );

      // Ordenar por fecha de creación (más recientes primero)
      jobsWithDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({
        data: jobsWithDetails,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: jobsWithDetails.length,
        }
      });
    } catch (error) {
      console.error("Error getting jobs:", error);
      throw new HttpError(500, "Error retrieving jobs");
    }
  }),

  // GET /v1/bull-monitor/job/:id
  getJobDetails: asyncH(async (req, res) => {
    try {
      const { id } = req.params;
      const job = await codeGenerationQueue.getJob(id);
      
      if (!job) {
        throw new HttpError(404, "Job not found");
      }

      const state = await job.getState();
      const progress = job.progress();
      const returnValue = job.returnvalue;
      const failedReason = job.failedReason;

      // Obtener información del book
      let bookInfo = null;
      if (job.data && job.data.bookId) {
        try {
          // Convertir bookId a número si es necesario
          const bookId = parseInt(job.data.bookId);
          const book = await CouponBook.findByPk(bookId, {
            attributes: ['id', 'name', 'description', 'code_pattern', 'total_codes']
          });
          if (book) {
            bookInfo = {
              id: book.id,
              name: book.name,
              description: book.description,
              code_pattern: book.code_pattern,
              total_codes: book.total_codes
            };
          }
        } catch (error) {
          console.error(`Error fetching book info for job ${job.id}:`, error);
        }
      }

      const jobDetails = {
        id: job.id,
        queue: 'code generation',
        status: state,
        progress: progress,
        data: {
          ...job.data,
          bookInfo: bookInfo
        },
        returnValue: returnValue,
        failedReason: failedReason,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts || 1,
        delay: job.opts.delay || 0,
        priority: job.opts.priority || 0,
        logs: job.log || [],
      };

      res.json({ data: jobDetails });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      console.error("Error getting job details:", error);
      throw new HttpError(500, "Error retrieving job details");
    }
  }),

  // POST /v1/bull-monitor/job/:id/pause
  pauseJob: asyncH(async (req, res) => {
    try {
      const { id } = req.params;
      const job = await codeGenerationQueue.getJob(id);
      
      if (!job) {
        throw new HttpError(404, "Job not found");
      }

      // Pausar el job (si está en estado waiting o delayed)
      const state = await job.getState();
      if (state === 'waiting' || state === 'delayed') {
        await job.remove();
        res.json({ message: "Job paused successfully", data: { id, status: 'paused' } });
      } else {
        throw new HttpError(400, "Job cannot be paused in current state");
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      console.error("Error pausing job:", error);
      throw new HttpError(500, "Error pausing job");
    }
  }),

  // POST /v1/bull-monitor/job/:id/resume
  resumeJob: asyncH(async (req, res) => {
    try {
      const { id } = req.params;
      const job = await codeGenerationQueue.getJob(id);
      
      if (!job) {
        throw new HttpError(404, "Job not found");
      }

      // Reanudar el job (reagregarlo a la cola)
      const state = await job.getState();
      if (state === 'paused' || state === 'failed') {
        // Reagregar el job a la cola
        await codeGenerationQueue.add('generate-codes', job.data, {
          priority: job.opts.priority || 0,
          delay: job.opts.delay || 0,
          attempts: job.opts.attempts || 1,
        });
        
        res.json({ message: "Job resumed successfully", data: { id, status: 'waiting' } });
      } else {
        throw new HttpError(400, "Job cannot be resumed in current state");
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      console.error("Error resuming job:", error);
      throw new HttpError(500, "Error resuming job");
    }
  }),

  // POST /v1/bull-monitor/job/:id/retry
  retryJob: asyncH(async (req, res) => {
    try {
      const { id } = req.params;
      const job = await codeGenerationQueue.getJob(id);
      
      if (!job) {
        throw new HttpError(404, "Job not found");
      }

      const state = await job.getState();
      if (state === 'failed') {
        // Reintentar el job
        await job.retry();
        res.json({ message: "Job retried successfully", data: { id, status: 'waiting' } });
      } else {
        throw new HttpError(400, "Job can only be retried if it failed");
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      console.error("Error retrying job:", error);
      throw new HttpError(500, "Error retrying job");
    }
  }),

  // DELETE /v1/bull-monitor/job/:id
  deleteJob: asyncH(async (req, res) => {
    try {
      const { id } = req.params;
      const job = await codeGenerationQueue.getJob(id);
      
      if (!job) {
        throw new HttpError(404, "Job not found");
      }

      // Eliminar el job
      await job.remove();
      res.json({ message: "Job deleted successfully", data: { id } });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      console.error("Error deleting job:", error);
      throw new HttpError(500, "Error deleting job");
    }
  }),

  // DELETE /v1/bull-monitor/clear-all
  clearAllJobs: asyncH(async (req, res) => {
    try {
      // Obtener todos los jobs de todos los estados
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        codeGenerationQueue.getWaiting(),
        codeGenerationQueue.getActive(),
        codeGenerationQueue.getCompleted(),
        codeGenerationQueue.getFailed(),
        codeGenerationQueue.getDelayed(),
      ]);

      const allJobs = [...waiting, ...active, ...completed, ...failed, ...delayed];
      
      // Eliminar todos los jobs
      const deletePromises = allJobs.map(job => job.remove());
      await Promise.all(deletePromises);

      // Limpiar la cola completamente
      await codeGenerationQueue.obliterate({ force: true });

      res.json({ 
        message: "All jobs cleared successfully", 
        data: { 
          deletedCount: allJobs.length,
          clearedQueues: ['code generation']
        } 
      });
    } catch (error) {
      console.error("Error clearing all jobs:", error);
      throw new HttpError(500, "Error clearing all jobs");
    }
  }),

};
