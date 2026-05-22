from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'supplier', 'warehouse', 'unit_price', 'stock_quantity', 'is_active']
    search_fields = ['name', 'sku', 'category']
    list_filter = ['is_active', 'category', 'supplier', 'warehouse']
