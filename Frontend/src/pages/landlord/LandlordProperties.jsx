import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyProperties, createProperty, updateProperty, deleteProperty } from '../../api/landlords.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Select } from '../../components/common/Select.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'

const emptyForm = {
  title: '',
  category: 'apartment_building',
  division: '',
  district: '',
  city: '',
  area: '',
  society_name: '',
  block: '',
  road_number: '',
  house_number: '',
  building_name: '',
  postal_code: '',
  landmark: '',
  public_location: '',
  full_private_address: '',
}

export default function LandlordProperties() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [deletingProperty, setDeletingProperty] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['landlord-properties'],
    queryFn: () => getMyProperties(),
  })

  const createMutation = useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-properties'] })
      setShowForm(false)
      setFormData(emptyForm)
    },
    onError: (err) => setFormError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateProperty(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-properties'] })
      setEditingProperty(null)
      setFormData(emptyForm)
    },
    onError: (err) => setFormError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-properties'] })
      setDeletingProperty(null)
    },
  })

  const openCreateForm = () => {
    setFormData(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEditForm = (property) => {
    setFormData({
      title: property.title || '',
      category: property.category || 'apartment_building',
      division: property.division || '',
      district: property.district || '',
      city: property.city || '',
      area: property.area || '',
      society_name: property.society_name || '',
      block: property.block || '',
      road_number: property.road_number || '',
      house_number: property.house_number || '',
      building_name: property.building_name || '',
      postal_code: property.postal_code || '',
      landmark: property.landmark || '',
      public_location: property.public_location || '',
      full_private_address: property.full_private_address || '',
    })
    setFormError('')
    setEditingProperty(property)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingProperty) {
      updateMutation.mutate({ id: editingProperty.id, payload: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const results = data?.results || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0 }}>My Properties</h1>
        <Button onClick={openCreateForm}>Add Property</Button>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading properties..." />
      ) : isError ? (
        <ErrorState title="Failed to load properties" description={error?.message} onRetry={() => refetch()} />
      ) : results.length === 0 ? (
        <EmptyState icon="🏢" title="No properties" description="Add your first property to start listing on HomeLink." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-6)' }}>
          {results.map((property) => (
            <Card key={property.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 var(--space-2)' }}>{property.title}</h3>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                      {property.area}, {property.city}, {property.district}
                    </p>
                  </div>
                  <Badge variant={property.ownership_verified ? 'success' : 'warning'}>
                    {property.ownership_verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>
                  <div><strong>Type:</strong> {property.category?.replace(/_/g, ' ')}</div>
                  <div><strong>Units:</strong> {property.units?.length || 0}</div>
                  <div><strong>Status:</strong> {property.status}</div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button size="sm" variant="outline" onClick={() => openEditForm(property)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => setDeletingProperty(property)}>Delete</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showForm || !!editingProperty}
        onClose={() => { setShowForm(false); setEditingProperty(null); setFormData(emptyForm) }}
        title={editingProperty ? 'Edit Property' : 'Add Property'}
        size="lg"
        footer={<><Button variant="secondary" onClick={() => { setShowForm(false); setEditingProperty(null); setFormData(emptyForm) }}>Cancel</Button><Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>{editingProperty ? 'Update' : 'Create'}</Button></>}
      >
        <form onSubmit={handleSubmit}>
          {formError && <div role="alert" style={{ padding: 'var(--space-4)', background: 'var(--color-danger-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', color: 'var(--color-danger-700)', fontSize: 'var(--text-sm)' }}>{formError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Property Title" required placeholder="e.g., 3 Bedroom Apartment in Dhanmondi" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            <Select label="Category" required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              <option value="apartment_building">Apartment Building</option>
              <option value="standalone_house">Standalone House</option>
              <option value="duplex">Duplex</option>
              <option value="studio_building">Studio Building</option>
              <option value="commercial">Commercial</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Division" required placeholder="Dhaka" value={formData.division} onChange={(e) => setFormData({ ...formData, division: e.target.value })} />
            <Input label="District" required placeholder="Dhaka" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
            <Input label="City" required placeholder="Dhaka" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Area" placeholder="Dhanmondi" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
            <Input label="Society Name" placeholder="e.g., Dhanmondi Residential Area" value={formData.society_name} onChange={(e) => setFormData({ ...formData, society_name: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Block" placeholder="Block A" value={formData.block} onChange={(e) => setFormData({ ...formData, block: e.target.value })} />
            <Input label="Road Number" placeholder="Road 5" value={formData.road_number} onChange={(e) => setFormData({ ...formData, road_number: e.target.value })} />
            <Input label="House Number" placeholder="House 12" value={formData.house_number} onChange={(e) => setFormData({ ...formData, house_number: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Building Name" placeholder="e.g., Tower A" value={formData.building_name} onChange={(e) => setFormData({ ...formData, building_name: e.target.value })} />
            <Input label="Postal Code" placeholder="1205" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} />
          </div>
          <Input label="Landmark" placeholder="Near Dhanmondi Lake" value={formData.landmark} onChange={(e) => setFormData({ ...formData, landmark: e.target.value })} />
          <Input label="Public Location" placeholder="Dhanmondi, Dhaka" value={formData.public_location} onChange={(e) => setFormData({ ...formData, public_location: e.target.value })} />
          <Input label="Full Private Address" placeholder="Complete address (kept private)" value={formData.full_private_address} onChange={(e) => setFormData({ ...formData, full_private_address: e.target.value })} />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProperty}
        onClose={() => setDeletingProperty(null)}
        onConfirm={() => deleteMutation.mutate(deletingProperty.id)}
        title="Delete Property"
        message={`Are you sure you want to delete "${deletingProperty?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
