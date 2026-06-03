from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from model_bakery import baker
from apps.customers.models import Customer


class CustomerListTests(APITestCase):
    """Tests del endpoint GET /api/v1/customers/."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/customers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_paginated_results(self):
        baker.make(Customer, is_active=True, _quantity=3)
        response = self.client.get('/api/v1/customers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(response.data['count'], 3)

    def test_list_only_returns_active_customers(self):
        active = baker.make(Customer, is_active=True)
        baker.make(Customer, is_active=False)
        response = self.client.get('/api/v1/customers/')
        ids_returned = [c['id'] for c in response.data['results']]
        self.assertIn(active.pk, ids_returned)
        # El inactivo no debe aparecer
        inactive_count = Customer.objects.filter(is_active=False).count()
        self.assertEqual(inactive_count, 1)
        self.assertEqual(response.data['count'], 1)

    def test_list_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/customers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_returns_200_with_empty_results(self):
        response = self.client.get('/api/v1/customers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])


class CustomerCreateTests(APITestCase):
    """Tests del endpoint POST /api/v1/customers/."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.valid_data = {
            'name': 'Empresa Prueba',
            'customer_type': 'COMPANY',
            'email': 'prueba@empresa.com',
            'phone': '3001234567',
            'address': 'Calle 10 # 5-20, Bogota',
            'city': 'Bogota',
            'country': 'Colombia',
        }

    def test_create_valid_customer_returns_201(self):
        response = self.client.post('/api/v1/customers/', self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_returns_customer_data(self):
        response = self.client.post('/api/v1/customers/', self.valid_data, format='json')
        self.assertEqual(response.data['name'], 'Empresa Prueba')
        self.assertEqual(response.data['email'], 'prueba@empresa.com')

    def test_create_persists_in_db(self):
        self.client.post('/api/v1/customers/', self.valid_data, format='json')
        self.assertTrue(Customer.objects.filter(email='prueba@empresa.com').exists())

    def test_create_without_name_returns_400(self):
        data = {**self.valid_data}
        del data['name']
        response = self.client.post('/api/v1/customers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_email_returns_400(self):
        data = {**self.valid_data}
        del data['email']
        response = self.client.post('/api/v1/customers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_phone_returns_400(self):
        data = {**self.valid_data}
        del data['phone']
        response = self.client.post('/api/v1/customers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_address_returns_400(self):
        data = {**self.valid_data}
        del data['address']
        response = self.client.post('/api/v1/customers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_city_returns_400(self):
        data = {**self.valid_data}
        del data['city']
        response = self.client.post('/api/v1/customers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_empty_body_returns_400(self):
        response = self.client.post('/api/v1/customers/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_email_returns_400(self):
        self.client.post('/api/v1/customers/', self.valid_data, format='json')
        duplicate = {**self.valid_data, 'name': 'Otra Empresa'}
        response = self.client.post('/api/v1/customers/', duplicate, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_tax_id_returns_400(self):
        data_with_tax = {**self.valid_data, 'tax_id': 'NIT-123'}
        self.client.post('/api/v1/customers/', data_with_tax, format='json')
        duplicate = {**self.valid_data, 'email': 'otro@empresa.com', 'tax_id': 'NIT-123'}
        response = self.client.post('/api/v1/customers/', duplicate, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_invalid_customer_type_returns_400(self):
        data = {**self.valid_data, 'customer_type': 'INVALID_TYPE'}
        response = self.client.post('/api/v1/customers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_auth_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/v1/customers/', self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_individual_customer_returns_201(self):
        data = {**self.valid_data, 'customer_type': 'INDIVIDUAL', 'email': 'individual@test.com'}
        response = self.client.post('/api/v1/customers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['customer_type'], 'INDIVIDUAL')

    def test_create_without_tax_id_is_allowed(self):
        """tax_id es nullable, no es requerido."""
        response = self.client.post('/api/v1/customers/', self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data.get('tax_id'))

    def test_create_default_country_is_colombia(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'country'}
        response = self.client.post('/api/v1/customers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['country'], 'Colombia')


class CustomerDetailTests(APITestCase):
    """Tests del endpoint GET /api/v1/customers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.customer = baker.make(Customer, is_active=True)

    def test_retrieve_existing_customer_returns_200(self):
        response = self.client.get(f'/api/v1/customers/{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_data(self):
        response = self.client.get(f'/api/v1/customers/{self.customer.pk}/')
        self.assertEqual(response.data['id'], self.customer.pk)
        self.assertEqual(response.data['name'], self.customer.name)

    def test_retrieve_nonexistent_id_returns_404(self):
        response = self.client.get('/api/v1/customers/999999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_inactive_customer_returns_404(self):
        inactive = baker.make(Customer, is_active=False)
        response = self.client.get(f'/api/v1/customers/{inactive.pk}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(f'/api/v1/customers/{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CustomerUpdateTests(APITestCase):
    """Tests de los endpoints PUT y PATCH /api/v1/customers/{id}/."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.customer = baker.make(Customer, is_active=True, country='Colombia')

    def test_put_valid_data_returns_200(self):
        data = {
            'name': 'Nombre Actualizado',
            'customer_type': 'COMPANY',
            'email': 'actualizado@empresa.com',
            'phone': '3009999999',
            'address': 'Nueva Direccion 123',
            'city': 'Medellin',
            'country': 'Colombia',
        }
        response = self.client.put(f'/api/v1/customers/{self.customer.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Nombre Actualizado')

    def test_put_persists_changes(self):
        data = {
            'name': 'Empresa Modificada',
            'customer_type': 'INDIVIDUAL',
            'email': 'modificado@test.com',
            'phone': '3001111111',
            'address': 'Calle Modificada',
            'city': 'Cali',
            'country': 'Colombia',
        }
        self.client.put(f'/api/v1/customers/{self.customer.pk}/', data, format='json')
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.name, 'Empresa Modificada')

    def test_put_without_required_field_returns_400(self):
        data = {
            'customer_type': 'COMPANY',
            'email': 'sin_nombre@test.com',
            'phone': '3002222222',
            'address': 'Dir',
            'city': 'Bogota',
        }
        response = self.client.put(f'/api/v1/customers/{self.customer.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_partial_update_returns_200(self):
        response = self.client.patch(
            f'/api/v1/customers/{self.customer.pk}/',
            {'city': 'Cartagena'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Cartagena')

    def test_patch_nonexistent_id_returns_404(self):
        response = self.client.patch('/api/v1/customers/999999/', {'city': 'Bogota'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.put(
            f'/api/v1/customers/{self.customer.pk}/',
            {'name': 'x'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CustomerDeleteTests(APITestCase):
    """Tests del endpoint DELETE /api/v1/customers/{id}/ (soft delete)."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.customer = baker.make(Customer, is_active=True)

    def test_delete_existing_customer_returns_204(self):
        response = self.client.delete(f'/api/v1/customers/{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_performs_soft_delete(self):
        """DELETE no elimina el registro de la BD, solo setea is_active=False."""
        self.client.delete(f'/api/v1/customers/{self.customer.pk}/')
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_active)

    def test_delete_record_still_exists_in_db(self):
        self.client.delete(f'/api/v1/customers/{self.customer.pk}/')
        self.assertTrue(Customer.objects.filter(pk=self.customer.pk).exists())

    def test_delete_customer_not_returned_in_list(self):
        self.client.delete(f'/api/v1/customers/{self.customer.pk}/')
        response = self.client.get('/api/v1/customers/')
        ids = [c['id'] for c in response.data['results']]
        self.assertNotIn(self.customer.pk, ids)

    def test_delete_nonexistent_id_returns_404(self):
        response = self.client.delete('/api/v1/customers/999999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(f'/api/v1/customers/{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CustomerFilterTests(APITestCase):
    """Tests de filtrado en GET /api/v1/customers/."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_filter_by_customer_type_company(self):
        baker.make(Customer, customer_type='COMPANY', is_active=True)
        baker.make(Customer, customer_type='INDIVIDUAL', is_active=True)
        response = self.client.get('/api/v1/customers/?customer_type=COMPANY')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for c in response.data['results']:
            self.assertEqual(c['customer_type'], 'COMPANY')

    def test_filter_by_customer_type_individual(self):
        baker.make(Customer, customer_type='INDIVIDUAL', is_active=True)
        baker.make(Customer, customer_type='COMPANY', is_active=True)
        response = self.client.get('/api/v1/customers/?customer_type=INDIVIDUAL')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for c in response.data['results']:
            self.assertEqual(c['customer_type'], 'INDIVIDUAL')

    def test_filter_by_city(self):
        baker.make(Customer, city='Bogota', is_active=True)
        baker.make(Customer, city='Medellin', is_active=True)
        response = self.client.get('/api/v1/customers/?city=Bogota')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for c in response.data['results']:
            self.assertEqual(c['city'], 'Bogota')

    def test_filter_by_country(self):
        baker.make(Customer, country='Colombia', is_active=True)
        baker.make(Customer, country='Mexico', is_active=True)
        response = self.client.get('/api/v1/customers/?country=Colombia')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for c in response.data['results']:
            self.assertEqual(c['country'], 'Colombia')

    def test_filter_no_results_returns_200_empty(self):
        response = self.client.get('/api/v1/customers/?city=CiudadInexistente')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])

    def test_search_by_name(self):
        baker.make(Customer, name='TechCorp SA', is_active=True)
        baker.make(Customer, name='Distribuidora XYZ', is_active=True)
        response = self.client.get('/api/v1/customers/?search=TechCorp')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)
        names = [c['name'] for c in response.data['results']]
        self.assertTrue(any('TechCorp' in n for n in names))

    def test_ordering_by_name(self):
        baker.make(Customer, name='Zeta Corp', is_active=True)
        baker.make(Customer, name='Alpha Corp', is_active=True)
        response = self.client.get('/api/v1/customers/?ordering=name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [c['name'] for c in response.data['results']]
        self.assertEqual(names, sorted(names))
