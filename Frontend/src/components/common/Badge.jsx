const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
}

export function Badge({ variant = 'neutral', children, className = '', ...props }) {
  return (
    <span className={`badge ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  )
}
