from django.db import models


class Transport(models.Model):
    TRUCK = 'TRUCK'
    VAN = 'VAN'
    MOTORCYCLE = 'MOTORCYCLE'
    CARGO_BIKE = 'CARGO_BIKE'
    TYPE_CHOICES = [
        (TRUCK, 'Truck'),
        (VAN, 'Van'),
        (MOTORCYCLE, 'Motorcycle'),
        (CARGO_BIKE, 'Cargo Bike'),
    ]

    plate_number = models.CharField(max_length=20, unique=True)
    transport_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    capacity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    capacity_m3 = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transport'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.brand} {self.model} ({self.plate_number})'
