import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export class ApiError extends Error {
  constructor(status, code, message, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  get isAuthError() {
    return this.status === 401
  }

  get isPermissionError() {
    return this.status === 403
  }

  get isNotFound() {
    return this.status === 404
  }

  get isValidationError() {
    return this.status === 400 && this.details != null
  }

  fieldErrors() {
    if (!this.isValidationError) return {}
    return this.details
  }
}

function parseError(error) {
  if (error.response) {
    const { status, data } = error.response
    if (data?.error) {
      const { code, message, details } = data.error
      return new ApiError(status, code || 'error', message, details)
    }
    if (typeof data === 'string' && data.trim()) {
      return new ApiError(status, 'error', data)
    }
    if (data && typeof data === 'object' && !data.error) {
      return new ApiError(status, 'error', 'Request failed.', data)
    }
    // Handle empty error responses (e.g., SimpleJWT 401 with no body)
    const fallbackMessages = {
      400: 'Invalid request. Please check your input.',
      401: 'Invalid credentials or session expired.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      405: 'Method not allowed.',
      422: 'Validation failed. Please check your input.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
    }
    return new ApiError(
      status,
      'error',
      fallbackMessages[status] || `Request failed with status ${status}.`,
    )
  }
  if (error.request) {
    return new ApiError(0, 'network_error', 'Network error. Please check your connection.')
  }
  return new ApiError(0, 'error', error.message || 'An unexpected error occurred.')
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = config.headers['X-Skip-Auth']
    ? null
    : window.__homelink_access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const refresh = localStorage.getItem('homelink_refresh_token')
      if (!refresh) throw new ApiError(401, 'no_refresh_token', 'No refresh token available.')

      const response = await axios.post(
        `${API_BASE}/auth/token/refresh/`,
        { refresh },
        { headers: { 'Content-Type': 'application/json' } },
      )

      const { access } = response.data
      window.__homelink_access_token = access
      return access
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._skipAuth) {
      originalRequest._retry = true
      try {
        const newToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        window.__homelink_access_token = null
        localStorage.removeItem('homelink_refresh_token')
        return Promise.reject(parseError(refreshError))
      }
    }

    return Promise.reject(parseError(error))
  },
)

export function setAccessToken(token) {
  window.__homelink_access_token = token
}

export function clearAccessToken() {
  window.__homelink_access_token = null
}

export function getAccessToken() {
  return window.__homelink_access_token
}

export function setRefreshToken(token) {
  localStorage.setItem('homelink_refresh_token', token)
}

export function getRefreshToken() {
  return localStorage.getItem('homelink_refresh_token')
}

export function clearRefreshToken() {
  localStorage.removeItem('homelink_refresh_token')
}

// Initialize access token from localStorage on module load
const savedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('homelink_access_token') : null
if (savedToken) {
  window.__homelink_access_token = savedToken
}

export function initAccessToken() {
  const token = localStorage.getItem('homelink_access_token')
  if (token) {
    window.__homelink_access_token = token
  }
}
