from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from model_bakery import baker

from apps.drivers.models import Driver
from apps.transport.models import Transport


def make_transport():
    """Crea un Transport con datos válidos usando baker."""
    return baker.make(
        Transport,
        transport_type=Transport.TRUCK,
        year=2020,
        capacity_kg=5000.00,
        capacity_m3=20.00,
    )


def create_driver_user(username, first_name='Test', last_name='Driver'):
    return User.objects.create_user(
        username=username,
        password='testpass123',
        first_name=first_name,
        last_name=last_name,
    )


class DriverListTests(APITestCase):
    def setUp(self):
        self.auth_user = User.objects.create_user(username='api_user', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.auth_user)

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/drivers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_only_active_drivers(self):
        driver_user = create_driver_user('active_driver')
        inactive_user = create_driver_user('inactive_driver')

        Driver.objects.create(
            user=driver_user,
            license_number='LIC-ACT-001',
            license_expiry='2027-12-31',
            phone='3001111111',
            is_active=True,
        )
        Driver.objects.create(
            user=inactive_user,
            license_number='LIC-INACT-001',
            license_expiry='2027-12-31',
            phone='3002222222',
            is_active=False,
        )

        response = self.client.get('/api/v1/drivers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        license_numbers = [d['license_number'] for d in results]
        self.assertIn('LIC-ACT-001', license_numbers)
        self.assertNotIn('LIC-INACT-001', license_numbers)

    def test_list_empty_returns_200_empty_list(self):
        response = self.client.get('/api/v1/drivers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_list_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/drivers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DriverCreateTests(APITestCase):
    def setUp(self):
        self.auth_user = User.objects.create_user(username='api_user_create', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.auth_user)
        self.driver_user = create_driver_user('new_driver')
        self.transport = make_transport()

    def test_create_valid_driver_returns_201(self):
        data = {
            'user': self.driver_user.pk,
            'license_number': 'LIC-CREATE-001',
            'license_expiry': '2027-12-31',
            'phone': '3001234567',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['license_number'], 'LIC-CREATE-001')

    def test_create_driver_with_transport_returns_201(self):
        data = {
            'user': self.driver_user.pk,
            'transport': self.transport.pk,
            'license_number': 'LIC-CREATE-002',
            'license_expiry': '2027-12-31',
            'phone': '3001234567',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['transport'], self.transport.pk)

    def test_create_missing_license_number_returns_400(self):
        data = {
            'user': self.driver_user.pk,
            'license_expiry': '2027-12-31',
            'phone': '3001234567',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_license_expiry_returns_400(self):
        data = {
            'user': self.driver_user.pk,
            'license_number': 'LIC-CREATE-003',
            'phone': '3001234567',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_phone_returns_400(self):
        data = {
            'user': self.driver_user.pk,
            'license_number': 'LIC-CREATE-004',
            'license_expiry': '2027-12-31',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_user_returns_400(self):
        data = {
            'license_number': 'LIC-CREATE-005',
            'license_expiry': '2027-12-31',
            'phone': '3001234567',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_license_number_returns_400(self):
        Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-DUP-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        second_user = create_driver_user('second_driver_dup')
        data = {
            'user': second_user.pk,
            'license_number': 'LIC-DUP-001',
            'license_expiry': '2027-12-31',
            'phone': '3009999999',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_user_already_has_driver_returns_400(self):
        Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-USER-DUP-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        data = {
            'user': self.driver_user.pk,
            'license_number': 'LIC-USER-DUP-002',
            'license_expiry': '2027-12-31',
            'phone': '3009999999',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_nonexistent_transport_returns_400(self):
        data = {
            'user': self.driver_user.pk,
            'transport': 99999,
            'license_number': 'LIC-CREATE-006',
            'license_expiry': '2027-12-31',
            'phone': '3001234567',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        data = {
            'user': self.driver_user.pk,
            'license_number': 'LIC-CREATE-007',
            'license_expiry': '2027-12-31',
            'phone': '3001234567',
        }
        response = self.client.post('/api/v1/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DriverRetrieveTests(APITestCase):
    def setUp(self):
        self.auth_user = User.objects.create_user(username='api_user_retrieve', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.auth_user)
        self.driver_user = create_driver_user('retrieve_driver')
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-GET-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )

    def test_retrieve_existing_driver_returns_200(self):
        response = self.client.get(f'/api/v1/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['license_number'], 'LIC-GET-001')

    def test_retrieve_uses_read_serializer_fields(self):
        response = self.client.get(f'/api/v1/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user_full_name', response.data)
        self.assertIn('user_email', response.data)
        self.assertIn('user_username', response.data)

    def test_retrieve_nonexistent_driver_returns_404(self):
        response = self.client.get('/api/v1/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(f'/api/v1/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DriverUpdateTests(APITestCase):
    def setUp(self):
        self.auth_user = User.objects.create_user(username='api_user_update', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.auth_user)
        self.driver_user = create_driver_user('update_driver')
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-UPD-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )

    def test_put_valid_data_returns_200(self):
        data = {
            'user': self.driver_user.pk,
            'license_number': 'LIC-UPD-001',
            'license_expiry': '2028-06-30',
            'phone': '3009999999',
        }
        response = self.client.put(f'/api/v1/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '3009999999')

    def test_patch_phone_returns_200(self):
        data = {'phone': '3008888888'}
        response = self.client.patch(f'/api/v1/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '3008888888')

    def test_put_nonexistent_driver_returns_404(self):
        data = {
            'user': self.driver_user.pk,
            'license_number': 'LIC-UPD-999',
            'license_expiry': '2027-12-31',
            'phone': '3001234567',
        }
        response = self.client.put('/api/v1/drivers/99999/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_with_nonexistent_transport_returns_400(self):
        data = {
            'user': self.driver_user.pk,
            'transport': 99999,
            'license_number': 'LIC-UPD-001',
            'license_expiry': '2027-12-31',
            'phone': '3001234567',
        }
        response = self.client.put(f'/api/v1/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        data = {'phone': '3001111111'}
        response = self.client.patch(f'/api/v1/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DriverDeleteTests(APITestCase):
    def setUp(self):
        self.auth_user = User.objects.create_user(username='api_user_delete', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.auth_user)
        self.driver_user = create_driver_user('delete_driver')
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-DEL-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )

    def test_delete_returns_204(self):
        response = self.client.delete(f'/api/v1/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_is_soft_delete(self):
        self.client.delete(f'/api/v1/drivers/{self.driver.pk}/')
        self.driver.refresh_from_db()
        self.assertFalse(self.driver.is_active)

    def test_delete_hides_driver_from_list(self):
        self.client.delete(f'/api/v1/drivers/{self.driver.pk}/')
        response = self.client.get('/api/v1/drivers/')
        results = response.data.get('results', response.data)
        license_numbers = [d['license_number'] for d in results]
        self.assertNotIn('LIC-DEL-001', license_numbers)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete('/api/v1/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(f'/api/v1/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DriverFilterTests(APITestCase):
    def setUp(self):
        self.auth_user = User.objects.create_user(username='api_user_filter', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.auth_user)
        self.transport = make_transport()
        self.driver_user_1 = create_driver_user('filter_driver_1')
        self.driver_user_2 = create_driver_user('filter_driver_2')
        self.driver1 = Driver.objects.create(
            user=self.driver_user_1,
            transport=self.transport,
            license_number='LIC-FILTER-001',
            license_expiry='2027-12-31',
            phone='3001111111',
        )
        self.driver2 = Driver.objects.create(
            user=self.driver_user_2,
            license_number='LIC-FILTER-002',
            license_expiry='2027-12-31',
            phone='3002222222',
        )

    def test_filter_by_transport_returns_matching_drivers(self):
        response = self.client.get(f'/api/v1/drivers/?transport={self.transport.pk}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        license_numbers = [d['license_number'] for d in results]
        self.assertIn('LIC-FILTER-001', license_numbers)
        self.assertNotIn('LIC-FILTER-002', license_numbers)

    def test_filter_no_results_returns_200_empty_list(self):
        # Crear un transport sin ningún driver asignado
        empty_transport = make_transport()
        response = self.client.get(f'/api/v1/drivers/?transport={empty_transport.pk}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_filter_invalid_transport_id_returns_400(self):
        response = self.client.get('/api/v1/drivers/?transport=99999')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search_by_license_number(self):
        response = self.client.get('/api/v1/drivers/?search=LIC-FILTER-001')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['license_number'], 'LIC-FILTER-001')

    def test_search_no_match_returns_empty_list(self):
        response = self.client.get('/api/v1/drivers/?search=NOMATCHING999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)
