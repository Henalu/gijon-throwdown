# Guia personal de Gijon Throwdown

Una explicacion clara, cercana y sin ponerte a estudiar una oposicion de Next.js de como esta montada esta app, por que esta hecha asi y que partes conviene entender primero para no entrar al repo como si fuera una cueva con niebla.

Si alguna vez has pensado:

- "vale, esta web hace muchas cosas, pero quien demonios lleva el volante"
- "quiero contexto real, no marketing con olor a README"
- "me gustaria entender el proyecto sin sentir que he abierto un grimorio"

esta guia es para ti.

## La version corta

Si tuviera que resumirtelo en una frase:

Gijon Throwdown es una plataforma de evento que junta web publica, operativa interna, scoring live, validacion oficial y capa de personas dentro de una sola casa.

O dicho de forma menos ceremonial:

1. La gente entra para mirar el evento.
2. Los voluntarios meten datos en directo.
3. Admin ordena el tinglado.
4. El validador decide que resultado pasa de provisional a oficial.
5. La clasificacion publica solo deberia mostrar lo que ya ha pasado por caja y sello.

No es solo una web del evento.
No es solo un panel interno.
Es la web publica, la trastienda y el marcador, todo junto y procurando que no acaben peleandose en el mismo metro cuadrado.

## Que problema intenta resolver

La mayoria de eventos pequenos y medianos acaban asi:

- una web por un lado
- un Excel con trauma por otro
- un sistema externo para resultados
- alguien mandando cosas por WhatsApp
- y una persona con cara de "esto no puede seguir asi"

Gijon Throwdown intenta evitar ese festival.

La idea del producto es:

- ofrecer una capa publica buena en movil
- dar a organizacion una operativa real
- separar live provisional de resultado oficial
- dejar preparada una base de personas y continuidad entre ediciones

Es decir:

menos remiendos heroicos durante el evento y mas sistema que aguante la jornada sin pedir terapia despues.

## Que tecnologias usa realmente

No hay hechiceria rara, pero si hay decisiones muy concretas.

### 1. Next.js 16

La app usa `Next.js 16.2.1` con App Router.

Se usa porque el proyecto necesita mezclar:

- paginas publicas con SEO
- paneles protegidos
- layouts por superficie
- datos en servidor
- interactividad puntual en cliente

O sea:

Next aqui no esta para quedar moderno. Esta porque hace bastante bien de recepcionista, jefe de planta y coordinador de trafico a la vez.

Nota importante:

este repo ya va con `proxy.ts` en vez de `middleware.ts`, porque Next 16 ha decidido que las viejas costumbres habia que jubilarlas con cierta energia.

### 2. React 19

React lleva la parte de componentes e interaccion.

Sirve para construir piezas reutilizables como:

- navbar publica
- menu movil
- cards de equipos y WODs
- dashboards admin
- interfaz live de voluntario

La ventaja es obvia:

si una pieza mejora, no tienes que rehacer medio castillo a mano.

### 3. Tailwind CSS 4

Se usa `Tailwind 4` para la UI.

Aqui viene bien porque el producto esta afinando mucho:

- densidad de informacion
- responsive real
- jerarquia visual
- superficies distintas segun rol

En un proyecto asi, tocar clases rapido y ver el cambio enseguida vale oro.

### 4. Supabase

Supabase hace de varias cosas a la vez:

- Postgres
- auth
- helpers SSR
- realtime

Eso encaja muy bien porque esta app vive de:

- permisos
- datos operativos
- estado de evento
- cambios live

Supabase aqui no esta de invitado.
Es media cocina.

### 5. Base UI, Lucide y Sonner

La UI base usa:

- `@base-ui/react`
- `lucide-react`
- `sonner`

Traduccion rapida:

- Base UI pone primitives bastante limpias
- Lucide da iconos consistentes
- Sonner ensena toasts sin montar un circo para cada feedback

## El mapa mental mas util: 5 capas

La app se entiende mucho mejor si la divides asi:

1. capa publica
2. capa admin
3. capa voluntario y juez
4. capa live y overlay
5. capa de personas, cuentas y registros

Vamos una por una.

## 1. Capa publica

Rutas importantes:

- `/`
- `/cuenta`
- `/registro/voluntarios`
- `/registro/equipos`
- `/directo`
- `/horarios`
- `/clasificacion`
- `/wods`
- `/galeria`
- `/faq`
- `/patrocinadores`
- `/privacidad`
- `/cookies`
- `/bases-legales`
- `/aviso-legal`

Su trabajo no es solo quedar bonita.
Su trabajo es contestar rapido a preguntas reales:

- que esta pasando ahora
- como va la categoria
- donde veo el stream
- donde estan los WODs
- como me registro

Si una pagina es preciosa en desktop pero en movil obliga a hacer scroll como quien baja una ladera con piedras, esa pagina no esta bien resuelta. Fin de la poesia.

## 2. Capa admin

Rutas importantes:

- `/admin`
- `/admin/evento`
- `/admin/categorias`
- `/admin/equipos`
- `/admin/personas`
- `/admin/wods`
- `/admin/heats`
- `/admin/puntuaciones`
- `/admin/validacion`
- `/admin/usuarios`
- `/admin/patrocinadores`
- `/admin/voluntarios`
- `/admin/streaming`
- `/admin/media`

Admin es la cabina de mando.

Aqui se gestiona:

- configuracion del evento
- categorias
- equipos y atletas
- WODs y stages
- heats
- borradores de puntuacion
- validacion oficial
- voluntariado
- streaming
- galeria
- usuarios internos

Admin no existe para decorar el sidebar.
Existe para que la organizacion no dependa de "abre Supabase y reza un poco".

## 3. Capa voluntario y juez

Rutas importantes:

- `/voluntario`
- `/voluntario/heat/[heatId]`

Esta superficie esta pensada para velocidad de dedo, no para contemplar la vida.

La idea es:

- ver lo necesario rapido
- filtrar bien
- entrar al heat correcto
- meter datos sin pelearte con la interfaz

Y aqui entra una matizacion importante:

- `volunteer` sigue siendo el rol base
- `is_judge` marca perfiles de juez dentro de ese flujo
- `can_validate_scores` sigue siendo la capability seria de validacion oficial

O sea:

ser juez visible no equivale automaticamente a tener las llaves del marcador oficial.
Y eso, sinceramente, es una decision muy sensata.

## 4. Capa live y overlay

Rutas:

- `/live/[heatId]`
- `/overlay/[heatId]`

Estas dos superficies parecen primas, pero no hacen exactamente lo mismo.

- `live` sirve para seguir el heat
- `overlay` sirve para stream y realizacion

Es la diferencia entre:

- "quiero verlo"
- "quiero sacarlo en emision sin que arda nada"

## 5. Capa de personas, cuentas y registros

Esta es probablemente la capa que da mas futuro al proyecto.

La app ya no piensa solo en "usuario autenticado" o "atleta de este ano".
Ya separa:

- `people`: persona persistente
- `profiles`: cuenta auth y rol
- `athletes`: identidad deportiva actual
- `edition_participations`: memoria de participacion entre ediciones

Y ademas el alta auth ya esta mas blindada:

- un nuevo `auth.users` intenta crear o reutilizar su `people`
- las invitaciones del producto detectan antes si esa persona ya tenia cuenta
- `/auth/setup` puede reparar perfiles invitados antiguos si aun no traian `person_id`
- `/auth/callback` ya acepta tanto invitaciones como recuperaciones de contrasena
- `/auth/reset-password` permite pedir enlace nuevo o fijar una nueva contrasena

Esto importa mucho porque evita el clasico pecado de meter toda la identidad de una persona en un solo cajon y luego descubrir que no cabia.

## Como fluye la informacion competitiva

Este es el esquema mas importante del repo:

```text
Admin configura evento, heats y contexto
        ->
Voluntario mete live_updates provisionales
        ->
Realtime alimenta la capa live
        ->
Admin validador revisa y corrige
        ->
Scores validados/publicados
        ->
Leaderboard oficial
```

Hay dos verdades diferentes:

- la verdad provisional del live
- la verdad oficial del leaderboard

Si mezclas ambas sin cuidado, empiezan los dramas deportivos y la frase legendaria de:

"pero antes salia otra cosa"

## Como esta organizado el repo

## `src/app`

Aqui viven las rutas y layouts.

Grupos clave:

- `(public)`
- `(admin)`
- `(volunteer)`
- `(live)`

Si te pierdes, mirar el grupo de ruta ya te dice mucho sobre la intencion de esa pantalla.

Si lo que quieres no es entender la arquitectura sino saber que hace cada perfil humano dentro del sistema, mira tambien:

- `docs/guia_perfiles_gijon_throwdown.md`
- `docs/guias_operativas/README.md`

## `src/components`

Aqui vive la UI reutilizable.

Si quieres entender shell y navegacion:

- `src/components/layout`

Si quieres entender producto publico:

- `src/app/(public)`
- `src/components/shared`
- `src/components/media`

Si quieres entender operativa:

- clientes dentro de `src/app/(admin)/admin/**`
- clientes dentro de `src/app/(volunteer)/voluntario/**`

## `src/lib/actions`

Aqui viven las mutaciones serias.

Idea muy util:

- las paginas leen
- las acciones mutan

Si un boton hace algo importante, casi siempre el rastro bueno termina aqui.

## `src/lib/auth`

Aqui esta parte de la inteligencia de permisos y sesion.

Especialmente importante:

- `permissions.ts`
- `session.ts`

Esto evita tener el repo lleno de comparaciones de strings repartidas como confeti.

## `src/lib/supabase`

Helpers de:

- server
- client
- admin
- middleware helper

Y la proteccion real de rutas pasa por `src/proxy.ts`.

## `supabase/migrations`

Aqui esta la verdad del dominio.

Si alguna vez dudas entre:

- "lo que parece que hace la UI"
- "lo que de verdad permite el sistema"

las migraciones suelen ganar la pelea.

## Las tablas y entidades que mas importan

- `event_config`: configuracion viva del evento
- `event_editions`: ediciones del evento
- `people`: registro canonico de personas
- `profiles`: cuenta auth, rol y flags
- `categories`: categorias de competicion
- `teams`: equipos
- `athletes`: atletas confirmados
- `edition_participations`: memoria por edicion
- `volunteer_applications`: solicitudes de voluntariado
- `team_registrations`: preinscripciones de equipo
- `team_registration_members`: integrantes de esas preinscripciones
- `workouts`: WODs
- `workout_stages`: etapas de cada WOD
- `heats`: series
- `lanes`: calles
- `live_updates`: capa provisional live
- `scores`: capa oficial publicable
- `volunteer_assignments`: asignaciones operativas
- `stream_sessions`: sesiones publicas de directo y replay
- `media`: galeria, descarga y compra configurable
- `sponsors`: patrocinadores

## El modelo de acceso, explicado sin humo

Estado real del codigo:

- `superadmin`
- `admin`
- `volunteer`
- `athlete`
- `profiles.can_validate_scores`
- `profiles.is_judge`

Traduccion humana:

- `superadmin`: manda en la plataforma
- `admin`: manda en la operativa
- `volunteer`: curra el live
- `athlete`: consume y consulta
- `can_validate_scores`: tiene el sello oficial
- `is_judge`: se ve y se filtra como juez, pero no te regala automaticamente las llaves nucleares

Es un modelo bastante mas sano que crear siete roles ceremoniales y luego no saber cual toca para cada cosa.

## La filosofia importante: mobile first de verdad

Aqui hay una decision de producto muy seria:

la app no debe pensarse como una web desktop que luego "se adapta un poco".

Debe pensarse como:

- una interfaz de evento que nace para movil
- y luego escala bien a desktop

Por eso se ha metido mano en:

- navbar publica
- overlay movil
- navegacion movil protegida
- dashboards internos
- tablas convertidas en cards en movil
- filtros, pills y layouts menos torpes en smartphone

Si algo funciona en escritorio pero en telefono se siente como empujar un armario por una escalera, aun no esta bien.

## Que partes estan ya bastante bien encaminadas

- shell publico auth-aware
- cuenta publica y registros
- people registry base
- continuidad entre ediciones con primera capa real
- scoring live de voluntario
- validacion oficial
- dashboard admin como centro de mando
- CRUD de equipos, atletas, WODs y stages
- UI de voluntarios y asignaciones
- streaming publico por sesiones
- galeria publica y admin de media
- heroes editoriales y narrativa visual mas seria
- navegacion movil para admin y voluntario

Hay producto real aqui.
No estamos maquillando un solar.

## Que sigue en obras

- scoring configurable mas fino
- puente visible con WodBuster
- capa legal de consentimiento y retencion
- historial atleta mas profundo
- multi-edicion mas visible en la UI
- sponsors con mas riqueza operativa
- comercio de galeria mas completo si se quiere ir mas alla de `purchase_url`

En resumen:

lo gordo ya existe, pero aun quedan habitaciones por amueblar.

## Por donde entrar si me pierdo

Empieza por esto, en este orden:

1. `README.md`
2. `AGENTS.md`
3. `docs/chuleta_personal_gijon_throwdown.md`
4. `docs/guia_perfiles_gijon_throwdown.md`
5. `docs/guias_operativas/README.md`
6. `docs/guia_tecnica_gijon_throwdown.md`
7. `src/app/(public)/page.tsx`
8. `src/app/(admin)/admin/page.tsx`
9. `src/app/(volunteer)/voluntario/page.tsx`
10. `src/lib/auth/permissions.ts`
11. `src/proxy.ts`
12. `supabase/migrations/001_initial_schema.sql`
13. `supabase/migrations/007_people_registry_and_conversions.sql`
14. `supabase/migrations/011_harden_auth_user_bootstrap.sql`

Con eso ya dejas de mirar el repo como quien entra a un estadio sin saber donde esta su puerta.

## Frase-resumen para no liarte

> Gijon Throwdown no es solo la web del evento. Es la web publica, la operativa live, la validacion oficial y la memoria de personas del evento intentando convivir en paz bajo el mismo techo.

Y si un dia estas cansado:

> piensa en ella como "el escenario + la trastienda + el marcador", todo junto y con bastante menos drama del que podria tener.
