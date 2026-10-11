"""Rentals admin."""

from django.contrib import admin

from .models import RentalApplication, Tenancy, TenancyEvent, TenancyMember, ViewingAppointment


class TenancyMemberInline(admin.TabularInline):
    model = TenancyMember
    extra = 0


class TenancyEventInline(admin.TabularInline):
    model = TenancyEvent
    extra = 0


@admin.register(Tenancy)
class TenancyAdmin(admin.ModelAdmin):
    list_display = ('id', 'unit', 'tenant', 'landlord', 'start_date', 'end_date', 'monthly_rent', 'status')
    list_filter = ('status',)
    search_fields = ('unit__property__reference', 'tenant__phone_number')
    inlines = [TenancyMemberInline, TenancyEventInline]


@admin.register(ViewingAppointment)
class ViewingAppointmentAdmin(admin.ModelAdmin):
    list_display = ('listing', 'customer', 'requested_datetime', 'status')
    list_filter = ('status',)


@admin.register(RentalApplication)
class RentalApplicationAdmin(admin.ModelAdmin):
    list_display = ('listing', 'applicant', 'requested_move_in_date', 'status')
    list_filter = ('status',)


@admin.register(TenancyMember)
class TenancyMemberAdmin(admin.ModelAdmin):
    list_display = ('tenancy', 'name', 'relationship', 'status')


@admin.register(TenancyEvent)
class TenancyEventAdmin(admin.ModelAdmin):
    list_display = ('tenancy', 'event_type', 'occurred_at', 'actor')
