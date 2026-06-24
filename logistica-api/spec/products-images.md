# Spec: Products Images (imágenes de productos en Google Cloud Storage)

> **Tipo:** Feature sobre la app `products` ya existente. **No** crea una app nueva ni endpoints nuevos.
> **Alcance cerrado:** una sola imagen por producto, almacenada en un bucket **privado** de GCS y servida mediante **signed URLs** temporales. La imagen viaja dentro de los `create`/`update` existentes de `products`.

---

## Infraestructura GCP (ya creada — solo se usa, no se rehace)

| Recurso             | Valor                                                          |
| ------------------- | ------------------------------------------------------------- |
| Proyecto GCP        | `mercados-189423`                                             |
| Bucket privado      | `mercados-189423-images` (us-central1, UBLA, PAP enforced)    |
| Service Account     | `logistica-storage@mercados-189423.iam.gserviceaccount.com`   |
| Rol del SA          | `roles/storage.objectAdmin` (acotado solo al bucket)          |
| Key local           | `secrets/gcs-logistica-storage.json` (gitignored)             |

> El bucket es privado (`public-access-prevention: enforced`, UBLA activo). Por eso **toda** URL de imagen debe ser una signed URL temporal — nunca una URL pública.

---

## Requerimientos funcionales

1. Un producto puede tener **cero o una** imagen (`image` nullable/blank).
2. La imagen se **sube** en el mismo request de `POST /api/v1/products/` (create) o `PUT`/`PATCH /api/v1/products/{id}/` (update), vía `multipart/form-data`.
3. La imagen se **almacena** en el bucket privado de GCS bajo el prefijo `products/`.
4. La respuesta de lectura (`GET`) **nunca** expone el path interno como URL pública: devuelve `image_url`, una **signed URL** firmada por el backend con **expiración de 30 minutos**.
5. Si el producto no tiene imagen, `image_url` es `null`.
6. Validación de subida: solo archivos de imagen (lo garantiza `ImageField` + Pillow) y **tamaño máximo 5 MB**.
7. El borrado de producto sigue siendo **soft delete** (`is_active=False`); el archivo en GCS **no** se elimina en esta etapa.

### Fuera de alcance (documentado como futuro, NO implementar)

- Multi-imagen / galería por producto.
- Generación de thumbnails / variantes de tamaño.
- Subida directa del cliente a GCS mediante signed URL de subida (presigned upload).
- Limpieza/borrado del archivo en GCS al hacer soft delete o al reemplazar la imagen.

---

## Dependencias a agregar

Agregar a `requirements/base.txt`:

```
django-storages[google]
Pillow
```

> `django-storages[google]` arrastra `google-cloud-storage`. `Pillow` es requerido por `ImageField` para validar que el archivo es una imagen.

---

## Cambios archivo por archivo

### 1. `config/settings/base.py`

- Agregar `'storages'` a `INSTALLED_APPS` (sección third-party).
- Importar `timedelta` (ya está importado en `base.py`).
- Agregar bloque de configuración de Google Cloud Storage:

```python
# Google Cloud Storage (imágenes de productos)
GS_BUCKET_NAME = config('GS_BUCKET_NAME', default='mercados-189423-images')
GS_PROJECT_ID = config('GS_PROJECT_ID', default='mercados-189423')
GS_QUERYSTRING_AUTH = True            # genera signed URLs en .url
GS_DEFAULT_ACL = None                 # obligatorio con UBLA (sin ACLs por objeto)
GS_EXPIRATION = timedelta(minutes=30) # vida de la signed URL
GS_FILE_OVERWRITE = False             # no sobreescribir; renombra si colisiona
```

- Las credenciales se proveen vía variable de entorno `GOOGLE_APPLICATION_CREDENTIALS` (apuntando a `secrets/gcs-logistica-storage.json`). El backend `GoogleCloudStorage` las toma automáticamente del entorno; **no** se hardcodean en settings.

> **Importante:** No definir `STORAGES['default']` en `base.py`. El backend `default` se fija explícitamente en `development.py` y `production.py` (ver abajo) para que ambos entornos usen GCS de forma idéntica.

### 2. `config/settings/development.py`

- Agregar bloque `STORAGES` que fije el `default` a GCS (development hoy no define `STORAGES`, así que se crea):

```python
STORAGES = {
    'default': {
        'BACKEND': 'storages.backends.gcloud.GoogleCloudStorage',
    },
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
}
```

### 3. `config/settings/production.py`

- **Reemplazar** el `default` actual (`django.core.files.storage.FileSystemStorage`) por el backend de GCS. Mantener `staticfiles` con whitenoise tal cual:

```python
STORAGES = {
    'default': {
        'BACKEND': 'storages.backends.gcloud.GoogleCloudStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}
```

### 4. `apps/products/models.py`

- Agregar el campo `image` al modelo `Product`:

```python
image = models.ImageField(upload_to='products/', null=True, blank=True)
```

- Colocarlo de forma coherente (p. ej. tras `stock_quantity`, antes de `is_active`). No tocar el resto de campos ni `Meta`.

### 5. `apps/products/migrations/`

- Generar nueva migración con `makemigrations products` (agrega la columna `image`). La columna en BD guarda el **path relativo** del objeto (`products/<archivo>`), no la URL firmada.

### 6. `apps/products/serializers.py`

El serializer actual usa `fields = '__all__'` y `read_only_fields = ['id', 'created_at', 'updated_at']`. Cambios:

- `image`: campo de **escritura**. `ImageField(required=False, allow_null=True)`. Se usa para subir el archivo en create/update.
- `image_url`: campo de **solo lectura**, `SerializerMethodField`. Devuelve `obj.image.url` (que con `GS_QUERYSTRING_AUTH=True` ya es una signed URL temporal) o `None` si no hay imagen.
- Método:

```python
def get_image_url(self, obj):
    if obj.image:
        return obj.image.url
    return None
```

- Validación custom `validate_image`: rechazar archivos mayores a **5 MB** (`5 * 1024 * 1024`). `ImageField` + Pillow ya validan que el contenido sea una imagen, así que aquí solo se valida tamaño. Mensaje de error en español.
- `image_url` debe ir en `read_only_fields` (o declararse como `read_only=True` por ser `SerializerMethodField`).

> Con `fields = '__all__'`, `image_url` (al no ser un campo del modelo) debe declararse explícitamente como campo del serializer para que aparezca en la respuesta.

### 7. `apps/products/views.py`

- Importar los parsers de DRF y agregarlos al `ProductViewSet`:

```python
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
...
parser_classes = [MultiPartParser, FormParser, JSONParser]
```

- **No** se crean acciones `@action` ni endpoints nuevos. `MultiPartParser`/`FormParser` permiten el `multipart/form-data` con archivo; `JSONParser` mantiene la compatibilidad para requests sin imagen (JSON puro).
- No cambia `get_queryset`, `perform_destroy` (soft delete), permisos ni filtros existentes.

### 8. `apps/products/admin.py`

- (Opcional, recomendado) Mostrar el campo `image` en el form del admin para poder subir/ver la imagen del producto. No es obligatorio para el alcance funcional del endpoint.

### 9. `.env.example` y `.env`

- Documentar las variables nuevas:

```ini
GS_BUCKET_NAME=mercados-189423-images
GS_PROJECT_ID=mercados-189423
GOOGLE_APPLICATION_CREDENTIALS=secrets/gcs-logistica-storage.json
```

> En Railway, `GOOGLE_APPLICATION_CREDENTIALS` y el contenido de la key deben proveerse según el mecanismo de secrets de Railway (fuera del alcance de código de esta spec, pero debe documentarse en el deploy).

---

## Contrato del endpoint (para el frontend)

Sin endpoints nuevos. La imagen viaja en los endpoints existentes de productos.

### Campos nuevos en el recurso `product`

| Campo       | Dirección       | Tipo                 | Notas                                                              |
| ----------- | --------------- | -------------------- | ------------------------------------------------------------------ |
| `image`     | **write-only**  | archivo (binario)    | Se envía en `multipart/form-data`. Opcional. Máx **5 MB**, imagen. |
| `image_url` | **read-only**   | string \| `null`     | Signed URL temporal de GCS. Expira a los **30 minutos**.           |

### Crear/actualizar **con** imagen

- Método: `POST /api/v1/products/` o `PATCH /api/v1/products/{id}/`
- `Content-Type: multipart/form-data`
- Body: todos los campos del producto como campos de formulario + `image` = archivo.

### Crear/actualizar **sin** imagen

- Se puede seguir enviando `application/json` (gracias a `JSONParser`). El campo `image` se omite.

### Leer producto(s)

- `GET /api/v1/products/` o `GET /api/v1/products/{id}/`
- Respuesta incluye `image_url`: signed URL si hay imagen, `null` si no.

```json
{
  "id": 12,
  "name": "Laptop X",
  "sku": "LAP-001",
  "image_url": "https://storage.googleapis.com/mercados-189423-images/products/abc123.jpg?X-Goog-Signature=...",
  "image": null
}
```

> **Importante para el frontend:** `image_url` es **temporal (30 min)**. No cachearla de forma persistente; volver a pedir el producto para obtener una URL fresca cuando expire. Para mostrar una imagen subida, leer siempre `image_url`, nunca `image`.

---

## Validaciones

| Validación                  | Dónde            | Regla                                                       |
| --------------------------- | ---------------- | ---------------------------------------------------------- |
| Es una imagen válida        | `ImageField` + Pillow | Rechaza archivos que no sean imágenes decodificables. |
| Tamaño máximo               | `validate_image` | ≤ 5 MB (`5 * 1024 * 1024` bytes), si no error 400.         |
| Campo opcional              | serializer       | `required=False, allow_null=True` — producto sin imagen válido. |

---

## Comportamientos especiales

- **Soft delete:** sin cambios. `perform_destroy` sigue marcando `is_active=False`. El archivo en GCS **no** se borra (fuera de alcance).
- **Reemplazo de imagen:** al actualizar con un nuevo archivo, `GS_FILE_OVERWRITE=False` hace que GCS guarde un objeto nuevo (nombre con sufijo si colisiona). El archivo anterior **queda huérfano** en el bucket (limpieza fuera de alcance — documentado como futuro).
- **Lógica de negocio:** ninguna nueva más allá del manejo del archivo y la generación de signed URL (automática vía `GS_QUERYSTRING_AUTH`).

---

## Criterios de aceptación

- [ ] `django-storages[google]` y `Pillow` agregados a `requirements/base.txt` e instalados.
- [ ] `'storages'` agregado a `INSTALLED_APPS` en `base.py`.
- [ ] `base.py` define `GS_BUCKET_NAME`, `GS_PROJECT_ID`, `GS_QUERYSTRING_AUTH=True`, `GS_DEFAULT_ACL=None`, `GS_EXPIRATION=timedelta(minutes=30)`, `GS_FILE_OVERWRITE=False`.
- [ ] `development.py` y `production.py` fijan `STORAGES['default']` a `storages.backends.gcloud.GoogleCloudStorage`; `production.py` ya no usa `FileSystemStorage` y conserva whitenoise para `staticfiles`.
- [ ] `Product` tiene el campo `image = models.ImageField(upload_to='products/', null=True, blank=True)` con su migración aplicada.
- [ ] El serializer expone `image` (write, opcional) e `image_url` (read-only) que devuelve la signed URL o `null`.
- [ ] `validate_image` rechaza archivos > 5 MB con error 400 en español.
- [ ] `ProductViewSet` tiene `parser_classes = [MultiPartParser, FormParser, JSONParser]` y **no** define endpoints nuevos.
- [ ] `POST` con `multipart/form-data` + `image` crea el producto y sube el archivo a `gs://mercados-189423-images/products/`.
- [ ] `POST`/`PATCH` con `application/json` sin imagen siguen funcionando.
- [ ] `GET` de un producto con imagen devuelve `image_url` como signed URL (`storage.googleapis.com/...?X-Goog-Signature=...`); sin imagen devuelve `null`.
- [ ] Variables `GS_BUCKET_NAME`, `GS_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS` documentadas en `.env.example`.
- [ ] `python manage.py check` sin errores.
