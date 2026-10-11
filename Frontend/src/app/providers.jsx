import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from '../contexts/AuthContext.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

export { queryClient }

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        {import.meta.env.DEV && import.meta.env.VITE_ENABLE_QUERY_DEVTOOLS !== 'false' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </AuthProvider>
    </QueryClientProvider>
  )
}
