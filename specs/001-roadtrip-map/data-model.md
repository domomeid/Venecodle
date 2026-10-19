# Data Model: Sorteo Roadtrip con Mapa

## `places.js` (generado, commiteado)

```js
window.PLACES = [
  { id: 3646738, n: 'Caracas',   s: 'Distrito Capital', t: 'C', r: 'Ce', k: 0, la: 10.488, ln: -66.879, g: ['costero'] },
  ...
];
```

| Campo | Tipo | Origen | Notas |
|---|---|---|---|
| `id` | int | GeoNames `geonameid` | clave de colección y de paradas |
| `n`  | string | GeoNames `name` | puede repetirse entre estados; se muestra con estado si hay homónimos |
| `s`  | string | GeoNames `admin1` → nombre de estado | desambigua homónimos |
| `t`  | `'E'|'C'|'P'` | feature code / población | Estado, Ciudad, Pueblo (igual que hoy) |
| `r`  | string | admin1 → región | `Ce,Oc,Or,An,Ll,Gu,In` (mismo `REG`) |
| `k`  | int 0-5 | quantile de población | tier/rareza |
| `la`,`ln` | float | GeoNames | lat/lng |
| `g`  | string[] | reglas D4 | tags de terreno: `costero,insular,andino,selva,llano` (puede ser `[]`) |

- Maracaibo excluido por id/nombre (D6).
- Los ~90 nombres del catálogo viejo se preservan si existen en GeoNames (para migración de `found`).

## SaveState (localStorage `venecodle.v1`)

```js
{
  v: 2,
  rolls: [                 // máx 60 días, índice 0 = más reciente
    {
      d: '2026-10-19',
      stops: [             // orden del recorrido (ya ordenado por NN)
        { id: 3646738, n: 'Caracas', s: 'DC', k: 0, t: 'C', ep: 65,
          b: [{ n: 'Región Centro', ep: 5 }, { n: 'Costero', ep: 15 }] }
      ],
      rb: [                // badges de ruta (FR-009)
        { n: '312 km recorridos', ep: 25 },
        { n: 'Cruza 4 regiones', ep: 30 }
      ],
      ep: 412              // total del día = Σ stops.ep + Σ rb.ep
    }
  ],
  found: { '3646738': 2 }, // id → veces obtenido
  ep: 412, streak: 3, last: '2026-10-19', unl: false
}
```

### Formato viejo (v1, detectado por ausencia de `v`/`stops`)

```js
{ rolls: [{ d, n, t, ep, b }], found: { 'Caracas': 2 }, ep, streak, last, unl }
```

### Migración v1→v2 (en `load()`)

1. `found`: para cada `nombre → count`, buscar en `PLACES` por nombre; si hay match único → `found[id] = count`; si es ambiguo o no existe → se suma al `found` del match por nombre+estado si se puede resolver, si no se descarta (se pierde solo ese contador, no el EP).
2. `rolls[i]` → `{ d, stops: [{ id: resuelto, n, k: roll.t /* v1 t = índice de tier */, t: tipoResuelto, ep, b }], rb: [], ep }`. En v1 `roll.t` era el índice de tier: migra a `k`; `t` (tipo) se resuelve del `PLACES` match o queda `'C'`. Roll sin match de id: `id: null` (historial lo muestra igual, colección no lo duplica).
3. `ep`, `streak`, `last`, `unl` → copiar. Set `v: 2` y `save()`.

## Entidades derivadas (no persistidas)

- **Ruta del día**: `todayRoll()` → `rolls[0]` si `rolls[0].d === today()`. Ahora devuelve el objeto ruta completo.
- **Badge**: `{ id, n, ep, f }` — `f(lugar)` para badges de parada; nuevo `f(ruta)` para badges de ruta (distancia haversine entre paradas consecutivas, tramo máx, set de regiones, set de tags de terreno).
- **Haversine km**: `hav(la1,ln1,la2,ln2)` en km, R=6371.

## Validación

- Sorteo: 5 paradas, `id` únicos dentro de la ruta (muestreo sin reemplazo; si un tier se agota, se rellena de tiers vecinos).
- Ruta: 5 paradas con `la/ln` válidos → NN greedy. Parada sin coords (no debería ocurrir post-generación; el generador filtra) se excluye del cálculo de distancia pero no del sorteo.
- `test.html` asserta: migración v1→v2 idempotente, NN ordena correctamente en caso conocido, haversine Caracas→Maracaibo ≈ 520km, badges de ruta sobre ruta sintética, dedup de paradas.
