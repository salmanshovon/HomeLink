import { Outlet } from 'react-router-dom'

// Placeholder: role enforcement will be implemented in Commit 3.
export default function RoleRoute({ allowedRoles, children }) {
  return children || <Outlet />
}
