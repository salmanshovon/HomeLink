import { NavLink } from 'react-router-dom'

export function DashboardSidebar({ title, links, onNavigate }) {
  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--color-neutral-0)',
        padding: 'var(--space-6)',
        position: 'sticky',
        top: 'var(--header-height)',
        height: 'calc(100vh - var(--header-height))',
        overflowY: 'auto',
        flexShrink: 0,
      }}
      className="dashboard-sidebar"
    >
      <h3
        style={{
          fontSize: 'var(--text-sm)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--color-neutral-500)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {title}
      </h3>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              textDecoration: 'none',
              color: isActive ? 'var(--color-brand-700)' : 'var(--color-neutral-600)',
              background: isActive ? 'var(--color-brand-50)' : 'transparent',
            })}
          >
            {link.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{link.icon}</span>}
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
