from django.contrib import admin
from .models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['get_full_name', 'license_number', 'license_expiry', 'transport', 'is_active']
    search_fields = ['license_number', 'user__first_name', 'user__last_name', 'user__email']
    list_filter = ['is_active', 'transport']

    @admin.display(description='Conductor')
    def get_full_name(self, obj):
        return f'{obj.user.get_full_name()} ({obj.user.username})'
