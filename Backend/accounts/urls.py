"""Accounts URL routes (mounted under /api/v1/)."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views
from . import admin_views
from . import dashboard_views

app_name = 'accounts'

urlpatterns = [
    # Auth
    path('auth/register/tenant/', views.RegisterTenantView.as_view(), name='register-tenant'),
    path('auth/register/landlord/', views.RegisterLandlordView.as_view(), name='register-landlord'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/verify-phone/', views.VerifyPhoneView.as_view(), name='verify-phone'),
    path('auth/resend-verification/', views.ResendVerificationView.as_view(), name='resend-verification'),
    path('auth/password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset'),
    path('auth/password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    # Self-service
    path('accounts/me/', views.MeView.as_view(), name='me'),
    path('accounts/me/password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('accounts/me/addresses/', views.AddressListView.as_view(), name='address-list'),
    path('accounts/me/addresses/<int:address_pk>/', views.AddressDetailView.as_view(), name='address-detail'),
    # Admin — user management
    path('admin/users/', admin_views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<uuid:pk>/', admin_views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<uuid:pk>/status/', admin_views.AdminUserStatusView.as_view(), name='admin-user-status'),
    path('admin/users/<uuid:pk>/roles/assign/', admin_views.AdminRoleAssignView.as_view(), name='admin-role-assign'),
    path('admin/users/<uuid:pk>/roles/remove/', admin_views.AdminRoleRemoveView.as_view(), name='admin-role-remove'),
    path('admin/users/<uuid:pk>/addresses/', admin_views.AdminAddressCreateView.as_view(), name='admin-address-create'),
    path('admin/users/<uuid:pk>/addresses/<int:address_pk>/', admin_views.AdminAddressUpdateView.as_view(), name='admin-address-detail'),
    path('admin/employees/create/', admin_views.AdminCreateEmployeeView.as_view(), name='admin-employee-create'),
    path('admin/dashboard/metrics/', dashboard_views.AdminDashboardMetricsView.as_view(), name='admin-dashboard-metrics'),
]
