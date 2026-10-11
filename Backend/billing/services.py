"""Billing services: invoices, payments, allocations, refunds (transactional)."""

from django.db import transaction
from django.utils import timezone

from .models import (
    InvoiceStatus,
    Payment,
    PaymentAllocation,
    PaymentStatus,
    Receipt,
    RentInvoice,
)


@transaction.atomic
def generate_invoice(*, tenancy, billing_period, issue_date, due_date,
                     base_rent, service_charge=0, utility_charges=0, other_charges=0,
                     discount=0, description='', created_by=None):
    """Create a rent invoice. Duplicate periods are rejected by the DB."""
    invoice, created = RentInvoice.objects.get_or_create(
        tenancy=tenancy,
        billing_period=billing_period,
        defaults={
            'issue_date': issue_date,
            'due_date': due_date,
            'base_rent': base_rent,
            'service_charge': service_charge,
            'utility_charges': utility_charges,
            'other_charges': other_charges,
            'discount': discount,
            'description': description,
            'created_by': created_by,
            'status': InvoiceStatus.ISSUED,
        },
    )
    if not created:
        raise ValueError('An invoice for this tenancy and billing period already exists.')
    return invoice


@transaction.atomic
def initiate_payment(*, payer, amount, purpose, method, tenancy=None, invoice=None,
                     provider='', idempotency_key=None, metadata=None):
    """Create a pending payment. Idempotent on idempotency_key."""
    if idempotency_key:
        existing = Payment.objects.filter(idempotency_key=idempotency_key).first()
        if existing:
            return existing
    payment = Payment.objects.create(
        payer=payer,
        tenancy=tenancy,
        invoice=invoice,
        purpose=purpose,
        amount=amount,
        method=method,
        provider=provider,
        idempotency_key=idempotency_key,
        metadata=metadata or {},
        status=PaymentStatus.PENDING,
    )
    return payment


@transaction.atomic
def verify_payment(payment, actor, provider_tx_ref=''):
    """
    Mark a payment successful. Idempotent: repeated calls with the same payment
    return the existing verified payment without creating duplicate receipts or
    allocations. Only staff may verify.
    """
    payment = Payment.objects.select_for_update().get(pk=payment.pk)
    if payment.status == PaymentStatus.SUCCESSFUL:
        return payment  # already processed — idempotent
    if payment.status in (PaymentStatus.FAILED, PaymentStatus.CANCELLED, PaymentStatus.REFUNDED):
        raise ValueError(f'Cannot verify a payment with status {payment.get_status_display()}.')
    if not (actor.is_staff or actor.is_superuser):
        raise ValueError('Only authorized staff may verify payments.')

    payment.status = PaymentStatus.SUCCESSFUL
    payment.verified_at = timezone.now()
    payment.verified_by = actor
    if provider_tx_ref:
        payment.provider_tx_ref = provider_tx_ref
    payment.save(update_fields=['status', 'verified_at', 'verified_by', 'provider_tx_ref', 'updated_at'])

    # Generate a receipt.
    Receipt.objects.get_or_create(payment=payment)

    # Allocate to the linked invoice if present.
    if payment.invoice_id:
        allocate_to_invoice(payment, payment.invoice, payment.amount)

    return payment


@transaction.atomic
def allocate_to_invoice(payment, invoice, amount):
    """Allocate a payment to an invoice, updating balances. Validates limits."""
    payment = Payment.objects.select_for_update().get(pk=payment.pk)
    invoice = RentInvoice.objects.select_for_update().get(pk=invoice.pk)

    if payment.status != PaymentStatus.SUCCESSFUL:
        raise ValueError('Only successful payments can be allocated.')
    if amount <= 0:
        raise ValueError('Allocation amount must be positive.')
    if amount > invoice.outstanding_amount:
        raise ValueError('Allocation exceeds the invoice outstanding amount.')

    already = PaymentAllocation.objects.filter(payment=payment, invoice=invoice)
    if already.exists():
        raise ValueError('This payment is already allocated to this invoice.')

    PaymentAllocation.objects.create(payment=payment, invoice=invoice, amount=amount)

    invoice.paid_amount += amount
    invoice.outstanding_amount = invoice.total_amount - invoice.paid_amount
    if invoice.outstanding_amount <= 0:
        invoice.status = InvoiceStatus.PAID
        invoice.outstanding_amount = 0
    else:
        invoice.status = InvoiceStatus.PARTIALLY_PAID
    invoice.save(update_fields=['paid_amount', 'outstanding_amount', 'status', 'updated_at'])
    return invoice


@transaction.atomic
def record_refund(payment, amount, reason, requested_by):
    from .models import Refund, RefundStatus
    if payment.status != PaymentStatus.SUCCESSFUL:
        raise ValueError('Only successful payments can be refunded.')
    refund = Refund.objects.create(
        payment=payment,
        amount=amount,
        reason=reason,
        requested_by=requested_by,
        status=RefundStatus.REQUESTED,
    )
    return refund
