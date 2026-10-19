# Feature Specification: Sorteo Roadtrip con Mapa

**Feature Branch**: `001-roadtrip-map`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Hacer que Venecodle se parezca más a rngeodle: más badges, más de un resultado por sorteo, un mapita con las ciudades del resultado y una 'ruta' como si fuese un roadtrip con esas ciudades. Además meter aún más ciudades y pueblitos, y poder hacer badges con la distancia, la ruta y el tipo de terreno de los lugares (playero, selva, andino, etc.)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sorteo diario como roadtrip de varias paradas (Priority: P1)

Cada día, al pulsar "Sacar mi lugar", el jugador recibe una ruta de varias paradas (varios lugares de Venezuela) ordenadas como un recorrido, en vez de un solo lugar. Cada parada tiene su rareza, sus insignias de nombre y sus EP; el boleto muestra la ruta completa con el total de EP del día.

**Why this priority**: Es el cambio central pedido ("más de un resultado", "ruta como roadtrip"). Todo lo demás (mapa, badges de distancia) depende de que exista una ruta de varias paradas.

**Independent Test**: Pulsar el botón de sorteo y verificar que se muestran varias paradas ordenadas, cada una con rareza/insignias/EP, que la colección y el historial registran todas las paradas, y que el total de EP del día se suma a los EP acumulados.

**Acceptance Scenarios**:

1. **Given** un jugador que no ha sorteado hoy, **When** pulsa "Sacar mi lugar", **Then** ve una ruta de N paradas distintas (sin repetir lugar dentro del día), ordenadas como recorrido, con el EP total del sorteo.
2. **Given** un jugador que ya sorteó hoy, **When** vuelve a abrir la página, **Then** ve la misma ruta del día persistida (mismas paradas, mismo orden, mismos EP).
3. **Given** una ruta sorteada, **When** el jugador abre la pestaña Colección, **Then** todas las paradas de la ruta aparecen marcadas como encontradas y el historial muestra el sorteo como una sola entrada con sus paradas.
4. **Given** el modo prueba activado, **When** el jugador saca otro sorteo, **Then** puede tener varias rutas el mismo día y todas cuentan para colección y EP.

---

### User Story 2 - Mapa de la ruta del día (Priority: P2)

Debajo o junto al boleto del día se muestra un mapa de Venezuela con un marcador por cada parada de la ruta y una línea que las conecta en el orden del recorrido, numeradas (1 → N). Cada marcador muestra el nombre del lugar al interactuar con él.

**Why this priority**: Es la pieza visual que más se parece a la referencia (rngeodle) y la que da sentido a la metáfora del roadtrip, pero el juego funciona sin él (P1 entrega valor solo).

**Independent Test**: Sortear una ruta y verificar que el mapa muestra todos los marcadores en las posiciones correctas de Venezuela, la línea de ruta en orden, y que se ven nombre y orden de cada parada.

**Acceptance Scenarios**:

1. **Given** una ruta sorteada, **When** el jugador ve el mapa, **Then** hay un marcador numerado por parada y una línea que las conecta en orden.
2. **Given** un jugador que ya sorteó hoy y recarga la página, **When** vuelve a la pestaña Hoy, **Then** el mapa vuelve a mostrar la misma ruta.
3. **Given** un jugador sin sorteo del día, **When** ve la pestaña Hoy, **Then** el mapa no aparece o aparece vacío de ruta hasta que sortea.
4. **Given** una conexión lenta o sin acceso a las imágenes del mapa, **When** se muestra la ruta, **Then** el resto del boleto (paradas, EP, insignias) sigue funcionando aunque el fondo del mapa no cargue.

---

### User Story 3 - Catálogo ampliado y badges de ruta/terreno (Priority: P3)

El catálogo de lugares crece sustancialmente (varios cientos de estados, ciudades y pueblos) y cada lugar conoce su tipo de terreno/ambiente (costero, andino, selvático, llano, insular, etc.). Aparecen badges nuevos: de nombre (los existentes y algunos más), de terreno por parada, y de ruta completa (distancia total recorrida, tramo más largo, cantidad de regiones cruzadas, combinaciones como "de costa a montaña").

**Why this priority**: Aumenta variedad y rejugabilidad, pero requiere el catálogo con coordenadas del P2 y es donde está el mayor trabajo de datos, no de código.

**Independent Test**: Sortear varias rutas en modo prueba y verificar que salen lugares nuevos del catálogo ampliado, que las paradas muestran badges de terreno correctos (p. ej. un pueblo de Los Roques marcado como costero/insular) y que la ruta muestra badges de distancia y diversidad regional con valores correctos.

**Acceptance Scenarios**:

1. **Given** el catálogo ampliado, **When** se sortea una ruta, **Then** las paradas pueden ser lugares que no existían en el catálogo anterior.
2. **Given** una parada con atributo de terreno, **When** se muestra el boleto, **Then** la parada lleva su badge de terreno correspondiente.
3. **Given** una ruta de N paradas con coordenadas, **When** se calcula el sorteo, **Then** se muestran badges de ruta como "X km recorridos", "cruza N regiones" o el tramo más largo, con valores coherentes con las coordenadas.
4. **Given** un lugar mal clasificado o sin coordenadas en el catálogo, **When** se sortea, **Then** no rompe el sorteo (se excluye o se degrada sin badge de ruta para esa parada).

---

### Edge Cases

- Sorteo con catálogo reducido: nunca se repite un lugar dentro de la misma ruta, aunque el catálogo disponible sea pequeño.
- Evento Maracaibo: sigue eliminando la cuenta igual que hoy; aplica sobre cualquier sorteo.
- Jugador con progreso guardado del formato anterior (un solo lugar por sorteo): al cargar, su colección, EP, racha e historial previos se conservan.
- Lugares con nombre duplicado en el catálogo ampliado: se desambiguán (p. ej. por estado/región) para que la colección no mezcle lugares distintos.
- Maracaibo como ciudad real del catálogo: el evento de borrado sigue siendo solo por probabilidad (1 en 10^20), no por salir la ciudad en una ruta; sacar "Maracaibo" como parada normal no borra nada.
- Dos paradas en el mismo sitio aproximado (coordenadas muy cercanas): la distancia del tramo puede ser ~0 km y no rompe los badges de ruta.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sorteo diario MUST producir una ruta ordenada de múltiples paradas (lugares distintos entre sí dentro del día), no un solo lugar.
- **FR-002**: Cada parada MUST conservar la lógica actual: rareza por tier, badges de nombre y EP propios; el sorteo del día suma los EP de todas sus paradas y badges de ruta.
- **FR-003**: El sistema MUST persistir la ruta del día completa (paradas, orden, badges, EP) en el almacenamiento local del navegador, de modo que recargar la página muestre el mismo resultado.
- **FR-004**: El progreso guardado en el formato anterior (EP, racha, colección, historial, modo prueba) MUST conservarse al abrir la nueva versión.
- **FR-005**: El mapa MUST mostrar un marcador por parada y una línea que las conecte en el orden del recorrido, con el número de orden visible por parada.
- **FR-006**: La ruta MUST ordenarse geográficamente de forma razonable (recorrido tipo roadtrip, no orden alfabético ni aleatorio visual).
- **FR-007**: El catálogo de lugares MUST crecer a varios cientos de lugares reales de Venezuela, cada uno con coordenadas geográficas y al menos un atributo de terreno/ambiente.
- **FR-008**: MUST existir badges de terreno por parada (p. ej. costero/playero, andino, selvático, llano, insular) derivados del atributo de terreno del lugar.
- **FR-009**: MUST existir badges de ruta calculados sobre el conjunto del día: distancia total, tramo más largo, cantidad de regiones distintas cruzadas, y combinaciones de terrenos (p. ej. costa + montaña).
- **FR-010**: MUST existir más badges de nombre que los actuales, aplicables al catálogo ampliado.
- **FR-011**: El historial de sorteos MUST mostrar cada día como una ruta (lista de paradas), no como paradas sueltas sin agrupar.
- **FR-012**: El texto de "Copiar resultado" MUST representar la ruta completa del día (paradas, badges principales, EP total) en formato apto para pegar en un chat.
- **FR-013**: Las probabilidades de rareza (tiers) MUST rebalancearse o documentarse para el catálogo ampliado, manteniendo la escala EP por rareza.
- **FR-014**: El evento Maracaibo (borrado de cuenta) MUST conservarse sin cambios en probabilidad ni comportamiento.
- **FR-015**: Todo MUST seguir funcionando como sitio estático (GitHub Pages) sin backend propio; los recursos externos permitidos son solo lectura pública (teselas de mapa, etc.).
- **FR-016**: La app MUST degradar con gracia si el mapa no puede cargar (sin conexión): boleto, colección y EP funcionan igual.

### Key Entities

- **Lugar**: nombre, tipo (estado/ciudad/pueblo), región geográfica, tier de rareza, coordenadas (latitud/longitud), atributo(s) de terreno.
- **Parada**: un lugar dentro de una ruta diaria, con posición de orden, badges y EP.
- **Ruta (sorteo del día)**: lista ordenada de paradas + badges de ruta + EP total + fecha.
- **Badge**: identificador, nombre visible, EP, regla de evaluación (sobre un lugar o sobre la ruta completa).
- **Progreso del jugador**: EP totales, racha, colección (lugares encontrados con conteo), historial de rutas, bandera de modo prueba.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El jugador obtiene su ruta completa del día (paradas + mapa + EP) en una sola acción de pulsar un botón, en menos de ~5 segundos de animación/espera.
- **SC-002**: El catálogo contiene al menos 250 lugares reales de Venezuela con coordenadas, y 100% de las paradas sorteadas se ubican correctamente dentro de Venezuela en el mapa.
- **SC-003**: Recargar la página restaura exactamente la misma ruta del día en el 100% de los casos.
- **SC-004**: Un jugador con progreso del formato anterior conserva el 100% de su EP, racha, colección e historial al actualizar.
- **SC-005**: Cada ruta muestra al menos 1 badge de ruta (distancia o regiones) y cada parada muestra su badge de terreno cuando el lugar lo tiene.
- **SC-006**: El juego sigue funcionando sin errores en consola cuando el mapa no puede cargar sus imágenes de fondo.

## Assumptions

- El sorteo diario consta de 5 paradas por defecto (número ajustable en implementación; el spec no lo fija como contrato).
- El orden de la ruta se calcula con una heurística geográfica simple (p. ej. vecino más cercano desde una parada inicial); no se requiere routing por carreteras reales.
- La línea de ruta en el mapa puede ser recta entre paradas (a vista de pájaro); trazar carreteras reales es opcional y queda fuera de esta feature.
- Los lugares del catálogo provienen de una fuente pública de datos geográficos curada; no se garantiza exhaustividad municipal.
- El atributo de terreno puede derivarse de datos geográficos (costa, elevación/región) y no requiere fuente climatológica detallada.
- El guardado sigue siendo solo local al navegador (sin cuentas ni sincronización entre dispositivos).
- El número de paradas puede variar en el futuro; la colección cuenta lugares únicos sin importar en cuántas rutas salieron.
