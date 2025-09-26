import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import { getActivePinia } from 'pinia'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3009',
  timeout: 10000,
})

api.interceptors.request.use(config => {

  const pinia = getActivePinia()
  if (pinia) {
    const auth = useAuthStore(pinia)
    if (auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`
    }
  }

  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    const currentPath = window.location.pathname
  
    const pinia = getActivePinia()
    if (pinia && error.response?.status === 401) {
      
      const auth = useAuthStore(pinia)
      if (currentPath !== '/login') {
        auth.clearAuth()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default api
