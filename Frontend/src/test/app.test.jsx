import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../app/App.jsx'

function renderAt(path) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('App', () => {
  it('renders the home page by default', async () => {
    renderAt('/')
    expect(await screen.findByText(/Find Your Next Home/i)).toBeInTheDocument()
  })

  it('renders the not-found page for unknown routes', async () => {
    renderAt('/nonexistent')
    expect(await screen.findByText(/404/i)).toBeInTheDocument()
  })
})
