"""Complaints admin registration."""

from django.contrib import admin

from .models import Complaint, ComplaintAttachment, ComplaintComment


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'complainant', 'tenancy', 'category', 'priority',
        'status', 'created_at',
    )
    list_filter = ('status', 'priority', 'category')
    search_fields = ('id', 'subject', 'description')


@admin.register(ComplaintAttachment)
class ComplaintAttachmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'complaint', 'uploaded_by', 'created_at')
    search_fields = ('id',)


@admin.register(ComplaintComment)
class ComplaintCommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'complaint', 'author', 'is_internal', 'created_at')
    list_filter = ('is_internal',)
    search_fields = ('id', 'message')
