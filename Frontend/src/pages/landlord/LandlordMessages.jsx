import { useQuery } from '@tanstack/react-query'
import { getMyConversations } from '../../api/tenants.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { formatDateTime } from '../../utils/date.js'

export default function LandlordMessages() {
  const { data, isLoading } = useQuery({
    queryKey: ['landlord-conversations'],
    queryFn: () => getMyConversations(),
  })

  const results = data?.results || []

  if (isLoading) return <LoadingSpinner label="Loading messages..." />

  if (results.length === 0) {
    return <EmptyState icon="💬" title="No messages" description="Your conversations with tenants and support will appear here." />
  }

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Messages</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {results.map((conv) => (
          <Card key={conv.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--space-2)' }}>{conv.subject || conv.conversation_type_display || 'Conversation'}</h3>
                  {conv.last_message && (
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
                      {conv.last_message.body?.substring(0, 100)}...
                    </p>
                  )}
                </div>
                {conv.unread_count > 0 && (
                  <span style={{ background: 'var(--color-brand-600)', color: 'var(--color-neutral-0)', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>
                    {conv.unread_count} new
                  </span>
                )}
              </div>
              <p style={{ margin: 'var(--space-3) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                Last activity: {formatDateTime(conv.last_message?.created_at || conv.updated_at)}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
