"""Services views."""

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.pagination import StandardResultsSetPagination
from common.permissions import IsAuthenticatedAndActive, IsStaffOrSuperuser

from .models import ServiceCategory, ServiceRequest
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

    def get_queryset(self):
        user = self.request.user
        if IsStaffOrSuperuser().has_permission(self.request, self):
            return ServiceRequest.objects.all()
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
        return Response(
            ServiceAppointmentSerializer(appointment).data,
            status=status.HTTP_201_CREATED,
        )
