from django.test import TestCase
from django.db import IntegrityError
from apps.transport.models import Transport


class TransportModelCreationTests(TestCase):
    """Tests de creación del modelo Transport con campos mínimos requeridos."""

    def _make_transport(self, **kwargs):
        defaults = {
            'plate_number': 'ABC-123',
            'transport_type': Transport.TRUCK,
            'brand': 'Kenworth',
            'model': 'T680',
            'year': 2020,
            'capacity_kg': '5000.00',
            'capacity_m3': '30.00',
        }
        defaults.update(kwargs)
        return Transport.objects.create(**defaults)

    def test_create_with_required_fields(self):
        transport = self._make_transport()
        self.assertIsNotNone(transport.pk)

    def test_str_representation(self):
        transport = self._make_transport(brand='Ford', model='Transit', plate_number='XYZ-999')
        self.assertEqual(str(transport), 'Ford Transit (XYZ-999)')

    def test_db_table_name(self):
        self.assertEqual(Transport._meta.db_table, 'transport')

    def test_is_available_defaults_to_true(self):
        transport = self._make_transport()
        self.assertTrue(transport.is_available)

    def test_created_at_auto_populated(self):
        transport = self._make_transport()
        self.assertIsNotNone(transport.created_at)

    def test_updated_at_auto_populated(self):
        transport = self._make_transport()
        self.assertIsNotNone(transport.updated_at)

    def test_plate_number_unique_constraint(self):
        self._make_transport(plate_number='UNIQUE-01')
        with self.assertRaises(IntegrityError):
            self._make_transport(plate_number='UNIQUE-01')

    def test_plate_number_not_nullable(self):
        """plate_number es CharField NOT NULL — IntegrityError o ValidationError si se omite."""
        with self.assertRaises(Exception):
            Transport.objects.create(
                plate_number=None,
                transport_type=Transport.TRUCK,
                brand='Ford',
                model='Transit',
                year=2021,
                capacity_kg='1000.00',
                capacity_m3='10.00',
            )

    def test_all_transport_type_choices(self):
        choices = [Transport.TRUCK, Transport.VAN, Transport.MOTORCYCLE, Transport.CARGO_BIKE]
        for i, choice in enumerate(choices):
            t = self._make_transport(plate_number=f'TYPE-{i:03d}', transport_type=choice)
            self.assertEqual(t.transport_type, choice)

    def test_capacity_kg_stored_as_decimal(self):
        transport = self._make_transport(capacity_kg='12345.67')
        transport.refresh_from_db()
        self.assertEqual(float(transport.capacity_kg), 12345.67)

    def test_capacity_m3_stored_as_decimal(self):
        transport = self._make_transport(capacity_m3='99.99')
        transport.refresh_from_db()
        self.assertEqual(float(transport.capacity_m3), 99.99)

    def test_is_available_can_be_set_to_false(self):
        transport = self._make_transport(is_available=False)
        self.assertFalse(transport.is_available)

    def test_ordering_by_created_at_desc(self):
        t1 = self._make_transport(plate_number='ORD-001')
        t2 = self._make_transport(plate_number='ORD-002')
        transports = list(Transport.objects.all())
        # El más reciente debe aparecer primero por ordering = ['-created_at']
        self.assertEqual(transports[0].pk, t2.pk)
        self.assertEqual(transports[1].pk, t1.pk)

    def test_type_choices_constants(self):
        self.assertEqual(Transport.TRUCK, 'TRUCK')
        self.assertEqual(Transport.VAN, 'VAN')
        self.assertEqual(Transport.MOTORCYCLE, 'MOTORCYCLE')
        self.assertEqual(Transport.CARGO_BIKE, 'CARGO_BIKE')
