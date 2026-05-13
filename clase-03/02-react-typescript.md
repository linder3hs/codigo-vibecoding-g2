# React y TypeScript

[← Anterior: ¿Qué es el Frontend?](./01-que-es-el-frontend.md) | [Siguiente: Vite y Tailwind →](./03-vite-tailwind.md)

---

## ¿Qué es React?

React es una **librería de JavaScript** para construir interfaces de usuario. La idea central: en vez de manipular el HTML directamente, describes **cómo debe verse** la UI y React se encarga de actualizarla cuando los datos cambian.

### Sin React (HTML + JS vanilla)
```js
// Tienes que manipular el DOM manualmente
document.getElementById('titulo').textContent = tarea.title;
document.getElementById('checkbox').checked = tarea.completed;
// Si cambia algo, tienes que volver a hacerlo a mano
```

### Con React
```jsx
// Describes la UI, React actualiza automáticamente cuando cambian los datos
function TaskCard({ task }) {
  return (
    <div>
      <span>{task.title}</span>
      <input type="checkbox" checked={task.completed} />
    </div>
  );
}
```

---

## Componentes — el bloque fundamental

Todo en React son **componentes**: funciones que devuelven HTML (llamado JSX).

```
App
├── Header
└── Home
    ├── TaskCard (tarea 1)
    ├── TaskCard (tarea 2)
    ├── TaskCard (tarea 3)
    └── TaskDialog (modal crear/editar)
```

Cada caja es un componente. Los componentes se anidan y reutilizan.

---

## Props — cómo los componentes reciben datos

Las props son los argumentos que le pasas a un componente. Como los parámetros de una función.

```tsx
// Definición del componente con sus props
interface TaskCardProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  return <div>{task.title}</div>;
}

// Uso del componente — se le pasan las props
<TaskCard
  task={miTarea}
  onToggle={handleToggle}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

---

## Estado (State) — datos que cambian

El **estado** son los datos dinámicos de un componente. Cuando el estado cambia, React re-renderiza el componente automáticamente.

Se crea con el hook `useState`:

```tsx
const [tasks, setTasks] = useState<Task[]>([]);       // lista de tareas
const [loading, setLoading] = useState(true);          // ¿cargando?
const [dialogOpen, setDialogOpen] = useState(false);   // ¿modal abierto?
```

**Patrón:** `[valor, funcionParaCambiarValor] = useState(valorInicial)`

---

## useEffect — efectos secundarios

`useEffect` ejecuta código cuando el componente aparece en pantalla (o cuando cambian ciertas dependencias). Se usa principalmente para **cargar datos del servidor**:

```tsx
useEffect(() => {
  fetchTasks(); // carga las tareas cuando la página abre
}, []); // [] = solo ejecutar una vez al montar el componente
```

---

## TypeScript — JavaScript con tipos

TypeScript agrega **tipos** a JavaScript. Esto previene errores y mejora el autocompletado.

```ts
// Sin TypeScript (JavaScript puro)
const task = { id: '123', title: 'Estudiar', completed: false };
task.titlo; // ← Error de typo, pero JS no lo detecta hasta runtime

// Con TypeScript
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
}

const task: Task = { id: '123', title: 'Estudiar', ... };
task.titlo; // ← TypeScript marca error inmediatamente en el editor
```

### Los tipos que definimos en el proyecto

```ts
// src/types/Task.ts
export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
}

export interface TaskFormData {
  title: string;
  description: string;
}
```

`Task` = lo que devuelve el backend. `TaskFormData` = lo que manda el formulario.

---

## JSX — HTML dentro de JavaScript

JSX es la sintaxis especial de React que mezcla HTML con JavaScript:

```tsx
// JSX — parece HTML pero es JavaScript
return (
  <div className="container">       {/* className, no class */}
    <h1>{task.title}</h1>           {/* {} para expresiones JS */}
    {task.completed && <span>✓</span>}  {/* condicionales */}
    {tasks.map(t => <TaskCard key={t.id} task={t} />)}  {/* listas */}
  </div>
);
```

**Reglas clave:**
- `className` en vez de `class`
- Las expresiones JS van entre `{}`
- Toda lista necesita un `key` único

---

[Siguiente: Vite y Tailwind →](./03-vite-tailwind.md)
