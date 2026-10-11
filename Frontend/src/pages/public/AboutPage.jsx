import { Shield, Users, MapPin, Clock } from 'lucide-react'

const values = [
  {
    icon: <Shield size={28} />,
    title: 'Trust & Verification',
    description: 'Every landlord and property is verified by our team. We ensure all listings are legitimate and all documents are properly handled.',
  },
  {
    icon: <Users size={28} />,
    title: 'Customer-First',
    description: 'We prioritize the needs of both tenants and landlords. Our team provides personalized assistance throughout the rental journey.',
  },
  {
    icon: <MapPin size={28} />,
    title: 'Local Expertise',
    description: 'Focused on the Bangladesh market, we understand local neighborhoods, pricing trends, and rental regulations.',
  },
  {
    icon: <Clock size={28} />,
    title: 'End-to-End Support',
    description: 'From property search to move-in and beyond, we provide continuous support including maintenance, billing, and dispute resolution.',
  },
]

export default function AboutPage() {
  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)', maxWidth: '800px', margin: '0 auto var(--space-16)' }}>
        <h1>About HomeLink</h1>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-neutral-600)' }}>
          HomeLink is Bangladesh's trusted property rental marketplace, connecting verified landlords
          with trustworthy tenants. We simplify the rental process through technology, verification,
          and personalized support.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-8)',
          marginBottom: 'var(--space-16)',
        }}
      >
        {values.map((value) => (
          <div key={value.title} className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                background: 'var(--color-brand-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4)',
                color: 'var(--color-brand-600)',
              }}
            >
              {value.icon}
            </div>
            <h3>{value.title}</h3>
            <p style={{ color: 'var(--color-neutral-600)' }}>{value.description}</p>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'var(--color-neutral-50)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-12)',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>Our Story</h2>
        <div style={{ maxWidth: '700px', margin: '0 auto', color: 'var(--color-neutral-600)' }}>
          <p>
            HomeLink was founded with a simple mission: to make property rental in Bangladesh
            transparent, secure, and hassle-free for everyone involved.
          </p>
          <p>
            We saw the challenges that both tenants and landlords face — from finding verified
            properties to handling paperwork and maintenance. Our platform addresses these pain
            points by combining technology with local expertise and a commitment to quality service.
          </p>
          <p style={{ marginBottom: 0 }}>
            Today, we continue to grow our marketplace, adding new features and services to better
            serve the rental community across Bangladesh.
          </p>
        </div>
      </div>
    </div>
  )
}
