"""Billing domain: invoices, bills, payments, allocations, refunds, receipts."""

import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from common.models import TimeStampedModel
from common.utils import generate_reference
from common.validators import validate_document

User = settings.AUTH_USER_MODEL


class InvoiceStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    ISSUED = 'issued', 'Issued'
    PARTIALLY_PAID = 'partially_paid', 'Partially paid'
    PAID = 'paid', 'Paid'
    OVERDUE = 'overdue', 'Overdue'
    CANCELLED = 'cancelled', 'Cancelled'


class RentInvoice(TimeStampedModel):
    """Rent invoice for a tenancy and billing period."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenancy = models.ForeignKey('rentals.Tenancy', on_delete=models.PROTECT, related_name='invoices')
    invoice_number = models.CharField(max_length=40, unique=True, db_index=True)
    billing_period = models.CharField(max_length=20)
    issue_date = models.DateField()
    due_date = models.DateField(db_index=True)

    base_rent = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    service_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    utility_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    other_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])

    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    outstanding_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])

    status = models.CharField(
        max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.DRAFT, db_index=True
    )
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='invoices_created'
    )

    class Meta:
        ordering = ('-issue_date', '-created_at')
        unique_together = ('tenancy', 'billing_period')

    def __str__(self):
        return self.invoice_number

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = generate_reference('INV')
        self.total_amount = (
            self.base_rent + self.service_charge + self.utility_charges
            + self.other_charges - self.discount
        )
        self.outstanding_amount = self.total_amount - self.paid_amount
        super().save(*args, **kwargs)


class BillCategory(models.TextChoices):
    ELECTRICITY = 'electricity', 'Electricity'
    GAS = 'gas', 'Gas'
    WATER = 'water', 'Water'
    INTERNET = 'internet', 'Internet'
    MAINTENANCE = 'maintenance', 'Maintenance'
    MISCELLANEOUS = 'miscellaneous', 'Miscellaneous'


class BillStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    ISSUED = 'issued', 'Issued'
    PARTIALLY_PAID = 'partially_paid', 'Partially paid'
    PAID = 'paid', 'Paid'
    OVERDUE = 'overdue', 'Overdue'
    CANCELLED = 'cancelled', 'Cancelled'


class BillAllocation(models.TextChoices):
    INDIVIDUAL = 'individual', 'Individual'
    SPLIT = 'split', 'Split'
    SHARED = 'shared', 'Shared'


class Bill(TimeStampedModel):
    """Non-rent charges (utilities, maintenance, etc.)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenancy = models.ForeignKey('rentals.Tenancy', on_delete=models.PROTECT, related_name='bills')
    unit = models.ForeignKey('properties.PropertyUnit', null=True, blank=True, on_delete=models.SET_NULL, related_name='bills')
    category = models.CharField(max_length=20, choices=BillCategory.choices)
    billing_period = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    issue_date = models.DateField()
    due_date = models.DateField(db_index=True)
    description = models.TextField(blank=True)
    attachment = models.FileField(upload_to='billing/bills/%Y/%m/', validators=[validate_document], null=True, blank=True)
    allocation_type = models.CharField(
        max_length=20, choices=BillAllocation.choices, default=BillAllocation.INDIVIDUAL
    )
    status = models.CharField(
        max_length=20, choices=BillStatus.choices, default=BillStatus.DRAFT, db_index=True
    )
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='bills_created'
    )

    class Meta:
        ordering = ('-issue_date', '-created_at')

    def __str__(self):
        return f'bill:{self.id}:{self.get_category_display()}'


class PaymentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PROCESSING = 'processing', 'Processing'
    SUCCESSFUL = 'successful', 'Successful'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'
    REFUNDED = 'refunded', 'Refunded'
    PARTIALLY_REFUNDED = 'partially_refunded', 'Partially refunded'


class PaymentMethod(models.TextChoices):
    CASH = 'cash', 'Cash'
    BANK_TRANSFER = 'bank_transfer', 'Bank transfer'
    MOBILE_FINANCIAL = 'mobile_financial', 'Mobile financial service'
    ONLINE = 'online', 'Online'
    OTHER = 'other', 'Other'


class PaymentPurpose(models.TextChoices):
    RENT = 'rent', 'Rent'
    SECURITY_DEPOSIT = 'security_deposit', 'Security deposit'
    SERVICE_CHARGE = 'service_charge', 'Service charge'
    BILL = 'bill', 'Bill'
    COMMISSION = 'commission', 'Commission'
    LOCATION_DISCLOSURE = 'location_disclosure', 'Location disclosure'
    MAINTENANCE = 'maintenance', 'Maintenance'
    OTHER = 'other', 'Other'


class Payment(TimeStampedModel):
    """A payment attempt. Success is only set after verification."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='payments')
    tenancy = models.ForeignKey('rentals.Tenancy', null=True, blank=True, on_delete=models.PROTECT, related_name='payments')
    invoice = models.ForeignKey(RentInvoice, null=True, blank=True, on_delete=models.PROTECT, related_name='payments')
    purpose = models.CharField(max_length=30, choices=PaymentPurpose.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='BDT')
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    provider = models.CharField(max_length=50, blank=True)
    provider_tx_ref = models.CharField(max_length=120, blank=True)
    internal_tx_ref = models.CharField(max_length=40, unique=True, blank=True)
    status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True
    )
    idempotency_key = models.CharField(max_length=80, unique=True, null=True, blank=True)
    initiated_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments_verified'
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ('-initiated_at',)

    def __str__(self):
        return f'payment:{self.id}:{self.get_status_display()}'

    def save(self, *args, **kwargs):
        if not self.internal_tx_ref:
            self.internal_tx_ref = generate_reference('PAY')
        super().save(*args, **kwargs)


class PaymentAllocation(TimeStampedModel):
    """Allocation of a payment toward an invoice (supports partial/multi)."""

    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name='allocations')
    invoice = models.ForeignKey(RentInvoice, on_delete=models.PROTECT, related_name='allocations')
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        unique_together = ('payment', 'invoice')
        ordering = ('-created_at',)

    def __str__(self):
        return f'alloc:{self.payment_id}->{self.invoice_id}'


class RefundStatus(models.TextChoices):
    REQUESTED = 'requested', 'Requested'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'
    PROCESSED = 'processed', 'Processed'


class Refund(TimeStampedModel):
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name='refunds')
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    reason = models.TextField()
    status = models.CharField(
        max_length=20, choices=RefundStatus.choices, default=RefundStatus.REQUESTED
    )
    provider_reference = models.CharField(max_length=120, blank=True)
    requested_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='refunds_requested')
    approved_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='refunds_approved'
    )

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'refund:{self.payment_id}'


class RentRevision(TimeStampedModel):
    """Historical record of rent changes for a tenancy."""

    tenancy = models.ForeignKey('rentals.Tenancy', on_delete=models.CASCADE, related_name='rent_revisions')
    previous_rent = models.DecimalField(max_digits=12, decimal_places=2)
    new_rent = models.DecimalField(max_digits=12, decimal_places=2)
    effective_date = models.DateField()
    reason = models.TextField(blank=True)
    authorized_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='rent_revisions_authorized'
    )

    class Meta:
        ordering = ('-effective_date', '-created_at')

    def __str__(self):
        return f'revision:{self.tenancy_id}:{self.new_rent}'


class Receipt(TimeStampedModel):
    """Generated for verified payments."""

    payment = models.OneToOneField(Payment, on_delete=models.PROTECT, related_name='receipt')
    receipt_number = models.CharField(max_length=40, unique=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-generated_at',)

    def __str__(self):
        return self.receipt_number

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = generate_reference('RCPT')
        super().save(*args, **kwargs)
