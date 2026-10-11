"""Complaints URL routes (mounted under /api/v1/complaints/)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'complaints'

router = DefaultRouter()
router.register(r'', views.ComplaintViewSet, basename='complaint')

urlpatterns = [
    path('', include(router.urls)),
]
