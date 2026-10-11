"""Communications domain: conversations, messages, announcements."""

import uuid

from django.conf import settings
from django.db import models

from common.models import TimeStampedModel
from common.validators import validate_media

User = settings.AUTH_USER_MODEL


class ConversationType(models.TextChoices):
    LANDLORD_TENANT = 'landlord_tenant', 'Landlord–tenant'
    SUPPORT = 'support', 'Support'
    INTERNAL = 'internal', 'Internal'
    OTHER = 'other', 'Other'


class ConversationStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    ARCHIVED = 'archived', 'Archived'
    CLOSED = 'closed', 'Closed'


class Conversation(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation_type = models.CharField(max_length=20, choices=ConversationType.choices)
    tenancy = models.ForeignKey('rentals.Tenancy', null=True, blank=True, on_delete=models.SET_NULL, related_name='conversations')
    listing = models.ForeignKey('properties.PropertyListing', null=True, blank=True, on_delete=models.SET_NULL, related_name='conversations')
    subject = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='conversations_created')
    status = models.CharField(
        max_length=20, choices=ConversationStatus.choices, default=ConversationStatus.ACTIVE
    )

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'conversation:{self.id}:{self.get_conversation_type_display()}'


class ConversationParticipant(TimeStampedModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversation_participations')
    role = models.CharField(max_length=50, blank=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('conversation', 'user')

    def __str__(self):
        return f'participant:{self.conversation_id}:{self.user_id}'


class MessageType(models.TextChoices):
    TEXT = 'text', 'Text'
    SYSTEM = 'system', 'System'
    ATTACHMENT = 'attachment', 'Attachment'


class Message(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.PROTECT, related_name='messages_sent')
    body = models.TextField()
    message_type = models.CharField(max_length=20, choices=MessageType.choices, default=MessageType.TEXT)
    attachment = models.FileField(upload_to='communications/attachments/%Y/%m/', validators=[validate_media], null=True, blank=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ('created_at',)

    def __str__(self):
        return f'message:{self.conversation_id}:{self.sender_id}'


class AnnouncementStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    SCHEDULED = 'scheduled', 'Scheduled'
    SENT = 'sent', 'Sent'


class TargetingMode(models.TextChoices):
    ALL_TENANTS = 'all_tenants', 'All tenants'
    SELECTED_PROPERTIES = 'selected_properties', 'Selected properties'
    SELECTED_TENANCIES = 'selected_tenancies', 'Selected tenancies'


class Announcement(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(User, on_delete=models.PROTECT, related_name='announcements')
    title = models.CharField(max_length=255)
    body = models.TextField()
    targeting_mode = models.CharField(max_length=30, choices=TargetingMode.choices)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=AnnouncementStatus.choices, default=AnnouncementStatus.DRAFT
    )

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'announcement:{self.title}'


class RecipientStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    DELIVERED = 'delivered', 'Delivered'
    READ = 'read', 'Read'


class AnnouncementRecipient(TimeStampedModel):
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='recipients')
    tenancy = models.ForeignKey('rentals.Tenancy', null=True, blank=True, on_delete=models.CASCADE, related_name='announcements')
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='announcements_received')
    status = models.CharField(
        max_length=20, choices=RecipientStatus.choices, default=RecipientStatus.PENDING
    )
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'ann-recipient:{self.announcement_id}:{self.user_id or self.tenancy_id}'
