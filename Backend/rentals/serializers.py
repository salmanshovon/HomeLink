"""Rentals serializers."""

from rest_framework import serializers

from .models import (
    RentalApplication,
    Tenancy,
    TenancyEvent,
    TenancyMember,
    ViewingAppointment,
)


class ViewingAppointmentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ViewingAppointment
        fields = (
            'id', 'listing', 'unit', 'customer', 'guest_name', 'guest_phone',
            'assigned_employee', 'requested_datetime', 'confirmed_datetime',
            'status', 'status_display', 'meeting_instructions', 'feedback',
            'cancellation_reason', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'status', 'confirmed_datetime', 'created_at', 'updated_at')


class RentalApplicationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = RentalApplication
        fields = (
            'id', 'listing', 'unit', 'applicant', 'requested_move_in_date',
            'proposed_rent', 'status', 'status_display', 'notes', 'reviewed_by',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'status', 'reviewed_by', 'created_at', 'updated_at')


class TenancyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenancyMember
        fields = ('id', 'user', 'name', 'relationship', 'contact', 'status', 'created_at')
        read_only_fields = ('id', 'created_at')


class TenancyEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenancyEvent
        fields = ('id', 'event_type', 'actor', 'occurred_at', 'reason', 'details', 'created_at')


class TenancySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    members = TenancyMemberSerializer(many=True, read_only=True)
    events = TenancyEventSerializer(many=True, read_only=True)

    class Meta:
        model = Tenancy
        fields = (
            'id', 'unit', 'listing', 'tenant', 'landlord', 'start_date', 'end_date',
            'monthly_rent', 'security_deposit', 'service_charge', 'billing_due_day',
            'grace_period_days', 'agreement_file', 'agreement_reference', 'status',
            'status_display', 'move_in_notes', 'move_out_notes', 'members', 'events',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'status', 'created_at', 'updated_at')


class TenancyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenancy
        fields = (
            'unit', 'listing', 'tenant', 'start_date', 'end_date', 'monthly_rent',
            'security_deposit', 'service_charge', 'billing_due_day', 'grace_period_days',
            'agreement_reference', 'move_in_notes',
        )

    def validate_monthly_rent(self, value):
        if value <= 0:
            raise serializers.ValidationError('Monthly rent must be greater than zero.')
        return value
