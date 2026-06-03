"""
Tests del recurso anidado ShipmentItem: /api/v1/shipments/{id}/items/
"""
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from model_bakery import baker

from apps.shipments.models import Shipment, ShipmentItem
from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.products.models import Product
from apps.suppliers.models import Supplier


def items_url(shipment_pk):
    return f'/api/v1/shipments/{shipment_pk}/items/'


class ShipmentItemListCreateTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_superuser(username='itemuser', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.customer = baker.make(Customer, email='item_c@test.com', is_active=True)
        self.warehouse = baker.make(Warehouse, capacity_m3='500.00', is_active=True)
        self.supplier = baker.make(Supplier, email='item_s@test.com', is_active=True)
        self.product = baker.make(
            Product,
            supplier=self.supplier,
            warehouse=self.warehouse,
            sku='ITEM-SKU-001',
            unit_price='150.00',
            is_active=True,
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 99 #10',
            destination_city='Bogota',
        )

    # --- Happy path ---

    def test_list_items_returns_200(self):
        response = self.client.get(items_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_items_empty_initially(self):
        response = self.client.get(items_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_list_items_shows_existing_items(self):
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price_at_time='150.00',
            subtotal='300.00',
        )
        response = self.client.get(items_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_item_valid_returns_201(self):
        data = {
            'product': self.product.pk,
            'quantity': 3,
            'unit_price_at_time': '150.00',
        }
        response = self.client.post(items_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['quantity'], 3)

    def test_create_item_subtotal_is_calculated(self):
        data = {
            'product': self.product.pk,
            'quantity': 4,
            'unit_price_at_time': '150.00',
        }
        response = self.client.post(items_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data['subtotal']), 600.00)

    def test_create_item_shipment_is_set_automatically(self):
        data = {
            'product': self.product.pk,
            'quantity': 1,
            'unit_price_at_time': '150.00',
        }
        response = self.client.post(items_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['shipment'], self.shipment.pk)

    def test_create_item_persists_in_database(self):
        data = {
            'product': self.product.pk,
            'quantity': 2,
            'unit_price_at_time': '150.00',
        }
        self.client.post(items_url(self.shipment.pk), data, format='json')
        self.assertTrue(
            ShipmentItem.objects.filter(shipment=self.shipment, product=self.product).exists()
        )

    # --- Unhappy path ---

    def test_create_item_nonexistent_shipment_returns_404(self):
        data = {
            'product': self.product.pk,
            'quantity': 1,
            'unit_price_at_time': '150.00',
        }
        response = self.client.post(items_url(99999), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_items_nonexistent_shipment_returns_404(self):
        response = self.client.get(items_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_duplicate_product_in_same_shipment_returns_400(self):
        data = {
            'product': self.product.pk,
            'quantity': 1,
            'unit_price_at_time': '150.00',
        }
        self.client.post(items_url(self.shipment.pk), data, format='json')
        response = self.client.post(items_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ShipmentItem.objects.filter(shipment=self.shipment).count(), 1)

    def test_create_item_missing_product_returns_400(self):
        data = {
            'quantity': 1,
            'unit_price_at_time': '150.00',
        }
        response = self.client.post(items_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_missing_quantity_returns_400(self):
        data = {
            'product': self.product.pk,
            'unit_price_at_time': '150.00',
        }
        response = self.client.post(items_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_missing_unit_price_returns_400(self):
        data = {
            'product': self.product.pk,
            'quantity': 1,
        }
        response = self.client.post(items_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_nonexistent_product_returns_400(self):
        data = {
            'product': 99999,
            'quantity': 1,
            'unit_price_at_time': '150.00',
        }
        response = self.client.post(items_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge cases ---

    def test_list_items_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(items_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_item_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        data = {
            'product': self.product.pk,
            'quantity': 1,
            'unit_price_at_time': '150.00',
        }
        response = self.client.post(items_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_multiple_different_products_in_same_shipment(self):
        product2 = baker.make(
            Product,
            supplier=self.supplier,
            warehouse=self.warehouse,
            sku='ITEM-SKU-002',
            unit_price='200.00',
            is_active=True,
        )
        data1 = {'product': self.product.pk, 'quantity': 1, 'unit_price_at_time': '150.00'}
        data2 = {'product': product2.pk, 'quantity': 2, 'unit_price_at_time': '200.00'}
        r1 = self.client.post(items_url(self.shipment.pk), data1, format='json')
        r2 = self.client.post(items_url(self.shipment.pk), data2, format='json')
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ShipmentItem.objects.filter(shipment=self.shipment).count(), 2)

    def test_items_only_belong_to_correct_shipment(self):
        shipment2 = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 200',
            destination_city='Cali',
        )
        product2 = baker.make(
            Product,
            supplier=self.supplier,
            warehouse=self.warehouse,
            sku='ITEM-SKU-003',
            unit_price='100.00',
            is_active=True,
        )
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price_at_time='150.00',
            subtotal='150.00',
        )
        ShipmentItem.objects.create(
            shipment=shipment2,
            product=product2,
            quantity=1,
            unit_price_at_time='100.00',
            subtotal='100.00',
        )
        # Listar ítems del primer envío — solo debe ver 1
        response = self.client.get(items_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
