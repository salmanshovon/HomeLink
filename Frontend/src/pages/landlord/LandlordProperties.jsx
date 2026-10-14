import { useState, useRef, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyProperties, createProperty, updateProperty, deleteProperty, addUnit, updateUnit, uploadPropertyMedia, getPropertyMedia, deletePropertyMedia } from '../../api/landlords.api.js'
import { fetchLocations } from '../../api/properties.api.js'
import { formatLocation } from '../../utils/location.js'
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
import { PropertyCard } from '../../components/property/PropertyCard.jsx'

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
  // Unit fields
  unit_number: '',
  unit_type: 'apartment',
  bedrooms: '',
  bathrooms: '',
  size_sqft: '',
  furnishing: 'unfurnished',
  floor: '',
}

// Surface the backend's field-level validation messages instead of a generic
// failure, so problems like a missing required field are visible.
function formatApiError(err) {
  const details = err?.details
  if (details && typeof details === 'object') {
    const messages = Object.entries(details).map(([field, value]) => {
      const text = Array.isArray(value) ? value.join(' ') : String(value)
      return `${field}: ${text}`
    })
    if (messages.length > 0) return messages.join(' | ')
  }
  return err?.message || 'Request failed.'
}

export default function LandlordProperties() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [deletingProperty, setDeletingProperty] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['landlord-properties'],
    queryFn: () => getMyProperties(),
  })

  const propertyIds = (data?.results || []).map(p => p.id)

  const { data: mediaData } = useQuery({
    queryKey: ['landlord-property-media', propertyIds],
    queryFn: async () => {
      const results = await Promise.all(
        propertyIds.map(async (id) => {
          try {
            const media = await getPropertyMedia(id)
            const items = media?.results || media || []
            const cover = items.find(m => m.is_cover) || items[0]
            return { id, coverImage: cover?.file || null }
          } catch {
            return { id, coverImage: null }
          }
        })
      )
      return Object.fromEntries(results.map(r => [r.id, r.coverImage]))
    },
    enabled: propertyIds.length > 0,
  })

  // --- Cascading location lookups -------------------------------------------
  // Division / district / city are locked to Dhaka for now (HomeLink operates
  // only in Dhaka). The full national tree is still loaded from the API so the
  // lock can be lifted later by simply enabling the selects.
  const DHAKA = 'Dhaka'
  const LOCATION_LOCKED = true

  const [divisionId, setDivisionId] = useState(null)
  const [districtId, setDistrictId] = useState(null)
  const [cityId, setCityId] = useState(null)

  const { data: divisions = [], isLoading: divisionsLoading } = useQuery({
    queryKey: ['locations', 'division'],
    queryFn: () => fetchLocations('division'),
    staleTime: 60 * 60 * 1000,
  })

  const { data: districts = [], isLoading: districtsLoading } = useQuery({
    queryKey: ['locations', 'district', divisionId],
    queryFn: () => fetchLocations('district', divisionId),
    enabled: !!divisionId,
    staleTime: 60 * 60 * 1000,
  })

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['locations', 'city', districtId],
    queryFn: () => fetchLocations('city', districtId),
    enabled: !!districtId,
    staleTime: 60 * 60 * 1000,
  })

  const { data: areas = [], isLoading: areasLoading } = useQuery({
    queryKey: ['locations', 'area', cityId],
    queryFn: () => fetchLocations('area', cityId),
    enabled: !!cityId,
    staleTime: 60 * 60 * 1000,
  })

  const dhakaDivision = useMemo(
    () => divisions.find((d) => d.name === DHAKA),
    [divisions],
  )
  const dhakaDistrict = useMemo(
    () => districts.find((d) => d.name === DHAKA),
    [districts],
  )
  const dhakaCity = useMemo(
    () => cities.find((c) => c.name === DHAKA),
    [cities],
  )

  // Resolve the locked Dhaka chain once the lists arrive.
  useEffect(() => {
    if (LOCATION_LOCKED && dhakaDivision) setDivisionId(dhakaDivision.id)
  }, [dhakaDivision])

  useEffect(() => {
    if (LOCATION_LOCKED && dhakaDistrict) setDistrictId(dhakaDistrict.id)
  }, [dhakaDistrict])

  useEffect(() => {
    if (LOCATION_LOCKED && dhakaCity) setCityId(dhakaCity.id)
  }, [dhakaCity])

  // Default division/district/city to Dhaka.
  useEffect(() => {
    if (LOCATION_LOCKED && divisionId && !formData.division) {
      setFormData((prev) => ({ ...prev, division: DHAKA, district: DHAKA, city: DHAKA }))
    }
  }, [divisionId])

  // Existing photos for the property currently being edited.
  const { data: existingMedia, isLoading: mediaLoading } = useQuery({
    queryKey: ['property-media', editingProperty?.id],
    queryFn: () => getPropertyMedia(editingProperty.id),
    enabled: !!editingProperty?.id,
  })

  const deleteMediaMutation = useMutation({
    mutationFn: ({ mediaId }) => deletePropertyMedia(editingProperty.id, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-media', editingProperty?.id] })
      queryClient.invalidateQueries({ queryKey: ['landlord-properties'] })
    },
    onError: (err) => setFormError(formatApiError(err)),
  })

  const handleRemoveExistingPhoto = (mediaId) => {
    deleteMediaMutation.mutate({ mediaId })
  }

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { unit_fields, photos, ...propertyData } = payload
      const property = await createProperty(propertyData)
      // Create unit if unit data provided
      if (unit_fields && unit_fields.unit_number) {
        await addUnit(property.id, unit_fields)
      }
      // Upload photos if any
      if (photos && photos.length > 0) {
        setUploading(true)
        try {
          const body = new FormData()
          photos.forEach((photo) => body.append('files', photo))
          body.append('media_type', 'image')
          await uploadPropertyMedia(property.id, body)
        } finally {
          setUploading(false)
        }
      }
      return property
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-properties'] })
      setShowForm(false)
      setFormData(emptyForm)
      setPhotos([])
    },
    onError: (err) => setFormError(formatApiError(err)),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload, existingUnitId }) => {
      const { unit_fields, photos, ...propertyData } = payload
      const property = await updateProperty(id, propertyData)

      if (unit_fields) {
        if (existingUnitId) {
          await updateUnit(id, existingUnitId, unit_fields)
        } else {
          await addUnit(id, unit_fields)
        }
      }

      if (photos && photos.length > 0) {
        setUploading(true)
        try {
          const body = new FormData()
          photos.forEach((photo) => body.append('files', photo))
          body.append('media_type', 'image')
          await uploadPropertyMedia(id, body)
        } finally {
          setUploading(false)
        }
      }
      return property
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-properties'] })
      setEditingProperty(null)
      setFormData(emptyForm)
      setPhotos([])
    },
    onError: (err) => setFormError(formatApiError(err)),
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
    setPhotos([])
    setShowForm(true)
  }

  const openEditForm = (property) => {
    const unit = property.units?.[0]
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
      unit_number: unit?.unit_number || '',
      unit_type: unit?.unit_type || 'apartment',
      bedrooms: unit?.bedrooms ?? '',
      bathrooms: unit?.bathrooms ?? '',
      size_sqft: unit?.size_sqft ?? '',
      furnishing: unit?.furnishing || 'unfurnished',
      floor: unit?.floor ?? '',
    })
    setFormError('')
    setPhotos([])
    setEditingProperty(property)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')

    const { unit_number, unit_type, bedrooms, bathrooms, size_sqft, furnishing, floor, ...propertyData } = formData

    // unit_number is required by the API. Fall back to a sensible default so the
    // request is never rejected just because the field was left blank.
    const resolvedUnitNumber = unit_number.trim() || 'Unit 1'

    const hasUnitDetails =
      resolvedUnitNumber !== 'Unit 1' ||
      (bedrooms !== '' && bedrooms != null) ||
      (bathrooms !== '' && bathrooms != null) ||
      (size_sqft !== '' && size_sqft != null) ||
      (floor !== '' && floor != null)

    const existingUnit = editingProperty?.units?.[0]
    const unit_fields = hasUnitDetails || existingUnit
      ? {
          unit_number: resolvedUnitNumber,
          unit_type,
          bedrooms: bedrooms === '' || bedrooms == null ? (existingUnit?.bedrooms ?? 0) : parseInt(bedrooms, 10),
          bathrooms: bathrooms === '' || bathrooms == null ? (existingUnit?.bathrooms ?? 0) : parseInt(bathrooms, 10),
          size_sqft: size_sqft === '' || size_sqft == null ? (existingUnit?.size_sqft ?? null) : parseFloat(size_sqft),
          furnishing,
          floor: floor === '' || floor == null ? (existingUnit?.floor ?? null) : parseInt(floor, 10),
        }
      : null

    if (editingProperty) {
      updateMutation.mutate({
        id: editingProperty.id,
        existingUnitId: existingUnit?.id ?? null,
        payload: { ...propertyData, unit_fields, photos },
      })
    } else {
      createMutation.mutate({ ...propertyData, unit_fields, photos })
    }
  }

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || [])
    setPhotos((prev) => [...prev, ...files])
  }

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const results = data?.results || []

  const toCardProperty = (property) => {
    const unit = property.units?.[0]
    const listing = property.listings?.[0]
    const coverImage = mediaData?.[property.id] || listing?.cover_image || property.cover_image || null
    return {
      ...property,
      cover_image: coverImage,
      property_id: property.id,
      monthly_rent: listing?.monthly_rent ?? unit?.monthly_rent ?? null,
      bedrooms: listing?.bedrooms ?? unit?.bedrooms ?? null,
      bathrooms: listing?.bathrooms ?? unit?.bathrooms ?? null,
      size_sqft: listing?.size_sqft ?? unit?.size_sqft ?? null,
      preferred_tenant: listing?.preferred_tenant ?? property.preferred_tenant ?? null,
      status: listing?.status ?? (property.status === 'active' ? 'published' : property.status),
      status_display: listing?.status_display ?? (property.status === 'active' ? 'Published' : property.status),
      _isOwner: true,
      _ownershipVerified: property.ownership_verified,
      _category: property.category,
      _unitCount: property.units?.length || 0,
    }
  }

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          {results.map((property) => (
            <div key={property.id}>
              <PropertyCard property={toCardProperty(property)} isOwner={true} />
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', padding: '0 var(--space-1)' }}>
                <Button size="sm" variant="outline" onClick={() => openEditForm(property)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => setDeletingProperty(property)}>Delete</Button>
              </div>
            </div>
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
            <Select
              label="Division"
              required
              disabled={LOCATION_LOCKED}
              value={formData.division}
              hint={LOCATION_LOCKED ? 'HomeLink currently operates in Dhaka only.' : undefined}
              onChange={(e) => {
                const next = e.target.value
                setFormData({ ...formData, division: next, district: '', city: '', area: '' })
                const div = divisions.find((d) => d.name === next)
                setDivisionId(div?.id ?? null)
                setDistrictId(null)
                setCityId(null)
              }}
            >
              <option value="">Select division</option>
              {divisions.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </Select>

            <Select
              label="District"
              required
              disabled={LOCATION_LOCKED || districtsLoading || !divisionId}
              value={formData.district}
              onChange={(e) => {
                const next = e.target.value
                setFormData({ ...formData, district: next, city: '', area: '' })
                const dist = districts.find((d) => d.name === next)
                setDistrictId(dist?.id ?? null)
                setCityId(null)
              }}
            >
              <option value="">{districtsLoading ? 'Loading…' : 'Select district'}</option>
              {districts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </Select>

            <Select
              label="City"
              required
              disabled={LOCATION_LOCKED || citiesLoading || !districtId}
              value={formData.city}
              onChange={(e) => {
                const next = e.target.value
                setFormData({ ...formData, city: next, area: '' })
                const city = cities.find((c) => c.name === next)
                setCityId(city?.id ?? null)
              }}
            >
              <option value="">{citiesLoading ? 'Loading…' : 'Select city'}</option>
              {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Select
              label="Area"
              required
              disabled={!cityId || areasLoading}
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            >
              <option value="">{areasLoading ? 'Loading areas…' : 'Select area'}</option>
              {areas.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </Select>
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

          <h3 style={{ gridColumn: '1 / -1', margin: 'var(--space-6) 0 var(--space-4)', fontSize: 'var(--text-lg)' }}>Unit Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Unit Number" placeholder="e.g., A-101" value={formData.unit_number} onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })} />
            <Select label="Unit Type" value={formData.unit_type} onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}>
              <option value="apartment">Apartment</option>
              <option value="duplex">Duplex</option>
              <option value="studio">Studio</option>
              <option value="room">Room</option>
              <option value="standalone_house">Standalone House</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Bedrooms" type="number" placeholder="3" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} />
            <Input label="Bathrooms" type="number" placeholder="2" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} />
            <Input label="Size (sqft)" type="number" placeholder="1200" value={formData.size_sqft} onChange={(e) => setFormData({ ...formData, size_sqft: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Select label="Furnishing" value={formData.furnishing} onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}>
              <option value="unfurnished">Unfurnished</option>
              <option value="semi_furnished">Semi-furnished</option>
              <option value="fully_furnished">Fully furnished</option>
            </Select>
            <Input label="Floor" type="number" placeholder="1" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} />
          </div>

          <h3 style={{ gridColumn: '1 / -1', margin: 'var(--space-6) 0 var(--space-4)', fontSize: 'var(--text-lg)' }}>Photos</h3>
          <div style={{ gridColumn: '1 / -1' }}>
            {/* Existing uploaded photos */}
            {editingProperty && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
                  Current photos
                  {existingMedia?.length ? ` (${existingMedia.length})` : ''}
                </p>
                {mediaLoading && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>Loading photos…</p>}
                {!mediaLoading && existingMedia?.length === 0 && (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>No photos uploaded yet.</p>
                )}
                {existingMedia?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                    {existingMedia.map((m) => (
                      <div key={m.id} style={{ position: 'relative', width: '100px', height: '100px' }}>
                        <img
                          src={m.file}
                          alt={m.caption || 'Property photo'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                        />
                        {m.is_cover && (
                          <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'var(--color-brand-600)', color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '3px' }}>
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingPhoto(m.id)}
                          disabled={deleteMediaMutation.isPending}
                          title="Remove photo"
                          style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: 'var(--color-danger-600)', color: 'white', cursor: deleteMediaMutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              Upload Photos
            </Button>
            {photos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                {photos.map((photo, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={photo.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                    />
                    <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'var(--color-neutral-700)', color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '3px' }}>
                      New
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      title="Remove photo"
                      style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: 'var(--color-danger-600)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
