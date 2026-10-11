"""Commissions URL routes (mounted under /api/v1/)."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'commissions'

router = DefaultRouter()
router.register('obligations', views.CommissionObligationViewSet, basename='obligation')
router.register('ledger', views.CommissionLedgerViewSet, basename='ledger')

urlpatterns = [
    # The app root lists agreements (staff see all; payers see their own).
    path('', views.CommissionAgreementViewSet.as_view({'get': 'list'}), name='agreement-list'),
    # Creating an agreement is staff-only and lives under 'agreements/'.
    path('agreements/', views.CommissionAgreementViewSet.as_view({'post': 'create'}), name='agreement-create'),
] + router.urls
