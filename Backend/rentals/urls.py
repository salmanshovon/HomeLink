"""Rentals URL routes (mounted under /api/v1/)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('viewings', views.ViewingAppointmentViewSet, basename='viewing')
router.register('applications', views.RentalApplicationViewSet, basename='application')
router.register('tenancies', views.TenancyViewSet, basename='tenancy')

urlpatterns = [
    path('tenancies/<uuid:tenancy_pk>/members/', views.TenancyMemberViewSet.as_view({'get': 'list', 'post': 'create'}), name='tenancy-members'),
    path('tenancies/<uuid:tenancy_pk>/members/<uuid:pk>/', views.TenancyMemberViewSet.as_view({'get': 'retrieve', 'patch': 'update', 'delete': 'destroy'}), name='tenancy-member-detail'),
    path('tenancies/<uuid:tenancy_pk>/events/', views.TenancyEventViewSet.as_view({'get': 'list'}), name='tenancy-events'),
    path('', include(router.urls)),
]
