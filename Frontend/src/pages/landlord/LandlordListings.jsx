import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyListings, createListing, updateListing, submitListingForReview, getMyProperties } from '../../api/landlords.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Select } from '../../components/common/Select.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'

const emptyForm = {
  property: '',
  unit: '',
  monthly_rent: '',
  security_deposit: '',
  service_charge: '',
  advance_months: '',
  availability_date: '',
  preferred_tenant: 'no_preference',
  description: '',
}

export default function LandlordListings() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingListing, setEditingListing] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['landlord-listings'],
    queryFn: () => getMyListings(),
  })

  const { data: properties } = useQuery({
    queryKey: ['landlord-properties'],
    queryFn: () => getMyProperties(),
  })

  const createMutation = useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-listings'] })
      setShowForm(false)
      setFormData(emptyForm)
    },
    onError: (err) => setFormError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateListing(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-listings'] })
      setEditingListing(null)
      setFormData(emptyForm)
    },
    onError: (err) => setFormError(err.message),
  })

  const submitMutation = useMutation({
    mutationFn: submitListingForReview,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landlord-listings'] }),
  })

  const openCreateForm = () => {
    setFormData(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEditForm = (listing) => {
    setFormData({
      property: listing.property?.id || listing.property || '',
      unit: listing.unit?.id || listing.unit || '',
      monthly_rent: listing.monthly_rent || '',
      security_deposit: listing.security_deposit || '',
      service_charge: listing.service_charge || '',
      advance_months: listing.advance_months || '',
      availability_date: listing.availability_date || '',
      preferred_tenant: listing.preferred_tenant || 'no_preference',
      description: listing.description || '',
    })
    setFormError('')
    setEditingListing(listing)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      property: formData.property || undefined,
      unit: formData.unit || undefined,
      monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : undefined,
      security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : undefined,
      service_charge: formData.service_charge ? parseFloat(formData.service_charge) : undefined,
      advance_months: formData.advance_months ? parseInt(formData.advance_months, 10) : undefined,
    }
    if (editingListing) {
      updateMutation.mutate({ id: editingListing.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const results = data?.results || []
  const propertyResults = properties?.results || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0 }}>Listings</h1>
        <Button onClick={openCreateForm}>Create Listing</Button>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading listings..." />
      ) : isError ? (
        <ErrorState title="Failed to load listings" description={error?.message} onRetry={() => refetch()} />
      ) : results.length === 0 ? (
        <EmptyState icon="📝" title="No listings" description="Create a listing to start renting out your property." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {results.map((listing) => (
            <Card key={listing.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 var(--space-2)' }}>{listing.property_title || listing.property?.title || 'Property'}</h3>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                      Ref: {listing.reference} | Unit: {listing.unit?.unit_number || 'N/A'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Badge variant={listing.status === 'published' ? 'success' : listing.status === 'pending_review' ? 'warning' : listing.status === 'rejected' ? 'danger' : 'neutral'}>
                      {listing.status_display || listing.status}
                    </Badge>
                    <Badge variant={listing.verification_status === 'verified' ? 'success' : 'warning'}>
                      {listing.verification_status_display || listing.verification_status}
                    </Badge>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                  <div><span style={{ color: 'var(--color-neutral-500)' }}>Rent:</span> {formatBDT(listing.monthly_rent)}/mo</div>
                  {listing.service_charge > 0 && <div><span style={{ color: 'var(--color-neutral-500)' }}>Service:</span> {formatBDT(listing.service_charge)}</div>}
                  {listing.availability_date && <div><span style={{ color: 'var(--color-neutral-500)' }}>Available:</span> {formatDate(listing.availability_date)}</div>}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Button size="sm" variant="outline" onClick={() => openEditForm(listing)}>Edit</Button>
                  {['draft', 'rejected', 'suspended'].includes(listing.status) && (
                    <Button size="sm" onClick={() => submitMutation.mutate(listing.id)} loading={submitMutation.isPending}>
                      Submit for Review
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm || !!editingListing}
        onClose={() => { setShowForm(false); setEditingListing(null); setFormData(emptyForm) }}
        title={editingListing ? 'Edit Listing' : 'Create Listing'}
        size="lg"
        footer={<><Button variant="secondary" onClick={() => { setShowForm(false); setEditingListing(null); setFormData(emptyForm) }}>Cancel</Button><Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>{editingListing ? 'Update' : 'Create'}</Button></>}
      >
        <form onSubmit={handleSubmit}>
          {formError && <div role="alert" style={{ padding: 'var(--space-4)', background: 'var(--color-danger-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', color: 'var(--color-danger-700)', fontSize: 'var(--text-sm)' }}>{formError}</div>}
          <Select label="Property" required value={formData.property} onChange={(e) => setFormData({ ...formData, property: e.target.value })}>
            <option value="">Select a property</option>
            {propertyResults.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </Select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Monthly Rent (৳)" type="number" required placeholder="25000" value={formData.monthly_rent} onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })} />
            <Input label="Security Deposit (৳)" type="number" placeholder="50000" value={formData.security_deposit} onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Service Charge (৳)" type="number" placeholder="0" value={formData.service_charge} onChange={(e) => setFormData({ ...formData, service_charge: e.target.value })} />
            <Input label="Advance Months" type="number" placeholder="e.g., 2" value={formData.advance_months} onChange={(e) => setFormData({ ...formData, advance_months: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Availability Date" type="date" value={formData.availability_date} onChange={(e) => setFormData({ ...formData, availability_date: e.target.value })} />
            <Select label="Preferred Tenant" value={formData.preferred_tenant} onChange={(e) => setFormData({ ...formData, preferred_tenant: e.target.value })}>
              <option value="no_preference">No Preference</option>
              <option value="family">Family</option>
              <option value="bachelor">Bachelor</option>
              <option value="corporate">Corporate</option>
              <option value="student">Student</option>
            </Select>
          </div>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label htmlFor="listing-description" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Description</label>
            <textarea id="listing-description" className="textarea" placeholder="Describe the property, unit, and any special terms..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
