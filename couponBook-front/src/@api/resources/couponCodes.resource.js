import api from '../axios'

export default {
  // Obtener todos los códigos de cupones
  getAll() {
    return api.get('/coupon-codes')
  },

  // Listar códigos con filtros
  list(params = {}) {
    return api.get('/coupon-codes', { params })
  },

  // Obtener código por ID
  getById(id) {
    return api.get(`/coupon-codes/${id}`)
  },

  // Deshabilitar código
  disable(id) {
    return api.patch(`/coupon-codes/${id}/disable`)
  },

  // Habilitar código
  enable(id) {
    return api.patch(`/coupon-codes/${id}/enable`)
  },

  // Generar códigos para un book
  generateCodes(data) {
    return api.post('/coupon-codes/generate', data)
  },

  // Consultar estado de un job
  getJobStatus(jobId) {
    return api.get(`/coupon-codes/job/${jobId}`)
  },

  // Listar jobs
  listJobs(params = {}) {
    return api.get('/coupon-codes/jobs', { params })
  }
}
