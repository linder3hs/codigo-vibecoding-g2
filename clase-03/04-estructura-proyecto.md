# Estructura del Proyecto Frontend

[← Anterior: Vite y Tailwind](./03-vite-tailwind.md) | [Siguiente: Glosario →](./glosario-clase-03.md)

---

## Arquitectura general

El proyecto sigue una organización por **responsabilidad**. Cada carpeta tiene un propósito claro:

```
src/
├── types/        ← Contratos de datos (TypeScript)
├── services/     ← Comunicación con el backend
├── components/   ← Piezas de UI reutilizables
├── pages/        ← Pantallas completas
├── App.tsx       ← Enrutador — decide qué página mostrar
└── main.tsx      ← Punto de entrada de la aplicación
```

**Flujo de datos:**
```
Backend API → services/api.ts → pages/ → components/
```

---

## `types/Task.ts` — Contratos de datos

Define la forma exacta de los datos. TypeScript usa esto para detectar errores.

```ts
export interface Task {
  id: string;           // UUID del backend
  title: string;
  description: string;
  completed: boolean;
  created_at: string;   // Fecha ISO del backend
}

export interface TaskFormData {
  title: string;         // Solo lo que manda el formulario
  description: string;
}
```

**Por qué separar `Task` de `TaskFormData`:** El backend devuelve `id`, `created_at`, etc. — el formulario solo manda `title` y `description`. Son tipos distintos.

---

## `services/api.ts` — Capa de comunicación

Centraliza **todas** las llamadas al backend. Las páginas nunca hacen peticiones HTTP directamente.

```ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",  // URL del backend
});

// Una función por operación
export const getTasks = async (): Promise<Task[]> => { ... };
export const getTask = async (id: string): Promise<Task> => { ... };
export const createTask = async (data: TaskFormData): Promise<Task> => { ... };
export const updateTask = async (id: string, data: Partial<TaskFormData>): Promise<Task> => { ... };
export const deleteTask = async (id: string): Promise<void> => { ... };
export const toggleTaskComplete = async (id: string, completed: boolean): Promise<Task> => { ... };
```

**Ventaja:** si la URL del backend cambia, solo se edita este archivo.

---

## Componentes — Piezas de UI

### `TaskCard.tsx`
Muestra una tarea en la lista. Recibe la tarea y funciones de acción via props.

```
┌─────────────────────────────────────────┐
│ ○ Título de la tarea         [✏] [🗑]  │
│   Descripción breve...                  │
│   12 may. 2026                          │
└─────────────────────────────────────────┘
```

- El círculo `○` es el toggle de completada (verde si está hecha, con ✓)
- El título es un link → navega a `/tasks/:id`
- Botones de editar y eliminar abren el `TaskDialog`

### `TaskDialog.tsx`
Modal reutilizable con 3 modos:
- **`create`** — formulario vacío, crea nueva tarea
- **`edit`** — formulario con datos de la tarea seleccionada
- **`delete`** — confirmación de eliminación

### `Header.tsx`
Barra de navegación superior de la aplicación.

---

## Páginas — Pantallas completas

### `Home.tsx` — Pantalla principal

Maneja todo el estado de la lista de tareas:

```
Estado:
├── tasks: Task[]           ← lista de tareas del backend
├── loading: boolean        ← ¿está cargando?
├── error: string           ← mensaje de error si falla
├── dialogOpen: boolean     ← ¿el modal está abierto?
├── dialogMode: create/edit/delete
└── selectedTask: Task | null

Funciones:
├── fetchTasks()     ← GET /tasks
├── handleCreate()   ← abre modal en modo create
├── handleEdit()     ← abre modal en modo edit con la tarea
├── handleDelete()   ← abre modal en modo delete con la tarea
├── handleSubmit()   ← POST /tasks o PUT /tasks/:id
├── handleDeleteConfirm() ← DELETE /tasks/:id
└── handleToggle()   ← PUT /tasks/:id { completed }
```

### `TaskDetail.tsx` — Detalle de tarea
Página individual de una tarea. Accesible desde `/tasks/:id`.

### `Login.tsx` — Página de login
Formulario de inicio de sesión con:
- Validación de email con regex en tiempo real
- Toggle mostrar/ocultar contraseña (iconos de Lucide)
- Botón deshabilitado hasta que ambos campos sean válidos

> **Nota:** En esta clase el login solo tiene la UI. La integración real con el backend (POST /users/login) se implementa en clases posteriores.

---

## `App.tsx` — Enrutador

Define las rutas de la aplicación con React Router:

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Home />} />
    <Route path="/tasks/:id" element={<TaskDetail />} />
  </Routes>
</BrowserRouter>
```

| URL | Componente |
|---|---|
| `/login` | Login.tsx |
| `/` | Home.tsx |
| `/tasks/abc-123` | TaskDetail.tsx |

`:id` es un **parámetro dinámico** — se puede leer con el hook `useParams()`.

---

## Flujo completo — crear una tarea

```
1. Usuario hace clic en "Nueva Tarea"
   → handleCreate() → dialogOpen=true, dialogMode='create'

2. Modal (TaskDialog) se abre con formulario vacío

3. Usuario escribe título y descripción, hace clic en "Guardar"
   → handleSubmit(formData)
   → createTask(formData)           ← services/api.ts
   → POST http://localhost:3000/tasks    ← backend Express
   → Backend guarda en DB y devuelve la tarea creada

4. handleSubmit cierra el modal y llama fetchTasks()
   → getTasks()
   → GET http://localhost:3000/tasks
   → Lista actualizada → React re-renderiza las TaskCards
```

---

[Siguiente: Glosario →](./glosario-clase-03.md)
