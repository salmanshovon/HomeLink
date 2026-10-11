import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppProviders } from './providers.jsx'
import { AppErrorBoundary } from '../components/feedback/AppErrorBoundary.jsx'
import { FullPageSpinner } from '../components/feedback/FullPageSpinner.jsx'

// Public pages
const HomePage = lazy(() => import('../pages/public/HomePage.jsx'))
const SearchPage = lazy(() => import('../pages/public/SearchPage.jsx'))
const PropertyDetailsPage = lazy(() => import('../pages/public/PropertyDetailsPage.jsx'))
const HowItWorksPage = lazy(() => import('../pages/public/HowItWorksPage.jsx'))
const MaintenanceServicesPage = lazy(() => import('../pages/public/MaintenanceServicesPage.jsx'))
const AboutPage = lazy(() => import('../pages/public/AboutPage.jsx'))
const ContactPage = lazy(() => import('../pages/public/ContactPage.jsx'))
const PrivacyPolicyPage = lazy(() => import('../pages/public/PrivacyPolicyPage.jsx'))
const TermsPage = lazy(() => import('../pages/public/TermsPage.jsx'))

// Auth pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage.jsx'))
const RegisterTenantPage = lazy(() => import('../pages/auth/RegisterTenantPage.jsx'))
const RegisterLandlordPage = lazy(() => import('../pages/auth/RegisterLandlordPage.jsx'))
const VerifyPhonePage = lazy(() => import('../pages/auth/VerifyPhonePage.jsx'))
const PasswordResetPage = lazy(() => import('../pages/auth/PasswordResetPage.jsx'))
const PasswordResetConfirmPage = lazy(() => import('../pages/auth/PasswordResetConfirmPage.jsx'))

// Error pages
const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage.jsx'))
const AccessDeniedPage = lazy(() => import('../pages/errors/AccessDeniedPage.jsx'))

// Layouts
const PublicLayout = lazy(() => import('../layouts/PublicLayout.jsx'))
const AuthLayout = lazy(() => import('../layouts/AuthLayout.jsx'))

// Dashboard pages (lazy-loaded per role)
const TenantDashboard = lazy(() => import('../pages/tenant/TenantDashboard.jsx'))
const LandlordDashboard = lazy(() => import('../pages/landlord/LandlordDashboard.jsx'))
const EmployeeDashboard = lazy(() => import('../pages/employee/EmployeeDashboard.jsx'))
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard.jsx'))

// Route guards
const ProtectedRoute = lazy(() => import('../routes/ProtectedRoute.jsx'))
const RoleRoute = lazy(() => import('../routes/RoleRoute.jsx'))

export function AppRouter() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <PublicLayout />,
      errorElement: <AppErrorBoundary />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'search', element: <SearchPage /> },
        { path: 'properties/:id', element: <PropertyDetailsPage /> },
        { path: 'how-it-works', element: <HowItWorksPage /> },
        { path: 'maintenance-services', element: <MaintenanceServicesPage /> },
        { path: 'about', element: <AboutPage /> },
        { path: 'contact', element: <ContactPage /> },
        { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
        { path: 'terms', element: <TermsPage /> },
      ],
    },
    {
      path: '/auth',
      element: <AuthLayout />,
      children: [
        { path: 'login', element: <LoginPage /> },
        { path: 'register/tenant', element: <RegisterTenantPage /> },
        { path: 'register/landlord', element: <RegisterLandlordPage /> },
        { path: 'verify-phone', element: <VerifyPhonePage /> },
        { path: 'password-reset', element: <PasswordResetPage /> },
        { path: 'password-reset/confirm', element: <PasswordResetConfirmPage /> },
      ],
    },
    {
      path: '/tenant',
      element: (
        <ProtectedRoute>
          <RoleRoute allowedRoles={['TENANT']}>
            <TenantDashboard />
          </RoleRoute>
        </ProtectedRoute>
      ),
    },
    {
      path: '/landlord',
      element: (
        <ProtectedRoute>
          <RoleRoute allowedRoles={['LANDLORD']}>
            <LandlordDashboard />
          </RoleRoute>
        </ProtectedRoute>
      ),
    },
    {
      path: '/employee',
      element: (
        <ProtectedRoute>
          <RoleRoute allowedRoles={['EMPLOYEE', 'SUPERADMIN']}>
            <EmployeeDashboard />
          </RoleRoute>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin',
      element: (
        <ProtectedRoute>
          <RoleRoute allowedRoles={['SUPERADMIN']}>
            <AdminDashboard />
          </RoleRoute>
        </ProtectedRoute>
      ),
    },
    { path: '/access-denied', element: <AccessDeniedPage /> },
    { path: '*', element: <NotFoundPage /> },
  ])

  return (
    <AppProviders>
      <Suspense fallback={<FullPageSpinner />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  )
}
