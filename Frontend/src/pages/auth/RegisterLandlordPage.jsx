import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerLandlord } from '../../api/auth.api.js'
import { ApiError } from '../../api/client.js'
import { registerLandlordSchema } from '../../utils/validation.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'

export default function RegisterLandlordPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [registeredPhone, setRegisteredPhone] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerLandlordSchema),
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
        legal_name: data.legal_name || data.first_name,
        display_name: data.display_name || '',
        alternate_phone: data.alternate_phone || '',
        nid_number: data.nid_number || '',
      }
      await registerLandlord(payload)
      setRegisteredPhone(data.phone_number)
      navigate('/auth/verify-phone', { state: { phone: data.phone_number, role: 'landlord' } })
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message)
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
            Your landlord account has been created. Please verify your phone number to activate your account.
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
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Create Landlord Account</h1>
        <p style={{ color: 'var(--color-neutral-600)' }}>List your property on HomeLink</p>
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
          label="Legal Name (optional)"
          placeholder="Your legal name for agreements"
          error={errors.legal_name?.message}
          {...register('legal_name')}
        />

        <Input
          label="Display Name (optional)"
          placeholder="How you want to be shown to tenants"
          error={errors.display_name?.message}
          {...register('display_name')}
        />

        <Input
          label="Alternate Phone (optional)"
          type="tel"
          placeholder="01XXXXXXXXX"
          error={errors.alternate_phone?.message}
          {...register('alternate_phone')}
        />

        <Input
          label="NID Number (optional)"
          placeholder="Your NID number"
          error={errors.nid_number?.message}
          hint="Used for identity verification only"
          {...register('nid_number')}
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

        <Button type="submit" loading={isSubmitting} className="btn-full">
          Create Account
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
        Already have an account? <Link to="/auth/login">Sign in</Link>
      </p>
      <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
        Are you a tenant? <Link to="/auth/register/tenant">Register as tenant</Link>
      </p>
    </div>
  )
}
