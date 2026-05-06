# Glosario Clase 02 — Task Manager Backend

> Para principiantes. Sin complicaciones. Con ejemplos reales del proyecto.

---

## Conceptos de Prompts y Vibe Coding

> Ver también: [`prompt1.md`](./prompt1.md) — el prompt real usado en clase para construir este proyecto.

---

### Prompt

**Qué es:** El mensaje o instrucción que le escribes a la IA para que construya o modifique código por ti.

**Tip:** Un buen prompt es como darle instrucciones a un empleado muy inteligente — cuanto más claro eres, mejor resultado obtienes.

---

### Anatomía de un buen prompt

Un prompt efectivo tiene 3 partes. Las usamos en clase:

```
┌─────────────────────────────────────────────────────┐
│  1. CONTEXTO — qué estás construyendo               │
│  2. STACK — qué tecnologías usar                    │
│  3. ACCIÓN — qué quieres que haga                   │
└─────────────────────────────────────────────────────┘
```

**Prompt real de la clase (prompt1.md) desglosado:**

```
[CONTEXTO]
Vamos a construir la aplicacion llamada Task Manager,
en este caso esto sera el backend...

[STACK]
- lenguaje principal JavaScript
- nodejs
- express
- memoria local (arrays)
- cors

[ACCIÓN]
y tendremos los siguientes endpoint:
- task (list)
- task (crear)
- task/:id (detalle)
- task/:id (actualizar)
- task/:id (eliminar)
Analiza y utiliza el metodo HTTP correspondiente para cada endpoint
Para que el proyecto pueda ser escalable organiza las carpetas por dominio
```

**Por qué funciona:** La IA sabe exactamente qué construir, con qué herramientas, y qué resultado entregar.

---

### Prompt iterativo

**Qué es:** Cuando no pides todo de una vez, sino que vas refinando con mensajes adicionales después de ver el resultado.

**Ejemplo real de la clase — las 3 rondas de refinamiento:**

**Ronda 1 — primer resultado de la IA → ajustes de datos:**
```
esta bien el formato propuesto, pero agreguemos el id y la created_at
que sea un id automatico
por ahora no necesito validaciones
extra: como es un proyecto basico podemos configurar cors dentro de app.js
```

**Ronda 2 — la IA usó sintaxis vieja → corrección técnica:**
```
veo que usaste require, esto no es acepta, migralo a usar module
para poder importar usando el "import", para esto busca que libreria
debes instalar para proceder de forma ordenada
```

**El flujo completo:**
```
Prompt inicial (contexto + stack + acción)
        ↓
    IA genera código
        ↓
Revisas el resultado → ves qué ajustar
        ↓
Prompt de refinamiento ("agreguemos id y created_at")
        ↓
    IA actualiza
        ↓
Revisas de nuevo → otro ajuste si hace falta
        ↓
Prompt de corrección ("usaste require, migralo a import")
        ↓
    Resultado final ✓
```

**Por qué importa:** No tienes que saber todo de antemano. Puedes ir revisando y corrigiendo igual que un developer senior revisa el trabajo de un junior.

---

### Tipos de prompt que usamos

| Tipo | Qué hace | Ejemplo de la clase |
|------|----------|---------------------|
| **Construcción** | Pide crear algo desde cero | "Construye el backend con estos endpoints" |
| **Adición** | Agrega algo al resultado existente | "agreguemos el id y la created_at" |
| **Corrección** | Arregla algo que salió mal | "veo que usaste require, migralo a usar import" |
| **Restricción** | Le dices qué NO hacer | "por ahora no necesito validaciones" |

---

### Contexto en un prompt

**Qué es:** La información de fondo que le das a la IA antes de pedirle algo. Sin contexto, la IA adivina — y adivina mal.

**Regla:** Siempre empieza con "qué estás construyendo" antes de pedir "qué hacer".

| Sin contexto ❌ | Con contexto ✓ |
|----------------|----------------|
| "crea los endpoints" | "estoy construyendo un Task Manager backend con Node.js y Express, crea los endpoints CRUD para tareas" |

---

### Especificidad en un prompt

**Qué es:** Qué tan preciso eres en tu pedido. Más específico = menos trabajo de corrección después.

**Ejemplo de la clase:**
- Vago: *"organiza bien el proyecto"*
- Específico: *"organiza las carpetas de forma ordenada y por dominio"* → la IA creó `src/tasks/model.js`, `src/tasks/controller.js`, `src/tasks/routes.js`

---

## Conceptos de Backend

### Backend

**Qué es:** La parte del sistema que el usuario NO ve. Es el motor que procesa la información, la guarda y la devuelve.

**Analogía:** Si un restaurante fuera una app, el frontend es el salón donde comes, y el backend es la cocina donde preparan la comida.

---

### API (Application Programming Interface)

**Qué es:** Un conjunto de "ventanillas" que ofrece tu backend para que otros puedan pedir o enviar información.

**Ejemplo real:** En la clase creamos `GET /tasks`, `POST /tasks`, `PUT /tasks/:id`, etc. Esas son las ventanillas de nuestra API.

---

### REST API

**Qué es:** Un estilo de diseño de APIs que usa HTTP y tiene reglas claras: usa URLs para identificar recursos y verbos HTTP para decir qué hacer.

**Recurso:** Una "cosa" de tu sistema. En este proyecto el recurso es `task` (tarea).

---

### Endpoint

**Qué es:** Una URL específica de tu API que hace una cosa concreta.

**Ejemplos del proyecto:**
| Endpoint | Qué hace |
|----------|----------|
| `GET /tasks` | Trae todas las tareas |
| `POST /tasks` | Crea una nueva tarea |
| `GET /tasks/:id` | Trae una tarea específica |
| `PUT /tasks/:id` | Actualiza una tarea |
| `DELETE /tasks/:id` | Elimina una tarea |

---

### CRUD

**Qué es:** Las 4 operaciones básicas que puedes hacer con datos. Viene de las iniciales en inglés.

| Letra | Inglés | Español    | HTTP usado |
| ----- | ------ | ---------- | ---------- |
| C     | Create | Crear      | POST       |
| R     | Read   | Leer       | GET        |
| U     | Update | Actualizar | PUT        |
| D     | Delete | Eliminar   | DELETE     |

**En el proyecto:** Implementamos CRUD completo para las tareas.

---

### HTTP y sus métodos (verbos)

**Qué es:** HTTP es el idioma que usan los navegadores e apps para comunicarse con servidores. Los métodos son como los "verbos" de ese idioma.

| Método   | Uso                   | Ejemplo del proyecto      |
| -------- | --------------------- | ------------------------- |
| `GET`    | Obtener datos         | Listar tareas             |
| `POST`   | Enviar/crear datos    | Crear tarea               |
| `PUT`    | Reemplazar/actualizar | Actualizar tarea completa |
| `DELETE` | Eliminar              | Borrar tarea              |

---

### Códigos de estado HTTP

**Qué es:** Números que el servidor manda de respuesta para decirte si todo salió bien o si hubo un error.

| Código | Significa                  | Cuándo lo usamos                           |
| ------ | -------------------------- | ------------------------------------------ |
| `200`  | OK — todo bien             | Tarea encontrada o actualizada             |
| `201`  | Created — creado           | Tarea creada exitosamente                  |
| `204`  | No Content — sin contenido | Tarea eliminada (no hay nada que devolver) |
| `404`  | Not Found — no encontrado  | La tarea no existe                         |

**Código real del proyecto (`controller.js`):**

```js
res.status(404).json({ error: "Task not found" });
res.status(201).json(newTask);
res.status(204).send();
```

---

### Request y Response

**Qué es:** Toda comunicación con el backend es un par: alguien pide (request) y el servidor responde (response).

**Abreviaciones en el código:**

- `req` = request (lo que llega)
- `res` = response (lo que mandas de vuelta)

**Ejemplo del proyecto (`controller.js`):**

```js
getAll: (req, res) => {
  const tasks = TaskModel.getAll();
  res.json(tasks); // res = lo que devolvemos
};
```

---

### JSON

**Qué es:** El formato de datos que usan las APIs para enviar y recibir información. Es texto estructurado con llaves y corchetes.

**Ejemplo — una tarea en JSON:**

```json
{
  "id": "abc-123",
  "title": "Hacer tarea",
  "description": "Estudiar para el examen",
  "completed": false,
  "created_at": "2026-05-05T10:00:00.000Z"
}
```

---

### Parámetro de ruta (`:id`)

**Qué es:** Una parte variable de la URL que le dice al servidor "cuál" recurso quieres.

**Ejemplo del proyecto:**

- URL: `/tasks/abc-123`
- El `:id` captura `abc-123`
- En el código: `req.params.id`

```js
router.get("/:id", TaskController.getById);
// req.params.id = "abc-123"
```

---

### Body (cuerpo de la petición)

**Qué es:** Los datos que envías junto con un POST o PUT. Van "dentro" del request, no en la URL.

**Ejemplo — crear tarea:**

```json
{
  "title": "Mi nueva tarea",
  "description": "Esta es la descripción"
}
```

**En el código:** `req.body` — accede a esos datos.

---

## Tecnologías usadas

### Node.js

**Qué es:** Motor que permite ejecutar JavaScript fuera del navegador, directamente en tu computadora o servidor.

**Antes de Node.js:** JavaScript solo corría en el browser. Node.js lo llevó al servidor.

---

### Express

**Qué es:** Un framework (herramienta) de Node.js que hace muy fácil crear servidores y APIs.

**Sin Express:** Tendrías que escribir cientos de líneas para manejar una petición HTTP.  
**Con Express:** Lo haces en pocas líneas.

**Código real del proyecto (`app.js`):**

```js
import express from "express";
const app = express();
app.use("/tasks", taskRoutes);
```

---

### CORS

**Qué es:** Un sistema de seguridad de los navegadores. Por defecto, un navegador bloquea peticiones a servidores que estén en dominios diferentes.

**Ejemplo del problema:** Tu frontend está en `localhost:5173` y tu backend en `localhost:3000` — sin CORS configurado, el browser bloquea la conexión.

**Solución en el proyecto:**

```js
import cors from "cors";
app.use(cors()); // Permite peticiones de cualquier origen
```

---

### UUID

**Qué es:** Un identificador único generado automáticamente. Muy difícil que dos sean iguales.

**Ejemplo:** `550e8400-e29b-41d4-a716-446655440000`

**Por qué lo usamos:** Para dar un `id` único a cada tarea sin tener que llevar un contador manual.

**Código del proyecto (`model.js`):**

```js
import { v4 as uuidv4 } from "uuid";
id: uuidv4(); // genera "abc-123-def-456..."
```

---

### package.json

**Qué es:** El archivo de configuración de tu proyecto Node.js. Lista las dependencias (librerías) que usas y los comandos para correr el proyecto.

**Del proyecto:**

```json
{
  "name": "task-manager-backend",
  "type": "module",
  "scripts": {
    "dev": "node src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "uuid": "^11.0.0"
  }
}
```

---

### ES Modules (`import` / `export`)

**Qué es:** La forma moderna de JavaScript para compartir código entre archivos.

**Antes (CommonJS — el viejo):**

```js
const express = require("express"); // ❌ viejo
module.exports = app;
```

**Ahora (ES Modules — el moderno):**

```js
import express from "express"; // ✅ moderno
export default app;
```

**En el proyecto:** Se cambió de `require` a `import` porque usamos `"type": "module"` en `package.json`.

---

## Arquitectura del proyecto

### Organización por dominio

**Qué es:** Agrupar archivos por "tema" o "funcionalidad" en lugar de por tipo de archivo.

**En el proyecto:**

```
src/
  tasks/
    model.js      → datos
    controller.js → lógica
    routes.js     → rutas
    index.js      → punto de entrada del módulo
  docs/
    swagger.js    → documentación
  app.js          → configuración de Express
  server.js       → arrancar el servidor
```

---

### Model (Modelo)

**Qué es:** El archivo que maneja los datos directamente — guardar, buscar, modificar, eliminar.

**En el proyecto (`model.js`):** Trabaja con el array `tasks[]` en memoria. Tiene las funciones: `getAll`, `getById`, `create`, `update`, `delete`.

---

### Controller (Controlador)

**Qué es:** El archivo que recibe las peticiones HTTP y decide qué hacer — llama al model y manda la respuesta.

**En el proyecto (`controller.js`):** Recibe el `req`, llama a `TaskModel`, y manda el `res`.

---

### Routes (Rutas)

**Qué es:** El archivo que conecta URLs con controladores. Define "cuando alguien llame a esta URL, ejecuta esta función".

**En el proyecto (`routes.js`):**

```js
router.get("/", TaskController.getAll); // GET /tasks
router.post("/", TaskController.create); // POST /tasks
router.get("/:id", TaskController.getById); // GET /tasks/:id
```

---

### Memoria local (en memoria)

**Qué es:** Guardar datos en un array dentro del código, en lugar de una base de datos real.

**Ventaja:** Simple, no necesitas instalar nada más.  
**Desventaja:** Al reiniciar el servidor, los datos desaparecen.

**En el proyecto:**

```js
const tasks = []; // aquí viven las tareas mientras el servidor corre
```

---

## Documentación

### Swagger / OpenAPI

**Qué es:** Un estándar para documentar APIs. Genera automáticamente una página web interactiva donde puedes ver y probar todos tus endpoints.

**En el proyecto:** Disponible en `http://localhost:3000/api-docs`

**Por qué importa:** Sin documentación, nadie sabe cómo usar tu API. Swagger la genera visualmente.

---

## Resumen visual del flujo

```
Usuario/Cliente
      |
      | (HTTP Request)
      ↓
   routes.js        ← define qué URL llama a qué función
      |
      ↓
 controller.js      ← recibe req, procesa, llama al model
      |
      ↓
   model.js         ← accede al array tasks[] en memoria
      |
      ↓ (datos)
 controller.js      ← construye la respuesta
      |
      | (HTTP Response con JSON)
      ↓
Usuario/Cliente
```

---

_Clase 02 — Vibe Coding G2 — Task Manager Backend_
