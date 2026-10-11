"""Complaints domain service functions."""

from django.db import transaction
from django.utils import timezone

from .models import Complaint, ComplaintComment, ComplaintStatus


def create_complaint(complainant, tenancy, unit=None, category='', subject='',
                     description='', priority='medium'):
    """Create a new complaint.

    Args:
        complainant: The User filing the complaint.
        tenancy: The Tenancy instance the complaint is against.
        unit: Optional PropertyUnit instance.
        category: Complaint category (from ComplaintCategory choices).
        subject: Short subject line.
        description: Detailed description.
        priority: Complaint priority (from ComplaintPriority choices).

    Returns:
        The created Complaint instance.
    """
    with transaction.atomic():
        return Complaint.objects.create(
            complainant=complainant,
            tenancy=tenancy,
            unit=unit,
            category=category,
            subject=subject,
            description=description,
            priority=priority,
        )


def add_comment(complaint, author, message, is_internal=False):
    """Add a comment to a complaint.

    Args:
        complaint: The Complaint instance.
        author: The User writing the comment.
        message: Comment text.
        is_internal: Whether this is an internal staff-only comment.

    Returns:
        The created ComplaintComment instance.
    """
    with transaction.atomic():
        return ComplaintComment.objects.create(
            complaint=complaint,
            author=author,
            message=message,
            is_internal=is_internal,
        )


def transition_status(complaint, new_status, actor):
    """Transition a complaint to a new status.

    Validates the status transition against the allowed state machine.
    Sets ``resolved_at`` when the complaint is resolved.

    Args:
        complaint: The Complaint instance.
        new_status: The new status value (from ComplaintStatus choices).
        actor: The User performing the transition.

    Raises:
        ValueError: If the status transition is not allowed.
    """
    valid_transitions = {
        ComplaintStatus.OPEN: [
            ComplaintStatus.ACKNOWLEDGED,
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.RESOLVED,
            ComplaintStatus.CLOSED,
        ],
        ComplaintStatus.ACKNOWLEDGED: [
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.AWAITING_CUSTOMER,
            ComplaintStatus.RESOLVED,
            ComplaintStatus.CLOSED,
        ],
        ComplaintStatus.IN_PROGRESS: [
            ComplaintStatus.AWAITING_CUSTOMER,
            ComplaintStatus.RESOLVED,
            ComplaintStatus.CLOSED,
        ],
        ComplaintStatus.AWAITING_CUSTOMER: [
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.RESOLVED,
            ComplaintStatus.CLOSED,
        ],
        ComplaintStatus.RESOLVED: [
            ComplaintStatus.CLOSED,
            ComplaintStatus.REOPENED,
        ],
        ComplaintStatus.CLOSED: [
            ComplaintStatus.REOPENED,
        ],
        ComplaintStatus.REOPENED: [
            ComplaintStatus.ACKNOWLEDGED,
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.RESOLVED,
            ComplaintStatus.CLOSED,
        ],
    }

    current_status = complaint.status
    if new_status not in valid_transitions.get(current_status, []):
        raise ValueError(f'Cannot transition from {current_status} to {new_status}.')

    with transaction.atomic():
        complaint.status = new_status
        if new_status == ComplaintStatus.RESOLVED:
            complaint.resolved_at = timezone.now()
        complaint.save(update_fields=['status', 'resolved_at', 'updated_at'])
