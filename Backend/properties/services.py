"""Property domain services: publication, location access, creation."""

from django.db import transaction
from django.utils import timezone

from common.utils import generate_reference

from .models import (
    ListingAudit,
    ListingStatus,
    ListingVerification,
    LocationAccessGrant,
    LocationGrantStatus,
    LocationGrantSource,
    Property,
    PropertyListing,
    PropertyStatus,
)


def can_view_private_location(user, listing):
    """
    Return True if ``user`` is entitled to see ``listing``'s private location.

    Authorization comes from an explicit, active LocationAccessGrant, an active
    tenancy in the property, ownership/management of the property, or staff
    privileges. It is NEVER derived from a client-supplied flag.
    """
    if user is None or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True

    # Owner or authorized manager of the property.
    if listing and listing.property_id:
        prop = listing.property
        if prop.landlord_id == user.id or (prop.manager_id and prop.manager_id == user.id):
            return True

    # Active tenancy in the property.
    from rentals.models import Tenancy, TenancyStatus

    if listing and listing.property_id:
        if Tenancy.objects.filter(
            unit__property_id=listing.property_id,
            tenant=user,
            status=TenancyStatus.ACTIVE,
        ).exists():
            return True

    # Explicit, non-expired grant.
    if listing:
        grant = LocationAccessGrant.objects.filter(
            listing=listing,
            user=user,
            status=LocationGrantStatus.GRANTED,
        ).first()
        if grant and (grant.expires_at is None or grant.expires_at > timezone.now()):
            return True
    return False


@transaction.atomic
def publish_listing(listing, actor):
    """Publish a listing after verification. Records an audit entry."""
    if listing.verification_status != ListingVerification.VERIFIED:
        raise ValueError('Only verified listings can be published.')
    previous = listing.status
    listing.status = ListingStatus.PUBLISHED
    listing.published_at = timezone.now()
    listing.save(update_fields=['status', 'published_at', 'updated_at'])
    ListingAudit.objects.create(
        listing=listing,
        property=listing.property,
        actor=actor,
        from_status=previous,
        to_status=ListingStatus.PUBLISHED,
        note='Listing published.',
    )
    return listing


@transaction.atomic
def submit_for_review(listing, actor):
    if listing.status not in (ListingStatus.DRAFT, ListingStatus.REJECTED, ListingStatus.SUSPENDED):
        raise ValueError('Only draft, rejected, or suspended listings can be submitted for review.')
    previous = listing.status
    listing.status = ListingStatus.PENDING_REVIEW
    listing.save(update_fields=['status', 'updated_at'])
    ListingAudit.objects.create(
        listing=listing,
        property=listing.property,
        actor=actor,
        from_status=previous,
        to_status=ListingStatus.PENDING_REVIEW,
        note='Submitted for review.',
    )
    return listing


@transaction.atomic
def grant_location_access(listing, user, source, granted_by=None, reason='', expires_at=None, payment_reference='', service_request_reference=''):
    """Create an active location-access grant. Never client-triggered."""
    grant, _ = LocationAccessGrant.objects.update_or_create(
        listing=listing,
        user=user,
        defaults={
            'source': source,
            'reason': reason,
            'granted_by': granted_by,
            'status': LocationGrantStatus.GRANTED,
            'granted_at': timezone.now(),
            'expires_at': expires_at,
            'payment_reference': payment_reference,
            'service_request_reference': service_request_reference,
        },
    )
    return grant


@transaction.atomic
def create_property(*, actor, landlord=None, data):
    """Create a property. Employee-entered properties may have no landlord yet."""
    prop = Property.objects.create(
        title=data['title'],
        category=data['category'],
        landlord=landlord,
        created_by_employee=None if landlord else actor,
        division=data.get('division', ''),
        district=data.get('district', ''),
        city=data.get('city', ''),
        area=data.get('area', ''),
        society_name=data.get('society_name', ''),
        block=data.get('block', ''),
        road_number=data.get('road_number', ''),
        house_number=data.get('house_number', ''),
        building_name=data.get('building_name', ''),
        postal_code=data.get('postal_code', ''),
        landmark=data.get('landmark', ''),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        full_private_address=data.get('full_private_address', ''),
        public_location=data.get('public_location', ''),
        status=PropertyStatus.ACTIVE,
    )
    return prop

