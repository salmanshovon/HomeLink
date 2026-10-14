import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getServiceRequests, updateServiceRequest, getServiceCategories } from '../../api/services.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { Select } from '../../components/common/Select.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Textarea } from '../../components/common/Textarea.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'
import { formatBDT } from '../../utils/currency.js'
import { formatDate } from '../../utils/date.js'
import { Wrench, Eye } from 'lucide-react'

const statusVariant = {
  submitted: 'info', reviewing: 'warning', quoted: 'info', accepted: 'success',
  scheduled: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger',
}

const VALID_TRANSITIONS = {
  submitted: ['reviewing', 'cancelled'],
  reviewing: ['quoted', 'cancelled'],
  quoted: ['accepted', 'cancelled'],
  accepted: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export default function AdminServiceManagement() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateForm, setUpdateForm] = useState({})

  const { data: requestsData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-service-requests', statusFilter, categoryFilter, search],
    queryFn: () => getServiceRequests({
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      search: search || undefined,
    }),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: getServiceCategories,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateServiceRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      setShowUpdateModal(false)
      setSelectedRequest(null)
    },
  })

  const categories = categoriesData?.results || categoriesData || []
  const results = requestsData?.results || requestsData || []

  const openUpdateModal = (request) => {
    setSelectedRequest(request)
    setUpdateForm({
      status: request.status,
      estimated_price: request.estimated_price || '',
      final_price: request.final_price || '',
      internal_notes: request.internal_notes || '',
    })
    setShowUpdateModal(true)
  }

  const handleUpdate = (e) => {
    e.preventDefault()
    updateMutation.mutate({
      id: selectedRequest.id,
      payload: {
        status: updateForm.status,
        estimated_price: updateForm.estimated_price ? parseFloat(updateForm.estimated_price) : null,
        final_price: updateForm.final_price ? parseFloat(updateForm.final_price) : null,
        internal_notes: updateForm.internal_notes,
      },
    })
  }

  if (isLoading) return <LoadingSpinner label="Loading service requests..." />
  if (error) return <ErrorState title="Failed to load requests" message={error.message} onRetry={() => refetch()} />

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ margin: 0 }}>Service Request Management</h1>
        <p style={{ color: 'var(--color-neutral-600)', margin: 'var(--space-1) 0 0' }}>Manage and track all service requests</p>
      </div>

      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardBody>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input
                label="Search"
                placeholder="Search by name, phone, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
              />
            </div>
            <div style={{ width: 160 }}>
              <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="reviewing">Reviewing</option>
                <option value="quoted">Quoted</option>
                <option value="accepted">Accepted</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div style={{ width: 160 }}>
              <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {results.length === 0 && (
        <Card>
          <EmptyState icon={<Wrench size={28} />} title="No service requests found" description="Try adjusting your search or filter criteria." />
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {results.map((request) => (
          <Card key={request.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--space-1)' }}>{request.category?.name || 'Service'}</h3>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge variant={statusVariant[request.status] || 'neutral'}>{request.status_display || request.status}</Badge>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                      {request.contact_name || request.customer?.first_name || '—'} · {request.contact_phone || request.customer?.phone_number || '—'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/services/requests/${request.id}`)}>
                    <Eye size={14} /> View
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openUpdateModal(request)}>
                    Update
                  </Button>
                </div>
              </div>

              <p style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{request.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                {request.service_address && <div><span style={{ color: 'var(--color-neutral-500)' }}>Address:</span> {request.service_address}</div>}
                {request.preferred_datetime && <div><span style={{ color: 'var(--color-neutral-500)' }}>Preferred:</span> {formatDate(request.preferred_datetime)}</div>}
                {request.estimated_price && <div><span style={{ color: 'var(--color-neutral-500)' }}>Estimated:</span> {formatBDT(request.estimated_price)}</div>}
                {request.final_price && <div><span style={{ color: 'var(--color-neutral-500)' }}>Final:</span> {formatBDT(request.final_price)}</div>}
                {request.assigned_employee_name && <div><span style={{ color: 'var(--color-neutral-500)' }}>Assigned:</span> {request.assigned_employee_name}</div>}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title={`Update Service Request`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={updateMutation.isPending}>Save Changes</Button>
          </>
        }
      >
        <form onSubmit={handleUpdate}>
          <Select
            label="Status"
            required
            value={updateForm.status}
            onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
          >
            {Object.keys(VALID_TRANSITIONS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>

          <Input
            label="Estimated Price (BDT)"
            type="number"
            value={updateForm.estimated_price}
            onChange={(e) => setUpdateForm({ ...updateForm, estimated_price: e.target.value })}
            hint="Leave empty to clear"
          />

          <Input
            label="Final Price (BDT)"
            type="number"
            value={updateForm.final_price}
            onChange={(e) => setUpdateForm({ ...updateForm, final_price: e.target.value })}
            hint="Leave empty to clear"
          />

          <Textarea
            label="Internal Notes"
            value={updateForm.internal_notes}
            onChange={(e) => setUpdateForm({ ...updateForm, internal_notes: e.target.value })}
            placeholder="Internal notes (not visible to customer)..."
          />
        </form>
      </Modal>
    </div>
  )
}
