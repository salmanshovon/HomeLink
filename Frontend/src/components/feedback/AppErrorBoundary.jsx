import { Component } from 'react'
import { Link } from 'react-router-dom'

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details without sensitive data
    console.error('Application error:', error?.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>We encountered an unexpected error. Please try again.</p>
          <Link to="/" className="btn btn-primary">
            Go to homepage
          </Link>
        </div>
      )
    }

    return this.props.children
  }
}
