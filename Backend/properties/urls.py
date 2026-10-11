"""Properties URL routes (mounted under /api/v1/)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from search.views import LocationFacetViewSet

router = DefaultRouter()
router.register('landlord/properties', views.LandlordPropertyViewSet, basename='landlord-property')
router.register('landlord/listings', views.LandlordListingViewSet, basename='landlord-listing')
router.register('landlord/tenancies', views.LandlordTenancyViewSet, basename='landlord-tenancy')
router.register('landlord/tenants', views.LandlordTenantViewSet, basename='landlord-tenant')
router.register('landlord/complaints', views.LandlordComplaintViewSet, basename='landlord-complaint')
router.register('landlord/invoices', views.LandlordInvoiceViewSet, basename='landlord-invoice')
router.register('landlord/payments', views.LandlordPaymentViewSet, basename='landlord-payment')
router.register('employee/properties', views.EmployeePropertyViewSet, basename='employee-property')
router.register('employee/listings', views.EmployeeListingViewSet, basename='employee-listing')
router.register('employee/location-grants', views.EmployeeLocationGrantViewSet, basename='employee-location-grant')

urlpatterns = [
    # Public discovery
    path('properties/', views.PublicPropertyViewSet.as_view({'get': 'list'}), name='property-list'),
    path('properties/amenities/', views.AmenityViewSet.as_view({'get': 'list'}), name='property-amenities'),
    path('properties/locations/', LocationFacetViewSet.as_view({'get': 'list'}), name='property-locations'),
    path('properties/saved/', views.SavedPropertyViewSet.as_view({'get': 'list', 'post': 'create'}), name='property-saved-list'),
    path('properties/<uuid:pk>/', views.PublicPropertyViewSet.as_view({'get': 'retrieve'}), name='property-detail'),
    path('properties/<uuid:pk>/media/', views.PublicPropertyViewSet.as_view({'get': 'media'}), name='property-media'),
    path('properties/<uuid:pk>/save/', views.PublicPropertyViewSet.as_view({'post': 'save', 'delete': 'save'}), name='property-save'),
    path('properties/<uuid:pk>/inquiries/', views.PropertyInquiryViewSet.as_view({'post': 'create'}), name='property-inquiry-create'),
    path('properties/<uuid:pk>/location-access/', views.LocationAccessRequestView.as_view(), name='property-location-access'),
    path('landlord/announcements/', views.LandlordAnnouncementView.as_view(), name='landlord-announcement'),
    path('', include(router.urls)),
]
