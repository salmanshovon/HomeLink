import { apiClient } from './client.js'

export async function searchListings(params = {}) {
  const response = await apiClient.get('/listings/', { params })
  return response.data
}

export async function getProperties(params = {}) {
  const response = await apiClient.get('/properties/', { params })
  return response.data
}

export async function getPropertyDetails(id) {
  const response = await apiClient.get(`/properties/${id}/`)
  return response.data
}

export async function getPropertyMedia(id) {
  const response = await apiClient.get(`/properties/${id}/media/`)
  return response.data
}

export async function getAmenities() {
  const response = await apiClient.get('/properties/amenities/')
  return response.data
}

export async function getLocationFacets() {
  const response = await apiClient.get('/properties/locations/')
  return response.data
}

export async function getSavedProperties(params = {}) {
  const response = await apiClient.get('/properties/saved/', { params })
  return response.data
}

export async function saveProperty(listingId) {
  const response = await apiClient.post('/properties/saved/', { listing: listingId })
  return response.data
}

export async function toggleSaveProperty(propertyId) {
  const response = await apiClient.post(`/properties/${propertyId}/save/`)
  return response.data
}

export async function unsaveProperty(propertyId) {
  const response = await apiClient.delete(`/properties/${propertyId}/save/`)
  return response.data
}

export async function createInquiry(propertyId, payload) {
  const response = await apiClient.post(`/properties/${propertyId}/inquiries/`, payload)
  return response.data
}

export async function requestLocationAccess(propertyId) {
  const response = await apiClient.post(`/properties/${propertyId}/location-access/`)
  return response.data
}
