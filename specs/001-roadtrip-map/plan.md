# Implementation Plan: Sorteo Roadtrip con Mapa

**Branch**: `001-roadtrip-map` | **Date**: 2026-10-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-roadtrip-map/spec.md`

## Summary

Convertir el sorteo diario de un solo lugar en un roadtrip de 5 paradas con mapa Leaflet, catálogo ampliado a ~300+ lugares generado desde GeoNames, y badges nuevos (terreno por parada + distancia/regiones por ruta). Todo sigue siendo un sitio estático sin build: un `index.html` + un `places.js` generado + CDN de Leaflet.

## Technical Context

**Language/Version**: JavaScript vanilla (ES5/ES6 compatible con navegadores modernos), sin build step

**Primary Dependencies**: Leaflet 1.9.x (CSS+JS vía CDN unpkg, tiles OSM). Nada más. La generación de datos usa Python 3 stdlib (one-off, no es runtime).

**Storage**: `localStorage` (misma key `venecodle.v1`, migración in-place en `load()`)

**Testing**: `test.html` con asserts en consola/página (sin framework; ponytail: un solo check runnable)

**Target Platform**: GitHub Pages (estático), navegadores modernos mobile/desktop

**Project Type**: web estático single-page

**Performance Goals**: carga inicial < 2s en 3G; `places.js` < 150KB; sorteo < 5s incluyendo animación

**Constraints**: sin backend propio; únicos recursos externos: CDN Leaflet, tiles OSM, Google Fonts (ya existente); sin cookies ni cuentas

**Scale/Scope**: ~400 lugares con coords, ~1300 líneas totales entre index.html y places.js

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` es el template sin llenar → no hay gates definidos. Se adoptan como principios de trabajo los del enfoque acordado: cero build, una sola dependencia externa (Leaflet), menor diff posible sobre `index.html`, datos generados por script one-off. Sin violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/001-roadtrip-map/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
index.html            # juego completo (markup + CSS + lógica), modificado
places.js             # catálogo generado: window.PLACES = [...] (commiteado)
test.html             # asserts runnable en navegador (lógica pura)
tools/
└── gen_places.py     # one-off: GeoNames VE.zip → places.js (stdlib only)
```

**Structure Decision**: single static site, sin framework ni bundler. `index.html` permanece como archivo único de la app; `places.js` se separa solo porque ~400 lugares con coords harían el HTML inmanejable — es data, no módulo. `tools/` queda fuera del deploy (GitHub Pages lo sirve pero no se referencia).

## Phase 0 Decisions (ver research.md)

- **Mapa**: Leaflet CDN + polyline recta. Routing por carreteras (OSRM) descartado: dependencia de latencia externa para un garnish.
- **Datos**: GeoNames `VE.zip` → `tools/gen_places.py` (stdlib) → `places.js` commiteado. Sin fetch en runtime.
- **Orden de ruta**: nearest-neighbor greedy desde la primera parada sorteada. O(n²) con n=5: irrelevante.
- **Terreno**: tags por reglas en el generador (elevación srtm3 + admin1 + lista curada de costa). No hay fuente perfecta; reglas + overrides.
- **Migración**: mismo key, `load()` detecta shape viejo y migra found por nombre cuando es único.
- **Maracaibo ciudad**: se excluye del catálogo; el evento de wipe queda intacto y la ciudad no sale como parada (evita el edge case de raíz).

## Phase 1 Artifacts

- `data-model.md` — esquema de Lugar/Parada/Ruta/Badge/SaveState + migración
- `contracts/` — omitido: no hay interfaces externas nuevas (la "API" es el DOM + localStorage, documentado en data-model.md)
- `quickstart.md` — validación end-to-end runnable

## Complexity Tracking

Sin violaciones. La única dependencia nueva (Leaflet) está justificada: dibujar un mapa SVG de Venezuela a mano con proyección propia es más código y peor resultado que ~40 líneas de Leaflet.
