import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerTenant } from '../../api/auth.api.js'
import { ApiError } from '../../api/client.js'
import { registerTenantSchema } from '../../utils/validation.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'

export default function RegisterTenantPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [registeredPhone, setRegisteredPhone] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerTenantSchema),
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const payload = {
        phone_number: data.phone_number,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name || '',
        email: data.email || '',
        full_name: data.full_name || `${data.first_name} ${data.last_name}`.trim(),
        occupation: data.occupation || '',
        organization: data.organization || '',
        emergency_contact: data.emergency_contact || '',
      }
      await registerTenant(payload)
      setRegisteredPhone(data.phone_number)
      navigate('/auth/verify-phone', { state: { phone: data.phone_number, role: 'tenant' } })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details) {
          setServerError(error.message)
        } else {
          setServerError(error.message)
        }
      } else {
        setServerError('Registration failed. Please try again.')
      }
    }
  }

  if (registeredPhone) {
    return (
      <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <h2 style={{ color: 'var(--color-success-600)' }}>Registration Successful!</h2>
          <p style={{ color: 'var(--color-neutral-600)' }}>
            Your account has been created. Please verify your phone number to activate your account.
          </p>
          <Button onClick={() => navigate('/auth/verify-phone', { state: { phone: registeredPhone } })}>
            Verify Phone Number
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Create Tenant Account</h1>
        <p style={{ color: 'var(--color-neutral-600)' }}>Join HomeLink as a tenant</p>
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
          label="Phone Number"
          type="tel"
          placeholder="01XXXXXXXXX"
          required
          error={errors.phone_number?.message}
          hint="This will be your login ID"
          {...register('phone_number')}
        />

        <Input
          label="First Name"
          placeholder="Your first name"
          required
          error={errors.first_name?.message}
          {...register('first_name')}
        />

        <Input
          label="Last Name"
          placeholder="Your last name"
          error={errors.last_name?.message}
          {...register('last_name')}
        />

        <Input
          label="Email (optional)"
          type="email"
          placeholder="your@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          required
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          required
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <Input
          label="Occupation (optional)"
          placeholder="Your occupation"
          error={errors.occupation?.message}
          {...register('occupation')}
        />

        <Input
          label="Emergency Contact (optional)"
          type="tel"
          placeholder="01XXXXXXXXX"
          error={errors.emergency_contact?.message}
          {...register('emergency_contact')}
        />

        <Button type="submit" loading={isSubmitting} className="btn-full">
          Create Account
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
        Already have an account? <Link to="/auth/login">Sign in</Link>
      </p>
      <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
        Are you a landlord? <Link to="/auth/register/landlord">Register as landlord</Link>
      </p>
    </div>
  )
}
