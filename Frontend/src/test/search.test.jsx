import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import SearchPage from '../pages/public/SearchPage.jsx'

const mockSearchListings = vi.fn()
const mockGetLocationFacets = vi.fn()
const mockGetAmenities = vi.fn()

vi.mock('../api/properties.api.js', () => ({
  searchListings: (...args) => mockSearchListings(...args),
  getLocationFacets: (...args) => mockGetLocationFacets(...args),
  getAmenities: (...args) => mockGetAmenities(...args),
}))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderSearchPage(searchParams = '') {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/search${searchParams}`]}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetLocationFacets.mockResolvedValue({ districts: ['Dhaka'], cities: ['Dhaka'], areas: ['Dhanmondi'] })
    mockGetAmenities.mockResolvedValue([{ id: 1, name: 'Parking', slug: 'parking' }])
    mockSearchListings.mockResolvedValue({ count: 0, results: [], next: null, previous: null })
  })

  it('renders search filters', () => {
    renderSearchPage()
    expect(screen.getByPlaceholderText('Keyword...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Area, city, or neighborhood')).toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    renderSearchPage()
    await waitFor(() => {
      expect(screen.getByText('No properties found')).toBeInTheDocument()
    })
  })

  it('calls search with filters when submitted', async () => {
    const user = userEvent.setup()
    renderSearchPage()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Keyword...')).toBeInTheDocument()
    })
    await user.type(screen.getByPlaceholderText('Keyword...'), 'apartment')
    await waitFor(() => {
      expect(mockSearchListings).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'apartment' }),
      )
    })
  })

  it('resets filters when reset is clicked', async () => {
    const user = userEvent.setup()
    renderSearchPage()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Keyword...')).toBeInTheDocument()
    })
    await user.type(screen.getByPlaceholderText('Keyword...'), 'test')
    await user.click(screen.getByText('Reset all'))
    await waitFor(() => {
      expect(mockSearchListings).toHaveBeenCalledWith(
        expect.objectContaining({ search: '' }),
      )
    })
  })
})
