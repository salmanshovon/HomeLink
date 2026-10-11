"""Audit serializers."""

from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = (
            'id', 'actor', 'action', 'entity_type', 'entity_id', 'entity_repr',
            'changes', 'ip_address', 'user_agent', 'created_at',
        )
