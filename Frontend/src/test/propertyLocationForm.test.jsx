import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFetchLocations = vi.fn()
vi.mock('../api/properties.api.js', () => ({
  fetchLocations: (...a) => mockFetchLocations(...a),
}))

vi.mock('../api/landlords.api.js', () => ({
  getMyProperties: () => Promise.resolve({ results: [] }),
  createProperty: vi.fn(),
  updateProperty: vi.fn(),
  deleteProperty: vi.fn(),
  addUnit: vi.fn(),
  updateUnit: vi.fn(),
  uploadPropertyMedia: vi.fn(),
  getPropertyMedia: () => Promise.resolve([]),
  deletePropertyMedia: vi.fn(),
}))

const Page = (await import('../pages/landlord/LandlordProperties.jsx')).default

const DHAKA = 'Dhaka'
const OTHER_DISTRICT = 'Gazipur'

function mockApi() {
  mockFetchLocations.mockImplementation((level, parent) => {
    if (level === 'division') {
      return Promise.resolve([
        { id: 'd1', name: DHAKA },
        { id: 'd2', name: 'Sylhet' },
      ])
    }
    if (level === 'district') {
      if (parent === 'd1') {
        return Promise.resolve([
          { id: 'dd1', name: DHAKA },
          { id: 'dd2', name: OTHER_DISTRICT },
        ])
      }
      return Promise.resolve([])
    }
    if (level === 'city') {
      if (parent === 'dd1') return Promise.resolve([{ id: 'c1', name: DHAKA }])
      if (parent === 'dd2') return Promise.resolve([{ id: 'c2', name: OTHER_DISTRICT }])
      return Promise.resolve([])
    }
    if (level === 'area') {
      if (parent === 'c1') {
        return Promise.resolve([
          { id: 'a1', name: 'Uttara' },
          { id: 'a2', name: 'Banani' },
        ])
      }
      return Promise.resolve([])
    }
    return Promise.resolve([])
  })
}

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Page />
    </QueryClientProvider>,
  )
}

async function openForm() {
  await userEvent.click(screen.getByRole('button', { name: /add property/i }))
}

// Labels render a trailing "*" for required fields, so match on a prefix.
const selectOf = (label) =>
  screen.getByRole('combobox', { name: new RegExp(`^${label}`) })

beforeEach(() => {
  vi.clearAllMocks()
  // Set the implementation AFTER clearing, otherwise clearAllMocks wipes it.
  mockApi()
})

describe('property form location cascade', () => {
  it('locks division/district/city to Dhaka and offers Dhaka areas', async () => {
    renderPage()
    await openForm()

    await waitFor(() => expect(selectOf('Division')).toBeInTheDocument())

    // Dhaka locked in by default.
    await waitFor(() => expect(selectOf('Division')).toHaveValue(DHAKA))
    await waitFor(() => expect(selectOf('District')).toHaveValue(DHAKA))
    await waitFor(() => expect(selectOf('City')).toHaveValue(DHAKA))

    // All three are unselectable for now.
    expect(selectOf('Division')).toBeDisabled()
    expect(selectOf('District')).toBeDisabled()
    expect(selectOf('City')).toBeDisabled()

    // Areas come from the selected city and ARE selectable.
    const area = selectOf('Area')
    await waitFor(() => expect(area).toBeEnabled())
    await waitFor(() => expect(area).toHaveDisplayValue('Select area'))

    const options = [...area.querySelectorAll('option')].map((o) => o.value)
    expect(options).toContain('Uttara')
    expect(options).toContain('Banani')

    await userEvent.selectOptions(area, 'Uttara')
    expect(area).toHaveValue('Uttara')
  })

  it('fetched the cascade from the API in order', async () => {
    renderPage()
    await openForm()

    // The chain resolves level by level; wait until the area request lands.
    await waitFor(() => {
      const levels = mockFetchLocations.mock.calls.map((c) => c[0])
      expect(levels).toContain('area')
    })

    const levels = mockFetchLocations.mock.calls.map((c) => c[0])
    // Parent id must be passed so the server filters correctly.
    const districtCall = mockFetchLocations.mock.calls.find((c) => c[0] === 'district')
    expect(districtCall?.[1]).toBe('d1')
  })
})