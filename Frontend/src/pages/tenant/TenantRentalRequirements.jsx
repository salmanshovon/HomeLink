import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyRentalRequirements, createRentalRequirement } from '../../api/tenants.api.js'
import { Card, CardBody, CardHeader } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Select } from '../../components/common/Select.jsx'
import { Textarea } from '../../components/common/Textarea.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { formatDate } from '../../utils/date.js'

export default function TenantRentalRequirements() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    min_rent: '',
    max_rent: '',
    bedrooms: '',
    bathrooms: '',
    preferred_locations: '',
    property_type: '',
    furnishing: '',
    desired_move_in_date: '',
    additional_requirements: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-requirements'],
    queryFn: () => getMyRentalRequirements(),
  })

  const mutation = useMutation({
    mutationFn: createRentalRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-requirements'] })
      setShowForm(false)
      setFormData({ min_rent: '', max_rent: '', bedrooms: '', bathrooms: '', preferred_locations: '', property_type: '', furnishing: '', desired_move_in_date: '', additional_requirements: '' })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...formData,
      min_rent: formData.min_rent || undefined,
      max_rent: formData.max_rent || undefined,
      bedrooms: formData.bedrooms || undefined,
      bathrooms: formData.bathrooms || undefined,
      preferred_locations: formData.preferred_locations ? formData.preferred_locations.split(',').map((s) => s.trim()) : [],
    })
  }

  const results = data?.results || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0 }}>Rental Requirements</h1>
        <Button onClick={() => setShowForm(true)}>Add Requirement</Button>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading requirements..." />
      ) : results.length === 0 ? (
        <EmptyState icon="📋" title="No rental requirements" description="Create a rental requirement so our agents can help you find the perfect property." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {results.map((req) => (
            <Card key={req.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 var(--space-2)' }}>
                      {req.preferred_locations?.join(', ') || 'Any location'}
                    </h3>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                      Created {formatDate(req.created_at)}
                    </p>
                  </div>
                  <Badge variant={req.status === 'completed' ? 'success' : req.status === 'cancelled' ? 'neutral' : 'info'}>
                    {req.status_display || req.status}
                  </Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                  {req.min_rent && <div><strong>Rent:</strong> ৳{req.min_rent} - ৳{req.max_rent || 'Any'}</div>}
                  {req.bedrooms && <div><strong>Bedrooms:</strong> {req.bedrooms}</div>}
                  {req.bathrooms && <div><strong>Bathrooms:</strong> {req.bathrooms}</div>}
                  {req.property_type && <div><strong>Type:</strong> {req.property_type}</div>}
                  {req.desired_move_in_date && <div><strong>Move-in:</strong> {formatDate(req.desired_move_in_date)}</div>}
                </div>
                {req.additional_requirements && (
                  <p style={{ margin: 'var(--space-4) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
                    {req.additional_requirements}
                  </p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Rental Requirement" footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleSubmit} loading={mutation.isPending}>Save</Button></>}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Min Rent (৳)" type="number" placeholder="0" value={formData.min_rent} onChange={(e) => setFormData({ ...formData, min_rent: e.target.value })} />
            <Input label="Max Rent (৳)" type="number" placeholder="Any" value={formData.max_rent} onChange={(e) => setFormData({ ...formData, max_rent: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Bedrooms" type="number" placeholder="Any" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} />
            <Input label="Bathrooms" type="number" placeholder="Any" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} />
          </div>
          <Input label="Preferred Locations" placeholder="e.g., Dhanmondi, Uttara" value={formData.preferred_locations} onChange={(e) => setFormData({ ...formData, preferred_locations: e.target.value })} hint="Separate multiple locations with commas" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Property Type" placeholder="Apartment, House, etc." value={formData.property_type} onChange={(e) => setFormData({ ...formData, property_type: e.target.value })} />
            <Select label="Furnishing" value={formData.furnishing} onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}>
              <option value="">Any</option>
              <option value="unfurnished">Unfurnished</option>
              <option value="semi_furnished">Semi Furnished</option>
              <option value="fully_furnished">Fully Furnished</option>
            </Select>
          </div>
          <Input label="Desired Move-in Date" type="date" value={formData.desired_move_in_date} onChange={(e) => setFormData({ ...formData, desired_move_in_date: e.target.value })} />
          <Textarea label="Additional Requirements" placeholder="Any other preferences or requirements..." value={formData.additional_requirements} onChange={(e) => setFormData({ ...formData, additional_requirements: e.target.value })} />
        </form>
      </Modal>
    </div>
  )
}
