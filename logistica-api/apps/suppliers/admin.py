from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_name', 'email', 'city', 'is_active']
    search_fields = ['name', 'contact_name', 'email', 'tax_id']
    list_filter = ['is_active', 'country', 'city']
