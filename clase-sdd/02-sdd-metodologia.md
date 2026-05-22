# SDD — Spec Driven Development

[← Anterior: Proyecto](./01-proyecto-logistica-api.md) | [Siguiente: DRF →](./03-django-rest-framework.md)

---

## ¿Qué es SDD?

**Spec Driven Development** (Desarrollo Guiado por Especificaciones) es una metodología donde **ningún código se escribe sin antes existir una especificación aprobada**.

La especificación (spec) es un documento que describe exactamente qué debe hacer el código antes de escribirlo: qué campos tiene el modelo, qué endpoints expone, qué validaciones aplica, cómo se comporta en casos especiales.

```
❌ Sin SDD:  "vamos implementando y vemos"
✅ Con SDD:  Spec aprobada → Implementación → Validación → Avanzar
```

---

## El problema que resuelve

Cuando se construye un sistema grande con muchos módulos, implementar sin especificación genera:

- **Inconsistencias** entre módulos (un campo se llama `phone` en un modelo y `phone_number` en otro)
- **Retrabajo**: se implementa algo incorrecto y hay que rehacerlo
- **Falta de visibilidad**: nadie sabe exactamente qué se va a construir hasta que ya está hecho
- **Bugs por ambigüedad**: ¿`DELETE` elimina el registro o lo desactiva?

SDD fuerza a resolver esas preguntas **antes** de escribir código.

---

## El flujo SDD

```
┌──────────┐     genera      ┌─────────────────────┐
│  Spec    │────────────────►│ spec/[módulo].md     │
│  Agent   │                 └─────────────────────┘
└──────────┘                           │
                                       │ aprobación humana ✅
                                       ▼
                              ┌──────────────┐
                              │  Implement   │◄── lee spec
                              │  Agent       │◄── lee database-schema.md
                              └──────────────┘
                                       │
                                       │ escribe código
                                       ▼
                              ┌──────────────┐
                              │  Validator   │◄── lee código generado
                              │  Agent       │◄── compara vs spec
                              └──────────────┘
                                       │
                              ┌────────┴────────┐
                              │                 │
                          ✅ OK             ❌ Errores
                              │                 │
                         Avanzar          spec/validation-report-[módulo].md
                              │                 │
                              │           Implement corrige
                              ▼
                     ┌──────────────────┐
                     │  Orchestrator    │ ← decide si iterar o avanzar
                     └──────────────────┘
```

---

## Los 4 agentes

### 1. Agente Spec

**Rol:** Analizar requerimientos y generar la especificación del módulo.

**Lo que produce:** `spec/[módulo].md` con:
- Lista completa de campos del modelo (tipos, constraints, FKs)
- Endpoints requeridos con métodos HTTP
- Comportamientos especiales (soft delete, recursos anidados, filtros)
- Validaciones a implementar en serializers
- Configuración del admin de Django

**Lo que NO hace:** Escribir código Python.

**Cuándo termina:** Cuando el humano aprueba la spec. Si hay cambios pedidos, los incorpora y presenta de nuevo.

```markdown
# Spec: Warehouses

## Modelo
| Campo | Tipo | Constraints |
|---|---|---|
| id | INTEGER | PK, autoincrement |
| name | VARCHAR(255) | NOT NULL |
...

## Endpoints
GET    /api/v1/warehouses/
POST   /api/v1/warehouses/
...

## Comportamientos especiales
- DELETE hace soft delete (is_active = False), no elimina el registro
- Filtros: city, country, is_active
```

---

### 2. Agente Implement

**Rol:** Desarrollar el código Django siguiendo la spec aprobada.

**Lo que hace:**
1. Lee `spec/[módulo].md` — sin spec no escribe código
2. Lee `docs/database-schema.md` para verificar campos
3. Implementa en orden: `models.py → serializers.py → views.py → urls.py → admin.py → filters.py`
4. Registra la app en `INSTALLED_APPS`
5. Registra las URLs en `config/urls.py`
6. Ejecuta `makemigrations` y `migrate`

**Lo que NO hace:** Ejecutar `runserver`, inventar campos que no están en la spec.

---

### 3. Agente Validator

**Rol:** Auditar el código generado por Implement. **No escribe código Python.**

**Checklist de validación:**

```
✓ Campos del modelo coinciden con database-schema.md (nombres exactos, tipos, FKs)
✓ db_table configurado correctamente en Meta
✓ Serializers cubren todos los campos requeridos
✓ ViewSet implementa los métodos necesarios
✓ Soft delete implementado donde la spec lo indica
✓ URLs registradas en router y en config/urls.py
✓ App en INSTALLED_APPS
✓ Migración generada
✓ Admin registrado
```

**Si hay errores:** Crea `spec/validation-report-[módulo].md` con lista detallada de cada problema.

**Si no hay errores:** Genera una **guía de testing manual** con:
- Cómo obtener el token JWT
- Flujo de prueba con ejemplos reales de datos
- Ejemplos de filtros y búsquedas
- Cómo verificar que el 401 funciona

---

### 4. Agente Orchestrator

**Rol:** Coordinar el flujo entre los otros tres agentes. **No escribe código.**

**Sus responsabilidades:**
- Asegura que el flujo `Spec → Implement → Validator` se cumpla siempre
- Cuando el Validator reporta errores, los comunica a Implement para corrección
- Decide cuándo el módulo está completo y se puede avanzar al siguiente
- Mantiene el contexto de qué fase está activa y qué módulos ya están validados
- Referencia constante a `docs/architecture.md` para verificar orden de desarrollo

---

## La regla fundamental

> **Implement nunca toca código sin spec aprobada. Validator nunca escribe código.**

Estas dos reglas son el núcleo de SDD. Si se rompen, el proceso pierde su valor.

---

## Archivos generados por el proceso

```
spec/
├── fase-0-setup.md              ← spec del setup inicial
├── warehouses.md                ← spec aprobada de warehouses
├── suppliers.md
├── customers.md
├── transport.md
├── products.md
├── routes.md
├── drivers.md
├── shipments.md
└── validation-report-[módulo].md  ← solo si hay errores (temporal)
```

Los archivos `spec/` son documentación viva: describen exactamente lo que el sistema hace, por qué cada decisión fue tomada, y sirven de referencia para cualquier cambio futuro.

---

## Ejemplo completo: módulo `drivers`

### Paso 1 — Spec

El agente Spec genera `spec/drivers.md`:

```markdown
## Modelo
- user_id: FK → auth_user (OneToOneField, PROTECT)
- transport_id: FK → transport (nullable, SET_NULL)
- license_number: VARCHAR(50), UNIQUE
- license_expiry: DATE
- phone: VARCHAR(20)
- is_active: BOOLEAN (soft delete)

## Comportamiento especial — Dual serializer
Para GET usa DriverReadSerializer que expone:
- user_full_name (calculado)
- user_email (calculado)
- user_username (calculado)
Para POST/PUT/PATCH usa DriverSerializer (solo IDs)
```

### Paso 2 — Aprobación humana

```
Usuario: aprobado
```

### Paso 3 — Implement

El agente Implement lee la spec y genera:

```python
# apps/drivers/views.py
class DriverViewSet(viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.request.method in ('POST', 'PUT', 'PATCH'):
            return DriverSerializer      # write: espera user_id, transport_id
        return DriverReadSerializer      # read: expone nombre completo, email

    def perform_destroy(self, instance):
        instance.is_active = False       # soft delete
        instance.save()
```

### Paso 4 — Validator

El agente Validator verifica contra la spec. Si todo está bien, entrega la guía de testing:

```
✓ OneToOneField con AUTH_USER_MODEL
✓ transport SET_NULL nullable
✓ get_serializer_class implementado
✓ perform_destroy hace soft delete
✓ Migración generada

GUÍA DE TESTING:
1. POST /api/v1/auth/token/ → obtener token
2. Crear un user en /admin/
3. POST /api/v1/drivers/ con { user: 1, license_number: "COL-001", ... }
4. GET /api/v1/drivers/ → verificar que user_full_name aparece en la respuesta
5. DELETE /api/v1/drivers/1/ → verificar que is_active=False, no elimina
```

---

## Por qué SDD funciona bien con IA

Los agentes de IA (como Claude) son muy buenos generando código, pero sin contexto claro tienden a:
- Inventar nombres de campos
- Asumir comportamientos no especificados
- Saltarse pasos

SDD **encadena** la IA en un flujo donde cada paso tiene una entrada clara (la spec) y una salida verificable (el código). El Validator cierra el ciclo y detecta cualquier desviación antes de avanzar.

---

[Siguiente: DRF →](./03-django-rest-framework.md)
