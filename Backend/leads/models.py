"""Leads domain: rental requirements, service requests, matches, leads."""

import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from common.models import TimeStampedModel

User = settings.AUTH_USER_MODEL


class RequirementStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    SUBMITTED = 'submitted', 'Submitted'
    REVIEWING = 'reviewing', 'Reviewing'
    MATCHING = 'matching', 'Matching'
    OPTIONS_SENT = 'options_sent', 'Options sent'
    VIEWING = 'viewing', 'Viewing'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class RentalRequirement(TimeStampedModel):
    """A customer's request for a home."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='rental_requirements'
    )
    entered_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='requirements_entered'
    )

    preferred_locations = models.JSONField(default=list, blank=True)
    min_rent = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    max_rent = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    bedrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    bathrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    min_size_sqft = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    property_type = models.CharField(max_length=30, blank=True)
    furnishing = models.CharField(max_length=20, blank=True)
    preferred_amenities = models.ManyToManyField('properties.Amenity', blank=True, related_name='requirements')
    occupants = models.PositiveSmallIntegerField(null=True, blank=True)
    tenant_category = models.CharField(max_length=30, blank=True)
    desired_move_in_date = models.DateField(null=True, blank=True)
    lease_duration_months = models.PositiveSmallIntegerField(null=True, blank=True)
    additional_requirements = models.TextField(blank=True)
    advance_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    status = models.CharField(
        max_length=20, choices=RequirementStatus.choices, default=RequirementStatus.DRAFT, db_index=True
    )

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'requirement:{self.id}'


class ServiceType(models.TextChoices):
    FULL_ASSISTANCE = 'full_assistance', 'Full assistance'
    VIEWING_ARRANGEMENT = 'viewing_arrangement', 'Viewing arrangement'
    DOCUMENTATION = 'documentation', 'Documentation'
    OTHER = 'other', 'Other'


class ServiceRequestStatus(models.TextChoices):
    OPEN = 'open', 'Open'
    IN_PROGRESS = 'in_progress', 'In progress'
    AWAITING_CUSTOMER = 'awaiting_customer', 'Awaiting customer'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class RentalServiceRequest(TimeStampedModel):
    """A request for HomeLink's assisted rental service."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requirement = models.ForeignKey(RentalRequirement, on_delete=models.CASCADE, related_name='service_requests')
    customer = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='rental_service_requests'
    )
    assigned_employee = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_rental_service_requests'
    )
    service_type = models.CharField(max_length=30, choices=ServiceType.choices)
    status = models.CharField(
        max_length=20, choices=ServiceRequestStatus.choices, default=ServiceRequestStatus.OPEN, db_index=True
    )
    agreed_service_fee = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'service-request:{self.id}'


class MatchStatus(models.TextChoices):
    SUGGESTED = 'suggested', 'Suggested'
    SENT_TO_CUSTOMER = 'sent_to_customer', 'Sent to customer'
    SHORTLISTED = 'shortlisted', 'Shortlisted'
    REJECTED = 'rejected', 'Rejected'
    VIEWING_REQUESTED = 'viewing_requested', 'Viewing requested'
    SELECTED = 'selected', 'Selected'


class RequirementMatch(TimeStampedModel):
    """Links a rental requirement to a candidate listing."""

    requirement = models.ForeignKey(RentalRequirement, on_delete=models.CASCADE, related_name='matches')
    listing = models.ForeignKey('properties.PropertyListing', on_delete=models.CASCADE, related_name='requirement_matches')
    suggested_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='suggested_matches'
    )
    match_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    rationale = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=MatchStatus.choices, default=MatchStatus.SUGGESTED, db_index=True
    )
    suggested_at = models.DateTimeField(auto_now_add=True)
    customer_feedback = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('requirement', 'listing')
        ordering = ('-suggested_at',)

    def __str__(self):
        return f'match:{self.requirement_id}:{self.listing_id}'


class LeadStatus(models.TextChoices):
    NEW = 'new', 'New'
    CONTACTED = 'contacted', 'Contacted'
    QUALIFIED = 'qualified', 'Qualified'
    PROPOSAL = 'proposal', 'Proposal'
    NEGOTIATION = 'negotiation', 'Negotiation'
    WON = 'won', 'Won'
    LOST = 'lost', 'Lost'


class Lead(TimeStampedModel):
    """A prospect with an assigned agent and follow-up tracking."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    source = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=LeadStatus.choices, default=LeadStatus.NEW, db_index=True)
    assigned_agent = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_leads'
    )
    requirement = models.ForeignKey(
        RentalRequirement, null=True, blank=True, on_delete=models.SET_NULL, related_name='leads'
    )
    next_follow_up = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'lead:{self.name}'
