"""Notifications services."""

import logging

from django.db import transaction
from django.utils import timezone

from .models import (
    DeliveryChannel,
    DeliveryStatus,
    Notification,
    NotificationDelivery,
)

logger = logging.getLogger(__name__)


def notify(user, category, title, body, *, related_object=None):
    """Create an in-app :class:`Notification` for ``user``.

    A matching in-app :class:`NotificationDelivery` record is created in the
    same transaction so delivery state is always consistent.
    """
    with transaction.atomic():
        notification = Notification.objects.create(
            recipient=user,
            category=category,
            title=title,
            body=body,
            related_content_type=(
                None if related_object is None
                else notification_content_type(related_object)
            ),
            related_object_id=None if related_object is None else related_object.pk,
        )
        NotificationDelivery.objects.create(
            notification=notification,
            channel=DeliveryChannel.IN_APP,
            status=DeliveryStatus.SENT,
        )
    return notification


def notification_content_type(obj):
    """Return the ContentType for ``obj`` (helper kept local to avoid cycles)."""
    from django.contrib.contenttypes.models import ContentType

    return ContentType.objects.get_for_model(obj)


def mark_read(notification, user):
    """Mark ``notification`` as read. Only the recipient may do this."""
    if notification.recipient_id != user.id:
        raise PermissionError('Only the recipient may mark this notification as read.')

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at', 'updated_at'])
    return notification


def mark_all_read(user):
    """Mark every unread notification for ``user`` as read."""
    return Notification.objects.filter(recipient=user, is_read=False).update(
        is_read=True, read_at=timezone.now()
    )
