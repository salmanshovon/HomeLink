"""Services admin registration."""

from django.contrib import admin

from .models import (
    ProductOrService,
    ServiceAppointment,
    ServiceCategory,
    ServicePurchase,
    ServiceQuote,
    ServiceRequest,
)


@admin.register(ProductOrService)
class ProductOrServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'category', 'active')
    list_filter = ('active', 'category')
    search_fields = ('name', 'slug')


@admin.register(ServicePurchase)
class ServicePurchaseAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'customer', 'product', 'amount', 'currency',
        'payment_status', 'fulfillment_status',
    )
    list_filter = ('payment_status', 'fulfillment_status', 'currency')
    search_fields = ('id',)


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'active')
    list_filter = ('active',)
    search_fields = ('name', 'slug')


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'category', 'status', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('id', 'description')


@admin.register(ServiceAppointment)
class ServiceAppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'service_request', 'technician', 'scheduled_start', 'status')
    list_filter = ('status',)
    search_fields = ('id',)


@admin.register(ServiceQuote)
class ServiceQuoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'service_request', 'amount', 'accepted', 'created_at')
    list_filter = ('accepted',)
    search_fields = ('id',)
