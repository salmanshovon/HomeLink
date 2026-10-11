import { useQuery } from '@tanstack/react-query'
import { getMyComplaints } from '../../api/landlords.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { formatDate } from '../../utils/date.js'

export default function LandlordComplaints() {
  const { data, isLoading } = useQuery({
    queryKey: ['landlord-complaints'],
    queryFn: () => getMyComplaints(),
  })

  const results = data?.results || []

  if (isLoading) return <LoadingSpinner label="Loading complaints..." />

  if (results.length === 0) {
    return <EmptyState icon="📝" title="No complaints" description="No complaints have been filed against your properties." />
  }

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Complaints</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {results.map((complaint) => (
          <Card key={complaint.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--space-2)' }}>{complaint.subject}</h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                    {complaint.category_display || complaint.category} | Filed {formatDate(complaint.created_at)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Badge variant={complaint.priority === 'urgent' ? 'danger' : complaint.priority === 'high' ? 'warning' : 'neutral'}>
                    {complaint.priority}
                  </Badge>
                  <Badge variant={complaint.status === 'resolved' ? 'success' : complaint.status === 'closed' ? 'neutral' : 'info'}>
                    {complaint.status_display || complaint.status}
                  </Badge>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{complaint.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
