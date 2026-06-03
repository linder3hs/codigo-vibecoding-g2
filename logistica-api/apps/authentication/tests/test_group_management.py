"""
Tests para endpoints de gestión de groups/roles (solo superadmin).

Endpoints:
  GET    /api/v1/admin/groups/
  POST   /api/v1/admin/groups/
  GET    /api/v1/admin/groups/{id}/
  PUT    /api/v1/admin/groups/{id}/
  DELETE /api/v1/admin/groups/{id}/
"""

from django.contrib.auth.models import User, Group
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

TOKEN_URL = '/api/v1/auth/token/'
GROUPS_URL = '/api/v1/admin/groups/'


def groups_detail_url(group_id):
    return f'/api/v1/admin/groups/{group_id}/'


class GroupManagementPermissionTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.superuser = User.objects.create_superuser('superadmin2', password='pass1234!')
        self.regular_user = User.objects.create_user('regular2', password='pass1234!')

    def _auth(self, username, password='pass1234!'):
        r = self.client.post(TOKEN_URL, {'username': username, 'password': password}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data["access"]}')

    def test_unauthenticated_returns_401(self):
        response = self.client.get(GROUPS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_cannot_list_groups(self):
        self._auth('regular2')
        response = self.client.get(GROUPS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_cannot_create_group(self):
        self._auth('regular2')
        response = self.client.post(GROUPS_URL, {'name': 'Forbidden'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GroupManagementCRUDTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.superuser = User.objects.create_superuser('superadmin3', password='pass1234!')
        r = self.client.post(TOKEN_URL, {'username': 'superadmin3', 'password': 'pass1234!'}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data["access"]}')

    def test_list_groups(self):
        Group.objects.create(name='Operators')
        response = self.client.get(GROUPS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_group(self):
        response = self.client.post(GROUPS_URL, {'name': 'Drivers'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Group.objects.filter(name='Drivers').exists())

    def test_retrieve_group(self):
        group = Group.objects.create(name='Managers')
        response = self.client.get(groups_detail_url(group.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Managers')

    def test_update_group(self):
        group = Group.objects.create(name='OldName')
        response = self.client.put(groups_detail_url(group.id), {'name': 'NewName'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        group.refresh_from_db()
        self.assertEqual(group.name, 'NewName')

    def test_delete_group(self):
        group = Group.objects.create(name='ToDelete')
        response = self.client.delete(groups_detail_url(group.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Group.objects.filter(name='ToDelete').exists())
