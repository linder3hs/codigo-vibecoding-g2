# Paso 1 — La Terminal

[← Volver al índice](../README.md) | [Siguiente: Node.js →](./02-nodejs.md)

---

La terminal es una ventana donde le das órdenes a tu computadora escribiendo texto, en lugar de hacer clic. Al principio puede dar miedo, pero es una herramienta muy poderosa que usaremos todo el tiempo.

---

## ¿Cómo abrir la terminal?

| Sistema | Cómo abrirla |
|---|---|
| **Mac** | `Cmd + Espacio` → escribe `Terminal` → Enter |
| **Windows** | Tecla `Windows` → escribe `cmd` o `PowerShell` → Enter |

---

## Comandos en Mac / Linux

```bash
# Ver en qué carpeta estás
pwd

# Ver el contenido de la carpeta actual
ls

# Ver el contenido con más detalle
ls -la

# Entrar a una carpeta
cd nombre-de-la-carpeta

# Subir un nivel (ir a la carpeta anterior)
cd ..

# Ir directo a tu carpeta personal
cd ~

# Crear una carpeta nueva
mkdir nombre-de-la-carpeta

# Crear un archivo vacío
touch nombre-del-archivo.txt

# Borrar un archivo (¡cuidado, no hay papelera!)
rm nombre-del-archivo.txt

# Borrar una carpeta y todo lo que tiene dentro (¡mucho cuidado!)
rm -rf nombre-de-la-carpeta

# Limpiar la pantalla
clear
```

---

## Comandos en Windows (CMD o PowerShell)

```cmd
# Ver en qué carpeta estás
cd

# Ver el contenido de la carpeta actual
dir

# Entrar a una carpeta
cd nombre-de-la-carpeta

# Subir un nivel
cd ..

# Ir al disco C:
cd C:\

# Crear una carpeta nueva
mkdir nombre-de-la-carpeta

# Crear un archivo vacío
echo. > nombre-del-archivo.txt

# Borrar un archivo
del nombre-del-archivo.txt

# Borrar una carpeta y todo lo que tiene dentro
rmdir /s nombre-de-la-carpeta

# Limpiar la pantalla
cls
```

---

## Tabla comparativa rápida

| Acción | Mac/Linux | Windows |
|---|---|---|
| ¿Dónde estoy? | `pwd` | `cd` |
| Ver archivos | `ls` | `dir` |
| Entrar a carpeta | `cd carpeta` | `cd carpeta` |
| Subir un nivel | `cd ..` | `cd ..` |
| Crear carpeta | `mkdir nombre` | `mkdir nombre` |
| Limpiar pantalla | `clear` | `cls` |

---

## Tips

> **Tab para autocompletar:** Empieza a escribir el nombre de una carpeta y presiona `Tab` — la terminal lo completa automáticamente. Úsalo siempre para evitar errores.

> **Flecha arriba:** Presiona `↑` para repetir el último comando que escribiste.

---

## Ejercicio rápido

Practica estos comandos en orden:

```bash
# 1. Ve a tu carpeta personal
cd ~

# 2. Crea una carpeta para el curso
mkdir vibe-coding

# 3. Entra a esa carpeta
cd vibe-coding

# 4. Confirma que estás dentro
pwd

# 5. Crea una subcarpeta para la clase 01
mkdir clase-01

# 6. Mira lo que creaste
ls
```

Si ves `clase-01` en el resultado, ¡todo funciona correctamente!

---

[← Volver al índice](../README.md) | [Siguiente: Node.js →](./02-nodejs.md)
