import axios from 'axios'
import supabase from './supabaseClient.js'
import config from '@/config/app'
import { useAuthStore } from '../stores/auth.js'

// # Configuración:
const baseUrl = config.api.url

// # Funciones:

/**
 * Realiza una petición HTTP al backend con el token de sesión adjunto:
 * 1. Adjunta el access_token de Supabase como Bearer en Authorization.
 * 2. Devuelve directamente response.data.
 * 3. Si el backend responde con un status de error, axios lanza una excepción.
 * 4. El error 401 (unauthorized) hace que se cierre la sesión local para que
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

  // ## Documentos:
  static async getDocuments() {
    const data = await get('/api/document')
    return data.documents
  }

  static async getDocumentDownloadUrl(id) {
    return get(`/api/document/${id}/url`)
  }

  /**
   * Sube un archivo al backend.
   *
   * @param {*} file
   * @param {*} options - Campos opcionales (undefined -> null; null -> string de "null", al enviarse t0do como texto en multipart/form-data)
   * @returns
   */
  static async uploadDocument(file, { folder_id, expires_at }) {
    // Construimos el multipart/form-data para poder enviar el archivo binario junto con los campos opcionales
    const formData = new FormData()

    formData.append('file', file)

    // Solo añadimos los campos opcionales si vienen definidos
    // para que el backend los trate como undefined y los ignore
    if (folder_id) formData.append('folder_id', folder_id)
    if (expires_at) formData.append('expires_at', expires_at)

    // axios detecta el FormData y añade el Content-Type con su boundary
    const data = await post('/api/document/file', formData)
    return data.document
  }

  /**
   * Actualiza un documento. Los campos undefined son
   * ignorados por el backend y no se modifican en la BD.
   *
   * @param {*} id
   * @param {*} options - Campos a actualizar (undefined -> no modificar; null -> NULL en BD)
   * @returns
   */
  static async updateDocument(id, { name, folder_id, expires_at }) {
    const data = await patch(`/api/document/${id}`, { name, folder_id, expires_at })
    return data.document
  }

  static async toggleDocumentActive(id, is_active) {
    const data = await patch(`/api/document/${id}/active`, { is_active })
    return data.document
  }

  static async deleteDocument(id) {
    return del(`/api/document/${id}`)
  }

  // ## Configuración:
  static async getConfig() {
    return get('/api/config')
  }

  static async updateConfig({ rate_limit_max, openai_api_key, greeting }) {
    return patch('/api/config', { rate_limit_max, openai_api_key, greeting })
  }

  // ## Carpetas:
  static async getFolders() {
    const data = await get('/api/folder')
    return data.folders
  }

  static async createFolder(name) {
    const data = await post('/api/folder', { name })
    return data.folder
  }

  static async updateFolder(id, name) {
    const data = await patch(`/api/folder/${id}`, { name })
    return data.folder
  }

  // Al borrar una carpeta los documentos que estaban dentro pasan a folder_id = NULL
  static async deleteFolder(id) {
    return del(`/api/folder/${id}`)
  }

  // ## Feedback:
  static async getFeedback() {
    const data = await get('/api/feedback')
    return data.feedback
  }

  static async markFeedbackReviewed(id) {
    const data = await patch(`/api/feedback/${id}/reviewed`)
    return data.feedback
  }
}

export default ApiService
