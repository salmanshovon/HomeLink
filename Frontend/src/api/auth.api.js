import { apiClient, setAccessToken, setRefreshToken, clearAccessToken, clearRefreshToken } from './client.js'

export async function login(phoneNumber, password) {
  const response = await apiClient.post('/auth/login/', {
    phone_number: phoneNumber,
    password,
  }, { _skipAuth: true })
  const { access, refresh, user } = response.data
  localStorage.setItem('homelink_access_token', access)
  setAccessToken(access)
  setRefreshToken(refresh)
  return { user }
}

export async function registerTenant(payload) {
  const response = await apiClient.post('/auth/register/tenant/', payload)
  return response.data
}

export async function registerLandlord(payload) {
  const response = await apiClient.post('/auth/register/landlord/', payload)
  return response.data
}

export async function logout() {
  const refresh = localStorage.getItem('homelink_refresh_token')
  try {
    if (refresh) {
      await apiClient.post('/auth/logout/', { refresh })
    }
  } catch {
    // Best effort — clear local state regardless
  } finally {
    clearAccessToken()
    clearRefreshToken()
  }
}

export async function verifyPhone(phoneNumber, code) {
  const response = await apiClient.post('/auth/verify-phone/', {
    phone_number: phoneNumber,
    code,
  })
  return response.data
}

export async function resendVerification(phoneNumber) {
  const response = await apiClient.post('/auth/resend-verification/', {
    phone_number: phoneNumber,
  })
  return response.data
}

export async function requestPasswordReset(identifier) {
  const payload = identifier.includes('@')
    ? { email: identifier }
    : { phone_number: identifier }
  const response = await apiClient.post('/auth/password-reset/', payload)
  return response.data
}

export async function confirmPasswordReset(uid, token, newPassword) {
  const response = await apiClient.post('/auth/password-reset/confirm/', {
    uid,
    token,
    new_password: newPassword,
  })
  return response.data
}

export async function fetchCurrentUser() {
  const response = await apiClient.get('/accounts/me/')
  return response.data
}

export async function updateProfile(payload) {
  const response = await apiClient.patch('/accounts/me/', payload)
  return response.data
}
