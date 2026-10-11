"""Notifications domain: notifications and delivery attempts."""

import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from common.models import TimeStampedModel

User = settings.AUTH_USER_MODEL


class NotificationCategory(models.TextChoices):
    INQUIRY = 'inquiry', 'Inquiry'
    VIEWING = 'viewing', 'Viewing'
    APPLICATION = 'application', 'Application'
    PAYMENT = 'payment', 'Payment'
    INVOICE = 'invoice', 'Invoice'
    COMPLAINT = 'complaint', 'Complaint'
    ANNOUNCEMENT = 'announcement', 'Announcement'
    TENANCY = 'tenancy', 'Tenancy'
    REQUIREMENT = 'requirement', 'Requirement'
    SERVICE = 'service', 'Service'


class Notification(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    category = models.CharField(max_length=20, choices=NotificationCategory.choices)
    title = models.CharField(max_length=255)
    body = models.TextField()
    related_content_type = models.ForeignKey(ContentType, null=True, blank=True, on_delete=models.SET_NULL)
    related_object_id = models.UUIDField(null=True, blank=True)
    related_object = GenericForeignKey('related_content_type', 'related_object_id')
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)
        indexes = [models.Index(fields=['recipient', 'is_read'])]

    def __str__(self):
        return f'notification:{self.recipient_id}:{self.category}'


class DeliveryChannel(models.TextChoices):
    EMAIL = 'email', 'Email'
    SMS = 'sms', 'SMS'
    PUSH = 'push', 'Push'
    IN_APP = 'in_app', 'In-app'


class DeliveryStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    SENT = 'sent', 'Sent'
    FAILED = 'failed', 'Failed'
    RETRYING = 'retrying', 'Retrying'


class NotificationDelivery(TimeStampedModel):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='deliveries')
    channel = models.CharField(max_length=10, choices=DeliveryChannel.choices)
    status = models.CharField(
        max_length=20, choices=DeliveryStatus.choices, default=DeliveryStatus.PENDING
    )
    provider_reference = models.CharField(max_length=120, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    error_details = models.TextField(blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'delivery:{self.notification_id}:{self.channel}'
