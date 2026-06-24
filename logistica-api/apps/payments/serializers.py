from rest_framework import serializers


class CartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity   = serializers.IntegerField(min_value=1, max_value=1000)


class CheckoutRequestSerializer(serializers.Serializer):
    items = CartItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('Cart must contain at least one item.')
        ids = [item['product_id'] for item in value]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError('Duplicate product_id entries are not allowed.')
        return value
