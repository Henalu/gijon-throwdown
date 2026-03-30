# Chuleta personal de Gijon Throwdown

La version de bolsillo para no perderte.

## 1. Que hace esta app

- Web publica del evento
- Panel admin para operativa
- Dashboard voluntario para live scoring
- Modulo de validacion oficial
- Vista live y overlay para stream
- Capa fotografica editorial ya repartida por la home, no solo en el hero
- People registry ya operativo y base preparada para crecer hacia historial entre ediciones

## 2. Superficies

- Publico: consumo del evento
- Admin: configuracion, gestion y cuadro de mando operativo
- Voluntario: entrada rapida de datos live
- Live/overlay: seguimiento y emision

## 3. Rutas que importan

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
- `/admin`
- `/admin/personas`
- `/admin/usuarios`
- `/admin/validacion`
- `/admin/equipos`
- `/admin/wods`
- `/admin/voluntarios`
- `/admin/streaming`
- `/admin/media`
- `/voluntario`
- `/live/[heatId]`
- `/overlay/[heatId]`
- `/auth/login`
- `/auth/setup`

## 4. Ficheros que ensenan la arquitectura rapido

- `src/components/layout/public-navigation.ts`
- `src/app/(public)/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/app/(public)/directo/page.tsx`
- `src/app/(volunteer)/voluntario/heat/[heatId]/scoring-interface.tsx`
- `src/app/(admin)/admin/validacion/[heatId]/validation-detail-client.tsx`
- `src/lib/hooks/use-realtime-heat.ts`
- `src/lib/actions/live-updates.ts`
- `src/lib/actions/scores.ts`
- `src/proxy.ts`

## 5. Tablas clave

- `event_config`: configuracion del evento
- `people`: registro canonico de personas
- `event_editions`: ediciones del evento
- `categories`: categorias
- `teams`: equipos
- `edition_participations`: memoria de participacion por edicion
- `athletes`: atletas
- `volunteer_applications`: solicitudes de voluntariado
  y ahora tambien preferencia de juez
- `team_registrations`: preinscripciones de equipo; atleta 1 queda como contacto responsable
- `team_registration_members`: atletas de esas preinscripciones
- `workouts`: WODs
- `workout_stages`: etapas de un WOD
- `heats`: series
- `lanes`: asignacion por calle
- `live_updates`: stream provisional de live scoring
- `scores`: resultados finales/publicables
- `sponsors`: patrocinadores
- `volunteer_assignments`: asignaciones operativas
- `stream_sessions`: sesiones publicas de directo y replay
- `media`: galeria oficial, descarga y compra configurable

## 6. Flujo de score, de forma muy simple

```text
voluntario -> live_updates -> realtime/live screen -> revision oficial -> scores publicados -> leaderboard
```

## 7. Idea importante

- `live_updates` es provisional
- `scores` es la capa oficial
- `leaderboard` deberia depender solo de lo validado/publicado

Si recuerdas eso, ya evitas media confusion del proyecto.

## 8. Modelo de acceso

- `superadmin`
- `admin`
- `volunteer`
- `athlete`
- `head_judge` como capability de validacion
- `is_judge` como marca visible para perfiles de voluntariado/juez sin meter un rol global nuevo

Y ahora ademas:

- `profiles.person_id`
- `athletes.person_id`

## 9. Filosofia de producto

- Mobile first real
- La home es hub, no poster
- El directo va primero
- El ranking oficial no se improvisa
- La plataforma debe servir tanto al publico como a la operativa

## 10. Si me pierdo, empiezo por aqui

1. `README.md`
2. `MEMORY.md`
3. `ROADMAP.md`
4. `docs/guia_personal_gijon_throwdown.md`
5. `src/app/(public)/page.tsx`
6. `src/app/(volunteer)/voluntario/heat/[heatId]/scoring-interface.tsx`
7. `supabase/migrations/001_initial_schema.sql`

## 11. Lo que ya esta bien encaminado

- shell publico mobile first
- bottom nav y overlay movil unificados
- navbar desktop limpia: navegacion publica visible y accesos por rol dentro de un menu de cuenta
- admin y voluntario ya tienen menu movil propio para no quedarse encerrado en pantallas internas
- usuarios internos, invitaciones y onboarding base
- scoring live de voluntario
- validacion oficial y publicacion controlada
- people registry y conversion de registros a entidades reales
- `/admin/personas`
- `/cuenta` con contexto real para atleta enlazado
- continuidad base entre ediciones con `event_editions` y `edition_participations`
- CRUD admin para athletes dentro de `/admin/equipos`
- CRUD admin para workout stages dentro de `/admin/wods`
- UI admin para volunteer assignments dentro de `/admin/voluntarios`
- invitacion explicita de atletas despues de convertir un equipo
- dashboard voluntario con filtros por categoria, heat, WOD y equipo
- heroes editoriales con foto en home, directo y WODs
- footer desktop con paginas legales internas dentro de la propia web
- `/admin/streaming` con sesiones publicas reales
- `/admin/media` con subida de fotos, descarga y compra configurable
- `/galeria` y `/galeria/[id]` como capa publica de fotos
- live heat y overlay
- admin base
- build, typecheck y lint del source

## 12. Lo que sigue pendiente

- perfil atleta mas profundo y gestion multi-edicion mas visible
- scoring rules configurables
- capa legal de datos
- puente visible con WodBuster
- checkout real para compra de fotos si no se quiere depender solo de `purchase_url`
- onboarding atleta mas redondo tras la invitacion

## 13. Lo que solo puedes cerrar tu

- branding y assets finales
- textos reales y FAQ
- sponsors reales con logos utiles
- enlaces reales a WodBuster
- reglas de scoring y desempates
- politica legal y de retencion
- definicion exacta del historico entre ediciones

## 14. Remate final recomendado

1. Alinear seed y categorias con equipos de 4.
2. Completar `/admin/evento`.
3. Cerrar scoring configurable, legal y WodBuster.
4. Aplicar migraciones y hacer smoke test en produccion.

## 15. Frase-resumen para no liarte

> Gijon Throwdown no es solo una web del evento. Es una plataforma que quiere unir informacion, operativa live y resultados oficiales en una sola casa.

Y si un dia estas cansado:

> piensa en ella como "la web publica + la trastienda + el marcador", todo junto y con menos drama del que parece.
