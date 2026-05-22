from django.db import models


class Supplier(models.Model):
    name = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    contact_name = models.CharField(max_length=255)
    email = models.CharField(max_length=254)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='Colombia')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
