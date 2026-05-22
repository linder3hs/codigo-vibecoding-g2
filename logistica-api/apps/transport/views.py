from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Transport
from .serializers import TransportSerializer
from .filters import TransportFilter


class TransportViewSet(viewsets.ModelViewSet):
    queryset = Transport.objects.all()
    serializer_class = TransportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TransportFilter
    search_fields = ['plate_number', 'brand', 'model']
    ordering_fields = ['brand', 'year', 'capacity_kg', 'created_at']
