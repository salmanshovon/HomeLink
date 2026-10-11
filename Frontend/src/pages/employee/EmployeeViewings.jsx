import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllViewings, confirmViewing, cancelViewing } from '../../api/employees.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'
import { formatDate } from '../../utils/date.js'

export default function EmployeeViewings() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['employee-viewings'],
    queryFn: () => getAllViewings(),
  })

  const confirmMutation = useMutation({
    mutationFn: confirmViewing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee-viewings'] }),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => cancelViewing(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee-viewings'] }),
  })

  const results = data?.results || []

  if (isLoading) return <LoadingSpinner label="Loading viewings..." />
  if (isError) return <ErrorState title="Failed to load viewings" description={error?.message} onRetry={() => refetch()} />

  const requestedViewings = results.filter((v) => v.status === 'requested')

  if (requestedViewings.length === 0) {
    return <EmptyState icon="📅" title="No pending viewings" description="No viewing requests awaiting confirmation." />
  }

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Viewing Management</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {requestedViewings.map((viewing) => (
          <Card key={viewing.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--space-2)' }}>{viewing.listing?.property_title || 'Property'}</h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                    Requested by: {viewing.customer?.first_name || viewing.guest_name || 'Guest'}
                  </p>
                </div>
                <Badge variant="warning">{viewing.status_display || viewing.status}</Badge>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>
                <p style={{ margin: '0 0 var(--space-1)' }}><strong>Requested:</strong> {formatDate(viewing.requested_datetime)}</p>
                {viewing.guest_phone && <p style={{ margin: 0 }}><strong>Phone:</strong> {viewing.guest_phone}</p>}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button size="sm" onClick={() => confirmMutation.mutate(viewing.id)} loading={confirmMutation.isPending}>
                  Confirm
                </Button>
                <Button size="sm" variant="danger" onClick={() => cancelMutation.mutate({ id: viewing.id, reason: 'Cancelled by staff' })} loading={cancelMutation.isPending}>
                  Cancel
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
