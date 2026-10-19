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
