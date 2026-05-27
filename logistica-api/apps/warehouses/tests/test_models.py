from django.test import TestCase
from django.db import IntegrityError
from model_bakery import baker
from apps.warehouses.models import Warehouse


class WarehouseModelCreationTests(TestCase):
    """Tests de creación del modelo Warehouse con campos mínimos requeridos."""

    def test_create_with_minimum_required_fields(self):
        warehouse = Warehouse.objects.create(
            name='Almacén Central',
            address='Calle 10 # 20-30',
            city='Bogotá',
            capacity_m3=500.00,
        )
        self.assertIsNotNone(warehouse.pk)
        self.assertEqual(warehouse.name, 'Almacén Central')
        self.assertEqual(warehouse.city, 'Bogotá')
        self.assertEqual(warehouse.country, 'Colombia')

    def test_default_country_is_colombia(self):
        warehouse = Warehouse.objects.create(
            name='Almacén Norte',
            address='Av 5 # 10-00',
            city='Medellín',
            capacity_m3=300.00,
        )
        self.assertEqual(warehouse.country, 'Colombia')

    def test_default_is_active_is_true(self):
        warehouse = Warehouse.objects.create(
            name='Almacén Sur',
            address='Carrera 8 # 15-20',
            city='Cali',
            capacity_m3=200.00,
        )
        self.assertTrue(warehouse.is_active)

    def test_latitude_longitude_are_nullable(self):
        warehouse = Warehouse.objects.create(
            name='Almacén Sin Coords',
            address='Diagonal 40 # 5-00',
            city='Barranquilla',
            capacity_m3=150.00,
        )
        self.assertIsNone(warehouse.latitude)
        self.assertIsNone(warehouse.longitude)

    def test_latitude_longitude_can_be_set(self):
        warehouse = Warehouse.objects.create(
            name='Almacén Con Coords',
            address='Calle 50 # 30-00',
            city='Cartagena',
            capacity_m3=400.00,
            latitude=10.391049,
            longitude=-75.479426,
        )
        self.assertIsNotNone(warehouse.latitude)
        self.assertIsNotNone(warehouse.longitude)

    def test_created_at_auto_set(self):
        warehouse = Warehouse.objects.create(
            name='Almacén Tiempo',
            address='Transv 7 # 1-00',
            city='Bucaramanga',
            capacity_m3=100.00,
        )
        self.assertIsNotNone(warehouse.created_at)

    def test_updated_at_auto_set(self):
        warehouse = Warehouse.objects.create(
            name='Almacén Update',
            address='Calle 90 # 2-00',
            city='Pereira',
            capacity_m3=80.00,
        )
        self.assertIsNotNone(warehouse.updated_at)

    def test_baker_creates_valid_instance(self):
        warehouse = baker.make(Warehouse)
        self.assertIsNotNone(warehouse.pk)
        self.assertIsInstance(warehouse, Warehouse)


class WarehouseModelStrTests(TestCase):
    """Tests del método __str__ del modelo Warehouse."""

    def test_str_returns_name_dash_city(self):
        warehouse = Warehouse.objects.create(
            name='Almacén Occidente',
            address='Calle 1 # 2-3',
            city='Manizales',
            capacity_m3=250.00,
        )
        expected = 'Almacén Occidente — Manizales'
        self.assertEqual(str(warehouse), expected)

    def test_str_format_with_different_values(self):
        warehouse = baker.make(Warehouse, name='Depósito Central', city='Tunja')
        self.assertEqual(str(warehouse), 'Depósito Central — Tunja')


class WarehouseModelMetaTests(TestCase):
    """Tests de configuración Meta del modelo Warehouse."""

    def test_db_table_name(self):
        self.assertEqual(Warehouse._meta.db_table, 'warehouses')

    def test_default_ordering_is_by_created_at_desc(self):
        self.assertEqual(Warehouse._meta.ordering, ['-created_at'])


class WarehouseModelSoftDeleteTests(TestCase):
    """Tests del comportamiento de soft delete mediante el campo is_active."""

    def test_soft_delete_sets_is_active_false(self):
        warehouse = baker.make(Warehouse, is_active=True)
        warehouse.is_active = False
        warehouse.save()
        warehouse.refresh_from_db()
        self.assertFalse(warehouse.is_active)

    def test_inactive_warehouse_still_exists_in_db(self):
        warehouse = baker.make(Warehouse, is_active=True)
        pk = warehouse.pk
        warehouse.is_active = False
        warehouse.save()
        self.assertTrue(Warehouse.objects.filter(pk=pk).exists())

    def test_active_and_inactive_warehouses_coexist(self):
        baker.make(Warehouse, is_active=True, _quantity=3)
        baker.make(Warehouse, is_active=False, _quantity=2)
        self.assertEqual(Warehouse.objects.filter(is_active=True).count(), 3)
        self.assertEqual(Warehouse.objects.filter(is_active=False).count(), 2)


class WarehouseModelFieldConstraintsTests(TestCase):
    """Tests de constraints y validaciones a nivel de campo."""

    def test_capacity_m3_is_not_nullable(self):
        """capacity_m3 es NOT NULL — debe fallar si se intenta guardar None directamente."""
        with self.assertRaises(Exception):
            warehouse = Warehouse(
                name='Test',
                address='Dir',
                city='Ciudad',
                capacity_m3=None,
            )
            warehouse.full_clean()

    def test_name_max_length_255(self):
        self.assertEqual(
            Warehouse._meta.get_field('name').max_length, 255
        )

    def test_address_max_length_500(self):
        self.assertEqual(
            Warehouse._meta.get_field('address').max_length, 500
        )

    def test_city_max_length_100(self):
        self.assertEqual(
            Warehouse._meta.get_field('city').max_length, 100
        )

    def test_country_max_length_100(self):
        self.assertEqual(
            Warehouse._meta.get_field('country').max_length, 100
        )

    def test_capacity_m3_decimal_fields(self):
        field = Warehouse._meta.get_field('capacity_m3')
        self.assertEqual(field.max_digits, 10)
        self.assertEqual(field.decimal_places, 2)

    def test_latitude_decimal_fields(self):
        field = Warehouse._meta.get_field('latitude')
        self.assertEqual(field.max_digits, 9)
        self.assertEqual(field.decimal_places, 6)

    def test_longitude_decimal_fields(self):
        field = Warehouse._meta.get_field('longitude')
        self.assertEqual(field.max_digits, 9)
        self.assertEqual(field.decimal_places, 6)
