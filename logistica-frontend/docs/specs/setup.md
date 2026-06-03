# Spec — Setup e Infraestructura

**Módulo:** setup
**Fase:** 0
**Estado:** implementado — validado
**Fecha:** 2026-05-27

---

## Contexto del estado actual

Los siguientes elementos YA existen y NO se deben tocar:

- `app/providers.tsx` — `QueryClient` con `staleTime: 60_000` y `retry: 1`, `ReactQueryDevtools` en modo `initialIsOpen={false}` (presente en todos los entornos, se oculta automáticamente en producción por la lib).
- `app/layout.tsx` — Root layout con `<Providers>` envolviendo los `children`. Geist Sans + Geist Mono cargadas.

Lo que esta Fase 0 debe construir desde cero:

1. `lib/axios.ts` — instancia axios con interceptores JWT
2. `types/common.ts` — tipos base reutilizables
3. `lib/auth.ts` — helpers JWT con localStorage
4. `lib/api/auth.ts` — API client de autenticación
5. `app/(auth)/login/page.tsx` — página de login
6. `app/(dashboard)/layout.tsx` — layout autenticado con AuthGuard, Sidebar y Navbar

---

## 1. `lib/axios.ts` — Instancia Axios configurada

### Propósito

Exportar una instancia única de Axios pre-configurada con la `baseURL` del backend y los interceptores necesarios para adjuntar el JWT en cada request y manejar el refresco automático del token cuando expira.

### Configuración base

```
baseURL: "http://localhost:8000/api/v1/"
headers.Content-Type: "application/json"
```

### Interceptor de request

Antes de que cada petición salga, el interceptor debe:

1. Obtener el access token llamando a `getAccessToken()` (de `lib/auth.ts`).
2. Si existe un token, agregar el header `Authorization: Bearer <token>` a la request.
3. Si no existe token, dejar la request sin header de autorización (el backend responderá 401).
4. Retornar la config modificada.

Firma esperada del interceptor:
```
axiosInstance.interceptors.request.use(
  (config) => { ... return config },
  (error) => Promise.reject(error)
)
```

### Interceptor de response (manejo de 401 con refresh)

El interceptor de response maneja el caso donde el access token ha expirado:

1. Si la response es exitosa (2xx), pasarla sin modificar.
2. Si el error tiene `status === 401` Y la request original NO es un retry (`_retry !== true`):
   a. Marcar la request original con `_retry = true` para evitar bucles infinitos.
   b. Obtener el refresh token llamando a `getRefreshToken()`.
   c. Si no hay refresh token: llamar a `clearTokens()` y redirigir a `/login` usando `window.location.href`. Rechazar la promesa.
   d. Si hay refresh token: llamar a `POST /auth/token/refresh/` con `{ refresh }` usando la instancia axios (no la instancia configurada, para evitar interceptores circulares — usar `axios.post` directo o una instancia separada sin interceptores).
   e. Si el refresh tiene éxito: guardar el nuevo access token con `setTokens({ access: newToken })`, actualizar el header de la request original con el nuevo token, y re-intentar la request original con `axiosInstance(originalRequest)`.
   f. Si el refresh falla (cualquier error): llamar a `clearTokens()`, redirigir a `/login` con `window.location.href`. Rechazar la promesa.
3. Si el error tiene cualquier otro status, rechazar la promesa sin modificar.

**Consideración crítica:** Este interceptor se ejecuta en el cliente (browser). No agregar lógica de servidor. El módulo debe incluir la directiva `"use client"` solo si es un componente React — como es un módulo de utilidad puro (no un componente), NO necesita `"use client"`, pero toda la lógica que usa `window` debe estar protegida para no ejecutarse en SSR. Dado que Next.js puede importar este módulo desde Server Components accidentalmente, la lógica de `window.location.href` debe estar dentro de un guard `if (typeof window !== "undefined")`.

### Exportación

```typescript
export default axiosInstance
```

### Tipos adicionales necesarios

Extender el tipo de `InternalAxiosRequestConfig` para soportar la propiedad `_retry`:

```typescript
declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}
```

---

## 2. `types/common.ts` — Tipos base

### Propósito

Centralizar los tipos genéricos que se reutilizan en todos los módulos del proyecto.

### Tipos a definir

#### `PaginatedResponse<T>`

Representa la respuesta estándar de cualquier endpoint de lista del backend Django REST Framework:

```typescript
interface PaginatedResponse<T> {
  count: number       // total de registros que coinciden con los filtros
  next: string | null // URL de la página siguiente, null si es la última
  previous: string | null // URL de la página anterior, null si es la primera
  results: T[]        // array de objetos de la página actual
}
```

#### `ApiError`

Representa el shape de error que devuelve el backend DRF cuando una petición falla:

```typescript
interface ApiError {
  detail?: string                           // error general (ej: "No encontrado.")
  non_field_errors?: string[]               // errores no asociados a un campo específico
  [field: string]: string | string[] | undefined  // errores de campo por nombre (ej: { email: ["Ya existe"] })
}
```

#### `TokenPair`

Par de tokens JWT retornado por el endpoint de login:

```typescript
interface TokenPair {
  access: string
  refresh: string
}
```

#### `LoginCredentials`

Credenciales que el usuario ingresa en el formulario de login:

```typescript
interface LoginCredentials {
  username: string
  password: string
}
```

### Exportaciones

Todos los tipos se exportan como named exports. Este archivo NO tiene lógica de runtime, solo declaraciones de tipos e interfaces.

---

## 3. `lib/auth.ts` — Helpers JWT con localStorage

### Propósito

Centralizar toda la lógica de acceso y manipulación de tokens JWT en localStorage. Este módulo es el único lugar del proyecto que conoce las claves de localStorage donde se guardan los tokens.

### Constantes internas

```
ACCESS_TOKEN_KEY = "logistica_access_token"
REFRESH_TOKEN_KEY = "logistica_refresh_token"
```

Estas constantes deben ser privadas (no exportadas). Sirven como single source of truth para los nombres de clave en localStorage.

### Funciones a implementar

#### `getAccessToken(): string | null`

- Lee `localStorage.getItem(ACCESS_TOKEN_KEY)`.
- Retorna el string del token si existe, `null` si no existe.
- Proteger con guard de SSR: si `typeof window === "undefined"`, retornar `null`.

#### `getRefreshToken(): string | null`

- Lee `localStorage.getItem(REFRESH_TOKEN_KEY)`.
- Retorna el string del token si existe, `null` si no existe.
- Proteger con guard de SSR.

#### `setTokens(tokens: Partial<TokenPair>): void`

- Acepta un objeto con `access` y/o `refresh` opcionales.
- Si `tokens.access` está presente, guarda en `localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)`.
- Si `tokens.refresh` está presente, guarda en `localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)`.
- No hace nada si el campo no viene en el objeto.
- Proteger con guard de SSR.

#### `clearTokens(): void`

- Elimina ambos tokens de localStorage con `removeItem`.
- Proteger con guard de SSR.

#### `isAuthenticated(): boolean`

- Retorna `true` si `getAccessToken()` retorna un valor truthy (string no vacío).
- Retorna `false` en cualquier otro caso (null, undefined, string vacío).
- No valida la expiración del JWT — solo verifica presencia del token.

### Importaciones necesarias

```typescript
import type { TokenPair } from "@/types/common"
```

### Exportaciones

Todas las funciones se exportan como named exports. No hay export default.

---

## 4. `lib/api/auth.ts` — API Client de autenticación

### Propósito

Exponer las llamadas HTTP a los endpoints de autenticación del backend. Estas funciones son usadas por el formulario de login y por el interceptor de axios.

### Objeto `authApi`

Exportar un objeto literal con dos métodos:

#### `authApi.login(credentials: LoginCredentials): Promise<TokenPair>`

- Realiza `POST /auth/token/` con el body `{ username, password }`.
- Usa la instancia de axios configurada (`@/lib/axios`).
- Retorna los datos de la response (el objeto `TokenPair` con `access` y `refresh`).
- NO llama a `setTokens` internamente — esa responsabilidad es del consumidor (el formulario de login).
- Errores de red o 400/401 deben propagarse sin capturar (el consumidor o TanStack Query los maneja).

#### `authApi.refreshToken(refresh: string): Promise<{ access: string }>`

- Realiza `POST /auth/token/refresh/` con el body `{ refresh }`.
- Retorna solo `{ access: string }` (el backend no devuelve un nuevo refresh token en este endpoint).
- Usar axios directo (no la instancia con interceptores) para evitar recursión infinita en el interceptor de response. Importar `axios` de `"axios"` y hacer `axios.post("http://localhost:8000/api/v1/auth/token/refresh/", { refresh })`.
- En caso de fallo, propagar el error sin capturar.

### Importaciones necesarias

```typescript
import axiosInstance from "@/lib/axios"
import axios from "axios"
import type { LoginCredentials, TokenPair } from "@/types/common"
```

### Exportaciones

```typescript
export const authApi = { login, refreshToken }
```

---

## 5. `app/(auth)/login/page.tsx` — Página de Login

### Propósito

Formulario de autenticación para que el usuario ingrese sus credenciales y obtenga los tokens JWT.

### Tipo de componente

`"use client"` — usa hooks de React, TanStack Query y React Hook Form.

### Ubicación en el router

Next.js App Router: el grupo de rutas `(auth)` es transparente en la URL. Esta página se renderiza en `/login`.

### Schema de validación Zod

```typescript
const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

type LoginFormValues = z.infer<typeof loginSchema>
```

### Estructura del formulario

Usar el componente `<Form>` de shadcn/ui (construido sobre React Hook Form). Campos:

- **username:** `<FormField>` con `<Input>` de tipo `text`. Label: "Usuario". Placeholder: "Tu nombre de usuario".
- **password:** `<FormField>` con `<Input>` de tipo `password`. Label: "Contraseña". Placeholder: "••••••••".
- **Botón submit:** `<Button type="submit">`. Texto: "Iniciar sesión". Mientras la mutation está en progreso (`isPending`), mostrar estado de carga y deshabilitar el botón.

### Lógica de submission con TanStack Query

```
useMutation({
  mutationFn: (data: LoginFormValues) => authApi.login(data),
  onSuccess: (tokenPair) => {
    setTokens(tokenPair)              // guarda access + refresh en localStorage
    router.push("/dashboard")         // redirige al dashboard
  },
  onError: (error) => {
    // mostrar mensaje de error descriptivo
  }
})
```

### Manejo de errores en el formulario

- Si el error es un `AxiosError` con status 401, mostrar un mensaje genérico en el formulario: "Usuario o contraseña incorrectos."
- Si el error tiene `response.data` con campos de error DRF (`detail`, `non_field_errors`), mostrar ese mensaje.
- El mensaje de error debe mostrarse dentro del formulario (debajo del campo password o en un `Alert` de shadcn), NO como toast.

### Redirección si ya está autenticado

Al montar el componente, verificar con `isAuthenticated()`. Si retorna `true`, redirigir a `/dashboard` usando `router.replace("/dashboard")` para evitar que el usuario vea el login si ya tiene sesión.

### Diseño visual

- Centrado vertical y horizontal en la pantalla completa (usar `min-h-screen flex items-center justify-center`).
- Card de shadcn con título "Bienvenido" o "Logística — Iniciar Sesión".
- Ancho fijo: `w-full max-w-md`.

### Importaciones esperadas

```typescript
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { authApi } from "@/lib/api/auth"
import { setTokens, isAuthenticated } from "@/lib/auth"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
```

---

## 6. `app/(dashboard)/layout.tsx` — Layout autenticado con AuthGuard

### Propósito

Layout compartido por todas las páginas del dashboard. Incluye:

1. **AuthGuard:** verificación cliente-side de autenticación (protege todas las rutas hijas).
2. **Sidebar:** navegación lateral con links a todos los módulos.
3. **Navbar:** barra superior con nombre de usuario y botón de logout.

### Por qué AuthGuard en cliente y no middleware

El middleware de Next.js se ejecuta en el Edge Runtime (servidor). No puede acceder a `localStorage`. La alternativa correcta para tokens en localStorage es un componente cliente que verifica el token al montar y redirige si no existe.

### Tipo de componente

`"use client"` — necesita `useEffect`, `useState`, y `useRouter` para la lógica de AuthGuard. Todo el layout es un Client Component.

### Lógica de AuthGuard

El componente debe implementar la siguiente lógica de protección de rutas:

1. Estado interno: `const [isChecking, setIsChecking] = useState(true)`.
2. En `useEffect` (una sola vez al montar):
   a. Llamar a `isAuthenticated()`.
   b. Si retorna `false`: llamar a `router.replace("/login")`. No cambiar `isChecking` a `false` (evita flash del layout).
   c. Si retorna `true`: setear `isChecking(false)`.
3. Mientras `isChecking === true`: renderizar un estado de carga mínimo (spinner centrado o pantalla en blanco) — NO renderizar el layout completo.
4. Cuando `isChecking === false`: renderizar el layout completo con Sidebar, Navbar y `{children}`.

Este patrón evita el "flash" del contenido protegido antes de la verificación.

### Estructura del layout

```
<div className="flex h-screen overflow-hidden">
  <Sidebar />
  <div className="flex flex-col flex-1 overflow-hidden">
    <Navbar />
    <main className="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>
</div>
```

### Componente `Sidebar`

**Archivo:** `components/layout/Sidebar.tsx`
**Tipo:** Client Component (`"use client"`) — usa `usePathname` para marcar el link activo.

Links de navegación (en orden):

| Label | Href | Icono sugerido (lucide-react) |
|-------|------|-------------------------------|
| Dashboard | `/dashboard` | `LayoutDashboard` |
| Almacenes | `/dashboard/warehouses` | `Warehouse` |
| Proveedores | `/dashboard/suppliers` | `Building2` |
| Clientes | `/dashboard/customers` | `Users` |
| Transporte | `/dashboard/transport` | `Truck` |
| Productos | `/dashboard/products` | `Package` |
| Rutas | `/dashboard/routes` | `Route` |
| Conductores | `/dashboard/drivers` | `UserCheck` |
| Envíos | `/dashboard/shipments` | `PackageCheck` |

El link activo se determina comparando `usePathname()` con el `href` de cada link. Aplicar estilos distintos al link activo (fondo destacado, texto bold o color primario).

Ancho del sidebar: `w-64` fijo en desktop. En mobile, puede colapsarse (funcionalidad opcional para Fase 0 — puede dejarse siempre visible).

Logo o título de la app en la parte superior del sidebar: "Logística" con un icono de camión o similar.

### Componente `Navbar`

**Archivo:** `components/layout/Navbar.tsx`
**Tipo:** Client Component (`"use client"`) — usa `useRouter` para el logout.

Estructura:
- Lado izquierdo: título de la página actual (puede ser estático "Panel de control" o dinámico con `usePathname` — para Fase 0 puede ser estático).
- Lado derecho: nombre de usuario (en Fase 0 puede ser hardcoded "Administrador" ya que no hay endpoint de usuario actual) + botón "Cerrar sesión".

Lógica de logout al hacer clic en "Cerrar sesión":
1. Llamar a `clearTokens()`.
2. Llamar a `router.push("/login")`.

**Nota:** Si en el futuro se agrega un endpoint `/api/v1/auth/me/` o similar, el Navbar podrá mostrar el nombre real del usuario. Para Fase 0, "Administrador" es aceptable.

### Importaciones del layout principal

```typescript
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import { Sidebar } from "@/components/layout/Sidebar"
import { Navbar } from "@/components/layout/Navbar"
```

---

## 7. Página raíz del dashboard

### `app/(dashboard)/dashboard/page.tsx`

**Tipo:** Server Component (sin hooks, solo render estático).

Página mínima que sirve como landing page del dashboard autenticado. Contenido: título "Dashboard" y un subtítulo "Bienvenido al sistema de gestión logística." No requiere ningún fetch de datos en Fase 0.

**Nota:** La ruta de este archivo es `/dashboard` gracias al grupo `(dashboard)` y la carpeta `dashboard/` dentro de él.

---

## 8. Schema de validación Zod (login)

El schema se define dentro de `app/(auth)/login/page.tsx` (no necesita archivo separado — es simple y específico de esa página):

```typescript
const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
})
```

Validaciones:
- `username`: string requerido, mínimo 1 carácter. No se valida formato (puede ser email u otro string).
- `password`: string requerido, mínimo 1 carácter. No se impone longitud mínima real porque el backend es quien valida las credenciales.

---

## 9. Manejo de errores

### En el login

- **Error 401 del backend:** mostrar mensaje "Usuario o contraseña incorrectos." en el formulario.
- **Error 400 con `detail`:** mostrar el valor de `detail` como mensaje de error.
- **Error 400 con `non_field_errors`:** mostrar el primer elemento del array como mensaje de error.
- **Error de red (sin response):** mostrar "Error de conexión. Verifica que el servidor esté disponible."

### En el interceptor de axios (errores 401 en páginas protegidas)

- Refresh exitoso → la request se reintenta transparentemente para el usuario.
- Refresh fallido → tokens limpiados, redirige a `/login` automáticamente.
- El usuario ve el login sin mensajes de error adicionales (la sesión simplemente expiró).

---

## 10. Criterios de aceptación

- [x] `lib/axios.ts` exporta una instancia axios con `baseURL: "http://localhost:8000/api/v1/"`.
- [x] Toda request HTTP incluye el header `Authorization: Bearer <token>` si hay token en localStorage.
- [x] Una request que retorna 401 intenta el refresh automáticamente antes de fallar.
- [x] Si el refresh falla, se limpian los tokens y se redirige a `/login`.
- [x] `types/common.ts` exporta `PaginatedResponse<T>`, `ApiError`, `TokenPair` y `LoginCredentials`.
- [x] `lib/auth.ts` exporta `getAccessToken`, `getRefreshToken`, `setTokens`, `clearTokens`, `isAuthenticated` con guards de SSR.
- [x] `lib/api/auth.ts` exporta `authApi.login` y `authApi.refreshToken`.
- [x] La página `/login` renderiza el formulario con campos `username` y `password`.
- [x] Al enviar credenciales correctas, los tokens se guardan en localStorage y se redirige a `/dashboard`.
- [x] Al enviar credenciales incorrectas, se muestra un mensaje de error descriptivo en el formulario.
- [x] Si el usuario ya tiene sesión y visita `/login`, es redirigido a `/dashboard`.
- [x] Sin token en localStorage → al visitar cualquier ruta del dashboard, el AuthGuard redirige a `/login`.
- [x] Con token válido en localStorage → el dashboard se muestra con Sidebar y Navbar.
- [x] El Sidebar muestra links a todos los módulos definidos en el MVP.
- [x] El link activo en el Sidebar tiene estilos visuales distintos al resto.
- [x] El botón "Cerrar sesión" en el Navbar limpia tokens y redirige a `/login`.
- [x] No hay "flash" del contenido protegido antes de que el AuthGuard verifique la autenticación.
- [x] Todo el código TypeScript pasa `npx tsc --noEmit` sin errores.

---

## Notas de implementación para el agente Implement

1. **Orden de creación de archivos:** seguir este orden para evitar errores de importación circular:
   1. `types/common.ts`
   2. `lib/auth.ts`
   3. `lib/axios.ts`
   4. `lib/api/auth.ts`
   5. `components/layout/Sidebar.tsx`
   6. `components/layout/Navbar.tsx`
   7. `app/(auth)/login/page.tsx`
   8. `app/(dashboard)/layout.tsx`
   9. `app/(dashboard)/dashboard/page.tsx`

2. **Guard de SSR en `lib/auth.ts`:** Dado que Next.js puede importar estos módulos desde el servidor durante el build, todos los accesos a `localStorage` deben estar dentro de `if (typeof window !== "undefined")`.

3. **`lib/axios.ts` sin `"use client"`:** Este archivo es un módulo de utilidad puro, no un componente React. No debe tener la directiva `"use client"`. La protección de SSR se logra con el guard `typeof window`.

4. **Refresh token en el interceptor:** Para evitar recursión infinita, el refresh debe usar `axios.create()` o `axios.post()` directo (sin la instancia configurada). La instancia configurada tiene el interceptor que causaría el loop.

5. **shadcn/ui disponible:** El scaffold ya tiene shadcn instalado con estilo `base-nova`. Los componentes disponibles en `components/ui/` incluyen al menos: `Button`, `Input`, `Card`, `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`. Si se necesita un componente que no existe, instalarlo con `npx shadcn@latest add <componente>`.

6. **Alias `@/`:** Usar siempre el alias configurado en `tsconfig.json`. Nunca rutas relativas largas.
