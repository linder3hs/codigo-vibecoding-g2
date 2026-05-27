from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from model_bakery import baker

from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ProductFilterTests(APITestCase):
    """Tests para los filtros de ProductFilter y los filtros de búsqueda/ordenación."""

    def setUp(self):
        self.user = User.objects.create_user(username='filteruser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.supplier_a = baker.make(Supplier, name='Proveedor A', is_active=True)
        self.supplier_b = baker.make(Supplier, name='Proveedor B', is_active=True)
        self.warehouse_a = baker.make(Warehouse, name='Almacen A', is_active=True)
        self.warehouse_b = baker.make(Warehouse, name='Almacen B', is_active=True)

        self.product_cheap = baker.make(
            Product,
            supplier=self.supplier_a,
            warehouse=self.warehouse_a,
            name='Celular Basico',
            sku='CEL-BASIC-001',
            category='celular',
            unit_price=Decimal('500000.00'),
            stock_quantity=20,
            is_active=True,
        )
        self.product_mid = baker.make(
            Product,
            supplier=self.supplier_a,
            warehouse=self.warehouse_b,
            name='Tablet Media',
            sku='TAB-MID-001',
            category='tablet',
            unit_price=Decimal('1500000.00'),
            stock_quantity=10,
            is_active=True,
        )
        self.product_expensive = baker.make(
            Product,
            supplier=self.supplier_b,
            warehouse=self.warehouse_b,
            name='Laptop Premium',
            sku='LAP-PREM-001',
            category='laptop',
            unit_price=Decimal('5000000.00'),
            stock_quantity=3,
            is_active=True,
        )

    def _get_results(self, params):
        response = self.client.get('/api/v1/products/', params)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data.get('results', response.data)

    # --- Filtro por supplier ---

    def test_filter_by_supplier_returns_correct_products(self):
        results = self._get_results({'supplier': self.supplier_b.pk})
        pks = [item['id'] for item in results]
        self.assertIn(self.product_expensive.pk, pks)
        self.assertNotIn(self.product_cheap.pk, pks)

    # --- Filtro por warehouse ---

    def test_filter_by_warehouse_returns_correct_products(self):
        results = self._get_results({'warehouse': self.warehouse_a.pk})
        pks = [item['id'] for item in results]
        self.assertIn(self.product_cheap.pk, pks)
        self.assertNotIn(self.product_expensive.pk, pks)

    # --- Filtro por category ---

    def test_filter_by_category_laptop(self):
        results = self._get_results({'category': 'laptop'})
        pks = [item['id'] for item in results]
        self.assertIn(self.product_expensive.pk, pks)
        self.assertNotIn(self.product_cheap.pk, pks)

    def test_filter_by_category_no_results_returns_empty_list(self):
        results = self._get_results({'category': 'smartwatch'})
        self.assertEqual(len(results), 0)

    # --- Filtro unit_price_gte y unit_price_lte ---

    def test_filter_unit_price_gte(self):
        results = self._get_results({'unit_price_gte': '1500000'})
        pks = [item['id'] for item in results]
        self.assertIn(self.product_mid.pk, pks)
        self.assertIn(self.product_expensive.pk, pks)
        self.assertNotIn(self.product_cheap.pk, pks)

    def test_filter_unit_price_lte(self):
        results = self._get_results({'unit_price_lte': '1500000'})
        pks = [item['id'] for item in results]
        self.assertIn(self.product_cheap.pk, pks)
        self.assertIn(self.product_mid.pk, pks)
        self.assertNotIn(self.product_expensive.pk, pks)

    def test_filter_unit_price_range(self):
        results = self._get_results({'unit_price_gte': '1000000', 'unit_price_lte': '2000000'})
        pks = [item['id'] for item in results]
        self.assertIn(self.product_mid.pk, pks)
        self.assertNotIn(self.product_cheap.pk, pks)
        self.assertNotIn(self.product_expensive.pk, pks)

    # --- Filtro stock_quantity_gte y stock_quantity_lte ---

    def test_filter_stock_quantity_gte(self):
        results = self._get_results({'stock_quantity_gte': 10})
        pks = [item['id'] for item in results]
        self.assertIn(self.product_cheap.pk, pks)
        self.assertIn(self.product_mid.pk, pks)
        self.assertNotIn(self.product_expensive.pk, pks)

    def test_filter_stock_quantity_lte(self):
        results = self._get_results({'stock_quantity_lte': 5})
        pks = [item['id'] for item in results]
        self.assertIn(self.product_expensive.pk, pks)
        self.assertNotIn(self.product_cheap.pk, pks)

    # --- Search filter ---

    def test_search_by_name_returns_matching_products(self):
        results = self._get_results({'search': 'Celular'})
        pks = [item['id'] for item in results]
        self.assertIn(self.product_cheap.pk, pks)
        self.assertNotIn(self.product_expensive.pk, pks)

    def test_search_by_sku_returns_matching_products(self):
        results = self._get_results({'search': 'LAP-PREM'})
        pks = [item['id'] for item in results]
        self.assertIn(self.product_expensive.pk, pks)

    def test_search_no_match_returns_empty_list(self):
        results = self._get_results({'search': 'ZZZZZZ_NO_EXISTE'})
        self.assertEqual(len(results), 0)

    # --- Ordering ---

    def test_ordering_by_unit_price_asc(self):
        results = self._get_results({'ordering': 'unit_price'})
        prices = [Decimal(item['unit_price']) for item in results]
        self.assertEqual(prices, sorted(prices))

    def test_ordering_by_unit_price_desc(self):
        results = self._get_results({'ordering': '-unit_price'})
        prices = [Decimal(item['unit_price']) for item in results]
        self.assertEqual(prices, sorted(prices, reverse=True))

    def test_ordering_by_stock_quantity_asc(self):
        results = self._get_results({'ordering': 'stock_quantity'})
        quantities = [item['stock_quantity'] for item in results]
        self.assertEqual(quantities, sorted(quantities))
