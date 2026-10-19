# Venecodle

Un roadtrip por Venezuela al día. Juego estático de un solo HTML: cada día sacas 5 lugares (estados, ciudades, pueblos) ordenados como ruta en el mapa, ganas EP por rareza e insignias, completas la colección.

## Estructura

- `index.html` — el juego completo (sin build).
- `places.js` — catálogo de lugares (`window.PLACES`), **generado**, no editar a mano.
- `logic.js` — lógica pura (badges, distancias, orden de ruta, migración de save), compartida con los tests.
- `test.html` / `test.js` — asserts sin framework: abre `test.html` o corre `node test.js`.
- `tools/gen_places.py` — regenera `places.js` desde GeoNames.

## Regenerar el catálogo

```powershell
python tools/gen_places.py   # usa tools/VE.zip cacheado o lo descarga
```

Edita `OVERRIDES`/`MANUAL`/`ALIASES` en el script para curar lugares y tags de terreno.

## Desarrollo local

```powershell
python -m http.server 8000   # http://localhost:8000/index.html
```

## Deploy

GitHub Pages sirve la raíz: push a `main` y listo. Sin backend; únicos recursos externos: Leaflet + tiles OSM + Google Fonts.
