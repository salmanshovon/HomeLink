import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
}

const sizes = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', href, loading, className = '', children, disabled, ...props },
  ref,
) {
  const classes = ['btn', variants[variant], sizes[size], className].filter(Boolean).join(' ')
  const isDisabled = disabled || loading

  const content = (
    <>
      {loading && (
        <span
          className="spinner-sm"
          style={{
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </>
  )

  if (href) {
    return (
      <Link to={href} className={classes} ref={ref} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={isDisabled} ref={ref} {...props}>
      {content}
    </button>
  )
})
