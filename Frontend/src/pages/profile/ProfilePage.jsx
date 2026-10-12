import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { updateProfile } from '../../api/auth.api.js'
import { changePassword as apiChangePassword, listAddresses, createAddress, updateAddress, deleteAddress } from '../../api/profile.api.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Select } from '../../components/common/Select.jsx'
import { Card, CardBody, CardHeader } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { User, KeyRound, MapPin, Plus, Trash2 } from 'lucide-react'

const statusVariant = { active: 'success', pending: 'warning', suspended: 'danger', deactivated: 'neutral' }

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [profileForm, setProfileForm] = useState({})
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [addressForm, setAddressForm] = useState({ address_type: 'present', label: '', division: '', district: '', city: '', area: '', postal_code: '', address_line: '', is_primary: false })
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: listAddresses,
  })

  // Sync profile form when user data changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (user) {
      const base = { first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '' }
      if (user.profile?.full_name !== undefined) {
        setProfileForm({ ...base, full_name: user.profile.full_name || '', occupation: user.profile.occupation || '', organization: user.profile.organization || '', emergency_contact: user.profile.emergency_contact || '', preferred_contact_method: user.profile.preferred_contact_method || 'phone' })
      } else if (user.profile?.legal_name !== undefined) {
        setProfileForm({ ...base, legal_name: user.profile.legal_name || '', display_name: user.profile.display_name || '', alternate_phone: user.profile.alternate_phone || '', email: user.profile.email || user.email || '' })
      } else {
        setProfileForm(base)
      }
    }
  }, [user])

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => queryClient.invalidateQueries(['current-user']),
  })

  const passwordMutation = useMutation({
    mutationFn: ({ old_password, new_password }) => apiChangePassword(old_password, new_password),
    onSuccess: () => setPasswordForm({ old_password: '', new_password: '', confirm_password: '' }),
  })

  const createAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => { queryClient.invalidateQueries(['my-addresses']); setShowAddressForm(false); setAddressForm({ address_type: 'present', label: '', division: '', district: '', city: '', area: '', postal_code: '', address_line: '', is_primary: false }) },
  })

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAddress(id, payload),
    onSuccess: () => { queryClient.invalidateQueries(['my-addresses']); setEditingAddress(null) },
  })

  const deleteAddressMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => { queryClient.invalidateQueries(['my-addresses']); setDeleteTarget(null) },
  })

  const handleProfileSave = (e) => {
    e.preventDefault()
    profileMutation.mutate(profileForm)
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) return
    passwordMutation.mutate({ old_password: passwordForm.old_password, new_password: passwordForm.new_password })
  }

  const handleAddressSubmit = (e) => {
    e.preventDefault()
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress, payload: addressForm })
    } else {
      createAddressMutation.mutate(addressForm)
    }
  }

  const startEditAddress = (addr) => {
    setEditingAddress(addr.id)
    setAddressForm({ address_type: addr.address_type, label: addr.label || '', division: addr.division, district: addr.district, city: addr.city, area: addr.area || '', postal_code: addr.postal_code || '', address_line: addr.address_line || '', is_primary: addr.is_primary })
    setShowAddressForm(true)
  }

  if (authLoading) return <LoadingSpinner />

  const addresses = addressesData?.results || addressesData || []
  const isTenant = user?.profile?.full_name !== undefined
  const isLandlord = user?.profile?.legal_name !== undefined

  const tabs = [
    { key: 'profile', label: 'Profile', icon: <User size={16} /> },
    { key: 'password', label: 'Password', icon: <KeyRound size={16} /> },
    { key: 'addresses', label: 'Addresses', icon: <MapPin size={16} /> },
  ]

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ margin: 0 }}>My Profile</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <Badge variant={statusVariant[user?.account_status] || 'neutral'}>{user?.account_status}</Badge>
          {(user?.roles || []).map((role) => <Badge key={role} variant="info">{role}</Badge>)}
          {user?.is_phone_verified && <Badge variant="success">Phone Verified</Badge>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-color)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--color-primary-600)' : '2px solid transparent',
              fontWeight: activeTab === tab.key ? 'var(--font-semibold)' : 'var(--font-normal)',
              color: activeTab === tab.key ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ maxWidth: 700 }}>
          {profileMutation.isError && (
            <Card style={{ marginBottom: 'var(--space-4)', borderColor: 'var(--color-danger-300)' }}>
              <CardBody>
                <p style={{ color: 'var(--color-danger-600)', margin: 0 }}>{profileMutation.error?.response?.data?.error?.message || profileMutation.error?.message || 'Update failed'}</p>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader><strong>Personal Information</strong></CardHeader>
            <CardBody>
              <form onSubmit={handleProfileSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-4)' }}>
                  <Input label="First Name" value={profileForm.first_name || ''} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} />
                  <Input label="Last Name" value={profileForm.last_name || ''} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} />
                  <Input label="Email" type="email" value={profileForm.email || ''} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                  <Input label="Phone Number" value={user?.phone_number} disabled hint="Phone number cannot be changed" />
                  {isTenant && (
                    <>
                      <Input label="Full Name" value={profileForm.full_name || ''} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                      <Input label="Occupation" value={profileForm.occupation || ''} onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })} />
                      <Input label="Organization" value={profileForm.organization || ''} onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })} />
                      <Input label="Emergency Contact" value={profileForm.emergency_contact || ''} onChange={(e) => setProfileForm({ ...profileForm, emergency_contact: e.target.value })} />
                      <Select label="Preferred Contact" value={profileForm.preferred_contact_method || 'phone'} onChange={(e) => setProfileForm({ ...profileForm, preferred_contact_method: e.target.value })}>
                        <option value="phone">Phone</option><option value="email">Email</option><option value="sms">SMS</option><option value="app">In-app</option>
                      </Select>
                    </>
                  )}
                  {isLandlord && (
                    <>
                      <Input label="Legal Name" value={profileForm.legal_name || ''} onChange={(e) => setProfileForm({ ...profileForm, legal_name: e.target.value })} />
                      <Input label="Display Name" value={profileForm.display_name || ''} onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })} />
                      <Input label="Alternate Phone" value={profileForm.alternate_phone || ''} onChange={(e) => setProfileForm({ ...profileForm, alternate_phone: e.target.value })} />
                    </>
                  )}
                </div>
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <Button type="submit" loading={profileMutation.isPending}>Save Changes</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'password' && (
        <div style={{ maxWidth: 500 }}>
          {passwordMutation.isError && (
            <Card style={{ marginBottom: 'var(--space-4)', borderColor: 'var(--color-danger-300)' }}>
              <CardBody>
                <p style={{ color: 'var(--color-danger-600)', margin: 0 }}>{passwordMutation.error?.response?.data?.error?.message || passwordMutation.error?.message || 'Password change failed'}</p>
              </CardBody>
            </Card>
          )}
          {passwordMutation.isSuccess && (
            <Card style={{ marginBottom: 'var(--space-4)', borderColor: 'var(--color-success-300)' }}>
              <CardBody>
                <p style={{ color: 'var(--color-success-700)', margin: 0 }}>Password changed successfully.</p>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader><strong>Change Password</strong></CardHeader>
            <CardBody>
              <form onSubmit={handlePasswordChange}>
                <Input label="Current Password" type="password" required value={passwordForm.old_password} onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })} />
                <Input label="New Password" type="password" required value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} hint="Min 8 chars, not entirely numeric" />
                <Input label="Confirm New Password" type="password" required value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} />
                {passwordForm.new_password && passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                  <p style={{ color: 'var(--color-danger-600)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>Passwords do not match</p>
                )}
                <Button type="submit" loading={passwordMutation.isPending} disabled={!passwordForm.old_password || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm_password}>
                  <KeyRound size={16} /> Change Password
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'addresses' && (
        <div style={{ maxWidth: 800 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ margin: 0 }}>My Addresses</h2>
            <Button variant="secondary" size="sm" onClick={() => { setShowAddressForm(true); setEditingAddress(null); setAddressForm({ address_type: 'present', label: '', division: '', district: '', city: '', area: '', postal_code: '', address_line: '', is_primary: false }) }}>
              <Plus size={16} /> Add Address
            </Button>
          </div>
          {addressesLoading && <LoadingSpinner />}
          {!addressesLoading && addresses.length === 0 && !showAddressForm && (
            <Card><CardBody><p style={{ color: 'var(--color-neutral-500)', margin: 0, textAlign: 'center' }}>No addresses saved yet.</p></CardBody></Card>
          )}
          {addresses.map((addr) => (
            <Card key={addr.id} style={{ marginBottom: 'var(--space-3)' }}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <Badge variant="info">{addr.address_type}</Badge>
                      {addr.is_primary && <Badge variant="success">Primary</Badge>}
                      {addr.label && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{addr.label}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-700)' }}>
                      {addr.address_line}{addr.address_line && (addr.area || addr.city) ? ', ' : ''}{addr.area}{addr.area && addr.city ? ', ' : ''}{addr.city}{addr.district ? `, ${addr.district}` : ''}{addr.division ? `, ${addr.division}` : ''}{addr.postal_code ? ` ${addr.postal_code}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <Button variant="ghost" size="sm" onClick={() => startEditAddress(addr)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(addr)} style={{ color: 'var(--color-danger-600)' }}><Trash2 size={14} /></Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
          {showAddressForm && (
            <Card style={{ marginTop: 'var(--space-4)' }}>
              <CardHeader><strong>{editingAddress ? 'Edit Address' : 'New Address'}</strong></CardHeader>
              <CardBody>
                <form onSubmit={handleAddressSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-4)' }}>
                    <Select label="Type" value={addressForm.address_type} onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value })}>
                      <option value="present">Present</option><option value="permanent">Permanent</option><option value="work">Work</option><option value="other">Other</option>
                    </Select>
                    <Input label="Label" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} placeholder="Home, Office..." />
                    <Input label="Division" required value={addressForm.division} onChange={(e) => setAddressForm({ ...addressForm, division: e.target.value })} />
                    <Input label="District" required value={addressForm.district} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} />
                    <Input label="City" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                    <Input label="Area" value={addressForm.area} onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })} />
                    <Input label="Postal Code" value={addressForm.postal_code} onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })} />
                    <Input label="Address Line" value={addressForm.address_line} onChange={(e) => setAddressForm({ ...addressForm, address_line: e.target.value })} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                    <input type="checkbox" checked={addressForm.is_primary} onChange={(e) => setAddressForm({ ...addressForm, is_primary: e.target.checked })} />
                    Primary address
                  </label>
                  <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
                    <Button type="submit" size="sm" loading={createAddressMutation.isPending || updateAddressMutation.isPending}>Save</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => { setShowAddressForm(false); setEditingAddress(null) }}>Cancel</Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteAddressMutation.mutate(deleteTarget.id)}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteAddressMutation.isPending}
      />
    </div>
  )
}
