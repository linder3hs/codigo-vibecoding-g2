from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase
from model_bakery import baker

from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ProductModelCreationTests(TestCase):
    """Verifica la creación correcta de instancias del modelo Product."""

    def setUp(self):
        self.supplier = baker.make(Supplier)
        self.warehouse = baker.make(Warehouse)

    def _make_product(self, **kwargs):
        defaults = dict(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Laptop Pro 15',
            sku='LAP-PRO-001',
            category='laptop',
            weight_kg=Decimal('2.500'),
            width_cm=Decimal('35.00'),
            height_cm=Decimal('2.00'),
            depth_cm=Decimal('24.00'),
            unit_price=Decimal('3500000.00'),
            stock_quantity=10,
        )
        defaults.update(kwargs)
        return Product.objects.create(**defaults)

    def test_create_product_with_minimum_required_fields(self):
        product = self._make_product()
        self.assertIsNotNone(product.pk)

    def test_str_returns_name_and_sku(self):
        product = self._make_product(name='Laptop Pro 15', sku='LAP-PRO-001')
        self.assertEqual(str(product), 'Laptop Pro 15 (LAP-PRO-001)')

    def test_db_table_is_products(self):
        self.assertEqual(Product._meta.db_table, 'products')

    def test_is_active_defaults_to_true(self):
        product = self._make_product()
        self.assertTrue(product.is_active)

    def test_stock_quantity_defaults_to_zero(self):
        product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Celular X',
            sku='CEL-X-001',
            category='celular',
            weight_kg=Decimal('0.200'),
            width_cm=Decimal('7.00'),
            height_cm=Decimal('0.80'),
            depth_cm=Decimal('15.00'),
            unit_price=Decimal('1200000.00'),
        )
        self.assertEqual(product.stock_quantity, 0)

    def test_description_is_nullable(self):
        product = self._make_product(description=None)
        self.assertIsNone(product.description)

    def test_description_accepts_value(self):
        product = self._make_product(description='Descripcion detallada del producto')
        self.assertEqual(product.description, 'Descripcion detallada del producto')

    def test_sku_unique_constraint_raises_integrity_error(self):
        self._make_product(sku='UNIQUE-SKU-01')
        with self.assertRaises(IntegrityError):
            self._make_product(sku='UNIQUE-SKU-01')

    def test_created_at_is_set_automatically(self):
        product = self._make_product()
        self.assertIsNotNone(product.created_at)

    def test_updated_at_is_set_automatically(self):
        product = self._make_product()
        self.assertIsNotNone(product.updated_at)

    def test_supplier_foreign_key_protect_on_delete(self):
        """El campo supplier usa on_delete=PROTECT."""
        field = Product._meta.get_field('supplier')
        from django.db.models import PROTECT
        self.assertEqual(field.remote_field.on_delete, PROTECT)

    def test_warehouse_foreign_key_protect_on_delete(self):
        """El campo warehouse usa on_delete=PROTECT."""
        field = Product._meta.get_field('warehouse')
        from django.db.models import PROTECT
        self.assertEqual(field.remote_field.on_delete, PROTECT)

    def test_supplier_related_name_is_products(self):
        product = self._make_product()
        self.assertIn(product, self.supplier.products.all())

    def test_warehouse_related_name_is_products(self):
        product = self._make_product()
        self.assertIn(product, self.warehouse.products.all())

    def test_weight_kg_decimal_precision(self):
        product = self._make_product(weight_kg=Decimal('1.234'))
        product.refresh_from_db()
        self.assertEqual(product.weight_kg, Decimal('1.234'))

    def test_unit_price_decimal_precision(self):
        product = self._make_product(unit_price=Decimal('999999.99'))
        product.refresh_from_db()
        self.assertEqual(product.unit_price, Decimal('999999.99'))

    def test_soft_delete_sets_is_active_false(self):
        product = self._make_product()
        product.is_active = False
        product.save()
        product.refresh_from_db()
        self.assertFalse(product.is_active)

    def test_meta_ordering_is_by_created_at_desc(self):
        ordering = Product._meta.ordering
        self.assertEqual(ordering, ['-created_at'])
