import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, Search, Eye, UserPlus } from 'lucide-react'
import { adminListUsers } from '../../api/admin.api.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'
import { Select } from '../../components/common/Select.jsx'
import { Card, CardBody, CardHeader } from '../../components/common/Card.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'

const statusVariant = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  deactivated: 'neutral',
}

const roleVariant = {
  landlord: 'info',
  tenant: 'neutral',
  employee: 'warning',
  superadmin: 'danger',
}

export default function AdminUserListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter],
    queryFn: () =>
      adminListUsers({
        search: search || undefined,
        roles: roleFilter || undefined,
        account_status: statusFilter || undefined,
        page_size: 50,
      }),
  })

  const updateParams = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams)
      if (value) next.set(key, value)
      else next.delete(key)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const handleSearch = (e) => {
    e.preventDefault()
    updateParams('search', search)
  }

  // Sync from URL to local state when URL changes (e.g., back/forward navigation)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    setRoleFilter(searchParams.get('role') || '')
    setStatusFilter(searchParams.get('status') || '')
  }, [searchParams])

  const users = data?.results || data || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ margin: 0 }}>User Management</h1>
          <p style={{ color: 'var(--color-neutral-600)', margin: 'var(--space-1) 0 0' }}>
            View and manage all registered users
          </p>
        </div>
        <Button href="/admin/users/create-employee" variant="secondary">
          <UserPlus size={16} /> Create Employee
        </Button>
      </div>

      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardBody>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input
                label="Search"
                placeholder="Phone, email, or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
              />
            </div>
            <div style={{ width: 160 }}>
              <Select
                label="Role"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); updateParams('role', e.target.value) }}
              >
                <option value="">All roles</option>
                <option value="landlord">Landlord</option>
                <option value="tenant">Tenant</option>
                <option value="employee">Employee</option>
                <option value="superadmin">Superadmin</option>
              </Select>
            </div>
            <div style={{ width: 160 }}>
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); updateParams('status', e.target.value) }}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
              </Select>
            </div>
            <Button type="submit" variant="secondary">
              <Search size={16} /> Search
            </Button>
          </form>
        </CardBody>
      </Card>

      {isLoading && <LoadingSpinner />}

      {error && (
        <ErrorState
          title="Failed to load users"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && users.length === 0 && (
        <Card>
          <EmptyState
            icon={<Users size={28} />}
            title="No users found"
            description="Try adjusting your search or filter criteria."
          />
        </Card>
      )}

      {!isLoading && !error && users.length > 0 && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Users</strong>
              <Badge variant="neutral">{data?.count || users.length} total</Badge>
            </div>
          </CardHeader>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'left', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>Phone</th>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'left', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>Name</th>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'left', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>Email</th>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'left', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>Roles</th>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'left', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>Status</th>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'left', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>Joined</th>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'right', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 'var(--space-4) var(--space-6)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>{user.phone_number}</td>
                    <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                      {user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-6)', fontSize: 'var(--text-sm)' }}>
                      {user.email || <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                        {(user.roles || []).map((role) => (
                          <Badge key={role} variant={roleVariant[role] || 'neutral'}>{role}</Badge>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                      <Badge variant={statusVariant[user.account_status] || 'neutral'}>
                        {user.account_status}
                      </Badge>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'right' }}>
                      <Button href={`/admin/users/${user.id}`} variant="ghost" size="sm">
                        <Eye size={14} /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
