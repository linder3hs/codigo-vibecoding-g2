import uuid
from django.db import models
from apps.customers.models import Customer
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route
from apps.warehouses.models import Warehouse
from apps.products.models import Product


class Shipment(models.Model):
    PENDING = 'PENDING'
    CONFIRMED = 'CONFIRMED'
    IN_TRANSIT = 'IN_TRANSIT'
    DELIVERED = 'DELIVERED'
    CANCELLED = 'CANCELLED'
    RETURNED = 'RETURNED'
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (CONFIRMED, 'Confirmed'),
        (IN_TRANSIT, 'In Transit'),
        (DELIVERED, 'Delivered'),
        (CANCELLED, 'Cancelled'),
        (RETURNED, 'Returned'),
    ]

    tracking_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='shipments')
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, related_name='shipments', null=True, blank=True)
    transport = models.ForeignKey(Transport, on_delete=models.SET_NULL, related_name='shipments', null=True, blank=True)
    route = models.ForeignKey(Route, on_delete=models.SET_NULL, related_name='shipments', null=True, blank=True)
    origin_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='shipments')
    destination_address = models.CharField(max_length=500)
    destination_city = models.CharField(max_length=100)
    destination_country = models.CharField(max_length=100, default='Colombia')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateTimeField(null=True, blank=True)
    weight_total_kg = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    base_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    calculated_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            self.tracking_number = uuid.uuid4().hex[:12].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.tracking_number} — {self.status}'


class ShipmentItem(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='shipment_items')
    quantity = models.IntegerField()
    unit_price_at_time = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'shipment_items'
        ordering = ['id']
        unique_together = [('shipment', 'product')]

    def __str__(self):
        return f'{self.shipment.tracking_number} — {self.product.name} x{self.quantity}'
