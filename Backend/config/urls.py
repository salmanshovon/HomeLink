"""
Root URL configuration for the HomeLink project.

All API routes are served under ``/api/v1/``. OpenAPI schema and interactive
documentation are available at ``/api/schema/``, ``/api/docs/`` and
``/api/redoc/``.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


def health(request):
    return JsonResponse({'status': 'ok', 'service': 'HomeLink API'})


urlpatterns = [
    path('admin/', admin.site.urls),

    # Health check
    path('api/v1/health/', health, name='health'),

    # API v1
    path('api/v1/', include('accounts.urls')),
    path('api/v1/', include('locations.urls')),
    path('api/v1/', include('properties.urls')),
    path('api/v1/', include('search.urls')),
    path('api/v1/', include('leads.urls')),
    path('api/v1/', include('rentals.urls')),
    path('api/v1/', include('billing.urls')),
    path('api/v1/', include('commissions.urls')),
    path('api/v1/', include('communications.urls')),
    path('api/v1/', include('notifications.urls')),
    path('api/v1/', include('services.urls')),
    path('api/v1/complaints/', include('complaints.urls')),
    path('api/v1/', include('audit.urls')),

    # API documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
