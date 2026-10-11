import { useQuery } from '@tanstack/react-query'
import { Building, FileText, Users, Calendar, AlertTriangle } from 'lucide-react'
import { getAllProperties, getAllListings, getAllTenancies, getAllViewings, getAllApplications, getAllComplaints } from '../../api/employees.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'

export default function EmployeeOverview() {
  const { data: properties, isLoading: propertiesLoading } = useQuery({ queryKey: ['employee-properties'], queryFn: () => getAllProperties() })
  const { data: listings, isLoading: listingsLoading } = useQuery({ queryKey: ['employee-listings'], queryFn: () => getAllListings() })
  const { data: tenancies, isLoading: tenanciesLoading } = useQuery({ queryKey: ['employee-tenancies'], queryFn: () => getAllTenancies() })
  const { data: viewings, isLoading: viewingsLoading } = useQuery({ queryKey: ['employee-viewings'], queryFn: () => getAllViewings() })
  const { data: applications, isLoading: applicationsLoading } = useQuery({ queryKey: ['employee-applications'], queryFn: () => getAllApplications() })
  const { data: complaints, isLoading: complaintsLoading } = useQuery({ queryKey: ['employee-complaints'], queryFn: () => getAllComplaints() })

  const isLoading = propertiesLoading || listingsLoading || tenanciesLoading || viewingsLoading || applicationsLoading || complaintsLoading

  if (isLoading) return <LoadingSpinner label="Loading operations overview..." />

  const pendingListings = listings?.results?.filter((l) => l.status === 'pending_review') || []
  const pendingViewings = viewings?.results?.filter((v) => v.status === 'requested') || []
  const pendingApplications = applications?.results?.filter((a) => a.status === 'submitted' || a.status === 'under_review') || []
  const openComplaints = complaints?.results?.filter((c) => !['resolved', 'closed'].includes(c.status)) || []

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Operations Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-600)' }}>
              <Building size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{properties?.count || 0}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Total Properties</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-warning-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning-600)' }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{pendingListings.length}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Pending Listings</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-info-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-info-600)' }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{pendingViewings.length}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Pending Viewings</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-success-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success-600)' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>{tenancies?.count || 0}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Active Tenancies</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)' }}>
        <Card>
          <CardBody>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Pending Listing Reviews</h3>
            {pendingListings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {pendingListings.slice(0, 5).map((listing) => (
                  <div key={listing.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{listing.property_title || 'Property'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Ref: {listing.reference}</div>
                    </div>
                    <Badge variant="warning">Pending Review</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No pending reviews" description="All listings have been reviewed." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Recent Applications</h3>
            {pendingApplications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {pendingApplications.slice(0, 5).map((app) => (
                  <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>{app.listing?.property_title || 'Property'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>Applicant: {app.applicant?.first_name || 'N/A'}</div>
                    </div>
                    <Badge variant="info">{app.status_display || app.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No pending applications" description="No applications awaiting review." />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
