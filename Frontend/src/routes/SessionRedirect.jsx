import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { SESSION_EXPIRED_EVENT } from '../api/client.js'

/**
 * Sends the user to the public home page when the session can no longer be
 * renewed.
 *
 * This is mounted as a pathless layout route wrapping every other route, so it
 * must render an <Outlet /> for children to appear. It must also render inside
 * the router, because AuthProvider sits above RouterProvider and therefore
 * cannot navigate on its own.
 *
 * PublicHeader shows a "Sign In" button once the user is unauthenticated,
 * which is what prompts them to log in again.
 */
export function SessionRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    function handleSessionExpired() {
      navigate('/', { replace: true })
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [navigate])

  return <Outlet />
}