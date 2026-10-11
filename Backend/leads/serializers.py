"""Leads serializers.

``entered_by`` is always derived from the request user and can never be
supplied by a client. ``tenant`` on a rental requirement is writable so staff
can create a requirement on behalf of a customer, but non-staff clients can
never assign it to someone else.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from properties.models import Amenity

from .models import Lead, RequirementMatch, RentalRequirement, RentalServiceRequest

User = get_user_model()


class RentalRequirementSerializer(serializers.ModelSerializer):
    """Serializer for creating and listing rental requirements."""

    preferred_amenities = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Amenity.objects.all(), required=False
    )

    class Meta:
        model = RentalRequirement
        fields = (
            'id', 'tenant', 'entered_by', 'preferred_locations', 'min_rent', 'max_rent',
            'bedrooms', 'bathrooms', 'min_size_sqft', 'property_type', 'furnishing',
            'preferred_amenities', 'occupants', 'tenant_category', 'desired_move_in_date',
            'lease_duration_months', 'additional_requirements', 'advance_budget',
            'status', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'entered_by', 'created_at', 'updated_at')

    def validate(self, attrs):
        attrs = super().validate(attrs)
        min_rent = attrs.get('min_rent')
        max_rent = attrs.get('max_rent')
        if min_rent is not None and max_rent is not None and min_rent > max_rent:
            raise serializers.ValidationError({'min_rent': 'min_rent must not exceed max_rent.'})
        return attrs


class RentalServiceRequestSerializer(serializers.ModelSerializer):
    """Serializer for rental service requests.

    ``requirement`` is read-only: it is always taken from the requirement in
    the URL, never from the request body.
    """

    class Meta:
        model = RentalServiceRequest
        fields = (
            'id', 'requirement', 'customer', 'assigned_employee', 'service_type',
            'status', 'agreed_service_fee', 'terms_accepted_at', 'notes',
            'completed_at', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'requirement', 'created_at', 'updated_at')


class RequirementMatchSerializer(serializers.ModelSerializer):
    """Serializer for requirement/listing matches.

    ``requirement`` and ``suggested_by`` are read-only: they are derived from
    the service request in the URL and the request user respectively.
    """

    class Meta:
        model = RequirementMatch
        fields = (
            'id', 'requirement', 'listing', 'suggested_by', 'match_score',
            'rationale', 'status', 'suggested_at', 'customer_feedback',
            'internal_notes', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'requirement', 'suggested_by', 'suggested_at', 'created_at', 'updated_at',
        )


class LeadSerializer(serializers.ModelSerializer):
    """Serializer for leads."""

    class Meta:
        model = Lead
        fields = (
            'id', 'name', 'phone', 'email', 'source', 'status', 'assigned_agent',
            'requirement', 'next_follow_up', 'notes', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
