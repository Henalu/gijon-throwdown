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

En escritorio, eso ahora tambien se nota en la navegacion:
la barra superior mantiene visible la parte publica y mete los accesos internos
del usuario dentro de un menu de cuenta, para no acabar con una coleccion de
links peleandose entre si como si hubieran pagado entrada para el mismo metro cuadrado.

## Que es hoy, sin humo

Hoy la app ya es capaz de hacer cosas reales:

- mostrar la web publica del evento
- ensenar WODs, horarios, FAQ, sponsors y clasificacion
- transmitir mejor el tono del evento con heroes fotograficos en home, directo y WODs
- repartir mejor la fotografia en la home con bloques editoriales y no solo con una imagen arriba del todo
- mostrar una galeria publica de fotos con descarga y compra configurable
- incluir la capa legal basica dentro de la propia web, sin mandar al usuario fuera para privacidad, cookies o aviso legal
- gestionar entidades clave desde admin
- permitir scoring en vivo desde el dashboard de voluntario
- invitar staff interno, asignar roles y completar onboarding
- validar oficialmente resultados antes de publicarlos
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
- `/cuenta`
- `/registro/voluntarios`
- `/registro/equipos`
- `/privacidad`
- `/cookies`
- `/bases-legales`
- `/aviso-legal`
- `/directo`
- `/galeria`
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
- `/admin/validacion`
- `/admin/validacion/[heatId]`
- `/admin/usuarios`
- `/admin/personas`
- `/admin/patrocinadores`
- `/admin/voluntarios`
- `/admin/streaming`
- `/admin/media`

Aqui se toca lo serio:

- estructura de competicion
- datos del evento
- heats
- equipos
- scores
- streaming
- galeria y fotos oficiales

Admin no existe para decorar el repo. Existe para que la operativa no dependa de editar SQL con cara de poker.

Y ya no te deja tirado en movil:
las superficies internas de admin y voluntario tienen cabecera propia con menu
overlay, para que puedas cambiar de modulo o volver al sitio publico sin sentir
que has entrado en una habitacion sin pomo.

Y ahora el dashboard de `/admin` ya no es solo un saludo institucional con fondo oscuro.
Hace de mesa de control:

- estado del evento
- heats activos o inmediatos
- cola de validacion
- equipos y voluntarios pendientes
- accesos rapidos a streaming, media, personas y modulos de operativa

Que es exactamente lo que deberia hacer un dashboard serio y no un poster de "bienvenido, campeon".

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

la proteccion de rutas ya vive en `proxy.ts`, no en `middleware.ts`, porque Next 16 aqui se puso exquisito y, sinceramente, con razon.

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

La base ya esta implementada:

- `superadmin`
- `admin`
- `volunteer`
- `athlete`
- capability de `head_judge` via `can_validate_scores`
- `is_judge` como especializacion visible del perfil de voluntario sin crear
  un rol global nuevo para jueces

Tambien existen ya:

- modulo de usuarios para superadmin
- invitacion por email para staff interno
- onboarding en `/auth/setup`
- proteccion real de `/admin/usuarios`, `/admin/validacion` y `/voluntario`
- shell publico que ya cambia segun sesion y rol
- `/cuenta` como base de acceso y ya con lectura real para atleta enlazado
- logout visible desde la navegacion publica

## Validacion oficial

La capa base ya existe y esta separada del scoring operativo.

Ahora el flujo es este:

- admin genera borrador desde el heat finalizado
- validador corrige lo necesario
- validador marca el heat como validado
- solo entonces publica
- despues recalcula puntos

Lo que aun falta aqui no es el concepto, sino profundidad:

- reglas de scoring configurables
- mas herramientas de comparacion con hoja oficial
- flujos mas ricos para escenarios raros

## Registro de personas

Esto ya no es solo una idea bonita en una servilleta. La base ya existe.

La plataforma ya guarda o puede convertir personas persistentes para:

- atletas
- voluntarios
- jueces
- admins

Y la idea sigue siendo reutilizar eso entre ediciones.

Lo que existe ya hoy:

- tabla `people` como registro canonico
- `profiles.person_id` para enlazar cuenta auth con persona
- `athletes.person_id` para enlazar atleta con persona
- `event_editions` para modelar la edicion activa y futuras ediciones
- `edition_participations` para empezar a guardar memoria por edicion
- solicitud publica de voluntariado
- esa solicitud publica de voluntariado ahora tambien recoge si la persona
  quiere colaborar como juez
- preinscripcion publica de equipos
  con 4 atletas, composicion 3 chicos + 1 chica y atleta 1 como responsable
- conversion admin desde:
  - `/admin/voluntarios`
  - `/admin/equipos`
  - `/admin/personas`

Lo que todavia falta aqui no es empezar, sino profundizar:

- historial serio entre ediciones
- onboarding atleta mas redondo tras la invitacion
- resolucion mas rica de duplicados o conflictos de identidad
- capa legal y de retencion

## WodBuster bridge

La integracion visible con WodBuster esta definida como necesidad, pero no esta cerrada en la UI.

## Legal y privacidad

Tambien esta pendiente la parte seria de:

- politica de privacidad realmente cerrada y afinada
- consentimiento
- retencion
- caducidad de datos

Ojo: ya existen paginas legales dentro de la propia web para privacidad,
cookies, bases y aviso legal. Lo que falta no es "tener links", sino cerrar la
parte de cumplimiento real, consentimiento registrable y retencion de datos.

Si hay personas y registros, esto no es un extra decorativo. Es parte del producto.

## Como pensar el modelo de roles

## Estado actual

El repo hoy protege sobre todo:

- `/admin`
- `/voluntario`

Y ademas ya deja visible en front algo importante:

- login integrado en la experiencia publica
- menu adaptado a sesion
- atajos por rol
- cuenta publica para cualquier usuario autenticado

## Estado objetivo

La forma sana de pensarlo es esta:

- `superadmin`: controla usuarios, roles y sistema
- `admin`: controla operativa del evento
- `volunteer`: alimenta el live
- `athlete`: consume informacion y perfil
- `head_judge`: valida resultados oficiales

Lo interesante aqui es que `head_judge` no tiene por que ser un rol gigante separado. Puede ser una capacidad concreta sobre usuarios de tipo admin.

Eso suele ser mas flexible y bastante menos lio.

Y distinto de eso esta `is_judge`, que ahora ya existe como marca visible
sobre perfiles de voluntariado para operativa y filtrado interno, sin tocar el
rol global del sistema.

## Como pensar el modelo de datos

Hoy el proyecto esta bastante centrado en una sola edicion del evento.

Pero ojo: ya no estamos en cero. La fase 4 ya ha separado una parte importante:

- persona persistente
- cuenta auth
- identidad deportiva actual

Lo que la vision futura pide completar es esto:

- participacion por edicion
- rol por edicion
- equipos y membresias
- consentimientos

La app puede seguir mostrando una sola edicion activa en la UI y, a la vez, guardar historial por debajo. Esa mezcla tiene bastante sentido y evita convertir el producto en un monstruo multiproposito demasiado pronto.

## Lo que se acaba de mejorar en esta fase

### Profundidad operativa real

- `/admin/equipos` ya no se queda solo en equipos:
  ahora tambien permite gestionar atletas reales, editarlos y borrarlos sin irte a pelear con la base de datos a mano
- `/admin/wods` ya no mira a `workout_stages` como si fueran espiritus del esquema:
  ya hay UI real para crear, editar y eliminar etapas de cada WOD
- `/admin/voluntarios` ya permite gestionar asignaciones operativas a heats y calles,
  que era una de esas piezas que el esquema tenia pero la interfaz miraba de reojo
- despues de convertir un equipo, admin ya puede lanzar la invitacion de atletas como paso explicito
- el dashboard de voluntario ahora filtra mejor por categoria, heat, WOD y equipos,
  asi que se parece bastante mas a una herramienta de evento y bastante menos a una lista simpatica

### La capa atleta empieza a parecerse a algo serio

- `/cuenta` ya traia contexto real de atleta enlazado
- ahora ese contexto ya vive mejor conectado con la operativa porque existe una ruta clara:
  preinscripcion -> conversion -> atleta real -> invitacion
- `/cuenta` ya ensena una primera lectura de continuidad por edicion en lugar
  de quedarse solo en "tu equipo actual y poco mas"
- el onboarding de atleta tambien esta algo mas fino:
  una invitacion de atleta ya no huele tanto a "te hemos colado en un panel interno por accidente"

### Streaming y galeria ya son producto real

- `/admin/streaming` ya no se limita a una URL triste:
  ahora gestiona embed principal y sesiones publicas para directo o replay
- `/directo` ya puede priorizar una sesion live real y ensenar archivo/replays
  en vez de vivir siempre colgado del fallback del evento
- `/admin/media` ya permite subir fotos al bucket privado `event-media`,
  marcar visibilidad, destacar imagenes, activar descarga y pegar una URL de compra
- `/galeria` y `/galeria/[id]` ya dan a la parte publica un sitio real para
  ver fotos, descargar cuando toque y comprar cuando la organizacion lo configure
- la descarga no va a pelo:
  se sirve con URLs firmadas desde el server para no dejar el bucket abierto como un bar a las cuatro de la manana

### Higiene tecnica

- la nueva fase tambien queda con `lint:src`, `typecheck` y `build` en verde
- las fotos editoriales viven ya en local y sus fuentes estan documentadas en `docs/photo-sources.md`

En resumen:

ya no solo tenemos personas y registros. Ahora tambien hay herramientas reales para operarlos sin hacer malabares.

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

## El remate final, sin poesia innecesaria

Si hoy tocara cerrar el proyecto con cabeza, el orden util seria este:

1. Alinear seed, categorias y datos demo con el formato real de 4 personas por equipo.
2. Terminar `/admin/evento` para que controle FAQ, branding, mapas y edicion activa de verdad.
3. Implementar scoring configurable, capa legal y puente visible con WodBuster.
4. Aplicar migraciones, preparar superadmin real, revisar emails y hacer smoke test en produccion.

No suena epico, pero es exactamente el tipo de lista que evita acabar con una demo muy mona y una operativa con agujeros.

## El resumen mas corto posible

Si manana alguien te pregunta "que demonios es Gijon Throwdown por dentro", una respuesta bastante buena seria esta:

> Es una webapp de evento construida con Next.js, React, Tailwind y Supabase que une informacion publica, operativa live y scoring en tiempo real. Hoy ya sirve para mostrar el evento, operar heats, gestionar staff interno, validar resultados, convertir registros en personas/equipos reales y empezar a guardar continuidad entre ediciones; su siguiente evolucion es profundizar el perfil atleta, la capa legal y la convivencia con WodBuster.

Y si quieres una version aun mas humana:

> Es el cerebro digital del evento, y ahora ya empieza a tener memoria. Todavia le faltan cosas, pero ya no vive solo del presente inmediato.

Que, dicho asi, suena raro. Pero tambien bastante cierto.
