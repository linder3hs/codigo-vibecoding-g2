from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Shipment, ShipmentItem
from .serializers import ShipmentSerializer, ShipmentItemSerializer
from .filters import ShipmentFilter


class ShipmentViewSet(viewsets.ModelViewSet):
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ShipmentFilter
    search_fields = ['tracking_number', 'destination_address', 'destination_city']
    ordering_fields = ['status', 'estimated_delivery_date', 'created_at', 'calculated_cost']

    def get_queryset(self):
        return Shipment.objects.all().select_related(
            'customer', 'driver', 'transport', 'route', 'origin_warehouse'
        )

    @action(detail=True, methods=['get', 'post'], url_path='items')
    def items(self, request, pk=None):
        shipment = self.get_object()

        if request.method == 'GET':
            items = ShipmentItem.objects.filter(shipment=shipment)
            serializer = ShipmentItemSerializer(items, many=True)
            return Response(serializer.data)

        serializer = ShipmentItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data['quantity']
        unit_price = serializer.validated_data['unit_price_at_time']
        serializer.save(shipment=shipment, subtotal=quantity * unit_price)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
