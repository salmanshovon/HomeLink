import { forwardRef, useId } from 'react'

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className = '', id, rows = 4, ...props },
  ref,
) {
  const autoId = useId()
  const textareaId = id || autoId
  const errorId = `${textareaId}-error`
  const hintId = `${textareaId}-hint`

  return (
    <div className="form-field" style={{ marginBottom: 'var(--space-4)' }}>
      {label && (
        <label
          htmlFor={textareaId}
          style={{
            display: 'block',
            marginBottom: 'var(--space-2)',
            fontWeight: 'var(--font-medium)',
            fontSize: 'var(--text-sm)',
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--color-danger-600)', marginLeft: '2px' }}>*</span>
          )}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        className={`textarea ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        aria-required={required ? 'true' : undefined}
        {...props}
      />
      {error && (
        <p
          id={errorId}
          role="alert"
          style={{
            marginTop: 'var(--space-1)',
            fontSize: 'var(--text-sm)',
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
            fontSize: 'var(--text-sm)',
            color: 'var(--color-neutral-500)',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  )
})
