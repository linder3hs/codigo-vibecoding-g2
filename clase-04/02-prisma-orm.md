# Prisma ORM

[← Anterior: Bases de Datos](./01-base-de-datos-postgresql.md) | [Siguiente: Autenticación →](./03-autenticacion.md)

---

## ¿Qué es un ORM?

ORM = **Object-Relational Mapping**. Es una capa que traduce entre el mundo de los objetos JavaScript y el mundo de las tablas SQL.

```
Sin ORM (SQL directo):            Con ORM (Prisma):
──────────────────────            ─────────────────────────────
const result = await db.query(    const tasks = await prisma
  `SELECT * FROM tasks            .task.findMany();
   WHERE completed = false`
);
const tasks = result.rows;
```

Prisma se encarga de generar el SQL correcto. Tú escribes JavaScript/TypeScript.

---

## El schema — definición del modelo de datos

El archivo `prisma/schema.prisma` es el corazón de Prisma. Define:
1. Cómo conectarse a la base de datos
2. Qué tablas existen y qué columnas tienen

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"  // donde se genera el cliente
}

datasource db {
  provider = "postgresql"               // motor de BD
}

model User {
  id        String   @id @default(uuid())    // PK, UUID automático
  name      String
  lastname  String
  email     String   @unique                 // no puede repetirse
  password  String
  createdAt DateTime @default(now()) @map("created_at")
  tasks     Task[]                           // relación: un user tiene muchas tasks

  @@map("users")  // nombre de la tabla en PostgreSQL
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?                        // ? = campo opcional (nullable)
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_at")
  userId      String?  @map("user_id")
  user        User?    @relation(fields: [userId], references: [id])

  @@map("tasks")
}
```

---

## Migraciones — cómo se crean las tablas

Una **migración** es un archivo que describe cómo cambiar la base de datos. Prisma genera el SQL automáticamente a partir del schema.

```bash
# Crear migración y aplicarla
npx prisma migrate dev --name init
```

Esto crea un archivo en `prisma/migrations/`:

```
prisma/migrations/
├── 20260513011855_init/         ← primera migración (tablas iniciales)
│   └── migration.sql
└── 20260513033723_add_users/    ← segunda migración (tabla users)
    └── migration.sql
```

Cada migración es **inmutable** — es el historial de cambios de la BD. Similar a los commits de git.

---

## Prisma Client — cómo se usa en el código

Prisma genera un cliente TypeScript tipado en `src/generated/prisma/`. Se instancia una vez y se reutiliza:

```ts
// src/lib/prisma.js
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
```

**`Pool`**: grupo de conexiones reutilizables a PostgreSQL. Más eficiente que abrir/cerrar una conexión por request.

---

## Operaciones CRUD con Prisma

```ts
// Traer todos los registros
await prisma.task.findMany()

// Traer uno por ID
await prisma.task.findUnique({ where: { id } })

// Traer uno por campo único (ej: email)
await prisma.user.findUnique({ where: { email } })

// Crear
await prisma.task.create({
  data: { title: "Nueva tarea", completed: false }
})

// Actualizar (solo los campos que lleguen)
await prisma.task.update({
  where: { id },
  data: {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.completed !== undefined && { completed: data.completed }),
  }
})

// Eliminar
await prisma.task.delete({ where: { id } })
```

---

## Ventajas de Prisma vs SQL directo

| Aspecto | SQL directo | Prisma |
|---|---|---|
| **Autocompletado** | Ninguno | Tipos completos en TS |
| **Errores** | Runtime | Detectados en compilación |
| **Seguridad** | SQL injection posible | Parametrizado automáticamente |
| **Migraciones** | Manual | Generadas del schema |
| **Legibilidad** | SQL strings | JavaScript/TypeScript |

---

## Comandos útiles de Prisma

```bash
# Crear y aplicar migración
npx prisma migrate dev --name descripcion

# Abrir Prisma Studio (interfaz visual de la BD)
npx prisma studio

# Regenerar el cliente (después de cambiar el schema)
npx prisma generate

# Ver el estado de las migraciones
npx prisma migrate status
```

---

[Siguiente: Autenticación →](./03-autenticacion.md)
