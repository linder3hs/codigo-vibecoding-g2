# Documentación de APIs con Swagger

[← Anterior: Autenticación](./03-autenticacion.md) | [Siguiente: Glosario →](./glosario-clase-04.md)

---

## ¿Qué es Swagger / OpenAPI?

**OpenAPI** es un estándar para describir APIs REST. **Swagger** es el conjunto de herramientas más popular para trabajar con ese estándar.

**¿Para qué sirve?**
- Documentación interactiva de la API
- El frontend sabe exactamente qué endpoints existen y qué datos esperar
- Permite probar la API desde el navegador sin usar curl ni Postman

---

## Acceso a la documentación

Con el servidor corriendo, la documentación está disponible en:

```
http://localhost:3000/api-docs
```

Desde ahí puedes ver todos los endpoints, sus parámetros, y ejecutar peticiones reales.

---

## Configuración en el proyecto

```js
// src/docs/swagger.js
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Manager API",
      version: "1.0.0",
      description: "API para gestión de tareas",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      schemas: { /* definición de modelos */ }
    },
    paths: { /* definición de endpoints */ }
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
```

```js
// src/app.js — registra Swagger UI
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

## Schemas — modelos de datos documentados

Los schemas describen la forma de los objetos de la API:

```js
// Schema de Task — lo que devuelve el servidor
Task: {
  type: "object",
  properties: {
    id:          { type: "string", format: "uuid" },
    title:       { type: "string" },
    description: { type: "string" },
    completed:   { type: "boolean", default: false },
    created_at:  { type: "string", format: "date-time" },
  }
}

// Schema de TaskInput — lo que manda el cliente para crear
TaskInput: {
  type: "object",
  required: ["title"],           // ← campos obligatorios
  properties: {
    title:       { type: "string" },
    description: { type: "string" },
    completed:   { type: "boolean" },
  }
}
```

---

## Endpoints documentados

### Tasks

| Método | Path | Descripción |
|---|---|---|
| GET | `/tasks` | Obtener todas las tareas |
| POST | `/tasks` | Crear tarea (`TaskInput`) |
| GET | `/tasks/{id}` | Obtener tarea por ID |
| PUT | `/tasks/{id}` | Actualizar tarea (`TaskUpdate`) |
| DELETE | `/tasks/{id}` | Eliminar tarea |

### Users

| Método | Path | Descripción |
|---|---|---|
| POST | `/users/register` | Registrar usuario (`UserRegisterInput`) |
| POST | `/users/login` | Login (`UserLoginInput`) → `LoginResponse` |

---

## Códigos de respuesta HTTP documentados

Para cada endpoint se documentan todos los posibles códigos:

```
GET /tasks/{id}:
  200 → Tarea encontrada
  404 → Tarea no encontrada

POST /users/register:
  201 → Usuario creado
  400 → Campos faltantes o inválidos
  409 → Email ya registrado

POST /users/login:
  200 → Login exitoso { user, token }
  400 → Email o contraseña faltantes
  401 → Credenciales inválidas
```

Documentar los errores es tan importante como documentar el éxito.

---

## Por qué documentar la API

1. **Para el equipo:** El frontend no necesita preguntarle al backend cómo funciona cada endpoint
2. **Para pruebas:** Swagger UI permite probar sin Postman ni curl
3. **Para clientes externos:** Si otros sistemas consumen la API, saben exactamente cómo usarla
4. **Para mantenimiento:** La documentación vive junto al código, no en un doc separado que se desactualiza

---

[Siguiente: Glosario →](./glosario-clase-04.md)
