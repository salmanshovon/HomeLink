"""Commissions serializers.

An agreement records agreed commission terms only — it is never treated as
proof of payment. ``created_by`` is always derived from the request user and
can never be supplied by a client.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    CalculationType,
    CommissionAgreement,
    CommissionLedger,
    CommissionObligation,
    PayerType,
)

User = get_user_model()


class CommissionAgreementSerializer(serializers.ModelSerializer):
    """Serializer for creating and listing commission agreements."""

    # Only used when ``payer_type`` is ``other``; ignored otherwise.
    payer = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
        help_text='Required only when payer_type is "other".',
    )
    obligations = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CommissionAgreement
        fields = (
            'id', 'listing', 'tenancy', 'service_request',
            'payer_type', 'calculation_type', 'rate', 'amount', 'currency',
            'terms', 'status', 'effective_date',
            'payer', 'obligations', 'created_by', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')
        extra_kwargs = {
            'rate': {'required': False, 'allow_null': True},
            'amount': {'required': False, 'allow_null': True},
        }

    def get_obligations(self, obj):
        return [str(obligation.id) for obligation in obj.obligations.all()]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        calc = attrs.get('calculation_type')
        rate = attrs.get('rate')
        amount = attrs.get('amount')

        if calc == CalculationType.FIXED and amount is None:
            raise serializers.ValidationError({'amount': 'A fixed amount is required.'})
        if calc == CalculationType.PERCENTAGE and rate is None:
            raise serializers.ValidationError({'rate': 'A rate is required for percentage calculations.'})
        if calc == CalculationType.MONTHS_OF_RENT and rate is None:
            raise serializers.ValidationError({
                'rate': 'A rate (number of rent months) is required for months-of-rent calculations.'
            })
        if calc == CalculationType.CUSTOM and amount is None:
            raise serializers.ValidationError({'amount': 'An amount is required for custom calculations.'})
        if attrs.get('payer_type') == PayerType.OTHER and attrs.get('payer') is None:
            raise serializers.ValidationError({'payer': 'A payer is required when payer_type is "other".'})
        return attrs


class CommissionObligationSerializer(serializers.ModelSerializer):
    """Serializer for listing commission obligations."""

    class Meta:
        model = CommissionObligation
        fields = (
            'id', 'agreement', 'payer', 'calculation_basis', 'amount_due',
            'due_date', 'status', 'payment', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class CommissionLedgerSerializer(serializers.ModelSerializer):
    """Serializer for the commission ledger audit trail."""

    class Meta:
        model = CommissionLedger
        fields = (
            'id', 'obligation', 'entry_type', 'amount', 'reference',
            'actor', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class RecordPaymentSerializer(serializers.Serializer):
    """Payload for recording a payment against an obligation."""

    internal_tx_ref = serializers.CharField(max_length=40, trim_whitespace=True)
