# Glosario Clase 04 — Backend Evolucionado

> Base de datos, ORM, autenticación, y documentación de APIs. Los conceptos clave de esta clase.

---

## Bases de datos

---

### Base de datos relacional

**Qué es:** Sistema que organiza datos en tablas con filas y columnas. Las tablas se relacionan entre sí mediante claves.

**PostgreSQL** es el motor relacional que usamos en este proyecto.

**Analogía:** Una hoja de cálculo de Excel, pero mucho más potente y con relaciones entre hojas.

---

### Tabla

**Qué es:** Estructura de almacenamiento de datos. Tiene columnas (campos) y filas (registros).

En este proyecto: tablas `users` y `tasks`.

---

### Clave primaria (Primary Key / PK)

**Qué es:** Campo que identifica únicamente cada fila. No puede repetirse ni ser nulo.

```prisma
id String @id @default(uuid())
```

`@id` = clave primaria. `@default(uuid())` = PostgreSQL genera el UUID automáticamente.

---

### Clave foránea (Foreign Key / FK)

**Qué es:** Campo en una tabla que referencia la clave primaria de otra tabla. Establece la relación.

```prisma
// En Task
userId String? @map("user_id")
user   User?   @relation(fields: [userId], references: [id])
```

`userId` en `tasks` apunta al `id` de `users`.

---

### UUID (Universally Unique Identifier)

**Qué es:** Identificador de 128 bits, prácticamente imposible de duplicar o predecir.

**Formato:** `550e8400-e29b-41d4-a716-446655440000`

**Por qué vs. número secuencial:** Los IDs secuenciales son predecibles (atacante puede iterar `/users/1`, `/users/2`...). Los UUID no.

---

### Migración

**Qué es:** Script que describe cómo cambiar la estructura de la base de datos. Tiene versión y es irreversible (como un commit de git).

```
prisma/migrations/
├── 20260513011855_init/      ← crea tablas iniciales
└── 20260513033723_add_users/ ← agrega tabla users
```

---

### Pool de conexiones

**Qué es:** Grupo de conexiones a la base de datos que se reutilizan. Abrir y cerrar una conexión por cada request es caro en tiempo.

```js
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Pool mantiene N conexiones abiertas y las presta por request
```

---

## ORM y Prisma

---

### ORM (Object-Relational Mapping)

**Qué es:** Librería que traduce entre objetos JavaScript y tablas SQL. Evita escribir SQL manual.

En este proyecto: **Prisma**.

---

### Schema de Prisma

**Qué es:** Archivo `prisma/schema.prisma` que define los modelos de datos. Prisma lo usa para:
1. Generar las migraciones SQL
2. Generar el cliente TypeScript tipado

---

### Prisma Client

**Qué es:** Cliente generado automáticamente por Prisma a partir del schema. Expone métodos tipados para cada modelo.

```ts
prisma.task.findMany()    // TypeScript sabe que devuelve Task[]
prisma.user.findUnique()  // TypeScript sabe que devuelve User | null
```

---

### Campo opcional (nullable)

**Qué es:** Campo que puede tener valor o ser `null`. Se marca con `?` en Prisma.

```prisma
description String?  // puede ser null
userId      String?  // puede ser null (tarea sin usuario asignado)
```

---

## Autenticación

---

### Autenticación vs Autorización

| Término | Pregunta que responde | Ejemplo |
|---|---|---|
| **Autenticación** | ¿Quién eres? | Login con email/password |
| **Autorización** | ¿Qué puedes hacer? | Solo admins pueden eliminar usuarios |

---

### Hash (hashing)

**Qué es:** Transformación **unidireccional** de datos. Un hash no se puede revertir al valor original.

```
"micontraseña123" → bcrypt → "$2b$10$xyz..."
"$2b$10$xyz..."  → ??? → IMPOSIBLE de recuperar el original
```

**Por qué es seguro:** Si alguien roba la base de datos, solo ve hashes, no contraseñas.

---

### bcrypt

**Qué es:** Algoritmo de hashing diseñado específicamente para contraseñas. Es **lento por diseño**.

```js
bcrypt.hash(password, 10)     // hashear — 10 = salt rounds
bcrypt.compare(input, hash)   // verificar — devuelve true/false
```

**Salt rounds:** Número de veces que se aplica el algoritmo. Más rounds = más lento para el atacante.

---

### Salt

**Qué es:** Valor aleatorio agregado a la contraseña antes de hashear. Garantiza que dos usuarios con la misma contraseña tengan hashes distintos.

```
usuario1: "password123" + salt_abc → hash_XYZ
usuario2: "password123" + salt_def → hash_MNO
```

bcrypt genera y guarda el salt automáticamente dentro del hash.

---

### Token de autenticación

**Qué es:** Cadena generada por el servidor después del login. El cliente la guarda y la envía en peticiones futuras para demostrar su identidad.

```
Login exitoso → servidor genera token → cliente guarda token
Próxima petición → cliente envía token → servidor verifica quién es
```

**En clase (básico):**
```js
const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');
```

**En producción:** JWT (JSON Web Token) con firma criptográfica.

---

### JWT (JSON Web Token)

**Qué es:** Estándar de token que incluye datos y firma criptográfica. Permite al servidor verificar que el token no fue alterado sin consultar la base de datos.

**Estructura:** `header.payload.signature`

> El token básico de esta clase es educativo. En una app real se usa JWT.

---

### Códigos de estado HTTP para auth

| Código | Significado | Cuándo usarlo |
|---|---|---|
| `201` | Created | Usuario registrado exitosamente |
| `400` | Bad Request | Campos faltantes en registro/login |
| `401` | Unauthorized | Credenciales incorrectas |
| `409` | Conflict | Email ya registrado |

---

## Documentación de APIs

---

### OpenAPI / Swagger

**Qué es:** Estándar para describir APIs REST. Swagger es la implementación más popular.

**Acceso en el proyecto:** `http://localhost:3000/api-docs`

---

### swagger-jsdoc

**Qué es:** Librería que genera el spec de OpenAPI desde código JavaScript (ya sea JSDoc comments o un objeto de configuración).

---

### swagger-ui-express

**Qué es:** Middleware Express que sirve la interfaz visual de Swagger (la página web interactiva) desde una URL de la API.

```js
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

### Schema de OpenAPI

**Qué es:** Definición del formato de un objeto de datos en la documentación. Se referencia con `$ref`.

```js
{ $ref: "#/components/schemas/Task" }
// ↑ reutiliza la definición de Task en lugar de repetirla
```

---

## Variables de entorno

---

### `.env` — Environment variables

**Qué es:** Archivo que guarda configuración sensible fuera del código. Nunca se sube al repositorio.

```bash
# .env
DATABASE_URL="postgresql://..."
```

```js
// Se accede con process.env
const url = process.env.DATABASE_URL;
```

---

### `.gitignore`

**Qué es:** Archivo que le dice a git qué archivos ignorar. El `.env` siempre debe estar aquí.

```
# .gitignore
.env
node_modules/
```

Si el `.env` llega al repositorio y es público, las credenciales quedan expuestas.

---

[← Volver al índice](../README.md)
