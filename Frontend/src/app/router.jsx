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
const TenantLayout = lazy(() => import('../layouts/TenantLayout.jsx'))
const LandlordLayout = lazy(() => import('../layouts/LandlordLayout.jsx'))
const EmployeeLayout = lazy(() => import('../layouts/EmployeeLayout.jsx'))
const AdminLayout = lazy(() => import('../layouts/AdminLayout.jsx'))

// Tenant pages
const TenantDashboard = lazy(() => import('../pages/tenant/TenantDashboard.jsx'))
const TenantOverview = lazy(() => import('../pages/tenant/TenantOverview.jsx'))
const TenantSavedProperties = lazy(() => import('../pages/tenant/TenantSavedProperties.jsx'))
const TenantRentalRequirements = lazy(() => import('../pages/tenant/TenantRentalRequirements.jsx'))
const TenantViewings = lazy(() => import('../pages/tenant/TenantViewings.jsx'))
const TenantInvoices = lazy(() => import('../pages/tenant/TenantInvoices.jsx'))
const TenantComplaints = lazy(() => import('../pages/tenant/TenantComplaints.jsx'))
const TenantMessages = lazy(() => import('../pages/tenant/TenantMessages.jsx'))
const TenantNotifications = lazy(() => import('../pages/tenant/TenantNotifications.jsx'))

// Landlord pages
const LandlordDashboard = lazy(() => import('../pages/landlord/LandlordDashboard.jsx'))
const LandlordOverview = lazy(() => import('../pages/landlord/LandlordOverview.jsx'))
const LandlordProperties = lazy(() => import('../pages/landlord/LandlordProperties.jsx'))
const LandlordListings = lazy(() => import('../pages/landlord/LandlordListings.jsx'))
const LandlordTenancies = lazy(() => import('../pages/landlord/LandlordTenancies.jsx'))
const LandlordInvoices = lazy(() => import('../pages/landlord/LandlordInvoices.jsx'))
const LandlordComplaints = lazy(() => import('../pages/landlord/LandlordComplaints.jsx'))
const LandlordAnnouncements = lazy(() => import('../pages/landlord/LandlordAnnouncements.jsx'))
const LandlordMessages = lazy(() => import('../pages/landlord/LandlordMessages.jsx'))

// Employee pages
const EmployeeDashboard = lazy(() => import('../pages/employee/EmployeeDashboard.jsx'))

// Admin pages
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
            <TenantLayout />
          </RoleRoute>
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <TenantOverview /> },
        { path: 'saved', element: <TenantSavedProperties /> },
        { path: 'requirements', element: <TenantRentalRequirements /> },
        { path: 'viewings', element: <TenantViewings /> },
        { path: 'tenancies', element: <TenantInvoices /> },
        { path: 'invoices', element: <TenantInvoices /> },
        { path: 'complaints', element: <TenantComplaints /> },
        { path: 'messages', element: <TenantMessages /> },
        { path: 'notifications', element: <TenantNotifications /> },
      ],
    },
    {
      path: '/landlord',
      element: (
        <ProtectedRoute>
          <RoleRoute allowedRoles={['LANDLORD']}>
            <LandlordLayout />
          </RoleRoute>
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <LandlordOverview /> },
        { path: 'properties', element: <LandlordProperties /> },
        { path: 'listings', element: <LandlordListings /> },
        { path: 'tenancies', element: <LandlordTenancies /> },
        { path: 'invoices', element: <LandlordInvoices /> },
        { path: 'complaints', element: <LandlordComplaints /> },
        { path: 'announcements', element: <LandlordAnnouncements /> },
        { path: 'messages', element: <LandlordMessages /> },
        { path: 'notifications', element: <LandlordDashboard /> },
      ],
    },
    {
      path: '/employee',
      element: (
        <ProtectedRoute>
          <RoleRoute allowedRoles={['EMPLOYEE', 'SUPERADMIN']}>
            <EmployeeLayout />
          </RoleRoute>
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <EmployeeDashboard /> },
        { path: 'properties', element: <EmployeeDashboard /> },
        { path: 'listings', element: <EmployeeDashboard /> },
        { path: 'leads', element: <EmployeeDashboard /> },
        { path: 'viewings', element: <EmployeeDashboard /> },
        { path: 'applications', element: <EmployeeDashboard /> },
        { path: 'tenancies', element: <EmployeeDashboard /> },
        { path: 'billing', element: <EmployeeDashboard /> },
        { path: 'messages', element: <EmployeeDashboard /> },
        { path: 'notifications', element: <EmployeeDashboard /> },
      ],
    },
    {
      path: '/admin',
      element: (
        <ProtectedRoute>
          <RoleRoute allowedRoles={['SUPERADMIN']}>
            <AdminLayout />
          </RoleRoute>
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <AdminDashboard /> },
        { path: 'properties', element: <AdminDashboard /> },
        { path: 'listings', element: <AdminDashboard /> },
        { path: 'users', element: <AdminDashboard /> },
        { path: 'leads', element: <AdminDashboard /> },
        { path: 'viewings', element: <AdminDashboard /> },
        { path: 'applications', element: <AdminDashboard /> },
        { path: 'tenancies', element: <AdminDashboard /> },
        { path: 'billing', element: <AdminDashboard /> },
        { path: 'commissions', element: <AdminDashboard /> },
        { path: 'audit', element: <AdminDashboard /> },
        { path: 'notifications', element: <AdminDashboard /> },
      ],
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
