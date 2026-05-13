# Glosario Clase 03 — Task Manager Frontend

> Para principiantes. Términos que aparecieron durante la construcción del frontend con React y TypeScript.

---

## Conceptos de React

---

### Componente

**Qué es:** Una función de JavaScript que devuelve JSX (HTML). Es la unidad básica de React.

**Ejemplo del proyecto:**
```tsx
export function TaskCard({ task }) {
  return <div>{task.title}</div>;
}
```

**Analogía:** Son como bloques de LEGO — piezas independientes que se ensamblan para construir la app.

---

### Props (Properties)

**Qué es:** Los datos que un componente padre le pasa a un componente hijo. Como los argumentos de una función.

**Ejemplo:**
```tsx
// El padre pasa datos al hijo
<TaskCard task={miTarea} onEdit={handleEdit} />

// El hijo los recibe
function TaskCard({ task, onEdit }) { ... }
```

**Regla importante:** Los props fluyen de padre a hijo, nunca al revés.

---

### Estado (State)

**Qué es:** Variables que, cuando cambian, hacen que el componente se re-renderice automáticamente.

**Hook:** `useState`

```tsx
const [tasks, setTasks] = useState<Task[]>([]);
// tasks = valor actual
// setTasks = función para cambiar el valor
// [] = valor inicial
```

**Diferencia con variable normal:** Si cambias una variable normal, la pantalla no se actualiza. Con `setTasks()`, React detecta el cambio y actualiza la UI.

---

### Hook

**Qué es:** Funciones especiales de React que empiezan con `use`. Permiten usar características de React (estado, efectos, etc.) en componentes funcionales.

**Los que usamos en clase:**

| Hook | Para qué |
|---|---|
| `useState` | Guardar datos que cambian |
| `useEffect` | Ejecutar código cuando el componente monta o sus dependencias cambian |
| `useParams` | Leer parámetros de la URL (ej: el `:id` en `/tasks/:id`) |

---

### useEffect

**Qué es:** Hook que ejecuta código en momentos específicos del ciclo de vida del componente.

```tsx
useEffect(() => {
  fetchTasks();
}, []); // [] = solo ejecuta una vez al montar
```

**Casos de uso típicos:**
- Cargar datos del servidor al abrir la página
- Suscribirse a eventos
- Timers

---

### Re-render

**Qué es:** Cuando React vuelve a ejecutar la función del componente para actualizar la UI. Ocurre cuando cambia el estado o las props.

**Clave:** React es eficiente — solo actualiza los nodos del DOM que realmente cambiaron.

---

### JSX

**Qué es:** Extensión de sintaxis que permite escribir HTML dentro de JavaScript/TypeScript.

```tsx
// JSX
const elemento = <h1 className="titulo">Hola</h1>;

// Lo que Vite compila a JS real
const elemento = React.createElement('h1', { className: 'titulo' }, 'Hola');
```

**Diferencias con HTML:**
- `className` en vez de `class`
- `htmlFor` en vez de `for`
- Todos los tags se cierran: `<input />` no `<input>`
- Las expresiones van entre `{}`

---

## Conceptos de TypeScript

---

### Interface

**Qué es:** Define la forma (estructura) de un objeto. TypeScript verifica que todos los usos cumplan con esa forma.

```ts
interface Task {
  id: string;
  title: string;
  completed: boolean;
}

// Correcto ✓
const tarea: Task = { id: '1', title: 'Estudiar', completed: false };

// Error ✗ — falta 'completed'
const tarea: Task = { id: '1', title: 'Estudiar' };
```

---

### Tipo genérico (`<T>`)

**Qué es:** Un marcador de posición para un tipo que se define después. Permite reutilizar lógica con distintos tipos.

```tsx
useState<Task[]>([])    // estado que guarda un array de Task
useState<boolean>(true) // estado que guarda un boolean
```

---

### `Partial<T>`

**Qué es:** TypeScript utility type que hace todos los campos de un tipo opcionales.

```ts
// Task requiere title, description, completed
// Partial<TaskFormData> los hace todos opcionales
const updateTask = async (id: string, data: Partial<TaskFormData>) => { ... };

// Permite actualizar solo el título, sin mandar description
updateTask(id, { title: 'Nuevo título' });
```

---

## Conceptos de arquitectura web

---

### SPA (Single Page Application)

**Qué es:** Aplicación de una sola página. El navegador descarga el HTML/JS una vez y React controla la navegación sin recargar.

**Antes (MPA):** Cada URL = nueva petición al servidor = página nueva completa.
**Ahora (SPA):** Una sola carga. React Router cambia lo que se muestra sin ir al servidor.

---

### React Router

**Qué es:** Librería que maneja la navegación en SPAs. Asocia URLs con componentes.

```tsx
<Route path="/tasks/:id" element={<TaskDetail />} />
// Cuando la URL es /tasks/abc-123, muestra TaskDetail
// :id es un parámetro — se lee con useParams()
```

---

### Axios

**Qué es:** Librería para hacer peticiones HTTP desde el navegador. Más conveniente que `fetch` nativo.

```ts
const api = axios.create({
  baseURL: "http://localhost:3000",
});

// GET /tasks
const response = await api.get("/tasks");
const tasks = response.data;
```

**Ventajas sobre `fetch`:** Manejo automático de JSON, mejor manejo de errores, interceptores.

---

### CORS (Cross-Origin Resource Sharing)

**Qué es:** Mecanismo de seguridad del navegador que bloquea peticiones entre dominios distintos.

**El problema:**
```
Frontend: http://localhost:5173
Backend:  http://localhost:3000
          ↑ Puerto diferente = origen diferente = CORS bloqueado
```

**La solución:** El backend Express tiene `app.use(cors())` que le dice al navegador "sí puedes hacer peticiones desde otros orígenes".

---

### Bundler

**Qué es:** Herramienta que toma todos los archivos del proyecto (`.tsx`, `.ts`, CSS, imágenes) y los combina en archivos optimizados para el navegador.

En este proyecto: **Vite** es el bundler.

```
src/
├── App.tsx
├── components/*.tsx    →  Vite  →  dist/assets/index-abc123.js
├── pages/*.tsx                     dist/assets/index-xyz456.css
└── services/*.ts                   dist/index.html
```

---

### Fast Refresh

**Qué es:** Característica de Vite + React que actualiza el componente modificado en el navegador **sin recargar la página** ni perder el estado.

**Práctica:** Editas `TaskCard.tsx`, guardas, y el cambio aparece al instante en el browser.

---

[← Volver al índice](../README.md)
