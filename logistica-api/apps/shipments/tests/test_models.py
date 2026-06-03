"""
Tests del modelo Shipment y ShipmentItem.
"""
import datetime
from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth.models import User
from model_bakery import baker

from apps.shipments.models import Shipment, ShipmentItem
from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route


class ShipmentModelTest(TestCase):

    def setUp(self):
        self.customer = baker.make(Customer, email='client@test.com', is_active=True)
        self.warehouse = baker.make(Warehouse, capacity_m3='500.00', is_active=True)

    def test_create_shipment_minimal_fields(self):
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 123',
            destination_city='Bogota',
        )
        self.assertIsNotNone(shipment.pk)
        self.assertIsNotNone(shipment.tracking_number)
        self.assertEqual(shipment.status, Shipment.PENDING)
        self.assertEqual(str(shipment.weight_total_kg), '0')
        self.assertEqual(str(shipment.base_cost), '0')
        self.assertEqual(str(shipment.calculated_cost), '0')

    def test_tracking_number_auto_generated_on_save(self):
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 123',
            destination_city='Bogota',
        )
        self.assertIsNotNone(shipment.tracking_number)
        self.assertTrue(len(shipment.tracking_number) > 0)

    def test_tracking_number_is_unique(self):
        s1 = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 1',
            destination_city='Bogota',
        )
        with self.assertRaises(IntegrityError):
            Shipment.objects.create(
                tracking_number=s1.tracking_number,
                customer=self.customer,
                origin_warehouse=self.warehouse,
                destination_address='Calle 2',
                destination_city='Medellin',
            )

    def test_str_representation(self):
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 123',
            destination_city='Bogota',
        )
        expected = f'{shipment.tracking_number} — {shipment.status}'
        self.assertEqual(str(shipment), expected)

    def test_db_table_name(self):
        self.assertEqual(Shipment._meta.db_table, 'shipments')

    def test_default_status_is_pending(self):
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 123',
            destination_city='Bogota',
        )
        self.assertEqual(shipment.status, 'PENDING')

    def test_valid_status_choices(self):
        valid_statuses = ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED']
        for status_value in valid_statuses:
            shipment = baker.make(Shipment, customer=self.customer, origin_warehouse=self.warehouse, status=status_value)
            self.assertEqual(shipment.status, status_value)

    def test_nullable_fks(self):
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 123',
            destination_city='Bogota',
        )
        self.assertIsNone(shipment.driver)
        self.assertIsNone(shipment.transport)
        self.assertIsNone(shipment.route)
        self.assertIsNone(shipment.estimated_delivery_date)
        self.assertIsNone(shipment.actual_delivery_date)
        self.assertIsNone(shipment.notes)

    def test_default_destination_country(self):
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 123',
            destination_city='Bogota',
        )
        self.assertEqual(shipment.destination_country, 'Colombia')

    def test_customer_field_is_not_nullable(self):
        # El campo customer tiene null=False — el modelo lo declara como FK PROTECT
        field = Shipment._meta.get_field('customer')
        self.assertFalse(field.null)

    def test_origin_warehouse_field_is_not_nullable(self):
        # El campo origin_warehouse tiene null=False — el modelo lo declara como FK PROTECT
        field = Shipment._meta.get_field('origin_warehouse')
        self.assertFalse(field.null)

    def test_driver_set_null_on_delete(self):
        transport = baker.make(Transport, plate_number='ABC123', is_available=True)
        user = User.objects.create_superuser(username='driver_user', password='pass')
        driver = baker.make(Driver, user=user, transport=transport, license_number='LIC001',
                            license_expiry=datetime.date(2030, 1, 1))
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 123',
            destination_city='Bogota',
            driver=driver,
        )
        driver.delete()
        shipment.refresh_from_db()
        self.assertIsNone(shipment.driver)

    def test_ordering_by_created_at_desc(self):
        s1 = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 1',
            destination_city='Bogota',
        )
        s2 = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 2',
            destination_city='Medellin',
        )
        shipments = list(Shipment.objects.all())
        # El más reciente debe ir primero
        self.assertEqual(shipments[0].pk, s2.pk)


class ShipmentItemModelTest(TestCase):

    def setUp(self):
        self.customer = baker.make(Customer, email='client2@test.com', is_active=True)
        self.warehouse = baker.make(Warehouse, capacity_m3='500.00', is_active=True)
        self.supplier = baker.make(Supplier, email='supp@test.com', is_active=True)
        self.product = baker.make(
            Product,
            supplier=self.supplier,
            warehouse=self.warehouse,
            sku='SKU-001',
            unit_price='100.00',
            is_active=True,
        )
        self.shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 123',
            destination_city='Bogota',
        )

    def test_create_shipment_item(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=3,
            unit_price_at_time='100.00',
            subtotal='300.00',
        )
        self.assertIsNotNone(item.pk)
        self.assertEqual(item.quantity, 3)

    def test_str_representation(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price_at_time='100.00',
            subtotal='200.00',
        )
        expected = f'{self.shipment.tracking_number} — {self.product.name} x2'
        self.assertEqual(str(item), expected)

    def test_db_table_name(self):
        self.assertEqual(ShipmentItem._meta.db_table, 'shipment_items')

    def test_unique_together_shipment_product(self):
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price_at_time='100.00',
            subtotal='100.00',
        )
        with self.assertRaises(IntegrityError):
            ShipmentItem.objects.create(
                shipment=self.shipment,
                product=self.product,
                quantity=2,
                unit_price_at_time='100.00',
                subtotal='200.00',
            )

    def test_same_product_different_shipments_allowed(self):
        shipment2 = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Calle 456',
            destination_city='Cali',
        )
        item1 = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price_at_time='100.00',
            subtotal='100.00',
        )
        item2 = ShipmentItem.objects.create(
            shipment=shipment2,
            product=self.product,
            quantity=1,
            unit_price_at_time='100.00',
            subtotal='100.00',
        )
        self.assertIsNotNone(item1.pk)
        self.assertIsNotNone(item2.pk)

    def test_cascade_delete_with_shipment(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price_at_time='100.00',
            subtotal='100.00',
        )
        item_id = item.pk
        self.shipment.delete()
        self.assertFalse(ShipmentItem.objects.filter(pk=item_id).exists())
