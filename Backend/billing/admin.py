"""Billing admin."""

from django.contrib import admin

from .models import Bill, Payment, PaymentAllocation, Receipt, Refund, RentInvoice, RentRevision


class PaymentAllocationInline(admin.TabularInline):
    model = PaymentAllocation
    extra = 0


@admin.register(RentInvoice)
class RentInvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'tenancy', 'billing_period', 'total_amount', 'paid_amount', 'status')
    list_filter = ('status',)


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('tenancy', 'category', 'amount', 'due_date', 'status')
    list_filter = ('category', 'status')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('internal_tx_ref', 'payer', 'amount', 'method', 'status', 'verified_at')
    list_filter = ('status', 'method', 'purpose')
    inlines = [PaymentAllocationInline]


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'payment', 'generated_at')


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('payment', 'amount', 'status', 'requested_by')
    list_filter = ('status',)


@admin.register(RentRevision)
class RentRevisionAdmin(admin.ModelAdmin):
    list_display = ('tenancy', 'previous_rent', 'new_rent', 'effective_date')
