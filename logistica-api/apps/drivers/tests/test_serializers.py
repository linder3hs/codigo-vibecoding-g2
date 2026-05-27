from django.test import TestCase
from django.contrib.auth.models import User
from model_bakery import baker

from apps.drivers.models import Driver
from apps.drivers.serializers import DriverSerializer, DriverReadSerializer
from apps.transport.models import Transport


class DriverSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='serial_user',
            password='pass',
            first_name='Carlos',
            last_name='Ruiz',
            email='carlos@test.com',
        )
        self.transport = baker.make(Transport)

    def test_write_serializer_valid_data(self):
        data = {
            'user': self.user.pk,
            'license_number': 'LIC-SER-001',
            'license_expiry': '2027-12-31',
            'phone': '3001234567',
        }
        serializer = DriverSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_write_serializer_missing_license_number_invalid(self):
        data = {
            'user': self.user.pk,
            'license_expiry': '2027-12-31',
            'phone': '3001234567',
        }
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)

    def test_write_serializer_missing_phone_invalid(self):
        data = {
            'user': self.user.pk,
            'license_number': 'LIC-SER-002',
            'license_expiry': '2027-12-31',
        }
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone', serializer.errors)

    def test_write_serializer_read_only_fields_ignored(self):
        data = {
            'user': self.user.pk,
            'license_number': 'LIC-SER-003',
            'license_expiry': '2027-12-31',
            'phone': '3001234567',
            'id': 9999,
            'created_at': '2020-01-01T00:00:00Z',
            'updated_at': '2020-01-01T00:00:00Z',
        }
        serializer = DriverSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        driver = serializer.save()
        self.assertNotEqual(driver.pk, 9999)


class DriverReadSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='read_serial_user',
            password='pass',
            first_name='Ana',
            last_name='Martinez',
            email='ana@test.com',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-READ-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )

    def test_read_serializer_includes_user_full_name(self):
        serializer = DriverReadSerializer(instance=self.driver)
        self.assertEqual(serializer.data['user_full_name'], 'Ana Martinez')

    def test_read_serializer_includes_user_email(self):
        serializer = DriverReadSerializer(instance=self.driver)
        self.assertEqual(serializer.data['user_email'], 'ana@test.com')

    def test_read_serializer_includes_user_username(self):
        serializer = DriverReadSerializer(instance=self.driver)
        self.assertEqual(serializer.data['user_username'], 'read_serial_user')

    def test_read_serializer_user_full_name_strips_whitespace_when_no_name(self):
        user_no_name = User.objects.create_user(username='noname_serial', password='pass')
        driver = Driver.objects.create(
            user=user_no_name,
            license_number='LIC-READ-002',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        serializer = DriverReadSerializer(instance=driver)
        self.assertEqual(serializer.data['user_full_name'], '')
