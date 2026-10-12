import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPropertyDetails, getPropertyMedia, createInquiry, toggleSaveProperty } from '../../api/properties.api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'
import { formatLocation } from '../../utils/location.js'
import { Badge } from '../../components/common/Badge.jsx'
import { Button } from '../../components/common/Button.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'

// Set when a guest clicks "Save" so the property can be saved automatically
// once they sign in. sessionStorage so it survives the login round-trip.
const PENDING_SAVE_KEY = 'homelink:pending-save'

export default function PropertyDetailsPage() {
  const { id } = useParams()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [activeImage, setActiveImage] = useState(0)
  const [inquiryForm, setInquiryForm] = useState({ guest_name: '', guest_phone: '', message: '' })
  const [inquirySent, setInquirySent] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // Only auto-save once per mount.
  const autoSaveDone = useRef(false)

  const isStaff = user && (user.roles?.some(r => ['SUPERADMIN', 'EMPLOYEE'].includes(r.toUpperCase())))

  const { data: property, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['property', id],
    queryFn: () => getPropertyDetails(id),
    retry: 1,
  })

  const { data: media } = useQuery({
    queryKey: ['property-media', id],
    queryFn: () => getPropertyMedia(id),
    enabled: !!id,
  })

  const listing = property?.listings?.[0]
  const images = media?.length > 0 ? media : (listing?.cover_image ? [{ file: listing.cover_image, media_type: 'image' }] : [])

  // After the guest signs in and lands back here, finish what they started.
  useEffect(() => {
    if (!isAuthenticated || !id || autoSaveDone.current) return
    const pending = sessionStorage.getItem(PENDING_SAVE_KEY)
    if (pending !== id) return

    autoSaveDone.current = true
    sessionStorage.removeItem(PENDING_SAVE_KEY)
    setIsSaving(true)
    toggleSaveProperty(id)
      .then(() => { setSaved(true); refetch() })
      .catch((err) => setSaveError(err.message || 'Could not save this property.'))
      .finally(() => setIsSaving(false))
  }, [isAuthenticated, id, refetch])

  const handleInquirySubmit = async (e) => {
    e.preventDefault()
    try {
      await createInquiry(id, {
        ...inquiryForm,
        ...(isAuthenticated ? {} : { guest_name: inquiryForm.guest_name, guest_phone: inquiryForm.guest_phone }),
      })
      setInquirySent(true)
    } catch {
      // Error handled by mutation
    }
  }

  const handleSave = async () => {
    setSaveError('')

    // Guests are sent to sign in; the pending-save flag completes the action
    // once they return authenticated.
    if (!isAuthenticated) {
      sessionStorage.setItem(PENDING_SAVE_KEY, id)
      navigate('/auth/login', { state: { from: `/properties/${id}` }, replace: true })
      return
    }

    setIsSaving(true)
    try {
      await toggleSaveProperty(id)
      setSaved(true)
      refetch()
    } catch (err) {
      setSaveError(err.message || 'Failed to save property')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <LoadingSpinner label="Loading property details..." />
  if (isError) return <ErrorState title="Property not found" description={error?.message || 'This property may have been removed.'} onRetry={() => refetch()} />
  if (!property) return <EmptyState title="Property not found" description="This property may have been removed or is no longer available." />

  return (
    <div className="container" style={{ padding: 'var(--space-8) 0' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link to="/search" style={{ fontSize: 'var(--text-sm)' }}>&larr; Back to search</Link>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
        {/* Main content */}
        <div style={{ flex: '1 1 600px', minWidth: 0 }}>
          {/* Image gallery */}
          {images.length > 0 && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--color-neutral-100)', aspectRatio: '16/10' }}>
                <img src={images[activeImage]?.file} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', overflowX: 'auto' }}>
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setActiveImage(idx)}
                      style={{ flex: '0 0 80px', height: '60px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: idx === activeImage ? '2px solid var(--color-brand-600)' : '2px solid transparent', cursor: 'pointer', padding: 0 }}
                    >
                      <img src={img.file} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Property info */}
          <h1 style={{ marginBottom: 'var(--space-4)' }}>{property.title}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
            <Badge variant="success">{listing?.status_display || 'Available'}</Badge>
            {property.ownership_verified && <Badge variant="info">Verified</Badge>}
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Ref: {listing?.reference || property.reference}</span>
          </div>

          {/* Location */}
          <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Location</h3>
            <p style={{ margin: 0, color: 'var(--color-neutral-600)' }}>
              {formatLocation(property)}
            </p>
            {property.landmark && (
              <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                Near: {property.landmark}
              </p>
            )}
          </div>

          {/* Private details - staff only */}
          {isStaff && (
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', border: '1px solid var(--color-brand-200)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-brand-700)' }}>Staff Only — Full Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                {property.full_private_address && <div><strong>Full Address:</strong> {property.full_private_address}</div>}
                {property.house_number && <div><strong>House:</strong> {property.house_number}</div>}
                {property.building_name && <div><strong>Building:</strong> {property.building_name}</div>}
                {property.road_number && <div><strong>Road:</strong> {property.road_number}</div>}
                {property.society_name && <div><strong>Society:</strong> {property.society_name}</div>}
                {property.division && <div><strong>Division:</strong> {property.division}</div>}
                {property.postal_code && <div><strong>Postal Code:</strong> {property.postal_code}</div>}
                {property.landlord_name && <div><strong>Landlord:</strong> {property.landlord_name}</div>}
              </div>
              {property.contacts?.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <h4 style={{ marginBottom: 'var(--space-3)' }}>Owner Contacts</h4>
                  {property.contacts.map((contact) => (
                    <div key={contact.id} style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                      <div><strong>{contact.contact_name}</strong> ({contact.contact_type})</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
                        Phone: {contact.primary_phone}
                        {contact.alternate_phone && ` | Alt: ${contact.alternate_phone}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Features */}
          {listing && (
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Features</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-4)' }}>
                {listing.bedrooms != null && <div><strong>Bedrooms:</strong> {listing.bedrooms}</div>}
                {listing.bathrooms != null && <div><strong>Bathrooms:</strong> {listing.bathrooms}</div>}
                {listing.size_sqft != null && <div><strong>Size:</strong> {listing.size_sqft} sqft</div>}
                {listing.furnishing && <div><strong>Furnishing:</strong> {listing.furnishing.replace(/_/g, ' ')}</div>}
                {property.category && <div><strong>Type:</strong> {property.category.replace(/_/g, ' ')}</div>}
                {listing.availability_date && <div><strong>Available from:</strong> {formatDate(listing.availability_date)}</div>}
              </div>
            </div>
          )}

          {/* Description */}
          {listing?.description && (
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Description</h3>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{listing.description}</p>
            </div>
          )}

          {/* Inquiry form */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Send an Inquiry</h3>
            {inquirySent ? (
              <div style={{ padding: 'var(--space-4)', background: 'var(--color-success-50)', borderRadius: 'var(--radius-md)', color: 'var(--color-success-700)' }}>
                Your inquiry has been sent. Our team will contact you soon.
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit}>
                {!isAuthenticated && (
                  <>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label htmlFor="inquiry-name" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Your Name *</label>
                      <input id="inquiry-name" type="text" className="input" required value={inquiryForm.guest_name} onChange={(e) => setInquiryForm({ ...inquiryForm, guest_name: e.target.value })} />
                    </div>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label htmlFor="inquiry-phone" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Your Phone *</label>
                      <input id="inquiry-phone" type="tel" className="input" required value={inquiryForm.guest_phone} onChange={(e) => setInquiryForm({ ...inquiryForm, guest_phone: e.target.value })} />
                    </div>
                  </>
                )}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label htmlFor="inquiry-message" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Message *</label>
                  <textarea id="inquiry-message" className="textarea" required rows={4} value={inquiryForm.message} onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} />
                </div>
                <Button type="submit">Send Inquiry</Button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ flex: '0 0 320px' }}>
          {/* Rent card */}
          {listing?.monthly_rent != null && (
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', position: 'sticky', top: 'calc(var(--header-height) + var(--space-4))' }}>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-brand-700)' }}>
                  {formatBDT(listing.monthly_rent)}
                </div>
                <div style={{ color: 'var(--color-neutral-500)' }}>per month</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                {listing.service_charge != null && listing.service_charge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--color-neutral-600)' }}>Service charge</span>
                    <span>{formatBDT(listing.service_charge)}</span>
                  </div>
                )}
                {listing.security_deposit != null && listing.security_deposit > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--color-neutral-600)' }}>Security deposit</span>
                    <span>{formatBDT(listing.security_deposit)}</span>
                  </div>
                )}
                {listing.advance_months != null && listing.advance_months > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--color-neutral-600)' }}>Advance</span>
                    <span>{listing.advance_months} month{listing.advance_months > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSave}
                variant={saved ? 'primary' : 'outline'}
                className="btn-full"
                disabled={isSaving || saved}
                style={{ marginBottom: 'var(--space-3)' }}
              >
                {isSaving ? 'Saving…' : saved ? 'Saved' : isAuthenticated ? 'Save Property' : 'Sign in to save'}
              </Button>
              {saveError && <p style={{ color: 'var(--color-danger-600)', fontSize: 'var(--text-sm)', margin: 'var(--space-2) 0 0' }}>{saveError}</p>}

              {listing.preferred_tenant && listing.preferred_tenant !== 'no_preference' && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', textAlign: 'center', margin: 'var(--space-4) 0 0' }}>
                  Preferred: {listing.preferred_tenant}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
