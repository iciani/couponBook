import axios from 'axios'

const API_BASE_URL = 'http://localhost:3009'

export default {
  // Obtener información base de la API
  getBaseInfo() {
    return axios.get(`${API_BASE_URL}/`)
  },
  
  // Obtener estado de salud de la API
  getHealth() {
    return axios.get(`${API_BASE_URL}/health`)
  }
}
