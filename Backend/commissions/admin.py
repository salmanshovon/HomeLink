"""Commissions admin registration."""

from django.contrib import admin

from .models import CommissionAgreement, CommissionLedger, CommissionObligation


@admin.register(CommissionAgreement)
class CommissionAgreementAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'payer_type', 'calculation_type', 'rate', 'amount',
        'currency', 'status', 'effective_date', 'created_by',
    )
    list_filter = ('payer_type', 'calculation_type', 'status', 'currency')
    search_fields = ('id', 'terms')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CommissionObligation)
class CommissionObligationAdmin(admin.ModelAdmin):
    list_display = ('id', 'agreement', 'payer', 'amount_due', 'due_date', 'status', 'payment')
    list_filter = ('status',)
    search_fields = ('id', 'calculation_basis')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CommissionLedger)
class CommissionLedgerAdmin(admin.ModelAdmin):
    list_display = ('id', 'obligation', 'entry_type', 'amount', 'reference', 'actor')
    list_filter = ('entry_type',)
    search_fields = ('reference',)
    readonly_fields = ('created_at', 'updated_at')
