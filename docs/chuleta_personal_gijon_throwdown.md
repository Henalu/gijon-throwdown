# Chuleta personal de Gijon Throwdown

La version de bolsillo para no entrar al repo con cara de "yo juraria que esto era una web y de repente hay media organizacion dentro".

## 1. Que hace esta app

- Web publica del evento
- Cuenta y registros publicos
- Panel admin para operativa
- Dashboard voluntario para live scoring
- Modulo de validacion oficial
- Vista live y overlay para stream
- People registry y primera capa de continuidad entre ediciones
- Streaming publico por sesiones
- Galeria publica y admin de media

## 2. Stack real

- Next.js 16.2.1
- React 19.2.4
- Tailwind 4
- Supabase SSR/Auth/Postgres/Realtime
- Base UI
- Lucide
- Sonner

## 3. Superficies

- Publico: consumo, cuenta y registros
- Admin: configuracion y operativa
- Voluntario/juez: entrada live
- Live/overlay: seguimiento y emision

## 4. Rutas que importan

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
- `/admin`
- `/admin/personas`
- `/admin/usuarios`
- `/admin/equipos`
- `/admin/wods`
- `/admin/validacion`
- `/admin/voluntarios`
- `/admin/streaming`
- `/admin/media`
- `/voluntario`
- `/voluntario/heat/[heatId]`
- `/live/[heatId]`
- `/overlay/[heatId]`
- `/auth/login`
- `/auth/setup`
- `/auth/reset-password`

## 5. El flujo de score en una linea

```text
voluntario -> live_updates -> realtime/live -> validacion oficial -> scores -> leaderboard
```

## 6. Idea importante para no liarla

- `live_updates` es provisional
- `scores` es oficial
- `leaderboard` deberia depender de lo validado/publicado

Si recuerdas esto, ya evitas una cantidad preciosa de confusion.

## 7. Modelo de acceso

- `superadmin`
- `admin`
- `volunteer`
- `athlete`
- `can_validate_scores` como capability seria
- `is_judge` como marca visible de juez dentro del flujo de voluntariado
- nuevas altas auth crean o reutilizan `people` automaticamente cuando pueden,
  y las invitaciones ya comprueban antes si la persona tenia perfil enlazado
- login ya ofrece recuperacion de contrasena y el callback auth cubre invite + recovery

## 8. Entidades clave

- `people`
- `profiles`
- `event_editions`
- `edition_participations`
- `categories`
- `teams`
- `athletes`
- `volunteer_applications`
- `team_registrations`
- `team_registration_members`
- `workouts`
- `workout_stages`
- `heats`
- `live_updates`
- `scores`
- `volunteer_assignments`
- `stream_sessions`
- `media`

## 9. Archivos que ensenan la arquitectura rapido

- `src/app/(public)/page.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(volunteer)/voluntario/page.tsx`
- `src/components/layout/public-navigation.ts`
- `src/components/layout/protected-mobile-nav.tsx`
- `src/lib/auth/permissions.ts`
- `src/lib/actions/live-updates.ts`
- `src/lib/actions/scores.ts`
- `src/proxy.ts`

## 10. Si me pierdo, empiezo por aqui

1. `README.md`
2. `AGENTS.md`
3. `docs/guia_personal_gijon_throwdown.md`
4. `docs/guia_perfiles_gijon_throwdown.md`
5. `docs/guias_operativas/README.md`
6. `docs/guia_tecnica_gijon_throwdown.md`
7. `src/app/(public)/page.tsx`
8. `src/app/(admin)/admin/page.tsx`
9. `src/app/(volunteer)/voluntario/page.tsx`
10. `supabase/migrations/001_initial_schema.sql`

## 11. Lo que ya esta bastante bien

- shell publico auth-aware
- navegacion movil propia para admin y voluntario
- dashboard admin como centro de mando
- scoring live de voluntario
- validacion oficial
- CRUD de equipos, atletas, WODs y stages
- people registry
- continuidad base entre ediciones
- streaming publico
- galeria publica y admin de media

## 12. Lo que sigue pendiente

- scoring configurable mas fino
- capa legal y retencion real
- puente visible con WodBuster
- historial atleta mas profundo
- multi-edicion mas visible
- sponsors y media con mas profundidad comercial

## 13. Frase-resumen para no perderte

> Gijon Throwdown es la web publica, la operativa del evento y el marcador oficial intentando convivir sin matarse.
