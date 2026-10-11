"""Leads admin registration."""

from django.contrib import admin

from .models import Lead, RequirementMatch, RentalRequirement, RentalServiceRequest


@admin.register(RentalRequirement)
class RentalRequirementAdmin(admin.ModelAdmin):
    list_display = ('id', 'tenant', 'entered_by', 'property_type', 'max_rent', 'status')
    list_filter = ('status', 'property_type', 'tenant_category')
    search_fields = ('id', 'additional_requirements')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('preferred_amenities',)


@admin.register(RentalServiceRequest)
class RentalServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'requirement', 'customer', 'assigned_employee', 'service_type', 'status')
    list_filter = ('service_type', 'status')
    search_fields = ('id', 'notes')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(RequirementMatch)
class RequirementMatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'requirement', 'listing', 'suggested_by', 'match_score', 'status')
    list_filter = ('status',)
    search_fields = ('id', 'rationale')
    readonly_fields = ('suggested_at', 'created_at', 'updated_at')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'phone', 'source', 'status', 'assigned_agent', 'next_follow_up')
    list_filter = ('status', 'source')
    search_fields = ('name', 'phone', 'email')
    readonly_fields = ('created_at', 'updated_at')
