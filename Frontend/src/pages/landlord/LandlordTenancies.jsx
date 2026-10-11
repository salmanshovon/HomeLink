import { useQuery } from '@tanstack/react-query'
import { getMyTenancies } from '../../api/landlords.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'

export default function LandlordTenancies() {
  const { data, isLoading } = useQuery({
    queryKey: ['landlord-tenancies'],
    queryFn: () => getMyTenancies(),
  })

  const results = data?.results || []

  if (isLoading) return <LoadingSpinner label="Loading tenancies..." />

  if (results.length === 0) {
    return <EmptyState icon="🏠" title="No tenancies" description="You have no tenant agreements yet." />
  }

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Tenancies</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {results.map((tenancy) => (
          <Card key={tenancy.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--space-2)' }}>{tenancy.unit?.property?.title || 'Property'}</h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                    Tenant: {tenancy.tenant?.first_name || tenancy.tenant?.phone_number || 'N/A'}
                  </p>
                </div>
                <Badge variant={tenancy.status === 'active' ? 'success' : tenancy.status === 'pending' ? 'warning' : 'neutral'}>
                  {tenancy.status_display || tenancy.status}
                </Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                <div><span style={{ color: 'var(--color-neutral-500)' }}>Rent:</span> {formatBDT(tenancy.monthly_rent)}/mo</div>
                <div><span style={{ color: 'var(--color-neutral-500)' }}>Start:</span> {formatDate(tenancy.start_date)}</div>
                {tenancy.end_date && <div><span style={{ color: 'var(--color-neutral-500)' }}>End:</span> {formatDate(tenancy.end_date)}</div>}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
