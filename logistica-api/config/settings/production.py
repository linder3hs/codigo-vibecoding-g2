from .base import *
import dj_database_url
from decouple import config

DEBUG = False
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

RAILWAY_DOMAIN = config('RAILWAY_PUBLIC_DOMAIN', default='')
if RAILWAY_DOMAIN:
    ALLOWED_HOSTS.append(RAILWAY_DOMAIN)
    CSRF_TRUSTED_ORIGINS = [f'https://{RAILWAY_DOMAIN}']


DATABASES = {
    'default': dj_database_url.config(default=config('DATABASE_URL'))
}

MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

STORAGES = {
    'default': {
        'BACKEND': 'storages.backends.gcloud.GoogleCloudStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# Credenciales de GCS: Railway inyecta variables, no archivos.
# El JSON completo de la service account viaja en la env var GCS_CREDENTIALS_JSON.
import json
from google.oauth2 import service_account

GS_CREDENTIALS = service_account.Credentials.from_service_account_info(
    json.loads(config('GCS_CREDENTIALS_JSON'))
)

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


