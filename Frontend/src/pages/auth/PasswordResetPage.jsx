import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { requestPasswordReset } from '../../api/auth.api.js'
import { ApiError } from '../../api/client.js'
import { passwordResetSchema } from '../../utils/validation.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'

export default function PasswordResetPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordResetSchema),
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await requestPasswordReset(data.identifier)
      setSent(true)
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message)
      } else {
        setServerError('Request failed. Please try again.')
      }
    }
  }

  if (sent) {
    return (
      <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <h2 style={{ color: 'var(--color-success-600)' }}>Check Your Inbox</h2>
          <p style={{ color: 'var(--color-neutral-600)' }}>
            If an account exists for that email or phone number, password reset instructions have been sent.
          </p>
          <Link to="/auth/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 'var(--space-4)' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '420px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Reset Password</h1>
        <p style={{ color: 'var(--color-neutral-600)' }}>
          Enter your email or phone number and we&apos;ll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ padding: 'var(--space-8)' }}>
        {serverError && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-danger-50)',
              border: '1px solid var(--color-danger-200)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-6)',
              color: 'var(--color-danger-700)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {serverError}
          </div>
        )}

        <Input
          label="Email or Phone Number"
          type="text"
          placeholder="your@email.com or 01XXXXXXXXX"
          required
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <Button type="submit" loading={isSubmitting} className="btn-full">
          Send Reset Instructions
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
        <Link to="/auth/login">Back to Sign In</Link>
      </p>
    </div>
  )
}
