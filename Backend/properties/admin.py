"""Properties admin (restricted back-office use)."""

from django.contrib import admin

from .models import (
    Amenity,
    LocationAccessGrant,
    OwnershipDocument,
    Property,
    PropertyContactDetails,
    PropertyInquiry,
    PropertyListing,
    PropertyMedia,
    PropertyUnit,
    PropertyVisitLog,
    SavedProperty,
)


class PropertyUnitInline(admin.TabularInline):
    model = PropertyUnit
    extra = 0


class PropertyMediaInline(admin.TabularInline):
    model = PropertyMedia
    extra = 0


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('reference', 'title', 'district', 'city', 'landlord', 'ownership_verified', 'status')
    list_filter = ('status', 'category', 'ownership_verified', 'district')
    search_fields = ('reference', 'title', 'district', 'city', 'area')
    inlines = [PropertyUnitInline, PropertyMediaInline]


@admin.register(PropertyListing)
class PropertyListingAdmin(admin.ModelAdmin):
    list_display = ('reference', 'property', 'monthly_rent', 'status', 'verification_status', 'published_at')
    list_filter = ('status', 'verification_status', 'source')
    search_fields = ('reference', 'property__title')


@admin.register(PropertyUnit)
class PropertyUnitAdmin(admin.ModelAdmin):
    list_display = ('property', 'unit_number', 'unit_type', 'bedrooms', 'bathrooms', 'availability_status')


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'category', 'active')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(PropertyMedia)
class PropertyMediaAdmin(admin.ModelAdmin):
    list_display = ('property', 'media_type', 'is_cover', 'visibility', 'uploaded_by')


@admin.register(OwnershipDocument)
class OwnershipDocumentAdmin(admin.ModelAdmin):
    list_display = ('property', 'document_type', 'verification_status', 'reviewed_by', 'reviewed_at')
    list_filter = ('verification_status', 'document_type')


@admin.register(PropertyContactDetails)
class PropertyContactDetailsAdmin(admin.ModelAdmin):
    list_display = ('property', 'contact_name', 'contact_type', 'visibility')


@admin.register(PropertyInquiry)
class PropertyInquiryAdmin(admin.ModelAdmin):
    list_display = ('listing', 'guest_name', 'guest_phone', 'status', 'assigned_employee')
    list_filter = ('status',)


@admin.register(PropertyVisitLog)
class PropertyVisitLogAdmin(admin.ModelAdmin):
    list_display = ('property', 'employee', 'visit_date')


@admin.register(SavedProperty)
class SavedPropertyAdmin(admin.ModelAdmin):
    list_display = ('user', 'listing', 'created_at')


@admin.register(LocationAccessGrant)
class LocationAccessGrantAdmin(admin.ModelAdmin):
    list_display = ('listing', 'user', 'source', 'status', 'granted_by', 'expires_at')
    list_filter = ('status', 'source')
