# Gijon Throwdown

Hub digital para una competicion funcional por equipos. El proyecto combina:

- sitio publico del evento
- galeria publica de fotos con descarga y compra configurable
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
  `/`, `/cuenta`, `/registro/voluntarios`, `/registro/equipos`, `/wods`, `/wods/[slug]`, `/categorias/[slug]`, `/horarios`, `/clasificacion`, `/directo`, `/galeria`, `/galeria/[id]`, `/patrocinadores`, `/faq`, `/privacidad`, `/cookies`, `/bases-legales`, `/aviso-legal`
- Admin:
  `/admin`, `/admin/evento`, `/admin/categorias`, `/admin/equipos`, `/admin/wods`, `/admin/heats`, `/admin/puntuaciones`, `/admin/validacion`, `/admin/validacion/[heatId]`, `/admin/usuarios`, `/admin/personas`, `/admin/patrocinadores`, `/admin/voluntarios`, `/admin/streaming`, `/admin/media`
- Voluntario:
  `/voluntario`, `/voluntario/heat/[heatId]`
- Live:
  `/live/[heatId]`, `/overlay/[heatId]`
- Auth:
  `/auth/login`, `/auth/callback`, `/auth/setup`

## Arquitectura

- Las `page.tsx` y `layout.tsx` son Server Components por defecto.
- La interactividad vive en Client Components dentro de `src/app/**` y `src/components/**`.
- Las mutaciones viven en `src/lib/actions/*.ts` y usan `revalidatePath`.
- La autenticacion y el refresco de sesion pasan por Supabase SSR.
- La proteccion de rutas esta en `src/proxy.ts`.
- El dashboard admin ya funciona como centro de mando:
  resume estado del evento, operativa live, colas pendientes y accesos rapidos
  a heats, validacion, equipos, voluntarios, streaming y media.
- Las superficies protegidas ya tienen navegacion movil propia:
  `admin` y `voluntario` muestran cabecera con menu overlay en movil para no
  dejar al usuario atrapado dentro de la operativa.
- El shell publico ya es auth-aware:
  carga sesion/perfil en servidor y adapta navbar y overlay movil al rol activo.
  En desktop, la barra mantiene la navegacion publica visible y agrupa los
  accesos internos del usuario en un menu de cuenta desplegable para evitar
  saturacion visual.
- El footer desktop ya no duplica la navegacion principal:
  ahora prioriza enlaces legales internos del evento y accesos a comunidad/redes.
- La capa de personas ya existe:
  `people` actua como registro canonico y se enlaza con `profiles` y `athletes`
  mediante `person_id`.
- La continuidad entre ediciones ya tiene base real:
  `event_editions`, `event_config.active_edition_id`,
  `teams.edition_id`, `athletes.edition_id` y `edition_participations`.
- Streaming y media ya tienen superficie de producto:
  `stream_sessions` alimenta el directo publico y `media` ya vive en una
  galeria publica con bucket privado + URLs firmadas para preview/descarga.
- La capa fotografica editorial ya no vive solo en los heroes:
  la home reparte imagen y narrativa en bloques clave para reforzar inspiracion,
  esfuerzo y ambiente de arena sin convertir toda la web en una galeria.

## Modelo de acceso

Estado actual del codigo:

- `profiles.role` soporta `superadmin`, `admin`, `volunteer` y `athlete`
- `profiles.can_validate_scores` modela la capacidad de head judge / admin validador
- `profiles.is_judge` identifica perfiles de juez dentro del flujo de voluntariado sin crear un rol global nuevo
- `/admin` exige perfil activo de tipo admin o superadmin
- `/admin/usuarios` es solo para superadmin
- `/admin/validacion` es solo para superadmin o admin con capacidad de validacion
- `/voluntario` exige perfil activo y acceso operativo; voluntarios y jueces comparten superficie y los invitados internos deben pasar antes por `/auth/setup`

Modelo objetivo acordado para el producto:

- `superadmin`: control total de plataforma, usuarios, roles, configuracion global y correccion completa de datos
- `admin`: operativa del evento, edicion de equipos/atletas/resultados, gestion de WODs/heats/categorias y configuracion de scoring, sin cambiar roles
- `volunteer`: captura de live data desde movil
- `athlete`: acceso de consumo, perfil y seguimiento del evento sin permisos operativos
- `head_judge`: capacidad funcional para validar resultados oficiales; se recomienda modelarlo como permiso/capability sobre usuarios administrativos, no como rol global obligatorio

Direccion tecnica ya aplicada en esta fase:

- `profiles.role` como fuente de verdad
- helpers centralizados en `src/lib/auth/permissions.ts` y `src/lib/auth/session.ts`
- RLS y proteccion de rutas alineadas con esos helpers
- separacion clara entre live provisional y resultado oficial validado
- rutas publicas visibles para cuenta y registros:
  `/cuenta`, `/registro/voluntarios`, `/registro/equipos`

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

Decision de arquitectura ya aplicada en esta fase:

- mantener una sola edicion activa en la UI publica
- pero separar tecnicamente:
  - personas persistentes
  - cuentas de acceso
  - participaciones deportivas actuales
- y evitar meter toda la identidad futura solo dentro de `profiles`

Lo que ya existe hoy:

- `people` como ficha persistente de persona
- `profiles.person_id` para enlazar cuentas auth con personas
- `athletes.person_id` para enlazar identidad deportiva con personas
- `event_editions` como metadata reutilizable por ano
- `edition_participations` como primera capa de historial por edicion
- conversion admin de:
  - `volunteer_applications -> people + profile`
  - `team_registrations -> teams + people + athletes`
- `/admin/personas` como vista de control para revisar, editar e invitar
- `/cuenta` con resumen real de equipo/ranking y primer historial cuando el atleta ya esta enlazado

Bloques funcionales objetivo:

- registro de voluntarios con:
  nombre, apellidos, email, talla de camiseta, restricciones alimentarias,
  opcion de indicar si quiere colaborar como juez y consentimiento
- registro de atletas por equipo con:
  nombre de equipo, 4 atletas, composicion 3 chicos + 1 chica,
  nombre, email, talla y genero por atleta,
  quedando la atleta/persona 1 como responsable de contacto
- invitaciones por correo para que cada atleta pueda acceder a su cuenta despues
- perfil persistente de atleta con equipo actual, resultados, ranking y futuro historico
- base reutilizable de personas para organizacion, jueces, voluntarios y participantes

Modelo de datos actual a alto nivel:

- `people`: ficha persistente de persona
- `profiles` o cuenta auth: acceso y rol del sistema, enlazable a `people`
- `athletes`: entidad deportiva de la edicion activa, enlazable a `people`
- `team_registrations` y `team_registration_members`: captacion publica previa a conversion
- `volunteer_applications`: formulario, preferencia de juez y estado logistica/operativa de voluntarios
- `consents` y metadatos de retencion: siguen pendientes para la capa legal futura

## Legal y privacidad

Esta nueva capa implica tratamiento real de datos personales, por lo que debe incluir:

- politica de privacidad actualizada
- informacion clara sobre tratamiento y base legal
- consentimiento registrable cuando corresponda
- politica de retencion/caducidad o anonimizado de datos
- criterio claro sobre que datos se conservan para futuras ediciones y cuales deben expirar

Estado actual:

- ya existen superficies publicas internas para `/privacidad`, `/cookies`,
  `/bases-legales` y `/aviso-legal`
- aun falta cerrar la parte realmente sensible:
  consentimiento registrable, retencion efectiva y decisiones finales de copy legal

## Integracion con WodBuster

Mientras WodBuster siga siendo parte del flujo real:

- la plataforma debe mostrar accesos directos claros a WodBuster
- al menos deberian existir enlaces a:
  - ficha externa de competicion
  - leaderboard externo
  - otros modulos relevantes si siguen viviendo alli
- esta integracion puede empezar como capa visual simple con enlaces configurables

## Nota importante sobre Next 16

La migracion a `proxy.ts` ya esta hecha. Aun asi, antes de tocar convenciones de Next, consulta `node_modules/next/dist/docs/`.

## Datos y Supabase

El dominio principal esta definido en `supabase/migrations/`:

- `001_initial_schema.sql`: tablas, enums y realtime base
- `002_rls_policies.sql`: RLS y permisos
- `003_functions.sql`: funciones SQL y vista `leaderboard`
- `004_seed.sql`: seed demo del evento
- `005_phase2_auth_and_validation.sql`: roles ampliados, validacion oficial y endurecimiento del live
- `006_public_registrations.sql`: solicitudes publicas de voluntarios y preinscripciones de equipos
- `007_people_registry_and_conversions.sql`: people registry, enlaces `person_id` y conversion operativa
- `008_event_editions_and_participations.sql`: edicion activa, historial base y continuidad atleta
- `009_streaming_and_media_experience.sql`: sesiones publicas de stream, bucket privado `event-media`, galeria y metadatos de descarga/compra
- `010_judge_profiles.sql`: preferencia de juez en voluntariado y flag persistente `profiles.is_judge`

Tablas principales:

- `event_config`
- `event_editions`
- `categories`
- `teams`
- `people`
- `edition_participations`
- `athletes`
- `volunteer_applications`
- `team_registrations`
- `team_registration_members`
- `workouts`
- `workout_stages`
- `heats`
- `lanes`
- `live_updates`
- `scores`
- `sponsors`
- `sponsor_slots`
- `volunteer_assignments`
- `stream_sessions`
- `media`

## Variables de entorno

Se esperan al menos estas variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Se usan desde:

- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/supabase/admin.ts`
- `src/proxy.ts`

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
- `npm run typecheck`

## Estado verificado el 2026-03-29

- `npm run build`: OK
- `npm run typecheck`: OK
- `npm run lint:src`: OK
- shell publico con sesion visible, logout y accesos contextuales por rol: OK
- `/cuenta`, `/registro/voluntarios` y `/registro/equipos`: OK
- revision admin de solicitudes y preinscripciones: OK
- people registry y conversion admin a entidades reales: OK
- `/admin/personas` y cuenta atleta enlazada: OK
- CRUD admin para `athletes`: OK
- CRUD admin para `workout_stages`: OK
- UI admin para `volunteer_assignments`: OK
- invitacion explicita de atletas tras convertir equipo: OK
- dashboard de voluntario con filtros por categoria, heat, WOD y equipo: OK
- capa fotografica editorial en `/`, `/directo` y `/wods`: OK
- `/admin/streaming` con sesiones publicas y embed principal: OK
- `/admin/media` con subida de imagenes, visibilidad, descarga y compra configurable: OK
- `/galeria` y `/galeria/[id]` con preview, descarga firmada y CTA de compra: OK
- continuidad entre ediciones con `event_editions` y `edition_participations`: OK
- `/cuenta` ya muestra historial base de participacion para atletas enlazados: OK

## Documentacion humana

Si quieres entender la app como propietario y no como arqueologo de commits:

- `docs/guia_personal_gijon_throwdown.md`
- `docs/chuleta_personal_gijon_throwdown.md`
- `docs/photo-sources.md`

## Huecos actuales

- `sponsor_slots` existe en datos, pero el uso visual es minimo
- El seed demo y las categorias base de `004_seed.sql` siguen modelando equipos de 2, mientras la experiencia publica y el registro ya se comunican como formato de 4 personas (1 chica + 3 chicos)
- El registro publico de equipos fuerza siempre 4 atletas y composicion 3:1, pero hoy carga cualquier categoria de equipo; si alguien deja categorias con otro `team_size`, la UI y los datos se desalinean
- Falta el bootstrap manual del primer `superadmin` en produccion
- El dashboard de voluntario ya cubre una primera capa de filtro libre por categoria, heat, equipo y WOD, pero todavia se puede refinar para operativas grandes con mas densidad
- La gestion admin de `event_config` sigue siendo parcial: faltan FAQ, branding/media, enlaces como `maps_url`, y control visible de la edicion activa
- La compra de fotos ya tiene CTA configurable por imagen, pero el checkout real sigue dependiendo de la URL/provider que defina la organizacion
- No hay configuracion administrable de reglas de scoring, puntos por posicion ni desempates
- La UI sigue pensada alrededor de una sola edicion activa; la continuidad ya existe en datos, pero falta producto mas rico de gestion multi-edicion
- Ya existe invitacion explicita de atletas y un onboarding mas coherente, pero todavia puede pulirse mas la experiencia de activacion atleta
- `athletes` sigue siendo una entidad deportiva minima; la informacion personal/logistica vive en `people`
- No hay aun flujo completo de deduplicacion avanzada, conciliacion manual o fusion de personas mas alla del match principal por email
- Ya existen paginas legales publicas internas, pero la capa completa de
  consentimiento, retencion y cumplimiento operativo sigue pendiente
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
- `docs/photo-sources.md`
