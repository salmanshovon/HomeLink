import { describe, expect, it } from 'vitest'
import { formatLocation } from '../utils/location.js'

describe('formatLocation', () => {
  it('shows area and city only', () => {
    expect(formatLocation({ area: 'Kafrul', city: 'Dhaka', district: 'Dhaka', division: 'Dhaka' }))
      .toBe('Kafrul, Dhaka')
  })

  it('never repeats the city when area and city share a name', () => {
    expect(formatLocation({ area: 'Dhaka', city: 'Dhaka', district: 'Dhaka' })).toBe('Dhaka')
  })

  it('falls back to city when there is no area', () => {
    expect(formatLocation({ area: '', city: 'Dhaka', district: 'Dhaka' })).toBe('Dhaka')
  })

  it('falls back to public_location when area and city are missing', () => {
    expect(formatLocation({ area: '', city: '', public_location: 'Dhanmondi, Dhaka' }))
      .toBe('Dhanmondi, Dhaka')
  })

  it('prefers area and city over public_location', () => {
    expect(formatLocation({ area: 'Banani', city: 'Dhaka', public_location: 'somewhere else' }))
      .toBe('Banani, Dhaka')
  })

  it('de-duplicates case-insensitively', () => {
    expect(formatLocation({ area: 'Dhaka', city: 'dhaka' })).toBe('Dhaka')
  })

  it('trims whitespace and ignores missing values', () => {
    expect(formatLocation({ area: '  Mirpur  ', city: 'Dhaka', district: null })).toBe('Mirpur, Dhaka')
    expect(formatLocation({ area: null, city: undefined })).toBe('Location unavailable')
  })

  it('handles an empty object and null safely', () => {
    expect(formatLocation({})).toBe('Location unavailable')
    expect(formatLocation(null)).toBe('Location unavailable')
  })
})