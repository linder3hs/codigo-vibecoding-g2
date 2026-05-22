from django.db import models
from apps.warehouses.models import Warehouse


class Route(models.Model):
    origin_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='routes')
    name = models.CharField(max_length=255)
    estimated_duration_hours = models.DecimalField(max_digits=6, decimal_places=2)
    estimated_distance_km = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'routes'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class RouteStop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    stop_order = models.IntegerField()
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    estimated_offset_hours = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        db_table = 'route_stops'
        ordering = ['stop_order']
        unique_together = [('route', 'stop_order')]

    def __str__(self):
        return f'{self.route.name} — Parada {self.stop_order}: {self.city}'
