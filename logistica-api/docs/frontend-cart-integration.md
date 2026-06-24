# Integración del Carrito de Compras — Guía para Frontend

## Resumen del flujo

```
1. GET /api/v1/products/          → listar productos disponibles
2. [usuario agrega items al carrito — estado local]
3. POST /api/v1/auth/token/        → obtener JWT (si no tiene sesión activa)
4. POST /api/v1/payments/checkout/ → crear sesión de pago en Stripe
5. Redirigir al usuario a checkout_url (página hosteada por Stripe)
6. Stripe redirige al usuario a STRIPE_SUCCESS_URL o STRIPE_CANCEL_URL
```

El backend no guarda el estado del carrito. El carrito vive completamente en el frontend (localStorage, estado de React, etc.) hasta el momento del checkout.

---

## Base URL

| Entorno     | URL                                      |
|-------------|------------------------------------------|
| Desarrollo  | `http://localhost:8000`                  |
| Producción  | `https://<dominio-railway>.railway.app`  |

Todos los endpoints usan el prefijo `/api/v1/`.

---

## Autenticación

Todos los endpoints de pagos requieren JWT. Incluirlo en cada request:

```
Authorization: Bearer <access_token>
```

### Obtener token

```
POST /api/v1/auth/token/
```

**Request:**
```json
{
  "username": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Response `200`:**
```json
{
  "access": "eyJhbGc...",
  "refresh": "eyJhbGc..."
}
```

El `access` token expira en **1 hora**. Usar `POST /api/v1/auth/token/refresh/` con el `refresh` token para renovarlo.

---

## Endpoints

### 1. Listar productos

```
GET /api/v1/products/
```

No requiere autenticación. Devuelve solo productos con `is_active: true`.

**Query params opcionales:**

| Parámetro          | Tipo    | Descripción                              |
|--------------------|---------|------------------------------------------|
| `search`           | string  | Busca en nombre, SKU y descripción       |
| `category`         | string  | Filtra por categoría exacta              |
| `unit_price_gte`   | decimal | Precio mínimo                            |
| `unit_price_lte`   | decimal | Precio máximo                            |
| `stock_quantity_gte` | int   | Stock mínimo disponible                  |
| `ordering`         | string  | `unit_price`, `-unit_price`, `-created_at` |
| `page`             | int     | Paginación (20 items por página)         |

**Response `200`:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Cisco Catalyst 9300 48-Port Switch",
      "sku": "NET-SW-C9300-48",
      "description": "Enterprise-grade 48-port PoE+ switch...",
      "category": "Networking",
      "unit_price": "8500.00",
      "stock_quantity": 12,
      "is_active": true,
      "image_url": "https://storage.googleapis.com/...",
      "stripe_price_id": "price_1ABC...",
      "created_at": "2025-06-23T10:00:00Z"
    }
  ]
}
```

> **Importante:** Solo mostrar en el carrito productos donde `stripe_price_id != null`. Si `stripe_price_id` es `null`, el producto aún no está sincronizado con Stripe y no puede ser comprado.

---

### 2. Crear sesión de checkout

```
POST /api/v1/payments/checkout/
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 },
    { "product_id": 5, "quantity": 4 }
  ]
}
```

| Campo        | Tipo    | Restricciones                     |
|--------------|---------|-----------------------------------|
| `product_id` | integer | ≥ 1, debe existir y estar activo  |
| `quantity`   | integer | entre 1 y 1000                    |

> No se permiten `product_id` duplicados dentro del mismo request.

**Response `200`:**
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_a1b2c3...",
  "amount_total": "19250.00",
  "items_count": 3
}
```

**Errores posibles:**

| Status | Causa                                                      |
|--------|------------------------------------------------------------|
| `400`  | `items` vacío, `product_id` duplicado, o producto sin `stripe_price_id` |
| `401`  | Sin token o token expirado                                 |
| `404`  | Uno o más `product_id` no existen o están inactivos        |

---

## Flujo completo de implementación

### Paso 1 — Cargar el catálogo

```js
const response = await fetch(`${BASE_URL}/api/v1/products/?stock_quantity_gte=1`);
const data = await response.json();

// Solo productos con stripe_price_id
const buyableProducts = data.results.filter(p => p.stripe_price_id !== null);
```

### Paso 2 — Gestionar el carrito (estado local)

```js
// Estructura sugerida para el carrito
const cart = [
  { product_id: 1, quantity: 2, name: "Cisco Catalyst...", unit_price: "8500.00" },
  { product_id: 3, quantity: 1, name: "Dell PowerEdge...", unit_price: "22000.00" }
];

// Total local (solo referencial — Stripe calcula el total definitivo)
const localTotal = cart.reduce(
  (sum, item) => sum + parseFloat(item.unit_price) * item.quantity,
  0
);
```

### Paso 3 — Iniciar el checkout

```js
async function startCheckout(cart, accessToken) {
  const response = await fetch(`${BASE_URL}/api/v1/payments/checkout/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Checkout failed');
  }

  const { checkout_url } = await response.json();
  window.location.href = checkout_url; // redirigir a Stripe
}
```

### Paso 4 — Páginas de retorno

Stripe redirige al usuario cuando el pago termina. Configurar estas rutas en el frontend:

| Resultado | URL configurada en el backend        | Qué mostrar                          |
|-----------|--------------------------------------|--------------------------------------|
| Éxito     | `STRIPE_SUCCESS_URL?session_id=cs_...` | Confirmación del pedido              |
| Cancelado | `STRIPE_CANCEL_URL`                  | El carrito tal como estaba           |

En la página de éxito, el parámetro `session_id` llega en la URL (`?session_id=cs_test_...`). Úsalo para mostrar un resumen si lo necesitas.

```js
// Ejemplo en React — página de éxito
const params = new URLSearchParams(window.location.search);
const sessionId = params.get('session_id'); // "cs_test_a1b2c3..."
```

> El estado del pago (`COMPLETED`) lo actualiza el backend automáticamente vía webhook de Stripe. El frontend no necesita hacer ninguna llamada adicional para confirmar el pago.

---

## Tarjetas de prueba (entorno de desarrollo)

Usar estas tarjetas en la página de Stripe al probar:

| Caso                  | Número de tarjeta      | Fecha  | CVC  |
|-----------------------|------------------------|--------|------|
| Pago exitoso          | `4242 4242 4242 4242`  | Futura | Cualquiera |
| Fondos insuficientes  | `4000 0000 0000 9995`  | Futura | Cualquiera |
| Requiere autenticación| `4000 0025 0000 3155`  | Futura | Cualquiera |

---

## Consideraciones importantes

### El carrito es stateless en el backend
El backend no tiene endpoint para "guardar carrito". Persistir el carrito entre sesiones usando `localStorage` o el estado global de la app (Zustand, Redux, Context API).

### No calcular precios en el frontend
El `amount_total` de la response es referencial. Stripe calcula el total definitivo usando los precios registrados en su sistema. **No mostrar un total "confirmado" hasta recibir el webhook** (o hasta que el usuario vuelva de la página de éxito).

### Manejo del token expirado
Si el checkout falla con `401`, renovar el token antes de reintentar:

```js
async function refreshToken(refreshToken) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  const data = await res.json();
  return data.access;
}
```

### Stock
El backend no valida stock al momento del checkout (Stripe no lo sabe). Si necesitan validación de stock, hacer un `GET /api/v1/products/{id}/` antes de llamar al checkout y comparar `stock_quantity` con la cantidad en el carrito.

---

## Referencia rápida

| Acción                     | Método | Endpoint                       | Auth |
|----------------------------|--------|--------------------------------|------|
| Listar productos            | GET    | `/api/v1/products/`            | No   |
| Ver producto individual     | GET    | `/api/v1/products/{id}/`       | No   |
| Obtener token JWT           | POST   | `/api/v1/auth/token/`          | No   |
| Renovar token               | POST   | `/api/v1/auth/token/refresh/`  | No   |
| Crear sesión de checkout    | POST   | `/api/v1/payments/checkout/`   | Sí   |

Documentación interactiva (Swagger): `GET /api/v1/docs/`
