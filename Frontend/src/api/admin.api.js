import { apiClient } from './client.js'

// Dashboard metrics
export async function adminDashboardMetrics() {
  const response = await apiClient.get('/admin/dashboard/metrics/')
  return response.data
}

// Admin user management
export async function adminListUsers(params = {}) {
  const response = await apiClient.get('/admin/users/', { params })
  return response.data
}

export async function adminGetUser(userId) {
  const response = await apiClient.get(`/admin/users/${userId}/`)
  return response.data
}

export async function adminUpdateUser(userId, payload) {
  const response = await apiClient.patch(`/admin/users/${userId}/`, payload)
  return response.data
}

export async function adminChangeUserStatus(userId, accountStatus) {
  const response = await apiClient.patch(`/admin/users/${userId}/status/`, {
    account_status: accountStatus,
  })
  return response.data
}

export async function adminAssignRole(userId, role) {
  const response = await apiClient.post(`/admin/users/${userId}/roles/assign/`, { role })
  return response.data
}

export async function adminRemoveRole(userId, role) {
  const response = await apiClient.post(`/admin/users/${userId}/roles/remove/`, { role })
  return response.data
}

export async function adminCreateEmployee(payload) {
  const response = await apiClient.post('/admin/employees/create/', payload)
  return response.data
}

export async function adminCreateAddress(userId, payload) {
  const response = await apiClient.post(`/admin/users/${userId}/addresses/`, payload)
  return response.data
}

export async function adminUpdateAddress(userId, addressId, payload) {
  const response = await apiClient.patch(`/admin/users/${userId}/addresses/${addressId}/`, payload)
  return response.data
}

export async function adminDeleteAddress(userId, addressId) {
  const response = await apiClient.delete(`/admin/users/${userId}/addresses/${addressId}/`)
  return response.data
}
