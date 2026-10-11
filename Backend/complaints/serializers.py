"""Complaints serializers.

Two complaint serializers are provided:
- ``ComplaintSerializer`` — tenant-facing; hides internal comments.
- ``ComplaintStaffSerializer`` — staff-facing; includes internal comments.

``is_internal=True`` comments are never serialized to non-staff users.
"""

from rest_framework import serializers

from common.permissions import IsStaffOrSuperuser

from .models import Complaint, ComplaintAttachment, ComplaintComment


class ComplaintCommentSerializer(serializers.ModelSerializer):
    """Serializer for complaint comments."""

    class Meta:
        model = ComplaintComment
        fields = ('id', 'complaint', 'author', 'message', 'is_internal', 'created_at', 'updated_at')
        read_only_fields = ('id', 'complaint', 'author', 'is_internal', 'created_at', 'updated_at')


class ComplaintCommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a complaint comment.

    ``is_internal`` may only be set to ``True`` by staff users.
    """

    class Meta:
        model = ComplaintComment
        fields = ('message', 'is_internal')

    def validate_is_internal(self, value):
        request = self.context.get('request')
        if value and not IsStaffOrSuperuser().has_permission(request, None):
            raise serializers.ValidationError('Only staff can create internal comments.')
        return value


class ComplaintAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for complaint attachments."""

    class Meta:
        model = ComplaintAttachment
        fields = ('id', 'complaint', 'file', 'uploaded_by', 'created_at', 'updated_at')
        read_only_fields = ('id', 'complaint', 'uploaded_by', 'created_at', 'updated_at')


class ComplaintCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a complaint.

    The tenancy must belong to the requesting user.
    """

    class Meta:
        model = Complaint
        fields = ('tenancy', 'unit', 'category', 'subject', 'description', 'priority')

    def validate_tenancy(self, value):
        request = self.context.get('request')
        if request and value.tenant != request.user:
            raise serializers.ValidationError(
                'You can only file complaints against your own tenancy.'
            )
        return value


class ComplaintSerializer(serializers.ModelSerializer):
    """Tenant-facing serializer — hides internal comments."""

    comments = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = (
            'id', 'complainant', 'tenancy', 'unit', 'category', 'subject',
            'description', 'priority', 'status', 'assigned_landlord',
            'assigned_employee', 'resolution_details', 'resolved_at',
            'comments', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'complainant', 'assigned_landlord', 'assigned_employee',
            'status', 'resolved_at', 'created_at', 'updated_at',
        )

    def get_comments(self, obj):
        """Return only non-internal comments for non-staff users."""
        request = self.context.get('request')
        if request and IsStaffOrSuperuser().has_permission(request, None):
            comments = obj.comments.all()
        else:
            comments = obj.comments.filter(is_internal=False)
        return ComplaintCommentSerializer(comments, many=True).data


class ComplaintStaffSerializer(serializers.ModelSerializer):
    """Staff serializer — includes internal comments."""

    comments = ComplaintCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = (
            'id', 'complainant', 'tenancy', 'unit', 'category', 'subject',
            'description', 'priority', 'status', 'assigned_landlord',
            'assigned_employee', 'resolution_details', 'resolved_at',
            'comments', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'complainant', 'assigned_landlord', 'assigned_employee',
            'status', 'resolved_at', 'created_at', 'updated_at',
        )
