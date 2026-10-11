"""Communications URLs."""

from django.urls import include, path

from .views import router

app_name = 'communications'

urlpatterns = [
    path('', include(router.urls)),
]
