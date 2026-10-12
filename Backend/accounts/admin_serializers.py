"""Admin serializers for user management."""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import EmployeeProfile, Role, UserRole, UserAddress
from .services import RoleService

User = get_user_model()


class AdminUserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for user list views."""
    roles = serializers.SerializerMethodField()
    profile_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'phone_number', 'email', 'first_name', 'last_name',
            'account_status', 'is_phone_verified', 'is_active',
            'roles', 'profile_name', 'last_login', 'created_at',
        )
        read_only_fields = fields

    def get_roles(self, obj):
        return obj.role_values

    def get_profile_name(self, obj):
        if hasattr(obj, 'landlord_profile'):
            return obj.landlord_profile.legal_name
        if hasattr(obj, 'tenant_profile'):
            return obj.tenant_profile.full_name
        if hasattr(obj, 'employee_profile'):
            return obj.employee_profile.designation
        return ''


class AdminUserDetailSerializer(serializers.ModelSerializer):
    """Full serializer for admin user detail views."""
    roles = serializers.SerializerMethodField()
    addresses = serializers.SerializerMethodField()
    landlord_profile = serializers.SerializerMethodField()
    tenant_profile = serializers.SerializerMethodField()
    employee_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'phone_number', 'email', 'first_name', 'last_name',
            'is_phone_verified', 'is_email_verified', 'is_active',
            'account_status', 'roles', 'addresses',
            'landlord_profile', 'tenant_profile', 'employee_profile',
            'last_login', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_roles(self, obj):
        return obj.role_values

    def get_addresses(self, obj):
        from .serializers import UserAddressSerializer
        return UserAddressSerializer(obj.addresses.all(), many=True).data

    def get_landlord_profile(self, obj):
        if hasattr(obj, 'landlord_profile'):
            from .serializers import LandlordProfileSerializer
            data = LandlordProfileSerializer(obj.landlord_profile).data
            # Include NID for admin view (still write-only in response)
            data['nid_number'] = obj.landlord_profile.nid_number
            return data
        return None

    def get_tenant_profile(self, obj):
        if hasattr(obj, 'tenant_profile'):
            from .serializers import TenantProfileSerializer
            return TenantProfileSerializer(obj.tenant_profile).data
        return None

    def get_employee_profile(self, obj):
        if hasattr(obj, 'employee_profile'):
            from .serializers import EmployeeProfileSerializer
            return EmployeeProfileSerializer(obj.employee_profile).data
        return None


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin updating user fields."""
    account_status = serializers.ChoiceField(
        choices=['active', 'suspended', 'deactivated'], required=False
    )

    class Meta:
        model = User
        fields = (
            'phone_number', 'email', 'first_name', 'last_name',
            'is_active', 'account_status',
        )

    def validate_email(self, value):
        if value and User.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
            raise serializers.ValidationError('This email is already in use.')
        return value


class AdminRoleAssignSerializer(serializers.Serializer):
    """Serializer for assigning a role to a user."""
    role = serializers.ChoiceField(choices=Role.choices)

    def validate_role(self, value):
        request = self.context.get('request')
        if not request:
            return value
        # Check privileged role rules
        if value in RoleService.PRIVILEGED_ROLES:
            user = request.user
            if not user.is_staff and not user.is_superuser and not user.roles.filter(role=Role.EMPLOYEE).exists():
                raise serializers.ValidationError('You do not have permission to assign this role.')
            if value == Role.SUPERADMIN and not request.user.is_superuser:
                raise serializers.ValidationError('Only a superuser can assign the superadmin role.')
        return value


class AdminRoleRemoveSerializer(serializers.Serializer):
    """Serializer for removing a role from a user."""
    role = serializers.ChoiceField(choices=Role.choices)


class AdminCreateEmployeeSerializer(serializers.Serializer):
    """Serializer for creating employee accounts."""
    phone_number = serializers.CharField()
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    department = serializers.CharField(max_length=100)
    designation = serializers.CharField(max_length=150)
    employee_code = serializers.CharField(max_length=30)
    service_area = serializers.CharField(max_length=200, required=False, allow_blank=True)

    def validate_phone_number(self, value):
        from common.utils import normalize_bd_phone
        phone = normalize_bd_phone(value)
        if not phone:
            raise serializers.ValidationError('Enter a valid Bangladesh phone number.')
        if User.objects.filter(phone_number=phone).exists():
            raise serializers.ValidationError('An account with this phone number already exists.')
        return phone

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('This email is already in use.')
        return value

    def validate_employee_code(self, value):
        if EmployeeProfile.objects.filter(employee_code=value).exists():
            raise serializers.ValidationError('This employee code is already in use.')
        return value
