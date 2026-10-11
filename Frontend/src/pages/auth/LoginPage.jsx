import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { ApiError } from '../../api/client.js'
import { loginSchema } from '../../utils/validation.js'
import { Button } from '../../components/common/Button.jsx'
import { Input } from '../../components/common/Input.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const user = await login(data.phone_number, data.password)
      const from = location.state?.from || getDefaultRoute(user)
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message)
      } else {
        setServerError('Login failed. Please try again.')
      }
    }
  }

  return (
    <div style={{ maxWidth: '420px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Sign In</h1>
        <p style={{ color: 'var(--color-neutral-600)' }}>Welcome back to HomeLink</p>
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
          error={errors.phone_number?.message}
          {...register('phone_number')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div style={{ marginBottom: 'var(--space-6)', textAlign: 'right' }}>
          <Link to="/auth/password-reset" style={{ fontSize: 'var(--text-sm)' }}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="btn-full">
          Sign In
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
        Don&apos;t have an account?{' '}
        <Link to="/auth/register/tenant">Create one</Link>
      </p>
    </div>
  )
}

function getDefaultRoute(user) {
  const roles = (user?.roles || []).map((r) => r.toUpperCase())
  if (roles.includes('SUPERADMIN')) return '/admin'
  if (roles.includes('EMPLOYEE')) return '/employee'
  if (roles.includes('LANDLORD')) return '/landlord'
  if (roles.includes('TENANT')) return '/tenant'
  return '/'
}
