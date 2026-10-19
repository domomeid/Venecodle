/* logic.js — lógica pura de Venecodle compartida por index.html y test.html.
   Sin DOM, sin localStorage. Expone window.VL (o globalThis.VL en node). */
(function (G) {
'use strict';

var TIERS = [
 {n:'Común',p:.52,ep:10,c:'var(--r0)'},{n:'Poco común',p:.26,ep:25,c:'var(--r1)'},
 {n:'Raro',p:.13,ep:60,c:'var(--r2)'},{n:'Épico',p:.06,ep:150,c:'var(--r3)'},
 {n:'Anomalía',p:.025,ep:400,c:'var(--r4)'},{n:'Mítico',p:.005,ep:1000,c:'var(--r5)'}];
var REG = {Ce:'Centro',Oc:'Occidente',Or:'Oriente',An:'Andes',Ll:'Llanos',Gu:'Guayana',In:'Insular'};
var TYPE = {E:'Estado',C:'Ciudad',P:'Pueblo'};
var TERRAIN = {
 costero:{n:'Costero',ep:15}, insular:{n:'Insular',ep:15}, andino:{n:'Andino',ep:20},
 selva:{n:'Selvático',ep:20}, llano:{n:'Llanero',ep:15}};

var PLACES = G.PLACES || [];
var BYTIER = [[],[],[],[],[],[]], BYID = {}, NAME2PLACES = {};
PLACES.forEach(function (p) {
 BYTIER[p.k].push(p); BYID[p.id] = p;
 (NAME2PLACES[p.n] = NAME2PLACES[p.n] || []).push(p);
});
var HOMONYMS = {}; Object.keys(NAME2PLACES).forEach(function (n) {
 if (NAME2PLACES[n].length > 1) HOMONYMS[n] = 1;
});

function norm(s) {return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();}
function displayName(p) {return HOMONYMS[p.n] ? p.n + ' (' + p.s + ')' : p.n;}

var BADGES = [
 {id:'tilde',n:'Con tilde',ep:10,f:function(p){return /[áéíóú]/i.test(p.n);}},
 {id:'puerto',n:'Puerto',ep:15,f:function(p){return /^puerto\b/i.test(p.n);}},
 {id:'santo',n:'Santoral',ep:15,f:function(p){return /^san(ta|to)?\b/i.test(p.n);}},
 {id:'agua',n:'Con agua',ep:15,f:function(p){return /puerto|cayo|isla|rio|salto|coche|roques/i.test(norm(p.n));}},
 {id:'doble',n:'Letra doble',ep:20,f:function(p){return /(.)\1/.test(norm(p.n).replace(/[^a-z]/g,''));}},
 {id:'corto',n:'Pocas letras',ep:30,f:function(p){return norm(p.n).replace(/[^a-z]/g,'').length<=5;}},
 {id:'largo',n:'Nombre kilométrico',ep:30,f:function(p){return norm(p.n).replace(/[^a-z]/g,'').length>=15;}},
 {id:'mono',n:'Monovocal',ep:35,f:function(p){var v=norm(p.n).replace(/[^aeiou]/g,'');return v.length>0&&new Set(v.split('')).size===1;}},
 {id:'espejo',n:'Espejo',ep:40,f:function(p){var l=norm(p.n).replace(/[^a-z]/g,'');return l[0]===l[l.length-1];}},
 {id:'dier',n:'Diéresis',ep:40,f:function(p){return /ü/i.test(p.n);}},
 {id:'comp',n:'Compuesto',ep:10,f:function(p){return /[ -]/.test(p.n.trim());}},
 {id:'arti',n:'Con artículo',ep:10,f:function(p){return /^(el|la|los|las)\b/i.test(p.n);}},
 {id:'rara',n:'Letra rara',ep:15,f:function(p){return /[qx]/i.test(norm(p.n));}},
 {id:'palin',n:'Palíndromo',ep:35,f:function(p){var l=norm(p.n).replace(/[^a-z]/g,'');return l.length>=4&&l===l.split('').reverse().join('');}}];

function evalPlace(p) {
 var b = [{n:'Región '+REG[p.r], ep:5}];
 BADGES.forEach(function (x) {if (x.f(p)) b.push({n:x.n, ep:x.ep});});
 (p.g || []).forEach(function (g) {if (TERRAIN[g]) b.push({n:TERRAIN[g].n, ep:TERRAIN[g].ep});});
 var ep = TIERS[p.k].ep; b.forEach(function (x) {ep += x.ep;});
 return {b:b, ep:ep};
}

function hav(a, b) {
 var R = 6371, r = Math.PI/180;
 var dLa = (b.la-a.la)*r, dLn = (b.ln-a.ln)*r;
 var s = Math.sin(dLa/2)*Math.sin(dLa/2) +
         Math.cos(a.la*r)*Math.cos(b.la*r)*Math.sin(dLn/2)*Math.sin(dLn/2);
 return 2*R*Math.asin(Math.sqrt(s));
}

/* ponytail: NN greedy O(n²), n=5 — suficiente; subir a 2-opt si algún día duele la vista */
function orderRoute(stops) {
 if (stops.length < 3) return stops.slice();
 var left = stops.slice(1), route = [stops[0]];
 while (left.length) {
  var last = BYID[route[route.length-1].id] || route[route.length-1];
  var bi = 0, bd = Infinity;
  for (var i = 0; i < left.length; i++) {
   var p = BYID[left[i].id] || left[i];
   var d = hav(last, p);
   if (d < bd) {bd = d; bi = i;}
  }
  route.push(left.splice(bi, 1)[0]);
 }
 return route;
}

function pickStops(n, rnd) {
 var used = {}, out = [];
 while (out.length < n) {
  var r = rnd(), c = 0, k = 0;
  for (; k < TIERS.length-1; k++) {c += TIERS[k].p; if (r < c) break;}
  var l = BYTIER[k], p = l[Math.floor(rnd()*l.length)];
  if (!used[p.id]) {used[p.id] = 1; out.push(p);}
 }
 return out;
}

function evalRoute(stops) {
 var places = stops.map(function (s) {return BYID[s.id] || s;});
 var km = 0, leg = 0, regs = {}, tags = {};
 for (var i = 0; i < places.length; i++) {
  regs[places[i].r] = 1;
  (places[i].g || []).forEach(function (g) {tags[g] = 1;});
  if (i) {var d = hav(places[i-1], places[i]); km += d; if (d > leg) leg = d;}
 }
 km = Math.round(km); leg = Math.round(leg);
 var rb = [{n:km+' km recorridos', ep:km>800?50:(km>300?25:10)}];
 if (leg > 300) rb.push({n:'Tramo largo: '+leg+' km', ep:20});
 var nr = Object.keys(regs).length;
 if (nr >= 3) rb.push({n:'Cruza '+nr+' regiones', ep:25});
 if (tags.costero && tags.andino) rb.push({n:'De la playa a los Andes', ep:30});
 if (tags.selva && tags.costero) rb.push({n:'De la selva al mar', ep:30});
 if (tags.insular) rb.push({n:'Escapada insular', ep:15});
 return rb;
}

/* poema del viaje: cada badge aporta palabras al pool; el usuario compone */
var POEM_WORDS = {
 'Región Centro':['el centro','la capital','los buses'],
 'Región Occidente':['el occidente','la tarde','el zulia'],
 'Región Oriente':['el oriente','el amanecer','el río'],
 'Región Andes':['los andes','la niebla','el frío'],
 'Región Llanos':['los llanos','el horizonte','la resolana'],
 'Región Guayana':['la guayana','el tepuy','el oro'],
 'Región Insular':['la isla','la marea','el faro'],
 'Con tilde':['acento','tildada','sonora'],
 'Puerto':['el puerto','los barcos','la bahía'],
 'Santoral':['santa','bendita','la iglesia'],
 'Con agua':['el agua','la corriente','nadar'],
 'Letra doble':['gemela','eco','repetida'],
 'Pocas letras':['breve','mini','corta'],
 'Nombre kilométrico':['eterna','interminable','kilométrica'],
 'Monovocal':['monótona','una sola vocal','canto'],
 'Espejo':['espejo','reversible','reflejo'],
 'Diéresis':['trémula','diéresis'],
 'Compuesto':['compuesta','dos nombres','el guion'],
 'Con artículo':['el','la','articulada'],
 'Letra rara':['equis','extraña','rara'],
 'Palíndromo':['circular','palíndroma','ida y vuelta'],
 'Costero':['la sal','la arena','la ola','la playa'],
 'Insular':['náufraga','el coral','la isla'],
 'Andino':['el páramo','la cumbre','la montaña'],
 'Selvático':['la selva','el verde hondo','la canoa'],
 'Llanero':['el llano','el hato','la cola']};
function stopsName(st){var p=st.id&&BYID[st.id];return p?displayName(p):st.n;}
function wordPool(roll){
 var pool=[];
 function add(w){if(pool.indexOf(w)<0)pool.push(w);}
 roll.stops.forEach(function(st){
  st.b.forEach(function(x){(POEM_WORDS[x.n]||[]).forEach(add);});
  add(stopsName(st));
 });
 (roll.rb||[]).forEach(function(x){
  if(/km recorridos/.test(x.n))['kilómetros','leguas','asfalto'].forEach(add);
  if(/Tramo largo/.test(x.n))['galope','la recta larga'].forEach(add);
  if(/regiones/.test(x.n))['fronteras','los cruces'].forEach(add);
  if(/playa a los Andes|selva al mar/.test(x.n))['del mar a la montaña'].forEach(add);
  if(/insular/.test(x.n))['por barco'].forEach(add);
 });
 return pool;
}
function poem(roll){
 var words=[];
 roll.stops.forEach(function(st){st.b.forEach(function(x){
  var ws=POEM_WORDS[x.n];if(ws&&words.indexOf(ws[0])<0)words.push(ws[0]);});});
 var n1=stopsName(roll.stops[0]),n5=stopsName(roll.stops[roll.stops.length-1]);
 var w1=words[0]||'tierra adentro',w2=words[1]||words[0]||'sin destino';
 return 'De '+n1+' salió el azar,\npor '+w1+' y '+w2+' sin parar,\nhasta '+n5+' llegó a soñar.';
}

/* migración v1 -> v2 (in-place sobre el objeto cargado) */
function migrate(o) {
 if (!o || o.v === 2 || !o.rolls) return o;
 var name2id = {}, ambig = {};
 Object.keys(NAME2PLACES).forEach(function (n) {
  if (NAME2PLACES[n].length === 1) name2id[n] = NAME2PLACES[n][0].id;
  else ambig[n] = NAME2PLACES[n][0].id; // homónimo: primer match, best-effort
 });
 var found = {};
 Object.keys(o.found || {}).forEach(function (n) {
  var id = name2id[n] || ambig[n];
  if (id) found[id] = o.found[n];
 });
 o.found = found;
 o.rolls = o.rolls.map(function (r) {
  var id = name2id[r.n] || ambig[r.n] || null;
  var p = id ? BYID[id] : null;
  return {d:r.d, stops:[{id:id, n:r.n, s:p?p.s:'', k:r.t, t:p?p.t:'C', ep:r.ep, b:r.b||[]}], rb:[], ep:r.ep};
 });
 o.v = 2;
 return o;
}

G.VL = {
 TIERS:TIERS, REG:REG, TYPE:TYPE, TERRAIN:TERRAIN,
 PLACES:PLACES, BYTIER:BYTIER, BYID:BYID, NAME2PLACES:NAME2PLACES, HOMONYMS:HOMONYMS,
 norm:norm, displayName:displayName, BADGES:BADGES, evalPlace:evalPlace,
 hav:hav, orderRoute:orderRoute, pickStops:pickStops, evalRoute:evalRoute, migrate:migrate, poem:poem, wordPool:wordPool
};
})(typeof window !== 'undefined' ? window : globalThis);
