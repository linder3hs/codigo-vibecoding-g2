from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from model_bakery import baker
from apps.warehouses.models import Warehouse


WAREHOUSES_URL = '/api/v1/warehouses/'


def warehouse_detail_url(pk):
    return f'{WAREHOUSES_URL}{pk}/'


def make_warehouse(**kwargs):
    """Helper para crear un Warehouse activo con model_bakery."""
    defaults = {'is_active': True}
    defaults.update(kwargs)
    return baker.make(Warehouse, **defaults)


class WarehouseListTests(APITestCase):
    """Tests para GET /api/v1/warehouses/ — listado."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_returns_200(self):
        make_warehouse()
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_only_active_warehouses(self):
        make_warehouse(name='Activo 1')
        make_warehouse(name='Activo 2')
        make_warehouse(name='Inactivo', is_active=False)
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        names = [w['name'] for w in results]
        self.assertIn('Activo 1', names)
        self.assertIn('Activo 2', names)
        self.assertNotIn('Inactivo', names)

    def test_list_empty_returns_200_with_empty_results(self):
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_list_response_contains_required_fields(self):
        make_warehouse(
            name='Almacén Test',
            address='Calle 1',
            city='Bogotá',
            capacity_m3=100.00,
        )
        response = self.client.get(WAREHOUSES_URL)
        results = response.data.get('results', response.data)
        self.assertGreater(len(results), 0)
        warehouse = results[0]
        for field in ['id', 'name', 'address', 'city', 'country', 'capacity_m3', 'is_active']:
            self.assertIn(field, warehouse)

    def test_list_pagination_present(self):
        make_warehouse(_quantity=5)
        response = self.client.get(WAREHOUSES_URL)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)


class WarehouseCreateTests(APITestCase):
    """Tests para POST /api/v1/warehouses/ — creación."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.valid_payload = {
            'name': 'Nuevo Almacén',
            'address': 'Carrera 50 # 10-20',
            'city': 'Bogotá',
            'country': 'Colombia',
            'capacity_m3': '750.50',
        }

    def test_create_valid_data_returns_201(self):
        response = self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_stores_warehouse_in_db(self):
        response = self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Warehouse.objects.filter(name='Nuevo Almacén').exists())

    def test_create_returns_id_in_response(self):
        response = self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertIsNotNone(response.data['id'])

    def test_create_with_optional_coordinates(self):
        payload = dict(self.valid_payload)
        payload['latitude'] = '4.710989'
        payload['longitude'] = '-74.072092'
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['latitude'], '4.710989')

    def test_create_without_coordinates_succeeds(self):
        response = self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['latitude'])
        self.assertIsNone(response.data['longitude'])

    def test_create_default_country_colombia(self):
        payload = {
            'name': 'Almacén Sin País',
            'address': 'Calle 1',
            'city': 'Cali',
            'capacity_m3': '200.00',
        }
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['country'], 'Colombia')

    def test_create_missing_name_returns_400(self):
        payload = dict(self.valid_payload)
        del payload['name']
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_address_returns_400(self):
        payload = dict(self.valid_payload)
        del payload['address']
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_city_returns_400(self):
        payload = dict(self.valid_payload)
        del payload['city']
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_capacity_m3_returns_400(self):
        payload = dict(self.valid_payload)
        del payload['capacity_m3']
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_empty_body_returns_400(self):
        response = self.client.post(WAREHOUSES_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_is_active_defaults_to_true(self):
        response = self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_active'])


class WarehouseRetrieveTests(APITestCase):
    """Tests para GET /api/v1/warehouses/{id}/ — detalle."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse(
            name='Almacén Detalle',
            address='Av. 68 # 5-00',
            city='Bogotá',
            capacity_m3=300.00,
        )

    def test_retrieve_existing_returns_200(self):
        response = self.client.get(warehouse_detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_data(self):
        response = self.client.get(warehouse_detail_url(self.warehouse.pk))
        self.assertEqual(response.data['name'], 'Almacén Detalle')
        self.assertEqual(response.data['city'], 'Bogotá')

    def test_retrieve_nonexistent_id_returns_404(self):
        response = self.client.get(warehouse_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_invalid_id_returns_404(self):
        response = self.client.get('/api/v1/warehouses/not-a-valid-id/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_inactive_warehouse_returns_404(self):
        inactive = make_warehouse(is_active=False)
        response = self.client.get(warehouse_detail_url(inactive.pk))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(warehouse_detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class WarehouseUpdateTests(APITestCase):
    """Tests para PUT y PATCH /api/v1/warehouses/{id}/ — actualización."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse(
            name='Almacén Original',
            address='Calle 5 # 1-00',
            city='Bogotá',
            country='Colombia',
            capacity_m3=500.00,
        )

    def test_put_valid_data_returns_200(self):
        payload = {
            'name': 'Almacén Actualizado',
            'address': 'Nueva Dir 123',
            'city': 'Medellín',
            'country': 'Colombia',
            'capacity_m3': '600.00',
        }
        response = self.client.put(warehouse_detail_url(self.warehouse.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_updates_data_in_db(self):
        payload = {
            'name': 'Almacén Modificado',
            'address': 'Carrera 80',
            'city': 'Cali',
            'country': 'Colombia',
            'capacity_m3': '999.99',
        }
        self.client.put(warehouse_detail_url(self.warehouse.pk), payload, format='json')
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Almacén Modificado')
        self.assertEqual(self.warehouse.city, 'Cali')

    def test_patch_partial_update_returns_200(self):
        response = self.client.patch(
            warehouse_detail_url(self.warehouse.pk),
            {'name': 'Nombre Parcial'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_only_provided_field(self):
        self.client.patch(
            warehouse_detail_url(self.warehouse.pk),
            {'name': 'Solo Nombre'},
            format='json',
        )
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Solo Nombre')
        self.assertEqual(self.warehouse.city, 'Bogotá')

    def test_put_missing_required_field_returns_400(self):
        payload = {
            'name': 'Sin Capacidad',
            'address': 'Calle X',
            'city': 'Bogotá',
        }
        response = self.client.put(warehouse_detail_url(self.warehouse.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_nonexistent_id_returns_404(self):
        payload = {
            'name': 'X',
            'address': 'X',
            'city': 'X',
            'country': 'X',
            'capacity_m3': '1.00',
        }
        response = self.client.put(warehouse_detail_url(99999), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.put(
            warehouse_detail_url(self.warehouse.pk),
            {'name': 'X'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class WarehouseDeleteTests(APITestCase):
    """Tests para DELETE /api/v1/warehouses/{id}/ — soft delete."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse()

    def test_delete_returns_204(self):
        response = self.client.delete(warehouse_detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_performs_soft_delete(self):
        """Verificar que DELETE hace soft delete — el registro sigue en BD con is_active=False."""
        pk = self.warehouse.pk
        self.client.delete(warehouse_detail_url(pk))
        self.assertTrue(Warehouse.objects.filter(pk=pk).exists())
        self.warehouse.refresh_from_db()
        self.assertFalse(self.warehouse.is_active)

    def test_delete_hides_from_list(self):
        pk = self.warehouse.pk
        self.client.delete(warehouse_detail_url(pk))
        response = self.client.get(WAREHOUSES_URL)
        results = response.data.get('results', response.data)
        ids = [w['id'] for w in results]
        self.assertNotIn(pk, ids)

    def test_delete_nonexistent_id_returns_404(self):
        response = self.client.delete(warehouse_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(warehouse_detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deleted_warehouse_not_accessible_by_detail(self):
        pk = self.warehouse.pk
        self.client.delete(warehouse_detail_url(pk))
        response = self.client.get(warehouse_detail_url(pk))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
