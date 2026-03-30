# Guia de perfiles de Gijon Throwdown

La guia para que cada persona sepa:

- a que entra
- para que sirve cada modulo
- que se espera que haga ahi
- y que boton conviene no tocar si no quiere invocar una tarde entretenida

No intenta sonar a manual corporativo con voz de ascensor.
Intenta que cualquiera entienda su sitio en la web sin tener que hacer arqueologia emocional entre menus.

Si lo que necesitas es la version corta y enviable para cada persona concreta, mira tambien:

- `docs/guias_operativas/README.md`

## 1. La idea en una frase

No todo el mundo entra a Gijon Throwdown a hacer lo mismo.

- el publico viene a mirar y enterarse
- el atleta viene a seguir su situacion y el evento
- el voluntario viene a meter live
- el juez viene a arbitrar dentro de esa operativa
- el admin viene a ordenar el circo
- el superadmin viene a controlar accesos, permisos y que el castillo no se convierta en una comuna medieval

## 2. Antes de empezar

Si te han invitado a una cuenta interna o de atleta:

1. entras por `/auth/login`
2. completas `/auth/setup` la primera vez
3. despues la app te manda a tu panel natural

Traduccion:

si no ves tu panel al primer segundo, no siempre es un drama.
A veces solo te falta terminar el setup y poner contrasena.

## 3. Pausa importante: juez no es exactamente lo mismo que validador oficial

Esto conviene entenderlo pronto para ahorrar conversaciones circulares:

- `Juez` ahora mismo es una especializacion visible dentro del rol `volunteer`
- ese perfil usa el panel `/voluntario`
- `Validacion oficial` vive en `/admin/validacion`
- esa validacion la hace `superadmin` o `admin` con capacidad de validar scores

En castellano de pasillo:

puedes ser juez de heat sin tener la llave final del leaderboard oficial.
Y eso esta bastante bien, porque una cosa es arbitrar en pista y otra sellar el resultado final.

## 4. Perfil publico o visitante

### Para que sirve este perfil

Para seguir el evento sin entrar en la trastienda.
Es el perfil de quien quiere ver, enterarse, disfrutar o registrarse, no ponerse a reconfigurar heats como si hoy tocara jugar a ser torre de control.

### Modulos que usa

- `/`
- `/horarios`
- `/clasificacion`
- `/directo`
- `/wods`
- `/categorias/[slug]`
- `/galeria`
- `/galeria/[id]`
- `/faq`
- `/patrocinadores`
- `/privacidad`, `/cookies`, `/bases-legales`, `/aviso-legal`
- `/registro/voluntarios`
- `/registro/equipos`

### Que hace desde cada uno

- `/`: ver el resumen del evento, estado general, narrativa y accesos principales
- `/horarios`: enterarse de cuando pasa cada cosa
- `/clasificacion`: seguir resultados oficiales ya publicados
- `/directo`: ver el stream o las sesiones publicas de directo
- `/wods`: consultar pruebas y detalles
- `/galeria`: ver fotos, abrir detalle, descargar o comprar si aplica
- `/registro/voluntarios`: dejar una solicitud para colaborar
- `/registro/equipos`: dejar una preinscripcion de equipo

### Funciones principales

- informarse sin depender de un WhatsApp eterno
- seguir clasificacion, WODs, horarios y directo
- registrarse como voluntario o dejar una preinscripcion de equipo
- revisar contenido legal y FAQ sin salir a otra web rara

### Lo que no le toca

- no gestiona datos internos
- no valida resultados
- no asigna voluntarios
- no toca usuarios ni permisos

Es decir:

si vienes en modo publico, tu trabajo es mirar y decidir.
No abrir paneles con energia de "a ver que pasa si pulso esto".

## 5. Perfil atleta

### Para que sirve este perfil

Para que una persona ya invitada o vinculada como atleta tenga un punto de entrada propio, claro y util.
No para operar el evento.
No para editar heats.
No para ponerse un casco de admin por inspiracion del momento.

### Modulos que usa

- `/cuenta`
- `/clasificacion`
- `/horarios`
- `/wods`
- `/directo`
- `/galeria`
- el resto de superficie publica

### Que hace desde cada uno

- `/cuenta`: ver su perfil dentro del evento, accesos disponibles, continuidad e informacion enlazada si ya existe
- `/clasificacion`: seguir resultados oficiales
- `/horarios`: saber cuando mirar, competir o sufrir deportivamente
- `/wods`: revisar pruebas y detalles
- `/directo`: seguir heats y emisiones
- `/galeria`: buscar fotos del evento y revisar contenido visual

### Funciones principales

- activar su cuenta si ha sido invitado
- consultar su situacion y accesos desde `/cuenta`
- seguir el evento sin tener que pedir contexto cada diez minutos
- ver resultados y continuidad cuando ya esta enlazado al sistema

### Lo que no le toca

- no hace scoring live
- no valida resultados oficiales
- no modifica equipos o atletas desde panel interno
- no toca roles ni usuarios

En resumen:

el atleta viene a consultar, seguir y ubicarse.
No a tocar el cuadro electrico.

## 6. Perfil voluntario

### Para que sirve este perfil

Para operativa live.
Es el perfil de quien esta en el barro del evento mientras el resto aun pregunta si hay wifi.

### Modulos que usa

- `/voluntario`
- `/voluntario/heat/[heatId]`
- y, si quiere, la capa publica para consultar contexto general

### Que hace desde cada uno

- `/voluntario`: ver heats disponibles, filtrar por categoria, heat, equipo o WOD y encontrar rapido donde tiene que entrar
- `/voluntario/heat/[heatId]`: meter datos live del heat activo o permitido, seguir la operativa y registrar lo que va pasando

### Funciones principales

- localizar el heat correcto sin perderse entre bloques
- trabajar desde movil de forma rapida
- introducir datos provisionales en tiempo real
- apoyar la operativa del evento en pista

### Lo que no le toca

- no publica resultados oficiales
- no cambia usuarios ni permisos
- no reconfigura el evento
- no usa `/admin/usuarios`

La idea es simple:

el voluntario mete el dato live.
No firma el BOE del marcador.

## 7. Perfil juez

### Para que sirve este perfil

Para arbitrar dentro del flujo operativo del voluntariado.
En la UI aparece como `Panel juez`, pero tecnicamente sigue moviendose sobre la superficie de voluntario.

### Modulos que usa

- `/voluntario`
- `/voluntario/heat/[heatId]`

### Que hace desde cada uno

- `/voluntario`: encontrar heats asignados o accesibles y ver rapido donde hay trabajo real
- `/voluntario/heat/[heatId]`: seguir el heat, apoyar decisiones de arbitraje y mantener coherencia con la operativa live

### Funciones principales

- arbitrar y apoyar la lectura correcta del heat
- colaborar con la entrada live para que el provisional no vaya a su aire
- actuar como referencia operativa en pista

### Limites importantes

- `Juez` visible no significa automaticamente `validador oficial`
- no entra por defecto en `/admin/validacion`
- no cambia roles ni usuarios
- no convierte el dato provisional en resultado oficial por si solo

Version corta:

el juez manda en el criterio del heat, no en el panel de permisos.

## 8. Perfil admin

### Para que sirve este perfil

Para dirigir la operativa del evento.
Es la cabina de mando de quien organiza de verdad.
No el perfil simbolico que esta ahi para sentirse importante mientras alguien mas arregla todo.

### Modulos que usa

- `/admin`
- `/admin/evento`
- `/admin/categorias`
- `/admin/equipos`
- `/admin/personas`
- `/admin/wods`
- `/admin/heats`
- `/admin/puntuaciones`
- `/admin/voluntarios`
- `/admin/streaming`
- `/admin/media`
- `/admin/patrocinadores`

Y ademas, solo si tiene capacidad de validacion:

- `/admin/validacion`
- `/admin/validacion/[heatId]`

### Que hace desde cada modulo

- `/admin`: ver el estado general del evento, colas pendientes y accesos rapidos
- `/admin/evento`: tocar configuracion general del evento
- `/admin/categorias`: crear, editar y ordenar categorias
- `/admin/equipos`: gestionar equipos, atletas, conversiones e invitaciones posteriores
- `/admin/personas`: revisar la base de personas, enlazar, editar e invitar cuentas cuando toca
- `/admin/wods`: gestionar WODs y sus stages
- `/admin/heats`: ordenar heats y controlar la operativa live
- `/admin/puntuaciones`: revisar y trabajar puntuaciones del evento
- `/admin/voluntarios`: revisar solicitudes, ver operativos y gestionar asignaciones
- `/admin/streaming`: controlar embed principal y sesiones publicas del directo
- `/admin/media`: gestionar galeria, visibilidad, descargas y compra por imagen
- `/admin/patrocinadores`: mantener patrocinadores y su presencia en la web

### Funciones principales

- mantener el evento ordenado y publicable
- convertir registros publicos en entidades reales del sistema
- gestionar equipos, atletas, WODs, heats y voluntariado
- asegurar que la operativa live tiene contexto, estructura y salida publica

### Lo que no le toca

- no cambia roles de usuarios internos si no es superadmin
- no usa `/admin/usuarios`

Traduccion amable:

el admin mueve la competicion.
Pero no reparte llaves maestras del edificio.

## 9. Perfil admin validador

### Para que sirve este perfil

Para cerrar el paso de provisional a oficial.
No es un rol base separado en el sistema.
Es un admin con capacidad extra para validar scores.

### Modulos que usa

- todo lo del perfil admin
- `/admin/validacion`
- `/admin/validacion/[heatId]`

### Que hace desde cada uno

- `/admin/validacion`: ver la cola de heats pendientes de revision oficial
- `/admin/validacion/[heatId]`: revisar, corregir, validar y dejar listo el resultado antes de publicar

### Funciones principales

- revisar el dato oficial antes de que salga al mundo
- corregir errores si hace falta
- validar el heat para que el resultado pueda publicarse
- proteger el leaderboard de improvisaciones con cafeina

### Lo que no deberia olvidar

- el live es util, pero el oficial manda
- si algo no cuadra, aqui se arregla antes de publicar
- validar no es dar a un boton por fe

## 10. Perfil superadmin

### Para que sirve este perfil

Para control total de plataforma.
Es el perfil que combina operativa del evento con gobierno de accesos.
Si algo tiene que ver con invitaciones, roles, activacion o permisos internos, aqui vive la llave buena.

### Modulos que usa

- todos los modulos del perfil admin
- `/admin/usuarios`
- `/admin/validacion` por defecto, porque superadmin tambien puede validar

### Que hace desde cada modulo extra

- `/admin/usuarios`: invitar usuarios internos, cambiar roles, activar o desactivar accesos, marcar jueces, habilitar validacion y mantener orden en permisos

### Funciones principales

- invitar admins, voluntarios, jueces visibles y atletas cuando toque
- controlar quien entra a cada panel
- ajustar roles y estado de usuarios
- tener vision completa de la plataforma y del evento

### Riesgo clasico del perfil

Como puede tocar casi todo, tambien puede liarla con mas alcance.
No por maldad.
Por exceso de confianza, cansancio o por esa frase historica de:

"nah, esto son dos clics y ya"

Ese perfil necesita criterio, no solo acceso.

## 11. Mapa rapido de modulos

Si alguien te pregunta "vale, pero este modulo para que era", aqui va la version corta:

- `Inicio /`: resumen publico del evento
- `Horarios`: cuando pasa cada cosa
- `Clasificacion`: resultados oficiales
- `Directo`: stream y sesiones publicas
- `WODs`: pruebas del evento
- `Galeria`: fotos del evento
- `Registro voluntarios`: solicitud publica para colaborar
- `Registro equipos`: preinscripcion publica
- `Cuenta`: hub personal de acceso y contexto
- `Admin`: cockpit general del evento
- `Evento`: configuracion general
- `Categorias`: estructura competitiva
- `Equipos`: equipos, atletas y conversiones
- `Personas`: base canonica de personas
- `WODs admin`: pruebas y stages
- `Heats`: series y operativa live
- `Puntuaciones`: trabajo sobre scores del evento
- `Validacion`: revision oficial antes de publicar
- `Voluntarios admin`: solicitudes, operativos y asignaciones
- `Streaming`: control del directo publico
- `Media`: galeria y activos visuales
- `Patrocinadores`: presencia de sponsors
- `Usuarios`: accesos y roles internos
- `Voluntario`: dashboard operativo de pista
- `Heat de voluntario`: entrada live heat a heat

## 12. Si no sabes que perfil dar a alguien

Usa esta chuleta rapida:

- quiere mirar el evento: publico
- quiere seguir su cuenta y su contexto de atleta: atleta
- va a meter datos live en pista: voluntario
- va a arbitrar en pista: voluntario + juez visible
- va a gestionar la competicion: admin
- va a revisar resultados oficiales: admin validador o superadmin
- va a invitar usuarios y cambiar roles: superadmin

## 13. Frase final para no perderte

> En Gijon Throwdown no todo el mundo entra a la misma casa por la misma puerta: unos miran, otros compiten, otros meten dato live, otros ordenan el evento y unos pocos llevan las llaves del edificio.

Si recuerdas eso, ya tienes medio sistema entendido sin necesidad de hacer un master en menus.
