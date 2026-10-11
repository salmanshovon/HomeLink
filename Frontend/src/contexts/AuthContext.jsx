import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  login as apiLogin,
  logout as apiLogout,
  fetchCurrentUser,
} from '../api/auth.api.js'
import { setAccessToken, clearAccessToken, getAccessToken, getRefreshToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true

    async function restoreSession() {
      const hasRefreshToken = !!getRefreshToken()
      const hasAccessToken = !!getAccessToken()

      if (hasRefreshToken && hasAccessToken) {
        try {
          const data = await fetchCurrentUser()
          if (mounted) {
            setUser(data.user)
            setIsAuthenticated(true)
          }
        } catch {
          if (mounted) {
            clearAccessToken()
          }
        }
      }

      if (mounted) setIsLoading(false)
    }

    restoreSession()
    return () => { mounted = false }
  }, [])

  const login = useCallback(async (phoneNumber, password) => {
    const { user: userData } = await apiLogin(phoneNumber, password)
    setUser(userData)
    setIsAuthenticated(true)
    return userData
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const hasRole = useCallback(
    (roles) => {
      if (!user) return false
      if (!roles || roles.length === 0) return true
      const userRoles = (user.roles || []).map((r) => r.toUpperCase())
      return roles.some((role) => userRoles.includes(role.toUpperCase()))
    },
    [user],
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
