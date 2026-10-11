export function LoadingSpinner({ size = 'md', label = 'Loading' }) {
  const sizes = { sm: '1rem', md: '2rem', lg: '3rem' }
  const pixelSize = sizes[size] || sizes.md

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <div
        style={{
          width: pixelSize,
          height: pixelSize,
          border: '3px solid var(--color-neutral-200)',
          borderTopColor: 'var(--color-brand-600)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span className="visually-hidden">{label}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function Skeleton({ width = '100%', height = '1rem', className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton height="200px" style={{ borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }} />
      <div className="card-body">
        <Skeleton height="1.5rem" width="60%" style={{ marginBottom: 'var(--space-3)' }} />
        <Skeleton height="1rem" width="80%" style={{ marginBottom: 'var(--space-2)' }} />
        <Skeleton height="1rem" width="40%" />
      </div>
    </div>
  )
}
