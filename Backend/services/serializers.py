"""Services serializers."""

from rest_framework import serializers

from .models import (
    ServiceAppointment,
    ServiceCategory,
    ServiceQuote,
    ServiceRequest,
    ServiceRequestHistory,
    ServiceRequestStatus,
)


class ServiceCategorySerializer(serializers.ModelSerializer):
    """Public serializer for service categories."""

    class Meta:
        model = ServiceCategory
        fields = ('id', 'name', 'slug', 'description', 'active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class ServiceRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a service request (customer derived from request.user)."""

    class Meta:
        model = ServiceRequest
        fields = (
            'category', 'property', 'contact_name', 'contact_phone',
            'service_address', 'description', 'preferred_datetime', 'customer_notes',
        )

    def validate_category(self, value):
        if not value.active:
            raise serializers.ValidationError('This service category is not active.')
        return value

    def create(self, validated_data):
        from .services import create_service_request
        return create_service_request(
            customer=self.context['request'].user,
            **validated_data,
        )


class ServiceRequestUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a service request (status transitions, pricing, notes)."""

    class Meta:
        model = ServiceRequest
        fields = ('status', 'estimated_price', 'final_price', 'internal_notes', 'customer_notes', 'assigned_employee')

    def validate_status(self, value):
        if self.instance and value != self.instance.status:
            valid_transitions = {
                ServiceRequestStatus.SUBMITTED: [
                    ServiceRequestStatus.REVIEWING, ServiceRequestStatus.CANCELLED,
                ],
                ServiceRequestStatus.REVIEWING: [
                    ServiceRequestStatus.QUOTED, ServiceRequestStatus.CANCELLED,
                ],
                ServiceRequestStatus.QUOTED: [
                    ServiceRequestStatus.ACCEPTED, ServiceRequestStatus.CANCELLED,
                ],
                ServiceRequestStatus.ACCEPTED: [
                    ServiceRequestStatus.SCHEDULED, ServiceRequestStatus.CANCELLED,
                ],
                ServiceRequestStatus.SCHEDULED: [
                    ServiceRequestStatus.IN_PROGRESS, ServiceRequestStatus.CANCELLED,
                ],
                ServiceRequestStatus.IN_PROGRESS: [
                    ServiceRequestStatus.COMPLETED, ServiceRequestStatus.CANCELLED,
                ],
                ServiceRequestStatus.COMPLETED: [],
                ServiceRequestStatus.CANCELLED: [],
            }
            if value not in valid_transitions.get(self.instance.status, []):
                raise serializers.ValidationError(
                    f'Cannot transition from {self.instance.status} to {value}.'
                )
        return value


class ServiceRequestSerializer(serializers.ModelSerializer):
    """Full serializer for staff — includes internal notes, contact info, and history."""

    category = ServiceCategorySerializer(read_only=True)
    assigned_employee_name = serializers.CharField(source='assigned_employee.get_full_name', read_only=True)
    assigned_employee_phone = serializers.CharField(source='assigned_employee.phone_number', read_only=True)
    history = serializers.SerializerMethodField()
    quotes = serializers.SerializerMethodField()
    appointments = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequest
        fields = (
            'id', 'customer', 'category', 'property', 'contact_name', 'contact_phone',
            'service_address', 'description', 'preferred_datetime', 'assigned_employee',
            'assigned_employee_name', 'assigned_employee_phone',
            'status', 'estimated_price', 'final_price',
            'customer_notes', 'internal_notes',
            'history', 'quotes', 'appointments',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'customer', 'assigned_employee', 'status',
            'estimated_price', 'final_price', 'internal_notes',
            'created_at', 'updated_at',
        )

    def get_history(self, obj):
        history = obj.history.all()[:50]
        return ServiceRequestHistorySerializer(history, many=True).data

    def get_quotes(self, obj):
        quotes = obj.quotes.all()[:10]
        return ServiceQuoteSerializer(quotes, many=True).data

    def get_appointments(self, obj):
        appointments = obj.appointments.all()[:10]
        return ServiceAppointmentSerializer(appointments, many=True).data


class ServiceRequestCustomerSerializer(serializers.ModelSerializer):
    """Customer-facing serializer — hides internal notes."""

    category = ServiceCategorySerializer(read_only=True)
    assigned_employee_name = serializers.CharField(source='assigned_employee.get_full_name', read_only=True)
    history = serializers.SerializerMethodField()
    quotes = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequest
        fields = (
            'id', 'category', 'property', 'contact_name', 'contact_phone',
            'service_address', 'description', 'preferred_datetime',
            'assigned_employee_name', 'status', 'estimated_price', 'final_price',
            'customer_notes', 'history', 'quotes',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'assigned_employee_name', 'status',
            'estimated_price', 'final_price', 'created_at', 'updated_at',
        )

    def get_history(self, obj):
        history = obj.history.all()[:50]
        return ServiceRequestHistorySerializer(history, many=True).data

    def get_quotes(self, obj):
        quotes = obj.quotes.all()[:10]
        return ServiceQuoteSerializer(quotes, many=True).data


class ServiceRequestHistorySerializer(serializers.ModelSerializer):
    """Serializer for service request history events."""

    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)

    class Meta:
        model = ServiceRequestHistory
        fields = (
            'id', 'event_type', 'actor_name', 'from_status', 'to_status',
            'notes', 'metadata', 'created_at',
        )
        read_only_fields = fields


class ServiceQuoteSerializer(serializers.ModelSerializer):
    """Serializer for service quotes."""

    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ServiceQuote
        fields = (
            'id', 'service_request', 'amount', 'quote_details',
            'valid_until', 'created_by_name', 'accepted', 'accepted_at',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'service_request', 'created_by_name', 'accepted', 'accepted_at',
            'created_at', 'updated_at',
        )


class ServiceQuoteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a service quote."""

    class Meta:
        model = ServiceQuote
        fields = ('amount', 'quote_details', 'valid_until')

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError('Amount must be non-negative.')
        return value


class ServiceAppointmentSerializer(serializers.ModelSerializer):
    """Serializer for service appointments."""

    technician_name = serializers.CharField(source='technician.get_full_name', read_only=True)

    class Meta:
        model = ServiceAppointment
        fields = (
            'id', 'service_request', 'technician_name', 'scheduled_start',
            'scheduled_end', 'status', 'completion_notes',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'service_request', 'technician_name', 'status',
            'created_at', 'updated_at',
        )


class ServiceAppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a service appointment."""

    class Meta:
        model = ServiceAppointment
        fields = ('technician', 'scheduled_start', 'scheduled_end', 'completion_notes')
