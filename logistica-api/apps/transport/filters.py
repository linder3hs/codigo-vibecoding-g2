import django_filters
from .models import Transport


class TransportFilter(django_filters.FilterSet):
    capacity_kg_gte = django_filters.NumberFilter(field_name='capacity_kg', lookup_expr='gte')
    capacity_kg_lte = django_filters.NumberFilter(field_name='capacity_kg', lookup_expr='lte')
    capacity_m3_gte = django_filters.NumberFilter(field_name='capacity_m3', lookup_expr='gte')
    capacity_m3_lte = django_filters.NumberFilter(field_name='capacity_m3', lookup_expr='lte')

    class Meta:
        model = Transport
        fields = ['transport_type', 'is_available']
