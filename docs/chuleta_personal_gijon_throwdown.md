# Chuleta personal de Gijon Throwdown

La version de bolsillo para no perderte.

## 1. Que hace esta app

- Web publica del evento
- Panel admin para operativa
- Dashboard voluntario para live scoring
- Vista live y overlay para stream
- Base lista para crecer hacia roles, validacion oficial y registro de personas

## 2. Superficies

- Publico: consumo del evento
- Admin: configuracion y gestion
- Voluntario: entrada rapida de datos live
- Live/overlay: seguimiento y emision

## 3. Rutas que importan

- `/`
- `/directo`
- `/horarios`
- `/clasificacion`
- `/wods`
- `/admin`
- `/voluntario`
- `/live/[heatId]`
- `/overlay/[heatId]`
- `/auth/login`

## 4. Ficheros que ensenan la arquitectura rapido

- `src/components/layout/public-navigation.ts`
- `src/app/(public)/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/app/(public)/directo/page.tsx`
- `src/app/(volunteer)/voluntario/heat/[heatId]/scoring-interface.tsx`
- `src/lib/hooks/use-realtime-heat.ts`
- `src/lib/actions/live-updates.ts`
- `src/lib/actions/scores.ts`
- `src/lib/supabase/middleware.ts`

## 5. Tablas clave

- `event_config`: configuracion del evento
- `categories`: categorias
- `teams`: equipos
- `athletes`: atletas
- `workouts`: WODs
- `workout_stages`: etapas de un WOD
- `heats`: series
- `lanes`: asignacion por calle
- `live_updates`: stream provisional de live scoring
- `scores`: resultados finales/publicables
- `sponsors`: patrocinadores
- `volunteer_assignments`: asignaciones operativas

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

### Hoy

- `admin`
- `volunteer`

### Objetivo

- `superadmin`
- `admin`
- `volunteer`
- `athlete`
- `head_judge` como capability de validacion

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
- scoring live de voluntario
- live heat y overlay
- admin base
- build, typecheck y lint del source

## 12. Lo que sigue pendiente

- permisos completos
- dashboard de validacion oficial
- registro de voluntarios
- registro de atletas por equipo
- capa legal de datos
- puente visible con WodBuster
- historico entre ediciones

## 13. Lo que solo puedes cerrar tu

- branding y assets finales
- textos reales y FAQ
- sponsors reales con logos utiles
- enlaces reales a WodBuster
- reglas de scoring y desempates
- politica legal y de retencion
- definicion exacta del historico entre ediciones

## 14. Frase-resumen para no liarte

> Gijon Throwdown no es solo una web del evento. Es una plataforma que quiere unir informacion, operativa live y resultados oficiales en una sola casa.

Y si un dia estas cansado:

> piensa en ella como "la web publica + la trastienda + el marcador", todo junto y con menos drama del que parece.
