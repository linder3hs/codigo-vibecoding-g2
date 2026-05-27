from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError
from model_bakery import baker

from apps.drivers.models import Driver
from apps.transport.models import Transport


class DriverModelCreationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='driver_user',
            password='testpass123',
            first_name='Juan',
            last_name='Perez',
        )
        self.transport = baker.make(Transport)

    def test_create_driver_minimum_fields(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        self.assertIsNotNone(driver.pk)

    def test_create_driver_with_transport(self):
        driver = Driver.objects.create(
            user=self.user,
            transport=self.transport,
            license_number='LIC-002',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        self.assertEqual(driver.transport, self.transport)

    def test_transport_is_nullable(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-003',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        self.assertIsNone(driver.transport)

    def test_is_active_default_true(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-004',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        self.assertTrue(driver.is_active)

    def test_created_at_and_updated_at_auto_set(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-005',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        self.assertIsNotNone(driver.created_at)
        self.assertIsNotNone(driver.updated_at)


class DriverModelStrTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='driver_str_user',
            password='testpass123',
            first_name='Maria',
            last_name='Lopez',
        )

    def test_str_with_full_name(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-STR-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        self.assertEqual(str(driver), 'Maria Lopez (LIC-STR-001)')

    def test_str_with_no_names(self):
        user_no_name = User.objects.create_user(
            username='driver_noname',
            password='testpass123',
        )
        driver = Driver.objects.create(
            user=user_no_name,
            license_number='LIC-STR-002',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        # get_full_name() retorna '' cuando no hay nombre; strip() lo deja vacío
        self.assertEqual(str(driver), ' (LIC-STR-002)')


class DriverModelMetaTests(TestCase):
    def test_db_table_name(self):
        self.assertEqual(Driver._meta.db_table, 'drivers')

    def test_default_ordering(self):
        self.assertEqual(Driver._meta.ordering, ['-created_at'])


class DriverModelConstraintTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user_c1', password='pass')
        self.user2 = User.objects.create_user(username='user_c2', password='pass')

    def test_license_number_unique(self):
        Driver.objects.create(
            user=self.user1,
            license_number='LIC-UNIQUE',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=self.user2,
                license_number='LIC-UNIQUE',
                license_expiry='2027-12-31',
                phone='3001234567',
            )

    def test_user_onetoone_unique(self):
        Driver.objects.create(
            user=self.user1,
            license_number='LIC-OTO-1',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=self.user1,
                license_number='LIC-OTO-2',
                license_expiry='2027-12-31',
                phone='3009999999',
            )


class DriverModelForeignKeyTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='user_fk', password='pass')
        self.transport = baker.make(Transport)

    def test_transport_on_delete_set_null(self):
        driver = Driver.objects.create(
            user=self.user,
            transport=self.transport,
            license_number='LIC-FK-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        self.transport.delete()
        driver.refresh_from_db()
        self.assertIsNone(driver.transport)

    def test_user_on_delete_protect(self):
        Driver.objects.create(
            user=self.user,
            license_number='LIC-FK-002',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        from django.db.models.deletion import ProtectedError
        with self.assertRaises(ProtectedError):
            self.user.delete()
