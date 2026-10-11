"""Audit views: staff-only access to the audit log."""

from rest_framework import viewsets

from common.pagination import StandardResultsSetPagination
from common.permissions import IsStaffOrSuperuser

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsStaffOrSuperuser]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return AuditLog.objects.all()
