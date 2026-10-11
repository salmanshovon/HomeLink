import { Search, Home, FileCheck, Key, Wrench } from 'lucide-react'

const steps = [
  {
    icon: <Search size={28} />,
    title: 'Search Listings',
    description: 'Browse our curated selection of verified rental properties across Bangladesh. Use filters to narrow down by location, rent, bedrooms, and amenities.',
  },
  {
    icon: <Home size={28} />,
    title: 'Request a Viewing',
    description: 'Found a property you like? Request a viewing appointment and our team will coordinate with the landlord at a time that works for you.',
  },
  {
    icon: <FileCheck size={28} />,
    title: 'Apply & Get Approved',
    description: 'Submit your rental application with required documents. Our team reviews your application and coordinates with the landlord for approval.',
  },
  {
    icon: <Key size={28} />,
    title: 'Sign & Move In',
    description: 'Once approved, sign the rental agreement and pay the security deposit. We ensure all paperwork is handled properly so you can move in with confidence.',
  },
  {
    icon: <Wrench size={28} />,
    title: 'Ongoing Support',
    description: 'Need maintenance? Have questions? Our team continues to support you throughout your tenancy with maintenance requests, bill management, and more.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
        <h1>How HomeLink Works</h1>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-neutral-600)', maxWidth: '600px', margin: '0 auto' }}>
          From searching for a property to moving in and beyond, we make the rental process simple and transparent.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {steps.map((step, index) => (
          <div
            key={step.title}
            style={{
              display: 'flex',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-12)',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                background: 'var(--color-brand-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-brand-600)',
              }}
            >
              {step.icon}
            </div>
            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: 'var(--space-1) var(--space-3)',
                  background: 'var(--color-brand-100)',
                  color: 'var(--color-brand-700)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-semibold)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Step {index + 1}
              </div>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>{step.title}</h3>
              <p style={{ color: 'var(--color-neutral-600)', margin: 0 }}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'var(--color-brand-50)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-12)',
          textAlign: 'center',
          marginTop: 'var(--space-16)',
        }}
      >
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Ready to Get Started?</h2>
        <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-6)' }}>
          Create a free account and start browsing verified listings today.
        </p>
        <a href="/auth/register/tenant" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
          Create Free Account
        </a>
      </div>
    </div>
  )
}
