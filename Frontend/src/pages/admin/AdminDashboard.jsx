import { useQuery } from '@tanstack/react-query'
import { Users, Building, KeyRound, Banknote, Wrench, Target, MessageSquare, TrendingUp, TrendingDown, UserCheck, AlertTriangle, Activity } from 'lucide-react'
import { adminDashboardMetrics } from '../../api/admin.api.js'
import { Card, CardBody, CardHeader } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'
import { formatBDT, formatNumber } from '../../utils/currency.js'

const statusVariant = { active: 'success', pending: 'warning', suspended: 'danger', deactivated: 'neutral', paid: 'success', published: 'success', completed: 'success', open: 'danger', rejected: 'danger', draft: 'neutral', approved: 'info', rented: 'info', resolved: 'success' }

function MetricCard({ title, value, subtitle, icon, trend, trendUp, color = 'primary' }) {
  const colorMap = { primary: 'var(--color-primary-50)', success: 'var(--color-success-50)', warning: 'var(--color-warning-50)', danger: 'var(--color-danger-50)', info: 'var(--color-info-50)' }
  return (
    <Card style={{ position: 'relative', overflow: 'hidden' }}>
      <CardBody>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', fontWeight: 'var(--font-medium)' }}>{title}</p>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-neutral-900)' }}>{value}</p>
            {subtitle && <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{subtitle}</p>}
            {trend && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: trendUp ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
                {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {trend}
              </div>
            )}
          </div>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: colorMap[color], display: 'flex', alignItems: 'center', justifyContent: 'center', color: `var(--color-${color}-600)` }}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function ProgressBar({ value, max, color = 'primary', label }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const colorMap = { primary: 'var(--color-primary-500)', success: 'var(--color-success-500)', warning: 'var(--color-warning-500)', danger: 'var(--color-danger-500)' }
  return (
    <div>
      {label && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}><span>{label}</span><span style={{ fontWeight: 'var(--font-medium)' }}>{value}{max !== 100 ? ` / ${max}` : ''}</span></div>}
      <div style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'var(--color-neutral-100)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 'var(--radius-full)', background: colorMap[color], transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

function CategoryBar({ data, colorMap }) {
  const max = Math.max(...Object.values(data), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ width: 100, fontSize: 'var(--text-sm)', textTransform: 'capitalize', color: 'var(--color-neutral-700)' }}>{key.replace(/_/g, ' ')}</span>
          <div style={{ flex: 1, height: 20, borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(value / max) * 100}%`, borderRadius: 'var(--radius-sm)', background: colorMap[key] || 'var(--color-primary-400)', transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ width: 30, textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: () => adminDashboardMetrics(),
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorState title="Failed to load dashboard" message={error.message} onRetry={() => refetch()} />
  if (!data) return null

  const { users, properties, rentals, billing, complaints, leads, services, communications, recent_activity } = data

  const roleColors = { landlord: 'var(--color-info-400)', tenant: 'var(--color-neutral-400)', employee: 'var(--color-warning-400)', superadmin: 'var(--color-danger-400)' }
  const categoryColors = { apartment: 'var(--color-primary-400)', house: 'var(--color-success-400)', duplex: 'var(--color-info-400)', studio: 'var(--color-warning-400)', commercial: 'var(--color-neutral-400)' }

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ margin: 0 }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--color-neutral-600)', margin: 'var(--space-1) 0 0' }}>Welcome back. Here is what is happening across HomeLink today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <MetricCard title="Total Users" value={users.total} subtitle={`${users.phone_verification_rate}% phone verified`} icon={<Users size={24} />} color="primary" />
        <MetricCard title="Properties" value={properties.total_properties} subtitle={`${properties.total_units} units, ${properties.total_listings} listings`} icon={<Building size={24} />} color="success" />
        <MetricCard title="Active Tenancies" value={rentals.active_tenancies} subtitle={`${rentals.total_tenancies} total tenancies`} icon={<KeyRound size={24} />} color="info" />
        <MetricCard title="Revenue Collected" value={formatBDT(billing.total_collected)} subtitle={`${billing.collection_rate}% collection rate`} icon={<Banknote size={24} />} color="warning" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <MetricCard title="Open Complaints" value={complaints.by_status.open || 0} subtitle={`${complaints.total} total, ${complaints.resolution_rate}% resolved`} icon={<AlertTriangle size={24} />} color="danger" />
        <MetricCard title="Active Leads" value={leads.total} subtitle={`${leads.conversion_rate}% conversion rate`} icon={<Target size={24} />} color="info" />
        <MetricCard title="Service Requests" value={services.total} subtitle={`${services.completion_rate}% completed`} icon={<Wrench size={24} />} color="success" />
        <MetricCard title="Avg. Rent" value={formatBDT(properties.avg_monthly_rent)} subtitle="per listing" icon={<TrendingUp size={24} />} color="primary" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <Card>
          <CardHeader><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Users size={18} /> <strong>Users by Role</strong></div></CardHeader>
          <CardBody>
            <CategoryBar data={users.by_role} colorMap={roleColors} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Building size={18} /> <strong>Properties by Category</strong></div></CardHeader>
          <CardBody>
            <CategoryBar data={properties.by_category} colorMap={categoryColors} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Banknote size={18} /> <strong>Billing Summary</strong></div></CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <ProgressBar label="Collection Rate" value={billing.collection_rate} max={100} color="success" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div><p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>Total Invoiced</p><p style={{ margin: 0, fontWeight: 'var(--font-semibold)' }}>{formatBDT(billing.total_invoiced)}</p></div>
                <div><p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>Outstanding</p><p style={{ margin: 0, fontWeight: 'var(--font-semibold)', color: 'var(--color-danger-600)' }}>{formatBDT(billing.total_outstanding)}</p></div>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-2)' }}>Payments by Method</p>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {Object.entries(billing.payments_by_method).map(([method, amount]) => (
                    <Badge key={method} variant="neutral">{method}: {formatBDT(amount)}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><KeyRound size={18} /> <strong>Unit Availability</strong></div></CardHeader>
          <CardBody>
            <CategoryBar data={properties.units_by_availability} colorMap={{ available: 'var(--color-success-400)', reserved: 'var(--color-warning-400)', rented: 'var(--color-info-400)', unavailable: 'var(--color-neutral-400)' }} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><AlertTriangle size={18} /> <strong>Complaints by Category</strong></div></CardHeader>
          <CardBody>
            <CategoryBar data={complaints.by_category} colorMap={{ plumbing: 'var(--color-info-400)', electrical: 'var(--color-warning-400)', security: 'var(--color-danger-400)', cleanliness: 'var(--color-success-400)', noise: 'var(--color-neutral-400)', structural: 'var(--color-primary-400)', billing: 'var(--color-warning-400)', other: 'var(--color-neutral-400)' }} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Target size={18} /> <strong>Lead Funnel</strong></div></CardHeader>
          <CardBody>
            <CategoryBar data={leads.by_status} colorMap={{ new: 'var(--color-info-400)', contacted: 'var(--color-primary-400)', qualified: 'var(--color-success-400)', proposal: 'var(--color-warning-400)', negotiation: 'var(--color-warning-500)', won: 'var(--color-success-500)', lost: 'var(--color-danger-400)' }} />
          </CardBody>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        <Card>
          <CardHeader><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Activity size={18} /> <strong>Recent Users</strong></div></CardHeader>
          <CardBody>
            {recent_activity.recent_users.length === 0 && <p style={{ color: 'var(--color-neutral-500)', margin: 0 }}>No recent registrations.</p>}
            {recent_activity.recent_users.map((u) => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'var(--font-medium)' }}>{u.first_name || u.phone_number}</p>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>{u.phone_number}</p>
                </div>
                <Badge variant={statusVariant[u.account_status] || 'neutral'}>{u.account_status}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Building size={18} /> <strong>Recent Properties</strong></div></CardHeader>
          <CardBody>
            {recent_activity.recent_properties.length === 0 && <p style={{ color: 'var(--color-neutral-500)', margin: 0 }}>No recent properties.</p>}
            {recent_activity.recent_properties.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'var(--font-medium)' }}>{p.title}</p>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', textTransform: 'capitalize' }}>{p.category}</p>
                </div>
                <Badge variant={statusVariant[p.status] || 'neutral'}>{p.status}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><MessageSquare size={18} /> <strong>System Health</strong></div></CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}><MessageSquare size={14} /> Conversations</span>
                <strong>{communications.conversations}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}><MessageSquare size={14} /> Messages</span>
                <strong>{communications.messages}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}><AlertTriangle size={14} /> Unread Notifications</span>
                <Badge variant="warning">{communications.unread_notifications}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}><UserCheck size={14} /> Active Employees</span>
                <Badge variant="success">{users.active_employees}</Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
