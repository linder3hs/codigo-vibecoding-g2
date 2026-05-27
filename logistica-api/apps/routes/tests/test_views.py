from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from model_bakery import baker

from apps.routes.models import Route, RouteStop
from apps.warehouses.models import Warehouse


ROUTES_LIST_URL = '/api/v1/routes/'


def route_detail_url(pk):
    return f'/api/v1/routes/{pk}/'


def route_stops_url(pk):
    return f'/api/v1/routes/{pk}/stops/'


def make_warehouse():
    return baker.make(
        Warehouse,
        is_active=True,
        capacity_m3='500.00',
        name='Almacen Test',
        address='Calle 1 # 2-3',
        city='Bogota',
    )


def make_route(warehouse, **kwargs):
    defaults = dict(
        origin_warehouse=warehouse,
        estimated_duration_hours='6.00',
        estimated_distance_km='300.00',
        is_active=True,
    )
    defaults.update(kwargs)
    return baker.make(Route, **defaults)


class RouteListCreateTests(APITestCase):
    """Tests de listado y creación de rutas."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse()

    # --- Happy path ---

    def test_list_routes_returns_200(self):
        make_route(self.warehouse)
        make_route(self.warehouse)
        response = self.client.get(ROUTES_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_routes_returns_only_active(self):
        make_route(self.warehouse)
        make_route(self.warehouse, is_active=False)
        response = self.client.get(ROUTES_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)

    def test_create_route_valid_data_returns_201(self):
        data = {
            'origin_warehouse': self.warehouse.pk,
            'name': 'Ruta Norte',
            'estimated_duration_hours': '5.50',
            'estimated_distance_km': '250.75',
        }
        response = self.client.post(ROUTES_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Ruta Norte')

    def test_create_route_persists_in_db(self):
        data = {
            'origin_warehouse': self.warehouse.pk,
            'name': 'Ruta Persistida',
            'estimated_duration_hours': '3.00',
            'estimated_distance_km': '150.00',
        }
        self.client.post(ROUTES_LIST_URL, data, format='json')
        self.assertTrue(Route.objects.filter(name='Ruta Persistida').exists())

    # --- Unhappy path ---

    def test_create_route_missing_name_returns_400(self):
        data = {
            'origin_warehouse': self.warehouse.pk,
            'estimated_duration_hours': '3.00',
            'estimated_distance_km': '150.00',
        }
        response = self.client.post(ROUTES_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_missing_origin_warehouse_returns_400(self):
        data = {
            'name': 'Ruta Sin Almacen',
            'estimated_duration_hours': '3.00',
            'estimated_distance_km': '150.00',
        }
        response = self.client.post(ROUTES_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_missing_estimated_duration_returns_400(self):
        data = {
            'origin_warehouse': self.warehouse.pk,
            'name': 'Ruta Sin Duracion',
            'estimated_distance_km': '150.00',
        }
        response = self.client.post(ROUTES_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_missing_estimated_distance_returns_400(self):
        data = {
            'origin_warehouse': self.warehouse.pk,
            'name': 'Ruta Sin Distancia',
            'estimated_duration_hours': '3.00',
        }
        response = self.client.post(ROUTES_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_nonexistent_warehouse_returns_400(self):
        data = {
            'origin_warehouse': 99999,
            'name': 'Ruta FK Invalida',
            'estimated_duration_hours': '3.00',
            'estimated_distance_km': '150.00',
        }
        response = self.client.post(ROUTES_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge cases ---

    def test_list_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(ROUTES_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        data = {
            'origin_warehouse': self.warehouse.pk,
            'name': 'Ruta Anon',
            'estimated_duration_hours': '2.00',
            'estimated_distance_km': '100.00',
        }
        response = self.client.post(ROUTES_LIST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_returns_200_with_empty_results(self):
        response = self.client.get(ROUTES_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)


class RouteRetrieveUpdateDeleteTests(APITestCase):
    """Tests de recuperación, actualización y eliminación de rutas."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser2', password='pass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse, name='Ruta Existente')

    # --- Happy path ---

    def test_retrieve_route_returns_200(self):
        response = self.client.get(route_detail_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Ruta Existente')

    def test_update_route_returns_200(self):
        data = {
            'origin_warehouse': self.warehouse.pk,
            'name': 'Ruta Actualizada',
            'estimated_duration_hours': '10.00',
            'estimated_distance_km': '500.00',
        }
        response = self.client.put(route_detail_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Ruta Actualizada')

    def test_partial_update_route_returns_200(self):
        data = {'name': 'Nombre Parcial'}
        response = self.client.patch(route_detail_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Nombre Parcial')

    def test_delete_route_returns_204(self):
        response = self.client.delete(route_detail_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_route_soft_deletes_in_db(self):
        """El DELETE no elimina físicamente — marca is_active=False."""
        self.client.delete(route_detail_url(self.route.pk))
        self.route.refresh_from_db()
        self.assertFalse(self.route.is_active)

    def test_deleted_route_not_visible_in_list(self):
        self.client.delete(route_detail_url(self.route.pk))
        response = self.client.get(ROUTES_LIST_URL)
        results = response.data.get('results', response.data)
        pks = [r['id'] for r in results]
        self.assertNotIn(self.route.pk, pks)

    # --- Unhappy path ---

    def test_retrieve_nonexistent_route_returns_404(self):
        response = self.client.get(route_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_with_nonexistent_warehouse_returns_400(self):
        data = {
            'origin_warehouse': 99999,
            'name': 'Ruta FK Mala',
            'estimated_duration_hours': '3.00',
            'estimated_distance_km': '150.00',
        }
        response = self.client.put(route_detail_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge cases ---

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(route_detail_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_malformed_pk_returns_404(self):
        response = self.client.get('/api/v1/routes/not-a-number/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class RouteFilterTests(APITestCase):
    """Tests de filtrado por origin_warehouse."""

    def setUp(self):
        self.user = User.objects.create_user(username='filteruser', password='pass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.warehouse1 = make_warehouse()
        self.warehouse2 = make_warehouse()

    def test_filter_by_origin_warehouse_returns_matching_routes(self):
        make_route(self.warehouse1, name='Ruta W1')
        make_route(self.warehouse2, name='Ruta W2')
        response = self.client.get(ROUTES_LIST_URL, {'origin_warehouse': self.warehouse1.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Ruta W1')

    def test_filter_by_origin_warehouse_no_results_returns_empty(self):
        make_route(self.warehouse1)
        response = self.client.get(ROUTES_LIST_URL, {'origin_warehouse': self.warehouse2.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_search_by_name(self):
        make_route(self.warehouse1, name='Ruta Norte')
        make_route(self.warehouse1, name='Ruta Sur')
        response = self.client.get(ROUTES_LIST_URL, {'search': 'Norte'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Ruta Norte')


class RouteStopsTests(APITestCase):
    """Tests para el endpoint anidado /routes/{id}/stops/."""

    def setUp(self):
        self.user = User.objects.create_user(username='stopsuser', password='pass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse, name='Ruta Con Paradas')

    def _valid_stop_data(self, stop_order=1):
        return {
            'stop_order': stop_order,
            'address': f'Calle {stop_order} # 10-20',
            'city': 'Bogota',
            'estimated_offset_hours': f'{stop_order}.50',
        }

    # --- Happy path ---

    def test_get_stops_returns_200(self):
        response = self.client.get(route_stops_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_stops_empty_list_returns_200(self):
        response = self.client.get(route_stops_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_get_stops_returns_existing_stops(self):
        baker.make(
            RouteStop,
            route=self.route,
            stop_order=1,
            estimated_offset_hours='1.00',
            _fill_optional=False,
        )
        baker.make(
            RouteStop,
            route=self.route,
            stop_order=2,
            estimated_offset_hours='2.00',
            _fill_optional=False,
        )
        response = self.client.get(route_stops_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_create_stop_valid_data_returns_201(self):
        data = self._valid_stop_data(stop_order=1)
        response = self.client.post(route_stops_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['stop_order'], 1)
        self.assertEqual(response.data['city'], 'Bogota')

    def test_create_stop_persists_in_db(self):
        data = self._valid_stop_data(stop_order=1)
        self.client.post(route_stops_url(self.route.pk), data, format='json')
        self.assertTrue(RouteStop.objects.filter(route=self.route, stop_order=1).exists())

    def test_create_stop_associates_with_route(self):
        data = self._valid_stop_data(stop_order=1)
        response = self.client.post(route_stops_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        stop = RouteStop.objects.get(pk=response.data['id'])
        self.assertEqual(stop.route, self.route)

    def test_create_multiple_stops_different_orders(self):
        for order in [1, 2, 3]:
            data = self._valid_stop_data(stop_order=order)
            response = self.client.post(route_stops_url(self.route.pk), data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RouteStop.objects.filter(route=self.route).count(), 3)

    def test_create_stop_with_optional_coordinates(self):
        data = {
            'stop_order': 1,
            'address': 'Avenida El Dorado',
            'city': 'Bogota',
            'estimated_offset_hours': '2.00',
            'latitude': '4.711000',
            'longitude': '-74.072100',
        }
        response = self.client.post(route_stops_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data['latitude'])

    # --- Unhappy path ---

    @override_settings(DEBUG=False)
    def test_create_stop_duplicate_stop_order_returns_400(self):
        data = self._valid_stop_data(stop_order=1)
        self.client.post(route_stops_url(self.route.pk), data, format='json')
        response = self.client.post(route_stops_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_missing_address_returns_400(self):
        data = {
            'stop_order': 1,
            'city': 'Bogota',
            'estimated_offset_hours': '1.00',
        }
        response = self.client.post(route_stops_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_missing_city_returns_400(self):
        data = {
            'stop_order': 1,
            'address': 'Calle 100',
            'estimated_offset_hours': '1.00',
        }
        response = self.client.post(route_stops_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_missing_estimated_offset_hours_returns_400(self):
        data = {
            'stop_order': 1,
            'address': 'Calle 100',
            'city': 'Bogota',
        }
        response = self.client.post(route_stops_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_missing_stop_order_returns_400(self):
        data = {
            'address': 'Calle 100',
            'city': 'Bogota',
            'estimated_offset_hours': '1.00',
        }
        response = self.client.post(route_stops_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_stops_nonexistent_route_returns_404(self):
        response = self.client.get(route_stops_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_stop_nonexistent_route_returns_404(self):
        data = self._valid_stop_data(stop_order=1)
        response = self.client.post(route_stops_url(99999), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- Edge cases ---

    def test_get_stops_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(route_stops_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_stop_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        data = self._valid_stop_data(stop_order=1)
        response = self.client.post(route_stops_url(self.route.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_stops_only_returns_stops_of_given_route(self):
        """Las paradas de una ruta no aparecen en los stops de otra ruta."""
        route2 = make_route(self.warehouse, name='Ruta Secundaria')
        baker.make(
            RouteStop,
            route=self.route,
            stop_order=1,
            estimated_offset_hours='1.00',
            _fill_optional=False,
        )
        baker.make(
            RouteStop,
            route=route2,
            stop_order=1,
            estimated_offset_hours='1.00',
            _fill_optional=False,
        )
        response = self.client.get(route_stops_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['route'], self.route.pk)
