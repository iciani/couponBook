import authResource from '@api/resources/auth.resource'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),

  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)

      this.initAuth()
    },

    clearAuth() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },

    async initAuth() {
      if (!this.token) return

      try {
        const { data: user } = await authResource.getCurrentUser()
        
        this.setUser(user)
      } catch (error) {
        console.warn('Token inválido o expirado')
        this.clearAuth()
      }
    },

    logout(out = false) {
      this.clearAuth()

      if (!out) {
        window.location.href = '/login'
      } else {
        window.location.href = 'https://google.com.ar'
      }
      
    },
  },

  getters: {
    isAuthenticated: state => !!state.token,
  },
})
