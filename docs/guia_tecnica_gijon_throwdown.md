# Guia tecnica de Gijon Throwdown

La guia corta para cuando no quieres filosofia de producto, sino saber a que archivo ir para tocar algo sin abrir medio repo a ciegas.

Piensala como:

- "quiero cambiar un texto del menu, donde voy"
- "quiero tocar una tabla, donde esta el cliente"
- "quiero cambiar una animacion o un color, donde se gobierna"

No intenta contarte toda la vida del proyecto.
Intenta ahorrarte paseos inutiles.

Si lo que buscas es una guia de uso por perfil humano y no una guia de archivos, ve a:

- `docs/guia_perfiles_gijon_throwdown.md`
- `docs/guias_operativas/README.md`

## 1. Regla general del repo

La mayoria de modulos siguen este patron:

1. `page.tsx` carga datos en servidor
2. `*-client.tsx` pinta UI interactiva
3. `src/lib/actions/*.ts` hace mutaciones
4. `supabase/migrations/*.sql` define o cambia datos reales

Traduccion:

- si quieres cambiar que datos se leen, mira primero `page.tsx`
- si quieres cambiar tablas, cards, filtros, tabs o dialogs, mira `*-client.tsx`
- si quieres cambiar que pasa al guardar, editar o borrar, mira `src/lib/actions/*.ts`
- si quieres cambiar el modelo de datos, no empieces por el JSX: mira migraciones

## 2. Mapa rapido de carpetas

### Rutas y pantallas

- `src/app/(public)`: web publica, cuenta, legal y registros
- `src/app/(admin)/admin`: panel admin por modulos
- `src/app/(volunteer)/voluntario`: operativa live
- `src/app/(live)`: live screen y overlay

### Layout y navegacion

- `src/components/layout`: navbar, footer, menus, overlays y navegacion protegida

### UI base

- `src/components/ui`: botones, dialogs, selects, tabs, table, etc.

### Logica de negocio

- `src/lib/actions`: altas, ediciones, borrados y mutaciones serias
- `src/lib/auth`: permisos, roles, rutas por perfil
- `src/lib/supabase`: clientes y helpers de Supabase

### Datos

- `supabase/migrations`: schema, RLS, funciones y evoluciones del modelo
- `src/types/index.ts`: tipos compartidos del front

## 3. Si quieres cambiar el menu o la navegacion

### Menu publico

Ve a:

- `src/components/layout/public-navigation.ts`

Aqui cambias:

- labels del menu publico
- descripciones del overlay
- bottom nav publica
- links de acceso rapido del overlay

Si quieres tocar el render:

- `src/components/layout/navbar.tsx`
- `src/components/layout/mobile-menu-sheet.tsx`
- `src/components/layout/mobile-bottom-nav.tsx`

### Menu admin

Ve a:

- `src/components/layout/admin-navigation.ts`

Aqui cambias:

- nombres de modulos admin
- descripciones del menu
- orden de enlaces

Si quieres tocar el render:

- `src/components/layout/admin-sidebar.tsx`
- `src/components/layout/protected-mobile-nav.tsx`

### Autoenfoque y scroll del menu movil

Ve a:

- `src/components/layout/use-contextual-menu-scroll.ts`

Y si el problema es del overlay que lo usa:

- `src/components/layout/protected-mobile-nav.tsx`
- `src/components/layout/mobile-menu-sheet.tsx`

## 4. Si quieres cambiar colores, fondo, radios o animaciones globales

Ve a:

- `src/app/globals.css`

Aqui estan:

- colores base
- tokens de marca
- radios
- fondo general
- animaciones globales como `pulse-live` o `score-pop`

Si quieres tocar estilos base de componentes compartidos:

- `src/components/ui/button.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/table.tsx`

Regla util:

- si el cambio es de un modulo concreto, mejor tocar el `*-client.tsx`
- si el cambio debe afectar a toda la app, mira `globals.css` o `src/components/ui`

## 5. Si quieres cambiar textos grandes o estructura de una pagina

### Home publica

Ve a:

- `src/app/(public)/page.tsx`

### Layout publico general

Ve a:

- `src/app/(public)/layout.tsx`

### Cabecera publica

Ve a:

- `src/components/layout/navbar.tsx`

### Footer

Ve a:

- `src/components/layout/footer.tsx`

### Cuenta publica

Ve a:

- `src/app/(public)/cuenta/page.tsx`

### Auth y recuperacion de contrasena

Ve a:

- `src/app/auth/login/page.tsx`
- `src/app/auth/callback/page.tsx`
- `src/app/auth/callback/callback-client.tsx`
- `src/app/auth/setup/page.tsx`
- `src/app/auth/setup/setup-page-client.tsx`
- `src/app/auth/reset-password/page.tsx`
- `src/app/auth/reset-password/reset-password-page-client.tsx`
- `src/lib/actions/auth.ts`

## 6. Si quieres cambiar una tabla, filtro o cards de un modulo admin

La mayoria de veces el archivo correcto esta aqui:

`src/app/(admin)/admin/<modulo>/<modulo>-client.tsx`

Ejemplos:

- Equipos: `src/app/(admin)/admin/equipos/equipos-client.tsx`
- Atletas en equipos: `src/app/(admin)/admin/equipos/athletes-client.tsx`
- WODs: `src/app/(admin)/admin/wods/wods-client.tsx`
- Stages: `src/app/(admin)/admin/wods/workout-stages-client.tsx`
- Personas: `src/app/(admin)/admin/personas/people-client.tsx`
- Usuarios: `src/app/(admin)/admin/usuarios/users-client.tsx`
- Voluntarios: `src/app/(admin)/admin/voluntarios/volunteers-client.tsx`
- Asignaciones: `src/app/(admin)/admin/voluntarios/volunteer-assignments-client.tsx`
- Streaming: `src/app/(admin)/admin/streaming/streaming-client.tsx`
- Patrocinadores: `src/app/(admin)/admin/patrocinadores/patrocinadores-client.tsx`

Si quieres cambiar:

- columnas de una tabla
- cards moviles
- pills o tabs
- filtros
- botones de accion
- dialogs del modulo

el primer archivo a abrir suele ser ese.

## 7. Si quieres cambiar los datos que lee un modulo admin

Ve primero al `page.tsx` del modulo.

Ejemplos:

- `src/app/(admin)/admin/equipos/page.tsx`
- `src/app/(admin)/admin/wods/page.tsx`
- `src/app/(admin)/admin/voluntarios/page.tsx`

Aqui se suele hacer:

- `createClient()`
- consultas Supabase
- joins o normalizacion minima
- paso de props al cliente

Si el problema es "faltan datos en la tabla", muchas veces esta aqui y no en el JSX.

## 8. Si quieres cambiar lo que pasa al guardar, borrar o editar

Ve a `src/lib/actions`.

Mapa rapido:

- equipos: `src/lib/actions/teams.ts`
- atletas: `src/lib/actions/athletes.ts`
- WODs: `src/lib/actions/wods.ts`
- stages: `src/lib/actions/workout-stages.ts`
- voluntarios y registros: `src/lib/actions/registrations.ts`
- asignaciones de voluntarios: `src/lib/actions/volunteer-assignments.ts`
- usuarios internos: `src/lib/actions/admin-users.ts`
- personas: `src/lib/actions/people.ts`
- scores: `src/lib/actions/scores.ts`
- live: `src/lib/actions/live-updates.ts`
- heats: `src/lib/actions/heats.ts`
- streaming: `src/lib/actions/streaming.ts`
- media: `src/lib/actions/media.ts`

Si un boton hace algo importante, casi siempre termina en uno de estos archivos.

## 9. Si quieres tocar roles, accesos o nombres de panel

Empieza por:

- `src/lib/auth/permissions.ts`

Aqui estan cosas como:

- etiquetas de rol
- titulo del panel
- atajos por perfil
- capability de validacion
- logica de juez visible

Si el cambio tambien afecta a acceso real de rutas:

- `src/proxy.ts`

Si afecta al layout protegido:

- `src/app/(admin)/layout.tsx`
- `src/app/(volunteer)/layout.tsx`

## 10. Si quieres tocar formularios de registro publico

Ve a:

- `src/app/(public)/registro/voluntarios/volunteer-registration-form.tsx`
- `src/app/(public)/registro/equipos/team-registration-form.tsx`

Y si el cambio afecta al guardado:

- `src/lib/actions/registrations.ts`

Si afecta al modelo de datos:

- migraciones de `supabase/migrations`

## 11. Si quieres tocar scoring live o validacion oficial

### Voluntario live

Ve a:

- `src/app/(volunteer)/voluntario/page.tsx`
- `src/app/(volunteer)/voluntario/volunteer-dashboard-client.tsx`
- `src/app/(volunteer)/voluntario/heat/[heatId]/page.tsx`

### Mutaciones live

Ve a:

- `src/lib/actions/live-updates.ts`
- `src/lib/actions/scores.ts`

### Validacion oficial

Ve a:

- `src/app/(admin)/admin/validacion/page.tsx`
- `src/app/(admin)/admin/validacion/[heatId]`

Si el problema es de permisos de validacion, vuelve a:

- `src/lib/auth/permissions.ts`

## 12. Si quieres tocar streaming o media

### Streaming

- UI admin: `src/app/(admin)/admin/streaming`
- acciones: `src/lib/actions/streaming.ts`
- helpers: `src/lib/streaming.ts`
- publico: `src/app/(public)/directo/page.tsx`

### Media y galeria

- UI admin: `src/app/(admin)/admin/media`
- acciones: `src/lib/actions/media.ts`
- helpers: `src/lib/media.ts`
- publico: `src/app/(public)/galeria` y `src/app/(public)/galeria/[id]`

## 13. Si quieres tocar textos legales o contenido legal

Ve a:

- `src/lib/legal-content.ts`
- `src/app/(public)/(legal)`

## 14. Si quieres cambiar el modelo de datos

Ve a:

- `supabase/migrations`

Y casi seguro tambien a:

- `src/types/index.ts`

No hagas el camino al reves.
Si cambias primero el front y luego descubres que la tabla no tiene ese campo, la app te devolvera una mirada de desaprobacion bastante justificada.

## 15. Si quieres entender un modulo rapido

Haz esto:

1. abre el `page.tsx` del modulo
2. mira que props envia al cliente
3. abre el `*-client.tsx`
4. busca los `onClick`, `onSubmit` y `startTransition`
5. sigue la pista al archivo de `src/lib/actions`

Con eso normalmente ya tienes:

- que pinta
- de donde lee
- que guarda
- donde rompe si rompe

## 16. Casos tipicos de "quiero cambiar X"

### Quiero cambiar un texto del menu publico

Ve a:

- `src/components/layout/public-navigation.ts`

### Quiero cambiar un texto del menu admin

Ve a:

- `src/components/layout/admin-navigation.ts`

### Quiero cambiar el titulo o descripcion de una pagina admin

Ve al `page.tsx` o `*-client.tsx` del modulo.

Ejemplo:

- `src/app/(admin)/admin/wods/page.tsx`

### Quiero cambiar una tabla o cards de una seccion

Ve al `*-client.tsx` del modulo.

Ejemplo:

- `src/app/(admin)/admin/equipos/equipos-client.tsx`

### Quiero cambiar un select, dialog o tabs de toda la app

Ve a:

- `src/components/ui/select.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/tabs.tsx`

### Quiero cambiar una transicion o una animacion global

Ve a:

- `src/app/globals.css`

### Quiero cambiar quien puede ver un modulo

Ve a:

- `src/lib/auth/permissions.ts`
- `src/proxy.ts`

## 17. Frase final para no perder el norte

Si quieres tocar una pantalla:

- primero abre su `page.tsx`
- luego su `*-client.tsx`
- despues el action correspondiente

Ese es el camino menos dramatico.
