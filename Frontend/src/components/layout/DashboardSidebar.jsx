import { NavLink } from 'react-router-dom'

export function DashboardSidebar({ title, links, onNavigate }) {
  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        borderRight: '1px solid var(--color-neutral-800)',
        background: 'var(--color-neutral-900)',
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
          fontSize: 'var(--text-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-neutral-500)',
          marginBottom: 'var(--space-4)',
          fontWeight: 'var(--font-semibold)',
        }}
      >
        {title}
      </h3>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
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
              color: isActive ? 'var(--color-neutral-0)' : 'var(--color-neutral-400)',
              background: isActive ? 'var(--color-brand-600)' : 'transparent',
              transition: 'all var(--transition-fast)',
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
