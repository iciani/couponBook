import api from '../axios'

export default {
  // Obtener estadísticas generales
  getStats() {
    return api.get('/bull-monitor/stats')
  },

  // Obtener lista de jobs
  getJobs(params = {}) {
    return api.get('/bull-monitor/jobs', { params })
  },

  // Obtener detalles de un job específico
  getJobDetails(jobId) {
    return api.get(`/bull-monitor/job/${jobId}`)
  },

  // Pausar un job
  pauseJob(jobId) {
    return api.post(`/bull-monitor/job/${jobId}/pause`)
  },

  // Reanudar un job
  resumeJob(jobId) {
    return api.post(`/bull-monitor/job/${jobId}/resume`)
  },

  // Reintentar un job
  retryJob(jobId) {
    return api.post(`/bull-monitor/job/${jobId}/retry`)
  },

  // Limpiar todos los jobs
  clearAllJobs() {
    return api.delete('/bull-monitor/clear-all')
  }
}
