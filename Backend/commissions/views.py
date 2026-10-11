"""Commissions views: agreements, obligations, ledger."""

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from billing.models import Payment
from common.pagination import StandardResultsSetPagination
from common.permissions import IsAuthenticatedAndActive, IsStaffOrSuperuser

from .models import CommissionAgreement, CommissionLedger, CommissionObligation
from .serializers import (
    CommissionAgreementSerializer,
    CommissionLedgerSerializer,
    CommissionObligationSerializer,
    RecordPaymentSerializer,
)
from .services import create_obligations_for_agreement, record_obligation_payment


def _is_staff(user):
    """Staff = admin, superuser, or a user with the employee role."""
    from accounts.models import Role

    return bool(
        user.is_staff or user.is_superuser or user.roles.filter(role=Role.EMPLOYEE).exists()
    )


class CommissionAgreementViewSet(viewsets.ModelViewSet):
    """List and create commission agreements.

    Staff see all agreements. Landlords and tenants see only agreements for
    which they are the payer (i.e. have a linked obligation). Creating an
    agreement is staff-only and also creates the underlying obligation(s).
    """

    serializer_class = CommissionAgreementSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndActive]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_permissions(self):
        if self.action == 'create':
            return [IsStaffOrSuperuser()]
        return [IsAuthenticatedAndActive()]

    def get_queryset(self):
        user = self.request.user
        if _is_staff(user):
            return CommissionAgreement.objects.all()
        # Non-staff only see agreements where they are the payer.
        return CommissionAgreement.objects.filter(obligations__payer=user).distinct()

    def perform_create(self, serializer):
        with transaction.atomic():
            agreement = serializer.save(created_by=self.request.user)
            create_obligations_for_agreement(
                agreement, other_payer=serializer.validated_data.get('payer')
            )


class CommissionObligationViewSet(viewsets.ModelViewSet):
    """List commission obligations, scoped to the payer or staff."""

    serializer_class = CommissionObligationSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndActive]
    http_method_names = ['get', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if _is_staff(user):
            return CommissionObligation.objects.all()
        return CommissionObligation.objects.filter(payer=user)

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsStaffOrSuperuser],
        url_path='record-payment',
    )
    def record_payment(self, request, pk=None):
        """Record a payment against an obligation via a ``billing.Payment`` reference.

        The payment is looked up by ``internal_tx_ref`` and validated before a
        ledger entry is written and the payment linked to the obligation.
        """
        obligation = self.get_object()

        serializer = RecordPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        internal_tx_ref = serializer.validated_data['internal_tx_ref']

        payment = Payment.objects.filter(internal_tx_ref=internal_tx_ref).first()
        if payment is None:
            raise ValidationError({'internal_tx_ref': 'No payment found for this reference.'})
        if payment.amount <= 0:
            raise ValidationError({'internal_tx_ref': 'Payment amount must be positive.'})

        ledger_entry = record_obligation_payment(obligation, payment, actor=request.user)
        return Response(CommissionLedgerSerializer(ledger_entry).data, status=status.HTTP_201_CREATED)


class CommissionLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only audit trail of commission collections and adjustments."""

    serializer_class = CommissionLedgerSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndActive]

    def get_queryset(self):
        user = self.request.user
        if _is_staff(user):
            return CommissionLedger.objects.all()
        return CommissionLedger.objects.filter(obligation__payer=user).distinct()
