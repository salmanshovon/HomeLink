export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={className}
      style={{
        padding: 'var(--space-6)',
        borderBottom: '1px solid var(--border-color)',
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={className}
      style={{
        padding: 'var(--space-4) var(--space-6)',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--color-neutral-50)',
      }}
      {...props}
    >
      {children}
    </div>
  )
}
