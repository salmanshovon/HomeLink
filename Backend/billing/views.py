"""Billing views: invoices, bills, payments, refunds, receipts."""

from rest_framework import decorators, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from common.pagination import StandardResultsSetPagination
from common.permissions import (
    CanManageInvoice,
    CanVerifyPayment,
    IsAuthenticatedAndActive,
    IsLandlord,
    IsStaffOrSuperuser,
)

from .models import Bill, Payment, Receipt, Refund, RentInvoice
from .serializers import (
    BillSerializer,
    PaymentCreateSerializer,
    PaymentSerializer,
    ReceiptSerializer,
    RefundSerializer,
    RentInvoiceSerializer,
    VerifyPaymentSerializer,
)
from .services import allocate_to_invoice, initiate_payment, record_refund, verify_payment


class RentInvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = RentInvoiceSerializer
    permission_classes = [IsAuthenticatedAndActive, CanManageInvoice]
    pagination_class = StandardResultsSetPagination
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        qs = RentInvoice.objects.all()
        if user.is_staff or user.is_superuser:
            return qs
        return (
            qs.filter(tenancy__landlord=user)
            | qs.filter(tenancy__tenant=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BillViewSet(viewsets.ModelViewSet):
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticatedAndActive, CanManageInvoice]
    pagination_class = StandardResultsSetPagination
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        qs = Bill.objects.all()
        if user.is_staff or user.is_superuser:
            return qs
        return (
            qs.filter(tenancy__landlord=user)
            | qs.filter(tenancy__tenant=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.all()
        if user.is_staff or user.is_superuser:
            return qs
        return (
            qs.filter(payer=user)
            | qs.filter(tenancy__landlord=user)
            | qs.filter(tenancy__tenant=user)
        ).distinct().select_related('tenancy', 'invoice').prefetch_related('allocations')

    def create(self, request, *args, **kwargs):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        from .models import RentInvoice
        invoice = None
        if data.get('invoice'):
            try:
                invoice = RentInvoice.objects.get(pk=data['invoice'])
            except RentInvoice.DoesNotExist:
                return Response({'error': {'code': 'not_found', 'message': 'Invoice not found.'}}, status=status.HTTP_404_NOT_FOUND)
        payment = initiate_payment(
            payer=request.user,
            amount=data['amount'],
            purpose=data['purpose'],
            method=data['method'],
            provider=data.get('provider', ''),
            invoice=invoice,
            idempotency_key=data.get('idempotency_key'),
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=['post'], permission_classes=[CanVerifyPayment])
    def verify(self, request, pk=None):
        payment = self.get_object()
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            verify_payment(payment, request.user, serializer.validated_data.get('provider_tx_ref', ''))
        except ValueError as exc:
            return Response({'error': {'code': 'invalid', 'message': str(exc)}}, status=status.HTTP_400_BAD_REQUEST)
        return Response(PaymentSerializer(payment).data)

    @decorators.action(detail=True, methods=['post'], permission_classes=[CanVerifyPayment])
    def allocate(self, request, pk=None):
        payment = self.get_object()
        invoice_id = request.data.get('invoice')
        amount = request.data.get('amount')
        from .models import RentInvoice
        try:
            invoice = RentInvoice.objects.get(pk=invoice_id)
        except (RentInvoice.DoesNotExist, ValueError, TypeError):
            return Response({'error': {'code': 'not_found', 'message': 'Invoice not found.'}}, status=status.HTTP_404_NOT_FOUND)
        try:
            allocate_to_invoice(payment, invoice, amount)
        except ValueError as exc:
            return Response({'error': {'code': 'invalid_allocation', 'message': str(exc)}}, status=status.HTTP_400_BAD_REQUEST)
        return Response(PaymentSerializer(payment).data)


class ReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReceiptSerializer
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        qs = Receipt.objects.all()
        if user.is_staff or user.is_superuser:
            return qs
        return (
            qs.filter(payment__payer=user)
            | qs.filter(payment__tenancy__landlord=user)
            | qs.filter(payment__tenancy__tenant=user)
        ).distinct()


class RefundViewSet(viewsets.ModelViewSet):
    serializer_class = RefundSerializer
    permission_classes = [IsAuthenticatedAndActive, IsStaffOrSuperuser]
    pagination_class = StandardResultsSetPagination
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        return Refund.objects.all().select_related('payment')

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)
