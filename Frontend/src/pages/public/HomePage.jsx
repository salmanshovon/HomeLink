import { useEffect, useState, useRef } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Search, MapPin, Home, Shield, Wrench, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'

const ANIMATION_STYLES = [
  { name: 'fade-up', keyframes: 'homeFadeUp' },
  { name: 'fade-down', keyframes: 'homeFadeDown' },
  { name: 'fade-left', keyframes: 'homeFadeLeft' },
  { name: 'fade-right', keyframes: 'homeFadeRight' },
  { name: 'zoom-in', keyframes: 'homeZoomIn' },
  { name: 'slide-up', keyframes: 'homeSlideUp' },
]

function getRandomAnimation() {
  const idx = Math.floor(Math.random() * ANIMATION_STYLES.length)
  return ANIMATION_STYLES[idx]
}

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, isLoading } = useAuth()
  const [searchArea, setSearchArea] = useState('')
  const [searchRent, setSearchRent] = useState('')
  const [searchBedrooms, setSearchBedrooms] = useState('')
  const [animStyle, setAnimStyle] = useState(null)
  const [phase, setPhase] = useState('splash')
  const [visible, setVisible] = useState({})
  const sectionRefs = useRef([])

  useEffect(() => {
    setAnimStyle(getRandomAnimation())
  }, [])

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('transition'), 1200),
      setTimeout(() => setPhase('banner'), 1800),
      setTimeout(() => setPhase('done'), 2500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => ({ ...prev, [entry.target.dataset.section]: true }))
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  if (!isLoading && isAuthenticated) {
    const roles = (user?.roles || []).map((r) => r.toUpperCase())
    if (roles.includes('SUPERADMIN')) return <Navigate to="/admin" replace />
    if (roles.includes('EMPLOYEE')) return <Navigate to="/employee" replace />
    if (roles.includes('LANDLORD')) return <Navigate to="/landlord" replace />
    return <Navigate to="/tenant" replace />
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchArea) params.set('area', searchArea)
    if (searchRent) params.set('max_rent', searchRent)
    if (searchBedrooms) params.set('bedrooms', searchBedrooms)
    navigate(`/search?${params.toString()}`)
  }

  const animName = animStyle?.keyframes || 'homeFadeUp'
  const animDelay = (i) => `${i * 0.12}s`

  const sectionVisible = (name) => visible[name]

  const cardSteps = [
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
  ]

  const services = ['PABX Systems', 'CCTV Installation', 'TV Servicing', 'AC Repair', 'Refrigerator Repair']

  return (
    <div style={{ width: '100%' }}>
      {/* Hero Section */}
      <section
        className="hero-section"
        style={{
          background: 'linear-gradient(135deg, #e8f5e9 0%, #f3e5f5 25%, #e3f2fd 50%, #fff3e0 75%, #fce4ec 100%)',
          padding: 'var(--space-24) 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative floating shapes */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b6b, #feca57)', opacity: 0.15, filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '60%', right: '8%', width: '180px', height: '180px', borderRadius: '50%', background: 'linear-gradient(135deg, #5f27cd, #341f97)', opacity: 0.12, filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '15%', width: '100px', height: '100px', borderRadius: '30%', background: 'linear-gradient(135deg, #00d2d3, #54a0ff)', opacity: 0.1, filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', top: '30%', left: '70%', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff9ff3, #f368e0)', opacity: 0.15, filter: 'blur(25px)' }} />
        <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #48dbfb, #0abde3)', opacity: 0.12, filter: 'blur(20px)' }} />
        <div style={{ position: 'absolute', top: '15%', left: '40%', width: '200px', height: '4px', borderRadius: '4px', background: 'linear-gradient(90deg, transparent, #ff6b6b, #feca57, #48dbfb, #ff9ff3, transparent)', opacity: 0.4 }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '30%', width: '160px', height: '4px', borderRadius: '4px', background: 'linear-gradient(90deg, transparent, #5f27cd, #341f97, #00d2d3, transparent)', opacity: 0.3 }} />
        {/* Splash overlay covers the whole hero, so the photo and the copy both
            sit behind the logo until it clears. */}
        {phase === 'splash' && (
          <div className="hero-splash-overlay">
            <div className="home-splash">
              <div className="home-splash-icon">
                <Home size={64} />
              </div>
              <div className="home-splash-particles">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="home-splash-particle" style={{ '--i': i }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transition flash */}
        {phase === 'transition' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--color-brand-600)',
              opacity: 0.15,
            }}
            className="home-flash"
          />
        )}

        {/* Hero content: image left, text+search right */}
        <div className="hero-content">
          <div className="hero-image-half" style={{ ['--anim-name']: animName }}>
            {phase === 'banner' || phase === 'done' ? (
              <div className="hero-image-frame">
                <img src="/hero_sec.png" alt="HomeLink hero" className="hero-image home-appear" />
                <div className="hero-image-overlay" />
              </div>
            ) : null}
          </div>

          {/* Creative divider */}
          <div className="hero-divider">
            <div className="hero-divider-line" />
            <div className="hero-divider-dots">
              <div className="hero-divider-dot" />
              <div className="hero-divider-dot" />
              <div className="hero-divider-dot" />
            </div>
          </div>

          <div className="hero-text-half" style={{ ['--anim-name']: animName }}>
            <h1
              className={phase === 'banner' || phase === 'done' ? 'home-appear' : 'home-hidden'}
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
              className={phase === 'banner' || phase === 'done' ? 'home-appear' : 'home-hidden'}
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
              className={phase === 'banner' || phase === 'done' ? 'home-appear' : 'home-hidden'}
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
      </div>
    </section>

      {/* Combined CTA Section */}
      <section
        data-section="cta"
        ref={(el) => (sectionRefs.current[1] = el)}
        style={{ padding: 0 }}
      >
        {/* Desktop: split with angled divider */}
        <div className="cta-split">
          <div className="cta-split-left">
            <h2>Own a Property?</h2>
            <p>
              List your property on HomeLink and reach thousands of verified tenants.
              We handle viewings, paperwork, and rent collection.
            </p>
            <Link
              to="/auth/register/landlord"
              className="btn btn-lg"
              style={{
                background: '#fff',
                color: '#764ba2',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              List Your Property <ArrowRight size={20} />
            </Link>
          </div>
          <div className="cta-split-right">
            <h2>Looking for a Rental?</h2>
            <p>
              Let our agents help you find the perfect home. Create a free account and tell us
              what you're looking for — we'll do the rest.
            </p>
            <Link
              to="/auth/register/tenant"
              className="btn btn-lg"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                background: '#fff',
                color: '#f5576c',
              }}
            >
              Get Started Free <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Mobile: stacked */}
        <div className="cta-mobile">
          <div
            className="animate-on-scroll"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: 'var(--space-16) 0',
              color: '#fff',
              textAlign: 'center',
            }}
          >
            <div style={{ padding: '0 var(--space-8)' }}>
              <h2 style={{ color: '#fff', marginBottom: 'var(--space-4)' }}>Own a Property?</h2>
              <p style={{ fontSize: 'var(--text-lg)', color: 'rgba(255,255,255,0.9)', maxWidth: '600px', margin: '0 auto var(--space-8)' }}>
                List your property on HomeLink and reach thousands of verified tenants.
                We handle viewings, paperwork, and rent collection.
              </p>
              <Link
                to="/auth/register/landlord"
                className="btn btn-lg"
                style={{ background: '#fff', color: '#764ba2', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                List Your Property <ArrowRight size={20} />
              </Link>
            </div>
          </div>
          <div
            className="animate-on-scroll"
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              padding: 'var(--space-16) 0',
              color: '#fff',
              textAlign: 'center',
            }}
          >
            <div style={{ padding: '0 var(--space-8)' }}>
              <h2 style={{ color: '#fff', marginBottom: 'var(--space-4)' }}>Looking for a Rental?</h2>
              <p style={{ fontSize: 'var(--text-lg)', color: 'rgba(255,255,255,0.9)', maxWidth: '600px', margin: '0 auto var(--space-8)' }}>
                Let our agents help you find the perfect home. Create a free account and tell us
                what you're looking for — we'll do the rest.
              </p>
              <Link
                to="/auth/register/tenant"
                className="btn btn-lg"
                style={{ background: '#fff', color: '#f5576c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                Get Started Free <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        data-section="services"
        ref={(el) => (sectionRefs.current[3] = el)}
        style={{
          padding: 'var(--space-24) 0',
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%)',
        }}
      >
        <div style={{ padding: '0 var(--space-8)' }}>
          <h2
            className={`animate-on-scroll ${sectionVisible('services') ? 'is-visible' : ''}`}
            style={{ textAlign: 'center', marginBottom: 'var(--space-4)', ['--anim-name']: 'homeFadeUp' }}
          >
            Home Maintenance Services
          </h2>
          <p
            className={`animate-on-scroll ${sectionVisible('services') ? 'is-visible' : ''}`}
            style={{
              textAlign: 'center',
              color: 'var(--color-neutral-600)',
              maxWidth: '600px',
              margin: '0 auto var(--space-12)',
              animationDelay: animDelay(1),
              ['--anim-name']: 'homeFadeUp',
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
            {services.map((service, i) => {
              const colors = [
                ['#ff6b6b', '#feca57'],
                ['#48dbfb', '#5f27cd'],
                ['#ff9ff3', '#f368e0'],
                ['#00d2d3', '#54a0ff'],
                ['#ff6348', '#ff4757'],
              ]
              const [c1, c2] = colors[i % colors.length]
              return (
                <div
                  key={service}
                  className={`card animate-on-scroll ${sectionVisible('services') ? 'is-visible' : ''}`}
                  style={{
                    padding: 'var(--space-6)',
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'pointer',
                    animationDelay: animDelay(i + 2),
                    ['--anim-name']: ANIMATION_STYLES[i % ANIMATION_STYLES.length].keyframes,
                    background: `linear-gradient(135deg, ${c1}15, ${c2}15)`,
                    border: `1px solid ${c1}30`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'
                    e.currentTarget.style.boxShadow = `0 12px 24px ${c1}30`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = ''
                    e.currentTarget.style.boxShadow = ''
                  }}
                >
                  <div
                    style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${c1}, ${c2})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto var(--space-3)',
                      color: '#fff',
                    }}
                  >
                    <Wrench size={18} />
                  </div>
                  <h4 style={{ margin: 0, fontWeight: 'var(--font-semibold)' }}>{service}</h4>
                </div>
              )
            })}
          </div>
          <div
            className={`animate-on-scroll ${sectionVisible('services') ? 'is-visible' : ''}`}
            style={{ textAlign: 'center', marginTop: 'var(--space-8)', animationDelay: animDelay(7), ['--anim-name']: 'homeFadeUp' }}
          >
            <Link to="/maintenance-services" className="btn btn-outline" style={{ textDecoration: 'none' }}>
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{
          padding: 'var(--space-24) 0',
          background: 'linear-gradient(180deg, #f8f9fa 0%, #e8f4fd 50%, #f0f9ff 100%)',
        }}
        data-section="how-it-works"
        ref={(el) => (sectionRefs.current[0] = el)}
      >
        <div style={{ padding: '0 var(--space-8)' }}>
          <h2
            className={`animate-on-scroll ${sectionVisible('how-it-works') ? 'is-visible' : ''}`}
            style={{ textAlign: 'center', marginBottom: 'var(--space-12)', ['--anim-name']: 'homeFadeUp' }}
          >
            How HomeLink Works
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-8)',
            }}
          >
            {cardSteps.map((step, i) => (
              <div
                key={step.title}
                className={`card animate-on-scroll ${sectionVisible('how-it-works') ? 'is-visible' : ''}`}
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-8)',
                  animationDelay: animDelay(i),
                  ['--anim-name']: ANIMATION_STYLES[i % ANIMATION_STYLES.length].keyframes,
                  border: '2px solid transparent',
                  background: `linear-gradient(var(--color-neutral-0), var(--color-neutral-0)) padding-box, linear-gradient(135deg, ${['#ff6b6b', '#48dbfb', '#ff9ff3'][i % 3]}, ${['#feca57', '#5f27cd', '#f368e0'][i % 3]}) border-box`,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <div
                  style={{
                    width: '4rem',
                    height: '4rem',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${['#ff6b6b', '#48dbfb', '#ff9ff3'][i % 3]}, ${['#feca57', '#5f27cd', '#f368e0'][i % 3]})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    color: '#fff',
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
    </div>
  )
}
