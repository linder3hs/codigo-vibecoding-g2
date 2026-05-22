from django.db import models


class Customer(models.Model):
    COMPANY = 'COMPANY'
    INDIVIDUAL = 'INDIVIDUAL'
    TYPE_CHOICES = [
        (COMPANY, 'Company'),
        (INDIVIDUAL, 'Individual'),
    ]

    name = models.CharField(max_length=255)
    customer_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=COMPANY)
    tax_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    email = models.CharField(max_length=254, unique=True)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='Colombia')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.customer_type})'
