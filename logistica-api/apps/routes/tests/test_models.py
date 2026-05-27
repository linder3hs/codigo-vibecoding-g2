from django.test import TestCase
from django.db import IntegrityError
from model_bakery import baker

from apps.routes.models import Route, RouteStop
from apps.warehouses.models import Warehouse


class RouteModelTests(TestCase):
    """Tests para el modelo Route."""

    def setUp(self):
        self.warehouse = baker.make(Warehouse, is_active=True, capacity_m3='500.00')

    def test_create_route_with_required_fields(self):
        route = Route.objects.create(
            origin_warehouse=self.warehouse,
            name='Ruta Bogota-Medellin',
            estimated_duration_hours='8.50',
            estimated_distance_km='415.00',
        )
        self.assertIsNotNone(route.pk)
        self.assertEqual(route.name, 'Ruta Bogota-Medellin')
        self.assertEqual(route.origin_warehouse, self.warehouse)
        self.assertTrue(route.is_active)

    def test_route_str(self):
        route = baker.make(Route, name='Ruta Test', origin_warehouse=self.warehouse)
        self.assertEqual(str(route), 'Ruta Test')

    def test_route_db_table(self):
        self.assertEqual(Route._meta.db_table, 'routes')

    def test_route_is_active_default_true(self):
        route = Route.objects.create(
            origin_warehouse=self.warehouse,
            name='Ruta Default Active',
            estimated_duration_hours='2.00',
            estimated_distance_km='100.00',
        )
        self.assertTrue(route.is_active)

    def test_route_created_at_auto_populated(self):
        route = baker.make(Route, origin_warehouse=self.warehouse)
        self.assertIsNotNone(route.created_at)
        self.assertIsNotNone(route.updated_at)

    def test_route_name_not_nullable(self):
        with self.assertRaises(Exception):
            Route.objects.create(
                origin_warehouse=self.warehouse,
                name=None,
                estimated_duration_hours='2.00',
                estimated_distance_km='100.00',
            )

    def test_route_origin_warehouse_fk_on_delete_protect(self):
        """No se puede eliminar un Warehouse que tiene rutas asociadas."""
        route = baker.make(Route, origin_warehouse=self.warehouse)
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.warehouse.delete()

    def test_route_ordering_by_created_at_desc(self):
        route1 = baker.make(Route, origin_warehouse=self.warehouse)
        route2 = baker.make(Route, origin_warehouse=self.warehouse)
        routes = list(Route.objects.filter(is_active=True))
        # La más reciente debe ser la primera
        self.assertEqual(routes[0].pk, route2.pk)

    def test_route_estimated_duration_hours_not_nullable(self):
        with self.assertRaises(Exception):
            Route.objects.create(
                origin_warehouse=self.warehouse,
                name='Ruta Sin Duracion',
                estimated_duration_hours=None,
                estimated_distance_km='100.00',
            )

    def test_route_estimated_distance_km_not_nullable(self):
        with self.assertRaises(Exception):
            Route.objects.create(
                origin_warehouse=self.warehouse,
                name='Ruta Sin Distancia',
                estimated_duration_hours='2.00',
                estimated_distance_km=None,
            )


class RouteStopModelTests(TestCase):
    """Tests para el modelo RouteStop."""

    def setUp(self):
        self.warehouse = baker.make(Warehouse, is_active=True, capacity_m3='500.00')
        self.route = baker.make(
            Route,
            origin_warehouse=self.warehouse,
            estimated_duration_hours='8.00',
            estimated_distance_km='400.00',
        )

    def test_create_route_stop_with_required_fields(self):
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Calle 100 # 15-30',
            city='Bogota',
            estimated_offset_hours='1.50',
        )
        self.assertIsNotNone(stop.pk)
        self.assertEqual(stop.route, self.route)
        self.assertEqual(stop.stop_order, 1)
        self.assertEqual(stop.city, 'Bogota')

    def test_route_stop_str(self):
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=2,
            address='Carrera 50 # 20-10',
            city='Medellin',
            estimated_offset_hours='4.00',
        )
        expected = f'{self.route.name} — Parada 2: Medellin'
        self.assertEqual(str(stop), expected)

    def test_route_stop_db_table(self):
        self.assertEqual(RouteStop._meta.db_table, 'route_stops')

    def test_route_stop_unique_together_constraint(self):
        """No se puede crear dos paradas con el mismo stop_order en la misma ruta."""
        RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Dirección A',
            city='Ciudad A',
            estimated_offset_hours='1.00',
        )
        with self.assertRaises(IntegrityError):
            RouteStop.objects.create(
                route=self.route,
                stop_order=1,
                address='Dirección B',
                city='Ciudad B',
                estimated_offset_hours='2.00',
            )

    def test_route_stop_same_order_different_routes_allowed(self):
        """El mismo stop_order en diferentes rutas es permitido."""
        route2 = baker.make(
            Route,
            origin_warehouse=self.warehouse,
            estimated_duration_hours='4.00',
            estimated_distance_km='200.00',
        )
        stop1 = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Dirección A',
            city='Ciudad A',
            estimated_offset_hours='1.00',
        )
        stop2 = RouteStop.objects.create(
            route=route2,
            stop_order=1,
            address='Dirección B',
            city='Ciudad B',
            estimated_offset_hours='1.00',
        )
        self.assertIsNotNone(stop1.pk)
        self.assertIsNotNone(stop2.pk)

    def test_route_stop_latitude_longitude_nullable(self):
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=3,
            address='Sin Coordenadas',
            city='Ciudad X',
            estimated_offset_hours='3.00',
            latitude=None,
            longitude=None,
        )
        self.assertIsNone(stop.latitude)
        self.assertIsNone(stop.longitude)

    def test_route_stop_latitude_longitude_can_be_set(self):
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=4,
            address='Con Coordenadas',
            city='Cali',
            estimated_offset_hours='5.00',
            latitude='3.451647',
            longitude='-76.531990',
        )
        self.assertIsNotNone(stop.latitude)
        self.assertIsNotNone(stop.longitude)

    def test_route_stop_cascade_delete_when_route_deleted(self):
        """Al eliminar la ruta, las paradas se eliminan en cascada."""
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Parada Cascade',
            city='Ciudad Cascade',
            estimated_offset_hours='1.00',
        )
        route_pk = self.route.pk
        stop_pk = stop.pk
        self.route.delete()
        self.assertFalse(RouteStop.objects.filter(pk=stop_pk).exists())

    def test_route_stop_ordering_by_stop_order(self):
        baker.make(RouteStop, route=self.route, stop_order=3, estimated_offset_hours='3.00', _fill_optional=False)
        baker.make(RouteStop, route=self.route, stop_order=1, estimated_offset_hours='1.00', _fill_optional=False)
        baker.make(RouteStop, route=self.route, stop_order=2, estimated_offset_hours='2.00', _fill_optional=False)
        stops = list(RouteStop.objects.filter(route=self.route))
        orders = [s.stop_order for s in stops]
        self.assertEqual(orders, sorted(orders))

    def test_route_stop_address_not_nullable(self):
        with self.assertRaises(Exception):
            RouteStop.objects.create(
                route=self.route,
                stop_order=5,
                address=None,
                city='Ciudad Y',
                estimated_offset_hours='5.00',
            )

    def test_route_stop_city_not_nullable(self):
        with self.assertRaises(Exception):
            RouteStop.objects.create(
                route=self.route,
                stop_order=6,
                address='Dirección Z',
                city=None,
                estimated_offset_hours='6.00',
            )
