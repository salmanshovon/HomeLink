import { apiClient } from './client.js'

export async function getServiceCategories() {
  const response = await apiClient.get('/services/categories/')
  return response.data
}

export async function getServiceRequests(params = {}) {
  const response = await apiClient.get('/services/requests/', { params })
  return response.data
}

export async function createServiceRequest(payload) {
  const response = await apiClient.post('/services/requests/', payload)
  return response.data
}

export async function getServiceRequest(id) {
  const response = await apiClient.get(`/services/requests/${id}/`)
  return response.data
}

export async function updateServiceRequest(id, payload) {
  const response = await apiClient.patch(`/services/requests/${id}/`, payload)
  return response.data
}

export async function submitQuote(id, payload) {
  const response = await apiClient.post(`/services/requests/${id}/quotes/`, payload)
  return response.data
}

export async function scheduleAppointment(id, payload) {
  const response = await apiClient.post(`/services/requests/${id}/appointments/`, payload)
  return response.data
}
