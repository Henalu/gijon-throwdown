# Guia operativa para admin validador

La guia para quien tiene que decidir cuando un resultado deja de ser provisional y pasa a ser oficial.

O dicho de forma menos solemne:

tu trabajo es evitar que el leaderboard publique ocurrencias.

## Para que sirve tu perfil

Eres admin, pero con capacidad extra para validar scores.
Eso significa que llevas operativa normal de admin y, ademas, tienes la ultima palabra dentro del modulo de validacion oficial.

## Tus modulos principales

- todo lo del perfil admin
- `/admin/validacion`
- `/admin/validacion/[heatId]`

## Para que sirve cada uno

- `/admin/validacion`: ver que heats esperan revision oficial
- `/admin/validacion/[heatId]`: revisar, corregir y validar el resultado antes de publicarlo

## Lo que puedes hacer

- revisar resultados pendientes
- corregir datos si hace falta
- validar heats oficialmente
- asegurar que el leaderboard solo se alimente de datos buenos

## Lo que no deberias hacer

- validar por inercia
- asumir que lo live ya esta perfecto porque "seguro que si"
- publicar sin revisar si hay dudas en heat, lane o score

## Tu rutina habitual

1. entra en `/admin/validacion`
2. mira que heats estan pendientes
3. abre cada heat con calma razonable
4. revisa que los datos cuadren
5. corrige si hace falta
6. valida solo cuando el resultado merezca salir a la luz sin dar verguenza ajena

## Regla de oro

- `live_updates` es provisional
- `scores` validados son oficiales

Si recuerdas eso, ya evitas medio catalogo de problemas deportivos.

## Si algo no cuadra

- si hay duda de operativa: habla con admin o con pista
- si hay duda de arbitraje: consulta a quien hizo de juez en ese heat
- si hay duda de acceso o permisos: escala a superadmin

## Lo que no debes olvidar

> Validar no es pulsar un boton para quitarte trabajo. Es el paso que protege el marcador oficial de los errores con prisa.
