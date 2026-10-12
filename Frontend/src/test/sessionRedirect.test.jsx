import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it, afterEach } from 'vitest'
import { SESSION_EXPIRED_EVENT } from '../api/client.js'
import { SessionRedirect } from '../routes/SessionRedirect.jsx'

afterEach(() => {
  cleanup()
})

describe('SessionRedirect', () => {
  it('returns the user to the home page when the session expires', async () => {
    render(
      <MemoryRouter initialEntries={['/landlord/properties']}>
        <Routes>
          <Route element={<SessionRedirect />}>
            <Route path="/landlord/properties" element={<div>Dashboard</div>} />
            <Route path="/" element={<div>Welcome Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()

    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))

    expect(await screen.findByText('Welcome Home')).toBeInTheDocument()
  })

  it('does not redirect when already on the home page', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<SessionRedirect />}>
            <Route path="/" element={<div>Welcome Home</div>} />
            <Route path="/search" element={<div>Search</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))

    expect(screen.getByText('Welcome Home')).toBeInTheDocument()
  })
})