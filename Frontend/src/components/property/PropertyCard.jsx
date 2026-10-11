import { Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Maximize } from 'lucide-react'
import { formatBDT } from '../../utils/currency.js'
import { Badge } from '../common/Badge.jsx'

export function PropertyCard({ property }) {
  const listing = property.listings?.[0]
  const coverImage = listing?.cover_image || property.cover_image

  return (
    <Link
      to={`/properties/${property.id}`}
      className="card"
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
      <div style={{ position: 'relative', paddingTop: '60%', background: 'var(--color-neutral-100)' }}>
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
      </div>
      <div className="card-body" style={{ padding: 'var(--space-4)' }}>
        <h4 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-base)' }}>
          {property.title || 'Untitled Property'}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-neutral-500)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
          <MapPin size={14} />
          <span>{property.area || property.city || property.district || 'Location unavailable'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-3)' }}>
          {listing?.bedrooms != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Bed size={14} /> {listing.bedrooms}
            </span>
          )}
          {listing?.bathrooms != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Bath size={14} /> {listing.bathrooms}
            </span>
          )}
          {listing?.size_sqft != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Maximize size={14} /> {listing.size_sqft} sqft
            </span>
          )}
        </div>
        {listing?.monthly_rent != null && (
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-brand-700)' }}>
            {formatBDT(listing.monthly_rent)}
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-normal)', color: 'var(--color-neutral-500)' }}>/month</span>
          </div>
        )}
      </div>
    </Link>
  )
}
