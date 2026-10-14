"""Services views."""

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from common.pagination import StandardResultsSetPagination
from common.permissions import IsAuthenticatedAndActive, IsStaffOrSuperuser

from .models import ServiceCategory, ServiceRequest, ServiceRequestHistory, ServiceRequestStatus
from .serializers import (
    ServiceAppointmentCreateSerializer,
    ServiceAppointmentSerializer,
    ServiceCategorySerializer,
    ServiceQuoteCreateSerializer,
    ServiceQuoteSerializer,
    ServiceRequestCreateSerializer,
    ServiceRequestCustomerSerializer,
    ServiceRequestSerializer,
    ServiceRequestUpdateSerializer,
)
from .services import create_service_request, schedule_appointment, submit_quote


class ServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only list of active service categories."""

    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return ServiceCategory.objects.filter(active=True)


class ServiceRequestViewSet(viewsets.ModelViewSet):
    """Service requests with scoped access.

    - Customers see and manage their own requests.
    - Staff see and manage all requests.
    """

    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndActive]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'contact_name', 'contact_phone', 'service_address']
    ordering_fields = ['created_at', 'updated_at', 'status', 'preferred_datetime']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if IsStaffOrSuperuser().has_permission(self.request, self):
            queryset = ServiceRequest.objects.all()
            category = self.request.query_params.get('category')
            status_param = self.request.query_params.get('status')
            assigned = self.request.query_params.get('assigned_employee')
            if category:
                queryset = queryset.filter(category_id=category)
            if status_param:
                queryset = queryset.filter(status=status_param)
            if assigned:
                queryset = queryset.filter(assigned_employee_id=assigned)
            return queryset
        return ServiceRequest.objects.filter(customer=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return ServiceRequestCreateSerializer
        if self.action == 'partial_update':
            return ServiceRequestUpdateSerializer
        if self.action in ('retrieve', 'list'):
            if IsStaffOrSuperuser().has_permission(self.request, self):
                return ServiceRequestSerializer
            return ServiceRequestCustomerSerializer
        return ServiceRequestSerializer

    def perform_create(self, serializer):
        serializer.instance = create_service_request(
            customer=self.request.user,
            **serializer.validated_data,
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        new_status = serializer.validated_data.get('status', old_status)
        old_assigned = instance.assigned_employee
        new_assigned = serializer.validated_data.get('assigned_employee', old_assigned)
        old_estimated = instance.estimated_price
        new_estimated = serializer.validated_data.get('estimated_price', old_estimated)
        old_final = instance.final_price
        new_final = serializer.validated_data.get('final_price', old_final)

        super().perform_update(serializer)

        if new_status != old_status:
            ServiceRequestHistory.objects.create(
                service_request=instance,
                event_type=ServiceRequestHistory.EventType.STATUS_CHANGE,
                actor=self.request.user,
                from_status=old_status,
                to_status=new_status,
                notes=f'Status changed from {old_status} to {new_status}.',
            )
        if new_assigned != old_assigned and new_assigned:
            ServiceRequestHistory.objects.create(
                service_request=instance,
                event_type=ServiceRequestHistory.EventType.ASSIGNED,
                actor=self.request.user,
                notes=f'Assigned to {new_assigned.get_full_name() or new_assigned.phone_number}.',
                metadata={'assigned_to': str(new_assigned.id)},
            )
        if new_estimated != old_estimated and new_estimated is not None:
            ServiceRequestHistory.objects.create(
                service_request=instance,
                event_type=ServiceRequestHistory.EventType.PRICE_UPDATED,
                actor=self.request.user,
                notes=f'Estimate updated: {old_estimated or "—"} -> {new_estimated}',
                metadata={'old_estimate': str(old_estimated) if old_estimated else None, 'new_estimate': str(new_estimated)},
            )
        if new_final != old_final and new_final is not None:
            ServiceRequestHistory.objects.create(
                service_request=instance,
                event_type=ServiceRequestHistory.EventType.PRICE_UPDATED,
                actor=self.request.user,
                notes=f'Final price updated: {old_final or "—"} -> {new_final}',
                metadata={'old_final': str(old_final) if old_final else None, 'new_final': str(new_final)},
            )

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrSuperuser])
    def quotes(self, request, pk=None):
        """Submit a quote for a service request (staff only)."""
        service_request = self.get_object()
        serializer = ServiceQuoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quote = submit_quote(
            service_request=service_request,
            created_by=request.user,
            **serializer.validated_data,
        )
        ServiceRequestHistory.objects.create(
            service_request=service_request,
            event_type=ServiceRequestHistory.EventType.QUOTE_SUBMITTED,
            actor=request.user,
            notes=f'Quote of {quote.amount} submitted.',
            metadata={'quote_id': str(quote.id), 'amount': str(quote.amount)},
        )
        if service_request.status == ServiceRequestStatus.REVIEWING:
            service_request.status = ServiceRequestStatus.QUOTED
            service_request.save(update_fields=['status', 'updated_at'])
        return Response(ServiceQuoteSerializer(quote).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrSuperuser])
    def appointments(self, request, pk=None):
        """Schedule an appointment for a service request (staff only)."""
        service_request = self.get_object()
        serializer = ServiceAppointmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = schedule_appointment(
            service_request=service_request,
            **serializer.validated_data,
        )
        ServiceRequestHistory.objects.create(
            service_request=service_request,
            event_type=ServiceRequestHistory.EventType.APPOINTMENT_SCHEDULED,
            actor=request.user,
            notes=f'Appointment scheduled for {appointment.scheduled_start}.',
            metadata={'appointment_id': str(appointment.id), 'scheduled_start': str(appointment.scheduled_start)},
        )
        return Response(
            ServiceAppointmentSerializer(appointment).data,
            status=status.HTTP_201_CREATED,
        )
