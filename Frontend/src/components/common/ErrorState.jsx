export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error while loading this content. Please try again.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={className}
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-4)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          background: 'var(--color-danger-50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
          fontSize: '1.5rem',
        }}
      >
        ⚠️
      </div>
      <h3 style={{ marginBottom: 'var(--space-2)' }}>{title}</h3>
      <p style={{ color: 'var(--color-neutral-600)', maxWidth: '400px', marginBottom: 'var(--space-6)' }}>
        {description}
      </p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
