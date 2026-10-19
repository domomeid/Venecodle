# Venecodle Constitution

## Core Principles

### I. Estático y mínimo (NON-NEGOTIABLE)

El juego es un sitio estático servido por GitHub Pages: `index.html` + `places.js` +
`logic.js`. Sin backend, sin build step, sin framework, sin cuentas. Toda nueva
funcionalidad DEBE funcionar con archivos estáticos; si una idea requiere servidor,
se descarta o se reemplaza por una API pública de solo-lectura.

*Rationale: el proyecto nació como un único `.html`; su encanto y su costo
operativo cero dependen de que siga siéndolo.*

### II. Ponytail — la solución más perezosa que funcione

Antes de escribir código, subir por esta escalera y parar en el primer peldaño que
resuelva: ¿ya existe en el repo? → ¿lo hace la stdlib/plataforma? → ¿una dependencia
ya instalada? → ¿una línea basta? Solo entonces escribir lo mínimo. Prohibido:
dependencias nuevas sin necesidad real, abstracciones especulativas, boilerplate,
archivos extra cuando uno existente alcanza. Los atajos deliberados con techo
conocido se marcan con comentario `ponytail:`.

*Rationale: es un juego chiquito mantenido a tiempo parcial; cada línea de más es
deuda.*

### III. El catálogo se genera, no se edita

`places.js` es artefacto generado por `tools/gen_places.py` (stdlib Python,
determinista, GeoNames `VE.zip` cacheado). Curar lugares se hace editando
`MANUAL`/`OVERRIDES`/`ALIASES`/`MUST_HAVE`/`TIER_OVERRIDE`/`EXCLUDE`/`NATURAL` en el
script y regenerando; NUNCA se edita `places.js` a mano. Cada cambio del generador
va commiteado junto con el `places.js` que produce.

### IV. APIs externas: opcionales y con degradado

Tiles, Wikipedia y Open-Meteo son adorno, nunca prerequisito. Toda llamada externa
MUST degradar con gracia (datos locales o sección oculta) y no bloquear el sorteo.
APIs con key: solo keys públicas por naturaleza (se exponen en el repo); las keys
secretas están prohibidas — no hay backend que las esconda.

### V. El progreso del jugador es sagrado

El save vive en `localStorage` bajo `venecodle.v1`. Toda migración MUST ser
in-place, idempotente y conservar rolls/found/EP/racha (ver `migrate()`).
Los rolls de modo prueba se marcan `test` y no tocan colección, EP ni racha.
Maracaibo NO forma parte del catálogo: preserva el evento wipe original
(probabilidad 1-en-10^20) — cualquier cambio al catálogo debe respetarlo.

## Restricciones técnicas

- Lenguaje: JS vanilla ES5-compatible en el browser (sin imports/build), Python 3
  stdlib para herramientas.
- `logic.js` contiene solo lógica pura testeable (sin DOM, sin localStorage) y se
  comparte entre `index.html`, `test.html` y `test.js` (node).
- Reducción de movimiento (`prefers-reduced-motion`) anula toda animación.
- Atribución obligatoria en mapa: OpenStreetMap + CARTO.

## Flujo de desarrollo

- Verificación: `node test.js` debe pasar completo antes de cada commit; asserts
  nuevos para toda lógica pura nueva (no frameworks, no fixtures).
- Commits atómicos por pieza funcional, mensaje en español estilo
  `<tipo>: <qué>` (feat/fix/style/docs).
- Specs de features viven en `specs/<NNN>-<slug>/` (spec → plan → tasks).
- Deploy: push a `main` en `domomeid/Venecodle`; GitHub Pages sirve la raíz.

## Governance

Esta constitución gobierna sobre preferencias ad-hoc. Las enmiendas requieren:
editar este archivo, justificar el cambio en el Sync Impact Report del commit, y
bump semántico de versión (MAJOR: principio eliminado/redefinido; MINOR: principio
o sección nueva; PATCH: aclaración). Todo PR/revisión verifica cumplimiento de los
cinco principios; la complejidad adicional debe justificarse por escrito.

**Version**: 1.0.0 | **Ratified**: 2026-10-19 | **Last Amended**: 2026-10-19
