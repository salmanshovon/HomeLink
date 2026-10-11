import { useQuery } from '@tanstack/react-query'
import { getMyViewings } from '../../api/tenants.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { formatDate } from '../../utils/date.js'

export default function TenantViewings() {
  const { data, isLoading } = useQuery({
    queryKey: ['tenant-viewings'],
    queryFn: () => getMyViewings(),
  })

  const results = data?.results || []

  if (isLoading) return <LoadingSpinner label="Loading viewings..." />

  if (results.length === 0) {
    return <EmptyState icon="📅" title="No viewings" description="You haven't requested any property viewings yet." />
  }

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>My Viewings</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {results.map((viewing) => (
          <Card key={viewing.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--space-2)' }}>{viewing.listing?.property_title || 'Property'}</h3>
                  <p style={{ margin: 0, color: 'var(--color-neutral-600)', fontSize: 'var(--text-sm)' }}>
                    {viewing.listing?.property ? [viewing.listing.property.area, viewing.listing.property.city].filter(Boolean).join(', ') : ''}
                  </p>
                </div>
                <Badge variant={viewing.status === 'confirmed' ? 'success' : viewing.status === 'completed' ? 'info' : viewing.status === 'cancelled' ? 'danger' : 'warning'}>
                  {viewing.status_display || viewing.status}
                </Badge>
              </div>
              <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
                <p style={{ margin: '0 0 var(--space-1)' }}><strong>Requested:</strong> {formatDate(viewing.requested_datetime)}</p>
                {viewing.confirmed_datetime && <p style={{ margin: 0 }}><strong>Confirmed:</strong> {formatDate(viewing.confirmed_datetime)}</p>}
              </div>
              {viewing.meeting_instructions && (
                <p style={{ margin: 'var(--space-4) 0 0', fontSize: 'var(--text-sm)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                  {viewing.meeting_instructions}
                </p>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
