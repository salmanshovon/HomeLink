export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-4)',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            background: 'var(--color-neutral-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-4)',
            fontSize: '1.5rem',
          }}
        >
          {icon}
        </div>
      )}
      <h3 style={{ marginBottom: 'var(--space-2)' }}>{title}</h3>
      {description && (
        <p style={{ color: 'var(--color-neutral-600)', maxWidth: '400px', marginBottom: 'var(--space-6)' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
