import { Wrench, Phone, Tv, AirVent, Refrigerator } from 'lucide-react'

const services = [
  {
    icon: <Phone size={32} />,
    title: 'PABX Installation & Servicing',
    description: 'Professional PABX phone system installation, configuration, and maintenance for homes and offices.',
  },
  {
    icon: <Tv size={32} />,
    title: 'Television Servicing',
    description: 'Expert repair and servicing for all TV brands including LED, LCD, Smart TVs, and projectors.',
  },
  {
    icon: <AirVent size={32} />,
    title: 'AC Repair & Servicing',
    description: 'Complete air conditioning services including installation, gas refilling, cleaning, and repairs.',
  },
  {
    icon: <Wrench size={32} />,
    title: 'CCTV Installation & Servicing',
    description: 'Security camera system installation, configuration, and maintenance for residential and commercial properties.',
  },
  {
    icon: <Refrigerator size={32} />,
    title: 'Refrigerator Repair & Servicing',
    description: 'Professional refrigerator repair and maintenance for all brands including deep freezers and mini fridges.',
  },
]

export default function MaintenanceServicesPage() {
  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
        <h1>Home Maintenance Services</h1>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-neutral-600)', maxWidth: '600px', margin: '0 auto' }}>
          Keep your home in top shape with our trusted maintenance services.
          All services are performed by experienced professionals.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-8)',
          marginBottom: 'var(--space-16)',
        }}
      >
        {services.map((service) => (
          <div key={service.title} className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
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
              {service.icon}
            </div>
            <h3>{service.title}</h3>
            <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>{service.description}</p>
            <a href="/contact" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
              Request Service
            </a>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'var(--color-brand-50)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-12)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Need a Service?</h2>
        <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-6)' }}>
          Contact us to schedule a service request. Our team will get back to you with a quote.
        </p>
        <a href="/contact" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
          Contact Us
        </a>
      </div>
    </div>
  )
}
