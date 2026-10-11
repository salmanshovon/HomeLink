import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export function useLogout() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return async () => {
    await logout()
    queryClient.clear()
    navigate('/', { replace: true })
  }
}
