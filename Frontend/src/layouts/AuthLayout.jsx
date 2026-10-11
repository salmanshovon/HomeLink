import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div
      className="auth-layout"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'var(--color-neutral-50)',
      }}
    >
      <Outlet />
    </div>
  )
}
