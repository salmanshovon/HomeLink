import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { adminCreateEmployee } from '../../api/admin.api.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Card, CardBody, CardHeader } from '../../components/common/Card.jsx'

export default function AdminCreateEmployeePage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    phone_number: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    department: '',
    designation: '',
    employee_code: '',
    service_area: '',
  })

  const mutation = useMutation({
    mutationFn: adminCreateEmployee,
    onSuccess: () => navigate('/admin/users'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const update = (field) => (e) => setFormData({ ...formData, [field]: e.target.value })

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/admin/users')} style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} /> Back to Users
      </Button>

      <div style={{ maxWidth: 700 }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>Create Employee Account</h1>
        <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-6)' }}>
          Register a new HomeLink employee with access to the staff dashboard.
        </p>

        {mutation.isError && (
          <Card style={{ marginBottom: 'var(--space-4)', borderColor: 'var(--color-danger-300)' }}>
            <CardBody>
              <p style={{ color: 'var(--color-danger-600)', margin: 0 }}>
                {mutation.error?.response?.data?.error?.message || mutation.error?.message || 'Failed to create employee'}
              </p>
              {mutation.error?.response?.data?.error?.details && (
                <ul style={{ color: 'var(--color-danger-600)', margin: 'var(--space-2) 0 0', paddingLeft: 'var(--space-5)' }}>
                  {Object.entries(mutation.error.response.data.error.details).map(([field, msgs]) => (
                    <li key={field}>{field}: {Array.isArray(msgs) ? msgs.join(', ') : msgs}</li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader><strong>Employee Details</strong></CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-4)' }}>
                <Input label="Phone Number" required placeholder="01XXXXXXXXX" value={formData.phone_number} onChange={update('phone_number')} hint="Format: 01XXXXXXXXX" />
                <Input label="Email" type="email" value={formData.email} onChange={update('email')} />
                <Input label="First Name" value={formData.first_name} onChange={update('first_name')} />
                <Input label="Last Name" value={formData.last_name} onChange={update('last_name')} />
                <Input label="Password" type="password" required value={formData.password} onChange={update('password')} hint="Min 8 chars, not entirely numeric" />
                <Input label="Employee Code" required value={formData.employee_code} onChange={update('employee_code')} placeholder="EMP-001" />
                <Input label="Department" required value={formData.department} onChange={update('department')} placeholder="Operations" />
                <Input label="Designation" required value={formData.designation} onChange={update('designation')} placeholder="Property Manager" />
                <Input label="Service Area" value={formData.service_area} onChange={update('service_area')} placeholder="Dhaka" />
              </div>
              <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
                <Button type="submit" loading={mutation.isPending}>
                  <UserPlus size={16} /> Create Employee
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
