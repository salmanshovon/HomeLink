import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getServiceRequests, updateServiceRequest } from '../../api/services.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { Select } from '../../components/common/Select.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'

export default function ServiceRequests() {
  const queryClient = useQueryClient()
  const [updatingId, setUpdatingId] = useState(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['service-requests'],
    queryFn: () => getServiceRequests(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateServiceRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      setUpdatingId(null)
    },
  })

  const results = data?.results || []

  if (isLoading) return <LoadingSpinner label="Loading service requests..." />
  if (isError) return <ErrorState title="Failed to load requests" description={error?.message} onRetry={() => refetch()} />

  if (results.length === 0) {
    return <EmptyState icon="🔧" title="No service requests" description="You haven't submitted any service requests yet." />
  }

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>My Service Requests</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {results.map((request) => (
          <Card key={request.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--space-2)' }}>{request.category?.name || 'Service'}</h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                    Submitted: {formatDate(request.created_at)}
                  </p>
                </div>
                <Badge variant={request.status === 'completed' ? 'success' : request.status === 'cancelled' ? 'danger' : 'info'}>
                  {request.status_display || request.status}
                </Badge>
              </div>

              <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{request.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                {request.service_address && <div><span style={{ color: 'var(--color-neutral-500)' }}>Address:</span> {request.service_address}</div>}
                {request.preferred_datetime && <div><span style={{ color: 'var(--color-neutral-500)' }}>Preferred:</span> {formatDate(request.preferred_datetime)}</div>}
                {request.estimated_price && <div><span style={{ color: 'var(--color-neutral-500)' }}>Estimated:</span> {formatBDT(request.estimated_price)}</div>}
                {request.final_price && <div><span style={{ color: 'var(--color-neutral-500)' }}>Final:</span> {formatBDT(request.final_price)}</div>}
              </div>

              {request.internal_notes && (
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                  <strong>Staff Notes:</strong> {request.internal_notes}
                </div>
              )}

              {['submitted', 'reviewing'].includes(request.status) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>Update status:</span>
                  <Select
                    value={request.status}
                    onChange={(e) => {
                      setUpdatingId(request.id)
                      updateMutation.mutate({ id: request.id, payload: { status: e.target.value } })
                    }}
                    style={{ width: 'auto' }}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="quoted">Quoted</option>
                    <option value="accepted">Accepted</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
