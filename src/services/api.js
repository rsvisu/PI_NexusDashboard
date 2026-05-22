import axios from 'axios'
import supabase from './supabaseClient.js'
import config from '@/config/app'
import { useAuthStore } from '../stores/auth.js'

// # Configuración:
const baseUrl = config.api.url

// # Funciones:

/**
 * Realiza una petición HTTP al backend con el token de sesión adjunto:
 *
 * Adjunta el access_token de Supabase como Bearer en Authorization.
 * Devuelve directamente response.data.
 * Si el backend responde con un status de error, axios lanza una excepción.
 * El error 401 (unauthorized) hace que se cierre la sesión local para que
 * el router redirija al login.
 */
async function request(method, path, body) {
  // Cabeceras de la petición; se rellenan abajo si hay sesión
  const headers = {}

  // Recuperamos la sesión actual de Supabase para extraer el access_token
  const sessionResponse = await supabase.auth.getSession()
  const session = sessionResponse.data.session

  if (session) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  const url = baseUrl + path

  try {
    let response
    switch (method) {
      case 'GET':
        response = await axios.get(url, { headers })
        break
      case 'POST':
        response = await axios.post(url, body, { headers })
        break
      case 'PATCH':
        response = await axios.patch(url, body, { headers })
        break
      case 'DELETE':
        response = await axios.delete(url, { headers })
        break
    }
    return response.data
  } catch (error) {
    // Si el error es 401 (unauthorized) cerramos la sesión para redirigir al login
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      await authStore.logout()
    }
    throw error
  }
}

// ## Wrappers:
function get(path) {
  return request('GET', path)
}

function post(path, body) {
  return request('POST', path, body)
}

function patch(path, body) {
  return request('PATCH', path, body)
}

// 'delete' es una palabra reservada, así que lo llamamos 'del'
function del(path) {
  return request('DELETE', path)
}

// # Servicio:
class ApiService {
  // ## Conversaciones:
  static async getConversations() {
    const data = await get('/api/conversation')
    return data.conversations
  }

  static async getConversation(id) {
    return get(`/api/conversation/${id}`)
  }
}

export default ApiService
