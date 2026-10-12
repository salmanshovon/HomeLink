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
      // A non-JSON body usually means the request never reached the API (e.g. a
      // dev-server HTML fallback or a proxy error). Never surface raw markup.
      const trimmed = data.trim()
      const looksLikeMarkup = /^\s*(<!doctype|<html|<\?xml)/i.test(trimmed)
      if (!looksLikeMarkup) {
        return new ApiError(status, 'error', trimmed)
      }
      return new ApiError(
        status,
        status === 404 ? 'not_found' : 'bad_response',
        status === 404
          ? 'The requested endpoint was not found. Check the API URL.'
          : 'The server returned an unexpected response.',
      )
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

// Emitted when the session can no longer be renewed (refresh token missing,
// expired, or revoked). Listeners (AuthProvider) reset state and send the
// user back to the public home page instead of surfacing a technical error.
export const SESSION_EXPIRED_EVENT = 'homelink:session-expired'

let refreshPromise = null

function emitSessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const refresh = localStorage.getItem('homelink_refresh_token')
      if (!refresh) throw new ApiError(401, 'no_refresh_token', 'Session expired. Please sign in again.')

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

    // Only try to renew a session that actually existed. A request sent with
    // no access token (a guest hitting an auth-required endpoint) has nothing
    // to refresh, so surface the 401 to the caller instead of treating it as
    // an expired session and redirecting to the home page.
    const hadAccessToken = !!window.__homelink_access_token

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest._skipAuth &&
      hadAccessToken
    ) {
      originalRequest._retry = true
      try {
        const newToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        window.__homelink_access_token = null
        localStorage.removeItem('homelink_refresh_token')
        // The session cannot be recovered. Tell the app to return to the
        // public home page; don't surface the raw failure in the UI.
        emitSessionExpired()
        return Promise.reject(
          new ApiError(401, 'session_expired', 'Your session has expired. Please sign in again.'),
        )
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
