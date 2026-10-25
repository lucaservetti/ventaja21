// Ruta de conteo para principiantes: 10 niveles que se desbloquean al aprobar el anterior.
// Cada nivel usa uno de los ejercicios (pantallas) con una configuración fija y una nota para aprobar.

const COUNT_LEVELS = [
  {
    n: 1,
    id: "values",
    title: "Valores de las cartas",
    sub: "Cuánto vale cada carta en Hi-Lo",
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
  levelUnlocked,
  passedCount,
};
