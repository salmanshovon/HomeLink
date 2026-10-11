"""Communications views: conversations, messages, announcements."""

from django.db.models import Prefetch
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter

from common.pagination import StandardResultsSetPagination
from common.permissions import (
    CanAccessConversation,
    IsAuthenticatedAndActive,
    IsLandlord,
    IsStaffOrSuperuser,
)

from .models import (
    Announcement,
    Conversation,
    ConversationParticipant,
    Message,
    MessageType,
)
from .serializers import (
    AnnouncementCreateSerializer,
    AnnouncementSerializer,
    ConversationCreateSerializer,
    ConversationSerializer,
    MessageSerializer,
)
from .services import mark_conversation_read, send_announcement, send_message


class ConversationViewSet(viewsets.ModelViewSet):
    """Conversations the authenticated user participates in."""

    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndActive]

    def get_serializer_class(self):
        if self.action == 'create':
            return ConversationCreateSerializer
        return ConversationSerializer

    def get_queryset(self):
        return (
            Conversation.objects.filter(participants__user=self.request.user)
            .prefetch_related(
                Prefetch(
                    'participants',
                    queryset=ConversationParticipant.objects.select_related('user'),
                ),
            )
            .select_related('tenancy', 'listing')
            .distinct()
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save(created_by=request.user)

        # Creator is always a participant.
        ConversationParticipant.objects.create(
            conversation=conversation,
            user=request.user,
            role='creator',
        )

        # Add any extra participants supplied by the client.
        for user in serializer.validated_data.get('participant_ids', []):
            ConversationParticipant.objects.get_or_create(
                conversation=conversation,
                user=user,
            )

        return Response(
            ConversationSerializer(conversation, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def messages(self, request, pk=None):
        """GET lists messages; POST sends a new message to the conversation."""
        conversation = self.get_object()
        self.check_object_permissions(request, conversation)

        if request.method == 'POST':
            return self._send_message(request, conversation)
        return self._list_messages(request, conversation)

    def _list_messages(self, request, conversation):
        messages = conversation.messages.filter(is_deleted=False).order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def _send_message(self, request, conversation):
        body = request.data.get('body', '').strip()
        if not body:
            return Response(
                {'detail': 'Message body is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message_type = request.data.get('message_type', MessageType.TEXT)
        if message_type not in MessageType.values:
            message_type = MessageType.TEXT

        attachment = request.FILES.get('attachment')
        message = send_message(
            conversation=conversation,
            sender=request.user,
            body=body,
            message_type=message_type,
            attachment=attachment,
        )
        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        """Mark the conversation as read for the current user."""
        conversation = self.get_object()
        if not IsStaffOrSuperuser().has_permission(request, self):
            CanAccessConversation().has_object_permission(request, self, conversation)

        participant = mark_conversation_read(conversation, request.user)
        if participant is None:
            return Response(
                {'detail': 'You are not a participant in this conversation.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({'detail': 'Conversation marked as read.'})


class AnnouncementViewSet(viewsets.ModelViewSet):
    """Announcements: landlords create, tenants receive."""

    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndActive]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'create':
            return AnnouncementCreateSerializer
        return AnnouncementSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Announcement.objects.all()
        if IsLandlord().has_permission(self.request, self):
            return Announcement.objects.filter(sender=user)
        # Tenants see announcements that target them via a recipient row.
        return Announcement.objects.filter(recipients__user=user).distinct()

    def create(self, request, *args, **kwargs):
        if not IsLandlord().has_permission(request, self):
            return Response(
                {'detail': 'Only landlords can create announcements.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        announcement = send_announcement(
            sender=request.user,
            title=serializer.validated_data['title'],
            body=serializer.validated_data['body'],
            targeting_mode=serializer.validated_data.get(
                'targeting_mode', 'all_tenants'
            ),
        )
        return Response(
            AnnouncementSerializer(announcement, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
