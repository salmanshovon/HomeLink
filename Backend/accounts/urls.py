"""Accounts URL routes (mounted under /api/v1/)."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = 'accounts'

urlpatterns = [
    path('auth/register/tenant/', views.RegisterTenantView.as_view(), name='register-tenant'),
    path('auth/register/landlord/', views.RegisterLandlordView.as_view(), name='register-landlord'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/verify-phone/', views.VerifyPhoneView.as_view(), name='verify-phone'),
    path('auth/resend-verification/', views.ResendVerificationView.as_view(), name='resend-verification'),
    path('auth/password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset'),
    path('auth/password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('accounts/me/', views.MeView.as_view(), name='me'),
]
