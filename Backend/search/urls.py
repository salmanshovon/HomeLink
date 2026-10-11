"""Search URL routes (mounted under /api/v1/)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('listings', views.ListingSearchViewSet, basename='search-listing')

urlpatterns = [
    path('locations/', views.LocationFacetViewSet.as_view({'get': 'list'}), name='search-locations'),
    path('', include(router.urls)),
]
