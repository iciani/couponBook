import api from '../axios'

export default {
  // Listar canjes
  list(params = {}) {
    return api.get('/coupon-redemptions', { params })
  },

  // Lock temporal de cupón
  lockCoupon(code) {
    return api.post(`/coupon-redemptions/lock/${code}`)
  },

  // Liberar lock manualmente
  unlockCoupon(code) {
    return api.delete(`/coupon-redemptions/lock/${code}`)
  },

  // Canjear un cupón
  redeem(code) {
    return api.post(`/coupon-redemptions/redeem/${code}`)
  }
}
