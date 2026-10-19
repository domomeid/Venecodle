# Quickstart: validación end-to-end

## Prerequisitos

- Repo clonado, branch `001-roadtrip-map`.
- Python 3 en PATH (solo para regenerar `places.js`; el juego no lo necesita).

## Generar el catálogo (una vez)

```powershell
cd tools
python gen_places.py   # descarga VE.zip de GeoNames, escribe ../places.js
```

Validar: `places.js` existe, abre con `window.PLACES = [` y tiene ≥ 250 entradas con `la`/`ln`.

## Correr local

```powershell
# cualquier server estático; el más lazy:
python -m http.server 8000
# abrir http://localhost:8000/index.html
```

`file://` también funciona (Leaflet carga tiles por https sin problema), pero http.server evita rarezas de origen.

## Checks de aceptación

1. **Sorteo roadtrip** (US1): pulsar "Sacar mi lugar" → aparecen 5 paradas ordenadas con rareza, badges y EP; total del día visible. Recargar → misma ruta.
2. **Mapa** (US2): mapa con 5 marcadores numerados y línea en orden. Click en marcador → nombre. DevTools → Network → bloquear `tile.openstreetmap.org` → recargar → boleto funciona sin tiles (FR-016).
3. **Colección** (US3): pestaña Colección muestra lugares nuevos del catálogo; historial agrupa por día como ruta.
4. **Badges de ruta**: alguna ruta en modo prueba muestra "X km recorridos" / "Cruza N regiones"; una parada costera muestra badge costero.
5. **Migración**: en consola, `localStorage.setItem('venecodle.v1', JSON.stringify({rolls:[{d:'2026-10-18',n:'Caracas',t:0,ep:65,b:[]}],found:{Caracas:2},ep:65,streak:1,last:'2026-10-18',unl:false}))` → recargar → EP 65, colección muestra Caracas x2.
6. **Lógica**: abrir `test.html` → todos los asserts PASS.
7. **Maracaibo**: botón "Simular Maracaibo" → overlay sin borrar. `localStorage.removeItem` sigue borrando la cuenta vía "Borrar mi cuenta".

## Deploy

Push a `main` (o merge del branch) → GitHub Pages sirve `index.html` + `places.js`. `tools/` y `specs/` quedan servidos pero no referenciados (sin impacto).
