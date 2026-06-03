from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from model_bakery import baker
from apps.transport.models import Transport


TRANSPORT_LIST_URL = '/api/v1/transport/'


def transport_detail_url(pk):
    return f'/api/v1/transport/{pk}/'


def make_valid_payload(**kwargs):
    defaults = {
        'plate_number': 'TST-001',
        'transport_type': 'TRUCK',
        'brand': 'Kenworth',
        'model': 'T680',
        'year': 2021,
        'capacity_kg': '5000.00',
        'capacity_m3': '30.00',
        'is_available': True,
    }
    defaults.update(kwargs)
    return defaults


class TransportListCreateTests(APITestCase):
    """Tests para GET /api/v1/transport/ y POST /api/v1/transport/."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    # ---- Happy path ----

    def test_list_returns_200(self):
        baker.make(Transport, _quantity=3)
        response = self.client.get(TRANSPORT_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_all_transports(self):
        baker.make(Transport, _quantity=3)
        response = self.client.get(TRANSPORT_LIST_URL)
        self.assertEqual(response.data['count'], 3)

    def test_create_valid_data_returns_201(self):
        payload = make_valid_payload()
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_sets_correct_fields(self):
        payload = make_valid_payload(plate_number='NEW-999', brand='Volvo', model='FH16')
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.data['plate_number'], 'NEW-999')
        self.assertEqual(response.data['brand'], 'Volvo')
        self.assertEqual(response.data['model'], 'FH16')

    def test_create_returns_id_readonly_fields(self):
        payload = make_valid_payload()
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_create_all_transport_types(self):
        for i, transport_type in enumerate(['TRUCK', 'VAN', 'MOTORCYCLE', 'CARGO_BIKE']):
            payload = make_valid_payload(plate_number=f'TYPE-{i:03d}', transport_type=transport_type)
            response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data['transport_type'], transport_type)

    def test_list_empty_returns_200_empty_list(self):
        response = self.client.get(TRANSPORT_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    # ---- Unhappy path ----

    def test_create_missing_plate_number_returns_400(self):
        payload = make_valid_payload()
        del payload['plate_number']
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_transport_type_returns_400(self):
        payload = make_valid_payload()
        del payload['transport_type']
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_brand_returns_400(self):
        payload = make_valid_payload()
        del payload['brand']
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_model_returns_400(self):
        payload = make_valid_payload()
        del payload['model']
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_year_returns_400(self):
        payload = make_valid_payload()
        del payload['year']
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_capacity_kg_returns_400(self):
        payload = make_valid_payload()
        del payload['capacity_kg']
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_capacity_m3_returns_400(self):
        payload = make_valid_payload()
        del payload['capacity_m3']
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_transport_type_returns_400(self):
        payload = make_valid_payload(transport_type='HELICOPTER')
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_plate_number_returns_400(self):
        baker.make(Transport, plate_number='DUP-111')
        payload = make_valid_payload(plate_number='DUP-111')
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---- Edge cases: autenticación ----

    def test_list_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(TRANSPORT_LIST_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        payload = make_valid_payload()
        response = self.client.post(TRANSPORT_LIST_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TransportRetrieveUpdateDestroyTests(APITestCase):
    """Tests para GET/PUT/PATCH/DELETE /api/v1/transport/{id}/."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='testuser2', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.transport = baker.make(
            Transport,
            plate_number='SETUP-001',
            transport_type=Transport.TRUCK,
            brand='Mercedes',
            model='Actros',
            year=2019,
            capacity_kg='8000.00',
            capacity_m3='45.00',
            is_available=True,
        )

    # ---- Happy path ----

    def test_retrieve_returns_200(self):
        response = self.client.get(transport_detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_data(self):
        response = self.client.get(transport_detail_url(self.transport.pk))
        self.assertEqual(response.data['plate_number'], 'SETUP-001')
        self.assertEqual(response.data['brand'], 'Mercedes')

    def test_put_valid_data_returns_200(self):
        payload = make_valid_payload(
            plate_number='UPDATED-001',
            brand='Volvo',
            model='FH16',
            year=2022,
        )
        response = self.client.put(transport_detail_url(self.transport.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_updates_fields_in_db(self):
        payload = make_valid_payload(
            plate_number='PUTUPD-001',
            brand='Scania',
            model='R500',
            year=2023,
        )
        self.client.put(transport_detail_url(self.transport.pk), payload, format='json')
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.plate_number, 'PUTUPD-001')
        self.assertEqual(self.transport.brand, 'Scania')

    def test_patch_partial_update_returns_200(self):
        payload = {'brand': 'MAN', 'year': 2024}
        response = self.client.patch(transport_detail_url(self.transport.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_only_provided_fields(self):
        original_plate = self.transport.plate_number
        payload = {'brand': 'DAF'}
        self.client.patch(transport_detail_url(self.transport.pk), payload, format='json')
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.brand, 'DAF')
        self.assertEqual(self.transport.plate_number, original_plate)

    def test_delete_returns_204(self):
        response = self.client.delete(transport_detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_db(self):
        pk = self.transport.pk
        self.client.delete(transport_detail_url(pk))
        self.assertFalse(Transport.objects.filter(pk=pk).exists())

    # ---- Unhappy path ----

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(transport_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_nonexistent_returns_404(self):
        payload = make_valid_payload()
        response = self.client.put(transport_detail_url(99999), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(transport_detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_invalid_transport_type_returns_400(self):
        payload = make_valid_payload(transport_type='BOAT', plate_number='INVTYPE-01')
        response = self.client.put(transport_detail_url(self.transport.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---- Edge cases: autenticación ----

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(transport_detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_put_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        payload = make_valid_payload()
        response = self.client.put(transport_detail_url(self.transport.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(transport_detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TransportFilterTests(APITestCase):
    """Tests para filtros y búsqueda del TransportViewSet."""

    def setUp(self):
        self.user = User.objects.create_superuser(username='filteruser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.truck = baker.make(
            Transport,
            plate_number='TRK-001',
            transport_type=Transport.TRUCK,
            brand='Kenworth',
            model='T680',
            year=2020,
            capacity_kg='8000.00',
            capacity_m3='40.00',
            is_available=True,
        )
        self.van = baker.make(
            Transport,
            plate_number='VAN-001',
            transport_type=Transport.VAN,
            brand='Mercedes',
            model='Sprinter',
            year=2021,
            capacity_kg='1500.00',
            capacity_m3='12.00',
            is_available=False,
        )
        self.motorcycle = baker.make(
            Transport,
            plate_number='MOT-001',
            transport_type=Transport.MOTORCYCLE,
            brand='Honda',
            model='CB500',
            year=2022,
            capacity_kg='100.00',
            capacity_m3='1.00',
            is_available=True,
        )

    def test_filter_by_transport_type_truck(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'transport_type': 'TRUCK'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['transport_type'], 'TRUCK')

    def test_filter_by_transport_type_van(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'transport_type': 'VAN'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_by_is_available_true(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'is_available': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_filter_by_is_available_false(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'is_available': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_capacity_kg_gte(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'capacity_kg_gte': '2000'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['plate_number'], 'TRK-001')

    def test_filter_capacity_kg_lte(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'capacity_kg_lte': '200'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['plate_number'], 'MOT-001')

    def test_filter_capacity_m3_gte(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'capacity_m3_gte': '20'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_capacity_m3_lte(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'capacity_m3_lte': '5'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_search_by_plate_number(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'search': 'TRK'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_search_by_brand(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'search': 'Honda'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_search_by_model(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'search': 'Sprinter'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_no_results_returns_empty_list(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'transport_type': 'CARGO_BIKE'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_ordering_by_year_asc(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'ordering': 'year'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        years = [r['year'] for r in response.data['results']]
        self.assertEqual(years, sorted(years))

    def test_ordering_by_capacity_kg_desc(self):
        response = self.client.get(TRANSPORT_LIST_URL, {'ordering': '-capacity_kg'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        capacities = [float(r['capacity_kg']) for r in response.data['results']]
        self.assertEqual(capacities, sorted(capacities, reverse=True))

    def test_combined_filter_type_and_available(self):
        response = self.client.get(TRANSPORT_LIST_URL, {
            'transport_type': 'TRUCK',
            'is_available': 'true',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
