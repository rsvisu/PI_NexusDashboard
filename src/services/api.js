import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
})

export async function getConversations() {
  const { data } = await api.get('/api/conversations')
  return data.conversations
}

export async function getConversation(id) {
  const { data } = await api.get(`/api/conversations/${id}`)
  return data
}
