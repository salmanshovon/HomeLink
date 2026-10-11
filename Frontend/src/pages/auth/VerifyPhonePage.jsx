import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifyPhone, resendVerification } from '../../api/auth.api.js'
import { ApiError } from '../../api/client.js'
import { verifyPhoneSchema } from '../../utils/validation.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'

export default function VerifyPhonePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const phone = location.state?.phone || ''
  const [serverError, setServerError] = useState('')
  const [resent, setResent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(verifyPhoneSchema),
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await verifyPhone(phone, data.code)
      navigate('/auth/login', { state: { verified: true } })
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message)
      } else {
        setServerError('Verification failed. Please try again.')
      }
    }
  }

  const handleResend = async () => {
    setResent(false)
    try {
      await resendVerification(phone)
      setResent(true)
    } catch {
      // Always shows generic message to avoid enumeration
      setResent(true)
    }
  }

  return (
    <div style={{ maxWidth: '420px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Verify Your Phone</h1>
        <p style={{ color: 'var(--color-neutral-600)' }}>
          Enter the 6-digit code sent to {phone}
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
          label="Verification Code"
          type="text"
          placeholder="XXXXXX"
          required
          error={errors.code?.message}
          maxLength={6}
          {...register('code')}
        />

        <Button type="submit" loading={isSubmitting} className="btn-full">
          Verify Phone
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-2)' }}>
          Didn&apos;t receive the code?
        </p>
        <button
          onClick={handleResend}
          style={{ background: 'none', border: 'none', color: 'var(--color-brand-600)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}
        >
          Resend Code
        </button>
        {resent && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success-600)', marginTop: 'var(--space-2)' }}>
            If the phone number is registered, a new code has been sent.
          </p>
        )}
      </div>
    </div>
  )
}
