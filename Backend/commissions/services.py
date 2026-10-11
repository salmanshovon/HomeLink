"""Commissions services: multi-step agreement/obligation/payment operations."""

from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import (
    CalculationType,
    CommissionAgreement,
    CommissionLedger,
    CommissionObligation,
    LedgerEntryType,
    ObligationStatus,
    PayerType,
)


def _resolve_basis(agreement):
    """Resolve the monetary basis for percentage / months-of-rent calculations.

    Prefers the agreement's own ``amount``; falls back to the monthly rent of a
    linked listing or tenancy.
    """
    if agreement.amount is not None:
        return agreement.amount
    if agreement.listing_id:
        return agreement.listing.monthly_rent
    if agreement.tenancy_id:
        return agreement.tenancy.monthly_rent
    raise ValidationError(
        'A calculation basis is required: set amount on the agreement or link a listing/tenancy.'
    )


def compute_obligation_amount(agreement):
    """Compute the per-obligation amount from the agreement's ``calculation_type``.

    - ``fixed``:          the agreed ``amount``.
    - ``percentage``:     ``rate * basis`` where ``rate`` is a decimal fraction
      (e.g. ``0.05`` = 5%).
    - ``months_of_rent``: ``rate * basis`` where ``rate`` is the number of rent
      months (e.g. ``1.00`` = one month's rent).
    - ``custom``:         the agreed ``amount``.
    """
    calc = agreement.calculation_type

    if calc == CalculationType.FIXED:
        if agreement.amount is None:
            raise ValidationError('A fixed amount is required.')
        return agreement.amount

    if calc == CalculationType.PERCENTAGE:
        if agreement.rate is None:
            raise ValidationError('A rate is required for percentage calculations.')
        return agreement.rate * _resolve_basis(agreement)

    if calc == CalculationType.MONTHS_OF_RENT:
        if agreement.rate is None:
            raise ValidationError('A rate (number of rent months) is required.')
        return agreement.rate * _resolve_basis(agreement)

    if calc == CalculationType.CUSTOM:
        if agreement.amount is None:
            raise ValidationError('An amount is required for custom calculations.')
        return agreement.amount

    raise ValidationError(f'Unsupported calculation_type: {calc}.')


def _resolve_payers(agreement):
    """Return ``(landlord, tenant)`` payer users derived from the agreement's links."""
    landlord = None
    tenant = None

    if agreement.tenancy_id:
        landlord = agreement.tenancy.landlord
        tenant = agreement.tenancy.tenant
    elif agreement.listing_id:
        landlord = agreement.listing.property.landlord

    if agreement.service_request_id:
        service_request = agreement.service_request
        tenant = tenant or service_request.customer
        if tenant is None and service_request.requirement_id:
            tenant = service_request.requirement.tenant

    return landlord, tenant


def _describe_basis(agreement):
    """Short human-readable description stored on each obligation."""
    calc = agreement.calculation_type
    if calc == CalculationType.FIXED:
        return 'fixed'
    if calc == CalculationType.PERCENTAGE:
        return f'percentage:{agreement.rate}'
    if calc == CalculationType.MONTHS_OF_RENT:
        return f'months_of_rent:{agreement.rate}'
    if calc == CalculationType.CUSTOM:
        return 'custom'
    return ''


def create_obligations_for_agreement(agreement, other_payer=None):
    """Create the :class:`CommissionObligation` row(s) for an agreement.

    When ``payer_type`` is ``both`` two separate obligations are created — one
    for the landlord and one for the tenant — each with the computed amount.
    Otherwise a single obligation is created for the resolved payer. Payers are
    derived server-side from the agreement's tenancy/listing/service-request
    links; ``other_payer`` is only used when ``payer_type`` is ``other``.
    """
    amount = compute_obligation_amount(agreement)
    landlord, tenant = _resolve_payers(agreement)
    payer_type = agreement.payer_type

    if payer_type == PayerType.LANDLORD:
        payers = [landlord]
    elif payer_type == PayerType.TENANT:
        payers = [tenant]
    elif payer_type == PayerType.BOTH:
        payers = [landlord, tenant]
    else:  # PayerType.OTHER
        payers = [other_payer]

    payers = [payer for payer in payers if payer is not None]
    if not payers:
        raise ValidationError(
            'Unable to determine the commission payer. Link a tenancy, listing, or '
            'service request, or supply a payer when payer_type is "other".'
        )

    basis = _describe_basis(agreement)
    obligations = []
    with transaction.atomic():
        for payer in payers:
            obligations.append(CommissionObligation.objects.create(
                agreement=agreement,
                payer=payer,
                calculation_basis=basis,
                amount_due=amount,
                due_date=agreement.effective_date,
                status=ObligationStatus.PENDING,
            ))
    return obligations


def record_obligation_payment(obligation, payment, actor=None):
    """Record a commission payment: write a ledger entry and link the payment.

    Uses ``select_for_update`` to serialize concurrent payment recording and
    refuses to record a second payment against an already-paid obligation. The
    obligation status is advanced to ``paid`` or ``partially_paid`` based on the
    payment amount.
    """
    with transaction.atomic():
        obligation = CommissionObligation.objects.select_for_update().get(pk=obligation.pk)

        if obligation.payment_id is not None:
            raise ValidationError('A payment has already been recorded for this obligation.')

        ledger_entry = CommissionLedger.objects.create(
            obligation=obligation,
            entry_type=LedgerEntryType.COLLECTION,
            amount=payment.amount,
            reference=payment.internal_tx_ref or '',
            actor=actor,
        )

        obligation.payment = payment
        if payment.amount >= obligation.amount_due:
            obligation.status = ObligationStatus.PAID
        else:
            obligation.status = ObligationStatus.PARTIALLY_PAID
        obligation.save(update_fields=['payment', 'status', 'updated_at'])

        return ledger_entry
