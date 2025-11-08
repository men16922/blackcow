import axios from 'axios'

const API_BASE_URL = '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const analyzeProduct = async (url: string) => {
  const response = await apiClient.post('/analyze', { url })
  return response.data
}

export const getAlternatives = async (productName: string) => {
  const response = await apiClient.get('/alternatives', {
    params: { productName },
  })
  return response.data
}

export default apiClient
