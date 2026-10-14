import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, User, FileText, DollarSign, Calendar, CheckCircle2, MessageSquare } from 'lucide-react'
import { getServiceRequest } from '../../api/services.api.js'
import { Button } from '../../components/common/Button.jsx'
import { Card, CardBody, CardHeader } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'

const statusVariant = {
  submitted: 'info', reviewing: 'warning', quoted: 'info', accepted: 'success',
  scheduled: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger',
}

const eventTypeIcon = {
  status_change: <Clock size={14} />,
  note_added: <MessageSquare size={14} />,
  quote_submitted: <DollarSign size={14} />,
  quote_accepted: <CheckCircle2 size={14} />,
  appointment_scheduled: <Calendar size={14} />,
  appointment_completed: <CheckCircle2 size={14} />,
  price_updated: <DollarSign size={14} />,
  assigned: <User size={14} />,
  created: <FileText size={14} />,
}

const eventTypeColor = {
  status_change: 'var(--color-info-100)',
  note_added: 'var(--color-neutral-100)',
  quote_submitted: 'var(--color-success-100)',
  quote_accepted: 'var(--color-success-100)',
  appointment_scheduled: 'var(--color-info-100)',
  appointment_completed: 'var(--color-success-100)',
  price_updated: 'var(--color-warning-100)',
  assigned: 'var(--color-primary-100)',
  created: 'var(--color-neutral-100)',
}

export default function ServiceRequestHistory() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/landlord') ? '/landlord'
    : location.pathname.startsWith('/admin') ? '/admin'
    : location.pathname.startsWith('/employee') ? '/employee'
    : '/tenant'

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['service-request', requestId],
    queryFn: () => getServiceRequest(requestId),
  })

  if (isLoading) return <LoadingSpinner label="Loading service request..." />
  if (error) return <ErrorState title="Failed to load request" message={error.message} onRetry={() => refetch()} />
  if (!data) return null

  const request = data
  const history = request.history || []

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} /> Back
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ margin: 0 }}>{request.category?.name || 'Service Request'}</h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', alignItems: 'center' }}>
            <Badge variant={statusVariant[request.status] || 'neutral'}>{request.status_display || request.status}</Badge>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
              Submitted {formatDate(request.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <Card>
          <CardHeader><strong>Request Details</strong></CardHeader>
          <CardBody>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)', margin: 0 }}>
              <dt style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Contact</dt>
              <dd style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{request.contact_name || request.customer?.first_name || '—'}</dd>
              <dt style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Phone</dt>
              <dd style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{request.contact_phone || request.customer?.phone_number || '—'}</dd>
              <dt style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Address</dt>
              <dd style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{request.service_address || '—'}</dd>
              {request.preferred_datetime && (
                <>
                  <dt style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Preferred</dt>
                  <dd style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{formatDate(request.preferred_datetime)}</dd>
                </>
              )}
              {request.assigned_employee_name && (
                <>
                  <dt style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Assigned To</dt>
                  <dd style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{request.assigned_employee_name}</dd>
                </>
              )}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><strong>Pricing</strong></CardHeader>
          <CardBody>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>Estimated Price</p>
                <p style={{ margin: 0, fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)' }}>
                  {request.estimated_price ? formatBDT(request.estimated_price) : '—'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>Final Price</p>
                <p style={{ margin: 0, fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)' }}>
                  {request.final_price ? formatBDT(request.final_price) : '—'}
                </p>
              </div>
            </div>
            {request.customer_notes && (
              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Your Notes</p>
                <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)' }}>{request.customer_notes}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Clock size={18} /> <strong>Service History Timeline</strong></div></CardHeader>
        <CardBody>
          {history.length === 0 && (
            <p style={{ color: 'var(--color-neutral-500)', margin: 0, textAlign: 'center' }}>No history yet.</p>
          )}
          <div style={{ position: 'relative', paddingLeft: 'var(--space-8)' }}>
            <div style={{ position: 'absolute', left: 14, top: 0, bottom: 0, width: 2, background: 'var(--color-neutral-200)' }} />
            {history.map((event) => (
              <div key={event.id} style={{ position: 'relative', marginBottom: 'var(--space-6)' }}>
                <div style={{ position: 'absolute', left: 'calc(-1 * var(--space-8) + 7px)', top: 4, width: 16, height: 16, borderRadius: '50%', background: eventTypeColor[event.event_type] || 'var(--color-neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-neutral-0)' }}>
                  {eventTypeIcon[event.event_type] || <Clock size={10} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', textTransform: 'capitalize' }}>
                    {event.event_type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                    {formatDate(event.created_at)}
                  </span>
                </div>
                {event.from_status && event.to_status && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <Badge variant={statusVariant[event.from_status] || 'neutral'}>{event.from_status}</Badge>
                    <span style={{ color: 'var(--color-neutral-400)' }}>→</span>
                    <Badge variant={statusVariant[event.to_status] || 'neutral'}>{event.to_status}</Badge>
                  </div>
                )}
                {event.notes && (
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)' }}>{event.notes}</p>
                )}
                {event.actor_name && (
                  <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                    by {event.actor_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
