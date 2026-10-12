import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockToggleSave = vi.fn()
const mockGetDetails = vi.fn()
const mockGetMedia = vi.fn()

vi.mock('../api/properties.api.js', () => ({
  toggleSaveProperty: (...a) => mockToggleSave(...a),
  getPropertyDetails: (...a) => mockGetDetails(...a),
  getPropertyMedia: (...a) => mockGetMedia(...a),
  createInquiry: vi.fn(),
}))

const mockAuth = { isAuthenticated: false, user: null }
vi.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => mockAuth,
}))

const PENDING_SAVE_KEY = 'homelink:pending-save'
const PROP_ID = '11111111-2222-3333-4444-555555555555'

async function renderPage({ authenticated }) {
  mockAuth.isAuthenticated = authenticated
  mockAuth.user = authenticated ? { roles: ['TENANT'] } : null

  const Page = (await import('../pages/public/PropertyDetailsPage.jsx')).default
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[`/properties/${PROP_ID}`]}>
        <Routes>
          <Route path="/properties/:id" element={<Page />} />
          <Route path="/auth/login" element={<div>SignInPage</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  mockGetDetails.mockResolvedValue({
    id: PROP_ID, title: 'Test', reference: 'PROP-1',
    listings: [{ monthly_rent: 20000, status_display: 'Published', bedrooms: 2, bathrooms: 2 }],
  })
  mockGetMedia.mockResolvedValue([])
})

describe('PropertyDetailsPage save flow', () => {
  it('guest clicking Save goes to sign-in and records the pending property', async () => {
    await renderPage({ authenticated: false })

    const btn = await screen.findByRole('button', { name: /sign in to save/i })
    btn.click()

    await waitFor(() => {
      expect(sessionStorage.getItem(PENDING_SAVE_KEY)).toBe(PROP_ID)
    })
    expect(await screen.findByText('SignInPage')).toBeInTheDocument()
    expect(mockToggleSave).not.toHaveBeenCalled()
  })

  it('auto-saves on return after sign-in, then clears the flag', async () => {
    sessionStorage.setItem(PENDING_SAVE_KEY, PROP_ID)
    mockToggleSave.mockResolvedValue({ id: 's1' })

    await renderPage({ authenticated: true })

    await waitFor(() => expect(mockToggleSave).toHaveBeenCalledWith(PROP_ID))
    expect(sessionStorage.getItem(PENDING_SAVE_KEY)).toBeNull()
  })

  it('does not auto-save when no pending property is recorded', async () => {
    mockToggleSave.mockResolvedValue({ id: 's1' })
    await renderPage({ authenticated: true })
    await waitFor(() => expect(screen.getByRole('button', { name: /save property/i })).toBeTruthy())
    expect(mockToggleSave).not.toHaveBeenCalled()
  })
})