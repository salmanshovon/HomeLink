"""Billing URL routes (mounted under /api/v1/)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('billing/invoices', views.RentInvoiceViewSet, basename='invoice')
router.register('billing/bills', views.BillViewSet, basename='bill')
router.register('billing/payments', views.PaymentViewSet, basename='payment')
router.register('billing/receipts', views.ReceiptViewSet, basename='receipt')
router.register('billing/refunds', views.RefundViewSet, basename='refund')

urlpatterns = [
    path('', include(router.urls)),
]
