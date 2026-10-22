/* custom.js — archivo editable a mano para quien cura el juego.

   Palabras extra que un lugar aporta al pool del poema cuando sale como
   parada. Una línea por lugar, con el nombre EXACTO como sale en el juego:

     'Nombre del Lugar':['palabra','otra palabra','frase corta'],

   - Respeta tildes y mayúsculas del nombre.
   - Palabras cortas funcionan mejor (el verso tiene límite de 10 palabras).
   - Para agregar un LUGAR nuevo (no palabras), se edita MANUAL en
     tools/gen_places.py y se corre `python tools/gen_places.py`.
*/
window.PLACE_WORDS={
 'Choroní':['el cacao','la bahía escondida'],
 'Canaima':['la laguna','el tepuy dormido'],
 'Colonia Tovar':['las fresas','el acordeón'],
 'Los Roques':['la langosta','el cayo blanco'],
 'Petare':['el cerro','la escalera'],
 'Guarenas':['la cola','el tranque'],
};

/* POOL_WORDS — venezolanismos que entran al pool del poema como bonus:
   1 palabra por cada 100 EP del roll (tope 8), elegidas fijas por sorteo.
   Agregar o quitar palabras: una entre comillas por línea. */
window.POOL_WORDS=[
 'pana','chévere','chamo','coroto','guayoyo','arepa','cachapa','pepito',
 'cambur','cotufa','chicha','bochinche','bonche','bululú','catire','cepillado',
 'franela','camionetica','vaina','pavoso','mamerao','chuleta','tigre','arrocero',
 'bala fría','mingo','furruco','cuatro','tambor','mapora','cumaco','galerón',
 'chinchorro','caimán','morrillo','topocho','mandoca','tequeño','hallaca','toston',
 'sancocho','guasacaca','papelón','tizana','frescolita','malta','toddy','hervido',
 'chigüire','lapa','zamuro','turpial','tonina','cachicamo','baba','caribe',
 'macundales','cacique','cimarrón','quemaíto','araguaney','orquídea','morocoy',
 'warao','maguare','curiara','majagua','cuji','samán','apamate','jobo',
];
