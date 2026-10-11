import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/tenants.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { formatDateTime } from '../../utils/date.js'

export default function TenantNotifications() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-notifications'],
    queryFn: () => getMyNotifications(),
  })

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] }),
  })

  const results = data?.results || []
  const unreadCount = results.filter((n) => !n.is_read).length

  if (isLoading) return <LoadingSpinner label="Loading notifications..." />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0 }}>Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={() => markAllMutation.mutate()} loading={markAllMutation.isPending}>
            Mark all as read
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications" description="You're all caught up!" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {results.map((notification) => (
            <Card key={notification.id} onClick={() => !notification.is_read && markReadMutation.mutate(notification.id)}>
              <CardBody style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: notification.is_read ? 'default' : 'pointer' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    {!notification.is_read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-brand-600)', flexShrink: 0 }} />
                    )}
                    <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{notification.title}</h3>
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{notification.body}</p>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)', whiteSpace: 'nowrap', marginLeft: 'var(--space-4)' }}>
                  {formatDateTime(notification.created_at)}
                </span>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
