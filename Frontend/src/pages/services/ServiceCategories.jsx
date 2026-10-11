import { useQuery } from '@tanstack/react-query'
import { getServiceCategories } from '../../api/services.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'

export default function ServiceCategories({ onSelectCategory }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['service-categories'],
    queryFn: getServiceCategories,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <LoadingSpinner label="Loading services..." />
  if (isError) return <ErrorState title="Failed to load services" description={error?.message} onRetry={() => refetch()} />

  const results = data?.results || data || []

  if (results.length === 0) {
    return <EmptyState icon="🔧" title="No services available" description="Please check back later for available services." />
  }

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Home Maintenance Services</h1>
      <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-8)', maxWidth: '600px' }}>
        Select a service category to request maintenance or repair services for your home.
        Our experienced technicians are ready to help.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
        {results.map((category) => (
          <Card key={category.id}>
            <CardBody>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>{category.name}</h3>
              {category.description && (
                <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{category.description}</p>
              )}
              <Button size="sm" variant="outline" onClick={() => onSelectCategory(category)}>
                Request Service
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
