from rest_framework import serializers
from .models import Shipment, ShipmentItem


class ShipmentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentItem
        fields = '__all__'
        read_only_fields = ['id', 'shipment', 'subtotal']


class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ['id', 'tracking_number', 'created_at', 'updated_at']
