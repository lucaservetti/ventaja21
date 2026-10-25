// Ruta de conteo para principiantes: 10 niveles que se desbloquean al aprobar el anterior.
// Cada nivel usa uno de los ejercicios (pantallas) con una configuración fija y una nota para aprobar.

const COUNT_LEVELS = [
  {
    n: 1,
    id: "values",
    title: "Valores de las cartas",
    sub: "Cuánto vale cada carta en Hi-Lo",
    tips: [
      "Tres grupos: **bajas (2 a 6) valen +1**, **neutras (7, 8 y 9) valen 0** y **altas (10, J, Q, K y As) valen −1**.",
      "No pienses en el número de la carta: pensá en su grupo.",
    ],
    help: "Cada botón te muestra qué cartas van en él.",
    what: "Te mostramos una carta por vez y tocás cuánto vale: +1, 0 o −1. Sin reloj.",
    goal: "Acertá 11 de 12 cartas.",
    screen: "drillValues",
    count: 12,
    pass: 11,
    lesson: "l17",
  },
  {
    n: 2,
    id: "pairs",
    title: "Cancelar de a pares",
    sub: "Una alta y una baja juntas suman 0",
    tips: [
      "Una alta y una baja juntas suman 0: se cancelan.",
      "Dos bajas suman +2 y dos altas −2. Si una es neutra, solo cuenta la otra.",
    ],
    help: "Ves el valor de cada carta antes de responder.",
    what: "Salen dos cartas juntas y decís cuánto suman entre las dos. Así aprendés a cancelar una alta con una baja sin sumar carta por carta.",
    goal: "Acertá 9 de 10 pares.",
    screen: "drillPairs",
    count: 10,
    pass: 9,
    lesson: "l18",
  },
  {
    n: 3,
    id: "run10",
    title: "10 cartas, lento",
    sub: "Tu primer conteo corrido (running count)",
    tips: [
      "Arrancá en 0 y cambiá el número después de cada carta.",
      "Decilo en voz baja: «uno, dos, uno, uno…».",
    ],
    help: "Cada carta muestra su valor y ves el conteo mientras caen. Podés ocultarlo para probarte.",
    what: "Caen 10 cartas, de a una y despacio. Al final escribís el conteo corrido: la suma de todas.",
    goal: "Decí el conteo exacto.",
    screen: "drillRunning",
    cards: 10,
    speed: "relaxed",
    mode: "single",
  },
  {
    n: 4,
    id: "run20",
    title: "20 cartas",
    sub: "El doble de cartas, a ritmo normal",
    tips: [
      "Si ves una alta y una baja seguidas, se cancelan: no toques el número.",
      "Si te perdés, no frenes: seguí desde el último número que tenías.",
    ],
    help: "Cada carta muestra su valor y ves el conteo mientras caen. Podés ocultarlo para probarte.",
    what: "Ahora son 20 cartas, una por segundo. Cancelá de a pares mientras caen.",
    goal: "Decí el conteo exacto.",
    screen: "drillRunning",
    cards: 20,
    speed: "normal",
    mode: "single",
  },
  {
    n: 5,
    id: "deck",
    title: "Mazo entero",
    sub: "52 cartas sin perder la cuenta",
    tips: [
      "Repetí el número con cada carta, aunque no cambie: así no se te escapa.",
      "Las neutras (7, 8 y 9) no las sumes: dejalas pasar.",
    ],
    help: "Cada carta muestra su valor y ves el conteo mientras caen. Podés ocultarlo para probarte.",
    what: "Caen 52 cartas, una por segundo: lo que dura un mazo en la mesa. Mantené el número en la cabeza hasta el final.",
    goal: "Decí el conteo exacto.",
    screen: "drillRunning",
    cards: 52,
    speed: "normal",
    mode: "single",
  },
  {
    n: 6,
    id: "fast",
    title: "Más rápido",
    sub: "30 cartas a ritmo de casino",
    tips: [
      "No sumes carta por carta: mirá de a dos y cancelá.",
      "Practicá primero más lento y subí la velocidad cuando te salga.",
    ],
    help: "Elegís la velocidad, ves el valor de cada carta y el conteo mientras caen.",
    what: "30 cartas a ritmo rápido, como cuando el crupier reparte una ronda entera. No sumes: cancelá.",
    goal: "Decí el conteo exacto.",
    screen: "drillRunning",
    cards: 30,
    speed: "fast",
    mode: "single",
  },
  {
    n: 7,
    id: "distract",
    title: "Con distracciones",
    sub: "Charla, fichas y cartas que caen en cualquier lado",
    tips: [
      "El número primero, la charla después.",
      "Si alguien te habla, repetí el conteo en tu cabeza antes de contestar.",
    ],
    help: "Con la misma charla y movimiento, pero viendo el valor de cada carta y el conteo.",
    what: "30 cartas con ruido de mesa: gente que te habla, fichas que se mueven y cartas que caen en distintos lugares, a veces de a dos.",
    goal: "Decí el conteo exacto.",
    screen: "drillRunning",
    cards: 30,
    speed: "normal",
    mode: "single",
    distract: true,
  },
  {
    n: 8,
    id: "true",
    title: "Conteo real",
    sub: "Del corrido al real (true count)",
    tips: [
      "Dividí el conteo corrido por los mazos que quedan.",
      "Redondeá siempre hacia abajo: +2,8 es +2 y −1,5 es −2.",
    ],
    help: "Si te trabás, pedí una pista: te mostramos la división hecha.",
    what: "Te damos un conteo corrido y los mazos que quedan. Dividís y redondeás hacia abajo.",
    goal: "Acertá 9 de 10.",
    screen: "drillTrue",
    count: 10,
    pass: 9,
    lesson: "l19",
  },
  {
    n: 9,
    id: "bet",
    title: "Cuánto apostar",
    sub: "La escala de 1 a 8 unidades",
    tips: [
      "La escala: hasta +1, 1 unidad · +2, 2 · +3, 4 · +4, 6 · +5 o más, 8.",
      "Primero redondeá el conteo real hacia abajo; después buscá la apuesta.",
    ],
    help: "Tenés la escala a la vista mientras respondés.",
    what: "Te damos el conteo real y elegís cuántas unidades apostar según la escala.",
    goal: "Acertá 9 de 10.",
    screen: "drillBet",
    count: 10,
    pass: 9,
    lesson: "use",
  },
  {
    n: 10,
    id: "shoe",
    title: "Un zapato entero",
    sub: "En el simulador, con chequeos de conteo",
    tips: [
      "El conteo sigue de una mano a la otra: no vuelve a 0 hasta que mezclan.",
      "Contá también las cartas de los otros jugadores y las del crupier.",
    ],
    help: "Jugás un zapato con el conteo a la vista. Tocá el conteo para ocultarlo y probarte.",
    what: "Jugás un zapato completo de 6 mazos en el simulador, sin ver el conteo. Cada tanto te preguntamos el conteo corrido, y al final del zapato, otra vez.",
    goal: "Acertá al menos 4 de cada 5 chequeos.",
    screen: "shoeChallenge",
    passRatio: 0.8,
  },
];

function levelByN(n) {
  return COUNT_LEVELS.find((l) => l.n === n) || null;
}
function levelPassed(st, level) {
  return !!st.countPath.passed[level.id];
}
function levelUnlocked(st, level) {
  if (level.n === 1 || st.settings.unlockAll) return true;
  return levelPassed(st, levelByN(level.n - 1));
}
function levelPracticed(st, level) {
  return (st.countPath.practiced && st.countPath.practiced[level.id]) || 0;
}
// El nivel que toca: el primero sin aprobar (o null si están todos).
function currentLevel(st) {
  return COUNT_LEVELS.find((l) => !levelPassed(st, l)) || null;
}
function passedCount(st) {
  return COUNT_LEVELS.filter((l) => levelPassed(st, l)).length;
}

export {
  COUNT_LEVELS,
  currentLevel,
  levelByN,
  levelPassed,
  levelPracticed,
  levelUnlocked,
  passedCount,
};
