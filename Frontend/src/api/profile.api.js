import { apiClient } from './client.js'

// Self-service profile management
export async function changePassword(oldPassword, newPassword) {
  const response = await apiClient.post('/accounts/me/password/', {
    old_password: oldPassword,
    new_password: newPassword,
  })
  return response.data
}

export async function listAddresses() {
  const response = await apiClient.get('/accounts/me/addresses/')
  return response.data
}

export async function createAddress(payload) {
  const response = await apiClient.post('/accounts/me/addresses/', payload)
  return response.data
}

export async function updateAddress(addressId, payload) {
  const response = await apiClient.patch(`/accounts/me/addresses/${addressId}/`, payload)
  return response.data
}

export async function deleteAddress(addressId) {
  const response = await apiClient.delete(`/accounts/me/addresses/${addressId}/`)
  return response.data
}
