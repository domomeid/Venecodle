/* logic.js — lógica pura de Venecodle compartida por index.html y test.html.
   Sin DOM, sin localStorage. Expone window.VL (o globalThis.VL en node). */
(function (G) {
'use strict';

var TIERS = [
 {n:'Común',p:.515,ep:100,c:'var(--r0)'},{n:'Poco común',p:.26,ep:250,c:'var(--r1)'},
 {n:'Raro',p:.13,ep:600,c:'var(--r2)'},{n:'Épico',p:.06,ep:1500,c:'var(--r3)'},
 {n:'Anomalía',p:.025,ep:4000,c:'var(--r4)'},{n:'Mítico',p:.005,ep:10000,c:'var(--r5)'},
 {n:'Legendario',p:.001,ep:25000,c:'#d4a017'},{n:'Basura',p:.004,ep:10,c:'#795548'}];
var REG = {Ce:'Centro',Oc:'Occidente',Or:'Oriente',An:'Andes',Ll:'Llanos',Gu:'Guayana',In:'Insular'};
var TYPE = {E:'Estado',M:'Municipio',C:'Ciudad',P:'Pueblo',B:'Playa',F:'Salto',K:'Pico',I:'Isla',G:'Lago',R:'Parque',N:'Accidente'};
var TERRAIN = {
 costero:{n:'Costero',ep:150}, insular:{n:'Insular',ep:150}, andino:{n:'Andino',ep:200},
 selva:{n:'Selvático',ep:200}, llano:{n:'Llanero',ep:150}};

var PLACES = G.PLACES || [];
var BYTIER = TIERS.map(function(){return[];}), BYID = {}, NAME2PLACES = {};
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
 {id:'tilde',n:'Con tilde',ep:100,d:'El nombre lleva acento ortográfico',f:function(p){return /[áéíóú]/i.test(p.n);}},
 {id:'puerto',n:'Puerto',ep:150,d:'Empieza por “Puerto”',f:function(p){return /^puerto\b/i.test(p.n);}},
 {id:'santo',n:'Santoral',ep:150,d:'Empieza por San, Santa o Santo',f:function(p){return /^san(ta|to)?\b/i.test(p.n);}},
 {id:'agua',n:'Con agua',ep:150,d:'Su nombre evoca el agua: puerto, cayo, isla, río, salto…',f:function(p){return /puerto|cayo|isla|rio|salto|coche|roques/i.test(norm(p.n));}},
 {id:'doble',n:'Letra doble',ep:200,d:'Tiene una letra repetida dos veces seguidas',f:function(p){return /(.)\1/.test(norm(p.n).replace(/[^a-z]/g,''));}},
 {id:'corto',n:'Pocas letras',ep:300,d:'Nombre de 5 letras o menos',f:function(p){return norm(p.n).replace(/[^a-z]/g,'').length<=5;}},
 {id:'largo',n:'Nombre kilométrico',ep:300,d:'Nombre de 15 letras o más',f:function(p){return norm(p.n).replace(/[^a-z]/g,'').length>=15;}},
 {id:'mono',n:'Monovocal',ep:350,d:'Usa una sola vocal distinta',f:function(p){var v=norm(p.n).replace(/[^aeiou]/g,'');return v.length>0&&new Set(v.split('')).size===1;}},
 {id:'espejo',n:'Espejo',ep:400,d:'Empieza y termina con la misma letra',f:function(p){var l=norm(p.n).replace(/[^a-z]/g,'');return l[0]===l[l.length-1];}},
 {id:'dier',n:'Diéresis',ep:400,d:'Tiene una ü con diéresis',f:function(p){return /ü/i.test(p.n);}},
 {id:'comp',n:'Compuesto',ep:100,d:'Nombre de dos o más palabras',f:function(p){return /[ -]/.test(p.n.trim());}},
 {id:'arti',n:'Con artículo',ep:100,d:'Empieza por El, La, Los o Las',f:function(p){return /^(el|la|los|las)\b/i.test(p.n);}},
 {id:'rara',n:'Letra rara',ep:150,d:'Contiene Q o X',f:function(p){return /[qx]/i.test(norm(p.n));}},
 {id:'palin',n:'Palíndromo',ep:350,d:'Se lee igual al derecho y al revés',f:function(p){var l=norm(p.n).replace(/[^a-z]/g,'');return l.length>=4&&l===l.split('').reverse().join('');}},
 {id:'chiq',n:'Pueblo chiquito',ep:150,d:'Menos de 500 habitantes',f:function(p){return p.p>0&&p.p<500;}},
 {id:'techo',n:'Techo de Venezuela',ep:250,d:'A más de 3.000 metros sobre el nivel del mar',f:function(p){return p.e>=3000;}},
 {id:'front',n:'Fronterizo',ep:150,d:'Está en un estado fronterizo',f:function(p){return /^(Zulia|Táchira|Apure|Amazonas|Bolívar)$/.test(p.s);}},
 {id:'mcpio',n:'Municipio',ep:50,d:'Es una división municipal, no un poblado',f:function(p){return p.t==='M';}},
 {id:'triple',n:'Triple letra',ep:200,d:'Tiene una letra tres veces seguidas',f:function(p){return /(.)\1\1/.test(norm(p.n).replace(/[^a-z]/g,''));}},
 {id:'metro',n:'Metrópoli',ep:100,d:'Medio millón de habitantes o más',f:function(p){return p.p>=500000;}},
 {id:'venez',n:'Venezolanismo',ep:150,d:'Su nombre ya es venezolanismo cotidiano',f:function(p){var pw=G.POOL_WORDS||[];return pw.indexOf(norm(p.n))>=0||pw.indexOf(p.n.toLowerCase())>=0;}}];

function evalPlace(p) {
 var b = [{n:'Región '+REG[p.r], ep:50}];
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

/* paradas por roll: menos = mas raro y mas puntoso (ver LEG_BONUS en evalRoute) */
var LEGS=[[5,.55],[4,.22],[3,.13],[2,.07],[1,.03]];
var LEG_BONUS={4:400,3:1200,2:3000,1:8000};
var LEG_NAME={4:'Ruta ligera',3:'Ruta corta',2:'Dúo de paradas',1:'¡Salto único!'};
function pickLegs(rnd){
 var r=rnd(),c=0;
 for(var i=0;i<LEGS.length;i++){c+=LEGS[i][1];if(r<c)return LEGS[i][0];}
 return 5;
}
function pickStops(n, rnd) {
 var used = {}, out = [];
 while (out.length < n) {
  var r = rnd(), c = 0, k = 0;
  for (; k < TIERS.length-1; k++) {c += TIERS[k].p; if (r < c) break;}
  var l = BYTIER[k]; if (!l.length) continue;
  var p = l[Math.floor(rnd()*l.length)];
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
 var rb = [{n:km+' km recorridos', ep:km>800?500:(km>300?250:100)}];
 if (leg > 300) rb.push({n:'Tramo largo: '+leg+' km', ep:200});
 var nr = Object.keys(regs).length;
 if (nr >= 3) rb.push({n:'Cruza '+nr+' regiones', ep:250});
 if (stops.length < 5) rb.push({n:LEG_NAME[stops.length]+' ('+stops.length+' parada'+(stops.length>1?'s':'')+')', ep:LEG_BONUS[stops.length]||0});
 if (tags.costero && tags.andino) rb.push({n:'De la playa a los Andes', ep:300});
 if (tags.selva && tags.costero) rb.push({n:'De la selva al mar', ep:300});
 if (tags.insular) rb.push({n:'Escapada insular', ep:150});
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
 'Con tilde':['acento','tildada','sonora',','],
 'Puerto':['el puerto','los barcos','la bahía'],
 'Santoral':['santa','bendita','la iglesia','amén'],
 'Con agua':['el agua','la corriente','nadar'],
 'Letra doble':['gemela','eco','repetida','—'],
 'Pocas letras':['breve','mini','corta','.'],
 'Nombre kilométrico':['eterna','interminable','kilométrica','!'],
 'Monovocal':['monótona','una sola vocal','canto'],
 'Espejo':['espejo','reversible','reflejo','…'],
 'Diéresis':['trémula','diéresis','ü'],
 'Compuesto':['compuesta','dos nombres','-','y'],
 'Con artículo':['el','la','los','las','un','una'],
 'Letra rara':['equis','extraña','rara','?'],
 'Palíndromo':['circular','palíndroma','ida y vuelta','¡'],
 'Pueblo chiquito':['aldeíta','rincón','cuatro casas'],
 'Techo de Venezuela':['el vértigo','el cielo cerca','la altura'],
 'Fronterizo':['la frontera','el límite','dos patrias'],
 'Municipio':['la alcaldía','el municipio'],
 'Triple letra':['trilliza','tres por tres'],
 'Metrópoli':['la urbe','el hormiguero'],
 'Venezolanismo':['criollísima','sabor propio','de aquí mismo'],
 'Costero':['la sal','la arena','la ola','la playa'],
 'Insular':['náufraga','el coral','la isla'],
 'Andino':['el páramo','la cumbre','la montaña'],
 'Selvático':['la selva','el verde hondo','la canoa'],
 'Llanero':['el llano','el hato','la cola']};
function stopsName(st){var p=st.id&&BYID[st.id];return p?displayName(p):st.n;}
/* pegamento base: sin conectores ningún verso cuaja; la puntuación es bonus de badges */
var POEM_GLUE = ['el','la','los','las','de','en','y','con','sin','un','una','hacia',
                 'que','por','para','muy','donde','cuando','bajo','sobre','entre','del','al'];
var POEM_MAX = 10;
function wordGroups(roll){
 var groups=[];
 function grp(src){var g={src:src,ws:[]};groups.push(g);return g;}
 function put(g,w){if(g.ws.indexOf(w)<0)g.ws.push(w);}
 var glue=grp('Conectores');POEM_GLUE.forEach(function(w){put(glue,w);});
 var gex=grp('Extras'),gsg=grp('Signos');
 var punct=/^[,.;:!?—\-…¡¿]$/;
 roll.stops.forEach(function(st){
  var gp=grp(stopsName(st));
  put(gp,stopsName(st));
  var p=st.id&&BYID[st.id];
  if(p&&G.PLACE_WORDS&&G.PLACE_WORDS[p.n])(G.PLACE_WORDS[p.n]).forEach(function(w){put(gex,w);});
  st.b.forEach(function(x){
   var ws=POEM_WORDS[x.n];if(!ws)return;
   var gb=grp(x.n);
   ws.forEach(function(w){punct.test(w)?put(gsg,w):put(gb,w);});
  });
 });
 var gr=grp('Ruta');
 (roll.rb||[]).forEach(function(x){
  if(/km recorridos/.test(x.n))['kilómetros','leguas','asfalto'].forEach(function(w){put(gr,w);});
  if(/Tramo largo/.test(x.n))['galope','la recta larga'].forEach(function(w){put(gr,w);});
  if(/regiones/.test(x.n))['fronteras','los cruces'].forEach(function(w){put(gr,w);});
  if(/playa a los Andes|selva al mar/.test(x.n))['del mar a la montaña'].forEach(function(w){put(gr,w);});
  if(/insular/.test(x.n))['por barco'].forEach(function(w){put(gr,w);});
 });
 /* venezolanismos custom: 1 por cada 1000 EP del roll, determinista por sorteo */
 var vw=G.POOL_WORDS||[];
 if(vw.length&&roll.ep>=1000){
  var n=Math.min(10,Math.floor(roll.ep/1000));
  var seed=roll.ep+roll.stops.reduce(function(a,s){return a+(s.id||0);},0);
  for(var i=0;i<n;i++)put(gex,vw[(seed+i*37)%vw.length]);
 }
 /* orden: conectores/paradas/badges/ruta, luego Extras, Signos siempre al final */
 return groups.filter(function(g){return g.ws.length&&g!==gex&&g!==gsg;})
  .concat(gex.ws.length?[gex]:[],gsg.ws.length?[gsg]:[]);
}
function wordPool(roll){
 var pool=[];
 wordGroups(roll).forEach(function(g){g.ws.forEach(function(w){if(pool.indexOf(w)<0)pool.push(w);});});
 return pool;
}
/* une el verso pegando la puntuación al vecino correcto: "sal , playa" -> "sal, playa" */
function versify(ws){
 var s='';
 ws.forEach(function(w){
  if(/^[,.;:!?—\-…]$/.test(w)) s=s.trimEnd()+w+' ';
  else if(/^[¡¿]$/.test(w)) s=s+w;
  else s+=w+' ';
 });
 return s.trim();
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
 if (!o || o.v === 3 || !o.rolls) return o;
 if (o.v === 2) {o.ep = (o.ep || 0) * 10; o.v = 3; return o;} /* rescale EP x10 */
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
  return {d:r.d, stops:[{id:id, n:r.n, s:p?p.s:'', k:r.t, t:p?p.t:'C', ep:r.ep*10, b:r.b||[]}], rb:[], ep:r.ep*10};
 });
 o.ep = (o.ep || 0) * 10;
 o.v = 3;
 return o;
}

/* rareza del roll por percentiles de la distribucion teorica (sim Monte Carlo
   200k sorteos): p99.9~29k, p99~15k, p97~11k, p95~9k, p80~6k.
   Sin backend: el "TOP x%" es contra la curva del juego, no un leaderboard. */
/* rareza por percentil (bandas tipo rngdle): Basura <p1, Comun <p50,
   Poco comun <p75, Raro <p90, Epico <p95, Anomalia <p99, Mitico >=p99.
   Legendario queda reservado para Petare en ruta. */
var RARN = [[1,'Basura'],[50,'Común'],[75,'Poco común'],[90,'Raro'],[95,'Épico'],[99,'Anomalía'],[101,'Mítico']];
/* curva EP->percentil del Monte Carlo 200k: pares (pct, ep) con cola refinada */
var EPQP = [0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,91,92,93,94,95,96,97,98,99,99.5,99.9,100];
var EPQ = [1300,2900,3150,3350,3550,3700,3850,4000,4150,4300,4500,4700,4900,5100,5400,5800,6350,7200,8250,8400,8550,8700,8900,9250,9800,11450,13600,15100,18750,29950,40650];
function rollPct(ep) {
 if (ep <= EPQ[0]) return 0;
 for (var i = 0; i < EPQ.length-1; i++) if (ep < EPQ[i+1])
  return EPQP[i] + (ep-EPQ[i])/(EPQ[i+1]-EPQ[i]) * (EPQP[i+1]-EPQP[i]);
 return 100;
}
function rollRarity(roll) {
 var ks = roll.stops.map(function (s) {return s.k;});
 if (ks.indexOf(6) >= 0) return {n:'Legendario', pct:99.9}; /* Petare en ruta */
 if (ks.indexOf(7) >= 0) return {n:'Basura', pct:0.5};      /* Guarenas en ruta */
 var p = Math.round(rollPct(roll.ep || 0) * 10) / 10;
 for (var i = 0; i < RARN.length; i++) if (p < RARN[i][0]) return {n:RARN[i][1], pct:p};
 return {n:'Mítico', pct:p};
}

G.VL = {
 TIERS:TIERS, REG:REG, TYPE:TYPE, TERRAIN:TERRAIN,
 PLACES:PLACES, BYTIER:BYTIER, BYID:BYID, NAME2PLACES:NAME2PLACES, HOMONYMS:HOMONYMS,
 norm:norm, displayName:displayName, BADGES:BADGES, evalPlace:evalPlace, rollRarity:rollRarity, rollPct:rollPct,
 hav:hav, orderRoute:orderRoute, pickStops:pickStops, pickLegs:pickLegs, LEGS:LEGS, LEG_BONUS:LEG_BONUS, evalRoute:evalRoute, migrate:migrate, poem:poem, wordPool:wordPool, wordGroups:wordGroups, versify:versify, POEM_MAX:POEM_MAX
};
})(typeof window !== 'undefined' ? window : globalThis);
