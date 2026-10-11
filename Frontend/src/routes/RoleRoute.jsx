import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { FullPageSpinner } from '../components/feedback/FullPageSpinner.jsx'

export default function RoleRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner label="Checking permissions…" />

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to="/access-denied" replace />
  }

  return children || <Outlet />
}
