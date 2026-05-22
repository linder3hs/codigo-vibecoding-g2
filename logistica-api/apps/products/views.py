from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Product
from .serializers import ProductSerializer
from .filters import ProductFilter


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'sku', 'category', 'description']
    ordering_fields = ['name', 'unit_price', 'stock_quantity', 'created_at']

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related('supplier', 'warehouse')

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
