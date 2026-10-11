"""Property domain: properties, units, amenities, listings, media, documents."""

import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from common.models import TimeStampedModel
from common.utils import generate_reference
from common.validators import validate_media, validate_document

User = settings.AUTH_USER_MODEL


class PropertyCategory(models.TextChoices):
    APARTMENT_BUILDING = 'apartment_building', 'Apartment building'
    STANDALONE_HOUSE = 'standalone_house', 'Standalone house'
    DUPLEX = 'duplex', 'Duplex'
    STUDIO_BUILDING = 'studio_building', 'Studio building'
    COMMERCIAL = 'commercial', 'Commercial property'
    OTHER = 'other', 'Other'


class PropertyStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    ACTIVE = 'active', 'Active'
    INACTIVE = 'inactive', 'Inactive'
    ARCHIVED = 'archived', 'Archived'


class Property(TimeStampedModel):
    """A physical property. The full private address is never public."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=40, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=30, choices=PropertyCategory.choices)

    landlord = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='properties', verbose_name='owner/landlord',
    )
    created_by_employee = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='properties_created',
    )
    manager = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='properties_managed', verbose_name='property manager',
    )

    # Structured address (Bangladesh).
    country = models.CharField(max_length=100, default='Bangladesh')
    division = models.CharField(max_length=100, db_index=True)
    district = models.CharField(max_length=100, db_index=True)
    city = models.CharField(max_length=100, db_index=True)
    area = models.CharField(max_length=100, blank=True, db_index=True)
    society_name = models.CharField(max_length=200, blank=True)
    block = models.CharField(max_length=50, blank=True)
    road_number = models.CharField(max_length=50, blank=True)
    house_number = models.CharField(max_length=50, blank=True)
    building_name = models.CharField(max_length=200, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    landmark = models.CharField(max_length=200, blank=True)

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    full_private_address = models.TextField(blank=True)
    public_location = models.CharField(max_length=255, blank=True)

    ownership_verified = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True)
    verified_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='properties_verified',
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20, choices=PropertyStatus.choices, default=PropertyStatus.DRAFT, db_index=True
    )

    class Meta:
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=['district', 'city', 'area']),
            models.Index(fields=['status', 'category']),
        ]

    def __str__(self):
        return f'{self.reference} — {self.title}'

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = generate_reference('PROP')
        super().save(*args, **kwargs)


class UnitType(models.TextChoices):
    APARTMENT = 'apartment', 'Apartment'
    DUPLEX = 'duplex', 'Duplex'
    STUDIO = 'studio', 'Studio'
    ROOM = 'room', 'Room'
    STANDALONE_HOUSE = 'standalone_house', 'Standalone house'
    OTHER = 'other', 'Other'


class FurnishingStatus(models.TextChoices):
    UNFURNISHED = 'unfurnished', 'Unfurnished'
    SEMI_FURNISHED = 'semi_furnished', 'Semi-furnished'
    FULLY_FURNISHED = 'fully_furnished', 'Fully furnished'


class UnitAvailability(models.TextChoices):
    AVAILABLE = 'available', 'Available'
    RESERVED = 'reserved', 'Reserved'
    RENTED = 'rented', 'Rented'
    UNAVAILABLE = 'unavailable', 'Unavailable'


class Amenity(TimeStampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    category = models.CharField(max_length=50, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ('name',)
        verbose_name_plural = 'amenities'

    def __str__(self):
        return self.name


class PropertyUnit(TimeStampedModel):
    """A separately rentable unit within a property."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='units')
    unit_number = models.CharField(max_length=50)
    floor = models.PositiveSmallIntegerField(null=True, blank=True)
    unit_type = models.CharField(max_length=30, choices=UnitType.choices)
    size_sqft = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bedrooms = models.PositiveSmallIntegerField(default=0)
    bathrooms = models.PositiveSmallIntegerField(default=0)
    balconies = models.PositiveSmallIntegerField(default=0)
    kitchens = models.PositiveSmallIntegerField(default=0)
    furnishing = models.CharField(
        max_length=20, choices=FurnishingStatus.choices, default=FurnishingStatus.UNFURNISHED
    )
    amenities = models.ManyToManyField(Amenity, blank=True, related_name='units')
    description = models.TextField(blank=True)
    condition_notes = models.TextField(blank=True)
    parking_available = models.BooleanField(default=False)
    availability_status = models.CharField(
        max_length=20, choices=UnitAvailability.choices, default=UnitAvailability.AVAILABLE, db_index=True
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ('unit_number',)
        unique_together = ('property', 'unit_number')

    def __str__(self):
        return f'{self.property.reference} / {self.unit_number}'


class ListingStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    PENDING_REVIEW = 'pending_review', 'Pending review'
    PUBLISHED = 'published', 'Published'
    RESERVED = 'reserved', 'Reserved'
    RENTED = 'rented', 'Rented'
    SUSPENDED = 'suspended', 'Suspended'
    REJECTED = 'rejected', 'Rejected'
    ARCHIVED = 'archived', 'Archived'


class ListingVerification(models.TextChoices):
    UNVERIFIED = 'unverified', 'Unverified'
    PENDING = 'pending', 'Pending'
    VERIFIED = 'verified', 'Verified'
    REJECTED = 'rejected', 'Rejected'


class PreferredTenant(models.TextChoices):
    FAMILY = 'family', 'Family'
    BACHELOR = 'bachelor', 'Bachelor'
    CORPORATE = 'corporate', 'Corporate'
    STUDENT = 'student', 'Student'
    NO_PREFERENCE = 'no_preference', 'No preference'


class ListingSource(models.TextChoices):
    LANDLORD = 'landlord', 'Landlord'
    EMPLOYEE = 'employee', 'Employee'
    IMPORTED = 'imported', 'Imported'


class PropertyListing(TimeStampedModel):
    """The public marketing/rental offer for a property or unit."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=40, unique=True, db_index=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='listings')
    unit = models.ForeignKey(PropertyUnit, null=True, blank=True, on_delete=models.SET_NULL, related_name='listings')

    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='listings_created')
    assigned_agent = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='listings_assigned'
    )
    source = models.CharField(max_length=20, choices=ListingSource.choices, default=ListingSource.LANDLORD)

    monthly_rent = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    advance_months = models.PositiveSmallIntegerField(null=True, blank=True)
    service_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    other_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])

    availability_date = models.DateField(null=True, blank=True, db_index=True)
    preferred_tenant = models.CharField(
        max_length=20, choices=PreferredTenant.choices, default=PreferredTenant.NO_PREFERENCE
    )

    description = models.TextField(blank=True)
    condition_notes = models.TextField(blank=True)

    status = models.CharField(
        max_length=20, choices=ListingStatus.choices, default=ListingStatus.DRAFT, db_index=True
    )
    verification_status = models.CharField(
        max_length=20, choices=ListingVerification.choices, default=ListingVerification.UNVERIFIED
    )
    published_at = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    last_availability_confirmation = models.DateField(null=True, blank=True)
    commission_reference = models.CharField(max_length=60, blank=True)

    class Meta:
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=['status', 'verification_status']),
            models.Index(fields=['monthly_rent']),
            models.Index(fields=['availability_date']),
        ]

    def __str__(self):
        return f'{self.reference} — {self.property.title}'

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = generate_reference('LST')
        super().save(*args, **kwargs)

    def is_published(self):
        return self.status == ListingStatus.PUBLISHED


class PropertyMediaType(models.TextChoices):
    IMAGE = 'image', 'Image'
    VIDEO = 'video', 'Video'
    FLOOR_PLAN = 'floor_plan', 'Floor plan'
    DOCUMENT = 'document', 'Document'


class MediaVisibility(models.TextChoices):
    PUBLIC = 'public', 'Public'
    AUTHENTICATED = 'authenticated', 'Authenticated only'
    INTERNAL = 'internal', 'Internal'


class PropertyMedia(TimeStampedModel):
    """Media attached to a property, unit, or listing."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='media')
    unit = models.ForeignKey(PropertyUnit, null=True, blank=True, on_delete=models.SET_NULL, related_name='media')
    listing = models.ForeignKey(PropertyListing, null=True, blank=True, on_delete=models.SET_NULL, related_name='media')
    file = models.FileField(upload_to='properties/media/%Y/%m/', validators=[validate_media])
    media_type = models.CharField(max_length=20, choices=PropertyMediaType.choices)
    caption = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveSmallIntegerField(default=0)
    is_cover = models.BooleanField(default=False)
    visibility = models.CharField(
        max_length=20, choices=MediaVisibility.choices, default=MediaVisibility.PUBLIC
    )
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_media')

    class Meta:
        ordering = ('display_order', '-created_at')

    def __str__(self):
        return f'media:{self.property_id}:{self.media_type}'


class OwnershipDocumentType(models.TextChoices):
    DEED = 'deed', 'Deed'
    UTILITY_BILL = 'utility_bill', 'Utility bill'
    RENTAL_AUTHORITY_LETTER = 'rental_authority_letter', 'Rental authority letter'
    OTHER = 'other', 'Other'


class DocumentVerification(models.TextChoices):
    NOT_REVIEWED = 'not_reviewed', 'Not reviewed'
    VERIFIED = 'verified', 'Verified'
    REJECTED = 'rejected', 'Rejected'


class OwnershipDocument(TimeStampedModel):
    """Private ownership evidence. Never publicly downloadable."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='ownership_documents')
    document_type = models.CharField(max_length=30, choices=OwnershipDocumentType.choices)
    file = models.FileField(upload_to='properties/documents/%Y/%m/', validators=[validate_document])
    submitted_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='submitted_documents')
    verification_status = models.CharField(
        max_length=20, choices=DocumentVerification.choices, default=DocumentVerification.NOT_REVIEWED
    )
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_documents'
    )
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'doc:{self.property_id}:{self.get_document_type_display()}'


class PropertyContactType(models.TextChoices):
    OWNER = 'owner', 'Owner'
    CARETAKER = 'caretaker', 'Caretaker'
    SECURITY = 'security', 'Security'
    AUTHORIZED_REPRESENTATIVE = 'authorized_representative', 'Authorized representative'


class PropertyContactVisibility(models.TextChoices):
    INTERNAL = 'internal', 'Internal'
    STAFF_ONLY = 'staff_only', 'Staff only'


class PropertyContactDetails(TimeStampedModel):
    """Sensitive owner/caretaker contact details. Never public."""

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='contacts')
    contact_name = models.CharField(max_length=200)
    contact_type = models.CharField(max_length=30, choices=PropertyContactType.choices)
    primary_phone = models.CharField(max_length=20)
    alternate_phone = models.CharField(max_length=20, blank=True)
    preferred_contact_time = models.CharField(max_length=100, blank=True)
    internal_notes = models.TextField(blank=True)
    key_access_arrangements = models.TextField(blank=True)
    visibility = models.CharField(
        max_length=20, choices=PropertyContactVisibility.choices, default=PropertyContactVisibility.STAFF_ONLY
    )

    class Meta:
        ordering = ('contact_type',)

    def __str__(self):
        return f'contact:{self.property_id}:{self.get_contact_type_display()}'


class PropertyVisitLog(TimeStampedModel):
    """Agent observation / visit log."""

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='visit_logs')
    listing = models.ForeignKey(
        PropertyListing, null=True, blank=True, on_delete=models.SET_NULL, related_name='visit_logs'
    )
    employee = models.ForeignKey(User, on_delete=models.PROTECT, related_name='visit_logs')
    visit_date = models.DateField()
    condition_observations = models.TextField(blank=True)
    photos_taken = models.BooleanField(default=False)
    video_walkthrough = models.BooleanField(default=False)
    feedback = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)

    class Meta:
        ordering = ('-visit_date', '-created_at')

    def __str__(self):
        return f'visit:{self.property_id}:{self.visit_date}'


class ListingAudit(TimeStampedModel):
    """Immutable audit history of listing status transitions."""

    listing = models.ForeignKey(PropertyListing, on_delete=models.CASCADE, related_name='audit_logs')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='listing_audits')
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='listing_audits')
    from_status = models.CharField(max_length=20, choices=ListingStatus.choices, blank=True)
    to_status = models.CharField(max_length=20, choices=ListingStatus.choices)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'audit:{self.listing_id}:{self.to_status}'


class SavedProperty(TimeStampedModel):
    """A listing saved by a user."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_properties')
    listing = models.ForeignKey(PropertyListing, on_delete=models.CASCADE, related_name='saved_by')

    class Meta:
        unique_together = ('user', 'listing')
        ordering = ('-created_at',)

    def __str__(self):
        return f'saved:{self.user_id}:{self.listing_id}'


class InquiryStatus(models.TextChoices):
    NEW = 'new', 'New'
    CONTACTED = 'contacted', 'Contacted'
    CONVERTED = 'converted', 'Converted'
    CLOSED = 'closed', 'Closed'
    SPAM = 'spam', 'Spam'


class PropertyInquiry(TimeStampedModel):
    """An inquiry about a listing (registered user or guest)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(PropertyListing, on_delete=models.CASCADE, related_name='inquiries')
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='inquiries')
    guest_name = models.CharField(max_length=200, blank=True)
    guest_phone = models.CharField(max_length=20, blank=True)
    message = models.TextField()
    source = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=InquiryStatus.choices, default=InquiryStatus.NEW, db_index=True)
    assigned_employee = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_inquiries'
    )

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'inquiry:{self.listing_id}:{self.status}'


class LocationGrantStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    GRANTED = 'granted', 'Granted'
    REVOKED = 'revoked', 'Revoked'
    DENIED = 'denied', 'Denied'


class LocationGrantSource(models.TextChoices):
    PAID_LOCATION = 'paid_location', 'Paid location disclosure'
    VIEWING = 'viewing', 'Verified viewing appointment'
    TENANCY = 'tenancy', 'Active tenancy'
    STAFF = 'staff', 'Staff authorization'


class LocationAccessGrant(TimeStampedModel):
    """Explicit entitlement to view a listing's private location.

    A grant is created only after a verified trigger (payment, viewing,
    tenancy, or staff authorization) — never from a client-supplied flag.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(PropertyListing, on_delete=models.CASCADE, related_name='location_grants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='location_grants')
    source = models.CharField(max_length=20, choices=LocationGrantSource.choices)
    reason = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=LocationGrantStatus.choices, default=LocationGrantStatus.PENDING
    )
    granted_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='location_grants_granted'
    )
    payment_reference = models.CharField(max_length=80, blank=True)
    service_request_reference = models.CharField(max_length=80, blank=True)
    granted_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoke_reason = models.TextField(blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'grant:{self.listing_id}:{self.user_id}:{self.status}'
