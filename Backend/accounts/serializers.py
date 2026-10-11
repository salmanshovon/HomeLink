"""Accounts serializers."""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from common.utils import normalize_bd_phone

from .models import (
    EmployeeProfile,
    LandlordProfile,
    PhoneOTP,
    TenantProfile,
    UserAddress,
    UserRole,
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'phone_number', 'email', 'first_name', 'last_name',
            'is_phone_verified', 'is_email_verified', 'account_status',
            'roles', 'last_login', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'is_phone_verified', 'is_email_verified', 'account_status', 'last_login')

    def get_roles(self, obj):
        return obj.role_values


class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = (
            'id', 'address_type', 'label', 'division', 'district', 'city',
            'area', 'postal_code', 'address_line', 'is_primary', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class LandlordProfileSerializer(serializers.ModelSerializer):
    """Owner-facing serializer. NID is write-only and never returned."""

    class Meta:
        model = LandlordProfile
        fields = (
            'id', 'legal_name', 'display_name', 'alternate_phone', 'email',
            'nid_number', 'nid_verified', 'profile_verified', 'contact_address',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'nid_verified', 'profile_verified', 'created_at', 'updated_at')
        extra_kwargs = {'nid_number': {'write_only': True, 'required': False}}


class TenantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantProfile
        fields = (
            'id', 'full_name', 'alternate_phone', 'occupation', 'organization',
            'emergency_contact', 'preferred_contact_method', 'profile_verified',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'profile_verified', 'created_at', 'updated_at')


class EmployeeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile
        fields = (
            'id', 'employee_code', 'department', 'designation', 'supervisor',
            'service_area', 'employment_status', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class RegisterTenantSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    occupation = serializers.CharField(required=False, allow_blank=True)
    organization = serializers.CharField(required=False, allow_blank=True)
    emergency_contact = serializers.CharField(required=False, allow_blank=True)

    def validate_phone_number(self, value):
        phone = normalize_bd_phone(value)
        if not phone:
            raise serializers.ValidationError('Enter a valid Bangladesh phone number (e.g. 01XXXXXXXXX).')
        if User.objects.filter(phone_number=phone).exists():
            raise serializers.ValidationError('An account with this phone number already exists.')
        return phone


class RegisterLandlordSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    legal_name = serializers.CharField(required=False, allow_blank=True)
    display_name = serializers.CharField(required=False, allow_blank=True)
    alternate_phone = serializers.CharField(required=False, allow_blank=True)
    nid_number = serializers.CharField(required=False, allow_blank=True)

    def validate_phone_number(self, value):
        phone = normalize_bd_phone(value)
        if not phone:
            raise serializers.ValidationError('Enter a valid Bangladesh phone number (e.g. 01XXXXXXXXX).')
        if User.objects.filter(phone_number=phone).exists():
            raise serializers.ValidationError('An account with this phone number already exists.')
        return phone


class PhoneVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    code = serializers.CharField(max_length=8)

    def validate_phone_number(self, value):
        return normalize_bd_phone(value) or value


class ResendVerificationSerializer(serializers.Serializer):
    phone_number = serializers.CharField()

    def validate_phone_number(self, value):
        return normalize_bd_phone(value) or value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(required=False)


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    uid = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
