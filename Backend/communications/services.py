"""Communications services.

Multi-step operations (message delivery, announcement fan-out, read-state)
live here so views stay thin and side effects are consistent.
"""

import logging

from django.db import transaction
from django.utils import timezone

from notifications.models import NotificationCategory
from notifications.services import notify
from rentals.models import Tenancy, TenancyStatus

from .models import (
    Announcement,
    AnnouncementRecipient,
    AnnouncementStatus,
    Conversation,
    ConversationParticipant,
    Message,
    MessageType,
    RecipientStatus,
)

logger = logging.getLogger(__name__)


def send_message(conversation, sender, body, *, message_type=None, attachment=None):
    """Create a message, update read state and notify other participants.

    Returns the created :class:`Message`.
    """
    with transaction.atomic():
        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            body=body,
            message_type=message_type or MessageType.TEXT,
            attachment=attachment,
        )

        conversation.participants.filter(user=sender).update(last_read_at=timezone.now())

        recipients = conversation.participants.filter(is_active=True).exclude(user=sender)
        for participant in recipients:
            notify(
                participant.user,
                NotificationCategory.SERVICE,
                'New message',
                body[:200],
                related_object=message,
            )

    return message


def send_announcement(sender, title, body, targeting_mode):
    """Create an announcement and fan it out to recipients server-side.

    ``targeting_mode`` mirrors :class:`TargetingMode`. Currently the supported
    modes are:

    - ``all_tenancies`` — every active tenancy of the sender.
    - ``selected_tenancies`` — no client-supplied tenancy ids are trusted;
      the service falls back to the sender's own active tenancies so a
      landlord can only ever target tenants of properties they own.

    Returns the created :class:`Announcement`.
    """
    with transaction.atomic():
        announcement = Announcement.objects.create(
            sender=sender,
            title=title,
            body=body,
            targeting_mode=targeting_mode,
            status=AnnouncementStatus.SENT,
        )

        tenancies = Tenancy.objects.filter(
            landlord=sender,
            status=TenancyStatus.ACTIVE,
        ).select_related('tenant')

        for tenancy in tenancies:
            AnnouncementRecipient.objects.create(
                announcement=announcement,
                tenancy=tenancy,
                user=tenancy.tenant,
                status=RecipientStatus.DELIVERED,
                delivered_at=timezone.now(),
            )
            notify(
                tenancy.tenant,
                NotificationCategory.ANNOUNCEMENT,
                title,
                body[:200],
                related_object=announcement,
            )

    return announcement


def mark_conversation_read(conversation, user):
    """Mark a conversation as read for ``user``."""
    participant = ConversationParticipant.objects.filter(
        conversation=conversation, user=user
    ).first()
    if participant is None:
        return None
    participant.last_read_at = timezone.now()
    participant.save(update_fields=['last_read_at', 'updated_at'])
    return participant
