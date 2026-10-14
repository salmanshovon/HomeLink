import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'

const navLinks = [
  { to: '/search', label: 'Search' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/maintenance-services', label: 'Services' },
  { to: '/about', label: 'About' },
]

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const roles = (user?.roles || []).map((r) => r.toUpperCase())
  const dashboardRoute = roles.includes('SUPERADMIN') ? '/admin'
    : roles.includes('EMPLOYEE') ? '/employee'
    : roles.includes('LANDLORD') ? '/landlord'
    : '/tenant'
  const logoTo = isAuthenticated ? dashboardRoute : '/'
  const showAuthButtons = !isAuthenticated

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        background: 'var(--color-neutral-0)',
        borderBottom: '1px solid var(--color-neutral-200)',
        height: 'var(--header-height)',
        boxShadow: 'var(--shadow-sm)',
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
          to={logoTo}
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

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}
          className="desktop-nav"
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                fontWeight: 'var(--font-medium)',
                color: 'var(--color-neutral-600)',
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
              }}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link
              to={dashboardRoute}
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/auth/login"
                style={{
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-neutral-700)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/auth/register/tenant"
                className="btn btn-primary btn-sm"
                style={{ textDecoration: 'none' }}
              >
                Get Started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--space-2)',
            color: 'var(--color-neutral-600)',
          }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile navigation panel */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          style={{
            position: 'absolute',
            top: 'var(--header-height)',
            left: 0,
            right: 0,
            background: 'var(--color-neutral-0)',
            borderBottom: '1px solid var(--color-neutral-200)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: 'var(--space-3)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--color-neutral-700)',
                textDecoration: 'none',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link
              to={dashboardRoute}
              onClick={() => setMobileOpen(false)}
              className="btn btn-secondary"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-neutral-200)', margin: 'var(--space-2) 0' }} />
              <Link
                to="/auth/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: 'var(--space-3)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-neutral-700)',
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/auth/register/tenant"
                onClick={() => setMobileOpen(false)}
                className="btn btn-primary"
                style={{ textDecoration: 'none', textAlign: 'center' }}
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
