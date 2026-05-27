from rest_framework import serializers
from .models import Route, RouteStop


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = '__all__'
        read_only_fields = ['id', 'route']

    def validate(self, attrs):
        request = self.context.get('request')
        view = self.context.get('view')
        if view and hasattr(view, 'kwargs') and 'pk' in view.kwargs:
            route_id = view.kwargs['pk']
            stop_order = attrs.get('stop_order')
            qs = RouteStop.objects.filter(route_id=route_id, stop_order=stop_order)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {'stop_order': 'Ya existe una parada con este orden en la ruta.'}
                )
        return attrs


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
