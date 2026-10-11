import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../components/common/Button.jsx'
import { Badge } from '../components/common/Badge.jsx'
import { Card, CardBody } from '../components/common/Card.jsx'
import { EmptyState } from '../components/common/EmptyState.jsx'
import { ErrorState } from '../components/common/ErrorState.jsx'
import { formatBDT } from '../utils/currency.js'
import { formatDate } from '../utils/date.js'

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('Button', () => {
  it('renders with text', () => {
    renderWithRouter(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    renderWithRouter(<Button loading>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders as link when href is provided', () => {
    renderWithRouter(<Button href="/test">Go</Button>)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test')
  })
})

describe('Badge', () => {
  it('renders with variant', () => {
    renderWithRouter(<Badge variant="success">Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})

describe('Card', () => {
  it('renders children', () => {
    renderWithRouter(
      <Card>
        <CardBody>Card content</CardBody>
      </Card>,
    )
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders title and description', () => {
    renderWithRouter(<EmptyState title="No data" description="Nothing here" />)
    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('renders error message', () => {
    renderWithRouter(<ErrorState title="Error" description="Something failed" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Something failed')).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn()
    renderWithRouter(<ErrorState title="Error" description="Failed" onRetry={onRetry} />)
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })
})

describe('formatBDT', () => {
  it('formats numbers as BDT currency', () => {
    expect(formatBDT(25000)).toContain('25,000')
    expect(formatBDT('50000')).toContain('50,000')
  })

  it('handles null/undefined', () => {
    expect(formatBDT(null)).toBe('—')
    expect(formatBDT(undefined)).toBe('—')
  })
})

describe('formatDate', () => {
  it('formats date strings', () => {
    expect(formatDate('2026-01-15')).toContain('2026')
  })

  it('handles null/undefined', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })
})
