# Spec: Shipments (Envíos)

## Modelos

### Shipment

| Campo                     | Tipo Django            | Constraints                              | Notas                                                        |
| ------------------------- | ---------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| `id`                      | BigAutoField (default) | PK, autoincrement                        | No declarar — Django auto                                    |
| `tracking_number`         | CharField(50)          | NOT NULL, unique=True                    | Auto-generado si no se provee (ver lógica en `save`)         |
| `customer`                | ForeignKey             | FK → Customer, NOT NULL, PROTECT         | related_name='shipments'                                     |
| `driver`                  | ForeignKey             | FK → Driver, nullable, SET_NULL          | related_name='shipments'                                     |
| `transport`               | ForeignKey             | FK → Transport, nullable, SET_NULL       | related_name='shipments'                                     |
| `route`                   | ForeignKey             | FK → Route, nullable, SET_NULL           | related_name='shipments'                                     |
| `origin_warehouse`        | ForeignKey             | FK → Warehouse, NOT NULL, PROTECT        | related_name='shipments'                                     |
| `destination_address`     | CharField(500)         | NOT NULL                                 |                                                              |
| `destination_city`        | CharField(100)         | NOT NULL                                 |                                                              |
| `destination_country`     | CharField(100)         | NOT NULL, default='Colombia'             |                                                              |
| `status`                  | CharField(20)          | NOT NULL, default='PENDING'              | choices: PENDING, CONFIRMED, IN_TRANSIT, DELIVERED, CANCELLED, RETURNED |
| `estimated_delivery_date` | DateField              | null=True, blank=True                    |                                                              |
| `actual_delivery_date`    | DateTimeField          | null=True, blank=True                    |                                                              |
| `weight_total_kg`         | DecimalField(10,3)     | NOT NULL, default=0                      | Peso acumulado de los ítems                                  |
| `base_cost`               | DecimalField(12,2)     | NOT NULL, default=0                      |                                                              |
| `calculated_cost`         | DecimalField(12,2)     | NOT NULL, default=0                      |                                                              |
| `notes`                   | TextField              | null=True, blank=True                    |                                                              |
| `created_at`              | DateTimeField          | auto_now_add=True                        |                                                              |
| `updated_at`              | DateTimeField          | auto_now=True                            |                                                              |

- `db_table = 'shipments'`
- `ordering = ['-created_at']`
- Choices:
  ```python
  PENDING = 'PENDING'
  CONFIRMED = 'CONFIRMED'
  IN_TRANSIT = 'IN_TRANSIT'
  DELIVERED = 'DELIVERED'
  CANCELLED = 'CANCELLED'
  RETURNED = 'RETURNED'
  STATUS_CHOICES = [...]
  ```
- `tracking_number` auto-generado en `save()` si está vacío:
  ```python
  import uuid
  def save(self, *args, **kwargs):
      if not self.tracking_number:
          self.tracking_number = uuid.uuid4().hex[:12].upper()
      super().save(*args, **kwargs)
  ```

### ShipmentItem

| Campo                | Tipo Django            | Constraints                       | Notas                                          |
| -------------------- | ---------------------- | --------------------------------- | ---------------------------------------------- |
| `id`                 | BigAutoField (default) | PK, autoincrement                 | No declarar — Django auto                      |
| `shipment`           | ForeignKey             | FK → Shipment, NOT NULL, CASCADE  | related_name='items'                           |
| `product`            | ForeignKey             | FK → Product, NOT NULL, PROTECT   | related_name='shipment_items'                  |
| `quantity`           | IntegerField           | NOT NULL                          |                                                |
| `unit_price_at_time` | DecimalField(12,2)     | NOT NULL                          | Snapshot del precio al momento de crear el ítem |
| `subtotal`           | DecimalField(12,2)     | NOT NULL                          | Calculado: `quantity × unit_price_at_time`     |

- `db_table = 'shipment_items'`
- `ordering = ['id']`
- `unique_together = [('shipment', 'product')]`
- CASCADE: al eliminar un shipment, sus items se eliminan

## Serializers

### ShipmentItemSerializer
- Clase: `ShipmentItemSerializer`
- Hereda: `ModelSerializer`
- Campos: `__all__`
- Campos de solo lectura: `['id', 'shipment', 'subtotal']`
  - `shipment` — inyectado desde la URL
  - `subtotal` — calculado automáticamente en `perform_create`

### ShipmentSerializer
- Clase: `ShipmentSerializer`
- Hereda: `ModelSerializer`
- Campos: `__all__`
- Campos de solo lectura: `['id', 'tracking_number', 'created_at', 'updated_at']`
  - `tracking_number` — auto-generado en el modelo

## ViewSets

### ShipmentViewSet
- Clase: `ShipmentViewSet`
- Hereda: `ModelViewSet`
- Queryset: `Shipment.objects.all().select_related('customer', 'driver', 'transport', 'route', 'origin_warehouse')`
- Sin filtro por `is_active` — shipments no tienen soft delete (ver comportamientos especiales)
- Permisos: `IsAuthenticated`
- Overrides:
  - `get_queryset`: `select_related` completo
- Acción personalizada `items`:
  ```python
  @action(detail=True, methods=['get', 'post'], url_path='items')
  def items(self, request, pk=None):
  ```
  - `GET`: listar ítems del envío
  - `POST`: crear ítem; `shipment` inyectado desde URL, `subtotal` calculado automáticamente como `quantity × unit_price_at_time`

### Lógica del POST /items/
```python
serializer.save(
    shipment=shipment,
    subtotal=data['quantity'] * data['unit_price_at_time']
)
```

## URLs

- Router: `DefaultRouter`
- Prefix: `shipments`, basename: `shipment`
- Rutas: `/api/v1/shipments/` y `/api/v1/shipments/{id}/`
- Nested por `@action`: `/api/v1/shipments/{id}/items/`

## Filtros (django-filter)

### ShipmentFilter
- Campos filtrables:
  - `status` — exact
  - `customer` — exact (por ID)
  - `driver` — exact (por ID)
  - `origin_warehouse` — exact (por ID)
  - `destination_city` — exact
- Búsqueda por texto (`SearchFilter`): `tracking_number`, `destination_address`, `destination_city`
- Ordenamiento (`OrderingFilter`): `status`, `estimated_delivery_date`, `created_at`, `calculated_cost`

## Admin

```python
class ShipmentItemInline(admin.TabularInline):
    model = ShipmentItem
    extra = 0

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ['tracking_number', 'customer', 'status', 'destination_city', 'calculated_cost', 'created_at']
    search_fields = ['tracking_number', 'destination_address', 'destination_city']
    list_filter = ['status', 'origin_warehouse', 'destination_city']
    inlines = [ShipmentItemInline]
```

## Comportamientos especiales

- **Sin soft delete** — shipments son registros de negocio permanentes; no se borran (DELETE físico pero no recomendado)
- `tracking_number` auto-generado en `save()` si no se provee
- `subtotal` en ShipmentItem es siempre `quantity × unit_price_at_time` — calculado en el ViewSet al crear
- `unit_price_at_time` es un snapshot — no cambia si el precio del producto cambia después
- `driver`, `transport`, `route` son nullable — se asignan después de crear el envío (PATCH)
- `unique_together` en items: un producto solo puede aparecer una vez por envío → `400` si se intenta duplicar
- Nested `items`:
  - `GET /api/v1/shipments/{id}/items/` — lista ítems del envío
  - `POST /api/v1/shipments/{id}/items/` — `shipment` y `subtotal` se calculan, no van en el body

## Imports del modelo
```python
import uuid
from apps.customers.models import Customer
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route
from apps.warehouses.models import Warehouse
from apps.products.models import Product
```

## Ubicación

App nueva en `apps/shipments/`:
- `apps.py`: `name = 'apps.shipments'`
- `INSTALLED_APPS`: `'apps.shipments'`
- `config/urls.py`: `include('apps.shipments.urls')`

## Criterios de aceptación

- [ ] `apps/shipments/apps.py` con `name = 'apps.shipments'`
- [ ] Dos modelos: `Shipment` y `ShipmentItem`
- [ ] `python manage.py makemigrations shipments` genera migración con 6 FKs y `unique_together`
- [ ] `python manage.py migrate` aplica sin errores
- [ ] `python manage.py check` — 0 errores
- [ ] `POST /api/v1/shipments/` sin `tracking_number` → 201 con tracking auto-generado
- [ ] `POST /api/v1/shipments/` con `status=PENDING` por defecto
- [ ] `GET /api/v1/shipments/?status=PENDING` filtra correctamente
- [ ] `POST /api/v1/shipments/{id}/items/` → 201 con `subtotal` calculado y `shipment` asignado
- [ ] `POST /api/v1/shipments/{id}/items/` con producto duplicado → 400
- [ ] `GET /api/v1/shipments/{id}/items/` → lista de ítems del envío
- [ ] Acceso sin token → 401
