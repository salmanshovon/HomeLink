"""Accounts admin (restricted back-office use)."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    EmployeeProfile,
    LandlordProfile,
    PhoneOTP,
    TenantProfile,
    User,
    UserAddress,
    UserRole,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ('-created_at',)
    list_display = ('phone_number', 'email', 'account_status', 'is_phone_verified', 'is_active')
    list_filter = ('account_status', 'is_phone_verified', 'is_active')
    search_fields = ('phone_number', 'email', 'first_name', 'last_name')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('HomeLink', {'fields': ('phone_number', 'is_phone_verified', 'is_email_verified', 'account_status')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (None, {'fields': ('phone_number', 'email')}),
    )


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'assigned_by', 'created_at')
    list_filter = ('role',)


@admin.register(LandlordProfile)
class LandlordProfileAdmin(admin.ModelAdmin):
    list_display = ('legal_name', 'user', 'nid_verified', 'profile_verified')
    list_filter = ('nid_verified', 'profile_verified')
    search_fields = ('legal_name', 'user__phone_number')


@admin.register(TenantProfile)
class TenantProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'occupation', 'profile_verified')
    search_fields = ('full_name', 'user__phone_number')


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ('employee_code', 'user', 'department', 'designation', 'employment_status')
    list_filter = ('department', 'employment_status')


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'address_type', 'district', 'city', 'is_primary')


@admin.register(PhoneOTP)
class PhoneOTPAdmin(admin.ModelAdmin):
    list_display = ('user', 'purpose', 'expires_at', 'consumed_at')
    list_filter = ('purpose',)
