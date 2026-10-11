"""Rentals views: viewings, applications, tenancies, events."""

from rest_framework import decorators, permissions, status, viewsets
from rest_framework.response import Response

from common.pagination import StandardResultsSetPagination
from common.permissions import (
    CanAccessTenancy,
    IsAuthenticatedAndActive,
    IsStaffOrSuperuser,
)

from .models import RentalApplication, Tenancy, TenancyEvent, TenancyMember, ViewingAppointment, ViewingStatus
from .serializers import (
    RentalApplicationSerializer,
    TenancyCreateSerializer,
    TenancyEventSerializer,
    TenancyMemberSerializer,
    TenancySerializer,
    ViewingAppointmentSerializer,
)
from .services import (
    activate_tenancy,
    approve_application,
    confirm_viewing,
    create_tenancy,
    reject_application,
    terminate_tenancy,
)


class ViewingAppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = ViewingAppointmentSerializer
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        qs = ViewingAppointment.objects.all()
        if user.is_staff or user.is_superuser:
            return qs
        # Customers see their own; employees see assigned.
        return qs.filter(customer=user) | qs.filter(assigned_employee=user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @decorators.action(detail=True, methods=['post'], permission_classes=[IsStaffOrSuperuser])
    def confirm(self, request, pk=None):
        viewing = self.get_object()
        try:
            confirm_viewing(viewing, request.user)
        except ValueError as exc:
            return Response({'error': {'code': 'invalid_transition', 'message': str(exc)}}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ViewingAppointmentSerializer(viewing).data)

    @decorators.action(detail=True, methods=['post'], permission_classes=[IsStaffOrSuperuser])
    def cancel(self, request, pk=None):
        viewing = self.get_object()
        viewing.status = ViewingStatus.CANCELLED
        viewing.cancellation_reason = request.data.get('reason', '')
        viewing.save(update_fields=['status', 'cancellation_reason', 'updated_at'])
        return Response(ViewingAppointmentSerializer(viewing).data)


class RentalApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = RentalApplicationSerializer
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return RentalApplication.objects.all()
        return RentalApplication.objects.filter(applicant=user)

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)

    @decorators.action(detail=True, methods=['post'], permission_classes=[IsStaffOrSuperuser])
    def approve(self, request, pk=None):
        application = self.get_object()
        try:
            approve_application(application, request.user)
        except ValueError as exc:
            return Response({'error': {'code': 'invalid_transition', 'message': str(exc)}}, status=status.HTTP_400_BAD_REQUEST)
        return Response(RentalApplicationSerializer(application).data)

    @decorators.action(detail=True, methods=['post'], permission_classes=[IsStaffOrSuperuser])
    def reject(self, request, pk=None):
        application = self.get_object()
        try:
            reject_application(application, request.user, request.data.get('reason', ''))
        except ValueError as exc:
            return Response({'error': {'code': 'invalid_transition', 'message': str(exc)}}, status=status.HTTP_400_BAD_REQUEST)
        return Response(RentalApplicationSerializer(application).data)


class TenancyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedAndActive, CanAccessTenancy]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'create':
            return TenancyCreateSerializer
        return TenancySerializer

    def get_queryset(self):
        user = self.request.user
        qs = Tenancy.objects.all()
        if user.is_staff or user.is_superuser:
            return qs
        return (
            qs.filter(tenant=user)
            | qs.filter(landlord=user)
            | qs.filter(members__user=user)
        ).distinct()

    def perform_create(self, serializer):
        data = serializer.validated_data
        create_tenancy(
            actor=self.request.user,
            unit=data['unit'],
            tenant=data.get('tenant') or self.request.user,
            landlord=data.get('landlord') or self.request.user,
            start_date=data['start_date'],
            end_date=data.get('end_date'),
            monthly_rent=data['monthly_rent'],
            security_deposit=data.get('security_deposit', 0),
            service_charge=data.get('service_charge', 0),
            billing_due_day=data.get('billing_due_day', 1),
            grace_period_days=data.get('grace_period_days', 0),
            agreement_reference=data.get('agreement_reference', ''),
            listing=data.get('listing'),
            move_in_notes=data.get('move_in_notes', ''),
        )

    @decorators.action(detail=True, methods=['post'], permission_classes=[IsStaffOrSuperuser])
    def activate(self, request, pk=None):
        tenancy = self.get_object()
        try:
            activate_tenancy(tenancy, request.user)
        except ValueError as exc:
            return Response({'error': {'code': 'invalid_transition', 'message': str(exc)}}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TenancySerializer(tenancy).data)

    @decorators.action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        tenancy = self.get_object()
        if not (request.user.is_staff or request.user.is_superuser or tenancy.landlord_id == request.user.id):
            return Response({'error': {'code': 'permission_denied', 'message': 'Not authorized.'}}, status=status.HTTP_403_FORBIDDEN)
        terminate_tenancy(tenancy, request.user, request.data.get('reason', ''))
        return Response(TenancySerializer(tenancy).data)


class TenancyMemberViewSet(viewsets.ModelViewSet):
    serializer_class = TenancyMemberSerializer
    permission_classes = [IsAuthenticatedAndActive, CanAccessTenancy]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return TenancyMember.objects.filter(tenancy_id=self.kwargs['tenancy_pk'])

    def perform_create(self, serializer):
        tenancy = Tenancy.objects.get(pk=self.kwargs['tenancy_pk'])
        serializer.save(tenancy=tenancy)


class TenancyEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TenancyEventSerializer
    permission_classes = [IsAuthenticatedAndActive, CanAccessTenancy]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return TenancyEvent.objects.filter(tenancy_id=self.kwargs['tenancy_pk'])

