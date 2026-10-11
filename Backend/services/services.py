"""Services domain service functions."""

from django.db import transaction

from .models import ServiceAppointment, ServiceQuote, ServiceRequest


def create_service_request(customer, category, property=None, service_address='',
                           description='', preferred_datetime=None, customer_notes=''):
    """Create a new service request for a customer.

    Args:
        customer: The User making the request.
        category: ServiceCategory instance.
        property: Optional Property instance.
        service_address: Free-text service address.
        description: Description of the issue/service needed.
        preferred_datetime: Optional preferred date/time for service.
        customer_notes: Optional notes from the customer.

    Returns:
        The created ServiceRequest instance.
    """
    with transaction.atomic():
        return ServiceRequest.objects.create(
            customer=customer,
            category=category,
            property=property,
            service_address=service_address,
            description=description,
            preferred_datetime=preferred_datetime,
            customer_notes=customer_notes,
        )


def submit_quote(service_request, created_by, amount, quote_details='', valid_until=None):
    """Submit a quote for a service request.

    Args:
        service_request: The ServiceRequest being quoted.
        created_by: The User (staff) creating the quote.
        amount: Decimal quote amount (must be >= 0).
        quote_details: Optional details about the quote.
        valid_until: Optional date until which the quote is valid.

    Returns:
        The created ServiceQuote instance.
    """
    with transaction.atomic():
        return ServiceQuote.objects.create(
            service_request=service_request,
            created_by=created_by,
            amount=amount,
            quote_details=quote_details,
            valid_until=valid_until,
        )


def schedule_appointment(service_request, technician=None, scheduled_start=None,
                          scheduled_end=None, completion_notes=''):
    """Schedule an appointment for a service request.

    Args:
        service_request: The ServiceRequest being scheduled.
        technician: Optional User assigned as technician.
        scheduled_start: Required datetime for the appointment start.
        scheduled_end: Optional datetime for the appointment end.
        completion_notes: Optional notes.

    Returns:
        The created ServiceAppointment instance.
    """
    with transaction.atomic():
        return ServiceAppointment.objects.create(
            service_request=service_request,
            technician=technician,
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end,
            completion_notes=completion_notes,
        )
