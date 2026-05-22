# Django REST Framework — Patrones del proyecto

[← Anterior: SDD](./02-sdd-metodologia.md) | [Siguiente: JWT y Swagger →](./04-jwt-swagger.md)

---

## ¿Qué es DRF?

**Django REST Framework (DRF)** es la librería estándar para construir APIs REST con Django. Agrega encima de Django:

- **Serializers**: convierte modelos Django ↔ JSON
- **Views / ViewSets**: maneja peticiones HTTP con menos código
- **Routers**: genera URLs automáticamente
- **Autenticación**: JWT, Session, Token
- **Paginación, filtros, búsqueda**: configuración global

---

## Patrón central: ModelViewSet + Router

El patrón que usamos en todos los módulos:

```python
# apps/warehouses/views.py
from rest_framework import viewsets
from .models import Warehouse
from .serializers import WarehouseSerializer

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.filter(is_active=True)
    serializer_class = WarehouseSerializer
```

```python
# apps/warehouses/urls.py
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')

urlpatterns = router.urls
```

Con solo eso, DRF genera automáticamente los 6 endpoints (list, create, retrieve, update, partial_update, destroy).

---

## Serializers: convirtiendo modelos a JSON

El serializer define qué campos se exponen y cómo se validan:

```python
# apps/warehouses/serializers.py
from rest_framework import serializers
from .models import Warehouse

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
```

`fields = '__all__'` expone todos los campos del modelo. `read_only_fields` previene que el cliente envíe esos campos en un POST/PUT.

---

## Soft delete: no borrar registros

En la mayoría de los módulos, `DELETE` no elimina el registro. Solo lo desactiva:

```python
# En el ViewSet
def perform_destroy(self, instance):
    instance.is_active = False
    instance.save()
```

```python
# El queryset solo devuelve registros activos
def get_queryset(self):
    return Warehouse.objects.filter(is_active=True)
```

**¿Por qué?** Los datos históricos son valiosos. Si se elimina un almacén que tiene envíos asociados, esos registros históricos perderían referencia. El soft delete mantiene la integridad.

---

## Filtros, búsqueda y ordenamiento

Configurados globalmente en `settings/base.py`, disponibles en todos los endpoints:

```python
REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}
```

En cada ViewSet se especifica qué campos:

```python
class WarehouseViewSet(viewsets.ModelViewSet):
    filterset_fields = ['city', 'country', 'is_active']
    search_fields    = ['name', 'city']
    ordering_fields  = ['name', 'capacity_m3', 'created_at']
    ordering         = ['-created_at']  # orden por defecto
```

Ejemplos de uso:
```
GET /api/v1/warehouses/?city=Bogotá
GET /api/v1/warehouses/?search=norte
GET /api/v1/warehouses/?ordering=-capacity_m3
```

---

## Paginación global

Configurada una vez, activa en todos los endpoints:

```python
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

La respuesta de cualquier lista viene paginada:

```json
{
  "count": 45,
  "next": "http://localhost:8000/api/v1/warehouses/?page=2",
  "previous": null,
  "results": [ /* los 20 primeros registros */ ]
}
```

---

## Recursos anidados con @action

Para relaciones padre-hijo (rutas con paradas, envíos con ítems) se usa el decorador `@action` en lugar de un router separado:

```python
# apps/routes/views.py
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class RouteViewSet(viewsets.ModelViewSet):

    @action(detail=True, methods=['get', 'post'], url_path='stops')
    def stops(self, request, pk=None):
        route = self.get_object()

        if request.method == 'GET':
            stops = RouteStop.objects.filter(route=route).order_by('stop_order')
            serializer = RouteStopSerializer(stops, many=True)
            return Response(serializer.data)

        serializer = RouteStopSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(route=route)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
```

Esto genera:
```
GET  /api/v1/routes/{id}/stops/  → lista las paradas de esa ruta
POST /api/v1/routes/{id}/stops/  → agrega una parada a esa ruta
```

---

## Dual serializer: diferente schema para leer y escribir

El módulo `drivers` necesita exponer datos del usuario relacionado (nombre, email) en GET, pero en POST solo recibe un ID. Se resuelve con dos serializers:

```python
# apps/drivers/serializers.py
class DriverSerializer(serializers.ModelSerializer):
    """Para POST, PUT, PATCH — el cliente envía user_id (FK)"""
    class Meta:
        model = Driver
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class DriverReadSerializer(serializers.ModelSerializer):
    """Para GET — expone datos calculados del usuario"""
    user_full_name = serializers.SerializerMethodField()
    user_email     = serializers.SerializerMethodField()
    user_username  = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = '__all__'

    @extend_schema_field(serializers.CharField())
    def get_user_full_name(self, instance):
        return f'{instance.user.first_name} {instance.user.last_name}'.strip()

    @extend_schema_field(serializers.EmailField())
    def get_user_email(self, instance):
        return instance.user.email

    @extend_schema_field(serializers.CharField())
    def get_user_username(self, instance):
        return instance.user.username
```

```python
# apps/drivers/views.py
class DriverViewSet(viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.request.method in ('POST', 'PUT', 'PATCH'):
            return DriverSerializer
        return DriverReadSerializer
```

---

## select_related: evitar el problema N+1

Cuando un serializer accede a datos de tablas relacionadas, sin `select_related` Django hace una consulta SQL por cada objeto:

```python
# ❌ N+1: 1 query para listar drivers + 1 query por driver para obtener su user
queryset = Driver.objects.filter(is_active=True)

# ✅ 1 sola query con JOIN
queryset = Driver.objects.filter(is_active=True).select_related('user', 'transport')
```

`select_related` hace un JOIN en la query original. Es obligatorio cuando el serializer accede a campos de objetos relacionados.

---

## Admin de Django

Cada módulo registra sus modelos en el panel de administración:

```python
# apps/warehouses/admin.py
from django.contrib import admin
from .models import Warehouse

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'country', 'capacity_m3', 'is_active']
    search_fields = ['name', 'city']
    list_filter = ['city', 'country', 'is_active']
```

Para modelos con relaciones padre-hijo (Shipment con ShipmentItems), se usa `TabularInline`:

```python
class ShipmentItemInline(admin.TabularInline):
    model = ShipmentItem
    extra = 0  # no mostrar filas vacías extra

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ['tracking_number', 'customer', 'status', 'destination_city']
    inlines = [ShipmentItemInline]  # ver ítems dentro del envío
```

---

[Siguiente: JWT y Swagger →](./04-jwt-swagger.md)
