"""Services URL routes (mounted under /api/v1/services/)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'services'

router = DefaultRouter()
router.register(r'categories', views.ServiceCategoryViewSet, basename='service-category')
router.register(r'requests', views.ServiceRequestViewSet, basename='service-request')

urlpatterns = [
    path('', include(router.urls)),
]
