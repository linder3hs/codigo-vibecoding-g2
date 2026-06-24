from django.db import models


class Payment(models.Model):
    PENDING   = 'PENDING'
    COMPLETED = 'COMPLETED'
    FAILED    = 'FAILED'
    EXPIRED   = 'EXPIRED'
    REFUNDED  = 'REFUNDED'
    STATUS_CHOICES = [
        (PENDING,   'Pending'),
        (COMPLETED, 'Completed'),
        (FAILED,    'Failed'),
        (EXPIRED,   'Expired'),
        (REFUNDED,  'Refunded'),
    ]

    stripe_session_id     = models.CharField(max_length=200, unique=True, db_index=True)
    stripe_payment_intent = models.CharField(max_length=200, null=True, blank=True)
    amount_total          = models.DecimalField(max_digits=12, decimal_places=2)
    currency              = models.CharField(max_length=3, default='usd')
    status                = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    customer_email        = models.EmailField(null=True, blank=True)
    metadata              = models.JSONField(default=dict, blank=True)
    created_at            = models.DateTimeField(auto_now_add=True)
    updated_at            = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.stripe_session_id} — {self.status}'


class PaymentItem(models.Model):
    payment    = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='items')
    product    = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='payment_items')
    quantity   = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal   = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'payment_items'

    def __str__(self):
        return f'{self.product.name} x{self.quantity}'
