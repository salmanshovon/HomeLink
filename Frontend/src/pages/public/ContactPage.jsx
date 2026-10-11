import { useState } from 'react'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: 'var(--space-12)' }}>
          <h2 style={{ color: 'var(--color-success-600)' }}>Message Sent!</h2>
          <p style={{ color: 'var(--color-neutral-600)' }}>
            Thank you for reaching out. Our team will get back to you within 1-2 business days.
          </p>
          <button className="btn btn-primary" onClick={() => setSubmitted(false)}>
            Send Another Message
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
        <h1>Contact Us</h1>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-neutral-600)', maxWidth: '600px', margin: '0 auto' }}>
          Have a question or need assistance? We're here to help.
        </p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} className="card" style={{ padding: 'var(--space-8)' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label htmlFor="contact-name" style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
              Name <span style={{ color: 'var(--color-danger-600)' }}>*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label htmlFor="contact-email" style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
              Email <span style={{ color: 'var(--color-danger-600)' }}>*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              required
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label htmlFor="contact-subject" style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
              Subject <span style={{ color: 'var(--color-danger-600)' }}>*</span>
            </label>
            <input
              id="contact-subject"
              type="text"
              required
              className="input"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label htmlFor="contact-message" style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
              Message <span style={{ color: 'var(--color-danger-600)' }}>*</span>
            </label>
            <textarea
              id="contact-message"
              required
              rows={5}
              className="textarea"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full">
            Send Message
          </button>
        </form>
      </div>
    </div>
  )
}
