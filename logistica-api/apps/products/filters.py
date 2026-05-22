import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    unit_price_gte = django_filters.NumberFilter(field_name='unit_price', lookup_expr='gte')
    unit_price_lte = django_filters.NumberFilter(field_name='unit_price', lookup_expr='lte')
    stock_quantity_gte = django_filters.NumberFilter(field_name='stock_quantity', lookup_expr='gte')
    stock_quantity_lte = django_filters.NumberFilter(field_name='stock_quantity', lookup_expr='lte')

    class Meta:
        model = Product
        fields = ['supplier', 'warehouse', 'category']
