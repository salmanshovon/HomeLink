"""Services domain: paid services, maintenance requests, quotes, appointments."""

import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from common.models import TimeStampedModel

User = settings.AUTH_USER_MODEL


class ProductOrService(TimeStampedModel):
    """Configurable catalog of chargeable services."""

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=100, unique=True)
    category = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    pricing_config = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name


class PurchasePaymentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PAID = 'paid', 'Paid'
    FAILED = 'failed', 'Failed'
    REFUNDED = 'refunded', 'Refunded'


class FulfillmentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    IN_PROGRESS = 'in_progress', 'In progress'
    FULFILLED = 'fulfilled', 'Fulfilled'
    CANCELLED = 'cancelled', 'Cancelled'


class ServicePurchase(TimeStampedModel):
    """A customer's purchase of a paid service."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='service_purchases')
    product = models.ForeignKey(ProductOrService, on_delete=models.PROTECT, related_name='purchases')
    listing = models.ForeignKey('properties.PropertyListing', null=True, blank=True, on_delete=models.SET_NULL, related_name='service_purchases')
    requirement = models.ForeignKey('leads.RentalRequirement', null=True, blank=True, on_delete=models.SET_NULL, related_name='service_purchases')
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='BDT')
    payment_status = models.CharField(
        max_length=20, choices=PurchasePaymentStatus.choices, default=PurchasePaymentStatus.PENDING
    )
    fulfillment_status = models.CharField(
        max_length=20, choices=FulfillmentStatus.choices, default=FulfillmentStatus.PENDING
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'purchase:{self.id}:{self.product_id}'


class ServiceCategory(TimeStampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ('name',)
        verbose_name_plural = 'service categories'

    def __str__(self):
        return self.name


class ServiceRequestStatus(models.TextChoices):
    SUBMITTED = 'submitted', 'Submitted'
    REVIEWING = 'reviewing', 'Reviewing'
    QUOTED = 'quoted', 'Quoted'
    ACCEPTED = 'accepted', 'Accepted'
    SCHEDULED = 'scheduled', 'Scheduled'
    IN_PROGRESS = 'in_progress', 'In progress'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class ServiceRequest(TimeStampedModel):
    """A maintenance/service request (PABX, CCTV, TV, AC, refrigerator, ...)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='service_requests')
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name='requests')
    property = models.ForeignKey('properties.Property', null=True, blank=True, on_delete=models.SET_NULL, related_name='service_requests')
    service_address = models.TextField(blank=True)
    description = models.TextField()
    preferred_datetime = models.DateTimeField(null=True, blank=True)
    assigned_employee = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_maintenance_requests'
    )
    status = models.CharField(
        max_length=20, choices=ServiceRequestStatus.choices, default=ServiceRequestStatus.SUBMITTED, db_index=True
    )
    estimated_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    final_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    customer_notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'service-request:{self.id}:{self.category_id}'


class AppointmentStatus(models.TextChoices):
    SCHEDULED = 'scheduled', 'Scheduled'
    IN_PROGRESS = 'in_progress', 'In progress'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class ServiceAppointment(TimeStampedModel):
    service_request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name='appointments')
    technician = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='service_appointments')
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=AppointmentStatus.choices, default=AppointmentStatus.SCHEDULED
    )
    completion_notes = models.TextField(blank=True)

    class Meta:
        ordering = ('-scheduled_start',)

    def __str__(self):
        return f'appointment:{self.service_request_id}'


class ServiceQuote(TimeStampedModel):
    service_request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name='quotes')
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    quote_details = models.TextField(blank=True)
    valid_until = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='service_quotes_created')
    accepted = models.BooleanField(default=False)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'quote:{self.service_request_id}:{self.amount}'
