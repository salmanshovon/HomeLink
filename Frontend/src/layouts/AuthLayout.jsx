import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div
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
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <Link
          to="/"
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-neutral-900)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            letterSpacing: '-0.025em',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              background: 'var(--color-brand-600)',
              color: 'var(--color-neutral-0)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 'var(--font-bold)',
            }}
          >
            H
          </span>
          HomeLink
        </Link>
      </div>
      <Outlet />
      <div style={{ marginTop: 'var(--space-8)' }}>
        <Link to="/" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
          &larr; Back to home
        </Link>
      </div>
    </div>
  )
}
