# Autenticación de Usuarios

[← Anterior: Prisma ORM](./02-prisma-orm.md) | [Siguiente: Swagger →](./04-swagger.md)

---

## ¿Qué es autenticación?

**Autenticación** = verificar que el usuario es quien dice ser.
**Autorización** = verificar que el usuario tiene permiso para hacer algo.

En esta clase implementamos autenticación básica: registro y login con email/password.

---

## El módulo de usuarios

Nuevo dominio agregado al backend, siguiendo la misma estructura que `tasks/`:

```
src/users/
├── model.js      ← lógica de datos (Prisma)
├── controller.js ← lógica HTTP (request/response)
├── routes.js     ← definición de endpoints
└── index.js      ← exportación del router
```

### Endpoints nuevos

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/users/register` | Crea un usuario nuevo |
| POST | `/users/login` | Verifica credenciales, devuelve token |

---

## El problema de guardar contraseñas

**NUNCA se guarda la contraseña en texto plano.** Si la base de datos es comprometida, todas las contraseñas quedan expuestas.

```
❌ MAL — texto plano:
users table:
  email: ana@email.com
  password: micontraseña123    ← cualquiera que vea la BD la puede leer

✓ BIEN — hash:
users table:
  email: ana@email.com
  password: $2b$10$...         ← hash irreversible
```

---

## bcrypt — hashing de contraseñas

`bcrypt` es la librería estándar para hashear contraseñas. Opera en dos pasos:

### Al registrar — hashear

```js
import bcrypt from 'bcrypt';

// 10 = "salt rounds" — cuántas veces se aplica el algoritmo
// Más rounds = más seguro pero más lento
const hashedPassword = await bcrypt.hash(data.password, 10);

// Guarda el hash, nunca la contraseña original
await prisma.user.create({
  data: { ...data, password: hashedPassword }
});
```

### Al hacer login — verificar

```js
const isValid = await bcrypt.compare(passwordIngresado, hashGuardadoEnDB);
// true si coincide, false si no
// bcrypt sabe cómo comparar incluso sin ver la contraseña original
```

**Por qué bcrypt y no MD5/SHA256:** Bcrypt es lento por diseño (los "rounds"). Esto hace que los ataques de fuerza bruta sean impracticables.

---

## Flujo completo de registro

```
Cliente                         Backend                      DB
   │                               │                          │
   │─── POST /users/register ──────►│                          │
   │    { name, lastname,          │                          │
   │      email, password }        │                          │
   │                               │                          │
   │                          Valida campos                   │
   │                               │                          │
   │                          Busca si email ya existe        │
   │                               │──── findUnique ─────────►│
   │                               │◄─── null ───────────────│
   │                               │                          │
   │                          Hash de la contraseña           │
   │                          (bcrypt.hash)                   │
   │                               │                          │
   │                          Crea el usuario                 │
   │                               │──── create ─────────────►│
   │                               │◄─── user ───────────────│
   │                               │                          │
   │◄── 201 { id, name, email } ───│                          │
   │    (sin password)             │                          │
```

---

## Flujo completo de login

```
Cliente                         Backend
   │                               │
   │─── POST /users/login ─────────►│
   │    { email, password }        │
   │                               │
   │                          Busca usuario por email
   │                          Si no existe → 401
   │                               │
   │                          Compara password con hash
   │                          (bcrypt.compare)
   │                          Si no coincide → 401
   │                               │
   │                          Genera token
   │                               │
   │◄── 200 { user, token } ───────│
```

---

## El token — identificación del usuario

Después del login, el servidor devuelve un **token**. El cliente lo guarda y lo manda en futuras peticiones para demostrar que está autenticado.

### Token implementado en clase (básico)

```js
const generateToken = (user) => {
  const payload = `${user.id}:${user.email}`;
  return Buffer.from(payload).toString('base64');
};
```

Esto genera una cadena base64 del ID y email del usuario.

> **Importante:** Este token es educativo. En producción se usa **JWT (JSON Web Token)** que incluye firma criptográfica para que no pueda ser falsificado.

---

## Buenas prácticas implementadas

### 1. Nunca devolver la contraseña hasheada

```js
const user = await UserModel.register(data);
const { password: _, ...userWithoutPassword } = user;
// Desestructuring — excluye 'password' de la respuesta
res.status(201).json(userWithoutPassword);
```

### 2. Mensajes de error genéricos en login

```js
// ❌ MAL — le dice al atacante si el email existe
{ error: 'Email no registrado' }
{ error: 'Contraseña incorrecta' }

// ✓ BIEN — no revela información
{ error: 'Invalid credentials' }
```

### 3. Validación de campos requeridos

```js
if (!name || !lastname || !email || !password) {
  return res.status(400).json({ error: 'All fields are required' });
}
```

### 4. Verificar email duplicado antes de crear

```js
const existingUser = await UserModel.findByEmail(email);
if (existingUser) {
  return res.status(409).json({ error: 'Email already registered' });
}
```

---

[Siguiente: Swagger →](./04-swagger.md)
