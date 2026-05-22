from django.contrib import admin
from .models import Shipment, ShipmentItem


class ShipmentItemInline(admin.TabularInline):
    model = ShipmentItem
    extra = 0


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ['tracking_number', 'customer', 'status', 'destination_city', 'calculated_cost', 'created_at']
    search_fields = ['tracking_number', 'destination_address', 'destination_city']
    list_filter = ['status', 'origin_warehouse', 'destination_city']
    inlines = [ShipmentItemInline]
