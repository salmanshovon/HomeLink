import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createServiceRequest } from '../../api/services.api.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Textarea } from '../../components/common/Textarea.jsx'
import { Select } from '../../components/common/Select.jsx'
import { ApiError } from '../../api/client.js'

export default function ServiceRequestForm({ category, onCancel, onSuccess }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    category: category?.id || '',
    service_address: '',
    description: '',
    preferred_datetime: '',
    customer_notes: '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: createServiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      onSuccess?.()
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
    mutation.mutate(formData)
  }

  return (
    <div>
      <h2 style={{ marginBottom: 'var(--space-6)' }}>Request {category?.name || 'Service'}</h2>
      <form onSubmit={handleSubmit} className="card" style={{ padding: 'var(--space-6)' }}>
        {error && (
          <div role="alert" style={{ padding: 'var(--space-4)', background: 'var(--color-danger-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', color: 'var(--color-danger-700)', fontSize: 'var(--text-sm)' }}>
            {error}
          </div>
        )}

        <Input
          label="Service Address"
          required
          placeholder="Where should the technician go?"
          value={formData.service_address}
          onChange={(e) => setFormData({ ...formData, service_address: e.target.value })}
        />

        <Textarea
          label="Describe the Issue"
          required
          placeholder="Please describe what needs to be repaired or serviced..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <Input
          label="Preferred Date & Time"
          type="datetime-local"
          value={formData.preferred_datetime}
          onChange={(e) => setFormData({ ...formData, preferred_datetime: e.target.value })}
        />

        <Textarea
          label="Additional Notes (optional)"
          placeholder="Any other information that might help..."
          value={formData.customer_notes}
          onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
        />

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button type="submit" loading={mutation.isPending}>Submit Request</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
