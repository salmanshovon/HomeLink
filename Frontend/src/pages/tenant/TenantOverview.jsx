import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Home, CreditCard, Calendar, MessageSquare, AlertTriangle } from 'lucide-react'
import { getMyTenancies, getMyInvoices, getMyViewings, getMyComplaints, getMyNotifications } from '../../api/tenants.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'

export default function TenantOverview() {
  const { data: tenancies, isLoading: tenanciesLoading } = useQuery({ queryKey: ['tenant-tenancies'], queryFn: () => getMyTenancies() })
  const { data: invoices, isLoading: invoicesLoading } = useQuery({ queryKey: ['tenant-invoices'], queryFn: () => getMyInvoices() })
  const { data: viewings, isLoading: viewingsLoading } = useQuery({ queryKey: ['tenant-viewings'], queryFn: () => getMyViewings() })
  const { data: complaints, isLoading: complaintsLoading } = useQuery({ queryKey: ['tenant-complaints'], queryFn: () => getMyComplaints() })
  const { data: notifications, isLoading: notificationsLoading } = useQuery({ queryKey: ['tenant-notifications'], queryFn: () => getMyNotifications() })

  const isLoading = tenanciesLoading || invoicesLoading || viewingsLoading || complaintsLoading || notificationsLoading

  if (isLoading) return <LoadingSpinner label="Loading your dashboard..." />

  const activeTenancy = tenancies?.results?.find((t) => t.status === 'active')
  const unpaidInvoices = invoices?.results?.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled') || []
  const upcomingViewings = viewings?.results?.filter((v) => v.status === 'confirmed' || v.status === 'requested') || []
  const openComplaints = complaints?.results?.filter((c) => !['resolved', 'closed'].includes(c.status)) || []
  const unreadNotifications = notifications?.results?.filter((n) => !n.is_read) || []

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Overview</h1>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-600)' }}>
              <Home size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{activeTenancy ? '1' : '0'}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Active Tenancy</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-warning-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning-600)' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{unpaidInvoices.length}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Unpaid Invoices</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-info-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-info-600)' }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{upcomingViewings.length}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Upcoming Viewings</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-danger-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger-600)' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{openComplaints.length}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Open Complaints</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Active tenancy */}
        <Card>
          <CardBody>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Current Tenancy</h3>
            {activeTenancy ? (
              <div>
                <p style={{ margin: '0 0 var(--space-2)' }}><strong>Property:</strong> {activeTenancy.unit?.property?.title || 'N/A'}</p>
                <p style={{ margin: '0 0 var(--space-2)' }}><strong>Rent:</strong> {formatBDT(activeTenancy.monthly_rent)}/month</p>
                <p style={{ margin: '0 0 var(--space-2)' }}><strong>Started:</strong> {formatDate(activeTenancy.start_date)}</p>
                {activeTenancy.end_date && <p style={{ margin: 0 }}><strong>Ends:</strong> {formatDate(activeTenancy.end_date)}</p>}
              </div>
            ) : (
              <EmptyState title="No active tenancy" description="You don't have an active tenancy at the moment." />
            )}
          </CardBody>
        </Card>

        {/* Outstanding invoices */}
        <Card>
          <CardBody>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Outstanding Invoices</h3>
            {unpaidInvoices.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {unpaidInvoices.slice(0, 3).map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{inv.invoice_number}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Due: {formatDate(inv.due_date)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'var(--font-semibold)' }}>{formatBDT(inv.outstanding_amount)}</div>
                      <Badge variant={inv.status === 'overdue' ? 'danger' : 'warning'}>{inv.status_display}</Badge>
                    </div>
                  </div>
                ))}
                {unpaidInvoices.length > 3 && (
                  <Link to="/tenant/invoices" style={{ fontSize: 'var(--text-sm)' }}>View all {unpaidInvoices.length} invoices</Link>
                )}
              </div>
            ) : (
              <EmptyState title="No outstanding invoices" description="You're all caught up on payments." />
            )}
          </CardBody>
        </Card>

        {/* Upcoming viewings */}
        <Card>
          <CardBody>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Upcoming Viewings</h3>
            {upcomingViewings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {upcomingViewings.slice(0, 3).map((v) => (
                  <div key={v.id} style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{v.listing?.property_title || 'Property'}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{formatDate(v.requested_datetime)}</div>
                    <Badge variant={v.status === 'confirmed' ? 'success' : 'info'}>{v.status_display}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No upcoming viewings" description="You have no viewing appointments scheduled." />
            )}
          </CardBody>
        </Card>

        {/* Recent notifications */}
        <Card>
          <CardBody>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Recent Notifications</h3>
            {unreadNotifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {unreadNotifications.slice(0, 3).map((n) => (
                  <div key={n.id} style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                    <div style={{ fontWeight: 'var(--font-medium)' }}>{n.title}</div>
                    <div style={{ color: 'var(--color-neutral-600)', fontSize: 'var(--text-xs)' }}>{n.body?.substring(0, 80)}...</div>
                  </div>
                ))}
                <Link to="/tenant/notifications" style={{ fontSize: 'var(--text-sm)' }}>View all notifications</Link>
              </div>
            ) : (
              <EmptyState title="No new notifications" description="You're all caught up." />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
