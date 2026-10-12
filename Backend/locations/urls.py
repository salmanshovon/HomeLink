"""Location URLs (mounted under /api/v1/)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('locations', views.LocationViewSet, basename='location')

urlpatterns = [
    path('locations/tree/', views.LocationTreeView.as_view(), name='location-tree'),
    path('', include(router.urls)),
]