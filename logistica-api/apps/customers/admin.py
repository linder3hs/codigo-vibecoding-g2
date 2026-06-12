from django.contrib import admin
from .models import Customer


# esta linea permite que Customer aparezca en el Django Admin
@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'customer_type', 'email', 'city', 'tax_id', 'is_active']
    search_fields = ['name', 'email', 'tax_id']
    list_filter = ['is_active', 'customer_type', 'country', 'city']
