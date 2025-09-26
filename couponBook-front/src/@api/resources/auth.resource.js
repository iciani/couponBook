import api from '../axios'

export default {
  login(payload) {
    // payload = { email, password }
    return api.post('/auth/login', payload)
  },

  getCurrentUser() {
    return api.get('/auth/me')
  },
}
