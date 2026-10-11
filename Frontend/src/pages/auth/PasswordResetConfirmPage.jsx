import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { confirmPasswordReset } from '../../api/auth.api.js'
import { ApiError } from '../../api/client.js'
import { passwordResetConfirmSchema } from '../../utils/validation.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'

export default function PasswordResetConfirmPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordResetConfirmSchema),
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const uid = urlParams.get('uid')
      const token = urlParams.get('token')

      if (!uid || !token) {
        setServerError('Invalid reset link. Please request a new password reset.')
        return
      }

      await confirmPasswordReset(uid, token, data.new_password)
      setSuccess(true)
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message)
      } else {
        setServerError('Password reset failed. Please try again.')
      }
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <h2 style={{ color: 'var(--color-success-600)' }}>Password Reset Complete</h2>
          <p style={{ color: 'var(--color-neutral-600)' }}>
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Button onClick={() => navigate('/auth/login')}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '420px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Set New Password</h1>
        <p style={{ color: 'var(--color-neutral-600)' }}>Choose a new password for your account</p>
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
          label="New Password"
          type="password"
          placeholder="At least 8 characters"
          required
          error={errors.new_password?.message}
          {...register('new_password')}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Re-enter your new password"
          required
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <Button type="submit" loading={isSubmitting} className="btn-full">
          Reset Password
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
        <Link to="/auth/login">Back to Sign In</Link>
      </p>
    </div>
  )
}
