"""Commissions domain: agreements, obligations, ledger."""

import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from common.models import TimeStampedModel

User = settings.AUTH_USER_MODEL


class PayerType(models.TextChoices):
    LANDLORD = 'landlord', 'Landlord'
    TENANT = 'tenant', 'Tenant'
    BOTH = 'both', 'Both'
    OTHER = 'other', 'Other'


class CalculationType(models.TextChoices):
    FIXED = 'fixed', 'Fixed amount'
    PERCENTAGE = 'percentage', 'Percentage'
    MONTHS_OF_RENT = 'months_of_rent', 'Months of rent'
    CUSTOM = 'custom', 'Custom'


class AgreementStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    AGREED = 'agreed', 'Agreed'
    ACTIVE = 'active', 'Active'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class CommissionAgreement(TimeStampedModel):
    """The agreed commission terms. Not proof of payment."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey('properties.PropertyListing', null=True, blank=True, on_delete=models.SET_NULL, related_name='commission_agreements')
    tenancy = models.ForeignKey('rentals.Tenancy', null=True, blank=True, on_delete=models.SET_NULL, related_name='commission_agreements')
    service_request = models.ForeignKey('leads.RentalServiceRequest', null=True, blank=True, on_delete=models.SET_NULL, related_name='commission_agreements')

    payer_type = models.CharField(max_length=20, choices=PayerType.choices)
    calculation_type = models.CharField(max_length=20, choices=CalculationType.choices)
    rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='BDT')
    terms = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=AgreementStatus.choices, default=AgreementStatus.DRAFT, db_index=True
    )
    effective_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='commission_agreements_created')

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'agreement:{self.id}:{self.get_payer_type_display()}'


class ObligationStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    DUE = 'due', 'Due'
    PARTIALLY_PAID = 'partially_paid', 'Partially paid'
    PAID = 'paid', 'Paid'
    WAIVED = 'waived', 'Waived'
    CANCELLED = 'cancelled', 'Cancelled'


class CommissionObligation(TimeStampedModel):
    """A concrete amount due from a specific payer."""

    agreement = models.ForeignKey(CommissionAgreement, on_delete=models.CASCADE, related_name='obligations')
    payer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='commission_obligations')
    calculation_basis = models.CharField(max_length=100, blank=True)
    amount_due = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    due_date = models.DateField(null=True, blank=True, db_index=True)
    status = models.CharField(
        max_length=20, choices=ObligationStatus.choices, default=ObligationStatus.PENDING, db_index=True
    )
    payment = models.ForeignKey(
        'billing.Payment', null=True, blank=True, on_delete=models.SET_NULL, related_name='commission_obligations'
    )

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'obligation:{self.id}:{self.payer_id}'


class LedgerEntryType(models.TextChoices):
    COLLECTION = 'collection', 'Collection'
    REFUND = 'refund', 'Refund'
    ADJUSTMENT = 'adjustment', 'Adjustment'


class CommissionLedger(TimeStampedModel):
    """Auditable history of commission collections and adjustments."""

    obligation = models.ForeignKey(CommissionObligation, on_delete=models.CASCADE, related_name='ledger_entries')
    entry_type = models.CharField(max_length=20, choices=LedgerEntryType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    reference = models.CharField(max_length=80, blank=True)
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='commission_ledger_entries')

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'ledger:{self.obligation_id}:{self.entry_type}'
