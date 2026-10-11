"""Rentals services: viewings, applications, tenancy lifecycle."""

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from properties.models import ListingStatus

from .models import (
    ApplicationStatus,
    RentalApplication,
    Tenancy,
    TenancyEvent,
    TenancyEventType,
    TenancyStatus,
    ViewingAppointment,
    ViewingStatus,
)


@transaction.atomic
def confirm_viewing(viewing, actor):
    """Confirm a viewing only if the listing is still available."""
    viewing = ViewingAppointment.objects.select_for_update().get(pk=viewing.pk)
    if viewing.status != ViewingStatus.REQUESTED:
        raise ValueError('Only requested viewings can be confirmed.')
    listing = viewing.listing
    if listing.status not in (ListingStatus.PUBLISHED, ListingStatus.RESERVED):
        raise ValueError('This listing is not available for viewings.')
    viewing.status = ViewingStatus.CONFIRMED
    viewing.confirmed_datetime = timezone.now()
    viewing.save(update_fields=['status', 'confirmed_datetime', 'updated_at'])
    return viewing


@transaction.atomic
def approve_application(application, actor):
    application = RentalApplication.objects.select_for_update().get(pk=application.pk)
    if application.status != ApplicationStatus.UNDER_REVIEW:
        raise ValueError('Only applications under review can be approved.')
    application.status = ApplicationStatus.APPROVED
    application.reviewed_by = actor
    application.save(update_fields=['status', 'reviewed_by', 'updated_at'])
    return application


@transaction.atomic
def reject_application(application, actor, reason=''):
    application = RentalApplication.objects.select_for_update().get(pk=application.pk)
    if application.status not in (ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW):
        raise ValueError('This application cannot be rejected.')
    application.status = ApplicationStatus.REJECTED
    application.reviewed_by = actor
    application.save(update_fields=['status', 'reviewed_by', 'updated_at'])
    return application


def _has_overlapping_active_tenancy(unit_id, start_date, end_date, exclude_id=None):
    qs = Tenancy.objects.filter(unit_id=unit_id, status=TenancyStatus.ACTIVE)
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)
    # Overlap: existing.start <= new.end AND existing.end >= new.start (null end = open).
    if end_date:
        qs = qs.filter(start_date__lte=end_date)
    qs = qs.filter(Q(end_date__isnull=True) | Q(end_date__gte=start_date))
    return qs.exists()


@transaction.atomic
def create_tenancy(*, actor, unit, tenant, landlord, start_date, end_date=None,
                   monthly_rent, security_deposit=0, service_charge=0, billing_due_day=1,
                   grace_period_days=0, agreement_reference='', listing=None, move_in_notes=''):
    """
    Create a tenancy after validating:
      - the landlord owns/manages the unit's property,
      - the unit has no overlapping active tenancy.
    Uses select_for_update on the unit to prevent races.
    """
    from properties.models import Property, PropertyUnit

    unit = PropertyUnit.objects.select_for_update().get(pk=unit.pk)
    prop = unit.property

    # Landlord must own or be authorized to manage the property.
    if prop.landlord_id != landlord.id and prop.manager_id != landlord.id:
        raise ValueError('The landlord is not authorized to rent this property.')

    if _has_overlapping_active_tenancy(unit.id, start_date, end_date):
        raise ValueError('This unit already has an active tenancy for the selected period.')

    tenancy = Tenancy.objects.create(
        unit=unit,
        listing=listing,
        tenant=tenant,
        landlord=landlord,
        start_date=start_date,
        end_date=end_date,
        monthly_rent=monthly_rent,
        security_deposit=security_deposit,
        service_charge=service_charge,
        billing_due_day=billing_due_day,
        grace_period_days=grace_period_days,
        agreement_reference=agreement_reference,
        status=TenancyStatus.PENDING,
        move_in_notes=move_in_notes,
        created_by=actor,
    )
    TenancyEvent.objects.create(
        tenancy=tenancy,
        event_type=TenancyEventType.MOVE_IN,
        actor=actor,
        occurred_at=timezone.now(),
        reason='Tenancy created.',
    )
    return tenancy


@transaction.atomic
def activate_tenancy(tenancy, actor):
    tenancy = Tenancy.objects.select_for_update().get(pk=tenancy.pk)
    if tenancy.status != TenancyStatus.PENDING:
        raise ValueError('Only pending tenancies can be activated.')
    if _has_overlapping_active_tenancy(tenancy.unit_id, tenancy.start_date, tenancy.end_date, exclude_id=tenancy.id):
        raise ValueError('This unit already has an active tenancy for the selected period.')
    tenancy.status = TenancyStatus.ACTIVE
    tenancy.save(update_fields=['status', 'updated_at'])
    TenancyEvent.objects.create(
        tenancy=tenancy, event_type=TenancyEventType.MOVE_IN, actor=actor,
        occurred_at=timezone.now(), reason='Tenancy activated.',
    )
    return tenancy


@transaction.atomic
def terminate_tenancy(tenancy, actor, reason=''):
    tenancy = Tenancy.objects.select_for_update().get(pk=tenancy.pk)
    if tenancy.status != TenancyStatus.ACTIVE:
        raise ValueError('Only active tenancies can be terminated.')
    tenancy.status = TenancyStatus.TERMINATED
    tenancy.end_date = tenancy.end_date or timezone.now().date()
    tenancy.move_out_notes = reason or tenancy.move_out_notes
    tenancy.save(update_fields=['status', 'end_date', 'move_out_notes', 'updated_at'])
    TenancyEvent.objects.create(
        tenancy=tenancy, event_type=TenancyEventType.TERMINATION, actor=actor,
        occurred_at=timezone.now(), reason=reason,
    )
    return tenancy
