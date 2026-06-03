"""
Tests para los endpoints JWT de autenticación.

Endpoints cubiertos:
  POST /api/v1/auth/token/         — obtener access + refresh token
  POST /api/v1/auth/token/refresh/ — renovar access token con refresh token
"""

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase, APIClient


TOKEN_URL = '/api/v1/auth/token/'
REFRESH_URL = '/api/v1/auth/token/refresh/'
PROTECTED_URL = '/api/v1/auth/me/'  # endpoint que requiere autenticación


class TokenObtainTests(APITestCase):
    """Tests para POST /api/v1/auth/token/"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='securepassword123',
        )
        self.valid_credentials = {
            'username': 'testuser',
            'password': 'securepassword123',
        }

    # --- Happy path ---

    def test_valid_credentials_returns_200(self):
        """Credenciales válidas deben retornar HTTP 200."""
        response = self.client.post(TOKEN_URL, self.valid_credentials, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_valid_credentials_returns_access_and_refresh_tokens(self):
        """La respuesta debe contener los campos 'access' y 'refresh'."""
        response = self.client.post(TOKEN_URL, self.valid_credentials, format='json')
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_access_token_is_non_empty_string(self):
        """El token 'access' debe ser una cadena no vacía."""
        response = self.client.post(TOKEN_URL, self.valid_credentials, format='json')
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    def test_refresh_token_is_non_empty_string(self):
        """El token 'refresh' debe ser una cadena no vacía."""
        response = self.client.post(TOKEN_URL, self.valid_credentials, format='json')
        self.assertIsInstance(response.data['refresh'], str)
        self.assertTrue(len(response.data['refresh']) > 0)

    # --- Unhappy path ---

    def test_wrong_password_returns_401(self):
        """Contraseña incorrecta debe retornar HTTP 401."""
        data = {'username': 'testuser', 'password': 'wrongpassword'}
        response = self.client.post(TOKEN_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_user_returns_401(self):
        """Usuario inexistente debe retornar HTTP 401."""
        data = {'username': 'nobody', 'password': 'somepassword'}
        response = self.client.post(TOKEN_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_wrong_credentials_do_not_return_tokens(self):
        """Con credenciales incorrectas la respuesta no debe incluir tokens."""
        data = {'username': 'testuser', 'password': 'wrongpassword'}
        response = self.client.post(TOKEN_URL, data, format='json')
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)

    # --- Edge cases ---

    def test_empty_body_returns_400(self):
        """Body vacío debe retornar HTTP 400."""
        response = self.client.post(TOKEN_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_password_field_returns_400(self):
        """Omitir el campo 'password' debe retornar HTTP 400."""
        response = self.client.post(TOKEN_URL, {'username': 'testuser'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_username_field_returns_400(self):
        """Omitir el campo 'username' debe retornar HTTP 400."""
        response = self.client.post(TOKEN_URL, {'password': 'securepassword123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TokenRefreshTests(APITestCase):
    """Tests para POST /api/v1/auth/token/refresh/"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='refreshuser',
            password='securepassword123',
        )
        # Obtener tokens válidos en setUp para reutilizarlos
        token_response = self.client.post(
            TOKEN_URL,
            {'username': 'refreshuser', 'password': 'securepassword123'},
            format='json',
        )
        self.refresh_token = token_response.data['refresh']
        self.access_token = token_response.data['access']

    # --- Happy path ---

    def test_valid_refresh_token_returns_200(self):
        """Refresh token válido debe retornar HTTP 200."""
        response = self.client.post(
            REFRESH_URL, {'refresh': self.refresh_token}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_valid_refresh_token_returns_new_access_token(self):
        """La respuesta debe incluir un nuevo 'access' token."""
        response = self.client.post(
            REFRESH_URL, {'refresh': self.refresh_token}, format='json'
        )
        self.assertIn('access', response.data)
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    def test_refreshed_access_token_is_usable(self):
        """El access token obtenido via refresh debe funcionar en endpoints protegidos."""
        refresh_response = self.client.post(
            REFRESH_URL, {'refresh': self.refresh_token}, format='json'
        )
        new_access = refresh_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access}')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # --- Unhappy path ---

    def test_invalid_refresh_token_returns_401(self):
        """Refresh token inválido/alterado debe retornar HTTP 401."""
        response = self.client.post(
            REFRESH_URL, {'refresh': 'completelywrongtoken'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_refresh_token_does_not_return_access(self):
        """Refresh token inválido no debe retornar un 'access' token."""
        response = self.client.post(
            REFRESH_URL, {'refresh': 'completelywrongtoken'}, format='json'
        )
        self.assertNotIn('access', response.data)

    # --- Edge cases ---

    def test_empty_body_returns_400(self):
        """Body vacío en refresh debe retornar HTTP 400."""
        response = self.client.post(REFRESH_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_refresh_field_returns_400(self):
        """Omitir el campo 'refresh' debe retornar HTTP 400."""
        response = self.client.post(REFRESH_URL, {'other': 'value'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AccessTokenUsageTests(APITestCase):
    """Tests de uso del access token en endpoints protegidos."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='tokenuser',
            password='securepassword123',
        )
        token_response = self.client.post(
            TOKEN_URL,
            {'username': 'tokenuser', 'password': 'securepassword123'},
            format='json',
        )
        self.access_token = token_response.data['access']

    def test_access_token_allows_access_to_protected_endpoint(self):
        """Access token válido debe permitir acceso a un endpoint protegido (200)."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_no_token_on_protected_endpoint_returns_401(self):
        """Sin token en un endpoint protegido debe retornar HTTP 401."""
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_malformed_authorization_header_returns_401(self):
        """Header Authorization malformado debe retornar HTTP 401."""
        self.client.credentials(HTTP_AUTHORIZATION='InvalidHeader notavalidtoken')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_wrong_scheme_returns_401(self):
        """Usar esquema 'Token' en lugar de 'Bearer' debe retornar HTTP 401."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.access_token}')
        response = self.client.get(PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
