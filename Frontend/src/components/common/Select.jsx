import { forwardRef, useId } from 'react'

export const Select = forwardRef(function Select(
  { label, error, hint, required, children, className = '', id, ...props },
  ref,
) {
  const autoId = useId()
  const selectId = id || autoId
  const errorId = `${selectId}-error`
  const hintId = `${selectId}-hint`

  return (
    <div className="form-field" style={{ marginBottom: 'var(--space-3)' }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            display: 'block',
            marginBottom: 'var(--space-1)',
            fontWeight: 'var(--font-medium)',
            fontSize: 'var(--text-xs)',
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--color-danger-600)', marginLeft: '2px' }}>*</span>
          )}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={`select ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        aria-required={required ? 'true' : undefined}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p
          id={errorId}
          role="alert"
          style={{
            marginTop: 'var(--space-1)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-danger-600)',
          }}
        >
          {error}
        </p>
      )}
      {!error && hint && (
        <p
          id={hintId}
          style={{
            marginTop: 'var(--space-1)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-neutral-500)',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  )
})
