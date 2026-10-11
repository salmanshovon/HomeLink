"""Billing serializers."""

from rest_framework import serializers

from .models import (
    Bill,
    Payment,
    PaymentAllocation,
    PaymentMethod,
    PaymentPurpose,
    Receipt,
    Refund,
    RentInvoice,
    RentRevision,
)


class RentInvoiceSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = RentInvoice
        fields = (
            'id', 'invoice_number', 'tenancy', 'billing_period', 'issue_date', 'due_date',
            'base_rent', 'service_charge', 'utility_charges', 'other_charges', 'discount',
            'total_amount', 'paid_amount', 'outstanding_amount', 'status', 'status_display',
            'description', 'created_by', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'invoice_number', 'total_amount', 'paid_amount', 'outstanding_amount',
            'status', 'created_by', 'created_at', 'updated_at',
        )


class BillSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Bill
        fields = (
            'id', 'tenancy', 'unit', 'category', 'billing_period', 'amount', 'issue_date',
            'due_date', 'description', 'attachment', 'allocation_type', 'status',
            'status_display', 'created_by', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'status', 'created_by', 'created_at', 'updated_at')


class PaymentAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAllocation
        fields = ('id', 'payment', 'invoice', 'amount', 'created_at')


class PaymentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    purpose_display = serializers.CharField(source='get_purpose_display', read_only=True)
    allocations = PaymentAllocationSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'payer', 'tenancy', 'invoice', 'purpose', 'purpose_display', 'amount',
            'currency', 'method', 'provider', 'provider_tx_ref', 'internal_tx_ref',
            'status', 'status_display', 'initiated_at', 'verified_at', 'verified_by',
            'allocations', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'internal_tx_ref', 'status', 'verified_at', 'verified_by',
            'initiated_at', 'created_at', 'updated_at',
        )


class PaymentCreateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    purpose = serializers.ChoiceField(choices=PaymentPurpose.choices)
    method = serializers.ChoiceField(choices=PaymentMethod.choices)
    tenancy = serializers.UUIDField(required=False)
    invoice = serializers.UUIDField(required=False)
    provider = serializers.CharField(required=False, allow_blank=True)
    idempotency_key = serializers.CharField(required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value


class VerifyPaymentSerializer(serializers.Serializer):
    provider_tx_ref = serializers.CharField(required=False, allow_blank=True)


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = (
            'id', 'payment', 'amount', 'reason', 'status', 'provider_reference',
            'requested_by', 'approved_by', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'status', 'requested_by', 'approved_by', 'created_at', 'updated_at')


class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = ('id', 'receipt_number', 'payment', 'generated_at')


class RentRevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RentRevision
        fields = (
            'id', 'tenancy', 'previous_rent', 'new_rent', 'effective_date',
            'reason', 'authorized_by', 'created_at',
        )
        read_only_fields = ('id', 'created_at')
