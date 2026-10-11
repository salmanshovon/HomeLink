"""django-filter FilterSets for property search."""

import django_filters
from django.db.models import Q

from .models import (
    FurnishingStatus,
    ListingStatus,
    ListingVerification,
    PropertyCategory,
    PropertyListing,
    UnitType,
)


class PropertyListingFilter(django_filters.FilterSet):
    """Filters for public listing search."""

    min_rent = django_filters.NumberFilter(field_name='monthly_rent', lookup_expr='gte')
    max_rent = django_filters.NumberFilter(field_name='monthly_rent', lookup_expr='lte')
    district = django_filters.CharFilter(field_name='property__district', lookup_expr='iexact')
    city = django_filters.CharFilter(field_name='property__city', lookup_expr='iexact')
    area = django_filters.CharFilter(field_name='property__area', lookup_expr='icontains')
    category = django_filters.ChoiceFilter(field_name='property__category', choices=PropertyCategory.choices)
    unit_type = django_filters.ChoiceFilter(field_name='unit__unit_type', choices=UnitType.choices)
    bedrooms = django_filters.NumberFilter(field_name='unit__bedrooms', lookup_expr='gte')
    bathrooms = django_filters.NumberFilter(field_name='unit__bathrooms', lookup_expr='gte')
    min_size = django_filters.NumberFilter(field_name='unit__size_sqft', lookup_expr='gte')
    furnishing = django_filters.ChoiceFilter(field_name='unit__furnishing', choices=FurnishingStatus.choices)
    available_from = django_filters.DateFilter(field_name='availability_date', lookup_expr='lte')
    amenity = django_filters.CharFilter(field_name='unit__amenities__slug', lookup_expr='iexact')
    preferred_tenant = django_filters.CharFilter(field_name='preferred_tenant')
    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = PropertyListing
        fields = (
            'min_rent', 'max_rent', 'district', 'city', 'area', 'category', 'unit_type',
            'bedrooms', 'bathrooms', 'min_size', 'furnishing', 'available_from',
            'amenity', 'preferred_tenant', 'search',
        )

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value)
            | Q(description__icontains=value)
            | Q(property__area__icontains=value)
            | Q(property__city__icontains=value)
        )

    def filter_queryset(self, queryset):
        """Only published, verified listings are publicly searchable."""
        return super().filter_queryset(
            queryset.filter(
                status=ListingStatus.PUBLISHED,
                verification_status=ListingVerification.VERIFIED,
            ).select_related('property', 'unit').prefetch_related('unit__amenities', 'media')
        )
