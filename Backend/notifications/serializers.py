"""Notifications serializers."""

from rest_framework import serializers

from .models import Notification, NotificationDelivery


class NotificationDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationDelivery
        fields = (
            'id', 'channel', 'status', 'provider_reference',
            'attempts', 'last_attempt_at', 'error_details', 'created_at',
        )
        read_only_fields = fields


class NotificationSerializer(serializers.ModelSerializer):
    deliveries = NotificationDeliverySerializer(many=True, read_only=True)

    class Meta:
        model = Notification
        fields = (
            'id', 'recipient', 'category', 'title', 'body',
            'related_content_type', 'related_object_id', 'related_object',
            'is_read', 'read_at', 'deliveries', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'recipient', 'category', 'title', 'body',
            'related_content_type', 'related_object_id', 'related_object',
            'is_read', 'read_at', 'deliveries', 'created_at', 'updated_at',
        )
