import { apiClient } from './client.js'

export async function getMyTenancies(params = {}) {
  const response = await apiClient.get('/tenancies/', { params })
  return response.data
}

export async function getMyRentalRequirements(params = {}) {
  const response = await apiClient.get('/rental-requirements/', { params })
  return response.data
}

export async function createRentalRequirement(payload) {
  const response = await apiClient.post('/rental-requirements/', payload)
  return response.data
}

export async function getMyViewings(params = {}) {
  const response = await apiClient.get('/viewings/', { params })
  return response.data
}

export async function getMyApplications(params = {}) {
  const response = await apiClient.get('/applications/', { params })
  return response.data
}

export async function getMyInvoices(params = {}) {
  const response = await apiClient.get('/billing/invoices/', { params })
  return response.data
}

export async function getMyBills(params = {}) {
  const response = await apiClient.get('/billing/bills/', { params })
  return response.data
}

export async function getMyPayments(params = {}) {
  const response = await apiClient.get('/billing/payments/', { params })
  return response.data
}

export async function getMyComplaints(params = {}) {
  const response = await apiClient.get('/complaints/', { params })
  return response.data
}

export async function createComplaint(payload) {
  const response = await apiClient.post('/complaints/', payload)
  return response.data
}

export async function getMyConversations(params = {}) {
  const response = await apiClient.get('/conversations/', { params })
  return response.data
}

export async function getMyNotifications(params = {}) {
  const response = await apiClient.get('/notifications/', { params })
  return response.data
}

export async function markNotificationRead(id) {
  const response = await apiClient.post(`/notifications/${id}/read/`)
  return response.data
}

export async function markAllNotificationsRead() {
  const response = await apiClient.post('/notifications/read-all/')
  return response.data
}
