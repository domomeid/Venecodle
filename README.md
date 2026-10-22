# Venecodle

Un roadtrip por Venezuela al día. Juego estático de un solo HTML: cada día sacas 5 lugares (estados, municipios, ciudades, pueblos, barrios, playas, saltos, picos, islas, lagos, parques) ordenados como ruta en el mapa, ganas EP por rareza e insignias, completas la colección de ~2600 lugares.

## Estructura

- `index.html` — el juego completo (sin build).
- `places.js` — catálogo de lugares (`window.PLACES`), **generado**, no editar a mano.
- `custom.js` — **el archivo para editar a mano**: palabras extra del poema por lugar (`window.PLACE_WORDS`). Una línea por lugar, ej. `'Choroní':['el cacao'],`.
- `logic.js` — lógica pura (badges, distancias, orden de ruta, migración de save), compartida con los tests.
- `test.html` / `test.js` — asserts sin framework: abre `test.html` o corre `node test.js`.
- `tools/gen_places.py` — regenera `places.js` desde GeoNames.

## El catálogo (~2600 lugares)

Todo sale del dump GeoNames `VE.zip` (`tools/gen_places.py`, stdlib only, determinista):

- **Pobladas** (`PPL*`): todas las capitales de estado/municipio + ~1500 ciudades, pueblos, aldeas y barrios por población. Tipo `C` (ciudad) o `P` (pueblo).
- **Municipios** (`ADM2`): los 335, tipo `M`. Se conserva el prefijo "Municipio" para no chocar con ciudades homónimas del mismo estado.
- **Naturales** (topes por clase en `NATURAL`): playas `B`, saltos `F`, islas/cayos `I`, lagos/lagunas `G`, picos/cerros `K`, parques/reservas `R`, cabos `N`. Pico Bolívar, El Ávila, Salto Ángel, Roraima y Delta del Orinoco van en `MANUAL` porque el dump no los trae o les faltan datos.
- **Estados** (`ADM1`): tipo `E`.

Cada lugar guarda: `id` (geonameid o sintético 9xxxxxx), `n` nombre, `s` estado, `t` tipo, `r` región, `k` tier, `la`/`ln` coords, `g` tags de terreno (costero/insular/andino/selva/llano), `p` población, `e` elevación.

### Tiers (probabilidad por parada)

| # | Tier | p | EP | Contenido |
|---|------|---|----|-----------|
| 0 | Común | .515 | 100 | ciudades grandes |
| 1 | Poco común | .26 | 250 | ciudades medianas |
| 2 | Raro | .13 | 600 | municipios, pueblos |
| 3 | Épico | .06 | 1500 | pueblos pequeños, naturales |
| 4 | Anomalía | .025 | 4000 | aldeas y barrios sin población registrada |
| 5 | Mítico | .005 | 10000 | íconos curados a mano (`MANUAL`) |
| 6 | Legendario | .001 | 25000 | solo **Petare** |
| 7 | Basura | .004 | 10 | solo **Guarenas** |

`TIER_OVERRIDE` en el script fija tier por `(nombre, estado)`. **Maracaibo** (la ciudad y su municipio) está excluida del catálogo: mantiene el evento wipe original con probabilidad 1-en-10^20. El Lago de Maracaibo sí entra — no borra nada.

### Curación

- `MANUAL` — lugares que el dump no tiene o que hay que fijar a mano.
- `OVERRIDES` — tags de terreno extra por nombre.
- `ALIASES` — renombres GeoNames → nombre del catálogo viejo (migración de `found`).
- `MUST_HAVE` — fuerza inclusión aunque no clasifiquen.
- `TIER_OVERRIDE` — tier forzado por (nombre, estado).
- `EXCLUDE` — nombres vetados.
- `NATURAL` — qué feature codes de GeoNames entran como naturales, su tipo, tier y tope.

### Pendiente opcional

- **Socopó**: ya está en el catálogo (Barinas). La idea de sonar "Veneka" (Rawayana) al salir choca con copyright — no se puede subir el mp3 al repo. Opción legal: linkear al preview de 30s de Spotify/iTunes o al video oficial cuando salga como parada.

## Desarrollo local

```powershell
python -m http.server 8000   # http://localhost:8000/index.html
```

## Deploy

GitHub Pages sirve la raíz: push a `main` y listo. Sin backend; únicos recursos externos: Leaflet + tiles OSM + Google Fonts.
