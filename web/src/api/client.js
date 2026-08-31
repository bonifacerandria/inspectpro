import axios from 'axios'
import { useAuthStore } from '../context/authStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    Accept: 'application/json',
  },
})

// Injecte automatiquement le token Sanctum sur chaque requête
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Déconnexion automatique si le token est expiré/invalide (401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().deconnexion()
    }
    return Promise.reject(error)
  }
)

export default apiClient
