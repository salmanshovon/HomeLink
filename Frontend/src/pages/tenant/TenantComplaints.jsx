import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyComplaints, createComplaint, getMyTenancies } from '../../api/tenants.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Select } from '../../components/common/Select.jsx'
import { Textarea } from '../../components/common/Textarea.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { formatDate } from '../../utils/date.js'

export default function TenantComplaints() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ tenancy: '', category: '', subject: '', description: '', priority: 'medium' })

  const { data: complaints, isLoading } = useQuery({ queryKey: ['tenant-complaints'], queryFn: () => getMyComplaints() })
  const { data: tenancies } = useQuery({ queryKey: ['tenant-tenancies'], queryFn: () => getMyTenancies() })

  const mutation = useMutation({
    mutationFn: createComplaint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-complaints'] })
      setShowForm(false)
      setFormData({ tenancy: '', category: '', subject: '', description: '', priority: 'medium' })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const results = complaints?.results || []
  const activeTenancies = tenancies?.results?.filter((t) => t.status === 'active') || []

  if (isLoading) return <LoadingSpinner label="Loading complaints..." />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0 }}>Complaints</h1>
        <Button onClick={() => setShowForm(true)} disabled={activeTenancies.length === 0}>
          New Complaint
        </Button>
      </div>

      {results.length === 0 ? (
        <EmptyState icon="📝" title="No complaints" description="You haven't filed any complaints yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {results.map((complaint) => (
            <Card key={complaint.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 var(--space-2)' }}>{complaint.subject}</h3>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                      {complaint.category_display || complaint.category} | Filed {formatDate(complaint.created_at)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Badge variant={complaint.priority === 'urgent' ? 'danger' : complaint.priority === 'high' ? 'warning' : 'neutral'}>
                      {complaint.priority}
                    </Badge>
                    <Badge variant={complaint.status === 'resolved' ? 'success' : complaint.status === 'closed' ? 'neutral' : 'info'}>
                      {complaint.status_display || complaint.status}
                    </Badge>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{complaint.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="File a Complaint" footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleSubmit} loading={mutation.isPending}>Submit</Button></>}>
        <form onSubmit={handleSubmit}>
          <Select label="Tenancy" required value={formData.tenancy} onChange={(e) => setFormData({ ...formData, tenancy: e.target.value })}>
            <option value="">Select a tenancy</option>
            {activeTenancies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.unit?.property?.title || t.unit?.unit_number || 'Property'}
              </option>
            ))}
          </Select>
          <Select label="Category" required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
            <option value="">Select a category</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="security">Security</option>
            <option value="cleanliness">Cleanliness</option>
            <option value="noise">Noise</option>
            <option value="structural">Structural</option>
            <option value="billing">Billing</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Subject" required placeholder="Brief description" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
          <Textarea label="Description" required placeholder="Describe the issue in detail..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <Select label="Priority" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </form>
      </Modal>
    </div>
  )
}
