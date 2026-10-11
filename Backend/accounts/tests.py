"""Accounts and authorization tests."""

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import AccountStatus, LandlordProfile, Role, TenantProfile, User
from properties.models import Property


def create_user(phone, password='Pass12345!', role=None, is_staff=False, **extra):
    from common.utils import normalize_bd_phone
    phone = normalize_bd_phone(phone) or phone
    extra.setdefault('email', None)
    extra.setdefault('account_status', AccountStatus.ACTIVE)
    user = User.objects.create_user(phone_number=phone, password=password, **extra)
    if is_staff:
        user.is_staff = True
        user.save(update_fields=['is_staff'])
    if role:
        # Test helper: assign roles directly (bypasses staff-only grant check).
        from accounts.models import UserRole
        UserRole.objects.create(user=user, role=role)
    return user


class RegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_tenant_registration_creates_tenant_role(self):
        resp = self.client.post('/api/v1/auth/register/tenant/', {
            'phone_number': '01711111111', 'password': 'TestPass123!', 'full_name': 'A',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        user = User.objects.get(phone_number='+8801711111111')
        self.assertTrue(user.is_tenant)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_staff)

    def test_registration_cannot_self_assign_privileged_role(self):
        resp = self.client.post('/api/v1/auth/register/landlord/', {
            'phone_number': '01722222222', 'password': 'TestPass123!',
            'legal_name': 'X',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        user = User.objects.get(phone_number='+8801722222222')
        self.assertTrue(user.is_landlord)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_staff)
        self.assertEqual(user.account_status, AccountStatus.PENDING)

    def test_phone_is_normalized(self):
        resp = self.client.post('/api/v1/auth/register/tenant/', {
            'phone_number': '01733333333', 'password': 'TestPass123!',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(User.objects.filter(phone_number='+8801733333333').exists())

    def test_duplicate_phone_rejected(self):
        create_user('01744444444', role=Role.TENANT)
        resp = self.client.post('/api/v1/auth/register/tenant/', {
            'phone_number': '01744444444', 'password': 'TestPass123!',
        }, format='json')
        self.assertEqual(resp.status_code, 400)


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = create_user('01755555555', role=Role.TENANT)

    def test_login_with_normalized_phone(self):
        resp = self.client.post('/api/v1/auth/login/', {
            'phone_number': '01755555555', 'password': 'Pass12345!',
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)

    def test_login_wrong_password(self):
        resp = self.client.post('/api/v1/auth/login/', {
            'phone_number': '01755555555', 'password': 'wrong',
        }, format='json')
        self.assertEqual(resp.status_code, 401)


class PermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_unauthenticated_cannot_access_protected(self):
        resp = self.client.get('/api/v1/notifications/')
        self.assertEqual(resp.status_code, 401)

    def test_tenant_cannot_access_another_tenants_data(self):
        from rentals.models import Tenancy, TenancyStatus
        from properties.models import PropertyUnit

        landlord = create_user('01766666666', role=Role.LANDLORD)
        tenant1 = create_user('01777777777', role=Role.TENANT)
        tenant2 = create_user('01788888888', role=Role.TENANT)

        prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                       district='Dhaka', city='Dhaka', landlord=landlord)
        unit = PropertyUnit.objects.create(property=prop, unit_number='1A', unit_type='apartment')
        tenancy = Tenancy.objects.create(unit=unit, tenant=tenant1, landlord=landlord,
                                         start_date='2026-01-01', monthly_rent=10000,
                                         status=TenancyStatus.ACTIVE)

        # tenant2 tries to access tenant1's tenancy
        self.client.force_authenticate(user=tenant2)
        resp = self.client.get(f'/api/v1/tenancies/{tenancy.id}/')
        self.assertIn(resp.status_code, (403, 404))
