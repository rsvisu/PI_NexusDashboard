import axios from 'axios'
import supabase from './supabaseClient.js'
import config from '@/config/app'
import { useAuthStore } from '../stores/auth.js'

// # Configuración:
const baseUrl = config.api.url

// # Funciones:

/**
 * Realiza una petición HTTP al backend.
 */
async function request(method, path, body) {
    const headers = {}
    const sessionResponse = await supabase.auth.getSession()
    const session = sessionResponse.data.session

    if (session) {
        headers.Authorization = `Bearer ${session.access_token}`
    }

    const url = baseUrl + path

    try {
        let response
        if (method === 'GET') {
            response = await axios.get(url, { headers })
        } else if (method === 'POST') {
            response = await axios.post(url, body, { headers })
        } else if (method === 'DELETE') {
            response = await axios.delete(url, { headers })
        }
        return response.data
    } catch (error) {
        if (error.response && error.response.status === 401) {
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

function del(path) {
    return request('DELETE', path)
}

// # Servicio:
class ApiService {
    static async getConversations() {
        const data = await get('/api/conversation')
        return data.conversations
    }

    static async getConversation(id) {
        return get(`/api/conversation/${id}`)
    }
}

export default ApiService