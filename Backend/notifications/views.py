"""Notifications views: list, mark read, mark all read."""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter

from common.pagination import StandardResultsSetPagination
from common.permissions import IsAuthenticatedAndActive

from .models import Notification
from .serializers import NotificationSerializer
from .services import mark_all_read, mark_read


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Notifications scoped to the authenticated user."""

    serializer_class = NotificationSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndActive]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        """Mark a single notification as read (recipient only)."""
        notification = self.get_object()
        try:
            mark_read(notification, request.user)
        except PermissionError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({'detail': 'Notification marked as read.'})

    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        """Mark all unread notifications as read."""
        updated = mark_all_read(request.user)
        return Response(
            {'detail': f'{updated} notification(s) marked as read.'}
        )


router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
