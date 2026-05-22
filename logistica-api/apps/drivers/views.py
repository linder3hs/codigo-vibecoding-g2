from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Driver
from .serializers import DriverSerializer, DriverReadSerializer
from .filters import DriverFilter


class DriverViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = DriverFilter
    search_fields = ['license_number', 'phone', 'user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['license_expiry', 'created_at']

    def get_queryset(self):
        return Driver.objects.filter(is_active=True).select_related('user', 'transport')

    def get_serializer_class(self):
        if self.request.method in ('POST', 'PUT', 'PATCH'):
            return DriverSerializer
        return DriverReadSerializer

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
