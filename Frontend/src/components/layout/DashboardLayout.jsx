import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { DashboardHeader } from './DashboardHeader.jsx'
import { DashboardSidebar } from './DashboardSidebar.jsx'

export function DashboardLayout({ title, navLinks }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <DashboardHeader menuOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Desktop sidebar */}
        <DashboardSidebar title={title} links={navLinks} />

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'var(--z-overlay)',
              background: 'rgb(0 0 0 / 0.5)',
            }}
            onClick={() => setSidebarOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 'var(--sidebar-width)',
                background: 'var(--color-neutral-0)',
              }}
            >
              <DashboardSidebar title={title} links={navLinks} onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <main style={{ flex: 1, padding: 'var(--space-8)', overflowX: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
