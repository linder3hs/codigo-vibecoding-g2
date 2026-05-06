Vamos a construir la aplicacion llamada Task Manager, en este caso esto sera el backend que tendra el siguiente stack

- lenguaje principal JavaScript
- nodejs
- express
- memoria local (arrays)
- cors
  y tendremos los siguientes endpoint
- task (list)
- task (crear)
- task/:id (detalle)
- task/:id (actualizar)
- task/:id (eliminar)
  Analiza y utiliza el metodo HTTP correspondiente para cada endpoint
  Para que el proyecto pueda ser escalable a futuro organiza las carpeta de forma ordenada y por dominio

1. esta bien el formato propuesto, pero agreguemos el id y la created_at
2. que sea un id automatico
3. por ahora no necesito validaciones
   extra: como es un proyecto basico podemos configurar cors dentro de app.js

veo que usaste require, esto no es acepta, migralo a usar module para poder importar usando el "import", para esto busca que libreria debes instalar para proceder de forma ordenada
