import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Building, FileText, Users, CreditCard, AlertTriangle } from 'lucide-react'
import { getMyProperties, getMyListings, getMyTenancies, getMyInvoices, getMyComplaints } from '../../api/landlords.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'

export default function LandlordOverview() {
  const { data: properties, isLoading: propertiesLoading } = useQuery({ queryKey: ['landlord-properties'], queryFn: () => getMyProperties() })
  const { data: listings, isLoading: listingsLoading } = useQuery({ queryKey: ['landlord-listings'], queryFn: () => getMyListings() })
  const { data: tenancies, isLoading: tenanciesLoading } = useQuery({ queryKey: ['landlord-tenancies'], queryFn: () => getMyTenancies() })
  const { data: invoices, isLoading: invoicesLoading } = useQuery({ queryKey: ['landlord-invoices'], queryFn: () => getMyInvoices() })
  const { data: complaints, isLoading: complaintsLoading } = useQuery({ queryKey: ['landlord-complaints'], queryFn: () => getMyComplaints() })

  const isLoading = propertiesLoading || listingsLoading || tenanciesLoading || invoicesLoading || complaintsLoading

  if (isLoading) return <LoadingSpinner label="Loading your dashboard..." />

  const activeTenancies = tenancies?.results?.filter((t) => t.status === 'active') || []
  const publishedListings = listings?.results?.filter((l) => l.status === 'published') || []
  const pendingInvoices = invoices?.results?.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled') || []
  const openComplaints = complaints?.results?.filter((c) => !['resolved', 'closed'].includes(c.status)) || []

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-600)' }}>
              <Building size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{properties?.results?.length || 0}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Properties</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-info-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-info-600)' }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{publishedListings.length}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Published Listings</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-success-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success-600)' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{activeTenancies.length}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Active Tenancies</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-warning-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning-600)' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{pendingInvoices.length}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Pending Invoices</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)' }}>
        <Card>
          <CardBody>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Recent Properties</h3>
            {properties?.results?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {properties.results.slice(0, 3).map((prop) => (
                  <div key={prop.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{prop.title}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{prop.area}, {prop.city}</div>
                    </div>
                    <Badge variant={prop.ownership_verified ? 'success' : 'warning'}>
                      {prop.ownership_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                ))}
                <Link to="/landlord/properties" style={{ fontSize: 'var(--text-sm)' }}>View all properties</Link>
              </div>
            ) : (
              <EmptyState title="No properties" description="Add your first property to get started." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Open Complaints</h3>
            {openComplaints.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {openComplaints.slice(0, 3).map((c) => (
                  <div key={c.id} style={{ padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{c.subject}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>{c.category_display || c.category} | {c.status_display || c.status}</div>
                  </div>
                ))}
                <Link to="/landlord/complaints" style={{ fontSize: 'var(--text-sm)' }}>View all complaints</Link>
              </div>
            ) : (
              <EmptyState title="No open complaints" description="All complaints have been resolved." />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
