import { apiClient } from './client.js'

export async function getMyProperties(params = {}) {
  const response = await apiClient.get('/landlord/properties/', { params })
  return response.data
}

export async function createProperty(payload) {
  const response = await apiClient.post('/landlord/properties/', payload)
  return response.data
}

export async function updateProperty(id, payload) {
  const response = await apiClient.patch(`/landlord/properties/${id}/`, payload)
  return response.data
}

export async function deleteProperty(id) {
  const response = await apiClient.delete(`/landlord/properties/${id}/`)
  return response.data
}

export async function addUnit(propertyId, payload) {
  const response = await apiClient.post(`/landlord/properties/${propertyId}/units/`, payload)
  return response.data
}

export async function updateUnit(propertyId, unitId, payload) {
  const response = await apiClient.patch(`/landlord/properties/${propertyId}/units/${unitId}/`, payload)
  return response.data
}

export async function uploadPropertyMedia(propertyId, formData) {
  const response = await apiClient.post(`/properties/${propertyId}/upload-media/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function getPropertyMedia(propertyId) {
  const response = await apiClient.get(`/landlord/properties/${propertyId}/media/`)
  return response.data
}

export async function deletePropertyMedia(propertyId, mediaId) {
  const response = await apiClient.delete(`/landlord/properties/${propertyId}/media/${mediaId}/`)
  return response.data
}

export async function getMyListings(params = {}) {
  const response = await apiClient.get('/landlord/listings/', { params })
  return response.data
}

export async function createListing(payload) {
  const response = await apiClient.post('/landlord/listings/', payload)
  return response.data
}

export async function updateListing(id, payload) {
  const response = await apiClient.patch(`/landlord/listings/${id}/`, payload)
  return response.data
}

export async function deleteListing(id) {
  const response = await apiClient.delete(`/landlord/listings/${id}/`)
  return response.data
}

export async function submitListingForReview(id) {
  const response = await apiClient.post(`/landlord/listings/${id}/submit_for_review/`)
  return response.data
}

export async function getMyTenancies(params = {}) {
  const response = await apiClient.get('/landlord/tenancies/', { params })
  return response.data
}

export async function getMyTenants(params = {}) {
  const response = await apiClient.get('/landlord/tenants/', { params })
  return response.data
}

export async function getMyComplaints(params = {}) {
  const response = await apiClient.get('/landlord/complaints/', { params })
  return response.data
}

export async function getMyInvoices(params = {}) {
  const response = await apiClient.get('/landlord/invoices/', { params })
  return response.data
}

export async function getMyPayments(params = {}) {
  const response = await apiClient.get('/landlord/payments/', { params })
  return response.data
}

export async function sendAnnouncement(payload) {
  const response = await apiClient.post('/landlord/announcements/', payload)
  return response.data
}
