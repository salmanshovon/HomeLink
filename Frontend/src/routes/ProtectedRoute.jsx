import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { FullPageSpinner } from '../components/feedback/FullPageSpinner.jsx'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner label="Checking your session…" />

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
  }

  return children || <Outlet />
}
