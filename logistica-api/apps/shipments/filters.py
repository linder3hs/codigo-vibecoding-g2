import django_filters
from .models import Shipment


class ShipmentFilter(django_filters.FilterSet):
    class Meta:
        model = Shipment
        fields = ['status', 'customer', 'driver', 'origin_warehouse', 'destination_city']
