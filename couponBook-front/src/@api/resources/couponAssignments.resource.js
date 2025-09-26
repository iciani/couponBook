import api from '../axios'

export default {
  // Obtener todas las asignaciones
  getAll(params = {}) {
    return api.get('/coupon-assignments', { params })
  },

  // Obtener asignaciones de un usuario específico
  getUserAssignments(userId) {
    return api.get(`/coupon-assignments/user/${userId}`)
  },

  // Asignar cupones aleatorios
  assignRandomCoupons(data) {
    return api.post('/coupon-assignments/random', data)
  },

  // Asignar cupón específico
  assignSpecificCoupon(data) {
    return api.post('/coupon-assignments/specific', data)
  },

  // Desasignar cupón
  unassignCoupon(assignmentId) {
    return api.delete(`/coupon-assignments/${assignmentId}`)
  },

  // Obtener estadísticas de asignaciones
  getStats() {
    return api.get('/coupon-assignments/stats')
  }
}