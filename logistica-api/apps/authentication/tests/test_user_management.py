"""
Tests para endpoints de gestión de usuarios (solo superadmin).

Endpoints:
  GET    /api/v1/admin/users/
  POST   /api/v1/admin/users/
  GET    /api/v1/admin/users/{id}/
  PUT    /api/v1/admin/users/{id}/
  PATCH  /api/v1/admin/users/{id}/
  DELETE /api/v1/admin/users/{id}/
  POST   /api/v1/admin/users/{id}/assign-groups/
"""

from django.contrib.auth.models import User, Group
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

TOKEN_URL = '/api/v1/auth/token/'
USERS_URL = '/api/v1/admin/users/'


def users_detail_url(user_id):
    return f'/api/v1/admin/users/{user_id}/'


def assign_groups_url(user_id):
    return f'/api/v1/admin/users/{user_id}/assign-groups/'


class UserManagementPermissionTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.superuser = User.objects.create_superuser('superadmin', password='pass1234!')
        self.regular_user = User.objects.create_user('regular', password='pass1234!')

    def _auth(self, username, password='pass1234!'):
        r = self.client.post(TOKEN_URL, {'username': username, 'password': password}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data["access"]}')

    def test_unauthenticated_returns_401(self):
        response = self.client.get(USERS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_returns_403(self):
        self._auth('regular')
        response = self.client.get(USERS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superadmin_can_list_users(self):
        self._auth('superadmin')
        response = self.client.get(USERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UserManagementCRUDTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.superuser = User.objects.create_superuser('superadmin', password='pass1234!')
        r = self.client.post(TOKEN_URL, {'username': 'superadmin', 'password': 'pass1234!'}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data["access"]}')

    def test_create_user(self):
        data = {'username': 'newuser', 'email': 'new@example.com', 'password': 'strongpass1!'}
        response = self.client.post(USERS_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_retrieve_user(self):
        user = User.objects.create_user('targetuser', password='pass1234!')
        response = self.client.get(users_detail_url(user.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'targetuser')

    def test_update_user_email(self):
        user = User.objects.create_user('updateme', email='old@example.com', password='pass1234!')
        response = self.client.patch(
            users_detail_url(user.id),
            {'email': 'new@example.com', 'password': 'pass1234!'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.email, 'new@example.com')

    def test_delete_user(self):
        user = User.objects.create_user('deleteme', password='pass1234!')
        response = self.client.delete(users_detail_url(user.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(username='deleteme').exists())

    def test_cannot_delete_self(self):
        response = self.client.delete(users_detail_url(self.superuser.id))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_assign_groups(self):
        user = User.objects.create_user('groupuser', password='pass1234!')
        group = Group.objects.create(name='Operators')
        response = self.client.post(
            assign_groups_url(user.id),
            {'group_ids': [group.id]},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertIn(group, user.groups.all())

    def test_assign_groups_replaces_existing(self):
        user = User.objects.create_user('groupuser2', password='pass1234!')
        g1 = Group.objects.create(name='GroupA')
        g2 = Group.objects.create(name='GroupB')
        user.groups.set([g1])
        self.client.post(assign_groups_url(user.id), {'group_ids': [g2.id]}, format='json')
        user.refresh_from_db()
        self.assertNotIn(g1, user.groups.all())
        self.assertIn(g2, user.groups.all())

    def test_list_includes_groups_in_response(self):
        user = User.objects.create_user('withgroups', password='pass1234!')
        g = Group.objects.create(name='SomeGroup')
        user.groups.set([g])
        response = self.client.get(users_detail_url(user.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        group_ids = [grp['id'] for grp in response.data['groups']]
        self.assertIn(g.id, group_ids)
