import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllProperties, verifyProperty } from '../../api/employees.api.js'
import { Card, CardBody } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx'
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'

export default function EmployeeProperties() {
  const queryClient = useQueryClient()
  const [verifyingProperty, setVerifyingProperty] = useState(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['employee-properties'],
    queryFn: () => getAllProperties(),
  })

  const verifyMutation = useMutation({
    mutationFn: verifyProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-properties'] })
      setVerifyingProperty(null)
    },
  })

  const results = data?.results || []

  if (isLoading) return <LoadingSpinner label="Loading properties..." />
  if (isError) return <ErrorState title="Failed to load properties" description={error?.message} onRetry={() => refetch()} />

  const unverifiedProperties = results.filter((p) => !p.ownership_verified)

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Property Verification</h1>

      {unverifiedProperties.length === 0 ? (
        <EmptyState icon="✅" title="All properties verified" description="No properties pending ownership verification." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {unverifiedProperties.map((property) => (
            <Card key={property.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 var(--space-2)' }}>{property.title}</h3>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-neutral-500)' }}>
                      Landlord: {property.landlord_name || 'N/A'} | {property.area}, {property.city}
                    </p>
                  </div>
                  <Badge variant="warning">Unverified</Badge>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>
                  <p style={{ margin: '0 0 var(--space-1)' }}><strong>Type:</strong> {property.category?.replace(/_/g, ' ')}</p>
                  <p style={{ margin: 0 }}><strong>Units:</strong> {property.units?.length || 0}</p>
                </div>
                <Button size="sm" onClick={() => setVerifyingProperty(property)}>
                  Verify Ownership
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!verifyingProperty}
        onClose={() => setVerifyingProperty(null)}
        onConfirm={() => verifyMutation.mutate(verifyingProperty.id)}
        title="Verify Property Ownership"
        message={`Are you sure you want to verify ownership of "${verifyingProperty?.title}"? This confirms the landlord's ownership documents have been reviewed.`}
        confirmLabel="Verify"
        loading={verifyMutation.isPending}
      />
    </div>
  )
}
