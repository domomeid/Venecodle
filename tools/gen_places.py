"""Genera places.js desde el dump GeoNames de Venezuela (VE.zip).

Uso: python tools/gen_places.py
Descarga https://download.geonames.org/export/dump/VE.zip (cache en tools/VE.zip),
filtra localidades pobladas + divisiones de 1er orden, asigna tier por poblacion
y tags de terreno por reglas, y escribe ../places.js como window.PLACES.

Stdlib only. Re-correr es idempotente (determinista).
"""
import csv
import io
import json
import urllib.request
import zipfile
from pathlib import Path

HERE = Path(__file__).parent
ZIP_PATH = HERE / 'VE.zip'
OUT = HERE.parent / 'places.js'
URL = 'https://download.geonames.org/export/dump/VE.zip'

# admin1 (GeoNames) -> (estado, region)
ADMIN1 = {
    '01': ('Amazonas', 'Gu'), '02': ('Anzoátegui', 'Or'), '03': ('Apure', 'Ll'),
    '04': ('Aragua', 'Ce'), '05': ('Barinas', 'Ll'), '06': ('Bolívar', 'Gu'),
    '07': ('Carabobo', 'Ce'), '08': ('Cojedes', 'Ll'), '09': ('Delta Amacuro', 'Gu'),
    '11': ('Falcón', 'Oc'), '12': ('Guárico', 'Ll'), '13': ('Lara', 'Oc'),
    '14': ('Mérida', 'An'), '15': ('Miranda', 'Ce'), '16': ('Monagas', 'Or'),
    '17': ('Nueva Esparta', 'In'), '18': ('Portuguesa', 'Ll'), '19': ('Sucre', 'Or'),
    '20': ('Táchira', 'An'), '21': ('Trujillo', 'An'), '22': ('Yaracuy', 'Oc'),
    '23': ('Zulia', 'Oc'), '26': ('La Guaira', 'Ce'), '25': ('Distrito Capital', 'Ce'),
    '24': ('Dependencias Federales', 'In'),
}
COASTAL = {'23', '11', '07', '04', '26', '15', '02', '19', '16', '09', '17', '24'}
LLANOS = {'03', '05', '08', '12', '18'}

# Lugares del catalogo viejo que no son feature class P (saltos, cayos, islas)
# o que conviene fijar a mano. id sintetico >= 9_000_000.
MANUAL = [
    # id, nombre, estado, tipo, region, lat, lng, pop_est(tier), tags
    (9000001, 'Salto Ángel', 'Bolívar', 'P', 'Gu', 5.9701, -62.5356, 0, ['selva']),
    (9000002, 'Cayo Sombrero', 'Falcón', 'P', 'Oc', 11.8833, -69.2333, 0, ['costero', 'insular']),
    (9000003, 'Isla de Coche', 'Nueva Esparta', 'P', 'In', 10.7833, -63.9500, 0, ['insular', 'costero']),
    (9000004, 'Gran Roque', 'Dependencias Federales', 'P', 'In', 11.9500, -66.8500, 0, ['insular', 'costero']),
    (9000005, 'Los Roques', 'Dependencias Federales', 'P', 'In', 11.8500, -66.7500, 0, ['insular', 'costero']),
    (9000006, 'Canaima', 'Bolívar', 'P', 'Gu', 6.2378, -62.8486, 0, ['selva']),
    (9000007, 'Choroní', 'Aragua', 'P', 'Ce', 10.5047, -67.6036, 0, ['costero']),
    (9000008, 'Cuyagua', 'Aragua', 'P', 'Ce', 10.5264, -67.6419, 0, ['costero']),
    (9000009, 'Chuao', 'Aragua', 'P', 'Ce', 10.4931, -67.6219, 0, ['costero']),
    (9000010, 'Patanemo', 'Carabobo', 'P', 'Ce', 10.4225, -67.9125, 0, ['costero']),
    (9000011, 'Tapipa', 'Miranda', 'P', 'Ce', 10.0667, -66.9167, 0, []),
    (9000012, 'Jají', 'Mérida', 'P', 'An', 8.9578, -71.3197, 0, ['andino']),
    (9000013, 'Los Nevados', 'Mérida', 'P', 'An', 8.4806, -71.0722, 0, ['andino']),
    (9000014, 'Colonia Tovar', 'Aragua', 'P', 'Ce', 10.4133, -67.2939, 0, ['andino']),
    (9000015, 'Mucuchíes', 'Mérida', 'P', 'An', 8.7503, -70.9200, 0, ['andino']),
    (9000016, 'Pueblo Llano', 'Mérida', 'P', 'An', 8.9167, -70.6500, 0, ['andino']),
    (9000017, 'Cata', 'Aragua', 'P', 'Ce', 10.4667, -67.7167, 0, ['costero']),
    (9000018, 'Mochima', 'Sucre', 'P', 'Or', 10.3667, -64.3667, 0, ['costero']),
    (9000019, 'Chichiriviche', 'Falcón', 'P', 'Oc', 10.9333, -68.2667, 0, ['costero']),
    (9000020, 'Tucacas', 'Falcón', 'P', 'Oc', 10.7833, -68.3167, 0, ['costero']),
    (9000021, 'Adícora', 'Falcón', 'P', 'Oc', 11.9500, -69.8000, 0, ['costero']),
    (9000022, 'Macuto', 'La Guaira', 'P', 'Ce', 10.6000, -66.8833, 0, ['costero']),
    (9000023, 'El Hatillo', 'Miranda', 'P', 'Ce', 10.4167, -66.8167, 0, []),
    (9000024, 'Pampatar', 'Nueva Esparta', 'P', 'In', 10.9956, -63.7936, 0, ['insular', 'costero']),
    (9000025, 'Juangriego', 'Nueva Esparta', 'P', 'In', 11.0778, -63.9486, 0, ['insular', 'costero']),
    (9000026, 'Santa Elena de Uairén', 'Bolívar', 'C', 'Gu', 4.6019, -61.1078, 0, ['selva']),
    (9000027, 'Boconó', 'Trujillo', 'C', 'An', 9.2403, -70.2700, 0, ['andino']),
    (9000028, 'Güigüe', 'Carabobo', 'P', 'Ce', 10.0833, -67.7833, 0, []),
    (9000029, 'Güiria', 'Sucre', 'P', 'Or', 10.5667, -62.3000, 0, ['costero']),
    (9000030, 'Río Caribe', 'Sucre', 'P', 'Or', 10.6833, -63.1000, 0, ['costero']),
]

# overrides por nombre para taggeo manual: nombre -> set(tags)
OVERRIDES = {}

# alias GeoNames -> nombre del catalogo viejo (migracion found)
ALIASES = {'Valle de La Pascua': 'Valle de la Pascua'}

# nombres que deben entrar aunque no clasifiquen por poblacion
MUST_HAVE = {'Puerto Ordaz', 'El Callao'}

MAX_PLACES = 450  # tope del catalogo generado (los MANUAL se suman aparte)
EXCLUDE = {'Maracaibo'}  # el evento wipe queda 1-en-10^20 (D6)


def load_geonames():
    if not ZIP_PATH.exists():
        print('descargando VE.zip...')
        urllib.request.urlretrieve(URL, ZIP_PATH)
    with zipfile.ZipFile(ZIP_PATH) as z:
        raw = z.read('VE.txt').decode('utf-8')
    rows = []
    for r in csv.reader(io.StringIO(raw), delimiter='\t'):
        rows.append(r)
    return rows


def pop_tier(pop):
    if pop >= 300_000: return 0
    if pop >= 60_000:  return 1
    if pop >= 15_000:  return 2
    if pop >= 4_000:   return 3
    if pop >= 1_000:   return 4
    return 5


def tags_for(state_code, lat, dem):
    g = []
    if state_code in ('17', '24'):
        g.append('insular')
    if (state_code in ('14', '20', '21') and dem > 500) or dem > 1200:
        g.append('andino')
    if state_code == '01' or (state_code == '06' and lat < 8.0):
        g.append('selva')
    if state_code in LLANOS and dem < 300:
        g.append('llano')
    if state_code in COASTAL and dem < 150 and 'insular' not in g:
        g.append('costero')
    return g


def main():
    rows = load_geonames()
    places, seen_names = [], set()

    # Estados (E): divisiones ADM1; nombre visible = estado sin prefijo "Estado"
    for r in rows:
        if r[6] == 'A' and r[7] == 'ADM1' and r[10] in ADMIN1:
            st, reg = ADMIN1[r[10]]
            if st in EXCLUDE:
                continue
            places.append({'id': int(r[0]), 'n': st, 's': st, 't': 'E', 'r': reg, 'k': 0,
                           'la': round(float(r[4]), 4), 'ln': round(float(r[5]), 4), 'g': []})

    # Localidades pobladas: todas las capitales (PPLA/PPLA2) + top poblacion
    def is_cand(r):
        return (r[6] == 'P' and r[7].startswith('PPL') and r[10] in ADMIN1
                and r[1] not in EXCLUDE and (r[7] in ('PPLA', 'PPLA2') or int(r[14] or 0) > 0
                or r[1] in MUST_HAVE))
    cand = [r for r in rows if is_cand(r)]
    rank = {'PPLA': 0, 'PPLA2': 1}
    cand.sort(key=lambda r: (rank.get(r[7], 2), -int(r[14] or 0)))
    seen = set()  # (nombre normalizado, admin1) -> dedup
    for r in cand[:MAX_PLACES]:
        key = (r[1].lower(), r[10])
        if key in seen:
            continue
        seen.add(key)
        st, reg = ADMIN1[r[10]]
        pop = int(r[14] or 0)
        dem = int(r[16] or 0)
        lat, lng = float(r[4]), float(r[5])
        nombre = ALIASES.get(r[1], r[1])
        tipo = 'C' if pop >= 5000 or r[7] in ('PPLA', 'PPLA2') else 'P'
        g = tags_for(r[10], lat, dem)
        g = sorted(set(g) | OVERRIDES.get(nombre, set()))
        places.append({'id': int(r[0]), 'n': nombre, 's': st, 't': tipo, 'r': reg, 'k': pop_tier(pop),
                       'la': round(lat, 4), 'ln': round(lng, 4), 'g': g})
        seen_names.add(nombre)

    # Manuales (lugares no-poblacion del catalogo viejo): si GeoNames ya trajo
    # el mismo nombre en el mismo estado, solo se fusionan los tags manuales.
    by_name_state = {(p['n'].lower(), p['s']): p for p in places}
    for i, (pid, n, st, t, reg, la, ln, pop, g) in enumerate(MANUAL):
        existing = by_name_state.get((n.lower(), st))
        if existing:
            existing['g'] = sorted(set(existing['g']) | set(g))
            continue
        places.append({'id': pid, 'n': n, 's': st, 't': t, 'r': reg,
                       'k': 5 if i < 8 else 4, 'la': la, 'ln': ln, 'g': g})

    # garantizar nombres del catalogo viejo (migracion found)
    out = 'window.PLACES=' + json.dumps(places, ensure_ascii=False, separators=(',', ':')) + ';\n'
    OUT.write_text(out, encoding='utf-8')
    tiers = [sum(1 for p in places if p['k'] == k) for k in range(6)]
    print(f'{len(places)} lugares -> {OUT.name} ({OUT.stat().st_size//1024}KB) tiers={tiers}')


if __name__ == '__main__':
    main()
