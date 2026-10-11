"""Notifications URLs."""

from django.urls import include, path

from .views import router

app_name = 'notifications'

urlpatterns = [
    path('', include(router.urls)),
]
