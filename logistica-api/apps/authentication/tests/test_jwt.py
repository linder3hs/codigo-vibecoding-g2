"""
Tests para verificar que el JWT custom incluye is_superuser en el payload.
"""

import base64
import json

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

TOKEN_URL = '/api/v1/auth/token/'


def decode_jwt_payload(token: str) -> dict:
    payload_b64 = token.split('.')[1]
    padding = 4 - len(payload_b64) % 4
    if padding != 4:
        payload_b64 += '=' * padding
    return json.loads(base64.urlsafe_b64decode(payload_b64))


class CustomJWTClaimsTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.superuser = User.objects.create_superuser(
            username='superadmin',
            password='securepassword123',
        )
        self.regular_user = User.objects.create_user(
            username='regularuser',
            password='securepassword123',
        )

    def test_superuser_token_has_is_superuser_true(self):
        response = self.client.post(
            TOKEN_URL,
            {'username': 'superadmin', 'password': 'securepassword123'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = decode_jwt_payload(response.data['access'])
        self.assertIn('is_superuser', payload)
        self.assertTrue(payload['is_superuser'])

    def test_regular_user_token_has_is_superuser_false(self):
        response = self.client.post(
            TOKEN_URL,
            {'username': 'regularuser', 'password': 'securepassword123'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = decode_jwt_payload(response.data['access'])
        self.assertIn('is_superuser', payload)
        self.assertFalse(payload['is_superuser'])
