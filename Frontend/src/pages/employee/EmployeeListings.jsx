import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllListings, approveListing, rejectListing } from '../../api/employees.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'

export default function EmployeeListings() {
  const queryClient = useQueryClient()
  const [rejectingListing, setRejectingListing] = useState(null)
  const [rejectNote, setRejectNote] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['employee-listings'],
    queryFn: () => getAllListings(),
  })

  const approveMutation = useMutation({
    mutationFn: approveListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee-listings'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }) => rejectListing(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-listings'] })
      setRejectingListing(null)
      setRejectNote('')
    },
  })

  const results = data?.results || []

  if (isLoading) return <LoadingSpinner label="Loading listings..." />
  if (isError) return <ErrorState title="Failed to load listings" description={error?.message} onRetry={() => refetch()} />

  const pendingListings = results.filter((l) => l.status === 'pending_review')

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Listing Moderation</h1>

      {pendingListings.length === 0 ? (
        <EmptyState icon="✅" title="No pending listings" description="All listings have been reviewed." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {pendingListings.map((listing) => (
            <Card key={listing.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 var(--space-2)' }}>{listing.property_title || 'Property'}</h3>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                      Ref: {listing.reference} | Submitted by: {listing.property?.landlord_name || 'Landlord'}
                    </p>
                  </div>
                  <Badge variant="warning">{listing.status_display || listing.status}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                  <div><span style={{ color: 'var(--color-neutral-500)' }}>Rent:</span> {formatBDT(listing.monthly_rent)}/mo</div>
                  {listing.service_charge > 0 && <div><span style={{ color: 'var(--color-neutral-500)' }}>Service:</span> {formatBDT(listing.service_charge)}</div>}
                  {listing.availability_date && <div><span style={{ color: 'var(--color-neutral-500)' }}>Available:</span> {formatDate(listing.availability_date)}</div>}
                </div>
                {listing.description && (
                  <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{listing.description}</p>
                )}
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button size="sm" onClick={() => approveMutation.mutate(listing.id)} loading={approveMutation.isPending}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setRejectingListing(listing)}>
                    Reject
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!rejectingListing}
        onClose={() => { setRejectingListing(null); setRejectNote('') }}
        onConfirm={() => rejectMutation.mutate({ id: rejectingListing.id, note: rejectNote })}
        title="Reject Listing"
        message={`Are you sure you want to reject "${rejectingListing?.property_title}"? The landlord will be notified.`}
        confirmLabel="Reject"
        variant="danger"
        loading={rejectMutation.isPending}
      />
    </div>
  )
}
