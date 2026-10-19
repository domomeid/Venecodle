# Tasks: Sorteo Roadtrip con Mapa

**Input**: Design documents from `/specs/001-roadtrip-map/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: `test.html` con asserts (sin framework) — incluido porque la migración de save y el orden de ruta son lógica no trivial (ponytail: un solo check runnable).

**Organization**: US1 = sorteo multi-parada, US2 = mapa, US3 = catálogo terreno/badges. Casi todo toca `index.html` → pocos [P].

## Phase 1: Setup

- [X] T001 Crear `tools/gen_places.py`: descarga `https://download.geonames.org/export/dump/VE.zip`, parsea TSV (stdlib `zipfile`+`csv`), filtra feature class `P`, y produce la lista cruda de candidatos con geonameid, name, admin1, lat, lng, population, srtm3, feature_code.
- [X] T002 En `gen_places.py` agregar mapeo admin1→(estado `s`, región `r` ∈ Ce/Oc/Or/An/Ll/Gu/In), tipo `t` ∈ E/C/P (E solo para las 23 entidades + DC, lista fija), exclusión de Maracaibo por nombre+admin1 (D6), y dedup por id.

---

## Phase 2: Foundational (bloquea todo)

- [X] T003 En `gen_places.py` implementar asignación de tier `k` por quantiles de población y tags de terreno `g` por reglas D4 (insular/andino/selva/llano/costero + dict `OVERRIDES` curado). Emitir `places.js` como `window.PLACES=[{id,n,s,t,r,k,la,ln,g},...]` campos exactos de data-model.md.
- [X] T004 Ejecutar `python tools/gen_places.py` → commitear `places.js`. Sanity check: ≥250 lugares, todos con `la/ln` dentro de bbox Venezuela (~0.6–12.2N, -73.4–-59.8W), Maracaibo ausente, ≥90% de los nombres del catálogo viejo presentes.
- [X] T005 En `index.html`: `<script src="places.js"></script>` antes del script principal; reemplazar `RAW`/`PLACES`/`BYTIER`/`BYNAME` por build desde `window.PLACES` (`BYID` nuevo, `BYNAME` solo para migración); mantener `evalPlace`, `perPlace`, TIERS.
- [X] T006 En `index.html`: migración v1→v2 en `load()` per data-model.md (found por nombre único → id; rolls viejos → rutas de 1 parada con `stops`, `rb:[]`; copiar ep/streak/last/unl; set `v:2` + `save()`).
- [X] T007 Crear `test.html`: runner mínimo (lista de asserts, PASS/FAIL en página y consola) que cargue `places.js` + las funciones puras (ver T008).
- [X] T008 Extraer funciones puras a `logic.js` compartido por `index.html` y `test.html`: `hav(a,b)`, `orderRoute(stops)` (NN greedy desde stops[0]), `migrate(o)`, `evalPlace(p)`, `evalRoute(stops)`. Decisión tomada: `logic.js` (mejor que iframe hack, ~mismo tamaño).

**Checkpoint**: `places.js` existe y el juego viejo sigue funcionando igual con datos nuevos (1 parada de prueba manual). Migración verificable con quickstart check #5.

---

## Phase 3: User Story 1 — Roadtrip de 5 paradas (P1) 🎯 MVP

**Goal**: sorteo diario = ruta ordenada de 5 paradas distintas; boleto, colección, historial y share muestran la ruta.

**Independent Test**: pulsar "Sacar mi lugar" → 5 paradas ordenadas con EP total; recargar → misma ruta; colección marca las 5.

- [X] T009 [US1] En `index.html`: `pickStops()` — 5 lugares distintos por id; tier independiente por parada via `pickPlace()` (mismo azar de tier que hoy, muestreo sin reemplazo; si un tier se agota rellenar de tiers vecinos per data-model.md), preservando animación rolling sobre el nombre de la 1ª parada.
- [X] T010 [US1] En `index.html`: `doRoll()` → construir ruta `stops` (id,n,s,t,ep,b por parada via `evalPlace`), ordenar con `orderRoute()`, guardar `{d,stops,rb:[],ep}` en `rolls[0]` (shape v2, slice 60).
- [X] T011 [US1] En `index.html`: `showTicket()` → render de ruta: lista de paradas numeradas (nombre+estado si homónimo, chip tier, badges, EP) y total del día; `t-name` muestra la parada 1 como héroe del boleto.
- [X] T012 [US1] En `index.html`: `stats()` y `renderCollection()` → colección por `id` con nombre+estado en homónimos; `hist` muestra cada día como una ruta ("Caracas → Coro → …" o lista), no paradas sueltas.
- [X] T013 [US1] En `index.html`: texto de `shareBtn` → ruta completa: paradas con emoji de tier, badges top, EP total del día (mismo formato compacto actual, extendido a N paradas).
- [X] T014 [US1] En `test.html`: asserts de `pickStops` dedup (semilla/controlable o N corridas), `orderRoute` caso conocido, `hav` Caracas→Valencia ≈ 125km ±10%, migración v1→v2 idempotente, y 2 rutas el mismo día (modo unl) no se pisan en `rolls`/`found`.

**Checkpoint**: US1 jugable completo sin mapa — es el MVP desplegable.

---

## Phase 4: User Story 2 — Mapa de la ruta (P2)

**Goal**: mapa Leaflet con marcadores numerados 1→5 y polyline del recorrido bajo el boleto.

**Independent Test**: sortear → mapa con 5 markers en Venezuela, línea en orden, popup con nombre; bloquear tiles → boleto sigue funcionando.

- [X] T015 [US2] En `index.html`: CDN Leaflet 1.9.4 (`unpkg.com`, integrity attrs) — CSS en `<head>`, JS al final; `<div id="map" hidden>` bajo el ticket; CSS `.leaflet-container` alto ~320px, borde estilo ticket.
- [X] T016 [US2] En `index.html`: `renderMap(route)` — init lazy `L.map('map')` + OSM tiles (attribution requerido), marcadores `L.divIcon` numerados con color del tier, popup con `n · s`, `L.polyline` de stops en orden, `fitBounds` padding; `hidden` si no hay ruta del día.
- [X] T017 [US2] En `index.html`: degradado gracioso — `try/catch` en init Leaflet y `error` de tiles → ocultar `#map`, boleto intacto; verificar `typeof L==='undefined'` antes de usar.

**Checkpoint**: US1+US2 juntos; recargar restaura mapa con la misma ruta.

---

## Phase 5: User Story 3 — Badges de terreno/ruta y catálogo (P3)

**Goal**: badges de terreno por parada + badges de ruta (km, tramo, regiones, combos) + badges de nombre nuevos.

**Independent Test**: modo prueba → varias rutas muestran lugares nuevos, badge costero en Choroní, "X km recorridos" y "Cruza N regiones" correctos.

- [X] T018 [P] [US3] En `index.html`: `TERRAIN` map tag→badge (`costero`→"Playero/Costero", `andino`→"Andino", `selva`→"Selvático", `llano`→"Llanero", `insular`→"Insular" con EP por badge ~15) integrado en `evalPlace` leyendo `p.g`.
- [X] T019 [P] [US3] En `index.html`: `evalRoute(stops)` → badges de ruta `rb`: km totales (umbrales p. ej. <300/+0, 300-800/+20, >800/+40), tramo más largo (>300km → badge), regiones cruzadas (≥3 → badge), combo terreno (costa+andino → "De la playa a la montaña"). Guardar en `rb` del roll y sumar a `ep` del día.
- [X] T020 [P] [US3] En `index.html`: badges de nombre nuevos en `BADGES`, lista cerrada: "Compuesto" (tiene espacio/guion, +10), "Con artículo" (empieza El/La/Los, +10), "Letra rara" (contiene q o x, +15), "Palíndromo" (nombre normalizado de 4+ letras que se lee igual al revés, +35).
- [X] T021 [US3] En `index.html`: `renderRules()` → tabla de badges de terreno y de ruta con sus EP; texto de reglas actualizado a "roadtrip de 5 lugares".
- [X] T022 [US3] En `test.html`: asserts de `evalRoute` sobre ruta sintética (km, regiones, combo) y badge de terreno sobre lugar con `g` conocido.
- [X] T023 [US3] Curar `OVERRIDES` en `gen_places.py` revisando ~30 lugares conocidos (Choroní, Cuyagua, Colonia Tovar, Los Roques, Canaima, Salto Ángel…) y regenerar `places.js`.

**Checkpoint**: las 3 US completas e independientes.

---

## Phase 6: Polish

- [X] T024 Ejecutar `test.html` → todos PASS; recorrer checks de quickstart.md (incl. migración y bloqueo de tiles).
- [X] T025 README.md mínimo: qué es, cómo regenerar datos (`python tools/gen_places.py`), deploy = push a main.

---

## Dependencies

- T001→T003→T004 (generador antes que nada). T003 y T005-T008 pueden ir en paralelo si se separan personas, pero mismo repo/archivos → secuencial en la práctica.
- US1 depende de T005/T006 (nuevo schema). US2 depende de US1 (necesita ruta). US3 depende de US1 (necesita `stops`/`rb`); T018/T019/T020 son [P] entre sí (secciones distintas, mismo archivo → secuencial real).

## MVP scope

US1 sola (Phases 1–3) ya es desplegable y cumple "más de un resultado + ruta".

## Notes

- `logic.js` (T008) es la única extracción justificada: compartir funciones puras entre `index.html` y `test.html` sin duplicar. Si al implementar resulta incómodo, test.html puede cargar index.html en iframe oculto — decidir en T007/T008 lo que salga más corto.
- Commit por checkpoint, no por task (tasks en mismo archivo = diffs pisados).
