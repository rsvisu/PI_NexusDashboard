# Nexus — Dashboard

Panel de administración en Vue 3 para gestionar conversaciones, la base de conocimiento del RAG, el feedback de los usuarios y la configuración del asistente de CPIFP Los Enlaces.

## Requisitos

- Node ^20.19.0 o >=22.12.0
- pnpm (no usar `npm install`, rompe el lockfile)
- El [backend](https://github.com/rsvisu/PI_NexusBackend) en marcha
- Un usuario creado en Supabase Auth (el login delega en Supabase, no hay registro propio)

## Instalación

```bash
pnpm install
cp .env.example .env
```

Variables de entorno (`.env`):

| Variable                 | Obligatoria | Descripción                                            |
| ------------------------ | ----------- | ------------------------------------------------------ |
| `VITE_API_URL`           | No          | URL del backend. Por defecto `http://localhost:3000`.  |
| `VITE_SUPABASE_URL`      | Sí          | URL del proyecto de Supabase.                          |
| `VITE_SUPABASE_ANON_KEY` | Sí          | Clave pública (anon) de Supabase, usada para el login. |

## Comandos

```bash
pnpm run dev      # servidor de desarrollo
pnpm run build    # build de producción
pnpm run lint     # oxlint + eslint --fix
```

## Arquitectura

### Autenticación

- El login delega en Supabase Auth (`src/services/supabaseClient.js`); el dashboard no gestiona contraseñas propias.
- `stores/auth.js` guarda la sesión; el guard de navegación en `router/index.js` redirige a `/login` si la ruta requiere autenticación (`meta.requiresAuth`) y no hay sesión, y al revés si ya está logueado y visita `/login`.
- El token de la sesión de Supabase se envía en cada petición al backend, que lo valida contra Supabase Auth (`authMiddleware`).

### Peticiones al backend

- `src/services/api.js` centraliza todas las llamadas (axios). Las vistas las invocan en `onMounted` y gestionan su propio estado de carga/error localmente; no hay un store global de datos del servidor.

## Estructura

- `config/` — configuración centralizada de la aplicación
- `services/` — cliente de Supabase y llamadas al backend
- `stores/` — estado global con Pinia (sesión de autenticación)
- `router/` — definición de rutas y guard de navegación
- `layouts/` — estructuras de página reutilizables (con/sin sidebar)
- `views/` — páginas de la aplicación
- `components/` — componentes reutilizables, agrupados por sección
- `utils/` — funciones auxiliares

## Vistas

| Ruta                  | Vista                    | Descripción                                    |
| --------------------- | ------------------------ | ---------------------------------------------- |
| `/login`              | `LoginView`              | Inicio de sesión.                              |
| `/`                   | `HomeView`               | Métricas generales y actividad reciente.       |
| `/conversaciones`     | `ConversationsView`      | Lista de conversaciones, con borrado.          |
| `/conversaciones/:id` | `ConversationDetailView` | Mensajes de una conversación.                  |
| `/conocimientos`      | `KnowledgeView`          | Gestión de carpetas y documentos del RAG.      |
| `/feedback`           | `FeedbackView`           | Feedback negativo registrado por los usuarios. |
| `/configuracion`      | `ConfigView`             | Rate limit, API key de OpenAI y demás ajustes. |
