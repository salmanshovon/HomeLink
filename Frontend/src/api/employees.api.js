import { apiClient } from './client.js'

export async function getAllProperties(params = {}) {
  const response = await apiClient.get('/employee/properties/', { params })
  return response.data
}

export async function createProperty(payload) {
  const response = await apiClient.post('/employee/properties/', payload)
  return response.data
}

export async function verifyProperty(id) {
  const response = await apiClient.post(`/employee/properties/${id}/verify/`)
  return response.data
}

export async function getAllListings(params = {}) {
  const response = await apiClient.get('/employee/listings/', { params })
  return response.data
}

export async function approveListing(id) {
  const response = await apiClient.post(`/employee/listings/${id}/approve/`)
  return response.data
}

export function rejectListing(id, note = '') {
  return apiClient.post(`/employee/listings/${id}/reject/`, { note }).then((r) => r.data)
}

export async function getLocationGrants(params = {}) {
  const response = await apiClient.get('/employee/location-grants/', { params })
  return response.data
}

export async function approveLocationGrant(id) {
  const response = await apiClient.post(`/employee/location-grants/${id}/approve/`)
  return response.data
}

export async function revokeLocationGrant(id, reason = '') {
  const response = await apiClient.post(`/employee/location-grants/${id}/revoke/`, { reason })
  return response.data
}

export async function getAllViewings(params = {}) {
  const response = await apiClient.get('/viewings/', { params })
  return response.data
}

export async function confirmViewing(id) {
  const response = await apiClient.post(`/viewings/${id}/confirm/`)
  return response.data
}

export async function cancelViewing(id, reason = '') {
  const response = await apiClient.post(`/viewings/${id}/cancel/`, { reason })
  return response.data
}

export async function getAllApplications(params = {}) {
  const response = await apiClient.get('/applications/', { params })
  return response.data
}

export async function approveApplication(id) {
  const response = await apiClient.post(`/applications/${id}/approve/`)
  return response.data
}

export async function rejectApplication(id, reason = '') {
  const response = await apiClient.post(`/applications/${id}/reject/`, { reason })
  return response.data
}

export async function getAllTenancies(params = {}) {
  const response = await apiClient.get('/tenancies/', { params })
  return response.data
}

export async function activateTenancy(id) {
  const response = await apiClient.post(`/tenancies/${id}/activate/`)
  return response.data
}

export async function terminateTenancy(id, reason = '') {
  const response = await apiClient.post(`/tenancies/${id}/terminate/`, { reason })
  return response.data
}

export async function getAllLeads(params = {}) {
  const response = await apiClient.get('/leads/', { params })
  return response.data
}

export async function getAllComplaints(params = {}) {
  const response = await apiClient.get('/complaints/', { params })
  return response.data
}

export async function getAuditLogs(params = {}) {
  const response = await apiClient.get('/audit-logs/', { params })
  return response.data
}

export async function getAllUsers(params = {}) {
  const response = await apiClient.get('/accounts/me/', { params })
  return response.data
}
