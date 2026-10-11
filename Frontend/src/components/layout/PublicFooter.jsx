import { Link } from 'react-router-dom'

export function PublicFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-color)',
        padding: 'var(--space-12) 0',
        marginTop: 'var(--space-24)',
        background: 'var(--color-neutral-50)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-8)',
          }}
        >
          <div>
            <h4>HomeLink</h4>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
              Bangladesh&apos;s trusted property rental marketplace.
            </p>
          </div>
          <div>
            <h6>Explore</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/search">Search properties</Link></li>
              <li><Link to="/how-it-works">How it works</Link></li>
              <li><Link to="/maintenance-services">Maintenance services</Link></li>
            </ul>
          </div>
          <div>
            <h6>Company</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h6>Legal</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/privacy-policy">Privacy policy</Link></li>
              <li><Link to="/terms">Terms of service</Link></li>
            </ul>
          </div>
        </div>
        <p style={{ marginTop: 'var(--space-8)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
          &copy; {new Date().getFullYear()} HomeLink. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
