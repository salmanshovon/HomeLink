import { Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Maximize, Users } from 'lucide-react'
import { formatBDT } from '../../utils/currency.js'
import { formatLocation } from '../../utils/location.js'
import { Badge } from '../common/Badge.jsx'

const PREFERRED_TENANT_LABELS = {
  family: 'Family',
  bachelor: 'Bachelor',
  corporate: 'Corporate',
  student: 'Student',
}

function preferredLabel(value) {
  if (!value || value === 'no_preference') return null
  return PREFERRED_TENANT_LABELS[value] || value
}

export function PropertyCard({ property }) {
  // Search results are flat listings (PublicListingSerializer); property detail
  // pages pass a Property with a nested listings array. Normalise both shapes.
  const listing = Array.isArray(property.listings) ? property.listings[0] : property

  const coverImage = listing?.cover_image || property.cover_image
  const propertyId = listing?.property_id || property.property_id || property.id
  const rent = listing?.monthly_rent
  const bedrooms = listing?.bedrooms ?? listing?.unit?.bedrooms
  const bathrooms = listing?.bathrooms ?? listing?.unit?.bathrooms
  const sizeSqft = listing?.size_sqft ?? listing?.unit?.size_sqft
  const preferred = preferredLabel(listing?.preferred_tenant)

  const location = formatLocation(property)

  const facts = [
    bedrooms != null ? `${bedrooms} bed${bedrooms === 1 ? '' : 's'}` : null,
    bathrooms != null ? `${bathrooms} bath${bathrooms === 1 ? '' : 's'}` : null,
    sizeSqft != null ? `${sizeSqft} sqft` : null,
  ].filter(Boolean)

  const hoverSummary = facts.join(' \u00b7 ')
  const titleText = [
    facts.length > 0 ? facts.join(', ') : null,
    preferred ? `Preferred: ${preferred}` : null,
  ]
    .filter(Boolean)
    .join(' \u2014 ')

  return (
    <Link
      to={`/properties/${propertyId}`}
      className="card"
      title={titleText || undefined}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      <div style={{ position: 'relative', paddingTop: '62%', background: 'var(--color-neutral-100)' }}>
        {coverImage ? (
          <img
            src={coverImage}
            alt={property.title || 'Property'}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-neutral-400)' }}>
            No image
          </div>
        )}

        {listing?.status && (
          <div style={{ position: 'absolute', top: 'var(--space-3)', left: 'var(--space-3)' }}>
            <Badge variant="success">{listing.status_display || 'Available'}</Badge>
          </div>
        )}

        {/* Hover overlay with bed / bath / size details */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 'var(--space-3)',
            background: 'linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0))',
            color: '#fff',
            opacity: 0,
            transition: 'opacity var(--transition-fast)',
            pointerEvents: 'none',
          }}
          className="property-card-overlay"
        >
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            {bedrooms != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Bed size={14} /> {bedrooms}
              </span>
            )}
            {bathrooms != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Bath size={14} /> {bathrooms}
              </span>
            )}
            {sizeSqft != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Maximize size={14} /> {sizeSqft} sqft
              </span>
            )}
          </div>
          {preferred && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
              <Users size={13} /> Preferred: {preferred}
            </div>
          )}
        </div>
      </div>

      <div className="card-body" style={{ padding: 'var(--space-4)' }}>
        {/* Rent as the card title */}
        {rent != null && (
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-brand-700)', marginBottom: 'var(--space-2)' }}>
            {formatBDT(rent)}
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-normal)', color: 'var(--color-neutral-500)' }}>/month</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)' }}>
          <MapPin size={14} style={{ flexShrink: 0 }} />
          <span>{location}</span>
        </div>

        {hoverSummary && (
          <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)' }}>
            {hoverSummary}
          </div>
        )}
      </div>

      <style>{`
        .property-card:hover .property-card-overlay { opacity: 1; }
      `}</style>
    </Link>
  )
}