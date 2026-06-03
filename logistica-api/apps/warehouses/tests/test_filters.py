from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from model_bakery import baker
from apps.warehouses.models import Warehouse


WAREHOUSES_URL = '/api/v1/warehouses/'


class WarehouseFilterCityCountryTests(APITestCase):
    """Tests de filtros por city y country."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='filteruser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        baker.make(Warehouse, city='Bogotá', country='Colombia', is_active=True, _quantity=2)
        baker.make(Warehouse, city='Medellín', country='Colombia', is_active=True, _quantity=1)
        baker.make(Warehouse, city='Lima', country='Perú', is_active=True, _quantity=1)

    def test_filter_by_city_returns_matching(self):
        response = self.client.get(WAREHOUSES_URL, {'city': 'Bogotá'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)
        for w in results:
            self.assertEqual(w['city'], 'Bogotá')

    def test_filter_by_city_no_match_returns_empty(self):
        response = self.client.get(WAREHOUSES_URL, {'city': 'CiudadInexistente'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_filter_by_country_returns_matching(self):
        response = self.client.get(WAREHOUSES_URL, {'country': 'Perú'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['country'], 'Perú')

    def test_filter_by_country_colombia(self):
        response = self.client.get(WAREHOUSES_URL, {'country': 'Colombia'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 3)


class WarehouseFilterCapacityTests(APITestCase):
    """Tests de filtros por capacidad (capacity_m3_gte y capacity_m3_lte)."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='capfilter', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        baker.make(Warehouse, capacity_m3=100.00, is_active=True)
        baker.make(Warehouse, capacity_m3=500.00, is_active=True)
        baker.make(Warehouse, capacity_m3=1000.00, is_active=True)

    def test_filter_capacity_gte(self):
        response = self.client.get(WAREHOUSES_URL, {'capacity_m3_gte': 500})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)
        for w in results:
            self.assertGreaterEqual(float(w['capacity_m3']), 500.0)

    def test_filter_capacity_lte(self):
        response = self.client.get(WAREHOUSES_URL, {'capacity_m3_lte': 500})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)
        for w in results:
            self.assertLessEqual(float(w['capacity_m3']), 500.0)

    def test_filter_capacity_range(self):
        response = self.client.get(WAREHOUSES_URL, {'capacity_m3_gte': 200, 'capacity_m3_lte': 800})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(float(results[0]['capacity_m3']), 500.0)

    def test_filter_capacity_no_match_returns_empty(self):
        response = self.client.get(WAREHOUSES_URL, {'capacity_m3_gte': 9999})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)


class WarehouseSearchTests(APITestCase):
    """Tests del filtro de búsqueda por texto (search_fields: name, city, address)."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='searchuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        baker.make(Warehouse, name='Depósito Norte', city='Bogotá', address='Calle 100', is_active=True)
        baker.make(Warehouse, name='Almacén Sur', city='Cali', address='Carrera 5', is_active=True)
        baker.make(Warehouse, name='Bodega Central', city='Medellín', address='Avenida El Poblado', is_active=True)

    def test_search_by_name(self):
        response = self.client.get(WAREHOUSES_URL, {'search': 'Depósito'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Depósito Norte')

    def test_search_by_city(self):
        response = self.client.get(WAREHOUSES_URL, {'search': 'Medellín'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['city'], 'Medellín')

    def test_search_by_address(self):
        response = self.client.get(WAREHOUSES_URL, {'search': 'Poblado'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)

    def test_search_no_match_returns_empty(self):
        response = self.client.get(WAREHOUSES_URL, {'search': 'XYZnoexiste'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)


class WarehouseOrderingTests(APITestCase):
    """Tests del ordenamiento mediante ordering_fields."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='orderuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        baker.make(Warehouse, name='Almacén B', capacity_m3=200.00, is_active=True)
        baker.make(Warehouse, name='Almacén A', capacity_m3=500.00, is_active=True)
        baker.make(Warehouse, name='Almacén C', capacity_m3=100.00, is_active=True)

    def test_ordering_by_name_asc(self):
        response = self.client.get(WAREHOUSES_URL, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        names = [w['name'] for w in results]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_capacity_m3_desc(self):
        response = self.client.get(WAREHOUSES_URL, {'ordering': '-capacity_m3'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        capacities = [float(w['capacity_m3']) for w in results]
        self.assertEqual(capacities, sorted(capacities, reverse=True))
