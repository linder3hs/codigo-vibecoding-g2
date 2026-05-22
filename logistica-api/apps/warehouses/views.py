from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Warehouse
from .serializers import WarehouseSerializer
from .filters import WarehouseFilter


class WarehouseViewSet(viewsets.ModelViewSet):
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = WarehouseFilter
    search_fields = ['name', 'city', 'address']
    ordering_fields = ['name', 'capacity_m3', 'created_at']

    def get_queryset(self):
        return Warehouse.objects.filter(is_active=True)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
