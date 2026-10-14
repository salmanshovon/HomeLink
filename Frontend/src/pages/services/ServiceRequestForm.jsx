import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createServiceRequest, getServiceCategories } from '../../api/services.api.js'
import { fetchCurrentUser } from '../../api/auth.api.js'
import { listAddresses } from '../../api/profile.api.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Textarea } from '../../components/common/Textarea.jsx'
import { Select } from '../../components/common/Select.jsx'
import { Card, CardBody, CardHeader } from '../../components/common/Card.jsx'
import { ApiError } from '../../api/client.js'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'

function formatTime12(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 || 12
  return `${h}:${String(minute).padStart(2, '0')} ${period}`
}

function getTodayStr() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTomorrowStr() {
  const now = new Date()
  now.setDate(now.getDate() + 1)
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDefaultDateTime() {
  const now = new Date()
  const isPast8PM = now.getHours() >= 20

  if (isPast8PM) {
    return { date: getTomorrowStr(), time: '07:00' }
  }

  const dateStr = getTodayStr()
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  let timeHour = twoHoursLater.getHours()
  let timeMinute = twoHoursLater.getMinutes() >= 30 ? 30 : 0
  if (timeHour < 7) { timeHour = 7; timeMinute = 0 }
  if (timeHour >= 22) { timeHour = 22; timeMinute = 0 }

  const timeStr = `${String(timeHour).padStart(2, '0')}:${String(timeMinute).padStart(2, '0')}`
  return { date: dateStr, time: timeStr }
}

function getMinDateStr() {
  const now = new Date()
  if (now.getHours() >= 20) return getTomorrowStr()
  return getTodayStr()
}

function isTimeSlotAvailable(timeValue, selectedDate) {
  const [hourStr, minuteStr] = timeValue.split(':')
  const slotDate = new Date(selectedDate)
  slotDate.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0)

  const now = new Date()
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  if (selectedDate === getTodayStr()) {
    return slotDate >= twoHoursLater
  }

  return true
}

export default function ServiceRequestForm({ category: categoryProp, onCancel, onSuccess }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [addressMode, setAddressMode] = useState('dropdown')
  const defaultDT = getDefaultDateTime()
  const [formData, setFormData] = useState({
    category: categoryProp?.id || searchParams.get('category') || '',
    contact_name: '',
    contact_phone: '',
    service_address: '',
    description: '',
    preferred_date: defaultDT.date,
    preferred_time: defaultDT.time,
    customer_notes: '',
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: getServiceCategories,
  })

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
  })

  const { data: addressesData } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: listAddresses,
  })

  const addresses = addressesData?.results || addressesData || []

  useEffect(() => {
    if (userData) {
      const { user, profile } = userData
      const name = profile?.full_name || profile?.legal_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.phone_number
      const phone = user.phone_number || ''
      setFormData(prev => ({
        ...prev,
        contact_name: name,
        contact_phone: phone,
      }))
    }
  }, [userData])

  useEffect(() => {
    if (addresses.length > 0 && !formData.service_address) {
      const primary = addresses.find(a => a.is_primary) || addresses[0]
      const addr = [primary.address_line, primary.area, primary.city, primary.district].filter(Boolean).join(', ')
      setFormData(prev => ({ ...prev, service_address: addr }))
    }
  }, [addresses])

  const mutation = useMutation({
    mutationFn: createServiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      if (onSuccess) {
        onSuccess()
      } else {
        navigate('/services/requests')
      }
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to submit request. Please try again.')
      }
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const selectedDate = formData.preferred_date
    const selectedTime = formData.preferred_time

    if (!selectedDate) {
      setError('Please select a preferred date.')
      return
    }
    if (!selectedTime) {
      setError('Please select a preferred time.')
      return
    }

    const minDate = getMinDateStr()
    if (selectedDate < minDate) {
      setError('Preferred date cannot be in the past.')
      return
    }

    if (selectedDate === getTodayStr() && !isTimeSlotAvailable(selectedTime, selectedDate)) {
      setError('Preferred time must be at least 2 hours from now.')
      return
    }

    const preferred_datetime = `${selectedDate}T${selectedTime}:00`
    mutation.mutate({ ...formData, preferred_datetime })
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate('/services')
    }
  }

  const categories = categoriesData?.results || categoriesData || []
  const selectedCategory = categoryProp || categories.find(c => String(c.id) === String(formData.category))

  if (userLoading) return <LoadingSpinner label="Loading your profile..." />

  return (
    <div>
      <h2 style={{ marginBottom: 'var(--space-6)' }}>Request {selectedCategory?.name || 'Service'}</h2>

      {error && (
        <div role="alert" style={{ padding: 'var(--space-4)', background: 'var(--color-danger-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', color: 'var(--color-danger-700)', fontSize: 'var(--text-sm)' }}>
          {error}
        </div>
      )}

      <Card>
        <CardHeader><strong>Service Request Details</strong></CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-4)' }}>
              <Input
                label="Service Category"
                value={selectedCategory?.name || ''}
                disabled
                hint="Selected service category"
              />
              <Input
                label="Contact Name"
                required
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                hint="Pre-filled from your profile"
              />
              <Input
                label="Contact Phone"
                required
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                hint="Pre-filled from your profile"
              />
              {addresses.length > 0 && addressMode === 'dropdown' ? (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <label style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
                      Service Address <span style={{ color: 'var(--color-danger-600)' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAddressMode('manual')}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', fontSize: 'var(--text-xs)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Enter manually
                    </button>
                  </div>
                  <Select
                    value={formData.service_address}
                    onChange={(e) => {
                      if (e.target.value === '__manual__') {
                        setAddressMode('manual')
                        setFormData({ ...formData, service_address: '' })
                      } else {
                        setFormData({ ...formData, service_address: e.target.value })
                      }
                    }}
                  >
                    <option value="">Select an address</option>
                    {addresses.map((addr) => {
                      const full = [addr.address_line, addr.area, addr.city, addr.district, addr.division].filter(Boolean).join(', ')
                      return <option key={addr.id} value={full}>{addr.label || addr.address_type}{addr.is_primary ? ' (Primary)' : ''} — {full}</option>
                    })}
                    <option value="__manual__">Enter manually...</option>
                  </Select>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <label style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
                      Service Address <span style={{ color: 'var(--color-danger-600)' }}>*</span>
                    </label>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAddressMode('dropdown')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', fontSize: 'var(--text-xs)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Saved addresses
                      </button>
                    )}
                  </div>
                  <Input
                    value={formData.service_address}
                    onChange={(e) => setFormData({ ...formData, service_address: e.target.value })}
                    placeholder="Enter the full service address"
                    required
                  />
                </div>
              )}
              <Input
                label="Preferred Date"
                type="date"
                min={getMinDateStr()}
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
              />
              <Select
                label="Preferred Time"
                value={formData.preferred_time}
                onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
              >
                {Array.from({ length: 31 }, (_, i) => {
                  const hour = 7 + Math.floor(i / 2)
                  const minute = i % 2 === 0 ? '00' : '30'
                  const value = `${String(hour).padStart(2, '0')}:${minute}`
                  const label = formatTime12(hour, Number(minute))
                  if (!isTimeSlotAvailable(value, formData.preferred_date)) return null
                  return <option key={value} value={value}>{label}</option>
                })}
              </Select>
            </div>

            <Textarea
              label="Describe the Issue"
              required
              placeholder="Please describe what needs to be repaired or serviced..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Textarea
              label="Additional Notes (optional)"
              placeholder="Any other information that might help..."
              value={formData.customer_notes}
              onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
            />

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button type="submit" loading={mutation.isPending}>Submit Request</Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>Cancel</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
