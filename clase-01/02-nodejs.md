# Paso 2 — Node.js

[← Paso 1: Terminal](./01-terminal.md) | [← Volver al índice](../README.md) | [Siguiente: Cursor →](./03-cursor.md)

---

Node.js permite ejecutar JavaScript fuera del navegador. Es la base de muchísimas herramientas modernas y es **requisito obligatorio** para instalar Claude Code y OpenCode.

---

## Instalación

1. Ve a [https://nodejs.org](https://nodejs.org)
2. Descarga la versión **LTS** — es la recomendada, más estable
3. Instala como cualquier programa (siguiente, siguiente, instalar)
4. Cierra y vuelve a abrir tu terminal

---

## Verificar que quedó bien instalado

Abre tu terminal y ejecuta:

```bash
node --version
```

```bash
npm --version
```

Deberías ver algo como:

```
v20.11.0
10.2.4
```

Los números exactos no importan, lo que importa es que aparezcan. Si ves un número, la instalación fue exitosa.

---

## ¿Qué es npm?

npm viene incluido con Node.js y es el gestor de paquetes. Sirve para instalar herramientas y librerías con un solo comando. Por ejemplo:

```bash
npm install -g nombre-de-la-herramienta
```

El `-g` significa que la instalas de forma global en tu computadora (disponible desde cualquier carpeta).

---

## Posibles errores

**"node no se reconoce como comando"** o **"command not found: node"**
- Cierra la terminal completamente y ábrela de nuevo
- Si persiste, desinstala Node.js y vuelve a instalarlo
- Asegúrate de haber descargado la versión LTS, no la "Current"

---

[← Paso 1: Terminal](./01-terminal.md) | [← Volver al índice](../README.md) | [Siguiente: Cursor →](./03-cursor.md)
