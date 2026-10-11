"""Complaints views."""

from django.db import models
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from common.pagination import StandardResultsSetPagination
from common.permissions import IsAuthenticatedAndActive, IsStaffOrSuperuser
from common.storage import private_media_storage

from .models import Complaint, ComplaintAttachment
from .serializers import (
    ComplaintAttachmentSerializer,
    ComplaintCommentCreateSerializer,
    ComplaintCommentSerializer,
    ComplaintCreateSerializer,
    ComplaintSerializer,
    ComplaintStaffSerializer,
)
from .services import add_comment, create_complaint, transition_status


class ComplaintViewSet(viewsets.ModelViewSet):
    """Complaints with scoped access.

    - Tenants see their own complaints.
    - Landlords see complaints for tenancies where they are the landlord.
    - Staff see all complaints.
    """

    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndActive]

    def get_queryset(self):
        user = self.request.user
        if IsStaffOrSuperuser().has_permission(self.request, self):
            return Complaint.objects.all()
        return Complaint.objects.filter(
            models.Q(complainant=user) | models.Q(tenancy__landlord=user)
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return ComplaintCreateSerializer
        if self.action in ('retrieve', 'list'):
            if IsStaffOrSuperuser().has_permission(self.request, self):
                return ComplaintStaffSerializer
            return ComplaintSerializer
        return ComplaintSerializer

    def perform_create(self, serializer):
        serializer.instance = create_complaint(
            complainant=self.request.user,
            **serializer.validated_data,
        )

    def _is_participant(self, complaint, user):
        """Check if the user is a participant in the complaint."""
        if IsStaffOrSuperuser().has_permission(self.request, self):
            return True
        if complaint.complainant_id == user.id:
            return True
        if complaint.tenancy.landlord_id == user.id:
            return True
        return False

    @action(detail=True, methods=['post'])
    def comments(self, request, pk=None):
        """Add a comment to a complaint.

        Only participants (complainant, tenancy landlord, or staff) may comment.
        Internal comments are only creatable by staff.
        """
        complaint = self.get_object()
        if not self._is_participant(complaint, request.user):
            raise PermissionDenied('You are not a participant in this complaint.')

        serializer = ComplaintCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = add_comment(
            complaint=complaint,
            author=request.user,
            **serializer.validated_data,
        )
        return Response(
            ComplaintCommentSerializer(comment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'])
    def attachments(self, request, pk=None):
        """Upload an attachment to a complaint.

        Only the complainant or staff may upload attachments.
        Files are stored via ``private_media_storage``.
        """
        complaint = self.get_object()
        if complaint.complainant_id != request.user.id and not IsStaffOrSuperuser().has_permission(
            request, self
        ):
            raise PermissionDenied(
                'You do not have permission to upload attachments to this complaint.'
            )

        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': {'code': 'file_required', 'message': 'No file provided.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attachment = ComplaintAttachment(
            complaint=complaint,
            uploaded_by=request.user,
        )
        # Store via private media storage (outside MEDIA_ROOT).
        attachment.file.storage = private_media_storage
        attachment.file.save(file.name, file, save=False)
        attachment.save()

        return Response(
            ComplaintAttachmentSerializer(attachment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['patch'])
    def status(self, request, pk=None):
        """Transition a complaint to a new status.

        Only the landlord of the tenancy's property or staff may update status.
        """
        complaint = self.get_object()

        # Permission check: landlord of tenancy or staff.
        if not IsStaffOrSuperuser().has_permission(request, self):
            if complaint.tenancy.landlord_id != request.user.id:
                raise PermissionDenied(
                    'You do not have permission to update this complaint status.'
                )

        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {'error': {'code': 'status_required', 'message': 'Status is required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            transition_status(complaint, new_status, request.user)
        except ValueError as exc:
            return Response(
                {'error': {'code': 'invalid_transition', 'message': str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(ComplaintStaffSerializer(complaint).data)
