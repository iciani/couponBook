import api from '../axios'

export default {
  // Obtener todos los usuarios
  getAll() {
    return api.get('/users')
  },
  
  // Crear nuevo usuario
  createUser(data) {
    return api.post('/users', data)
  },
  
  // Obtener usuario por ID
  getUserById(id) { 
    return api.get(`/users/${id}`)
  },
  
  // Actualizar usuario
  updateUser(id, data) {
    return api.put(`/users/${id}`, data)
  },
  
  // Eliminar usuario
  deleteUser(id) {
    return api.delete(`/users/${id}`)
  }
}
