from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Route, RouteStop
from .serializers import RouteSerializer, RouteStopSerializer
from .filters import RouteFilter


class RouteViewSet(viewsets.ModelViewSet):
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = RouteFilter
    search_fields = ['name']
    ordering_fields = ['name', 'estimated_duration_hours', 'estimated_distance_km', 'created_at']

    def get_queryset(self):
        return Route.objects.filter(is_active=True).select_related('origin_warehouse')

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['get', 'post'], url_path='stops')
    def stops(self, request, pk=None):
        route = self.get_object()

        if request.method == 'GET':
            stops = RouteStop.objects.filter(route=route).order_by('stop_order')
            serializer = RouteStopSerializer(stops, many=True)
            return Response(serializer.data)

        serializer = RouteStopSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(route=route)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
