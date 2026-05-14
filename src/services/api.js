import axios from 'axios'
import config from '@/config/app'

const api = axios.create({
  baseURL: config.api.url
})

export async function getConversations() {
  const { data } = await api.get('/api/conversations')
  return data.conversations
}

export async function getConversation(id) {
  const { data } = await api.get(`/api/conversations/${id}`)
  return data
}
