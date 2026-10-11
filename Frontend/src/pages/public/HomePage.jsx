export default function HomePage() {
  return (
    <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <h1>Find Your Next Home in Bangladesh</h1>
      <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-neutral-600)', maxWidth: '600px', margin: '0 auto 2rem' }}>
        HomeLink connects verified landlords with trustworthy tenants. Browse listings,
        request viewings, and manage your rental — all in one place.
      </p>
      <p>
        <a href="/search" className="btn btn-primary" style={{ marginRight: '1rem' }}>Browse Properties</a>
        <a href="/how-it-works" className="btn btn-outline">How It Works</a>
      </p>
    </div>
  )
}
