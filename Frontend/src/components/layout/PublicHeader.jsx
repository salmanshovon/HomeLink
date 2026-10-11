import { Link } from 'react-router-dom'

export function PublicHeader() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        background: 'var(--color-neutral-0)',
        borderBottom: '1px solid var(--border-color)',
        height: 'var(--header-height)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-brand-700)',
            textDecoration: 'none',
          }}
        >
          HomeLink
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/search" style={{ marginRight: '1rem' }}>
            Search
          </Link>
          <Link to="/how-it-works" style={{ marginRight: '1rem' }}>
            How it works
          </Link>
          <Link to="/maintenance-services" style={{ marginRight: '1rem' }}>
            Services
          </Link>
          <Link to="/auth/login">Sign in</Link>
        </nav>
      </div>
    </header>
  )
}
