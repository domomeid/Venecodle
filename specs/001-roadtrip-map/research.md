# Research: Sorteo Roadtrip con Mapa

## D1 — Librería de mapa

**Decision**: Leaflet 1.9.x vía CDN (`unpkg.com/leaflet@1.9.4`) + tiles OpenStreetMap.

**Rationale**: ~40 líneas para mapa + marcadores numerados (`L.divIcon`) + `L.polyline`. Cero build. OSM tiles son GETs públicos sin API key, compatibles con GitHub Pages y con la política de uso razonable (un mapa por día por usuario).

**Alternatives considered**:
- MapLibre GL: vector tiles, más pesado, innecesario para 5 puntos.
- SVG propio de Venezuela: hay que conseguir/mantener geometría + proyección; más código que todo el resto de la feature junto.
- Google Maps: requiere API key → no.
- Mapa estático (imagen): sin interactividad; el spec pide nombre/orden por parada.

## D2 — Fuente de datos del catálogo

**Decision**: GeoNames dump `download.geonames.org/export/dump/VE.zip`, procesado por `tools/gen_places.py` (stdlib: `zipfile`, `csv`, `json`) que emite `places.js` commiteado.

**Rationale**: VE.zip trae ~50k localidades con lat/lng, población, feature code (PPLA/PPL/PPLL…), admin1 (estado) y elevación srtm3. Filtrar feature class `P` con población > 0 o feature codes relevantes da ~400-2000 lugares; se recorta por tier. Escribir 300+ lugares a mano con coords es el trabajo que estamos evitando.

**Alternatives considered**:
- Manual: el catálogo actual (~90) ya demostró que no escala.
- Overpass/OSM query: más complejo, datos menos limpios para población.
- Wikidata SPARQL: buena metadata pero query y parsing más laboriosos.

## D3 — Orden del roadtrip

**Decision**: nearest-neighbor greedy desde la primera parada sorteada; distancia haversine.

**Rationale**: con n=5 paradas, cualquier heurística da rutas visuales razonables. NN es ~15 líneas. El spec pide "orden geográfico razonable", no óptimo TSP.

**Alternatives**: 2-opt/TSP exacto (más código, mismo resultado visual con n=5); orden de sorteo puro (produce zigzags feos).

## D4 — Tags de terreno

**Decision**: reglas en `gen_places.py` sobre campos GeoNames + lista de overrides curada:

- `insular`: admin1 = Nueva Esparta o Dependencias Federales.
- `andino`: elevación srtm3 > 800m (o admin1 Mérida/Táchira/Trujillo con elev > 500).
- `selva`: admin1 = Amazonas, o Bolívar con lat < 7.5°.
- `llano`: admin1 ∈ {Apure, Barinas, Cojedes, Guárico, Portuguesa} y elev < 300.
- `costero`: admin1 costero y elev < 150 (los estados costeros son los que tocan el Caribe; la elevación baja cerca del mar es la señal). Overrides para casos conocidos (Choroní, Cuyagua, etc.).
- Lugares sin tag claro: simplemente sin badge de terreno (spec FR-008 lo permite).

**Rationale**: ninguna fuente gratuita da "terreno" directo; estas reglas cubren el 90% y el override cubre el resto. Falla con gracia (sin badge).

## D5 — Migración de save

**Decision**: mismo key `venecodle.v1`. `load()` detecta formato viejo (`rolls[].stops` ausente) y migra:

- `found` viejo `{nombre: count}` → `{placeId: count}` resolviendo por nombre único en el catálogo nuevo; los ~90 nombres viejos se preservan en `places.js` aunque cambien de tier.
- `rolls` viejos → se envuelven como rutas de una parada (`stops:[{...}]`) para el historial.
- `ep`, `streak`, `last`, `unl` → se copian tal cual.

**Rationale**: renombrar el key perdería progreso silenciosamente (FR-004 lo prohíbe). Migración in-place es ~30 líneas.

## D6 — Maracaibo (ciudad vs evento wipe)

**Decision**: Maracaibo se **excluye** del catálogo. El evento wipe sigue siendo solo la probabilidad 1 en 10^20 de `isMaracaibo()`.

**Rationale**: el chiste ("si te sale Maracaibo se borra tu cuenta") dejaría de ser chiste si la ciudad puede salir legítimamente en una ruta con probabilidad real. Excluirla mantiene la rareza cósmica del evento y elimina la ambigüedad.

## D7 — Balance de tiers con catálogo grande

**Decision**: el generador asigna tier por población (quantiles): los más poblados → Común, los más chicos/remotos → Mítico. Se mantienen las probabilidades de tier actuales (`.52/.26/.13/.06/.025/.005`) — el usuario elige tier primero, lugar dentro del tier después; solo cambia cuántos lugares hay por tier.

**Rationale**: conserva la economía EP actual sin retunear nada. `perPlace(k)` ya calcula la probabilidad por lugar dinámicamente.

## D8 — Testing

**Decision**: `test.html` — abre el juego headless-lite: carga `places.js` + las funciones puras extraídas, corre asserts (migración, haversine, NN, badges, dedup de paradas) y muestra PASS/FAIL en página y consola. Sin framework.

**Rationale**: ponytail — el menor check que falla si la lógica se rompe. Alternativa (suite con framework de test JS) es build + deps para un juego de 1 archivo.

## D9 — Deduplicación de lugares y claves de colección

**Decision**: cada lugar tiene `id` = geonameid (estable entre regeneraciones del catálogo). `found` y paradas referencian por `id`; el nombre visible puede repetirse entre estados sin colisionar.

**Rationale**: GeoNames tiene nombres repetidos ("San Antonio" hay ~10). id estable es gratis y resuelve el edge case del spec.
