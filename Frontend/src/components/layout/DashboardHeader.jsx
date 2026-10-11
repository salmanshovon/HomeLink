import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, LogOut, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLogout } from '../../hooks/useLogout.js'

export function DashboardHeader({ onMenuToggle, menuOpen }) {
  const { user } = useAuth()
  const logout = useLogout()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        background: 'var(--color-neutral-0)',
        borderBottom: '1px solid var(--border-color)',
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <button
          onClick={onMenuToggle}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--space-2)',
            color: 'var(--color-neutral-700)',
          }}
          className="mobile-menu-toggle"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link
          to="/"
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-brand-700)',
            textDecoration: 'none',
          }}
        >
          HomeLink
        </Link>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-label="User menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-neutral-700)',
          }}
        >
          <User size={18} />
          <span>{user?.first_name || user?.phone_number || 'Account'}</span>
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: 'var(--space-2)',
              background: 'var(--color-neutral-0)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '180px',
              padding: 'var(--space-2)',
              zIndex: 'var(--z-dropdown)',
            }}
          >
            <button
              onClick={() => {
                setDropdownOpen(false)
                logout()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                background: 'none',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-neutral-700)',
                textAlign: 'left',
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
