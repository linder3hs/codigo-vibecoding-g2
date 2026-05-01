# Paso 5 — Claude Code

[← Paso 4: Warp](./04-warp.md) | [← Volver al índice](../README.md) | [Siguiente: OpenCode →](./06-opencode.md)

---

Claude Code es el asistente de IA que vive en tu terminal. Le puedes pedir que escriba código, explique errores, cree archivos, y mucho más — todo sin salir de la línea de comandos.

---

## ⚠️ Requisito importante — Cuenta Pro

> **Claude Code requiere una cuenta Pro de Anthropic para funcionar correctamente.**
>
> - El plan gratuito tiene acceso muy limitado y no es suficiente para usarlo en el curso
> - El plan Pro cuesta aproximadamente **$20 USD por mes**
>
> **¿No puedes tener la cuenta Pro por ahora?**
> No hay problema — usa [OpenCode](./06-opencode.md) que es gratuito y cumple la misma función para lo que haremos en el curso.

---

## Requisitos previos

- [x] Node.js instalado ([ver Paso 2](./02-nodejs.md))
- [x] Cuenta Pro en [claude.ai](https://claude.ai)

---

## Instalación

```bash
npm install -g @anthropic-ai/claude-code
```

### Verificar instalación

```bash
claude --version
```

Si ves un número de versión, la instalación fue exitosa.

---

## Iniciar sesión (primera vez)

```bash
claude
```

Se abrirá tu navegador para iniciar sesión con tu cuenta de Anthropic. Una vez autenticado, regresa a la terminal — ya puedes empezar a usarlo.

---

## Cómo usar Claude Code

### Modo interactivo (el más común)

Navega a tu carpeta de proyecto y abre Claude Code:

```bash
cd mi-proyecto
claude
```

Ahora puedes escribirle en español lo que necesites:

```
> Crea un archivo index.html con una página de bienvenida
> Explícame qué hace este código
> Tengo un error, ayúdame a entenderlo
> Crea una función en JavaScript que sume dos números
> Añade un botón azul a mi página
```

Para salir:
```
> /exit
```

O presiona `Ctrl + C`.

---

### Modo comando directo

Puedes darle una instrucción sin abrir el chat:

```bash
claude "crea un archivo llamado hola.js que imprima Hola Mundo en consola"
claude "explícame qué hace el archivo index.js"
claude "lista todos los archivos en esta carpeta y explica para qué sirve cada uno"
```

---

## Comandos dentro del chat

| Comando | Qué hace |
|---|---|
| `/help` | Muestra todos los comandos disponibles |
| `/clear` | Limpia la conversación y empieza de nuevo |
| `/exit` | Sale de Claude Code |
| `Ctrl + C` | Interrumpe una tarea que está corriendo |

---

## Tips para usarlo bien

**Sé específico en lo que pides.** Mientras más detalles des, mejor será la respuesta.

En lugar de:
```
> hazme una página web
```

Mejor:
```
> crea un archivo index.html con una página que tenga un título que diga "Mi primer sitio", 
  un párrafo de bienvenida y un botón azul que diga "Empezar"
```

**Puedes pedirle que explique lo que hizo:**
```
> explícame línea por línea qué hace el código que acabas de crear
```

**Si algo no quedó como querías, díselo:**
```
> el botón quedó muy pequeño, hazlo más grande y ponlo centrado
```

---

## Restricciones y límites

| Aspecto | Detalle |
|---|---|
| **Cuenta requerida** | Pro de Anthropic (~$20 USD/mes) |
| **Plan gratuito** | Muy limitado, no recomendado para el curso |
| **Límites de uso** | Puede haber límites por hora en momentos de alta demanda |
| **Conexión** | Requiere internet para funcionar |
| **Archivos** | Lee y puede modificar los archivos de tu proyecto — úsalo dentro de la carpeta correcta |

---

## ¿No puedes usar Claude Code?

Ve al [Paso 6 — OpenCode](./06-opencode.md), que es gratuito y funciona de manera muy similar.

---

[← Paso 4: Warp](./04-warp.md) | [← Volver al índice](../README.md) | [Siguiente: OpenCode →](./06-opencode.md)
