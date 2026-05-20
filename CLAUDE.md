# Task Manager — Monorepo Guide

## Structure

```
codigo-vibecoding-g2/
├── task-manager-backend/   # Express + Prisma + PostgreSQL API
├── task-manager-frontend/  # React + TypeScript + Vite + Tailwind
└── clase-0X/               # Course reference notes (do not modify)
```

## Projects

### task-manager-backend

|           |                                                |
| --------- | ---------------------------------------------- |
| Runtime   | Node.js ESM                                    |
| Framework | Express 4                                      |
| ORM       | Prisma 7 (PostgreSQL)                          |
| Auth      | bcrypt (register/login, no JWT yet)            |
| Docs      | Swagger UI at `http://localhost:3000/api-docs` |
| Port      | `3000`                                         |

**Start:** `cd task-manager-backend && npm run dev`

**Source layout:**

```
src/
├── server.js          # Entry point
├── app.js             # Express setup, route mounting, CORS
├── lib/prisma.js      # Prisma client singleton
├── tasks/             # routes.js · controller.js · model.js · index.js
├── users/             # routes.js · controller.js · model.js · index.js
├── docs/swagger.js    # Swagger spec
└── generated/prisma/  # Auto-generated — never edit manually
```

**API routes:**

```
GET    /tasks
POST   /tasks
GET    /tasks/:id
PUT    /tasks/:id
DELETE /tasks/:id

POST   /users/register
POST   /users/login
```

**DB schema (prisma/schema.prisma):**

- `User` — id (uuid), name, lastname, email (unique), password, createdAt
- `Task` — id (uuid), title, description?, completed (bool), createdAt, userId? → User

---

### task-manager-frontend

|           |                       |
| --------- | --------------------- |
| Framework | React 19              |
| Language  | TypeScript            |
| Bundler   | Vite                  |
| Styling   | Tailwind CSS v4       |
| HTTP      | axios                 |
| Routing   | react-router-dom v7   |
| Icons     | lucide-react          |
| Port      | `5173` (Vite default) |

**Start:** `cd task-manager-frontend && npm run dev`

**Source layout:**

```
src/
├── main.tsx
├── App.tsx            # Router setup
├── services/api.ts    # All axios calls to backend
├── types/Task.ts      # Task + TaskFormData interfaces
├── pages/             # Home · Login · TaskDetail
└── components/        # Header · TaskCard · TaskDialog
```

**Backend connection:** `api.ts` hardcodes `baseURL: "http://localhost:3000"`.
Change via `VITE_API_URL` env var if needed.

---

## Communication

```
Frontend (Vite :5173)
  └─ axios → http://localhost:3000
       └─ Express (backend :3000)
            └─ Prisma Client → PostgreSQL
```

CORS enabled globally in `app.js`. No auth token flow yet — login endpoint exists but frontend does not store/send tokens.

---

## Feature Development from Root

When adding a feature, split work by layer:

### Backend tasks

- New Prisma model or field → edit `prisma/schema.prisma` → run `npx prisma migrate dev`
- New endpoint → add route in `src/<domain>/routes.js`, controller logic in `controller.js`, DB query in `model.js`
- Expose via `app.js` if new domain

### Frontend tasks

- New API call → `src/services/api.ts`
- New shared type → `src/types/`
- New page → `src/pages/` + register route in `App.tsx`
- New reusable component → `src/components/`

### Typical full-stack feature checklist

1. Define/migrate DB schema (backend)
2. Add model query (backend `model.js`)
3. Add controller + route (backend)
4. Add TypeScript type (frontend `types/`)
5. Add service call (frontend `services/api.ts`)
6. Build UI component/page (frontend)

---

## Auth gap (known)

Backend has `/users/register` and `/users/login` with bcrypt. Frontend has a `Login.tsx` page. But:

- No JWT or session tokens implemented
- No auth middleware protecting routes
- Frontend does not attach any token to requests

Next step: add JWT to backend → send from frontend as `Authorization: Bearer <token>`.

---

## Dev Commands

> **AI must never run `npm run dev` for backend or frontend.** Dev servers are started manually by the developer only.

```bash
# Backend — run manually
cd task-manager-backend && npm run dev

# Frontend — run manually
cd task-manager-frontend && npm run dev

# Prisma — AI may run these
cd task-manager-backend
npx prisma migrate dev --name <migration-name>
npx prisma studio
```
