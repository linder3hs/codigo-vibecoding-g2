from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from model_bakery import baker

from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ProductListCreateTests(APITestCase):
    """Tests para GET /api/v1/products/ y POST /api/v1/products/."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.supplier = baker.make(Supplier, is_active=True)
        self.warehouse = baker.make(Warehouse, is_active=True)

        self.valid_data = {
            'supplier': self.supplier.pk,
            'warehouse': self.warehouse.pk,
            'name': 'Laptop Test',
            'sku': 'LAP-TEST-001',
            'category': 'laptop',
            'weight_kg': '2.500',
            'width_cm': '35.00',
            'height_cm': '2.00',
            'depth_cm': '24.00',
            'unit_price': '3500000.00',
            'stock_quantity': 5,
        }

    # --- Happy path ---

    def test_list_returns_200(self):
        baker.make(Product, supplier=self.supplier, warehouse=self.warehouse, is_active=True)
        response = self.client.get('/api/v1/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_only_active_products(self):
        baker.make(Product, supplier=self.supplier, warehouse=self.warehouse, is_active=True)
        baker.make(Product, supplier=self.supplier, warehouse=self.warehouse, is_active=False)
        response = self.client.get('/api/v1/products/')
        results = response.data.get('results', response.data)
        for item in results:
            self.assertTrue(item['is_active'])

    def test_list_returns_paginated_response(self):
        response = self.client.get('/api/v1/products/')
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

    def test_create_valid_data_returns_201(self):
        response = self.client.post('/api/v1/products/', self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_sets_correct_fields(self):
        response = self.client.post('/api/v1/products/', self.valid_data, format='json')
        self.assertEqual(response.data['name'], 'Laptop Test')
        self.assertEqual(response.data['sku'], 'LAP-TEST-001')
        self.assertEqual(response.data['category'], 'laptop')

    def test_create_product_is_active_by_default(self):
        response = self.client.post('/api/v1/products/', self.valid_data, format='json')
        self.assertTrue(response.data['is_active'])

    def test_create_without_description_returns_201(self):
        """description es nullable — debe crearse sin ese campo."""
        data = dict(self.valid_data)
        data.pop('description', None)
        response = self.client.post('/api/v1/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # --- Unhappy path ---

    def test_create_missing_name_returns_400(self):
        data = dict(self.valid_data)
        data.pop('name')
        response = self.client.post('/api/v1/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_sku_returns_400(self):
        data = dict(self.valid_data)
        data.pop('sku')
        response = self.client.post('/api/v1/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_category_returns_400(self):
        data = dict(self.valid_data)
        data.pop('category')
        response = self.client.post('/api/v1/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_weight_kg_returns_400(self):
        data = dict(self.valid_data)
        data.pop('weight_kg')
        response = self.client.post('/api/v1/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_unit_price_returns_400(self):
        data = dict(self.valid_data)
        data.pop('unit_price')
        response = self.client.post('/api/v1/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_nonexistent_supplier_returns_400(self):
        data = dict(self.valid_data)
        data['supplier'] = 99999
        response = self.client.post('/api/v1/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_nonexistent_warehouse_returns_400(self):
        data = dict(self.valid_data)
        data['warehouse'] = 99999
        response = self.client.post('/api/v1/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_sku_returns_400(self):
        baker.make(Product, supplier=self.supplier, warehouse=self.warehouse, sku='LAP-TEST-001')
        response = self.client.post('/api/v1/products/', self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_empty_body_returns_400(self):
        response = self.client.post('/api/v1/products/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge cases: autenticación ---

    def test_list_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/products/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/v1/products/', self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProductRetrieveUpdateDestroyTests(APITestCase):
    """Tests para GET /api/v1/products/{id}/, PUT, PATCH y DELETE."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser2', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.supplier = baker.make(Supplier, is_active=True)
        self.warehouse = baker.make(Warehouse, is_active=True)
        self.product = baker.make(
            Product,
            supplier=self.supplier,
            warehouse=self.warehouse,
            sku='EXISTING-SKU-001',
            is_active=True,
        )

    def _url(self, pk=None):
        pk = pk or self.product.pk
        return f'/api/v1/products/{pk}/'

    # --- Happy path ---

    def test_retrieve_returns_200(self):
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_data(self):
        response = self.client.get(self._url())
        self.assertEqual(response.data['id'], self.product.pk)
        self.assertEqual(response.data['sku'], self.product.sku)

    def test_put_valid_data_returns_200(self):
        data = {
            'supplier': self.supplier.pk,
            'warehouse': self.warehouse.pk,
            'name': 'Laptop Actualizada',
            'sku': 'EXISTING-SKU-001',
            'category': 'laptop',
            'weight_kg': '2.500',
            'width_cm': '35.00',
            'height_cm': '2.00',
            'depth_cm': '24.00',
            'unit_price': '4000000.00',
            'stock_quantity': 8,
        }
        response = self.client.put(self._url(), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Laptop Actualizada')

    def test_patch_partial_update_returns_200(self):
        response = self.client.patch(self._url(), {'stock_quantity': 20}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['stock_quantity'], 20)

    def test_delete_returns_204(self):
        response = self.client.delete(self._url())
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_performs_soft_delete(self):
        """DELETE no borra el registro — pone is_active=False."""
        self.client.delete(self._url())
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_active)

    def test_delete_product_not_visible_in_list(self):
        """Después del soft delete el producto no aparece en el listado."""
        self.client.delete(self._url())
        response = self.client.get('/api/v1/products/')
        results = response.data.get('results', response.data)
        pks = [item['id'] for item in results]
        self.assertNotIn(self.product.pk, pks)

    def test_delete_product_still_exists_in_db(self):
        """El registro permanece en la base de datos tras el soft delete."""
        self.client.delete(self._url())
        self.assertTrue(Product.objects.filter(pk=self.product.pk).exists())

    # --- Unhappy path ---

    def test_retrieve_nonexistent_id_returns_404(self):
        response = self.client.get('/api/v1/products/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_nonexistent_supplier_returns_400(self):
        data = {
            'supplier': 99999,
            'warehouse': self.warehouse.pk,
            'name': 'Producto',
            'sku': 'SKU-X',
            'category': 'otro',
            'weight_kg': '1.000',
            'width_cm': '10.00',
            'height_cm': '10.00',
            'depth_cm': '10.00',
            'unit_price': '100.00',
        }
        response = self.client.put(self._url(), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_soft_deleted_product_returns_404(self):
        """Un producto con is_active=False no debe ser accesible por su ID."""
        self.product.is_active = False
        self.product.save()
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- Edge cases: autenticación ---

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(self._url())
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_put_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.put(self._url(), {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
