import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client.js'
import { loginSchema, registerTenantSchema, registerLandlordSchema } from '../utils/validation.js'

describe('ApiError', () => {
  it('creates an error with status and code', () => {
    const error = new ApiError(400, 'validation_error', 'Invalid input', { field: ['error'] })
    expect(error.status).toBe(400)
    expect(error.code).toBe('validation_error')
    expect(error.message).toBe('Invalid input')
    expect(error.isValidationError).toBe(true)
    expect(error.fieldErrors()).toEqual({ field: ['error'] })
  })

  it('detects auth errors', () => {
    const error = new ApiError(401, 'unauthorized', 'Unauthorized')
    expect(error.isAuthError).toBe(true)
  })

  it('detects permission errors', () => {
    const error = new ApiError(403, 'permission_denied', 'Permission denied')
    expect(error.isPermissionError).toBe(true)
  })

  it('detects not found errors', () => {
    const error = new ApiError(404, 'not_found', 'Not found')
    expect(error.isNotFound).toBe(true)
  })
})

describe('Validation schemas', () => {
  it('loginSchema validates phone and password', async () => {
    const result = loginSchema.safeParse({ phone_number: '01712345678', password: 'password123' })
    expect(result.success).toBe(true)
  })

  it('loginSchema rejects invalid phone', async () => {
    const result = loginSchema.safeParse({ phone_number: '123', password: 'password123' })
    expect(result.success).toBe(false)
  })

  it('loginSchema rejects missing password', async () => {
    const result = loginSchema.safeParse({ phone_number: '01712345678', password: '' })
    expect(result.success).toBe(false)
  })

  it('registerTenantSchema validates matching passwords', async () => {
    const result = registerTenantSchema.safeParse({
      phone_number: '01712345678',
      password: 'password123',
      confirm_password: 'password123',
      first_name: 'Test',
    })
    expect(result.success).toBe(true)
  })

  it('registerTenantSchema rejects mismatched passwords', async () => {
    const result = registerTenantSchema.safeParse({
      phone_number: '01712345678',
      password: 'password123',
      confirm_password: 'different',
      first_name: 'Test',
    })
    expect(result.success).toBe(false)
  })

  it('registerLandlordSchema validates required fields', async () => {
    const result = registerLandlordSchema.safeParse({
      phone_number: '01712345678',
      password: 'password123',
      confirm_password: 'password123',
      first_name: 'Test',
    })
    expect(result.success).toBe(true)
  })
})
