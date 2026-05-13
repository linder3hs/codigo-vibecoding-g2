# Bases de Datos y PostgreSQL

[← Volver al índice](../README.md) | [Siguiente: Prisma ORM →](./02-prisma-orm.md)

---

## ¿Por qué necesitamos una base de datos?

En la clase 02, las tareas se guardaban en un **array en memoria**:

```js
// Clase 02 — los datos vivían aquí
let tasks = [];
```

**El problema:** Cada vez que se reinicia el servidor, todos los datos desaparecen.

**La solución:** Una base de datos que persiste los datos en disco.

```
Clase 02 (memoria):                 Clase 04 (base de datos):
─────────────────────               ───────────────────────────
let tasks = []                      PostgreSQL
 ↓ reinicio del servidor             ↓ datos persisten siempre
tasks = []  ← PERDIDO               datos intactos ✓
```

---

## ¿Qué es PostgreSQL?

PostgreSQL (o "Postgres") es un sistema de gestión de bases de datos **relacional**. Los datos se organizan en **tablas**, como hojas de cálculo:

### Tabla `users`
| id | name | lastname | email | password | created_at |
|---|---|---|---|---|---|
| uuid-1 | Ana | López | ana@email.com | $2b$10$... | 2026-05-13 |
| uuid-2 | Carlos | García | carlos@email.com | $2b$10$... | 2026-05-13 |

### Tabla `tasks`
| id | title | description | completed | user_id | created_at |
|---|---|---|---|---|---|
| uuid-a | Estudiar | Ver los videos | false | uuid-1 | 2026-05-13 |
| uuid-b | Practicar | Ejercicios | true | uuid-1 | 2026-05-13 |

---

## Relaciones entre tablas

La columna `user_id` en `tasks` hace referencia al `id` en `users`. Esto es una **relación**: una tarea **pertenece a** un usuario, un usuario **tiene muchas** tareas.

```
users                          tasks
──────────────────             ──────────────────────────────────
id: uuid-1          ◄────┐    id: uuid-a
name: "Ana"              │    title: "Estudiar"
                         └──  user_id: uuid-1  ← clave foránea (FK)
```

---

## SQL — el lenguaje de las bases de datos

Las bases de datos relacionales usan SQL (Structured Query Language). En este proyecto **no escribimos SQL directamente** — Prisma lo hace por nosotros — pero es útil entenderlo:

```sql
-- Traer todas las tareas de un usuario
SELECT * FROM tasks WHERE user_id = 'uuid-1';

-- Crear una tarea
INSERT INTO tasks (id, title, completed, user_id)
VALUES ('uuid-c', 'Nueva tarea', false, 'uuid-1');

-- Actualizar
UPDATE tasks SET completed = true WHERE id = 'uuid-c';

-- Eliminar
DELETE FROM tasks WHERE id = 'uuid-c';
```

---

## UUID — identificadores únicos

En vez de números (1, 2, 3...), usamos **UUID** (Universally Unique Identifier):

```
550e8400-e29b-41d4-a716-446655440000
```

**Por qué:** Los números secuenciales son predecibles (un atacante puede probar `/users/1`, `/users/2`...). Los UUID son imposibles de adivinar.

PostgreSQL los genera automáticamente con `@default(uuid())` en el schema de Prisma.

---

## Configuración de la conexión

La URL de conexión a la base de datos se guarda en `.env`:

```bash
# .env
DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_db"
```

**Nunca se sube al repositorio** — por eso está en `.gitignore`.

---

[Siguiente: Prisma ORM →](./02-prisma-orm.md)
