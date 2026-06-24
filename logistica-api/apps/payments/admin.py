from django.contrib import admin
from .models import Payment, PaymentItem


class PaymentItemInline(admin.TabularInline):
    model = PaymentItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'unit_price', 'subtotal')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display   = ('stripe_session_id', 'amount_total', 'status', 'customer_email', 'created_at')
    list_filter    = ('status', 'currency')
    search_fields  = ('stripe_session_id', 'customer_email')
    readonly_fields = (
        'stripe_session_id', 'stripe_payment_intent', 'amount_total',
        'currency', 'customer_email', 'metadata', 'created_at', 'updated_at',
    )
    inlines = [PaymentItemInline]
