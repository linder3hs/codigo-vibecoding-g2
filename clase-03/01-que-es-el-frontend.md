# ¿Qué es el Frontend?

[← Volver al índice](../README.md) | [Siguiente: React y TypeScript →](./02-react-typescript.md)

---

El frontend es todo lo que el usuario **ve e interactúa** en una aplicación web. Si el backend es el motor invisible, el frontend es la carrocería y el tablero del auto.

---

## La diferencia entre Backend y Frontend

```
┌──────────────────────────────────────────────────────────────┐
│                       TASK MANAGER                           │
│                                                              │
│   FRONTEND (clase 03)           BACKEND (clase 02)           │
│   ──────────────────            ───────────────              │
│   - Lista de tareas             - Guarda las tareas en BD    │
│   - Formularios crear/editar    - Procesa las peticiones     │
│   - Botón "completar"           - Devuelve JSON              │
│   - Página de login             - Valida credenciales        │
│                                                              │
│   React + TypeScript            Node.js + Express            │
│   Corre en el NAVEGADOR         Corre en el SERVIDOR         │
└──────────────────────────────────────────────────────────────┘
```

---

## ¿Cómo se comunican?

El frontend habla con el backend mediante **peticiones HTTP** (las mismas que estudiamos en clase 02):

```
Navegador                          Servidor (localhost:3000)
   │                                         │
   │──── GET /tasks ─────────────────────────►│
   │                                         │ busca en DB
   │◄─── [{ id, title, completed }, ...] ────│
   │                                         │
   │──── POST /tasks ────────────────────────►│
   │     { title: "Estudiar" }               │ crea en DB
   │◄─── { id: "abc", title: "Estudiar" } ───│
```

---

## Lo que construimos en esta clase

```
task-manager-frontend/
├── src/
│   ├── components/       ← Piezas reutilizables de UI
│   │   ├── Header.tsx
│   │   ├── TaskCard.tsx
│   │   └── TaskDialog.tsx
│   ├── pages/            ← Pantallas completas
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   └── TaskDetail.tsx
│   ├── services/         ← Comunicación con el backend
│   │   └── api.ts
│   ├── types/            ← Definición de tipos TypeScript
│   │   └── Task.ts
│   ├── App.tsx           ← Enrutador principal
│   └── main.tsx          ← Punto de entrada
```

---

## El stack del frontend

| Tecnología | Rol | Por qué la elegimos |
|---|---|---|
| **React 19** | UI library | El más usado en la industria |
| **TypeScript** | Lenguaje | Previene errores, mejor autocompletado |
| **Vite** | Bundler/Dev server | Velocidad de desarrollo |
| **Tailwind CSS v4** | Estilos | Clases utilitarias, sin CSS personalizado |
| **React Router DOM** | Navegación | Múltiples páginas en una SPA |
| **Axios** | HTTP client | Peticiones al backend |
| **Lucide React** | Íconos | Íconos SVG como componentes |

---

[Siguiente: React y TypeScript →](./02-react-typescript.md)
