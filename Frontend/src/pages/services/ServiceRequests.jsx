import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import { getServiceRequests } from '../../api/services.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { Select } from '../../components/common/Select.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'
import { Wrench, Eye } from 'lucide-react'

const statusVariant = {
  submitted: 'info', reviewing: 'warning', quoted: 'info', accepted: 'success',
  scheduled: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger',
}

export default function ServiceRequests() {
  const location = useLocation()
  const basePath = location.pathname.startsWith('/landlord') ? '/landlord'
    : location.pathname.startsWith('/admin') ? '/admin'
    : location.pathname.startsWith('/employee') ? '/employee'
    : '/tenant'
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['service-requests', statusFilter],
    queryFn: () => getServiceRequests(statusFilter ? { status: statusFilter } : {}),
  })

  if (isLoading) return <LoadingSpinner label="Loading service requests..." />
  if (isError) return <ErrorState title="Failed to load requests" message={error?.message} onRetry={() => refetch()} />

  const results = data?.results || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ margin: 0 }}>My Service Requests</h1>
          <p style={{ color: 'var(--color-neutral-600)', margin: 'var(--space-1) 0 0' }}>Track and manage your service requests</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 160 }}>
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="reviewing">Reviewing</option>
            <option value="quoted">Quoted</option>
            <option value="accepted">Accepted</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {results.length === 0 && (
        <Card>
          <EmptyState
            icon={<Wrench size={28} />}
            title="No service requests"
            description="You haven't submitted any service requests yet. Browse our services to get started."
            action={<Link to={`${basePath}/services/categories`}><Button variant="outline">Browse Services</Button></Link>}
          />
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {results.map((request) => (
          <Card key={request.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--space-1)' }}>{request.category?.name || 'Service'}</h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                    Submitted {formatDate(request.created_at)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <Badge variant={statusVariant[request.status] || 'neutral'}>{request.status_display || request.status}</Badge>
                  <Link to={`${basePath}/services/requests/${request.id}`}>
                    <Button variant="ghost" size="sm"><Eye size={14} /> View</Button>
                  </Link>
                </div>
              </div>

              <p style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{request.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                {request.service_address && <div><span style={{ color: 'var(--color-neutral-500)' }}>Address:</span> {request.service_address}</div>}
                {request.preferred_datetime && <div><span style={{ color: 'var(--color-neutral-500)' }}>Preferred:</span> {formatDate(request.preferred_datetime)}</div>}
                {request.estimated_price && <div><span style={{ color: 'var(--color-neutral-500)' }}>Estimated:</span> {formatBDT(request.estimated_price)}</div>}
                {request.final_price && <div><span style={{ color: 'var(--color-neutral-500)' }}>Final:</span> {formatBDT(request.final_price)}</div>}
                {request.assigned_employee_name && <div><span style={{ color: 'var(--color-neutral-500)' }}>Assigned:</span> {request.assigned_employee_name}</div>}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
