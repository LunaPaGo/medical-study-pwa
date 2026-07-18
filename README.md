# Askleion

Askleion es una biblioteca médica personal con soporte offline para organizar y estudiar temas, farmacología, procedimientos y conocimiento clínico, con autenticación, archivos e imágenes y sincronización con Supabase.

## Qué incluye actualmente

- React, TypeScript y Vite.
- Supabase preparado con URL y Anon Key desde `.env.local`.
- Autenticación con email, registro, recuperación de contraseña y GitHub si lo habilitás en Supabase.
- Rutas protegidas: la app solo se abre con sesión iniciada.
- Diseño responsive con barra lateral en computadora y navegación inferior en celular.
- PWA instalable con manifest, iconos y service worker.
- IndexedDB inicial para preparar la futura cola offline.
- SQL inicial con `profiles`, `sync_metadata`, índices, triggers y políticas RLS.
- Módulo de Temas Médicos de la Etapa 2: CRUD, duplicado, favoritos, carpetas, categorías, etiquetas, búsqueda, filtros y editor enriquecido.
- Contenido principal de TipTap guardado como JSON estructurado en `content_json`; `content_html` queda como representación derivada para lectura y búsqueda.
- Módulo genérico de archivos e imágenes de la Etapa 3 con Supabase Storage privado, adjuntos offline, galería, lista, vista previa, descarga e integración con TipTap.
- Módulo de Farmacología de la Etapa 4 con fichas de medicamentos, adjuntos, favoritos, búsqueda y comparador.
- Configuración de producción para publicar en Vercel como PWA instalable.

Las secciones de farmacología, buscador global avanzado, historial y respaldo quedan preparadas como pantallas base para las próximas etapas.

## 1. Instalar Node.js

1. Entrá a [https://nodejs.org](https://nodejs.org).
2. Descargá la versión **LTS**.
3. Instalá aceptando las opciones predeterminadas.
4. Cerrá y volvé a abrir la terminal.
5. Comprobá la instalación:

```bash
node --version
npm --version
```

## 2. Instalar dependencias

Abrí una terminal dentro de la carpeta del proyecto:

```bash
cd "C:\Users\uluna\Documents\Aplicacion desde Cero\medical-study-pwa"
npm install
```

## 3. Ejecutar la aplicación localmente

```bash
npm run dev
```

Después abrí la dirección que aparezca en la terminal, normalmente:

```text
http://localhost:5173
```

## 4. Crear el proyecto en Supabase

1. Entrá a [https://supabase.com](https://supabase.com).
2. Creá una cuenta o iniciá sesión.
3. Elegí **New project**.
4. Poné un nombre, una contraseña segura de base de datos y una región cercana.
5. Esperá a que Supabase termine de crear el proyecto.

## 5. Encontrar la Project URL

1. En Supabase, abrí tu proyecto.
2. Entrá en **Project Settings**.
3. Entrá en **API**.
4. Copiá el valor de **Project URL**.

## 6. Encontrar la Anon Key

1. En la misma pantalla **Project Settings > API**.
2. Buscá **Project API keys**.
3. Copiá la clave **anon public**.

No uses la `service_role` en esta aplicación.

## 7. Crear `.env.local`

En la carpeta del proyecto, creá un archivo llamado `.env.local` con este contenido:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_publica_o_publishable_key
```

Reemplazá los valores por los de tu proyecto. El archivo `.env.example` muestra el formato.

## 8. Ejecutar el SQL

1. En Supabase, abrí **SQL Editor**.
2. Creá una consulta nueva.
3. Pegá el contenido de `supabase/001_base.sql`.
4. Ejecutalo.
5. Creá otra consulta nueva.
6. Pegá el contenido de `supabase/002_topics.sql`.
7. Ejecutalo.
8. Si ya habías creado las tablas de temas antes de la mejora a JSON de TipTap, ejecutá también `supabase/003_tiptap_json_content.sql`.
9. Para habilitar archivos e imágenes, ejecutá `supabase/004_attachments_storage.sql`.
10. Para vincular explícitamente imágenes y archivos con temas, ejecutá `supabase/005_topic_image_links.sql`.
11. Para activar la aprobación manual de usuarios, ejecutá `supabase/006_profile_approval_status.sql`.
12. Si ya tenías usuarios creados antes de activar la aprobación manual, ejecutá `supabase/007_backfill_profiles_and_fix_signup_trigger.sql`.
13. Para habilitar Farmacología, ejecutá `supabase/008_pharmacology.sql`.

Esto crea perfiles, metadatos de sincronización, temas médicos, carpetas, categorías, etiquetas, relaciones e índices. También activa políticas para que cada usuario acceda solo a sus propios datos.

## 9. Configurar autenticación

1. En Supabase, entrá a **Authentication**.
2. Abrí **Providers**.
3. Verificá que **Email** esté habilitado.
4. En **URL Configuration**, agregá tu URL local durante pruebas:

```text
http://localhost:5173
```

Cuando publiques la app, agregá también la URL de producción.

## 10. Habilitar inicio con GitHub

1. En Supabase, entrá a **Authentication > Providers**.
2. Activá **GitHub**.
3. Supabase te mostrará una URL de callback.
4. En GitHub, creá una OAuth App y pegá esa URL como callback.
5. Copiá el Client ID y Client Secret en Supabase.

Si no configurás GitHub, la app seguirá funcionando con email y contraseña.

## 11. Configurar Supabase Storage

Ejecutá `supabase/004_attachments_storage.sql` para crear las tablas, políticas y bucket privado de archivos. La aplicación usa Supabase Storage con URLs firmadas; no necesita hacer público el bucket.

## 12. Probar la aplicación

1. Ejecutá `npm run dev`.
2. Abrí la app.
3. Creá una cuenta o iniciá sesión.
4. Confirmá que después de entrar veas el panel principal.
5. Entrá a **Temas**.
6. Tocá **Organización** y creá una carpeta, una categoría y una etiqueta.
7. Tocá **Nuevo tema**.
8. Completá título, subtítulo, carpeta, categoría, especialidad, estado y etiquetas.
9. Escribí contenido usando negrita, cursiva, listas, tabla, cita, código, separador e imagen pendiente.
10. Guardá el tema.
11. Abrilo, editalo, duplicalo, marcalo como favorito y probá eliminarlo.
12. Entrá a **Favoritos** y verificá que solo aparezcan los temas favoritos.
13. Probá buscar y filtrar desde la pantalla de **Temas**.
14. Entrá a **Archivos**.
15. Subí una imagen, un PDF o cualquier archivo de estudio.
16. Probá arrastrar y soltar desde la computadora.
17. Probá pegar una captura con `Ctrl + V`.
18. Abrí la vista previa, usá zoom, descargá, renombrá y copiá el enlace interno.
19. En un tema existente, editá el contenido y usá el botón de imagen del editor para insertar una imagen como nodo del documento TipTap.
20. En el editor de un tema, usá **Agregar imagen**, **Cámara**, **Biblioteca**, arrastrar/soltar o `Ctrl + V`.
21. Guardá el tema, salí, volvé a abrirlo y confirmá que la imagen aparece integrada en el contenido.
22. Tocá la imagen dentro del editor para cambiar tamaño, alineación, pie, ampliarla o quitarla del documento.
23. Probá eliminar definitivamente esa imagen desde **Archivos**. Si está usada en un tema, la app debe advertirlo y evitar referencias rotas.
24. Cerrá sesión y verificá que vuelve a la pantalla de acceso.
25. Probá apagar Internet: el indicador superior debe cambiar a **Offline**. Los cambios y archivos se guardan localmente y quedan pendientes para sincronizar cuando vuelva la conexión.

## 13. Instalarla en Android

1. Publicá la app o abrila desde una URL accesible por el teléfono.
2. En Chrome Android, abrí el menú.
3. Tocá **Agregar a pantalla principal** o **Instalar aplicación**.
4. Abrila desde el icono instalado.

En desarrollo local, el teléfono solo podrá verla si está en la misma red y la computadora permite el acceso al servidor local.

## 14. Publicarla en GitHub

```bash
git init
git add .
git commit -m "Crear base tecnica de Askleion"
git branch -M main
git remote add origin https://github.com/tu-usuario/tu-repositorio.git
git push -u origin main
```

No subas `.env.local`.

## 15. Desplegar en Vercel

La guía completa está en [DEPLOYMENT.md](./DEPLOYMENT.md).

Resumen:

1. Subí el proyecto a GitHub sin incluir `.env.local`.
2. Importá el repositorio en Vercel.
3. Elegí el framework **Vite**.
4. Configurá el comando de build:

```bash
pnpm run build
```

5. Configurá la carpeta de salida:

```text
dist
```

6. Agregá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como variables de entorno en Vercel.
7. Configurá la URL pública de Vercel en **Supabase > Authentication > URL Configuration**.

## 16. Comprobar sincronización entre computadora y celular

1. Iniciá sesión en la computadora desde la URL pública.
2. Creá o editá un tema.
3. Iniciá sesión con la misma cuenta en el celular.
4. Verificá que el tema aparezca.
5. Insertá una imagen dentro de un tema y confirmá que se vea en ambos dispositivos.
6. Probá apagar Internet: los cambios quedan pendientes localmente y se sincronizan cuando vuelve la conexión.

## Comandos útiles

```bash
npm run dev
npm run build
npm run preview
```
