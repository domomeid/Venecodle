/* test.js — asserts de lógica pura. Corre en node (`node test.js`) y en test.html. */
(function (G) {
if (typeof window === 'undefined') { G.window = G; require('./places.js'); require('./custom.js'); require('./logic.js'); }
var VL = G.VL, fails = 0, pass = 0;
function ok(cond, name) {
 if (cond) { pass++; log('PASS ' + name); }
 else { fails++; log('FAIL ' + name); }
}
function log(s) {
 if (typeof document !== 'undefined') {
  var li = document.createElement('li'); li.textContent = s;
  if (s.indexOf('FAIL') === 0) li.style.color = 'red';
  document.getElementById('out').appendChild(li);
 } else console.log(s);
}
function approx(a, b, tol) { return Math.abs(a - b) <= tol; }
function seq(seed) { var x = seed; return function () { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; }

ok(VL.PLACES.length >= 2000, 'catalogo >=2000 (' + VL.PLACES.length + ')');
ok(VL.PLACES.every(function (p) { return p.la > 0.5 && p.la < 12.3 && p.ln < -59.7 && p.ln > -73.5; }), 'coords dentro de Venezuela');
/* el wipe es solo la ciudad: el lago y demas lugares "Maracaibo" si entran */
ok(!VL.PLACES.some(function (p) { return p.n === 'Maracaibo'; }), 'Maracaibo (ciudad) fuera del catalogo');
ok(VL.PLACES.some(function (p) { return p.n === 'Lago de Maracaibo'; }), 'Lago de Maracaibo presente');
ok(VL.PLACES.some(function (p) { return p.n === 'Petare' && p.k === 6; }), 'Petare Legendario (k=6)');
ok(VL.PLACES.some(function (p) { return p.n === 'Guarenas' && p.k === 7; }), 'Guarenas Basura (k=7)');
ok(VL.PLACES.some(function (p) { return p.n === 'Socopó'; }), 'Socopo presente');
ok(VL.PLACES.some(function (p) { return p.t === 'M'; }) && VL.PLACES.some(function (p) { return p.t === 'B'; }), 'municipios y playas en catalogo');

var ccs = VL.PLACES.filter(function (p) { return p.n === 'Caracas'; })[0];
var val = VL.PLACES.filter(function (p) { return p.n === 'Valencia'; })[0];
ok(approx(VL.hav(ccs, val), 125, 15), 'haversine Caracas-Valencia ~125km (' + Math.round(VL.hav(ccs, val)) + ')');

// orderRoute: ruta A,B,C,D con B al lado de A pero C al final mas cerca de A
var A = {id:1, n:'A', la:10, ln:-66}, B = {id:2, n:'B', la:10.1, ln:-66.05}, C = {id:3, n:'C', la:12, ln:-70}, D = {id:4, n:'D', la:11, ln:-68};
var route = VL.orderRoute([A, D, C, B]);
ok(route.map(function (s) {return s.n;}).join('') === 'ABDC', 'orderRoute NN ordena A-B-D-C (' + route.map(function (s) {return s.n;}).join(',') + ')');

var picks = VL.pickStops(5, seq(42));
ok(picks.length === 5 && new Set(picks.map(function (p) {return p.id;})).size === 5, 'pickStops devuelve 5 ids unicos');

var v1 = {rolls:[{d:'2026-10-18',n:'Caracas',t:0,ep:65,b:[]}],found:{Caracas:2},ep:65,streak:1,last:'2026-10-18',unl:false};
var m = VL.migrate(JSON.parse(JSON.stringify(v1)));
ok(m.v === 2 && m.found[ccs.id] === 2 && m.rolls[0].stops[0].id === ccs.id, 'migracion v1->v2 found+rolls');
ok(VL.migrate(m).found[ccs.id] === 2, 'migracion idempotente');

var rb = VL.evalRoute([{id:ccs.id},{id:val.id}]);
ok(rb.length >= 1 && /km recorridos/.test(rb[0].n), 'evalRoute badge de km');
var choroni = VL.PLACES.filter(function (p) {return p.n === 'Choroní';})[0];
var mucu = VL.PLACES.filter(function (p) {return p.n === 'Mucuchíes';})[0];
var rb2 = VL.evalRoute([{id:choroni.id},{id:mucu.id}]);
ok(rb2.some(function (b) {return b.n === 'De la playa a los Andes';}), 'combo costa+andino');
ok((choroni.g || []).indexOf('costero') >= 0, 'Choroni taggeado costero');

var res = VL.evalPlace(VL.PLACES.filter(function (p) {return p.n === 'Cumaná';})[0]);
ok(res.b.some(function (b) {return b.n === 'Con tilde';}) && res.ep > VL.TIERS[0].ep, 'evalPlace badges+ep');

// multi-ruta mismo dia no se pisa (found por id acumula)
var S = {found:{}};
VL.pickStops(5, seq(7)).forEach(function (p) {S.found[p.id] = (S.found[p.id] || 0) + 1;});
VL.pickStops(5, seq(8)).forEach(function (p) {S.found[p.id] = (S.found[p.id] || 0) + 1;});
ok(Object.keys(S.found).length > 0, 'found acumula por id en 2 rutas');

// poema del viaje
var roll = {stops:[{id:ccs.id,b:[{n:'Región Centro',ep:5},{n:'Con tilde',ep:10}]},{id:val.id,b:[{n:'Costero',ep:15}]}]};
var po = VL.poem(roll);
ok(po.split('\n').length === 3 && po.indexOf('Caracas') >= 0 && po.indexOf('Valencia') >= 0 && /acento|la sal/.test(po), 'poema 3 versos con extremos y palabras de badges');
var pool = VL.wordPool(roll);
ok(pool.indexOf('acento') >= 0 && pool.indexOf('la sal') >= 0 && pool.indexOf('Caracas') >= 0 && pool.length === new Set(pool).size, 'wordPool incluye palabras de badges + nombres, sin dups');
ok(pool.indexOf('de') >= 0 && pool.indexOf(',') >= 0, 'pool trae conectores base + puntuación de badge');
ok(VL.versify(['la','sal',',','la','playa','!']) === 'la sal, la playa!', 'versify pega la puntuación');
ok(VL.POEM_MAX === 10, 'limite 10 palabras');
var rollChoroni = {stops: [{id: 9000007, n: 'Choroní', s: 'Aragua', k: 5, t: 'P', ep: 0, b: []}], rb: []};
ok(VL.wordPool(rollChoroni).indexOf('el cacao') >= 0, 'palabra custom de custom.js en el pool');

if (typeof document !== 'undefined') {
 document.title = fails ? 'FAIL ' + fails : 'ALL PASS';
 var h = document.getElementById('res');
 h.textContent = fails ? fails + ' FAILURES' : 'TODO PASS (' + pass + ')';
 h.style.color = fails ? 'red' : 'green';
} else {
 console.log(fails ? fails + ' FAILURES' : 'TODO PASS (' + pass + ')');
 process.exit(fails ? 1 : 0);
}
})(typeof window !== 'undefined' ? window : globalThis);
