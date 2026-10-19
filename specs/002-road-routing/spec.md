# Feature Specification: Ruta por vías reales en el mapa

**Feature Branch**: `002-road-routing`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "hacer rutas en las vías en vez de solo conexiones entre punto y punto — análisis aprobado: API pública de routing por tramo con fallback a línea recta y distancia real para el badge de km"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La ruta sigue carreteras reales (Priority: P1)

Al terminar el sorteo y aparecer el mapa, la línea que une las 5 paradas sigue la
red vial real de Venezuela (autopistas, carreteras, caminos) en vez de segmentos
rectos entre coordenadas. El roadtrip se ve como un viaje creíble: bordea el Ávila,
baja por la costa, sube a los Andes por las vías que existen.

**Why this priority**: es toda la feature — la fantasía "roadtrip" depende de que
la línea parezca un viaje y no un pentagrama de líneas rectas.

**Independent Test**: sortear un roadtrip en modo prueba con 5 paradas conectadas
por vías y verificar que cada tramo dibuja la geometría de carretera.

**Acceptance Scenarios**:

1. **Given** un roll con 5 paradas alcanzables por vía, **When** se renderiza el
   mapa, **Then** la polyline de cada tramo sigue la geometría vial retornada por
   el servicio de routing, no una recta.
2. **Given** el mismo roll, **When** el servicio responde, **Then** los
   marcadores y el orden de paradas no cambian — solo cambia la geometría entre
   ellos.

---

### User Story 2 - Fallback por tramo cuando no hay vía (Priority: P1)

Muchas paradas del catálogo no están sobre una vía (cayos, Los Roques, Salto
Ángel, aldeas de Amazonas, islas). Cuando un tramo no tiene ruta vial o el
servicio falla, ese tramo se dibuja en línea recta con estilo distinto
(punteada/tenue) y el resto de la ruta sigue por carretera. Si el servicio está
caído o sin conexión, toda la ruta cae a rectas como hoy — el juego nunca se
rompe ni se bloquea esperando.

**Why this priority**: sin fallback por tramo, un solo punto imposible (muy común
en este catálogo) degradaría toda la ruta — es requisito de robustez, no adorno.

**Independent Test**: construir un roll con una parada insular y verificar que
ese tramo sale punteado y los demás por vía; probar offline y verificar que todo
cae a rectas sin errores en consola.

**Acceptance Scenarios**:

1. **Given** un tramo sin ruta vial posible, **When** el servicio responde con
   error o sin geometría, **Then** ese tramo se dibuja recto con estilo
   diferenciado y los demás tramos siguen por vía.
2. **Given** el servicio inaccesible (offline/timeout), **When** se renderiza el
   mapa, **Then** la ruta completa cae a líneas rectas sin bloquear la UI ni
   reintentos visibles.

---

### User Story 3 - Distancia real en los badges (Priority: P2)

El badge "N km recorridos" y "Tramo largo" usan la distancia por carretera
cuando está disponible (la línea recta subestima groseramente un roadtrip real).
Si la ruta vial no está disponible, se usa la distancia geodésica actual.

**Why this priority**: valor real pero no bloquea el US1; el cambio es solo de la
cifra, no del flujo.

**Independent Test**: comparar el badge de km con una ruta vial conocida —
el número debe ser mayor que la distancia recta y consistente con el routing.

**Acceptance Scenarios**:

1. **Given** una ruta vial obtenida, **When** se calculan los badges de ruta,
   **Then** los km reflejan la distancia vial total y el tramo más largo por
   carretera.
2. **Given** tramos en fallback recto, **Then** esos tramos aportan su distancia
   geodésica al total.

## Edge Cases

- Parada exactamente sobre coordenadas sin snap vial cercano (ej. cayo a 80 km
  de la costa): el tramo sale recto punteado.
- Servicio responde lento (>5s): la UI no espera — el mapa puede pintar rectas
  primero e interpolar a vial al llegar la respuesta, o caer a rectas si se
  agota el tiempo. Nunca bloquea.
- Respuesta parcial (algunos tramos sí, otros no): mezcla vial + punteado.
- Ruta con un solo tramo válido: se dibuja ese y el resto recto.
- `prefers-reduced-motion` o navegador sin fetch: rectas, sin intento de request.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La ruta del roll DEBE consultar un servicio público de routing
  vial por cada tramo entre paradas consecutivas (4 requests para 5 paradas).
- **FR-002**: Cada tramo con geometría vial DEBE dibujarse siguiendo esa
  geometría en el mapa; cada tramo sin ella DEBE dibujarse como línea recta con
  estilo visual distinto (punteado/tenue).
- **FR-003**: Si el servicio está inaccesible, la petición falla o excede el
  tiempo límite, el juego DEBE degradar a líneas rectas sin bloquear el sorteo,
  la UI ni mostrar error al jugador.
- **FR-004**: Los badges "km recorridos" y "Tramo largo" DEBEN usar distancia
  vial real cuando esté disponible, y geodésica en los tramos de fallback.
- **FR-005**: Los resultados viales de un mismo roll NO deben repetir requests
  (cache en memoria por sesión basta; no persistir en localStorage).
- **FR-006**: El orden de las paradas sigue siendo el nearest-neighbor geodésico
  actual — la feature no cambia cómo se ordena la ruta, solo cómo se dibuja y
  cómo se miden los km.
- **FR-007**: Sin dependencias nuevas de build ni librerías de routing cliente —
  la decodificación de la geometría es código propio mínimo.

### Key Entities

- **Tramo (leg)**: par de paradas consecutivas; estado `vial | recto`,
  geometría, distancia km.
- **Roll**: gana un campo opcional con los tramos resueltos para no volver a
  pedirlos al re-renderizar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En rutas 100% terrestres, el 100% de los tramos se dibujan por
  vía real.
- **SC-002**: Con paradas insulares/remotas, los tramos sin vía se muestran
  diferenciados y los demás siguen por carretera (0 tramos perdidos por un
  fallo ajeno).
- **SC-003**: Sin conexión o servicio caído, el mapa renderiza igual que hoy en
  menos de 2 segundos adicionales.
- **SC-004**: El badge de km refleja la distancia vial (típicamente 20-40% mayor
  que la recta) cuando el routing responde.

## Assumptions

- Servicio de routing: OSRM público (`router.project-osrm.org`), GET sin auth,
  uso justo aceptable para un juego de hobby — sin garantía de SLA; el
  fallback cubre sus caídas.
- Las paradas se "snapean" al punto vial más cercano por el propio servicio;
  no se ajusta la coordenada del marcador.
- No se persiste la geometría vial en el save (se recalcula al cargar).
- El perfil es `driving`; lanchas/ferries a islas no se modelan (caen a recto).
- Venezuela tiene cobertura vial razonable en OSM salvo Amazonas/Orinoco —
  esos tramos se esperan punteados.
