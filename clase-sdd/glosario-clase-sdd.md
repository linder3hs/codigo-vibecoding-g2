# Glosario Clase 05 — Logística API y SDD

> API REST con Django, metodología SDD con agentes de IA, JWT, y documentación automática.

---

## Metodología

---

### SDD (Spec Driven Development)

**Qué es:** Metodología donde ningún código se escribe sin una especificación aprobada. La spec define campos, endpoints, validaciones y comportamientos antes de implementar.

**Flujo:** Spec → aprobación humana → Implement → Validator → Orchestrator decide si avanzar.

**Por qué:** Elimina ambigüedad, reduce retrabajo y garantiza que el código refleje exactamente lo que se necesita.

---

### Especificación (spec)

**Qué es:** Documento Markdown que describe completamente un módulo antes de implementarlo. Incluye campos del modelo, endpoints, validaciones y comportamientos especiales.

**Dónde vive:** `spec/[módulo].md`

**Quién la genera:** El agente Spec. Quién la aprueba: el humano.

---

### Agente de IA

**Qué es:** Un asistente de IA con un rol específico, instrucciones definidas y restricciones claras sobre lo que puede y no puede hacer.

**En SDD:** Spec, Implement, Validator, Orchestrator son los 4 agentes. Cada uno tiene una responsabilidad única y no puede invadir la del otro.

---

### Orchestrator

**Qué es:** El agente coordinador del flujo SDD. No escribe código ni specs. Solo coordina: decide cuándo avanzar al siguiente módulo y qué hacer cuando el Validator reporta errores.

---

### Validator

**Qué es:** Agente que audita el código generado por Implement. Compara el código contra la spec, el schema de BD y la arquitectura del proyecto.

**Restricción clave:** No escribe código Python. Solo reporta errores o confirma que todo está correcto.

---

### Soft delete

**Qué es:** Patrón donde `DELETE` no elimina el registro de la base de datos. En cambio, marca un campo `is_active = False`. El registro sigue existiendo pero el sistema lo trata como eliminado.

**Por qué:** Preserva integridad referencial e historial. Un almacén "eliminado" que tenía envíos asociados no rompe los registros históricos.

```python
def perform_destroy(self, instance):
    instance.is_active = False
    instance.save()
```

---

## Django y DRF

---

### Django REST Framework (DRF)

**Qué es:** Librería que extiende Django para construir APIs REST. Agrega serializers, ViewSets, routers, paginación, filtros y autenticación.

---

### ModelViewSet

**Qué es:** Clase de DRF que genera los 6 endpoints CRUD automáticamente (list, create, retrieve, update, partial_update, destroy) a partir de un modelo y un serializer.

```python
class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.filter(is_active=True)
    serializer_class = WarehouseSerializer
```

---

### Serializer

**Qué es:** Clase DRF que convierte un modelo Django a JSON (para respuestas) y JSON a un modelo Django (para guardar). También valida los datos de entrada.

**Análogo a:** El schema de Prisma en el proyecto anterior, pero en Python y con validación incluida.

---

### DefaultRouter

**Qué es:** Clase DRF que genera automáticamente las URLs de un ViewSet. Con `router.register('warehouses', WarehouseViewSet)` crea todas las rutas necesarias.

---

### @action

**Qué es:** Decorador DRF para agregar endpoints personalizados a un ViewSet. Se usa para recursos anidados como `/routes/{id}/stops/` sin necesitar un router separado.

---

### SerializerMethodField

**Qué es:** Campo de serializer cuyo valor se calcula con un método `get_[nombre]` en lugar de venir directamente del modelo.

```python
user_full_name = serializers.SerializerMethodField()

def get_user_full_name(self, instance):
    return f'{instance.user.first_name} {instance.user.last_name}'.strip()
```

---

### select_related

**Qué es:** Método de queryset Django que hace un JOIN SQL para cargar objetos relacionados en una sola query. Previene el problema N+1.

```python
Driver.objects.filter(is_active=True).select_related('user', 'transport')
# ↑ 1 query con JOIN   vs   1 query + N queries sin select_related
```

---

### Problema N+1

**Qué es:** Anti-patrón donde listar N objetos genera N+1 consultas SQL: 1 para la lista + 1 por cada objeto para cargar sus relaciones.

**Solución:** `select_related` (para ForeignKey y OneToOne) o `prefetch_related` (para ManyToMany).

---

### INSTALLED_APPS

**Qué es:** Lista en `settings.py` que le dice a Django qué apps están activas. Una app debe estar aquí para que Django procese sus modelos, migraciones y admin.

---

### Migración

**Qué es:** Archivo Python generado por `makemigrations` que describe cómo cambiar la estructura de la base de datos. Se ejecuta con `migrate`. Funciona como un commit de git para el schema de BD.

```bash
python manage.py makemigrations   # genera el archivo de migración
python manage.py migrate          # aplica los cambios a la BD
```

---

## JWT y Autenticación

---

### JWT (JSON Web Token)

**Qué es:** Token firmado criptográficamente que el servidor genera al hacer login. Tiene tres partes: `header.payload.signature`. El servidor puede verificar su autenticidad sin consultar la base de datos.

**Estructura:**
```
eyJhbGciOiJIUzI1NiJ9    ← header  (algoritmo)
.eyJ1c2VySWQiOjF9        ← payload (datos: user_id, exp)
.SflKxwRJSMeKKF2QT4fw   ← signature (firma con SECRET_KEY)
```

---

### Access Token

**Qué es:** JWT de corta duración (1 hora) que se envía en cada request. Si se compromete, solo es válido por 1 hora.

```
Authorization: Bearer eyJ...
```

---

### Refresh Token

**Qué es:** JWT de larga duración (7 días) que solo se usa para obtener un nuevo access token cuando el anterior expira. Se guarda más cuidadosamente que el access token.

---

### Bearer Token

**Qué es:** Esquema de autenticación HTTP donde el token se envía en el header `Authorization` con el prefijo `Bearer`.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Documentación

---

### drf-spectacular

**Qué es:** Librería que genera automáticamente la documentación OpenAPI 3.0 a partir del código Django y DRF. No requiere escribir la documentación manualmente.

**Diferencia clave vs swagger-jsdoc:** La documentación siempre está sincronizada con el código porque se genera desde él.

---

### OpenAPI 3.0

**Qué es:** Estándar para describir APIs REST. Define un formato YAML/JSON que describe endpoints, parámetros, schemas y respuestas.

---

### Swagger UI

**Qué es:** Interfaz web interactiva que renderiza un spec OpenAPI. Permite ver todos los endpoints y ejecutar peticiones desde el navegador.

**Acceso en el proyecto:** `http://localhost:8000/api/v1/docs/`

---

### @extend_schema_field

**Qué es:** Decorador de drf-spectacular para indicar explícitamente el tipo de un `SerializerMethodField`. Sin él, Spectacular no puede inferir el tipo y lanza un warning.

```python
@extend_schema_field(serializers.EmailField())
def get_user_email(self, instance):
    return instance.user.email
```

---

## Base de datos

---

### OneToOneField

**Qué es:** Relación en Django donde cada instancia de un modelo se relaciona con exactamente una instancia de otro. Garantizado a nivel de BD con un índice UNIQUE.

```python
user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
```

En el proyecto: cada `Driver` tiene exactamente un `auth_user`. Un usuario no puede ser conductor dos veces.

---

### on_delete=PROTECT

**Qué es:** Comportamiento cuando se intenta eliminar un objeto que tiene registros relacionados. `PROTECT` lanza un error en lugar de permitir la eliminación.

**Analogía:** No puedes eliminar un cliente que tiene envíos activos.

---

### on_delete=SET_NULL

**Qué es:** Cuando se elimina el objeto referenciado, el campo FK se pone en `NULL` en lugar de eliminar el registro relacionado.

```python
transport = models.ForeignKey(Transport, on_delete=models.SET_NULL, null=True, blank=True)
```

En el proyecto: si se elimina un transporte, los conductores que lo tenían asignado quedan con `transport_id = NULL`.

---

### on_delete=CASCADE

**Qué es:** Cuando se elimina el objeto padre, se eliminan automáticamente todos sus hijos.

En el proyecto: si se elimina un `Shipment`, todos sus `ShipmentItem` también se eliminan. Tiene sentido porque los ítems no existen sin el envío.

---

### unique_together

**Qué es:** Constraint de BD que garantiza que la combinación de dos campos sea única. A nivel de tabla, no solo a nivel de columna.

```python
class Meta:
    unique_together = [('shipment', 'product')]
    # Un producto no puede aparecer dos veces en el mismo envío
```

---

### auth_user (Django built-in)

**Qué es:** Tabla de usuarios que Django crea automáticamente. Provee: `username`, `password`, `email`, `first_name`, `last_name`, `is_active`.

En el proyecto: los conductores (`drivers`) extienden `auth_user` via `OneToOneField` en lugar de crear una tabla de usuarios separada.

---

[← Volver al índice](../README.md)
