import api from '../axios'

export default {
  // Obtener todos los books
  getAll() {
    return api.get('/coupon-books')
  },

  // Listar books con filtros
  list(params = {}) {
    return api.get('/coupon-books', { params })
  },

  // Obtener book por ID
  getById(id) {
    return api.get(`/coupon-books/${id}`)
  },

  // Crear nuevo book
  create(data) {
    return api.post('/coupon-books', data)
  },

  // Actualizar book
  update(id, data) {
    return api.patch(`/coupon-books/${id}`, data)
  },

  // Eliminar book
  delete(id) {
    return api.delete(`/coupon-books/${id}`)
  },

  // Pausar book
  pause(id) {
    return api.post(`/coupon-books/${id}/pause`)
  },

  // Archivar book
  archive(id) {
    return api.post(`/coupon-books/${id}/archive`)
  },

  // Reactivar book
  reactivate(id) {
    return api.post(`/coupon-books/${id}/reactivate`)
  }
}
