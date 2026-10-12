import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, UserPlus, Trash2 } from 'lucide-react'
import {
  adminGetUser,
  adminUpdateUser,
  adminChangeUserStatus,
  adminAssignRole,
  adminRemoveRole,
  adminCreateAddress,
  adminUpdateAddress,
  adminDeleteAddress,
} from '../../api/admin.api.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Select } from '../../components/common/Select.jsx'
import { Card, CardBody, CardHeader, CardFooter } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'

const ALL_ROLES = ['landlord', 'tenant', 'employee', 'superadmin']

const statusVariant = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  deactivated: 'neutral',
}

export default function AdminUserDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({})
  const [newRole, setNewRole] = useState('')
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showRemoveRoleDialog, setShowRemoveRoleDialog] = useState(false)
  const [pendingStatus] = useState('')
  const [pendingRemoveRole, setPendingRemoveRole] = useState('')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({ address_type: 'present', label: '', division: '', district: '', city: '', area: '', postal_code: '', address_line: '', is_primary: false })
  const [editingAddress, setEditingAddress] = useState(null)

  const { data: userData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminGetUser(userId),
  })

  // Sync form data when user data is fetched
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (userData) {
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        is_active: userData.is_active,
      })
    }
  }, [userData])

  const updateMutation = useMutation({
    mutationFn: (payload) => adminUpdateUser(userId, payload),
    onSuccess: () => { queryClient.invalidateQueries(['admin-user', userId]); setEditMode(false) },
  })

  const statusMutation = useMutation({
    mutationFn: (status) => adminChangeUserStatus(userId, status),
    onSuccess: () => { queryClient.invalidateQueries(['admin-user', userId]); setShowStatusDialog(false) },
  })

  const assignRoleMutation = useMutation({
    mutationFn: (role) => adminAssignRole(userId, role),
    onSuccess: () => { queryClient.invalidateQueries(['admin-user', userId]); setNewRole('') },
  })

  const removeRoleMutation = useMutation({
    mutationFn: (role) => adminRemoveRole(userId, role),
    onSuccess: () => { queryClient.invalidateQueries(['admin-user', userId]); setShowRemoveRoleDialog(false) },
  })

  const createAddressMutation = useMutation({
    mutationFn: (payload) => adminCreateAddress(userId, payload),
    onSuccess: () => { queryClient.invalidateQueries(['admin-user', userId]); setShowAddressForm(false); setAddressForm({ address_type: 'present', label: '', division: '', district: '', city: '', area: '', postal_code: '', address_line: '', is_primary: false }) },
  })

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, payload }) => adminUpdateAddress(userId, id, payload),
    onSuccess: () => { queryClient.invalidateQueries(['admin-user', userId]); setEditingAddress(null) },
  })

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId) => adminDeleteAddress(userId, addressId),
    onSuccess: () => queryClient.invalidateQueries(['admin-user', userId]),
  })

  const handleUpdate = (e) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleAssignRole = (e) => {
    e.preventDefault()
    if (newRole) assignRoleMutation.mutate(newRole)
  }

  const startEditAddress = (address) => {
    setEditingAddress(address.id)
    setAddressForm({
      address_type: address.address_type,
      label: address.label || '',
      division: address.division || '',
      district: address.district || '',
      city: address.city || '',
      area: address.area || '',
      postal_code: address.postal_code || '',
      address_line: address.address_line || '',
      is_primary: address.is_primary,
    })
  }

  const handleAddressSubmit = (e) => {
    e.preventDefault()
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress, payload: addressForm })
    } else {
      createAddressMutation.mutate(addressForm)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorState title="Failed to load user" message={error.message} onRetry={() => refetch()} />
  if (!userData) return null

  const user = userData

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/admin/users')} style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} /> Back to Users
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ margin: 0 }}>
            {user.first_name || user.last_name
              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
              : user.phone_number}
          </h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', alignItems: 'center' }}>
            <Badge variant={statusVariant[user.account_status] || 'neutral'}>{user.account_status}</Badge>
            {(user.roles || []).map((role) => (
              <Badge key={role} variant="info">{role}</Badge>
            ))}
            {user.is_phone_verified && <Badge variant="success">Phone Verified</Badge>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={() => setEditMode(!editMode)}>
            <Save size={16} /> {editMode ? 'Cancel Edit' : 'Edit Profile'}
          </Button>
          <Button variant="outline" onClick={() => setShowStatusDialog(true)}>
            Change Status
          </Button>
        </div>
      </div>

      {updateMutation.isError && (
        <Card style={{ marginBottom: 'var(--space-4)', borderColor: 'var(--color-danger-300)' }}>
          <CardBody>
            <p style={{ color: 'var(--color-danger-600)', margin: 0 }}>
              {updateMutation.error?.response?.data?.error?.message || updateMutation.error?.message || 'Update failed'}
            </p>
          </CardBody>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)' }}>
        <Card>
          <CardHeader><strong>Account Details</strong></CardHeader>
          <CardBody>
            <form onSubmit={handleUpdate}>
              <Input label="First Name" value={formData.first_name || ''} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} disabled={!editMode} />
              <Input label="Last Name" value={formData.last_name || ''} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} disabled={!editMode} />
              <Input label="Email" type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!editMode} />
              <Input label="Phone Number" value={formData.phone_number || ''} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} disabled />
              {editMode && (
                <Button type="submit" loading={updateMutation.isPending}>
                  <Save size={16} /> Save Changes
                </Button>
              )}
            </form>
          </CardBody>
          <CardFooter>
            <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', flexWrap: 'wrap' }}>
              <span>Last login: {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</span>
              <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader><strong>Roles</strong></CardHeader>
          <CardBody>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
              {(user.roles || []).map((role) => (
                <Badge key={role} variant="info" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  {role}
                  <button
                    onClick={() => { setPendingRemoveRole(role); setShowRemoveRoleDialog(true) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontSize: '1rem', lineHeight: 1 }}
                    aria-label={`Remove ${role} role`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {(user.roles || []).length === 0 && <span style={{ color: 'var(--color-neutral-500)' }}>No roles assigned</span>}
            </div>
            <form onSubmit={handleAssignRole} style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ flex: 1 }}>
                <option value="">Select a role...</option>
                {ALL_ROLES.filter((r) => !user.roles?.includes(r)).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Select>
              <Button type="submit" variant="secondary" disabled={!newRole || assignRoleMutation.isPending}>
                <UserPlus size={16} /> Assign
              </Button>
            </form>
            {assignRoleMutation.isError && (
              <p style={{ color: 'var(--color-danger-600)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
                {assignRoleMutation.error?.response?.data?.error?.message || 'Failed to assign role'}
              </p>
            )}
          </CardBody>
        </Card>

        {user.landlord_profile && (
          <Card>
            <CardHeader><strong>Landlord Profile</strong></CardHeader>
            <CardBody>
              <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)', margin: 0 }}>
                <dt style={{ fontWeight: 'var(--font-medium)' }}>Legal Name</dt><dd style={{ margin: 0 }}>{user.landlord_profile.legal_name}</dd>
                {user.landlord_profile.display_name && <><dt style={{ fontWeight: 'var(--font-medium)' }}>Display Name</dt><dd style={{ margin: 0 }}>{user.landlord_profile.display_name}</dd></>}
                {user.landlord_profile.alternate_phone && <><dt style={{ fontWeight: 'var(--font-medium)' }}>Alt. Phone</dt><dd style={{ margin: 0 }}>{user.landlord_profile.alternate_phone}</dd></>}
                <dt style={{ fontWeight: 'var(--font-medium)' }}>NID Verified</dt><dd style={{ margin: 0 }}><Badge variant={user.landlord_profile.nid_verified ? 'success' : 'neutral'}>{user.landlord_profile.nid_verified ? 'Yes' : 'No'}</Badge></dd>
                <dt style={{ fontWeight: 'var(--font-medium)' }}>Profile Verified</dt><dd style={{ margin: 0 }}><Badge variant={user.landlord_profile.profile_verified ? 'success' : 'neutral'}>{user.landlord_profile.profile_verified ? 'Yes' : 'No'}</Badge></dd>
              </dl>
            </CardBody>
          </Card>
        )}

        {user.tenant_profile && (
          <Card>
            <CardHeader><strong>Tenant Profile</strong></CardHeader>
            <CardBody>
              <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)', margin: 0 }}>
                <dt style={{ fontWeight: 'var(--font-medium)' }}>Full Name</dt><dd style={{ margin: 0 }}>{user.tenant_profile.full_name}</dd>
                {user.tenant_profile.occupation && <><dt style={{ fontWeight: 'var(--font-medium)' }}>Occupation</dt><dd style={{ margin: 0 }}>{user.tenant_profile.occupation}</dd></>}
                {user.tenant_profile.organization && <><dt style={{ fontWeight: 'var(--font-medium)' }}>Organization</dt><dd style={{ margin: 0 }}>{user.tenant_profile.organization}</dd></>}
                {user.tenant_profile.emergency_contact && <><dt style={{ fontWeight: 'var(--font-medium)' }}>Emergency Contact</dt><dd style={{ margin: 0 }}>{user.tenant_profile.emergency_contact}</dd></>}
                <dt style={{ fontWeight: 'var(--font-medium)' }}>Contact Method</dt><dd style={{ margin: 0 }}>{user.tenant_profile.preferred_contact_method}</dd>
              </dl>
            </CardBody>
          </Card>
        )}

        {user.employee_profile && (
          <Card>
            <CardHeader><strong>Employee Profile</strong></CardHeader>
            <CardBody>
              <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)', margin: 0 }}>
                <dt style={{ fontWeight: 'var(--font-medium)' }}>Employee Code</dt><dd style={{ margin: 0 }}>{user.employee_profile.employee_code}</dd>
                <dt style={{ fontWeight: 'var(--font-medium)' }}>Department</dt><dd style={{ margin: 0 }}>{user.employee_profile.department}</dd>
                <dt style={{ fontWeight: 'var(--font-medium)' }}>Designation</dt><dd style={{ margin: 0 }}>{user.employee_profile.designation}</dd>
                {user.employee_profile.service_area && <><dt style={{ fontWeight: 'var(--font-medium)' }}>Service Area</dt><dd style={{ margin: 0 }}>{user.employee_profile.service_area}</dd></>}
                <dt style={{ fontWeight: 'var(--font-medium)' }}>Employment</dt><dd style={{ margin: 0 }}><Badge variant={user.employee_profile.employment_status === 'active' ? 'success' : 'neutral'}>{user.employee_profile.employment_status}</Badge></dd>
              </dl>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Addresses</strong>
              <Button variant="ghost" size="sm" onClick={() => { setShowAddressForm(true); setEditingAddress(null); setAddressForm({ address_type: 'present', label: '', division: '', district: '', city: '', area: '', postal_code: '', address_line: '', is_primary: false }) }}>
                <UserPlus size={14} /> Add
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {(user.addresses || []).length === 0 && !showAddressForm && (
              <p style={{ color: 'var(--color-neutral-500)', margin: 0 }}>No addresses on file.</p>
            )}
            {(user.addresses || []).map((addr) => (
              <div key={addr.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
                {editingAddress === addr.id ? (
                  <form onSubmit={handleAddressSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <Select label="Type" value={addressForm.address_type} onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value })}>
                      <option value="present">Present</option><option value="permanent">Permanent</option><option value="work">Work</option><option value="other">Other</option>
                    </Select>
                    <Input label="Label" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} />
                    <Input label="Division" required value={addressForm.division} onChange={(e) => setAddressForm({ ...addressForm, division: e.target.value })} />
                    <Input label="District" required value={addressForm.district} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} />
                    <Input label="City" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                    <Input label="Area" value={addressForm.area} onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })} />
                    <Input label="Postal Code" value={addressForm.postal_code} onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })} />
                    <Input label="Address Line" value={addressForm.address_line} onChange={(e) => setAddressForm({ ...addressForm, address_line: e.target.value })} />
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-2)' }}>
                      <Button type="submit" size="sm" loading={updateAddressMutation.isPending}>Save</Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => setEditingAddress(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                        <Badge variant="info">{addr.address_type}</Badge>
                        {addr.is_primary && <Badge variant="success">Primary</Badge>}
                        {addr.label && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{addr.label}</span>}
                      </div>
                      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)' }}>
                        {addr.address_line}{addr.address_line && (addr.area || addr.city) ? ', ' : ''}{addr.area}{addr.area && addr.city ? ', ' : ''}{addr.city}{addr.district ? `, ${addr.district}` : ''}{addr.postal_code ? ` ${addr.postal_code}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <Button variant="ghost" size="sm" onClick={() => startEditAddress(addr)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteAddressMutation.mutate(addr.id)} style={{ color: 'var(--color-danger-600)' }}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {showAddressForm && (
              <form onSubmit={handleAddressSubmit} style={{ padding: 'var(--space-4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Select label="Type" value={addressForm.address_type} onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value })}>
                  <option value="present">Present</option><option value="permanent">Permanent</option><option value="work">Work</option><option value="other">Other</option>
                </Select>
                <Input label="Label" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} />
                <Input label="Division" required value={addressForm.division} onChange={(e) => setAddressForm({ ...addressForm, division: e.target.value })} />
                <Input label="District" required value={addressForm.district} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} />
                <Input label="City" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                <Input label="Area" value={addressForm.area} onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })} />
                <Input label="Postal Code" value={addressForm.postal_code} onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })} />
                <Input label="Address Line" value={addressForm.address_line} onChange={(e) => setAddressForm({ ...addressForm, address_line: e.target.value })} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                  <input type="checkbox" checked={addressForm.is_primary} onChange={(e) => setAddressForm({ ...addressForm, is_primary: e.target.checked })} />
                  Primary address
                </label>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-2)' }}>
                  <Button type="submit" size="sm" loading={createAddressMutation.isPending}>Save Address</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddressForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        onConfirm={() => statusMutation.mutate(pendingStatus)}
        title="Change Account Status"
        message={`Change account status to "${pendingStatus}"? This will ${pendingStatus === 'suspended' ? 'prevent the user from accessing the platform' : pendingStatus === 'active' ? 'restore full access' : 'limit account functionality'}.`}
        confirmLabel="Change Status"
        loading={statusMutation.isPending}
      />

      <ConfirmDialog
        isOpen={showRemoveRoleDialog}
        onClose={() => setShowRemoveRoleDialog(false)}
        onConfirm={() => removeRoleMutation.mutate(pendingRemoveRole)}
        title="Remove Role"
        message={`Remove the "${pendingRemoveRole}" role from this user?`}
        confirmLabel="Remove Role"
        loading={removeRoleMutation.isPending}
      />
    </div>
  )
}
