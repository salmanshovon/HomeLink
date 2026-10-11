import { Outlet } from 'react-router-dom'
import { PublicHeader } from '../components/layout/PublicHeader.jsx'
import { PublicFooter } from '../components/layout/PublicFooter.jsx'

export default function PublicLayout() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <PublicHeader />
      <main id="main-content" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
