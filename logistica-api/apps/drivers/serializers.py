from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Driver


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class DriverReadSerializer(serializers.ModelSerializer):
    user_full_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = '__all__'

    @extend_schema_field(serializers.CharField())
    def get_user_full_name(self, instance):
        return f'{instance.user.first_name} {instance.user.last_name}'.strip()

    @extend_schema_field(serializers.EmailField())
    def get_user_email(self, instance):
        return instance.user.email

    @extend_schema_field(serializers.CharField())
    def get_user_username(self, instance):
        return instance.user.username
