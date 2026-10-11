import { Link } from 'react-router-dom'

const footerSections = [
  {
    title: 'Explore',
    links: [
      { to: '/search', label: 'Search Properties' },
      { to: '/how-it-works', label: 'How It Works' },
      { to: '/maintenance-services', label: 'Maintenance Services' },
      { to: '/about', label: 'About Us' },
    ],
  },
  {
    title: 'For Landlords',
    links: [
      { to: '/auth/register/landlord', label: 'List Your Property' },
      { to: '/auth/login', label: 'Landlord Login' },
    ],
  },
  {
    title: 'For Tenants',
    links: [
      { to: '/auth/register/tenant', label: 'Create Account' },
      { to: '/auth/login', label: 'Tenant Login' },
      { to: '/search', label: 'Browse Listings' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy-policy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms of Service' },
    ],
  },
]

export function PublicFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-color)',
        background: 'var(--color-neutral-50)',
        marginTop: 'auto',
      }}
    >
      <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-8)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-8)',
            marginBottom: 'var(--space-8)',
          }}
        >
          {footerSections.map((section) => (
            <div key={section.title}>
              <h6
                style={{
                  marginBottom: 'var(--space-4)',
                  fontSize: 'var(--text-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-neutral-500)',
                }}
              >
                {section.title}
              </h6>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {section.links.map((link) => (
                  <li key={link.to + link.label} style={{ marginBottom: 'var(--space-2)' }}>
                    <Link
                      to={link.to}
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-neutral-600)',
                        textDecoration: 'none',
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: 'var(--space-6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
            &copy; {new Date().getFullYear()} HomeLink. All rights reserved.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
            Made with care in Bangladesh
          </p>
        </div>
      </div>
    </footer>
  )
}
