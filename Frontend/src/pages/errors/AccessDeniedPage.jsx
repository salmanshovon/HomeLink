import { Link } from 'react-router-dom'

export default function AccessDeniedPage() {
  return (
    <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <h1>403 — Access Denied</h1>
      <p>You do not have permission to access this page.</p>
      <Link to="/" className="btn btn-primary">Go to homepage</Link>
    </div>
  )
}
