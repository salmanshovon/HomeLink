"""Property, listing, privacy, and search tests."""

from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Role
from accounts.tests import create_user
from properties.models import (
    ListingStatus,
    ListingVerification,
    LocationAccessGrant,
    LocationGrantStatus,
    Property,
    PropertyListing,
    PropertyUnit,
    SavedProperty,
)
from properties.services import can_view_private_location, publish_listing


class PropertyModelTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01710000001', role=Role.LANDLORD)
        self.prop = Property.objects.create(
            title='Test Property', category='apartment_building', division='Dhaka',
            district='Dhaka', city='Dhanmondi', area='Dhanmondi', landlord=self.landlord,
            full_private_address='House 1, Road 2, Dhanmondi',
        )
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')

    def test_landlord_can_have_multiple_properties(self):
        prop2 = Property.objects.create(title='P2', category='standalone_house', division='Dhaka',
                                        district='Dhaka', city='Uttara', landlord=self.landlord)
        self.assertEqual(self.landlord.properties.count(), 2)

    def test_property_str(self):
        self.assertIn('Test Property', str(self.prop))


class ListingPublicationTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01710000002', role=Role.LANDLORD)
        self.prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                            district='Dhaka', city='Dhaka', landlord=self.landlord)
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')
        self.listing = PropertyListing.objects.create(
            property=self.prop, unit=self.unit, created_by=self.landlord,
            monthly_rent=Decimal('15000'), status=ListingStatus.DRAFT,
            verification_status=ListingVerification.UNVERIFIED,
        )

    def test_unpublished_listing_not_in_public_search(self):
        client = APIClient()
        resp = client.get('/api/v1/listings/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['count'], 0)

    def test_publish_requires_verification(self):
        with self.assertRaises(ValueError):
            publish_listing(self.listing, self.landlord)

    def test_publish_verified_listing(self):
        self.listing.verification_status = ListingVerification.VERIFIED
        self.listing.status = ListingStatus.PENDING_REVIEW
        self.listing.save()
        publish_listing(self.listing, self.landlord)
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.status, ListingStatus.PUBLISHED)
        self.assertIsNotNone(self.listing.published_at)
        # Audit recorded
        self.assertTrue(self.listing.audit_logs.exists())

    def test_published_listing_appears_in_search(self):
        self.listing.verification_status = ListingVerification.VERIFIED
        self.listing.status = ListingStatus.PUBLISHED
        self.listing.save()
        client = APIClient()
        resp = client.get('/api/v1/listings/')
        self.assertEqual(resp.data['count'], 1)


class PrivacyTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01710000003', role=Role.LANDLORD)
        self.tenant = create_user('01710000004', role=Role.TENANT)
        self.prop = Property.objects.create(
            title='P', category='apartment_building', division='Dhaka', district='Dhaka',
            city='Dhaka', landlord=self.landlord, full_private_address='Secret address',
        )
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')
        self.listing = PropertyListing.objects.create(
            property=self.prop, unit=self.unit, created_by=self.landlord,
            monthly_rent=Decimal('15000'), status=ListingStatus.PUBLISHED,
            verification_status=ListingVerification.VERIFIED,
        )

    def test_public_serializer_excludes_private_address(self):
        client = APIClient()
        resp = client.get(f'/api/v1/properties/{self.prop.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertNotIn('full_private_address', resp.data)
        self.assertNotIn('Secret address', str(resp.data))

    def test_can_view_private_location_for_tenant(self):
        # Tenant without grant cannot view
        self.assertFalse(can_view_private_location(self.tenant, self.listing))
        # Landlord can view
        self.assertTrue(can_view_private_location(self.landlord, self.listing))
        # Grant enables tenant
        LocationAccessGrant.objects.create(
            listing=self.listing, user=self.tenant, source='staff',
            status=LocationGrantStatus.GRANTED,
        )
        self.assertTrue(can_view_private_location(self.tenant, self.listing))


class SearchFilterTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01710000005', role=Role.LANDLORD)
        self.prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                            district='Dhaka', city='Dhanmondi', landlord=self.landlord)
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment',
                                                bedrooms=2, bathrooms=2)
        self.listing = PropertyListing.objects.create(
            property=self.prop, unit=self.unit, created_by=self.landlord,
            monthly_rent=Decimal('20000'), status=ListingStatus.PUBLISHED,
            verification_status=ListingVerification.VERIFIED,
        )

    def test_rent_filter(self):
        client = APIClient()
        self.assertEqual(client.get('/api/v1/listings/?min_rent=10000').data['count'], 1)
        self.assertEqual(client.get('/api/v1/listings/?min_rent=30000').data['count'], 0)

    def test_district_filter(self):
        client = APIClient()
        self.assertEqual(client.get('/api/v1/listings/?district=Dhaka').data['count'], 1)
        self.assertEqual(client.get('/api/v1/listings/?district=Chattogram').data['count'], 0)

    def test_bedroom_filter(self):
        client = APIClient()
        self.assertEqual(client.get('/api/v1/listings/?bedrooms=2').data['count'], 1)
        self.assertEqual(client.get('/api/v1/listings/?bedrooms=3').data['count'], 0)


class SavedPropertyTests(TestCase):
    def setUp(self):
        self.tenant = create_user('01710000006', role=Role.TENANT)
        self.landlord = create_user('01710000007', role=Role.LANDLORD)
        self.prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                            district='Dhaka', city='Dhaka', landlord=self.landlord)
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')
        self.listing = PropertyListing.objects.create(
            property=self.prop, unit=self.unit, created_by=self.landlord,
            monthly_rent=Decimal('15000'), status=ListingStatus.PUBLISHED,
            verification_status=ListingVerification.VERIFIED,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.tenant)

    def test_save_and_unsave(self):
        resp = self.client.post(f'/api/v1/properties/{self.prop.id}/save/')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(SavedProperty.objects.count(), 1)
        # Duplicate save returns 200, still one record
        resp = self.client.post(f'/api/v1/properties/{self.prop.id}/save/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(SavedProperty.objects.count(), 1)
        # Unsave
        resp = self.client.delete(f'/api/v1/properties/{self.prop.id}/save/')
        self.assertEqual(resp.status_code, 204)
        self.assertEqual(SavedProperty.objects.count(), 0)
