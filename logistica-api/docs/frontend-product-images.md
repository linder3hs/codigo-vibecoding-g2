# Imágenes de productos — Guía para Frontend

Cómo subir y mostrar la imagen de un producto. Aplica a `/api/v1/products/`.

## Qué cambió

El recurso `products` tiene **2 campos nuevos**:

| Campo       | Tipo   | Dirección     | Notas                                                     |
| ----------- | ------ | ------------- | --------------------------------------------------------- |
| `image`     | file   | **escritura** | Solo en `multipart/form-data`. Opcional. Máx **5 MB**.    |
| `image_url` | string | **lectura**   | URL firmada temporal (~30 min) o `null` si no hay imagen. |

> El front **sube** por `image` y **muestra** por `image_url`. Nunca uses el campo `image` para mostrar (es la ruta interna, no una URL servible).

## Subir / editar imagen

Cambiar el `Content-Type` a `multipart/form-data` (antes era JSON). La imagen viaja en los mismos endpoints de siempre:

```
POST  /api/v1/products/          # crear con imagen
PATCH /api/v1/products/{id}/     # reemplazar imagen
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

```js
const fd = new FormData();
fd.append("name", "Laptop X");
fd.append("sku", "LAP-001");
// ...resto de campos del producto...
fd.append("image", fileInput.files[0]); // opcional

await api.post("/api/v1/products/", fd);
// IMPORTANTE: no setear Content-Type a mano; el navegador pone el boundary correcto
```

## Mostrar imagen

```js
const { data } = await api.get(`/api/v1/products/${id}/`);
// data.image_url -> "https://storage.googleapis.com/...&X-Goog-Signature=..."
<img src={data.image_url} alt={data.name} />;
```

## Reglas importantes

- **`image_url` expira (~30 min).** No la guardes en BD, Redux persistido ni localStorage. Pedila fresca al renderizar (en el GET del producto). Si una `<img>` empieza a fallar con 403, es URL vencida → recargar el producto.
- **Editar sin tocar la imagen:** podés seguir mandando **JSON normal**. No incluyas `image`.
- **Quitar la imagen:** `PATCH` con `image: null`.
- **Sin imagen:** `image_url` viene `null` → mostrar placeholder.
- **Validación:** archivos > 5 MB o que no sean imagen son rechazados con 400 y mensaje en español.

## Referencia

Swagger en vivo: `https://logistica-api-production-6aec.up.railway.app/api/v1/docs/`
