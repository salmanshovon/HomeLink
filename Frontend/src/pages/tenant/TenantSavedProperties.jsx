import { useQuery } from '@tanstack/react-query'
import { getSavedProperties } from '../../api/properties.api.js'
import { PropertyCard } from '../../components/property/PropertyCard.jsx'
import { SkeletonCard } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'

export default function TenantSavedProperties() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['saved-properties'],
    queryFn: () => getSavedProperties(),
  })

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (isError) return <ErrorState title="Failed to load saved properties" description={error?.message} onRetry={() => refetch()} />

  const results = data?.results || []

  if (results.length === 0) {
    return <EmptyState icon="🔖" title="No saved properties" description="Properties you save will appear here for quick access." />
  }

  // Each result is { id, listing, created_at }, where `listing` is a
  // PublicListingSerializer. PropertyCard handles that flat shape, so pass it
  // straight through instead of a non-existent nested `property` object.
  const cards = results.map((item) => item.listing).filter(Boolean)

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Saved Properties</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
        {cards.map((listing) => (
          <PropertyCard key={listing.id} property={listing} />
        ))}
      </div>
    </div>
  )
}
