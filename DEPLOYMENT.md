# Despliegue en producción con Vercel

Esta guía sirve para publicar la aplicación en una URL pública. Después de esto no necesitás tener tu computadora encendida ni ejecutar `pnpm dev` para usarla.

## 1. Qué queda en la nube

- La aplicación React se publica en Vercel.
- La base de datos, autenticación y archivos quedan en Supabase.
- El modo offline sigue usando el almacenamiento local del navegador.
- La sincronización vuelve a usar Supabase cuando regresa Internet.

## 2. Verificar archivos sensibles

No subas `.env.local` a GitHub. Ese archivo ya está incluido en `.gitignore`.

Solo se usan estas variables públicas del frontend:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_publica_o_publishable_key
```

No uses ni pegues la clave `service_role` en Vercel ni en el frontend.

## 3. Subir el proyecto a GitHub

1. Entrá a [https://github.com](https://github.com).
2. Creá un repositorio nuevo, por ejemplo `askleion`.
3. Abrí una terminal en la carpeta:

```bash
cd "C:\Users\uluna\Documents\Aplicacion desde Cero\medical-study-pwa"
```

4. Ejecutá estos comandos si todavía no inicializaste Git:

```bash
git init
git add .
git commit -m "Preparar aplicacion medica para produccion"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/askleion.git
git push -u origin main
```

5. Si el repositorio ya existía, usá:

```bash
git add .
git commit -m "Preparar despliegue en Vercel"
git push
```

## 4. Crear cuenta y proyecto en Vercel

1. Entrá a [https://vercel.com](https://vercel.com).
2. Iniciá sesión con GitHub.
3. Tocá **Add New... > Project**.
4. Elegí el repositorio de la aplicación.
5. Vercel debería detectar **Vite** automáticamente.

Usá esta configuración:

```text
Framework Preset: Vite
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install
```

El archivo `vercel.json` ya deja preparadas las rutas internas para que `/temas`, `/favoritos` u otras pantallas funcionen aunque recargues la página.

## 5. Configurar variables de entorno en Vercel

Antes de desplegar, abrí **Environment Variables** y cargá:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_publica_o_publishable_key
```

Marcá al menos **Production**. Si querés probar despliegues previos, marcá también **Preview**.

Después tocá **Deploy**.

## 6. Obtener la URL pública

Cuando Vercel termine, mostrará una URL parecida a:

```text
https://askleion.vercel.app
```

Esa es la URL pública de la aplicación.

## 7. Configurar Supabase Authentication

1. Entrá a Supabase.
2. Abrí tu proyecto.
3. Andá a **Authentication > URL Configuration**.
4. En **Site URL**, pegá la URL de Vercel:

```text
https://askleion.vercel.app
```

5. En **Redirect URLs**, agregá:

```text
https://askleion.vercel.app
https://askleion.vercel.app/auth
http://localhost:5173
http://localhost:5173/auth
```

Las URLs de `localhost` sirven solo para seguir probando en tu computadora.

## 8. Configurar GitHub como login opcional

Si usás inicio de sesión con GitHub:

1. En Supabase, abrí **Authentication > Providers > GitHub**.
2. Copiá la callback URL que muestra Supabase.
3. En GitHub, abrí tu OAuth App.
4. Pegá esa callback URL en **Authorization callback URL**.
5. Guardá los cambios.

El dominio público de Vercel debe estar permitido en Supabase para que el regreso a la app funcione correctamente.

## 9. Base de datos y Storage

En Supabase, verificá que ya ejecutaste estos archivos SQL en orden:

```text
supabase/001_base.sql
supabase/002_topics.sql
supabase/003_tiptap_json_content.sql
supabase/004_attachments_storage.sql
supabase/005_topic_image_links.sql
supabase/006_profile_approval_status.sql
supabase/007_backfill_profiles_and_fix_signup_trigger.sql
supabase/008_pharmacology.sql
```

El bucket de archivos debe ser privado. La aplicación usa URLs firmadas cuando necesita mostrar o descargar archivos.

## 10. Probar inicio de sesión

1. Abrí la URL pública de Vercel.
2. Registrate o iniciá sesión.
3. Cerrá la pestaña y abrila de nuevo.
4. Confirmá que la sesión sigue iniciada.

## 11. Probar temas y sincronización

1. En la computadora, creá un tema nuevo.
2. Agregá contenido, carpeta, categoría, etiquetas y favorito.
3. Guardalo.
4. En el celular, abrí la misma URL pública.
5. Iniciá sesión con la misma cuenta.
6. Confirmá que aparece el tema.
7. Editalo desde el celular.
8. Volvé a la computadora y confirmá que el cambio aparece al sincronizar.

## 12. Probar imágenes

1. Abrí o editá un tema.
2. Usá **Agregar imagen** dentro del editor.
3. Subí una imagen desde archivo, galería, cámara, arrastrar/soltar o portapapeles.
4. Guardá el tema.
5. Cerrá y volvé a abrir el tema.
6. Confirmá que la imagen aparece integrada en el contenido.
7. Probá abrirla ampliada.

## 13. Instalar la PWA en Android

1. En Android, abrí Chrome.
2. Entrá a la URL pública de Vercel.
3. Abrí el menú de Chrome.
4. Tocá **Instalar aplicación** o **Agregar a pantalla principal**.
5. Abrila desde el icono instalado.

La primera carga debe hacerse con Internet. Después, la app podrá abrir contenidos ya sincronizados sin conexión.

## 14. Probar con la computadora apagada

1. Cerrá el servidor local si estaba abierto.
2. Apagá la computadora.
3. Desde el celular usando datos móviles, abrí la URL pública.
4. Iniciá sesión y revisá temas e imágenes.

Si funciona desde datos móviles con la computadora apagada, la app ya no depende de tu PC.

## 15. Publicar cambios futuros

Cada vez que haga nuevas mejoras:

```bash
git add .
git commit -m "Descripcion del cambio"
git push
```

Vercel detectará el cambio y desplegará automáticamente una nueva versión.
