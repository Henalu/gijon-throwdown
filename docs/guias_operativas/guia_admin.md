# Guia operativa para admin

La guia para quien lleva la operativa real del evento.

Tu trabajo es hacer que la competicion se entienda, se mueva y no se desordene como un cajon de cables.

## Para que sirve tu perfil

Tu perfil esta para gestionar el evento.
No para cambiar permisos del sistema.
No para repartir llaves maestras.
No para jugar a ser superadmin con la confianza de quien ha dormido cuatro horas.

Tu terreno es:

- competicion
- estructura
- operativa
- contenido publico
- seguimiento del evento

## Tus modulos principales

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

Y si tienes capacidad de validacion:

- `/admin/validacion`

## Para que sirve cada uno

- `/admin`: ver el resumen general y lo pendiente
- `/admin/evento`: tocar datos generales del evento
- `/admin/categorias`: mantener categorias y orden competitivo
- `/admin/equipos`: gestionar equipos, atletas y conversiones
- `/admin/personas`: revisar personas, enlazar e invitar cuando toca
- `/admin/wods`: mantener pruebas y stages
- `/admin/heats`: preparar heats y controlar operativa live
- `/admin/puntuaciones`: revisar puntuaciones del evento
- `/admin/voluntarios`: revisar solicitudes, operativos y asignaciones
- `/admin/streaming`: mantener el directo publico util y visible
- `/admin/media`: cuidar galeria y activos visuales
- `/admin/patrocinadores`: mantener sponsors bien reflejados

## Lo que puedes hacer

- organizar equipos, atletas, heats y WODs
- convertir registros publicos en entidades reales
- preparar la operativa para voluntarios
- mantener al dia el directo, media y estructura competitiva
- revisar puntuaciones y apoyar la coherencia del evento

## Lo que no te toca

- no gestionar roles de usuarios internos
- no entrar a `/admin/usuarios` como si fuera tu zona natural
- no cambiar accesos por tu cuenta si eso requiere superadmin

En corto:

tú mueves el evento.
No gobiernas el sistema de permisos.

## Tu rutina habitual

1. entra en `/admin`
2. mira que esta pendiente
3. revisa si hay trabajo en equipos, heats, WODs o voluntarios
4. limpia bloqueos operativos
5. deja el evento listo para que la parte publica y la parte live no vayan cada una por su novela

## Cuando usar `/admin/equipos`

Entra aqui cuando necesites:

- crear o ajustar equipos
- revisar atletas
- convertir preinscripciones
- lanzar invitaciones atleta despues de la conversion

## Cuando usar `/admin/voluntarios`

Entra aqui cuando necesites:

- revisar solicitudes publicas
- convertir voluntarios reales
- organizar asignaciones por heat
- mantener claro quien esta en pista y para que

## Cuando usar `/admin/heats`

Entra aqui cuando necesites:

- ordenar heats
- controlar que esta operativo
- preparar el terreno para el panel de voluntario

## Si algo no cuadra

- si el problema es de acceso o rol: escala a superadmin
- si el problema es de resultado oficial: ve a validacion o habla con quien valida
- si el problema es de estructura del evento: casi seguro lo arreglas desde tu panel

## Lo que no debes olvidar

> Tu perfil no esta para adornar menus. Esta para que la competicion tenga estructura, orden y salida publica sin depender de milagros.
