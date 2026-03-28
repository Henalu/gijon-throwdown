# Guia personal de Gijon Throwdown

Una explicacion cercana, bastante practica y deliberadamente poco solemne de como funciona esta webapp, por que esta montada asi y que partes estan ya finas frente a cuales siguen claramente en obras.

La idea no es que salgas de aqui sabiendo recitar todo el repo como si fueras un druida de Next.js. La idea es que entiendas el proyecto con criterio y sin sufrimiento innecesario.

## La version corta

Si tuviera que resumirtelo en una frase:

Gijon Throwdown es una webapp de evento que mezcla tres mundos en una sola plataforma: informacion publica, operativa en vivo y validacion de resultados.

O dicho de forma mas callejera:

1. La gente entra para seguir el evento.
2. Los voluntarios meten datos live.
3. Admin y head judge ordenan el caos competitivo.
4. El leaderboard oficial publica lo validado.

No es solo una web bonita. Tampoco es solo una herramienta interna. Es una mezcla de ambas cosas, y por eso el proyecto tiene bastante mas chicha de la que parece desde fuera.

## Que es hoy, sin humo

Hoy la app ya es capaz de hacer cosas reales:

- mostrar la web publica del evento
- ensenar WODs, horarios, FAQ, sponsors y clasificacion
- gestionar entidades clave desde admin
- permitir scoring en vivo desde el dashboard de voluntario
- mostrar el live heat y un overlay para stream/OBS

Lo importante es esta idea:

la plataforma ya tiene una verdad operativa, no es un front vacio maquillado con lorem ipsum y esperanza.

## Que quiere llegar a ser

La direccion de producto ya esta bastante clara:

- una capa publica muy buena en movil
- una capa operativa para el evento en tiempo real
- una capa oficial de validacion de resultados
- una base reutilizable de personas para futuras ediciones
- un puente temporal con WodBuster mientras no se sustituya del todo

Traduccion:

esto va camino de ser una herramienta central del evento, no un microsite que se apaga cuando se apagan los focos.

## La idea importante: mobile first no significa "responsive y ya"

Esta es probablemente la decision de producto mas importante que ya esta tomada.

La app no debe pensarse como:

- una web desktop que luego se adapta

Debe pensarse como:

- una interfaz de evento que nace para movil y luego escala a desktop

Por eso la fase actual ha metido mano en:

- shell publico
- bottom nav
- menu overlay
- home convertida en hub
- pantallas publicas densas reorganizadas para escaneo movil

Si una pagina queda preciosa en desktop pero desde el movil obliga a hacer scroll como si fueras bajando el Everest, esa pagina esta mal resuelta. Fin de la cita.

## Las 4 superficies principales

### 1. Publico

Es la parte que ve la mayoria de gente.

Rutas clave:

- `/`
- `/directo`
- `/horarios`
- `/clasificacion`
- `/wods`
- `/patrocinadores`
- `/faq`

Su trabajo no es solo "quedar bien". Su trabajo es ayudar rapido.

En movil, las preguntas tipicas son:

- que esta pasando ahora
- que heat viene despues
- como va mi categoria
- donde veo los WODs
- donde esta el stream

Si la interfaz responde a eso rapido, gana. Si obliga a explorar como si fuera un museo, pierde.

### 2. Admin

Es la cabina de mando de organizacion.

Rutas base:

- `/admin`
- `/admin/evento`
- `/admin/categorias`
- `/admin/equipos`
- `/admin/wods`
- `/admin/heats`
- `/admin/puntuaciones`
- `/admin/patrocinadores`
- `/admin/voluntarios`
- `/admin/streaming`

Aqui se toca lo serio:

- estructura de competicion
- datos del evento
- heats
- equipos
- scores
- streaming

Admin no existe para decorar el repo. Existe para que la operativa no dependa de editar SQL con cara de poker.

### 3. Voluntario

Es la parte de operacion live pensada para movil.

Ruta clave:

- `/voluntario`
- `/voluntario/heat/[heatId]`

Aqui la filosofia es una:

menos romanticismo visual y mas velocidad de dedo.

El voluntario no viene a contemplar la web. Viene a meter datos rapido, con targets grandes y con el menor margen de error posible.

### 4. Live y overlay

Rutas:

- `/live/[heatId]`
- `/overlay/[heatId]`

La vista live sirve para seguir el heat.
La vista overlay sirve para integrarse con stream o realizacion.

Es la diferencia entre "quiero verlo" y "quiero pincharlo en emision sin que se rompa nada".

## Como fluye la informacion

Este es el mapa mental mas util del proyecto:

```text
Admin configura evento, heats y contexto
        ->
Voluntario mete datos live provisionales
        ->
Realtime los mueve a la capa live
        ->
Head judge / admin validador revisa resultado oficial
        ->
Score validado y publicado
        ->
Leaderboard oficial
```

Esto importa mucho porque la app maneja dos verdades distintas:

- la verdad provisional del live
- la verdad oficial del leaderboard

No conviene mezclarlas alegremente, porque ahi nacen los dramas, las reclamaciones y la frase clasica de "pero si antes salia otra cosa".

## Por que este stack y no otro

## Next.js 16

Se usa porque la app necesita:

- rutas claras
- renderizado server-side
- buena base para SEO
- mezclar pantallas publicas y operativa privada en el mismo producto

Tambien viene con una nota importante:

esta version no es "el Next de toda la vida". Tiene cambios reales y ya avisa de que `middleware` debe migrar a `proxy`.

No es un drama, pero si una nota de deuda tecnica que no conviene olvidar.

## React

React esta para construir interfaces por piezas.

Eso permite que cosas como:

- navbar
- menu movil
- bottom nav
- cards de heat
- scoring interface

se puedan reutilizar y refinar sin rehacer media app cada vez.

## Tailwind

Tailwind permite iterar muy rapido la UI y mantener coherencia.

En un proyecto que esta ajustando:

- shell
- jerarquia visual
- densidad de informacion
- comportamiento movil

eso ayuda bastante.

## Supabase

Supabase hace varios trabajos a la vez:

- auth
- Postgres
- realtime
- SSR helpers

En una app como esta, eso encaja especialmente bien porque todo gira alrededor de datos de evento que cambian, permisos y actualizaciones live.

## Server Actions

Las mutaciones viven en `src/lib/actions/*.ts`.

Esto esta bien porque deja la idea bastante limpia:

- las paginas leen
- las acciones mutan

La gracia es que la logica importante no queda desperdigada por botones aleatorios del front.

## Realtime

La tabla `live_updates` y el hook `useRealtimeHeat` permiten mover el estado del live en tiempo real.

Es una de las piezas mas importantes del valor del producto. Sin eso, esta app seria una web informativa con complejo de grandeza.

## Como esta organizado el repo

## `src/app`

Aqui viven las rutas y layouts.

Hay grupos muy utiles:

- `(public)`
- `(admin)`
- `(volunteer)`
- `(live)`

Eso te deja ver bastante rapido que parte de la app estas tocando.

## `src/components`

Aqui vive la UI reutilizable.

Si quieres entender la experiencia publica, mira primero:

- `src/components/layout`
- `src/components/home`

Si quieres entender operativa, mira:

- componentes de admin
- componentes de scoring

## `src/lib/actions`

Aqui estan las mutaciones.

Si un boton hace algo importante, es buena idea rastrearlo hasta aqui en vez de quedarte mirando solo el JSX como si fuera el final del camino.

## `src/lib/supabase`

Aqui estan los helpers de cliente, server, admin y middleware.

Ojo con esto:

el middleware actual funciona, pero esta en deuda con Next 16 porque debe migrarse a `proxy.ts`.

## `supabase/migrations`

Aqui esta la verdad de datos.

Archivos clave:

- `001_initial_schema.sql`
- `002_rls_policies.sql`
- `003_functions.sql`
- `004_seed.sql`

Si alguna vez dudas entre "lo que parece que hace la UI" y "lo que de verdad permite el sistema", las migraciones suelen ganar la discusion.

## Que partes estan ya bastante solidas

- La separacion general entre publico, admin, voluntario y live
- La base de datos del evento
- El uso de Supabase para auth + realtime + datos
- El dashboard de scoring como concepto operativo
- La vista live y el overlay
- El leaderboard apoyado en SQL
- La nueva direccion mobile first del shell publico

Hay una base real. No estamos levantando una catedral sobre servilletas.

## Que partes siguen claramente en obras

## Roles y permisos

Hoy el codigo sigue muy en modo MVP:

- `admin`
- `volunteer`

Pero el producto objetivo necesita:

- `superadmin`
- `admin`
- `volunteer`
- `athlete`
- capability de `head_judge`

Eso aun no esta implementado como debe.

## Validacion oficial

La idea del flujo esta clara, pero la capa formal de revision oficial aun no tiene dashboard dedicado.

Ahora mismo hay piezas de scoring y publicacion, pero no una experiencia cerrada de:

- revisar
- corregir
- aprobar
- consolidar

## Registro de personas

Esto es una de las grandes futuras piezas.

La plataforma quiere guardar personas persistentes para:

- atletas
- voluntarios
- jueces
- admins

Y reutilizar eso entre ediciones.

Hoy todavia no existe esa capa como tal.

## WodBuster bridge

La integracion visible con WodBuster esta definida como necesidad, pero no esta cerrada en la UI.

## Legal y privacidad

Tambien esta pendiente la parte seria de:

- politica de privacidad
- consentimiento
- retencion
- caducidad de datos

Si hay personas y registros, esto no es un extra decorativo. Es parte del producto.

## Como pensar el modelo de roles

## Estado actual

El repo hoy protege sobre todo:

- `/admin`
- `/voluntario`

Y `profiles.role` sigue siendo binario.

## Estado objetivo

La forma sana de pensarlo es esta:

- `superadmin`: controla usuarios, roles y sistema
- `admin`: controla operativa del evento
- `volunteer`: alimenta el live
- `athlete`: consume informacion y perfil
- `head_judge`: valida resultados oficiales

Lo interesante aqui es que `head_judge` no tiene por que ser un rol gigante separado. Puede ser una capacidad concreta sobre usuarios de tipo admin.

Eso suele ser mas flexible y bastante menos lio.

## Como pensar el modelo de datos

Hoy el proyecto esta bastante centrado en una sola edicion del evento.

Pero la vision futura pide separar conceptos:

- persona persistente
- cuenta auth
- participacion por edicion
- rol por edicion
- equipos y membresias
- consentimientos

La app puede seguir mostrando una sola edicion activa en la UI y, a la vez, guardar historial por debajo. Esa mezcla tiene bastante sentido y evita convertir el producto en un monstruo multiproposito demasiado pronto.

## Lo que se acaba de mejorar en esta fase

### Shell publico

- navbar, overlay movil y bottom nav salen de una sola fuente de navegacion
- el menu movil ya se comporta como una capa real
- la bottom nav ahora esta centrada en tareas utiles

### Paginas publicas

- home mas orientada a utilidad inmediata
- directo reordenado alrededor del heat activo
- clasificacion con mejor escaneo por categoria
- horarios agrupados por dia y con mejor jerarquia
- WODs mas compactos y legibles en movil

### Higiene tecnica

- arreglados los dos errores reales de hooks
- `eslint` ya ignora `.claude/worktrees/**`
- `tsc` y `build` vuelven a verde

En resumen:

no solo se ha cambiado pintura. Tambien se ha limpiado parte del cableado.

## Si quieres entender la app en 30 minutos

Yo seguiria este orden:

1. `README.md`
2. `AGENTS.md`
3. `MEMORY.md`
4. `ROADMAP.md`
5. `docs/chuleta_personal_gijon_throwdown.md`
6. `src/app/(public)/layout.tsx`
7. `src/components/layout/public-navigation.ts`
8. `src/app/(public)/page.tsx`
9. `src/app/(public)/directo/page.tsx`
10. `src/app/(volunteer)/voluntario/heat/[heatId]/scoring-interface.tsx`
11. `src/lib/hooks/use-realtime-heat.ts`
12. `src/lib/actions/live-updates.ts`
13. `supabase/migrations/001_initial_schema.sql`
14. `supabase/migrations/003_functions.sql`

Ese recorrido te ensena:

- la app como experiencia
- la app como operativa
- la app como modelo de datos

Y ya con eso tienes media pelicula bastante controlada.

## Que tienes que recordar siempre

- Esto no es solo una web publica.
- Lo live provisional y lo oficial no son lo mismo.
- Movil manda en la experiencia.
- Supabase no es un accesorio; es columna vertebral.
- El repo actual ya funciona, pero todavia esta en fase de consolidar su modelo definitivo.

## Cosas que dependen de ti y no de un agente

Hay decisiones y materiales que el codigo no se puede inventar solo.

Necesitas concretar:

- branding final y criterio visual definitivo
- textos reales del evento
- FAQ real
- venue, direcciones y mapas definitivos
- logos buenos de sponsors
- enlaces reales a WodBuster
- politica de privacidad y copy legal
- reglas reales de scoring y desempates
- alcance final del historico entre ediciones

Sin eso, el producto puede avanzar mucho, pero llega un punto en que la app empieza a mirarte con cara de "muy bien todo, jefe, pero dame contenido real".

## El resumen mas corto posible

Si manana alguien te pregunta "que demonios es Gijon Throwdown por dentro", una respuesta bastante buena seria esta:

> Es una webapp de evento construida con Next.js, React, Tailwind y Supabase que une informacion publica, operativa live y scoring en tiempo real. Hoy ya sirve para mostrar el evento, operar heats y seguir resultados, y su siguiente evolucion es completar permisos, validacion oficial, registro de personas e integracion mas seria con futuras ediciones.

Y si quieres una version aun mas humana:

> Es el cerebro digital del evento, pero todavia esta terminando de crecer los lobulos de permisos, registro y validacion oficial.

Que, dicho asi, suena raro. Pero tambien bastante cierto.
