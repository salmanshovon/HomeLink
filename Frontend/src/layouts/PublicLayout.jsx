import { Outlet } from 'react-router-dom'
import { PublicHeader } from '../components/layout/PublicHeader.jsx'
import { PublicFooter } from '../components/layout/PublicFooter.jsx'

export default function PublicLayout() {
  return (
    <div className="public-layout">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <PublicHeader />
      <main id="main-content">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
