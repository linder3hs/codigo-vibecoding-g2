# Vibe Coding G2

> Material de todas las clases. Sigue el orden — cada clase construye sobre la anterior.

---

## Clases

### Clase 01 — Configuración del entorno

> Instala todo lo necesario para empezar a programar.

| Paso                                   | Tema                        | Descripción                                            |
| -------------------------------------- | --------------------------- | ------------------------------------------------------ |
| [Paso 1](./clase-01/01-terminal.md)    | Terminal y comandos básicos | Aprende a moverte por tu computadora desde la terminal |
| [Paso 2](./clase-01/02-nodejs.md)      | Node.js                     | Instala el motor que necesita todo lo demás            |
| [Paso 3](./clase-01/03-cursor.md)      | Cursor                      | Tu editor de código con IA integrada                   |
| [Paso 4](./clase-01/04-warp.md)        | Warp y alternativas         | Terminal moderna — y qué hacer si no funciona          |
| [Paso 5](./clase-01/05-claude-code.md) | Claude Code                 | Asistente de IA en tu terminal (requiere cuenta Pro)   |
| [Paso 6](./clase-01/06-opencode.md)    | OpenCode                    | Alternativa gratuita a Claude Code                     |

**Checklist antes de la Clase 02:**
- [ ] Terminal abierta y comandos básicos funcionando
- [ ] `node --version` muestra un número
- [ ] `npm --version` muestra un número
- [ ] Cursor instalado y abierto
- [ ] Una terminal que funciona (Warp u alternativa)
- [ ] **Opción A:** Claude Code autenticado con cuenta Pro
- [ ] **Opción B:** OpenCode configurado con un proveedor gratuito

---

### Clase 02 — Task Manager Backend

> Construimos una API REST desde cero con Node.js y Express usando Vibe Coding.

| Archivo                                                        | Qué contiene                                         |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| [Conceptos de Backend](./clase-02/conceptos-backend.md)        | Backend, API, REST, endpoints, HTTP, JSON explicados |
| [Glosario de la Clase](./clase-02/glosario-clase-02.md)        | Todos los términos vistos en clase con ejemplos      |
| [Prompt usado en clase](./clase-02/prompt1.md)                 | El prompt real con el que construimos el proyecto    |
| [Código del proyecto](./task-manager-backend/)                 | Backend completo — Node.js + Express                 |

**Qué construimos:**
- API REST con 5 endpoints CRUD para tareas
- Organización por dominio (model / controller / routes)
- IDs únicos automáticos con UUID
- Documentación interactiva en `/api-docs` (Swagger)

**Para correr el proyecto:**
```bash
cd task-manager-backend
npm install
npm run dev
# API en http://localhost:3000
# Docs en http://localhost:3000/api-docs
```

---

## ¿Por dónde empezar?

Si es tu primera vez, sigue las clases **en orden**.

Si quieres repasar algo específico, entra directo al archivo que necesitas.

> Si algo no funciona, avisa en el grupo. No te quedes atascado solo.

---

_Vibe Coding G2 · 2026_
