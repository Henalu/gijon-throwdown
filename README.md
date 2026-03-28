# Gijon Throwdown

Hub digital para una competicion funcional por equipos. El proyecto combina:

- sitio publico del evento
- panel admin para operativa
- interfaz de voluntarios para scoring
- vistas live para publico
- overlay para streaming/OBS

## Stack

- Next.js 16.2.1 con App Router en `src/app`
- React 19.2.4
- Tailwind CSS 4
- Supabase SSR/Auth/Postgres/Realtime
- Base UI, Lucide, Sonner

## Zonas de la app

- Publico:
  `/`, `/wods`, `/wods/[slug]`, `/categorias/[slug]`, `/horarios`, `/clasificacion`, `/directo`, `/patrocinadores`, `/faq`
- Admin:
  `/admin`, `/admin/evento`, `/admin/categorias`, `/admin/equipos`, `/admin/wods`, `/admin/heats`, `/admin/puntuaciones`, `/admin/patrocinadores`, `/admin/voluntarios`, `/admin/streaming`
- Voluntario:
  `/voluntario`, `/voluntario/heat/[heatId]`
- Live:
  `/live/[heatId]`, `/overlay/[heatId]`
- Auth:
  `/auth/login`, `/auth/callback`

## Arquitectura

- Las `page.tsx` y `layout.tsx` son Server Components por defecto.
- La interactividad vive en Client Components dentro de `src/app/**` y `src/components/**`.
- Las mutaciones viven en `src/lib/actions/*.ts` y usan `revalidatePath`.
- La autenticacion y el refresco de sesion pasan por Supabase SSR.
- La proteccion de rutas esta en `src/middleware.ts`.

## Modelo de acceso

Estado actual del codigo:

- `profiles.role` solo soporta `admin` y `volunteer`
- `/admin` exige `role = admin`
- `/voluntario` exige sesion, pero no un permiso mas fino

Modelo objetivo acordado para el producto:

- `superadmin`: control total de plataforma, usuarios, roles, configuracion global y correccion completa de datos
- `admin`: operativa del evento, edicion de equipos/atletas/resultados, gestion de WODs/heats/categorias y configuracion de scoring, sin cambiar roles
- `volunteer`: captura de live data desde movil
- `athlete`: acceso de consumo, perfil y seguimiento del evento sin permisos operativos
- `head_judge`: capacidad funcional para validar resultados oficiales; se recomienda modelarlo como permiso/capability sobre usuarios administrativos, no como rol global obligatorio

Direccion tecnica recomendada:

- mantener `profiles.role` como fuente de verdad
- centralizar helpers de permisos en codigo, estilo `user-roles.ts`
- ampliar RLS y proteccion de rutas a partir de esos helpers
- separar claramente live provisional de resultado oficial validado

## Flujo operativo objetivo

- Admin activa WODs, heats y contexto operativo disponible para el live
- Voluntarios introducen datos provisionales en tiempo real desde un dashboard mobile first
- Head judge o admin validador revisa la hoja oficial, corrige si hace falta y valida el resultado final
- El leaderboard oficial solo consolida scores validados/publicados, no cualquier cambio live
- Las reglas de puntuacion, desempates y criterios por WOD deben ser configurables desde la plataforma

## Capa de personas y registro

Direccion de producto acordada:

- la plataforma no debe quedarse solo en sitio del evento + live ops
- debe convertirse tambien en registro centralizado de personas vinculadas a la competicion
- esa base debe poder reutilizarse entre ediciones del mismo evento

Decision de arquitectura recomendada:

- mantener una sola edicion activa en la UI publica
- pero separar conceptualmente:
  - personas persistentes
  - cuentas de acceso
  - participaciones por edicion
  - roles por edicion o por operativa
- evitar meter toda la logica futura solo dentro de `profiles`, porque ahi hoy se mezcla auth con rol basico

Bloques funcionales objetivo:

- registro de voluntarios con:
  nombre, apellidos, email, talla de camiseta, restricciones alimentarias y consentimiento
- registro de atletas por equipo con:
  nombre de equipo, lider/responsable, 4 atletas, composicion 3 chicos + 1 chica,
  nombre, email, talla y genero por atleta
- invitaciones por correo para que cada atleta pueda acceder a su cuenta despues
- perfil persistente de atleta con equipo actual, resultados, ranking y futuro historico
- base reutilizable de personas para organizacion, jueces, voluntarios y participantes

Modelo de datos recomendado a alto nivel:

- `people`: ficha persistente de persona
- `profiles` o cuenta auth: acceso y rol del sistema, opcionalmente enlazado a `people`
- `event_editions`: cada edicion anual o instancia competitiva
- `edition_participants` / `edition_roles`: relacion de una persona con una edicion concreta
- `team_registrations` y `team_memberships`: alta de equipos y miembros
- `volunteer_applications`: formulario y estado logistica/operativa de voluntarios
- `consents` y metadatos de retencion: trazabilidad legal del tratamiento de datos

## Legal y privacidad

Esta nueva capa implica tratamiento real de datos personales, por lo que debe incluir:

- politica de privacidad actualizada
- informacion clara sobre tratamiento y base legal
- consentimiento registrable cuando corresponda
- politica de retencion/caducidad o anonimizado de datos
- criterio claro sobre que datos se conservan para futuras ediciones y cuales deben expirar

## Integracion con WodBuster

Mientras WodBuster siga siendo parte del flujo real:

- la plataforma debe mostrar accesos directos claros a WodBuster
- al menos deberian existir enlaces a:
  - ficha externa de competicion
  - leaderboard externo
  - otros modulos relevantes si siguen viviendo alli
- esta integracion puede empezar como capa visual simple con enlaces configurables

## Nota importante sobre Next 16

El proyecto funciona en Next.js 16.2.1 y el build pasa, pero deja este aviso:

- `middleware` esta deprecado y debe migrarse a `proxy.ts`

Antes de tocar convenciones de Next, consulta `node_modules/next/dist/docs/`.

## Datos y Supabase

El dominio principal esta definido en `supabase/migrations/`:

- `001_initial_schema.sql`: tablas, enums y realtime base
- `002_rls_policies.sql`: RLS y permisos
- `003_functions.sql`: funciones SQL y vista `leaderboard`
- `004_seed.sql`: seed demo del evento

Tablas principales:

- `event_config`
- `categories`
- `teams`
- `athletes`
- `workouts`
- `workout_stages`
- `heats`
- `lanes`
- `live_updates`
- `scores`
- `sponsors`
- `sponsor_slots`
- `volunteer_assignments`

## Variables de entorno

Se esperan al menos estas variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Se usan desde:

- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/supabase/admin.ts`

## Desarrollo local

1. Instala dependencias con `npm install`
2. Configura `.env.local`
3. Prepara la base de datos de Supabase con las migraciones del repo
4. Lanza `npm run dev`

Comandos utiles:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npx eslint src`
- `npx tsc --noEmit`

## Estado verificado el 2026-03-28

- `npm run build`: OK
- `npx tsc --noEmit`: OK
- `npx eslint src`: OK
- `npm run lint`: ya no deberia contaminarse con `.claude/worktrees/**`

## Documentacion humana

Si quieres entender la app como propietario y no como arqueologo de commits:

- `docs/guia_personal_gijon_throwdown.md`
- `docs/chuleta_personal_gijon_throwdown.md`

## Huecos actuales

- No hay CRUD admin para `athletes`
- No hay CRUD admin para `workout_stages`
- No hay UI admin para asignaciones de `volunteer_assignments`
- `stream_sessions` y `media` existen en esquema, pero no se usan en la app
- `sponsor_slots` existe en datos, pero el uso visual es minimo
- `public/` todavia contiene solo assets por defecto de Next
- El modelo de acceso solo contempla `admin` y `volunteer`; no existe `superadmin`, `athlete` ni capacidad formal de `head_judge`
- No hay gestion interna de usuarios/roles; hoy crear voluntarios implica usar Supabase Auth manualmente
- No existe dashboard de validacion oficial separado del live provisional
- `scores` soporta `verified_by` e `is_published`, pero no hay una capa funcional bien definida de `live -> revision oficial -> consolidacion`
- No hay configuracion administrable de reglas de scoring, puntos por posicion ni desempates
- El dashboard de voluntario actual parte sobre todo de heats asignados/activos; todavia no cubre del todo el flujo de filtro por categoria, heat, equipo y WOD activo descrito para operaciones reales
- No existe todavia una entidad de persona persistente separada de `profiles`
- El sistema no soporta historial entre ediciones; hoy el esquema esta pensado como evento unico
- No hay formularios de registro para voluntarios ni atletas
- No hay alta de equipos liderada por un responsable con invitaciones al resto de atletas
- `athletes` no guarda hoy email, talla, genero ni datos de continuidad
- No existen emails de invitacion/confirmacion
- No hay politica de privacidad, consentimiento ni retencion implementados en la plataforma
- No hay integracion visible con WodBuster ni enlaces externos configurables

## Ficheros de contexto

Mantener sincronizados cuando cambie el proyecto:

- `AGENTS.md`
- `CLAUDE.md`
- `MEMORY.md`
- `ROADMAP.md`
- `README.md`
- `docs/guia_personal_gijon_throwdown.md`
- `docs/chuleta_personal_gijon_throwdown.md`
