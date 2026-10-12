import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  login as apiLogin,
  logout as apiLogout,
  fetchCurrentUser,
} from '../api/auth.api.js'
import {
  SESSION_EXPIRED_EVENT,
  setAccessToken,
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
} from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const userRef = useRef(null)

  const resetSession = useCallback(() => {
    clearAccessToken()
    clearRefreshToken()
    userRef.current = null
    setUser(null)
    setIsAuthenticated(false)
    setIsLoading(false)
  }, [])

  // The API client emits this when the refresh token is missing/expired.
  // Clear auth state here; <SessionRedirect> (rendered inside the router)
  // performs the actual navigation home.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, resetSession)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, resetSession)
  }, [resetSession])

  useEffect(() => {
    let mounted = true

    async function restoreSession() {
      const hasRefreshToken = !!getRefreshToken()
      const hasAccessToken = !!getAccessToken()

      if (hasRefreshToken && hasAccessToken) {
        try {
          const data = await fetchCurrentUser()
          if (mounted) {
            userRef.current = data.user
            setUser(data.user)
            setIsAuthenticated(true)
          }
        } catch {
          // If the refresh token is the problem the API client will have
          // emitted SESSION_EXPIRED_EVENT, which resets state for us.
          if (mounted && !hasRefreshToken) {
            resetSession()
          }
        }
      }

      if (mounted) setIsLoading(false)
    }

    restoreSession()
    return () => { mounted = false }
  }, [resetSession])

  const login = useCallback(async (phoneNumber, password) => {
    const { user: userData } = await apiLogin(phoneNumber, password)
    userRef.current = userData
    setUser(userData)
    setIsAuthenticated(true)
    return userData
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    userRef.current = null
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const hasRole = useCallback(
    (roles) => {
      const currentUser = userRef.current
      if (!currentUser) return false
      if (!roles || roles.length === 0) return true
      const userRoles = (currentUser.roles || []).map((r) => r.toUpperCase())
      return roles.some((role) => userRoles.includes(role.toUpperCase()))
    },
    [],
  )

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
