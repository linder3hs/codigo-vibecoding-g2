# Vite y Tailwind CSS

[← Anterior: React y TypeScript](./02-react-typescript.md) | [Siguiente: Estructura del Proyecto →](./04-estructura-proyecto.md)

---

## ¿Qué es Vite?

Vite es el **servidor de desarrollo** y **bundler** del proyecto frontend. Se encarga de:

1. Servir el proyecto en `localhost:5173` durante el desarrollo
2. Compilar TypeScript → JavaScript
3. Compilar JSX → JavaScript válido
4. Empaquetar todo en archivos optimizados para producción (`npm run build`)

### Comparación de velocidad

```
Webpack/CRA (antes):     Vite (ahora):
┌──────────────┐         ┌──────────────┐
│ Bundlea TODO │         │ Solo lo que  │
│ antes de     │         │ el browser   │
│ arrancar     │         │ pida ahora   │
│              │         │              │
│ ~30 segundos │         │ ~300ms       │
└──────────────┘         └──────────────┘
```

### Configuración del proyecto

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Dos plugins:
- `react()` — habilita JSX y Fast Refresh (actualización instantánea sin recargar)
- `tailwindcss()` — integra Tailwind directamente en Vite (v4, sin archivo de config separado)

### Comandos principales

```bash
npm run dev      # Inicia servidor de desarrollo en localhost:5173
npm run build    # Compila para producción → carpeta dist/
npm run preview  # Previsualiza el build de producción
```

---

## ¿Qué es Tailwind CSS?

Tailwind es un framework de CSS basado en **clases utilitarias**. En vez de escribir CSS personalizado, aplicas clases predefinidas directamente en el HTML.

### Sin Tailwind (CSS tradicional)

```css
/* styles.css */
.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 1rem;
}
.card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```
```html
<div class="card">...</div>
```

### Con Tailwind

```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
  ...
</div>
```

Sin archivo CSS extra — todo en el JSX.

### Clases más usadas en el proyecto

| Categoría | Clases | Resultado |
|---|---|---|
| **Colores** | `bg-white`, `text-gray-800`, `text-blue-500` | Fondo y texto |
| **Espaciado** | `p-4`, `px-4 py-2`, `mb-6`, `gap-3` | Padding/margin |
| **Flex** | `flex`, `items-center`, `justify-between` | Layout |
| **Tamaño** | `w-full`, `max-w-4xl`, `h-5` | Dimensiones |
| **Bordes** | `rounded-lg`, `border`, `border-gray-200` | Bordes |
| **Hover** | `hover:bg-blue-600`, `hover:shadow-md` | Estados |
| **Transición** | `transition-colors`, `transition-shadow` | Animaciones |

### Ejemplo real del proyecto — TaskCard

```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
  {/* bg-white = fondo blanco */}
  {/* rounded-lg = bordes redondeados */}
  {/* shadow-sm = sombra pequeña */}
  {/* border border-gray-200 = borde gris claro */}
  {/* p-4 = padding de 1rem */}
  {/* hover:shadow-md = sombra más grande al pasar el mouse */}
  {/* transition-shadow = animación suave de la sombra */}
</div>
```

---

## Tailwind v4 — diferencias con v3

En este proyecto usamos **Tailwind CSS v4** que tiene cambios importantes:

| v3 | v4 |
|---|---|
| `tailwind.config.js` separado | Sin archivo de config (integrado en Vite) |
| `@tailwind base/components/utilities` en CSS | Solo `@import "tailwindcss"` |
| PostCSS plugin | Plugin nativo de Vite |

---

[Siguiente: Estructura del Proyecto →](./04-estructura-proyecto.md)
