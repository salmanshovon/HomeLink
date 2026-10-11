import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, Home, Shield, Wrench, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()
  const [searchArea, setSearchArea] = useState('')
  const [searchRent, setSearchRent] = useState('')
  const [searchBedrooms, setSearchBedrooms] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchArea) params.set('area', searchArea)
    if (searchRent) params.set('max_rent', searchRent)
    if (searchBedrooms) params.set('bedrooms', searchBedrooms)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--color-brand-50) 0%, var(--color-neutral-0) 100%)',
          padding: 'var(--space-24) 0',
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              marginBottom: 'var(--space-6)',
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Find Your Next Home in Bangladesh
          </h1>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--color-neutral-600)',
              maxWidth: '600px',
              margin: '0 auto var(--space-10)',
            }}
          >
            HomeLink connects verified landlords with trustworthy tenants. Browse listings,
            request viewings, and manage your rental — all in one place.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              maxWidth: '800px',
              margin: '0 auto',
              background: 'var(--color-neutral-0)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-2xl)',
              boxShadow: 'var(--shadow-lg)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 200px', position: 'relative' }}>
              <MapPin
                size={18}
                style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)' }}
              />
              <input
                type="text"
                placeholder="Area, city, or neighborhood"
                value={searchArea}
                onChange={(e) => setSearchArea(e.target.value)}
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                aria-label="Location"
              />
            </div>
            <div style={{ flex: '1 1 150px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)', fontSize: 'var(--text-sm)' }}>
                ৳
              </span>
              <input
                type="number"
                placeholder="Max rent"
                value={searchRent}
                onChange={(e) => setSearchRent(e.target.value)}
                className="input"
                style={{ paddingLeft: '2rem' }}
                aria-label="Maximum rent"
              />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <select
                value={searchBedrooms}
                onChange={(e) => setSearchBedrooms(e.target.value)}
                className="select"
                aria-label="Bedrooms"
              >
                <option value="">Any Beds</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ flex: '0 0 auto' }}>
              <Search size={18} />
              Search
            </button>
          </form>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: 'var(--space-24) 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            How HomeLink Works
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-8)',
            }}
          >
            {[
              {
                icon: <Search size={32} />,
                title: 'Search & Discover',
                description: 'Browse verified listings across Bangladesh. Filter by location, rent, bedrooms, and amenities to find your perfect match.',
              },
              {
                icon: <Home size={32} />,
                title: 'Request Viewings',
                description: 'Found a place you love? Request a viewing appointment and our team will coordinate with the landlord for you.',
              },
              {
                icon: <Shield size={32} />,
                title: 'Secure & Verified',
                description: 'All landlords are verified by our team. We handle the paperwork, agreements, and ensure a smooth rental experience.',
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="card"
                style={{ textAlign: 'center', padding: 'var(--space-8)' }}
              >
                <div
                  style={{
                    width: '4rem',
                    height: '4rem',
                    borderRadius: '50%',
                    background: 'var(--color-brand-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    color: 'var(--color-brand-600)',
                  }}
                >
                  {step.icon}
                </div>
                <h3 style={{ fontSize: 'var(--text-xl)' }}>{step.title}</h3>
                <p style={{ color: 'var(--color-neutral-600)' }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Landlord CTA */}
      <section
        style={{
          background: 'var(--color-brand-700)',
          padding: 'var(--space-24) 0',
          color: 'var(--color-neutral-0)',
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-neutral-0)', marginBottom: 'var(--space-4)' }}>
            Own a Property?
          </h2>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--color-brand-100)',
              maxWidth: '600px',
              margin: '0 auto var(--space-8)',
            }}
          >
            List your property on HomeLink and reach thousands of verified tenants.
            We handle viewings, paperwork, and rent collection.
          </p>
          <Link
            to="/auth/register/landlord"
            className="btn btn-lg"
            style={{
              background: 'var(--color-neutral-0)',
              color: 'var(--color-brand-700)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            List Your Property <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Tenant CTA */}
      <section style={{ padding: 'var(--space-24) 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 'var(--space-4)' }}>Looking for a Rental?</h2>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--color-neutral-600)',
              maxWidth: '600px',
              margin: '0 auto var(--space-8)',
            }}
          >
            Let our agents help you find the perfect home. Create a free account and tell us
            what you're looking for — we'll do the rest.
          </p>
          <Link
            to="/auth/register/tenant"
            className="btn btn-primary btn-lg"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section style={{ padding: 'var(--space-24) 0', background: 'var(--color-neutral-50)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            Home Maintenance Services
          </h2>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--color-neutral-600)',
              maxWidth: '600px',
              margin: '0 auto var(--space-12)',
            }}
          >
            Keep your home in top shape with our trusted maintenance services.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {['PABX Systems', 'CCTV Installation', 'TV Servicing', 'AC Repair', 'Refrigerator Repair'].map((service) => (
              <div
                key={service}
                className="card"
                style={{
                  padding: 'var(--space-6)',
                  textAlign: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform var(--transition-fast)',
                  cursor: 'pointer',
                }}
              >
                <Wrench
                  size={24}
                  style={{ margin: '0 auto var(--space-3)', color: 'var(--color-brand-600)' }}
                />
                <h4 style={{ margin: 0 }}>{service}</h4>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
            <Link to="/maintenance-services" className="btn btn-outline" style={{ textDecoration: 'none' }}>
              View All Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
