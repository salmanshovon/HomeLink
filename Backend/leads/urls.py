"""Leads URL routes (mounted under /api/v1/)."""

from rest_framework.routers import DefaultRouter

from . import views

app_name = 'leads'

router = DefaultRouter()
router.register('rental-requirements', views.RentalRequirementViewSet, basename='rental-requirement')
router.register('rental-service-requests', views.RentalServiceRequestViewSet, basename='rental-service-request')
router.register('leads', views.LeadViewSet, basename='lead')

urlpatterns = router.urls
