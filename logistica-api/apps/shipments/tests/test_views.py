"""
Tests de la API de Shipments: CRUD, autenticación, filtros.
"""
import datetime
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from model_bakery import baker

from apps.shipments.models import Shipment
from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route


BASE_URL = '/api/v1/shipments/'


def make_shipment(customer, warehouse, **kwargs):
    """Crea un Shipment con los campos mínimos requeridos."""
    return Shipment.objects.create(
        customer=customer,
        origin_warehouse=warehouse,
        destination_address='Calle 123 #45',
        destination_city='Bogota',
        **kwargs,
    )


class ShipmentListCreateTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.customer = baker.make(Customer, email='c1@test.com', is_active=True)
        self.warehouse = baker.make(Warehouse, capacity_m3='500.00', is_active=True)
        self.shipment = make_shipment(self.customer, self.warehouse)

    # --- Happy path ---

    def test_list_returns_200(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_contains_created_shipment(self):
        response = self.client.get(BASE_URL)
        results = response.data.get('results', response.data)
        tracking_numbers = [s['tracking_number'] for s in results]
        self.assertIn(self.shipment.tracking_number, tracking_numbers)

    def test_create_valid_shipment_returns_201(self):
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Carrera 10 #20',
            'destination_city': 'Medellin',
        }
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tracking_number', response.data)

    def test_create_with_optional_fields_returns_201(self):
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Av. Principal 1',
            'destination_city': 'Cali',
            'destination_country': 'Colombia',
            'notes': 'Manejar con cuidado',
            'status': 'PENDING',
            'weight_total_kg': '5.500',
            'base_cost': '20000.00',
            'calculated_cost': '25000.00',
        }
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_auto_generates_tracking_number(self):
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Cra 15 #80',
            'destination_city': 'Barranquilla',
        }
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data['tracking_number'])
        self.assertNotEqual(response.data['tracking_number'], '')

    # --- Unhappy path ---

    def test_create_missing_customer_returns_400(self):
        data = {
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Cra 1 #1',
            'destination_city': 'Bogota',
        }
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_origin_warehouse_returns_400(self):
        data = {
            'customer': self.customer.pk,
            'destination_address': 'Cra 1 #1',
            'destination_city': 'Bogota',
        }
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_destination_address_returns_400(self):
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_city': 'Bogota',
        }
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_nonexistent_customer_returns_400(self):
        data = {
            'customer': 99999,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Cra 1 #1',
            'destination_city': 'Bogota',
        }
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_nonexistent_warehouse_returns_400(self):
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': 99999,
            'destination_address': 'Cra 1 #1',
            'destination_city': 'Bogota',
        }
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge cases ---

    def test_list_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Cra 1 #1',
            'destination_city': 'Bogota',
        }
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_when_no_shipments(self):
        Shipment.objects.all().delete()
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)


class ShipmentRetrieveUpdateDeleteTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser2', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.customer = baker.make(Customer, email='c2@test.com', is_active=True)
        self.warehouse = baker.make(Warehouse, capacity_m3='500.00', is_active=True)
        self.shipment = make_shipment(self.customer, self.warehouse)

    def detail_url(self, pk):
        return f'{BASE_URL}{pk}/'

    # --- Happy path ---

    def test_retrieve_returns_200(self):
        response = self.client.get(self.detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['tracking_number'], self.shipment.tracking_number)

    def test_update_put_returns_200(self):
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Nueva Dirección 100',
            'destination_city': 'Cali',
            'destination_country': 'Colombia',
            'status': 'CONFIRMED',
        }
        response = self.client.put(self.detail_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'CONFIRMED')
        self.assertEqual(response.data['destination_city'], 'Cali')

    def test_update_patch_returns_200(self):
        data = {'status': 'IN_TRANSIT'}
        response = self.client.patch(self.detail_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'IN_TRANSIT')

    def test_delete_returns_204(self):
        response = self.client.delete(self.detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Shipment.objects.filter(pk=self.shipment.pk).exists())

    # --- Unhappy path ---

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(self.detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'X',
            'destination_city': 'X',
        }
        response = self.client.put(self.detail_url(99999), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(self.detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_invalid_fk_returns_400(self):
        data = {
            'customer': 99999,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'X',
            'destination_city': 'X',
        }
        response = self.client.put(self.detail_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge cases ---

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(self.detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ShipmentFilterTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser3', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.customer1 = baker.make(Customer, email='filter1@test.com', is_active=True)
        self.customer2 = baker.make(Customer, email='filter2@test.com', is_active=True)
        self.warehouse = baker.make(Warehouse, capacity_m3='500.00', is_active=True)
        self.s_pending = Shipment.objects.create(
            customer=self.customer1,
            origin_warehouse=self.warehouse,
            destination_address='Calle 1',
            destination_city='Bogota',
            status='PENDING',
        )
        self.s_confirmed = Shipment.objects.create(
            customer=self.customer1,
            origin_warehouse=self.warehouse,
            destination_address='Calle 2',
            destination_city='Medellin',
            status='CONFIRMED',
        )
        self.s_customer2 = Shipment.objects.create(
            customer=self.customer2,
            origin_warehouse=self.warehouse,
            destination_address='Calle 3',
            destination_city='Cali',
            status='PENDING',
        )

    def test_filter_by_status_pending(self):
        response = self.client.get(BASE_URL, {'status': 'PENDING'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        for s in results:
            self.assertEqual(s['status'], 'PENDING')

    def test_filter_by_status_confirmed(self):
        response = self.client.get(BASE_URL, {'status': 'CONFIRMED'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['status'], 'CONFIRMED')

    def test_filter_by_customer(self):
        response = self.client.get(BASE_URL, {'customer': self.customer2.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['customer'], self.customer2.pk)

    def test_filter_by_destination_city(self):
        response = self.client.get(BASE_URL, {'destination_city': 'Bogota'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        for s in results:
            self.assertEqual(s['destination_city'], 'Bogota')

    def test_filter_no_results_returns_empty_list(self):
        response = self.client.get(BASE_URL, {'status': 'RETURNED'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_filter_by_origin_warehouse(self):
        response = self.client.get(BASE_URL, {'origin_warehouse': self.warehouse.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertGreater(len(results), 0)
