from django.contrib import admin
from .models import Route, RouteStop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    ordering = ['stop_order']


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'origin_warehouse', 'estimated_duration_hours', 'estimated_distance_km', 'is_active']
    search_fields = ['name']
    list_filter = ['is_active', 'origin_warehouse']
    inlines = [RouteStopInline]
