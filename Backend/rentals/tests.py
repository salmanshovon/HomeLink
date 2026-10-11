"""Rentals tests: tenancy overlap, authorization, viewings, applications."""

from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Role
from accounts.tests import create_user
from properties.models import ListingStatus, Property, PropertyListing, PropertyUnit
from rentals.models import ApplicationStatus, RentalApplication, Tenancy, TenancyStatus, ViewingStatus
from rentals.services import create_tenancy


class TenancyOverlapTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01720000001', role=Role.LANDLORD)
        self.tenant = create_user('01720000002', role=Role.TENANT)
        self.prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                            district='Dhaka', city='Dhaka', landlord=self.landlord)
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')

    def test_overlapping_active_tenancy_rejected(self):
        t1 = create_tenancy(actor=self.landlord, unit=self.unit, tenant=self.tenant, landlord=self.landlord,
                            start_date='2026-01-01', end_date='2026-12-31', monthly_rent=Decimal('10000'))
        t1.status = TenancyStatus.ACTIVE
        t1.save(update_fields=['status'])
        tenant2 = create_user('01720000003', role=Role.TENANT)
        with self.assertRaises(ValueError):
            create_tenancy(actor=self.landlord, unit=self.unit, tenant=tenant2, landlord=self.landlord,
                            start_date='2026-06-01', end_date='2027-06-01', monthly_rent=Decimal('10000'))
        self.assertEqual(Tenancy.objects.count(), 1)

    def test_non_overlapping_tenancy_allowed(self):
        create_tenancy(actor=self.landlord, unit=self.unit, tenant=self.tenant, landlord=self.landlord,
                        start_date='2026-01-01', end_date='2026-06-30', monthly_rent=Decimal('10000'))
        tenant2 = create_user('01720000004', role=Role.TENANT)
        # After the first tenancy ends
        t2 = create_tenancy(actor=self.landlord, unit=self.unit, tenant=tenant2, landlord=self.landlord,
                             start_date='2026-07-01', end_date='2026-12-31', monthly_rent=Decimal('10000'))
        self.assertEqual(Tenancy.objects.count(), 2)

    def test_landlord_cannot_rent_others_property(self):
        other_landlord = create_user('01720000005', role=Role.LANDLORD)
        prop2 = Property.objects.create(title='P2', category='apartment_building', division='Dhaka',
                                        district='Dhaka', city='Dhaka', landlord=other_landlord)
        unit2 = PropertyUnit.objects.create(property=prop2, unit_number='1A', unit_type='apartment')
        with self.assertRaises(ValueError):
            create_tenancy(actor=self.landlord, unit=unit2, tenant=self.tenant, landlord=self.landlord,
                            start_date='2026-01-01', monthly_rent=Decimal('10000'))


class ViewingTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01720000006', role=Role.LANDLORD)
        self.tenant = create_user('01720000007', role=Role.TENANT)
        self.prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                            district='Dhaka', city='Dhaka', landlord=self.landlord)
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')
        self.listing = PropertyListing.objects.create(
            property=self.prop, unit=self.unit, created_by=self.landlord,
            monthly_rent=Decimal('15000'), status=ListingStatus.PUBLISHED,
        )

    def test_viewing_cannot_be_confirmed_for_unavailable_listing(self):
        from rentals.models import ViewingAppointment
        from rentals.services import confirm_viewing
        viewing = ViewingAppointment.objects.create(
            listing=self.listing, customer=self.tenant, requested_datetime='2026-01-01T10:00:00Z',
        )
        self.listing.status = ListingStatus.RENTED
        self.listing.save()
        with self.assertRaises(ValueError):
            confirm_viewing(viewing, self.landlord)


class ApplicationTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01720000008', role=Role.LANDLORD)
        self.tenant = create_user('01720000009', role=Role.TENANT)
        self.prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                            district='Dhaka', city='Dhaka', landlord=self.landlord)
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')
        self.listing = PropertyListing.objects.create(
            property=self.prop, unit=self.unit, created_by=self.landlord,
            monthly_rent=Decimal('15000'), status=ListingStatus.PUBLISHED,
        )
        self.staff = create_user('01720000010', role=Role.EMPLOYEE)
        self.staff.is_staff = True
        self.staff.save()

    def test_application_approval_requires_staff(self):
        app = RentalApplication.objects.create(
            listing=self.listing, applicant=self.tenant, requested_move_in_date='2026-02-01',
        )
        client = APIClient()
        # Tenant cannot approve own application
        client.force_authenticate(user=self.tenant)
        resp = client.post(f'/api/v1/applications/{app.id}/approve/')
        self.assertEqual(resp.status_code, 403)
        # Staff marks it under review, then approves
        from rentals.models import ApplicationStatus
        app.status = ApplicationStatus.UNDER_REVIEW
        app.save(update_fields=['status'])
        client.force_authenticate(user=self.staff)
        resp = client.post(f'/api/v1/applications/{app.id}/approve/')
        self.assertEqual(resp.status_code, 200)
        app.refresh_from_db()
        self.assertEqual(app.status, ApplicationStatus.APPROVED)
