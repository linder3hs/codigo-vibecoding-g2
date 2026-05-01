# Paso 6 — OpenCode (Alternativa gratuita)

[← Paso 5: Claude Code](./05-claude-code.md) | [← Volver al índice](../README.md)

---

OpenCode es una herramienta similar a Claude Code pero que puede conectarse a diferentes modelos de IA, incluyendo opciones gratuitas. Es la **alternativa recomendada si no tienes cuenta Pro de Anthropic**.

> ✅ **Si no puedes usar Claude Code por ahora, usa OpenCode.** Cumple la misma función para lo que haremos en el curso.

---

## Requisitos previos

- [x] Node.js instalado ([ver Paso 2](./02-nodejs.md))

---

## Instalación

```bash
npm install -g opencode-ai
```

### Verificar instalación

```bash
opencode --version
```

---

## Primera configuración

La primera vez que abras OpenCode, te pedirá configurar un proveedor de IA:

```bash
opencode
```

Verás un menú donde puedes elegir con qué modelo de IA quieres trabajar.

---

## Opciones de proveedores (modelos de IA)

| Proveedor | Costo | Cómo obtener acceso |
|---|---|---|
| **Anthropic (Claude)** | Créditos gratuitos al registrarte | [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI (ChatGPT)** | Créditos gratuitos al registrarte | [platform.openai.com](https://platform.openai.com) |
| **Google Gemini** | Tiene capa gratuita | [aistudio.google.com](https://aistudio.google.com) |

> **Recomendación:** Regístrate en [console.anthropic.com](https://console.anthropic.com) — al crear tu cuenta nueva recibes créditos gratuitos para usar Claude. Es la opción más parecida a Claude Code.

### ¿Qué es una API Key?

Una API Key es una contraseña especial que te da acceso al servicio de IA. La obtienes así:

1. Crea una cuenta en el proveedor que elijas
2. Ve a la sección de API Keys en tu cuenta
3. Crea una nueva key
4. Cópiala y pégala cuando OpenCode te la pida

---

## Cómo usar OpenCode

Funciona exactamente igual que Claude Code:

```bash
# Navega a tu carpeta de proyecto
cd mi-proyecto

# Inicia OpenCode
opencode
```

Dentro del chat puedes escribir en español:

```
> Crea un archivo index.html con una página de bienvenida
> Explícame qué hace este código
> Tengo un error, ayúdame a entenderlo
> Crea una función en JavaScript que sume dos números
```

---

## Comparativa: Claude Code vs OpenCode

| Característica | Claude Code | OpenCode |
|---|---|---|
| **Costo** | ~$20 USD/mes (Pro) | Gratuito (con límites) |
| **Modelo de IA** | Claude (Anthropic) | Configurable — Claude, ChatGPT, Gemini |
| **Calidad** | Muy alta | Alta (depende del modelo) |
| **Facilidad de uso** | Muy fácil | Fácil |
| **Para el curso** | Ideal | Excelente alternativa |

---

## Tips para usarlo bien

Los mismos tips que con Claude Code aplican aquí:

**Sé específico en lo que pides:**

```
> crea un archivo index.html con una página que tenga un título que diga "Mi primer sitio",
  un párrafo de bienvenida y un botón azul que diga "Empezar"
```

**Pide explicaciones:**
```
> explícame línea por línea qué hace el código que acabas de crear
```

**Corrige si algo no quedó bien:**
```
> el botón quedó muy pequeño, hazlo más grande y ponlo centrado en la página
```

---

## Resumen: ¿Qué herramienta usar?

```
¿Tienes cuenta Pro de Anthropic?
    ↓ Sí → Usa Claude Code (Paso 5)
    ↓ No → Usa OpenCode (este paso)

Las dos herramientas hacen lo mismo.
Para el curso, cualquiera funciona perfectamente.
```

---

[← Paso 5: Claude Code](./05-claude-code.md) | [← Volver al índice](../README.md)
