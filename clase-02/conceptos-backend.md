# Conceptos de Backend — Guía para Principiantes

> Clase 02 — Task Manager Backend. Todo lo que necesitas saber para entender qué construimos y por qué.

---

## ¿Qué es el Backend?

Toda aplicación web tiene dos partes:

```
┌─────────────────────────────────────────────────────────────┐
│                      TU APP                                 │
│                                                             │
│   FRONTEND                        BACKEND                   │
│   (lo que el usuario ve)          (el motor invisible)      │
│                                                             │
│   - Pantallas                     - Guarda datos            │
│   - Botones                       - Procesa lógica          │
│   - Formularios                   - Responde preguntas       │
│   - Estilos                       - Conecta con la BD       │
│                                                             │
│   Navegador / App móvil           Servidor                  │
└─────────────────────────────────────────────────────────────┘
```

**Analogía del restaurante:**

| Restaurante | App web |
|-------------|---------|
| Salón (mesas, menú, meseros) | Frontend |
| Cocina (chef, ingredientes, horno) | Backend |
| Comandas entre salón y cocina | API |

El cliente nunca entra a la cocina, pero la cocina es la razón por la que hay comida.

---

## ¿Qué es un Servidor?

**Qué es:** Una computadora (o programa) que está siempre encendida, esperando que alguien le haga preguntas, y las responde.

**En nuestro proyecto:** El servidor es el programa de Node.js que corremos con `npm run dev`. Vive en `http://localhost:3000`.

```
Tu computadora tiene el servidor corriendo en el puerto 3000.
Cualquier programa que le hable a localhost:3000 recibe respuesta.
```

**Puerto:** Es como el número de departamento en un edificio. La dirección es `localhost` (tu computadora), el departamento es `:3000`.

---

## ¿Qué es una API?

**API** = Application Programming Interface (Interfaz de Programación de Aplicaciones)

**En simple:** Es el conjunto de "ventanillas" que ofrece tu backend. Cada ventanilla acepta un tipo de pedido y devuelve un tipo de respuesta.

```
                    ┌─────────────────┐
FRONTEND ──────────►│   VENTANILLA 1  │ GET /tasks → lista de tareas
                    │   VENTANILLA 2  │ POST /tasks → crear tarea
OTRA APP ──────────►│   VENTANILLA 3  │ GET /tasks/:id → una tarea
                    │   VENTANILLA 4  │ PUT /tasks/:id → actualizar
POSTMAN ───────────►│   VENTANILLA 5  │ DELETE /tasks/:id → eliminar
                    └─────────────────┘
                          API
```

**Por qué es útil:** La misma API puede ser usada por tu app web, tu app móvil, o cualquier otro sistema. El backend no le importa quién pregunta, solo responde.

---

## ¿Qué es REST?

**REST** = Representational State Transfer

No te asustes. En simple: es un conjunto de reglas para diseñar APIs de forma ordenada y predecible.

**Las 3 reglas principales de REST:**

### Regla 1 — Usa URLs para nombrar recursos (cosas)

Un **recurso** es la "cosa" de tu sistema. En nuestro proyecto: `task` (tarea).

```
✓ BIEN (REST):     /tasks        /tasks/123
✗ MAL (no REST):   /getTasks     /createNewTask   /deleteTask?id=123
```

La URL dice QUÉ, no QUÉ HACER.

### Regla 2 — Usa métodos HTTP para decir qué hacer

Los métodos son los verbos. La URL es el sustantivo.

```
GET    /tasks     = "dame todas las tareas"
POST   /tasks     = "crea una tarea nueva"
GET    /tasks/5   = "dame la tarea número 5"
PUT    /tasks/5   = "actualiza la tarea número 5"
DELETE /tasks/5   = "borra la tarea número 5"
```

### Regla 3 — Responde con el código de estado correcto

No todo es "200 OK". Hay códigos específicos para cada situación (ver más abajo).

---

## ¿Qué es un Endpoint?

**Qué es:** La combinación de método HTTP + URL que hace UNA cosa específica en tu API.

**Formato:** `MÉTODO /ruta`

**Los 5 endpoints del proyecto:**

```
GET    /tasks        → Lista todas las tareas
POST   /tasks        → Crea una tarea nueva
GET    /tasks/:id    → Muestra una tarea específica
PUT    /tasks/:id    → Actualiza una tarea específica
DELETE /tasks/:id    → Elimina una tarea específica
```

Esto es **CRUD completo** (Create, Read, Update, Delete).

---

## Métodos HTTP — Los verbos de las APIs

HTTP es el protocolo (idioma) que usan los navegadores y servidores para comunicarse. Los métodos son los verbos de ese idioma.

### GET — Pedir datos

- **Qué hace:** Solicita información. NO modifica nada.
- **Cuándo usarlo:** Cuando quieres leer o listar datos.
- **Lleva body:** No. Los datos van en la URL.

```
GET /tasks          → dame todas las tareas
GET /tasks/abc-123  → dame la tarea con id "abc-123"
```

**Analogía:** Es como consultar el menú del restaurante. Solo preguntas, no cambias nada.

---

### POST — Crear algo nuevo

- **Qué hace:** Envía datos al servidor para crear un recurso nuevo.
- **Cuándo usarlo:** Cuando quieres crear algo.
- **Lleva body:** Sí. Los datos van en el cuerpo de la petición.

```
POST /tasks
Body: { "title": "Estudiar", "description": "Repasar clase 02" }
```

**Analogía:** Es como hacer un pedido al mesero — le das nueva información y se crea algo (tu orden).

---

### PUT — Reemplazar / Actualizar

- **Qué hace:** Reemplaza un recurso existente con los datos que envías.
- **Cuándo usarlo:** Cuando quieres modificar algo que ya existe.
- **Lleva body:** Sí.

```
PUT /tasks/abc-123
Body: { "title": "Estudiar más", "completed": true }
```

**Analogía:** Es como cambiar toda tu orden con el mesero — le dices exactamente cómo quieres que quede ahora.

---

### DELETE — Eliminar

- **Qué hace:** Borra un recurso existente.
- **Cuándo usarlo:** Cuando quieres eliminar algo.
- **Lleva body:** Generalmente no. El `id` va en la URL.

```
DELETE /tasks/abc-123
```

**Analogía:** Cancelar tu orden completamente.

---

### Resumen visual

| Método | Acción | En el proyecto | ¿Modifica datos? |
|--------|--------|----------------|-----------------|
| `GET` | Leer | Listar / ver tarea | No |
| `POST` | Crear | Nueva tarea | Sí |
| `PUT` | Actualizar | Editar tarea | Sí |
| `DELETE` | Eliminar | Borrar tarea | Sí |

---

## Códigos de Estado HTTP

Cuando el servidor responde, incluye un número que indica cómo salió la petición. Igual que los semáforos — hay un lenguaje universal.

### Los rangos

```
1xx → Informativo   (raro verlo)
2xx → Éxito         ← los buenos
3xx → Redirección   (te manda a otro lado)
4xx → Error del cliente ← tú mandaste algo mal
5xx → Error del servidor ← el servidor se rompió
```

### Los que usamos en el proyecto

| Código | Nombre | Cuándo | Ejemplo real |
|--------|--------|--------|--------------|
| `200` | OK | Petición exitosa | `GET /tasks` devuelve la lista |
| `201` | Created | Se creó algo nuevo | `POST /tasks` creó la tarea |
| `204` | No Content | Éxito, pero sin respuesta | `DELETE /tasks/123` eliminó (no hay nada que devolver) |
| `404` | Not Found | El recurso no existe | `GET /tasks/id-falso` → tarea no encontrada |

**Del código real del proyecto (`controller.js`):**
```js
// Tarea no encontrada → 404
if (!task) {
  return res.status(404).json({ error: "Task not found" });
}

// Tarea creada → 201
res.status(201).json(newTask);

// Tarea eliminada → 204 (sin contenido)
res.status(204).send();

// Tarea encontrada → 200 (default, no hace falta escribirlo)
res.json(task);
```

---

## Request y Response — El ciclo de vida de una petición

Toda comunicación con el backend sigue el mismo patrón:

```
┌──────────┐                              ┌──────────┐
│          │  1. REQUEST (petición)       │          │
│  CLIENTE │ ───────────────────────────► │ SERVIDOR │
│ (browser │                              │(Node.js) │
│  Postman)│  2. RESPONSE (respuesta)     │          │
│          │ ◄─────────────────────────── │          │
└──────────┘                              └──────────┘
```

### El Request contiene:
- **Método:** GET, POST, PUT, DELETE
- **URL:** `/tasks/abc-123`
- **Headers:** Metadatos (tipo de contenido, autenticación, etc.)
- **Body:** Datos que envías (solo en POST/PUT)

### El Response contiene:
- **Código de estado:** 200, 201, 404, etc.
- **Headers:** Metadatos de respuesta
- **Body:** Los datos que devuelve el servidor (generalmente JSON)

### En el código — `req` y `res`

En Express, cada función que maneja una petición recibe dos objetos:

```js
// req = lo que llegó del cliente
// res = lo que vas a devolver
getById: (req, res) => {
  const id = req.params.id;    // req → lees lo que llegó
  const task = TaskModel.getById(id);
  res.json(task);              // res → escribes lo que devuelves
}
```

| Objeto | Qué contiene | Ejemplos |
|--------|-------------|---------|
| `req.params` | Variables de la URL | `req.params.id` = "abc-123" |
| `req.body` | Datos del body (POST/PUT) | `req.body.title` = "Estudiar" |
| `req.query` | Parámetros de query `?foo=bar` | `req.query.status` = "done" |
| `res.json()` | Devuelve JSON | `res.json({ id: "123" })` |
| `res.status()` | Define el código de estado | `res.status(404)` |
| `res.send()` | Devuelve texto plano | `res.send("OK")` |

---

## JSON — El idioma de las APIs

**JSON** = JavaScript Object Notation

**Qué es:** Un formato de texto para representar datos estructurados. Es lo que los servidores y clientes se mandan entre sí.

**Parece a JavaScript, pero no es JavaScript.** Es solo texto con una estructura específica.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Aprender backend",
  "description": "Entender qué es una API REST",
  "completed": false,
  "created_at": "2026-05-05T10:00:00.000Z"
}
```

**Tipos de datos que soporta:**

| Tipo | Ejemplo |
|------|---------|
| Texto (string) | `"hola"` |
| Número (number) | `42` |
| Booleano | `true` / `false` |
| Nulo | `null` |
| Arreglo | `["a", "b", "c"]` |
| Objeto | `{ "clave": "valor" }` |

**Cómo lo configura Express en el proyecto (`app.js`):**
```js
app.use(express.json()); // permite leer JSON del body de las peticiones
```

Sin esta línea, `req.body` estaría vacío en POST y PUT.

---

## Parámetros de ruta vs Query params

### Parámetros de ruta (`:id`)

Van dentro de la URL y son obligatorios. Identifican UN recurso específico.

```
URL:    /tasks/abc-123
Código: router.get("/:id", ...)
Acceso: req.params.id  →  "abc-123"
```

### Query params (`?clave=valor`)

Van al final de la URL con `?`. Son opcionales. Sirven para filtrar o buscar.

```
URL:    /tasks?completed=true
Acceso: req.query.completed  →  "true"
```

**En el proyecto** solo usamos parámetros de ruta (`:id`). Los query params son para la siguiente etapa cuando agreguemos filtros.

---

## Flujo completo del proyecto

Así viaja una petición desde que llega hasta que sale:

```
Cliente hace: GET /tasks/abc-123
                    │
                    ▼
              server.js (puerto 3000)
                    │
                    ▼
               app.js
         (registra las rutas,
          aplica cors y JSON)
                    │
                    ▼
             tasks/routes.js
         router.get("/:id", ...)
                    │
                    ▼
          tasks/controller.js
            getById(req, res)
         extrae req.params.id
                    │
                    ▼
           tasks/model.js
         tasks.find(t => t.id === id)
                    │
              ┌─────┴─────┐
           encontró      no encontró
              │                │
              ▼                ▼
         res.json(task)   res.status(404)
           código 200      .json({error})
```

---

## Memoria local vs Base de datos

En este proyecto guardamos los datos en un array de JavaScript:

```js
const tasks = []; // vive en la memoria RAM del servidor
```

**Ventaja:** Simple. No necesitas instalar nada más.

**Desventaja:** Si el servidor se reinicia, los datos desaparecen.

```
Servidor corre  →  tasks = [{...}, {...}]  →  datos existen
Servidor reinicia  →  tasks = []  →  datos perdidos
```

**En proyectos reales:** Los datos van en una base de datos (PostgreSQL, MongoDB, etc.) que persiste aunque el servidor se reinicie. Eso lo veremos en clases futuras.

---

## Resumen de lo que construimos

```
Task Manager Backend
│
├── API REST completa con 5 endpoints
├── CRUD de tareas (Create, Read, Update, Delete)
├── IDs únicos automáticos (UUID)
├── Timestamp de creación (created_at)
├── Documentación interactiva (Swagger en /api-docs)
└── Código organizado por dominio (model / controller / routes)
```

**Tecnologías:**
- **Node.js** — motor de JavaScript en el servidor
- **Express** — framework para crear la API
- **CORS** — permitir que el frontend se conecte
- **UUID** — generar IDs únicos
- **Swagger** — documentar la API visualmente

---

*Clase 02 — Vibe Coding G2 — Task Manager Backend*
