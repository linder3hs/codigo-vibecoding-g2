from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from model_bakery import baker
from apps.suppliers.models import Supplier


BASE_URL = '/api/v1/suppliers/'


def detail_url(pk):
    return f'{BASE_URL}{pk}/'


class SupplierListTests(APITestCase):
    """Tests para GET /api/v1/suppliers/"""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='pass1234')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_returns_200(self):
        """GET lista de proveedores retorna 200."""
        baker.make(Supplier, is_active=True, _quantity=3)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_only_active_suppliers(self):
        """El listado excluye proveedores con is_active=False."""
        baker.make(Supplier, is_active=True, _quantity=2)
        baker.make(Supplier, is_active=False, _quantity=2)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)

    def test_list_unauthenticated_returns_401(self):
        """Sin token de autenticacion el endpoint retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_returns_200_with_empty_results(self):
        """Lista vacia (sin proveedores) retorna 200 con lista vacia."""
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_list_pagination_is_present(self):
        """La respuesta incluye paginacion (count, next, previous)."""
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)


class SupplierCreateTests(APITestCase):
    """Tests para POST /api/v1/suppliers/"""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='pass1234')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.valid_payload = {
            'name': 'Proveedor Tech S.A.',
            'contact_name': 'Luis Gomez',
            'email': 'luis@proveedor.com',
            'phone': '3009876543',
            'address': 'Carrera 50 # 10-20',
            'city': 'Bogota',
            'country': 'Colombia',
        }

    def test_create_valid_supplier_returns_201(self):
        """POST con datos validos retorna 201 y crea el proveedor."""
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Supplier.objects.count(), 1)

    def test_create_returns_supplier_data(self):
        """POST exitoso retorna los datos del proveedor creado."""
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Proveedor Tech S.A.')
        self.assertEqual(response.data['city'], 'Bogota')

    def test_create_with_tax_id_returns_201(self):
        """POST con tax_id provisto retorna 201."""
        self.valid_payload['tax_id'] = '900111222-3'
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tax_id'], '900111222-3')

    def test_create_without_name_returns_400(self):
        """POST sin el campo 'name' retorna 400."""
        self.valid_payload.pop('name')
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_without_contact_name_returns_400(self):
        """POST sin el campo 'contact_name' retorna 400."""
        self.valid_payload.pop('contact_name')
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('contact_name', response.data)

    def test_create_without_email_returns_400(self):
        """POST sin el campo 'email' retorna 400."""
        self.valid_payload.pop('email')
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_without_phone_returns_400(self):
        """POST sin el campo 'phone' retorna 400."""
        self.valid_payload.pop('phone')
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', response.data)

    def test_create_without_address_returns_400(self):
        """POST sin el campo 'address' retorna 400."""
        self.valid_payload.pop('address')
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('address', response.data)

    def test_create_without_city_returns_400(self):
        """POST sin el campo 'city' retorna 400."""
        self.valid_payload.pop('city')
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('city', response.data)

    def test_create_with_empty_payload_returns_400(self):
        """POST con payload vacio retorna 400."""
        response = self.client.post(BASE_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unauthenticated_returns_401(self):
        """POST sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_duplicate_tax_id_returns_400(self):
        """POST con tax_id duplicado retorna 400."""
        baker.make(Supplier, tax_id='NIT-DUPLICADO', is_active=True)
        self.valid_payload['tax_id'] = 'NIT-DUPLICADO'
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_is_active_defaults_to_true(self):
        """El proveedor creado tiene is_active=True por defecto."""
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        supplier = Supplier.objects.get(pk=response.data['id'])
        self.assertTrue(supplier.is_active)


class SupplierRetrieveTests(APITestCase):
    """Tests para GET /api/v1/suppliers/{id}/"""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='pass1234')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.supplier = baker.make(Supplier, is_active=True, name='Proveedor Detalle')

    def test_retrieve_existing_supplier_returns_200(self):
        """GET de un proveedor existente retorna 200."""
        response = self.client.get(detail_url(self.supplier.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.supplier.pk)
        self.assertEqual(response.data['name'], 'Proveedor Detalle')

    def test_retrieve_nonexistent_supplier_returns_404(self):
        """GET de un ID que no existe retorna 404."""
        response = self.client.get(detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_inactive_supplier_returns_404(self):
        """GET de un proveedor inactivo (soft deleted) retorna 404."""
        inactive = baker.make(Supplier, is_active=False)
        response = self.client.get(detail_url(inactive.pk))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        """GET sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(detail_url(self.supplier.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SupplierUpdateTests(APITestCase):
    """Tests para PUT/PATCH /api/v1/suppliers/{id}/"""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='pass1234')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.supplier = baker.make(Supplier, is_active=True, name='Original')
        self.full_payload = {
            'name': 'Actualizado S.A.',
            'contact_name': 'Nuevo Contacto',
            'email': 'nuevo@proveedor.com',
            'phone': '3001112233',
            'address': 'Av. Siempre Viva 123',
            'city': 'Medellin',
            'country': 'Colombia',
        }

    def test_put_valid_data_returns_200(self):
        """PUT con datos validos retorna 200."""
        response = self.client.put(detail_url(self.supplier.pk), self.full_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Actualizado S.A.')

    def test_put_updates_supplier_in_db(self):
        """PUT actualiza el proveedor en la BD."""
        self.client.put(detail_url(self.supplier.pk), self.full_payload, format='json')
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.name, 'Actualizado S.A.')
        self.assertEqual(self.supplier.city, 'Medellin')

    def test_patch_partial_update_returns_200(self):
        """PATCH con un campo retorna 200."""
        response = self.client.patch(detail_url(self.supplier.pk), {'city': 'Cali'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Cali')

    def test_patch_updates_field_in_db(self):
        """PATCH actualiza solo el campo modificado."""
        self.client.patch(detail_url(self.supplier.pk), {'phone': '3007778888'}, format='json')
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.phone, '3007778888')

    def test_put_nonexistent_supplier_returns_404(self):
        """PUT a ID inexistente retorna 404."""
        response = self.client.put(detail_url(99999), self.full_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_unauthenticated_returns_401(self):
        """PUT sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.put(detail_url(self.supplier.pk), self.full_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SupplierDeleteTests(APITestCase):
    """Tests para DELETE /api/v1/suppliers/{id}/ (soft delete)"""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='pass1234')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.supplier = baker.make(Supplier, is_active=True, name='Para Eliminar')

    def test_delete_existing_supplier_returns_204(self):
        """DELETE de un proveedor existente retorna 204."""
        response = self.client.delete(detail_url(self.supplier.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_performs_soft_delete(self):
        """DELETE no elimina el registro; lo marca con is_active=False."""
        self.client.delete(detail_url(self.supplier.pk))
        self.supplier.refresh_from_db()
        self.assertFalse(self.supplier.is_active)
        self.assertTrue(Supplier.objects.filter(pk=self.supplier.pk).exists())

    def test_delete_supplier_disappears_from_list(self):
        """Proveedor softdeleted no aparece en el listado."""
        self.client.delete(detail_url(self.supplier.pk))
        response = self.client.get(BASE_URL)
        results = response.data.get('results', response.data)
        ids = [item['id'] for item in results]
        self.assertNotIn(self.supplier.pk, ids)

    def test_delete_nonexistent_supplier_returns_404(self):
        """DELETE a ID inexistente retorna 404."""
        response = self.client.delete(detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        """DELETE sin autenticacion retorna 401."""
        self.client.force_authenticate(user=None)
        response = self.client.delete(detail_url(self.supplier.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SupplierFilterTests(APITestCase):
    """Tests para los filtros del endpoint de proveedores."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='pass1234')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        baker.make(Supplier, city='Bogota', country='Colombia', is_active=True, _quantity=2)
        baker.make(Supplier, city='Lima', country='Peru', is_active=True, _quantity=1)

    def test_filter_by_city_returns_matching_results(self):
        """Filtro por city retorna solo proveedores de esa ciudad."""
        response = self.client.get(BASE_URL, {'city': 'Bogota'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)
        for item in results:
            self.assertEqual(item['city'], 'Bogota')

    def test_filter_by_country_returns_matching_results(self):
        """Filtro por country retorna solo proveedores de ese pais."""
        response = self.client.get(BASE_URL, {'country': 'Peru'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['country'], 'Peru')

    def test_filter_with_no_results_returns_200_empty_list(self):
        """Filtro sin coincidencias retorna 200 con lista vacia."""
        response = self.client.get(BASE_URL, {'city': 'CiudadQueNoExiste'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_search_by_name(self):
        """Busqueda por nombre retorna proveedores coincidentes."""
        baker.make(Supplier, name='Distribuidora Global', is_active=True,
                   city='Cali', country='Colombia')
        response = self.client.get(BASE_URL, {'search': 'Distribuidora Global'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        names = [item['name'] for item in results]
        self.assertIn('Distribuidora Global', names)

    def test_ordering_by_name_asc(self):
        """Ordenamiento por name ascendente funciona correctamente."""
        Supplier.objects.all().delete()
        baker.make(Supplier, name='Zeta Corp', is_active=True, city='Bogota', country='Colombia')
        baker.make(Supplier, name='Alpha Tech', is_active=True, city='Bogota', country='Colombia')
        response = self.client.get(BASE_URL, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(results[0]['name'], 'Alpha Tech')
        self.assertEqual(results[1]['name'], 'Zeta Corp')
