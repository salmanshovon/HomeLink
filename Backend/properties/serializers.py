"""Properties serializers.

Public serializers NEVER include private addresses, owner/caretaker contacts,
key-access arrangements, or landlord identity. Owner/staff serializers expose
more, and NID/identity fields are restricted to staff.
"""

from rest_framework import serializers

from common.storage import private_media_storage

from .models import (
    Amenity,
    ListingStatus,
    LocationAccessGrant,
    LocationGrantStatus,
    MediaVisibility,
    OwnershipDocument,
    Property,
    PropertyCategory,
    PropertyContactDetails,
    PropertyInquiry,
    PropertyListing,
    PropertyMedia,
    PropertyMediaType,
    PropertyUnit,
    PropertyVisitLog,
    SavedProperty,
)


# ---------------------------------------------------------------------------
# Amenities / units
# ---------------------------------------------------------------------------
class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ('id', 'name', 'slug', 'category')


class PropertyUnitSerializer(serializers.ModelSerializer):
    amenities = AmenitySerializer(many=True, read_only=True)
    furnishing_display = serializers.CharField(source='get_furnishing_display', read_only=True)

    class Meta:
        model = PropertyUnit
        fields = (
            'id', 'unit_number', 'floor', 'unit_type', 'size_sqft', 'bedrooms',
            'bathrooms', 'balconies', 'kitchens', 'furnishing', 'furnishing_display',
            'amenities', 'parking_available', 'availability_status', 'is_active',
        )


# ---------------------------------------------------------------------------
# Public serializers (privacy-safe)
# ---------------------------------------------------------------------------
class PublicListingSerializer(serializers.ModelSerializer):
    """Listing data safe for public search results."""

    property_title = serializers.CharField(source='property.title', read_only=True)
    category = serializers.CharField(source='property.get_category_display', read_only=True)
    district = serializers.CharField(source='property.district', read_only=True)
    city = serializers.CharField(source='property.city', read_only=True)
    area = serializers.CharField(source='property.area', read_only=True)
    block = serializers.CharField(source='property.block', read_only=True)
    public_location = serializers.CharField(source='property.public_location', read_only=True)
    landmark = serializers.CharField(source='property.landmark', read_only=True)
    cover_image = serializers.SerializerMethodField()
    unit = PropertyUnitSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    bedrooms = serializers.IntegerField(source='unit.bedrooms', read_only=True)
    bathrooms = serializers.IntegerField(source='unit.bathrooms', read_only=True)
    size_sqft = serializers.DecimalField(source='unit.size_sqft', max_digits=10, decimal_places=2, read_only=True)
    furnishing = serializers.CharField(source='unit.furnishing', read_only=True)

    class Meta:
        model = PropertyListing
        fields = (
            'id', 'reference', 'property_title', 'category', 'district', 'city', 'area',
            'block', 'public_location', 'landmark', 'monthly_rent', 'security_deposit',
            'advance_months', 'service_charge', 'availability_date', 'preferred_tenant',
            'bedrooms', 'bathrooms', 'size_sqft', 'furnishing', 'cover_image', 'unit',
            'status', 'status_display', 'published_at',
        )

    def get_cover_image(self, obj):
        cover = obj.media.filter(is_cover=True, media_type=PropertyMediaType.IMAGE).first()
        if cover:
            return cover.file.url
        first = obj.media.filter(media_type=PropertyMediaType.IMAGE).first()
        return first.file.url if first else None


class PublicPropertySerializer(serializers.ModelSerializer):
    """Public property detail: area/locality only, never the full address."""

    listings = PublicListingSerializer(many=True, read_only=True)
    units = PropertyUnitSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = (
            'id', 'reference', 'title', 'category', 'district', 'city', 'area',
            'block', 'public_location', 'landmark', 'latitude', 'longitude',
            'listings', 'units',
        )


# ---------------------------------------------------------------------------
# Owner / staff serializers
# ---------------------------------------------------------------------------
class PropertyOwnerSerializer(serializers.ModelSerializer):
    units = PropertyUnitSerializer(many=True, read_only=True)
    landlord_name = serializers.CharField(source='landlord.landlord_profile.legal_name', read_only=True, default=None)

    class Meta:
        model = Property
        fields = (
            'id', 'reference', 'title', 'category', 'landlord', 'landlord_name',
            'manager', 'country', 'division', 'district', 'city', 'area', 'society_name',
            'block', 'road_number', 'house_number', 'building_name', 'postal_code',
            'landmark', 'latitude', 'longitude', 'full_private_address', 'public_location',
            'ownership_verified', 'verification_notes', 'verified_by', 'verified_at',
            'status', 'units', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'ownership_verified', 'verified_by', 'verified_at', 'created_at', 'updated_at')


class PropertyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = (
            'title', 'category', 'division', 'district', 'city', 'area', 'society_name',
            'block', 'road_number', 'house_number', 'building_name', 'postal_code',
            'landmark', 'latitude', 'longitude', 'full_private_address', 'public_location',
            'status',
        )


class PropertyListingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyListing
        fields = (
            'property', 'unit', 'monthly_rent', 'security_deposit', 'advance_months',
            'service_charge', 'other_charges', 'availability_date', 'preferred_tenant',
            'description', 'condition_notes', 'expiry_date',
        )

    def validate_monthly_rent(self, value):
        if value <= 0:
            raise serializers.ValidationError('Monthly rent must be greater than zero.')
        return value


class PropertyListingOwnerSerializer(serializers.ModelSerializer):
    property = PropertyOwnerSerializer(read_only=True)
    unit = PropertyUnitSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PropertyListing
        fields = (
            'id', 'reference', 'property', 'unit', 'source', 'monthly_rent',
            'security_deposit', 'advance_months', 'service_charge', 'other_charges',
            'availability_date', 'preferred_tenant', 'description', 'condition_notes',
            'status', 'status_display', 'verification_status', 'published_at',
            'expiry_date', 'last_availability_confirmation', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'reference', 'status', 'verification_status', 'published_at', 'created_at', 'updated_at')


class PropertyMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyMedia
        fields = (
            'id', 'file', 'media_type', 'caption', 'display_order', 'is_cover',
            'visibility', 'uploaded_by', 'created_at',
        )
        read_only_fields = ('id', 'uploaded_by', 'created_at')


class OwnershipDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnershipDocument
        fields = (
            'id', 'document_type', 'file', 'submitted_by', 'verification_status',
            'reviewed_by', 'review_notes', 'reviewed_at', 'created_at',
        )
        read_only_fields = ('id', 'submitted_by', 'verification_status', 'reviewed_by', 'reviewed_at', 'created_at')


class PropertyContactDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyContactDetails
        fields = (
            'id', 'contact_name', 'contact_type', 'primary_phone', 'alternate_phone',
            'preferred_contact_time', 'internal_notes', 'key_access_arrangements', 'visibility',
        )


class PropertyVisitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyVisitLog
        fields = (
            'id', 'listing', 'employee', 'visit_date', 'condition_observations',
            'photos_taken', 'video_walkthrough', 'feedback', 'internal_notes', 'created_at',
        )


class SavedPropertySerializer(serializers.ModelSerializer):
    listing = PublicListingSerializer(read_only=True)

    class Meta:
        model = SavedProperty
        fields = ('id', 'listing', 'created_at')


class PropertyInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyInquiry
        fields = ('id', 'listing', 'guest_name', 'guest_phone', 'message', 'source', 'status', 'created_at')
        read_only_fields = ('id', 'status', 'created_at')


class LocationAccessGrantSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationAccessGrant
        fields = (
            'id', 'listing', 'source', 'reason', 'status', 'granted_at', 'expires_at',
        )

