import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllApplications, approveApplication, rejectApplication } from '../../api/employees.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'
import { formatDate } from '../../utils/date.js'

export default function EmployeeApplications() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['employee-applications'],
    queryFn: () => getAllApplications(),
  })

  const approveMutation = useMutation({
    mutationFn: approveApplication,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee-applications'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectApplication(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee-applications'] }),
  })

  const results = data?.results || []

  if (isLoading) return <LoadingSpinner label="Loading applications..." />
  if (isError) return <ErrorState title="Failed to load applications" description={error?.message} onRetry={() => refetch()} />

  const pendingApplications = results.filter((a) => a.status === 'submitted' || a.status === 'under_review')

  if (pendingApplications.length === 0) {
    return <EmptyState icon="📋" title="No pending applications" description="No rental applications awaiting review." />
  }

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Application Processing</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {pendingApplications.map((app) => (
          <Card key={app.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--space-2)' }}>{app.listing?.property_title || 'Property'}</h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                    Applicant: {app.applicant?.first_name || 'N/A'} | Move-in: {formatDate(app.requested_move_in_date)}
                  </p>
                </div>
                <Badge variant={app.status === 'under_review' ? 'info' : 'warning'}>{app.status_display || app.status}</Badge>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>
                <p style={{ margin: '0 0 var(--space-1)' }}><strong>Proposed Rent:</strong> {app.proposed_rent ? `৳${app.proposed_rent}` : 'N/A'}</p>
                {app.notes && <p style={{ margin: 0 }}><strong>Notes:</strong> {app.notes}</p>}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button size="sm" onClick={() => approveMutation.mutate(app.id)} loading={approveMutation.isPending}>
                  Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => rejectMutation.mutate({ id: app.id, reason: 'Rejected by staff' })} loading={rejectMutation.isPending}>
                  Reject
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
