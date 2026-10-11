import { z } from 'zod'

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine(
    (val) => {
      const cleaned = val.replace(/[\s-]/g, '')
      return /^(?:\+880|880|0)?1[3-9]\d{8}$/.test(cleaned)
    },
    { message: 'Enter a valid Bangladeshi phone number (e.g., 01XXXXXXXXX)' },
  )

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')

export const loginSchema = z.object({
  phone_number: phoneSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerTenantSchema = z.object({
  phone_number: phoneSchema,
  password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your password'),
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().max(50).optional().default(''),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  full_name: z.string().max(200).optional().default(''),
  occupation: z.string().max(100).optional().default(''),
  organization: z.string().max(200).optional().default(''),
  emergency_contact: z.string().max(20).optional().default(''),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export const registerLandlordSchema = z.object({
  phone_number: phoneSchema,
  password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your password'),
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().max(50).optional().default(''),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  legal_name: z.string().max(200).optional().default(''),
  display_name: z.string().max(200).optional().default(''),
  alternate_phone: z.string().max(20).optional().default(''),
  nid_number: z.string().max(30).optional().default(''),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export const verifyPhoneSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d+$/, 'Code must contain only digits'),
})

export const passwordResetSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
})

export const passwordResetConfirmSchema = z.object({
  new_password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
