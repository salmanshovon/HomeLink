import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sendAnnouncement, getMyTenancies } from '../../api/landlords.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Textarea } from '../../components/common/Textarea.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'

export default function LandlordAnnouncements() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', body: '' })
  const [formError, setFormError] = useState('')

  const { data: tenancies, isLoading } = useQuery({
    queryKey: ['landlord-tenancies'],
    queryFn: () => getMyTenancies(),
  })

  const mutation = useMutation({
    mutationFn: sendAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-tenancies'] })
      setShowForm(false)
      setFormData({ title: '', body: '' })
    },
    onError: (err) => setFormError(err.message),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const activeTenancies = tenancies?.results?.filter((t) => t.status === 'active') || []
  const tenantCount = activeTenancies.length

  if (isLoading) return <LoadingSpinner label="Loading..." />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0 }}>Announcements</h1>
        <Button onClick={() => setShowForm(true)}>Send Announcement</Button>
      </div>

      <Card style={{ marginBottom: 'var(--space-8)' }}>
        <CardBody>
          <p style={{ margin: 0, color: 'var(--color-neutral-600)' }}>
            You have <strong>{tenantCount}</strong> active tenancy agreement{tenantCount !== 1 ? 's' : ''}.
            Announcements will be sent to all your tenants with active agreements.
          </p>
        </CardBody>
      </Card>

      <EmptyState icon="📢" title="No announcements yet" description="Send announcements to your tenants about maintenance, policies, or other updates." />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Send Announcement" footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleSubmit} loading={mutation.isPending}>Send to {tenantCount} Tenant{tenantCount !== 1 ? 's' : ''}</Button></>}>
        <form onSubmit={handleSubmit}>
          {formError && <div role="alert" style={{ padding: 'var(--space-4)', background: 'var(--color-danger-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', color: 'var(--color-danger-700)', fontSize: 'var(--text-sm)' }}>{formError}</div>}
          <Input label="Title" required placeholder="Announcement title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          <Textarea label="Message" required placeholder="Write your announcement..." value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)', marginTop: 'var(--space-4)' }}>
            This will be sent to {tenantCount} tenant{tenantCount !== 1 ? 's' : ''} with active agreements.
          </p>
        </form>
      </Modal>
    </div>
  )
}
