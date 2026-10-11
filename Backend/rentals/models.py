"""Rentals domain: viewings, applications, tenancies, events."""

import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from common.models import TimeStampedModel
from common.validators import validate_document

User = settings.AUTH_USER_MODEL


class ViewingStatus(models.TextChoices):
    REQUESTED = 'requested', 'Requested'
    CONFIRMED = 'confirmed', 'Confirmed'
    RESCHEDULED = 'rescheduled', 'Rescheduled'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'
    NO_SHOW = 'no_show', 'No show'


class ViewingAppointment(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey('properties.PropertyListing', on_delete=models.CASCADE, related_name='viewings')
    unit = models.ForeignKey('properties.PropertyUnit', null=True, blank=True, on_delete=models.SET_NULL, related_name='viewings')
    customer = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='viewings')
    guest_name = models.CharField(max_length=200, blank=True)
    guest_phone = models.CharField(max_length=20, blank=True)
    assigned_employee = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_viewings'
    )
    requested_datetime = models.DateTimeField()
    confirmed_datetime = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=ViewingStatus.choices, default=ViewingStatus.REQUESTED, db_index=True
    )
    meeting_instructions = models.TextField(blank=True)
    feedback = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)

    class Meta:
        ordering = ('-requested_datetime',)

    def __str__(self):
        return f'viewing:{self.listing_id}:{self.get_status_display()}'


class ApplicationStatus(models.TextChoices):
    SUBMITTED = 'submitted', 'Submitted'
    UNDER_REVIEW = 'under_review', 'Under review'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'
    WITHDRAWN = 'withdrawn', 'Withdrawn'


class RentalApplication(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey('properties.PropertyListing', on_delete=models.CASCADE, related_name='applications')
    unit = models.ForeignKey('properties.PropertyUnit', null=True, blank=True, on_delete=models.SET_NULL, related_name='applications')
    applicant = models.ForeignKey(User, on_delete=models.PROTECT, related_name='rental_applications')
    requested_move_in_date = models.DateField()
    proposed_rent = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.SUBMITTED, db_index=True
    )
    notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_applications'
    )

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'application:{self.listing_id}:{self.get_status_display()}'


class TenancyStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    ACTIVE = 'active', 'Active'
    EXPIRED = 'expired', 'Expired'
    TERMINATED = 'terminated', 'Terminated'
    CANCELLED = 'cancelled', 'Cancelled'


class Tenancy(TimeStampedModel):
    """Authoritative record of a tenant renting a specific unit."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.ForeignKey('properties.PropertyUnit', on_delete=models.PROTECT, related_name='tenancies')
    listing = models.ForeignKey(
        'properties.PropertyListing', null=True, blank=True, on_delete=models.SET_NULL, related_name='tenancies'
    )
    tenant = models.ForeignKey(User, on_delete=models.PROTECT, related_name='tenancies')
    landlord = models.ForeignKey(User, on_delete=models.PROTECT, related_name='landlord_tenancies')

    start_date = models.DateField(db_index=True)
    end_date = models.DateField(null=True, blank=True, db_index=True)

    monthly_rent = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    service_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    billing_due_day = models.PositiveSmallIntegerField(default=1)
    grace_period_days = models.PositiveSmallIntegerField(default=0)

    agreement_file = models.FileField(upload_to='rentals/agreements/%Y/%m/', validators=[validate_document], null=True, blank=True)
    agreement_reference = models.CharField(max_length=80, blank=True)

    status = models.CharField(
        max_length=20, choices=TenancyStatus.choices, default=TenancyStatus.PENDING, db_index=True
    )
    move_in_notes = models.TextField(blank=True)
    move_out_notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='tenancies_created'
    )

    class Meta:
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['landlord', 'status']),
            models.Index(fields=['unit', 'status']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(end_date__isnull=True) | models.Q(end_date__gte=models.F('start_date')),
                name='tenancy_end_after_start',
            ),
        ]

    def __str__(self):
        return f'tenancy:{self.unit_id}:{self.get_status_display()}'

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.end_id and self.end_date and self.end_date < self.start_date:
            raise ValidationError('Tenancy end date must be on or after the start date.')


class OccupantStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    INACTIVE = 'inactive', 'Inactive'


class TenancyMember(TimeStampedModel):
    """Other occupants associated with a tenancy (not the primary tenant)."""

    tenancy = models.ForeignKey(Tenancy, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='tenancy_memberships')
    name = models.CharField(max_length=200)
    relationship = models.CharField(max_length=100, blank=True)
    contact = models.CharField(max_length=50, blank=True)
    status = models.CharField(
        max_length=20, choices=OccupantStatus.choices, default=OccupantStatus.ACTIVE
    )

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'member:{self.tenancy_id}:{self.name}'


class TenancyEventType(models.TextChoices):
    MOVE_IN = 'move_in', 'Move in'
    MOVE_OUT = 'move_out', 'Move out'
    RENEWAL = 'renewal', 'Renewal'
    TERMINATION = 'termination', 'Termination'
    RENT_CHANGE = 'rent_change', 'Rent change'
    OTHER = 'other', 'Other'


class TenancyEvent(TimeStampedModel):
    tenancy = models.ForeignKey(Tenancy, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=20, choices=TenancyEventType.choices)
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='tenancy_events')
    occurred_at = models.DateTimeField()
    reason = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ('-occurred_at', '-created_at')

    def __str__(self):
        return f'event:{self.tenancy_id}:{self.event_type}'
