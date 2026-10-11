"""Notifications admin (restricted back-office use)."""

from django.contrib import admin

from .models import Notification, NotificationDelivery


class NotificationDeliveryInline(admin.TabularInline):
    model = NotificationDelivery
    extra = 0
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'recipient', 'category', 'title', 'is_read', 'created_at')
    list_filter = ('category', 'is_read')
    search_fields = ('title', 'body', 'recipient__phone_number')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [NotificationDeliveryInline]


@admin.register(NotificationDelivery)
class NotificationDeliveryAdmin(admin.ModelAdmin):
    list_display = ('id', 'notification', 'channel', 'status', 'attempts', 'last_attempt_at')
    list_filter = ('channel', 'status')
    readonly_fields = ('id', 'created_at', 'updated_at')
