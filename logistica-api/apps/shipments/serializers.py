from rest_framework import serializers
from .models import Shipment, ShipmentItem


class ShipmentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentItem
        fields = '__all__'
        read_only_fields = ['id', 'shipment', 'subtotal']

    def validate(self, attrs):
        view = self.context.get('view')
        if view and hasattr(view, 'kwargs') and 'pk' in view.kwargs:
            shipment_id = view.kwargs['pk']
            product = attrs.get('product')
            if product:
                qs = ShipmentItem.objects.filter(shipment_id=shipment_id, product=product)
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                if qs.exists():
                    raise serializers.ValidationError(
                        {'product': 'Este producto ya está registrado en el envío.'}
                    )
        return attrs


class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ['id', 'tracking_number', 'created_at', 'updated_at']
