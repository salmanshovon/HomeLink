import { Navigate, Outlet, useLocation } from 'react-router-dom'

// Placeholder: full auth logic will be implemented in Commit 3.
// For now, all routes pass through so the build succeeds.
export default function ProtectedRoute({ children }) {
  return children || <Outlet />
}
