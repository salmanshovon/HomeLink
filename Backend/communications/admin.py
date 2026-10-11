"""Communications admin (restricted back-office use)."""

from django.contrib import admin

from .models import (
    Announcement,
    AnnouncementRecipient,
    Conversation,
    ConversationParticipant,
    Message,
)


class ConversationParticipantInline(admin.TabularInline):
    model = ConversationParticipant
    extra = 0
    readonly_fields = ('created_at', 'updated_at')


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ('created_at', 'updated_at')


class AnnouncementRecipientInline(admin.TabularInline):
    model = AnnouncementRecipient
    extra = 0
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation_type', 'subject', 'status', 'created_by', 'created_at')
    list_filter = ('conversation_type', 'status')
    search_fields = ('subject', 'created_by__phone_number')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [ConversationParticipantInline, MessageInline]


@admin.register(ConversationParticipant)
class ConversationParticipantAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'user', 'role', 'is_active', 'last_read_at')
    list_filter = ('is_active', 'role')
    search_fields = ('user__phone_number',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'sender', 'message_type', 'is_deleted', 'created_at')
    list_filter = ('message_type', 'is_deleted')
    search_fields = ('body', 'sender__phone_number')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'sender', 'targeting_mode', 'status', 'created_at')
    list_filter = ('targeting_mode', 'status')
    search_fields = ('title', 'body', 'sender__phone_number')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [AnnouncementRecipientInline]


@admin.register(AnnouncementRecipient)
class AnnouncementRecipientAdmin(admin.ModelAdmin):
    list_display = ('id', 'announcement', 'user', 'tenancy', 'status', 'delivered_at')
    list_filter = ('status',)
    search_fields = ('announcement__title', 'user__phone_number')
    readonly_fields = ('id', 'created_at', 'updated_at')
