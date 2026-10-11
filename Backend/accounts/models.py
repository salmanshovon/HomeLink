"""Accounts domain: custom user, roles, profiles, addresses, OTP."""

import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from common.models import TimeStampedModel
from .managers import UserManager


class AccountStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    ACTIVE = 'active', 'Active'
    SUSPENDED = 'suspended', 'Suspended'
    DEACTIVATED = 'deactivated', 'Deactivated'


class Role(models.TextChoices):
    LANDLORD = 'landlord', 'Landlord'
    TENANT = 'tenant', 'Tenant'
    EMPLOYEE = 'employee', 'Employee'
    SUPERADMIN = 'superadmin', 'Superadmin'


class User(AbstractUser):
    """
    HomeLink custom user.

    Authentication policy: the **phone number** is the unique account
    identifier and login field. ``email`` is optional and used for
    notifications and password reset when present. Role-based access is
    managed through :class:`UserRole`; public registration can only ever
    create ``TENANT`` or ``LANDLORD`` roles.
    """

    username = None  # phone number is the identifier
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.EmailField(unique=True, blank=True, null=True)
    phone_number = models.CharField(max_length=20, unique=True)

    is_phone_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    account_status = models.CharField(
        max_length=20, choices=AccountStatus.choices, default=AccountStatus.PENDING
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    class Meta:
        ordering = ('-created_at',)
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def __str__(self):
        return self.phone_number or self.email or str(self.id)

    # -- role helpers -----------------------------------------------------
    @property
    def role_values(self):
        return list(self.roles.values_list('role', flat=True))

    def has_role(self, role):
        return self.roles.filter(role=role).exists()

    @property
    def is_landlord(self):
        return self.has_role(Role.LANDLORD)

    @property
    def is_tenant(self):
        return self.has_role(Role.TENANT)

    @property
    def is_employee(self):
        return self.has_role(Role.EMPLOYEE)

    @property
    def is_superadmin(self):
        return self.has_role(Role.SUPERADMIN)


class UserRole(TimeStampedModel):
    """A role assigned to a user. A user may hold multiple roles."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roles')
    role = models.CharField(max_length=20, choices=Role.choices)
    assigned_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='roles_assigned'
    )

    class Meta:
        unique_together = ('user', 'role')
        ordering = ('role',)

    def __str__(self):
        return f'{self.user_id}:{self.role}'


class UserAddress(TimeStampedModel):
    """Reusable, structured address for a user."""

    class AddressType(models.TextChoices):
        PRESENT = 'present', 'Present'
        PERMANENT = 'permanent', 'Permanent'
        WORK = 'work', 'Work'
        OTHER = 'other', 'Other'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    address_type = models.CharField(max_length=20, choices=AddressType.choices)
    label = models.CharField(max_length=100, blank=True)
    division = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    area = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    address_line = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ('-is_primary', '-created_at')

    def __str__(self):
        return f'{self.user_id} - {self.get_address_type_display()}'


class LandlordProfile(TimeStampedModel):
    """Verified landlord identity. NID is sensitive and never public."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='landlord_profile')
    legal_name = models.CharField(max_length=200)
    display_name = models.CharField(max_length=200, blank=True)
    alternate_phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    # Sensitive identity data — access restricted to authorized staff.
    nid_number = models.CharField(max_length=30, blank=True)
    nid_verified = models.BooleanField(default=False)
    identity_metadata = models.JSONField(default=dict, blank=True)

    profile_verified = models.BooleanField(default=False)
    contact_address = models.ForeignKey(
        UserAddress, null=True, blank=True, on_delete=models.SET_NULL, related_name='+'
    )

    class Meta:
        verbose_name = 'landlord profile'

    def __str__(self):
        return self.legal_name


class TenantProfile(TimeStampedModel):
    """Tenant identity and preferences."""

    class ContactMethod(models.TextChoices):
        PHONE = 'phone', 'Phone'
        EMAIL = 'email', 'Email'
        SMS = 'sms', 'SMS'
        APP = 'app', 'In-app'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tenant_profile')
    full_name = models.CharField(max_length=200)
    alternate_phone = models.CharField(max_length=20, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    organization = models.CharField(max_length=200, blank=True)
    emergency_contact = models.CharField(max_length=20, blank=True)
    preferred_contact_method = models.CharField(
        max_length=10, choices=ContactMethod.choices, default=ContactMethod.PHONE
    )
    profile_verified = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'tenant profile'

    def __str__(self):
        return self.full_name


class EmployeeProfile(TimeStampedModel):
    """HomeLink employee record."""

    class EmploymentStatus(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ON_LEAVE = 'on_leave', 'On leave'
        INACTIVE = 'inactive', 'Inactive'
        TERMINATED = 'terminated', 'Terminated'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_code = models.CharField(max_length=30, unique=True)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=150)
    supervisor = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='supervisees'
    )
    service_area = models.CharField(max_length=200, blank=True)
    employment_status = models.CharField(
        max_length=20, choices=EmploymentStatus.choices, default=EmploymentStatus.ACTIVE
    )

    class Meta:
        verbose_name = 'employee profile'

    def __str__(self):
        return f'{self.employee_code} - {self.user_id}'


class PhoneOTP(TimeStampedModel):
    """One-time password for phone verification / password reset."""

    class Purpose(models.TextChoices):
        PHONE_VERIFICATION = 'phone_verification', 'Phone verification'
        PASSWORD_RESET = 'password_reset', 'Password reset'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    code = models.CharField(max_length=8)
    purpose = models.CharField(max_length=30, choices=Purpose.choices)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'otp:{self.user_id}:{self.purpose}'

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_consumed(self):
        return self.consumed_at is not None

    def is_valid(self):
        return not self.is_expired and not self.is_consumed
