"""Communications serializers.

Only non-sensitive fields are exposed. User representations are limited to
public identity fields (phone number / names) — never NID, private addresses,
or caretaker contacts.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    Announcement,
    AnnouncementRecipient,
    Conversation,
    ConversationParticipant,
    Message,
)

User = get_user_model()


class PublicUserSerializer(serializers.ModelSerializer):
    """Minimal user representation safe to expose to other participants."""

    class Meta:
        model = User
        fields = ('id', 'phone_number', 'first_name', 'last_name')
        read_only_fields = fields


class ConversationParticipantSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = ('id', 'user', 'role', 'last_read_at', 'is_active', 'created_at')
        read_only_fields = fields


class ConversationSerializer(serializers.ModelSerializer):
    participants = ConversationParticipantSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            'id', 'conversation_type', 'tenancy', 'listing', 'subject',
            'created_by', 'status', 'participants', 'last_message',
            'unread_count', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def get_last_message(self, obj):
        message = obj.messages.filter(is_deleted=False).order_by('-created_at').first()
        if message is None:
            return None
        return {
            'id': str(message.id),
            'sender_id': str(message.sender_id),
            'body': message.body,
            'message_type': message.message_type,
            'created_at': message.created_at,
        }

    def get_unread_count(self, obj):
        user = self.context['request'].user
        participant = obj.participants.filter(user=user).first()
        if participant is None or participant.last_read_at is None:
            return obj.messages.filter(is_deleted=False).count()
        return obj.messages.filter(
            is_deleted=False, created_at__gt=participant.last_read_at
        ).count()


class ConversationCreateSerializer(serializers.ModelSerializer):
    """Payload for creating a conversation. Participants are added server-side."""

    participant_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        help_text="Optional extra users to add as participants.",
    )

    class Meta:
        model = Conversation
        fields = (
            'id', 'conversation_type', 'tenancy', 'listing', 'subject',
            'participant_ids', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_participant_ids(self, value):
        if not value:
            return value
        existing = set(User.objects.filter(id__in=value).values_list('id', flat=True))
        unknown = [str(v) for v in value if v not in existing]
        if unknown:
            raise serializers.ValidationError(
                f'Unknown user id(s): {", ".join(unknown)}.'
            )
        return value


class MessageSerializer(serializers.ModelSerializer):
    sender = PublicUserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = (
            'id', 'conversation', 'sender', 'body', 'message_type',
            'attachment', 'edited_at', 'is_deleted', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'conversation', 'sender', 'edited_at', 'is_deleted',
            'created_at', 'updated_at',
        )


class AnnouncementSerializer(serializers.ModelSerializer):
    sender = PublicUserSerializer(read_only=True)
    recipient_count = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = (
            'id', 'sender', 'title', 'body', 'targeting_mode', 'scheduled_at',
            'status', 'recipient_count', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'sender', 'status', 'created_at', 'updated_at')

    def get_recipient_count(self, obj):
        return obj.recipients.count()


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    """Landlord-only payload for creating an announcement."""

    class Meta:
        model = Announcement
        fields = ('id', 'title', 'body', 'targeting_mode', 'scheduled_at')

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('A title is required.')
        return value.strip()

    def validate_body(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('A body is required.')
        return value.strip()


class AnnouncementRecipientSerializer(serializers.ModelSerializer):
    announcement = AnnouncementSerializer(read_only=True)
    tenant = PublicUserSerializer(source='user', read_only=True)
    tenancy_id = serializers.PrimaryKeyRelatedField(
        source='tenancy', read_only=True
    )

    class Meta:
        model = AnnouncementRecipient
        fields = (
            'id', 'announcement', 'tenant', 'tenancy_id', 'status',
            'delivered_at', 'read_at', 'created_at',
        )
        read_only_fields = fields
