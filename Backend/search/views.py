"""Search views: public listing search and location facets."""

from django.db.models import Count
from rest_framework import permissions, viewsets
from rest_framework.response import Response

from common.pagination import StandardResultsSetPagination

from properties.filters import PropertyListingFilter
from properties.models import ListingStatus, Property, PropertyListing
from properties.models import ListingVerification
from properties.serializers import PublicListingSerializer


class ListingSearchViewSet(viewsets.ReadOnlyModelViewSet):
    """Public listing search (reuses the property filterset)."""
    serializer_class = PublicListingSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    filterset_class = PropertyListingFilter
    ordering_fields = ('monthly_rent', 'created_at', 'unit__size_sqft', 'availability_date')
    ordering = ('-created_at',)

    def get_queryset(self):
        return PropertyListing.objects.filter(
            status=ListingStatus.PUBLISHED,
            verification_status=ListingVerification.VERIFIED,
        ).select_related('property', 'unit').prefetch_related('unit__amenities', 'media')


class LocationFacetViewSet(viewsets.ViewSet):
    """Distinct districts/cities/areas for published properties (filter facets)."""
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        qs = Property.objects.filter(
            listings__status=ListingStatus.PUBLISHED,
            listings__verification_status=ListingVerification.VERIFIED,
        ).distinct()
        districts = list(qs.values_list('district', flat=True).distinct().order_by('district'))
        cities = list(qs.values_list('city', flat=True).distinct().order_by('city'))
        areas = list(qs.values_list('area', flat=True).exclude(area='').distinct().order_by('area'))
        return Response({'districts': districts, 'cities': cities, 'areas': areas})
