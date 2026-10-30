const info = (a, e, t) => ({
  t: "info",
  title: a,
  body: Array.isArray(e) ? e : [e],
  visual: t,
});
const quiz = (a, e, t, s, n = {}) => ({
  t: "quiz",
  q: a,
  options: e,
  answer: t,
  explain: s,
  ...n,
});
const decide = (a, e, t, s, n = {}) => ({
  t: "decide",
  dealer: a,
  player: e,
  answer: t,
  explain: s,
  ...n,
});
let sceneSeq = 0;
const SCENE_KEYS = [
  "d",
  "p",
  "hands",
  "bet",
  "bank",
  "meter",
  "stamp",
  "tc",
  "bustMini",
  "rules",
  // Para las lecciones de conteo: conteo corrido, mazos que quedan y otros jugadores en la mesa.
  "rc",
  "left",
  "others",
];
const lenOf = (a) => (Array.isArray(a) ? a.length : 0);
function scene(a) {
  let e = "sc" + ++sceneSeq,
    t = {};
  return a.map((s, n) => {
    let l = t;
    if (s.reset) {
      t = { bank: t.bank };
    } else {
      t = { ...t };
    }
    for (let c of SCENE_KEYS) {
      if (c in s) {
        t[c] = s[c];
      }
    }
    if ("p" in s && !("hands" in s)) {
      t.hands = null;
    }
    if ("hands" in s && !("p" in s)) {
      t.p = null;
    }
    let i = !s.reset && lenOf(t.p) > lenOf(l.p) && lenOf(l.p) >= 2,
      o = !s.reset && lenOf(t.d) > lenOf(l.d) && lenOf(l.d) >= 2;
    return {
      t: "scene",
      sceneId: e,
      beat: n,
      ...t,
      newP: i,
      newD: o,
      say: s.say,
      act: s.act || null,
      ask: s.ask || null,
      dots: s.dots || null,
      bust: s.bust || null,
      hl: s.hl || null,
      row: s.row || null,
      tags: !!s.tags,
      chart: s.chart || null,
      outcomes: s.outcomes || null,
      chips: s.chips || null,
      sign: s.sign || null,
      play: s.play || null,
      bustcards: !!s.bustcards,
    };
  });
}
const SECTIONS = [
  {
    id: 1,
    title: "La mesa y las reglas",
    desc: "La mesa, las cartas y por qué la casa tiene ventaja",
    icon: "s",
    lessons: [
      {
        id: "l1",
        title: "Cómo se gana una mano",
        sum: [
          "Jugás contra el crupier: ganás si sumás más que él sin pasarte de 21, o si él se pasa.",
          "Ganar paga 1 a 1, el blackjack paga 3 a 2 y en el empate recuperás tu apuesta.",
          "Si te pasás, perdés en el acto, aunque después el crupier también se pase.",
        ],
        steps: [
          ...scene([
            {
              bank: 100,
              say: "Esta es la mesa. Arriba juega el **crupier** y abajo jugás vos. No jugás contra los otros jugadores: jugás contra él.",
            },
            {
              bet: 10,
              bank: 90,
              say: "Antes de que salga una carta, apostás. Ponés 10 fichas.",
            },
            {
              d: ["10c", "8d?"],
              p: ["Kh", "9s"],
              say: "Te tocan una K y un 9: **19**. El crupier muestra un 10 y tiene otra carta tapada.",
            },
            {
              act: "S",
              say: "19 es una muy buena mano. Tocá **Plantarse** (en inglés, *stand*) para quedarte con ella.",
            },
            {
              d: ["10c", "8d"],
              meter: true,
              say: "El crupier da vuelta su carta: un 8. Tiene **18** y, con 17 o más, está obligado a plantarse.",
            },
            {
              stamp: { p: "win" },
              bank: 110,
              say: "Tu 19 le gana a su 18. Se paga 1 a 1: recuperás tus 10 y cobrás 10 más.",
            },
          ]),
          info(
            "Los cuatro finales",
            [
              "**Ganás:** cobrás lo mismo que apostaste (1 a 1).",
              "**Perdés:** te sacan la apuesta.",
              "**Empate:** si suman lo mismo, recuperás tu apuesta.",
              "**Blackjack:** un As y una carta de 10 en tus dos primeras cartas. Paga 3 a 2: con 10 cobrás 15.",
            ],
            {
              v: "cards",
              cards: ["As", "Kh"],
              caption: "Blackjack: As + 10, J, Q o K",
            },
          ),
          ...scene([
            {
              bank: 100,
              bet: 10,
              d: ["10h", "6d?"],
              p: ["9d", "6c"],
              say: "Otra mano. Apostás 10 y te toca **15** contra un 10 del crupier.",
            },
            {
              act: "H",
              say: "Contra un 10, con 15 conviene pedir otra carta (lo vas a ver en la sección 2). Tocá **Pedir** (en inglés, *hit*).",
            },
            {
              p: ["9d", "6c", "8s"],
              stamp: { p: "bust" },
              say: "Salió un 8: **23**. Te pasaste y perdés la apuesta en el acto.",
            },
            {
              d: ["10h", "6d"],
              meter: true,
              say: "Ahora el crupier da vuelta un 6. Tiene 16 y está obligado a pedir.",
            },
            {
              d: ["10h", "6d", "9c"],
              stamp: { p: "bust", d: "bust" },
              say: "Sacó un 9: **25**. También se pasó, pero tu apuesta ya se la había llevado. **El que se pasa primero, pierde.** Esa regla es la ventaja de la casa.",
            },
          ]),
          quiz(
            "Tenés 20 y el crupier termina con 20. ¿Qué pasa?",
            ["Ganás vos", "Gana el crupier", "Empate: recuperás tu apuesta"],
            2,
            "Con el mismo total es empate: no ganás ni perdés.",
          ),
          quiz(
            "Apostaste 20 y te sale blackjack en una mesa 3:2. ¿Cuánto ganás?",
            ["20", "30", "40", "24"],
            1,
            "3 a 2 quiere decir que por cada 2 apostados cobrás 3: con 20 ganás 30 y además recuperás tus 20.",
          ),
        ],
      },
      {
        id: "l2",
        title: "Cuánto vale cada carta",
        sum: [
          "Del 2 al 10, cada carta vale su número; J, Q y K valen 10.",
          "El As vale 11, o 1 si con 11 te pasarías.",
          "Casi un tercio del mazo vale 10: 16 de cada 52 cartas.",
        ],
        steps: [
          info(
            "Los valores",
            [
              "Del **2 al 10**, cada carta vale su número.",
              "**J, Q y K** valen 10.",
              "El **As** vale 1 u 11: lo que más te convenga.",
            ],
            { v: "values-basic" },
          ),
          ...scene([
            {
              bank: 100,
              p: ["Kd", "Qs"],
              say: "Una K y una Q: **10 + 10 = 20**. Las figuras valen todas 10.",
            },
            {
              p: ["Ah", "6s"],
              say: "Un As y un 6. El As vale 11 mientras no te pases: **17**. También podría valer 1, por eso esta mano se muestra como **7/17**.",
            },
            {
              p: ["Ah", "6s", "9c"],
              say: "Si llega un 9, con el As como 11 tendrías 26. Entonces el As pasa a valer 1: **16**.",
            },
            {
              p: ["Ac", "Kh"],
              stamp: { p: "bj" },
              say: "Un As y una K en tus dos primeras cartas: **21 de entrada**. Eso es un **blackjack**.",
            },
          ]),
          info(
            "Casi un tercio vale 10",
            [
              "En cada mazo hay **16 cartas que valen 10**: el 10, la J, la Q y la K de cada palo.",
              "Por eso, cuando pensás qué carta te puede salir, la más probable es una de 10.",
            ],
            {
              v: "tiles",
              items: [
                { v: "16 de 52", l: "cartas valen 10" },
                { v: "31 %", l: "de cada mazo" },
              ],
            },
          ),
          quiz(
            "¿Cuánto suma esta mano?",
            ["17", "14", "7", "27"],
            0,
            "La K vale 10: 10 + 7 = 17.",
            { cards: ["Kd", "7s"] },
          ),
          quiz(
            "¿Cuánto suma esta mano con un As?",
            ["10", "20", "19", "21"],
            1,
            "El As vale 11 mientras no te pases: 11 + 9 = 20.",
            { cards: ["Ah", "9c"] },
          ),
          quiz(
            "¿Cuánto suma esta mano con dos ases?",
            ["21", "11", "31", "12"],
            0,
            "Un As vale 11 y el otro 1: 11 + 1 + 9 = 21.",
            { cards: ["Ac", "Ad", "9s"] },
          ),
        ],
      },
      {
        id: "l3",
        title: "Las reglas fijas del crupier",
        sum: [
          "El crupier no decide: con 16 o menos pide y con 17 o más se planta.",
          "Pide aunque vos tengas 20 y aunque esa carta lo pueda pasar.",
          "Con esas reglas fijas se pasa en unas 28 de cada 100 manos.",
        ],
        steps: [
          ...scene([
            {
              bank: 100,
              say: 'Un dato clave: el crupier **no juega contra vos**. Sigue un guion impreso en el paño. Leelo: "el crupier se planta con 17".',
            },
            {
              meter: true,
              say: "El guion completo: **con 16 o menos, pide. Con 17 o más, se planta.** No puede mirar tu mano ni elegir nada: pide con 16 aunque vos tengas 20.",
            },
            {
              bet: 10,
              bank: 90,
              meter: false,
              say: "Miralo en acción. Apostás 10.",
            },
            {
              d: ["6c", "10h?"],
              p: ["Ks", "Qd"],
              say: "Una K y una Q: **20**. Te plantás y la mano pasa a depender del 6 del crupier.",
            },
            { act: "S", say: "Tocá **Plantarse** y quedate con tu 20." },
            {
              d: ["6c", "10h"],
              meter: true,
              say: "El crupier da vuelta un 10: 6 + 10 = **16**. Ahora aplicá el guion…",
            },
            {
              ask: {
                q: "Tiene 16. ¿Qué está obligado a hacer?",
                o: ["Pedir", "Plantarse"],
                a: 0,
                x: "Con 16 o menos pide siempre, aunque vea tu 20 y aunque esa carta lo pueda pasar.",
              },
            },
            {
              d: ["6c", "10h", "8c"],
              stamp: { d: "bust" },
              say: "La carta obligada: un 8. 16 + 8 = **24**. Se pasó.",
            },
            {
              stamp: { d: "bust", p: "win" },
              bank: 110,
              say: "Tus 10 ganan 10.",
            },
            {
              dots: {
                n: 28,
                label: "el crupier se pasa en 28 de cada 100 manos",
              },
              say: "En toda una noche, ese guion hace que el crupier se pase en unas **28 de cada 100** manos. Él no elige; vos sí. El resto del curso es aprender a usar bien tus decisiones.",
            },
          ]),
          info(
            "El 17 blando",
            [
              "Un **17 blando** es un 17 con un As que vale 11, como A + 6.",
              "En algunas mesas el crupier **se planta** con 17 blando (S17) y en otras **pide** (H17). Que pida le da a la casa un poco más de ventaja: alrededor de 0,2 %.",
            ],
            { v: "cards", cards: ["Ad", "6c"], caption: "17 blando" },
          ),
          quiz(
            "El crupier tiene 10 y 6. ¿Qué hace?",
            [
              "Se planta: 16 ya es mucho",
              "Pide carta, siempre",
              "Depende de lo que tengan los jugadores",
            ],
            1,
            "Con 16 o menos el crupier pide siempre, aunque todos los jugadores tengan manos chicas.",
            { cards: ["10d", "6s"], cardsLabel: "Crupier" },
          ),
          quiz(
            "El crupier tiene 7 y J. ¿Qué hace?",
            ["Pide", "Se planta"],
            1,
            "Tiene 17. Con 17 o más se planta.",
            { cards: ["7h", "Jc"], cardsLabel: "Crupier" },
          ),
          quiz(
            "¿Por qué te sirve saber esto?",
            [
              "Para adivinar su carta tapada",
              "Porque se puede calcular qué tan seguido se pasa según la carta que muestra",
              "No sirve para nada",
            ],
            1,
            "Como el crupier juega siempre igual, se sabe qué tan seguido se pasa con cada carta visible. Toda la estrategia básica sale de ahí.",
          ),
        ],
      },
      {
        id: "l4",
        title: "Manos blandas",
        sum: [
          "Una mano es blanda (soft) cuando tiene un As que vale 11, como A,6.",
          "Desde una blanda no te pasás con una carta: si te pasarías, el As vale 1.",
          "Cuando el As tiene que valer 1, la mano pasa a ser dura (hard).",
        ],
        steps: [
          info(
            "Duras y blandas",
            [
              "Una mano es **blanda** (en inglés, *soft*) si tiene un As que vale 11.",
              "Es **dura** (*hard*) si no tiene As, o si el As tiene que valer 1 para no pasarte.",
            ],
            {
              v: "hands2",
              a: { cards: ["Ah", "6s"], label: "Blando 17" },
              b: { cards: ["10d", "7c"], label: "Duro 17" },
            },
          ),
          ...scene([
            {
              bank: 100,
              bet: 10,
              d: ["9d", "7c?"],
              p: ["Ah", "6s"],
              say: "Apostaste 10 y tenés A y 6: **17 blando**. El crupier muestra un 9.",
            },
            {
              bank: 90,
              act: "H",
              say: "Con 17 blando no te podés pasar pidiendo una carta, y contra un 9 un 17 casi nunca gana. Tocá **Pedir**.",
            },
            {
              p: ["Ah", "6s", "8d"],
              say: "Salió un 8. Con el As como 11 serían 25: el As pasa a valer 1 y tenés **15**. No te pasaste.",
            },
            {
              ask: {
                q: "Con A, 6 y 8, ¿tu mano es blanda o dura?",
                o: ["Blanda", "Dura"],
                a: 1,
                x: "El As ya tiene que valer 1: es un 15 duro. Ahora sí te podés pasar.",
              },
            },
            {
              act: "H",
              say: "Con 15 duro contra un 9 se sigue pidiendo. Tocá **Pedir**.",
            },
            {
              p: ["Ah", "6s", "8d", "4h"],
              act: "S",
              say: "Un 4: **19**. Ahora sí, tocá **Plantarse**.",
            },
            {
              d: ["9d", "7c"],
              meter: true,
              say: "El crupier da vuelta un 7: tiene 16 y pide.",
            },
            {
              d: ["9d", "7c", "Ks"],
              stamp: { d: "bust", p: "win" },
              bank: 110,
              say: "Una K: **26**, se pasó. Ganás 10. La carta gratis del 17 blando te llevó a 19.",
            },
          ]),
          quiz(
            "¿Qué mano es?",
            ["Duro 16", "Blando 16", "Blando 6"],
            1,
            "Tiene un As que vale 11: es blando 16.",
            { cards: ["Ac", "5d"] },
          ),
          quiz(
            "¿Qué mano es A, 5 y 10?",
            ["Blando 16", "Duro 16", "Te pasaste"],
            1,
            "Con el 10, el As como 11 te pasaría (26), así que vale 1: duro 16.",
            { cards: ["Ac", "5d", "10s"] },
          ),
          quiz(
            "Tenés A,4 (blando 15). Si pedís una carta, ¿te podés pasar?",
            ["Sí, con un 10", "No, con ninguna carta"],
            1,
            "Con un 10 tendrías 25 si el As valiera 11, pero pasa a valer 1: duro 15. Desde una blanda nunca te pasás con una sola carta.",
          ),
        ],
      },
      {
        id: "l5",
        title: "Por qué gana la casa",
        sum: [
          "La ventaja de la casa sale de una sola regla: si te pasás, perdés aunque el crupier también se pase.",
          "Imitando al crupier perdés alrededor de 5,5 %; con estrategia básica, cerca de 0,5 %.",
          "Plantarte cuando quieras, doblar, separar y cobrar 3:2 son tus armas.",
        ],
        steps: [
          info(
            "Vos jugás primero",
            [
              "Si los dos jugaran igual, el juego sería parejo. La diferencia está en el orden: **vos jugás primero**.",
              "Si te pasás, perdés aunque después el crupier también se pase.",
            ],
            {
              v: "outcomes",
              items: [
                { l: "Te pasás vos", r: "Perdés", tone: "bad" },
                { l: "Se pasa el crupier", r: "Ganás", tone: "good" },
                { l: "Se pasan los dos", r: "Perdés", tone: "bad" },
              ],
            },
          ),
          info(
            "Cuánto vale esa ventaja",
            [
              "Un jugador que **imita al crupier** (pide hasta 17 y nunca dobla ni separa) pierde alrededor de **5,5 %** de lo que apuesta.",
              "Con la **estrategia básica**, la ventaja de la casa baja a alrededor de **0,5 %**. Y contando cartas la podés dar vuelta.",
            ],
            {
              v: "tiles",
              items: [
                { v: "5,5 %", l: "imitando al crupier", tone: "bad" },
                { v: "0,5 %", l: "con estrategia básica", tone: "mid" },
                { v: "+1 %", l: "a tu favor contando", tone: "good" },
              ],
            },
          ),
          info("Lo que vos tenés y el crupier no", [
            "Para compensar, tenés opciones que el crupier no tiene: plantarte cuando quieras, **doblar** (*double*), **separar** (*split*) y cobrar el blackjack 3 a 2.",
          ]),
          info(
            "La estrategia básica",
            [
              "La mejor jugada para cada mano ya se conoce: se llama **estrategia básica**. La calcularon en 1956 cuatro matemáticos del ejército de Estados Unidos, con calculadoras de escritorio, y las computadoras la fueron afinando.",
            ],
            { v: "chart", tab: "hard" },
          ),
          info(
            "Cómo la vas a aprender",
            [
              "La sección 2 te la enseña de a un tipo de mano.",
              'El 0,5 % solo vale si la seguís **en todas las manos**: cada jugada "por intuición" te cuesta plata.',
            ],
            { v: "chart", tab: "hard" },
          ),
          quiz(
            "¿De dónde sale la ventaja de la casa?",
            [
              "El crupier tiene mejores cartas",
              "Si te pasás perdés, aunque el crupier también se pase",
              "Las cartas están arregladas",
            ],
            1,
            "Es la única asimetría del juego, y alcanza para que la casa gane a la larga.",
          ),
          quiz(
            '¿Qué hace un jugador que "imita al crupier"?',
            [
              "Pide hasta 17 y nunca dobla ni separa",
              "Se planta siempre con 12",
              "Dobla todas las manos",
            ],
            0,
            "Y pierde alrededor de 5,5 %: unas diez veces más que con la estrategia básica.",
          ),
          quiz(
            "Con estrategia básica perfecta, ¿cuánto pierde un jugador a la larga?",
            [
              "Nada: el juego queda parejo",
              "Alrededor de 0,5 % de lo que apuesta",
              "Alrededor de 10 %",
            ],
            1,
            "Depende de las reglas de la mesa, pero en un buen casino ronda el 0,5 %.",
          ),
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Cómo jugar tu mano",
    desc: "La jugada correcta para cada mano que te puede tocar",
    icon: "h",
    lessons: [
      {
        id: "l6",
        title: "Leer la carta del crupier",
        sum: [
          "Cada decisión usa dos datos: tu total y la carta visible del crupier.",
          "Con 2 a 6 visible el crupier se pasa seguido: arriesgá menos y dejalo pedir.",
          "Con 7 a As casi siempre arma una mano: necesitás un total de verdad.",
        ],
        steps: [
          ...scene([
            {
              bank: 100,
              d: ["5d", "X?"],
              p: ["Kc", "3h"],
              hl: "both",
              say: "Sección 2: misma mesa, otra habilidad. Desde ahora, cada decisión usa dos datos: **tu total** y **la carta visible del crupier**. Esa carta te dice cómo suele terminar su mano.",
            },
            {
              bust: { hl: [5, 6, 10] },
              say: "Primero los números. Si muestra un 5 o un 6, el crupier se pasa unas **42 de cada 100** veces. Si muestra un 10, unas **23**. Las mismas reglas, casi el doble de veces.",
            },
            {
              bust: { hl: [5, 10] },
              ask: {
                q: "Tu 13 necesita que el crupier se pase. ¿Qué carta visible le conviene?",
                o: ["Un 5", "Un 10"],
                a: 0,
                x: "El 5. Con un 5 el crupier se pasa casi el doble de veces, así que plantarte y esperar pasa a ser una opción real.",
              },
            },
            {
              bust: { groups: true },
              say: "Hay dos grupos. **Del 2 al 6:** el crupier se pasa seguido, así que arriesgás menos y lo dejás pedir. **Del 7 al As:** casi siempre arma una mano, así que necesitás un total de verdad.",
            },
            {
              reset: true,
              bank: 90,
              bet: 10,
              d: ["5d", "10s?"],
              p: ["7c", "5s"],
              bustMini: true,
              say: "Usalo ahora. Apostaste 10 y tenés **12 duro** contra un 5.",
            },
            {
              play: {
                a: "S",
                x: "Te plantás y el riesgo lo corre el crupier: con un 5 se pasa unas 42 de cada 100 veces, y plantarte solo pierde cuando él arma una mano.",
              },
              say: "12 contra un 5. ¿Pedís o te plantás?",
            },
            {
              d: ["5d", "10s", "9c"],
              bustMini: false,
              meter: true,
              stamp: { d: "bust" },
              say: "El crupier da vuelta un 10: 15, y está obligado a pedir. Un 9: **24**, se pasó.",
            },
            {
              stamp: { d: "bust", p: "win" },
              bank: 110,
              say: "Ganaste con 12, plantándote. Te lo dijo su carta visible.",
            },
            {
              bust: { groups: true },
              say: "Repetí los dos grupos, que mandan en las próximas seis lecciones. **Del 2 al 6**, el crupier se pasa seguido: plantate más y doblá cuando puedas. **Del 7 al As**, casi siempre arma una mano: construí tu total.",
            },
          ]),
          quiz(
            "¿Con qué carta visible se pasa más seguido el crupier?",
            ["2", "6", "10", "As"],
            1,
            "Con 5 y 6 se pasa alrededor de 42 de cada 100 veces: son sus peores cartas.",
          ),
          quiz(
            "El crupier muestra un 7. ¿Es una carta débil o fuerte?",
            ["Débil", "Fuerte"],
            1,
            "Con un 7 y una tapada de 10 ya tiene 17 y se planta. Se pasa unas 26 de cada 100 veces.",
          ),
        ],
      },
      {
        id: "l7",
        title: "Cómo jugar el 16",
        sum: [
          "Con 16 duro, plantate contra 2 a 6 y pedí contra 7 a As.",
          "Pedir con 16 contra una carta fuerte duele, pero pierde menos que plantarse.",
          "Si la mesa permite rendirse, 16 contra 9, 10 o As se rinde.",
        ],
        steps: [
          ...scene([
            {
              bank: 90,
              bet: 10,
              say: "¿Te acordás de que vos jugás primero (lección 5)? Esta es la mano donde más te cuesta: 16 contra una carta fuerte. Es la peor mano que te puede tocar. Apostás 10.",
            },
            {
              d: ["10h", "9s?"],
              p: ["10c", "6s"],
              say: "16 contra un 10. Esta mesa no permite rendirse, así que la elección es pedir o plantarse. Ninguna es buena: perdés unas tres de cada cuatro manos de cualquier forma.",
            },
            {
              outcomes: { plays: ["S", "H"] },
              say: "Compará las dos jugadas en 100 manos. Plantado, ganás unas 23 (cuando el crupier se pasa) y perdés 77. Pidiendo, ganás unas 20, empatás 6 y perdés 74.",
            },
            {
              outcomes: { plays: ["S", "H"], net: true },
              say: "Si hacés la cuenta, quedan casi iguales. La cuenta exacta deja a pedir apenas adelante, por una fracción de apuesta. Es una de las decisiones más parejas de toda la tabla.",
            },
            {
              outcomes: { plays: ["S", "H"], net: true },
              play: {
                a: "H",
                x: "Pedir, por poco. Una decisión pareja igual tiene una respuesta correcta, y la tomás cada vez que te toca esta mano.",
              },
              say: "Muy parejo. ¿Qué jugada está adelante?",
            },
            {
              outcomes: null,
              p: ["10c", "6s", "4d"],
              act: "S",
              say: "Pediste y salió un 4: **20**. Ahora tocá **Plantarse**.",
            },
            {
              d: ["10h", "9s"],
              meter: true,
              stamp: { p: "win" },
              bank: 110,
              say: "El crupier da vuelta un 9: **19**. Esta la ganaste.",
            },
            {
              say: "El 4 fue suerte. La decisión era correcta antes de que saliera la carta, y habría sido correcta aunque te pasaras.",
            },
            {
              chips: [
                { v: 10, l: "Tu apuesta" },
                { v: 5, l: "Vuelve la mitad", tone: "acc" },
                { v: 5, l: "Entregás la mitad", tone: "bad" },
              ],
              say: "Una cosa más: algunas mesas te dejan **rendirte**, es decir, abandonar la mano a cambio de la mitad de tu apuesta. Donde se puede, 16 contra 9, 10 o As se rinde, y también 15 contra 10.",
            },
          ]),
          info(
            "La regla",
            [
              "**Contra 2 a 6: plantate.** El crupier se pasa seguido: dejá que arriesgue él.",
              "**Contra 7 a As: pedí.** Duele, pero plantarte con 16 contra una carta fuerte pierde un poco más.",
            ],
            { v: "chart", tab: "hard", rows: [16] },
          ),
          decide(
            "5",
            ["9d", "7c"],
            "S",
            "Plantate. Con un 5 el crupier se pasa unas 42 de cada 100 veces.",
          ),
          decide(
            "7",
            ["Kc", "6d"],
            "H",
            "Pedí. Con un 7 el crupier se pasa solo unas 26 de cada 100 veces.",
          ),
          decide(
            "A",
            ["9s", "7h"],
            "H",
            "Pedí. El As es la mejor carta del crupier.",
          ),
        ],
      },
      {
        id: "l8",
        title: "Duras de 12 a 16",
        sum: [
          "Contra 4, 5 o 6, plantate con 12 a 16 y dejá que pida el crupier.",
          "Contra 7 o más, pedí hasta llegar a 17 o más.",
          "Contra 2 o 3 hay una excepción: con 12 se pide, con 13 o más te plantás.",
        ],
        steps: [
          ...scene([
            {
              bustcards: true,
              say: "El 16 tiene cuatro vecinos: 12, 13, 14 y 15. A estos cinco totales llamalos **la zona de peligro**: son muy bajos para ganar salvo que el crupier se pase, y bastante altos como para que una sola carta te pase.",
            },
            {
              chart: { tab: "hard", rows: [16, 15, 14, 13, 12] },
              say: "Una sola regla cubre los cinco. **Contra 4, 5 o 6:** plantate y dejá que pida el crupier. **Contra 7 o más:** pedí hasta llegar a 17 o más. **Contra 2 o 3** hay una excepción: con 12 se pide; con 13 o más, te plantás.",
            },
            {
              bank: 90,
              bet: 10,
              d: ["6s", "10d?"],
              p: ["8d", "6c"],
              bustMini: true,
              say: "Primera ronda. Apostaste 10 y tenés **14** contra un 6.",
            },
            {
              play: {
                a: "S",
                x: "Te plantás y el que tiene que pedir es el crupier. Con un 6 se pasa unas 42 de cada 100 veces, y pedir te arriesgaba a pasarte primero.",
              },
              say: "14 contra un 6. Decí la regla y tocá.",
            },
            {
              d: ["6s", "10d", "Kc"],
              bustMini: false,
              meter: true,
              stamp: { d: "bust" },
              say: "Da vuelta un 10: 16, y está obligado a pedir. Una K: **26**, se pasó.",
            },
            {
              stamp: { d: "bust", p: "win" },
              bank: 110,
              say: "Cobrás tus 10.",
            },
            {
              reset: true,
              bank: 100,
              bet: 10,
              d: ["2s", "8s?"],
              p: ["8h", "5c"],
              bustMini: true,
              say: "Segunda ronda: la excepción. Mano nueva.",
            },
            {
              play: {
                a: "S",
                x: "Te plantás. El 2 no es tan débil como un 4, 5 o 6, pero con 13 o más igual te plantás. Solo el 12 pide contra 2 o 3.",
              },
              say: "13 contra un 2. Cuidado con esta.",
            },
            {
              d: ["2s", "8s", "7d"],
              bustMini: false,
              meter: true,
              stamp: { p: "lose" },
              say: "Da vuelta un 8: tiene 10. Pide y saca un 7: **17**. Tu 13 pierde y se van los 10.",
            },
            {
              chart: { tab: "hard", rows: [16, 15, 14, 13, 12], hl: [13, 0] },
              say: "La jugada igual era la correcta. Las jugadas correctas pierden seguido, y un resultado no cambia cuál es la mejor jugada.",
            },
          ]),
          ...scene([
            {
              bank: 100,
              bet: 10,
              d: ["3c", "9s?"],
              p: ["10d", "2s"],
              say: "Apostaste 10 y tenés 12 contra un 3. Con 12 solo te pasás si sale una carta de 10.",
            },
            {
              bank: 90,
              dots: { n: 31, label: "31 de cada 100 cartas valen 10" },
              say: "Eso es unas **31 de cada 100** cartas. Las otras 69 te mejoran.",
            },
            {
              outcomes: { plays: ["S", "H"], net: true },
              say: "Y un crupier con 3 no se pasa tanto como parece. En 100 manos, pedir pierde unas 2 apuestas menos que plantarse.",
            },
            { act: "H", say: "Tocá **Pedir**." },
            {
              p: ["10d", "2s", "7h"],
              act: "S",
              say: "Un 7: **19**. Tocá **Plantarse**.",
            },
            {
              d: ["3c", "9s"],
              meter: true,
              say: "El crupier da vuelta un 9: tiene 12 y pide.",
            },
            {
              d: ["3c", "9s", "5d"],
              stamp: { p: "win" },
              bank: 110,
              say: "Sacó un 5: **17**, se planta. Tu 19 gana.",
            },
          ]),
          decide(
            "4",
            ["10s", "2d"],
            "S",
            "Plantate 12 contra 4: el crupier se pasa unas 39 de cada 100 veces.",
          ),
          decide(
            "9",
            ["10d", "4c"],
            "H",
            "Pedí 14 contra 9: con un 9 el crupier llega a 19 seguido.",
          ),
          decide(
            "3",
            ["9h", "3s"],
            "H",
            "Pedí 12 contra 3: es la excepción de la regla.",
          ),
        ],
      },
      {
        id: "l9",
        title: "El 18 blando",
        sum: [
          "18 blando (A,7): plantate contra 2, 7 y 8.",
          "Doblalo contra 3 a 6 (si no podés doblar, plantate).",
          "Pedí contra 9, 10 y As: ahí 18 pierde más de lo que gana.",
        ],
        steps: [
          info(
            "Una mano engañosa",
            [
              "A,7 suma 18 y parece buena mano. Pero se juega de **tres maneras distintas** según la carta del crupier.",
            ],
            { v: "chart", tab: "soft", rows: [18] },
          ),
          ...scene([
            {
              bank: 100,
              bet: 10,
              d: ["5d", "10s?"],
              p: ["Ah", "7c"],
              say: "Apostaste 10 y tenés A y 7: **18 blando** contra un 5.",
            },
            {
              bank: 90,
              act: "D",
              say: "El crupier está débil y tu mano no se pasa con una carta. Doblá: tocá **Doblar**.",
            },
            {
              bet: 20,
              bank: 80,
              p: ["Ah", "7c", "3s"],
              say: "Pusiste 10 más y recibís una sola carta: un 3. **21**.",
            },
            {
              d: ["5d", "10s"],
              meter: true,
              say: "El crupier da vuelta un 10: tiene 15 y pide.",
            },
            {
              d: ["5d", "10s", "8h"],
              stamp: { d: "bust", p: "win" },
              bank: 120,
              say: "Un 8: **23**, se pasó. Cobrás 20 por tu apuesta doblada.",
            },
          ]),
          info("La regla", [
            "**Contra 2, 7 u 8: plantate.**",
            "**Contra 3 a 6: doblá** (si no podés doblar, plantate).",
            "**Contra 9, 10 o As: pedí.** No te podés pasar con una carta, y contra cartas fuertes 18 pierde más de lo que gana.",
          ]),
          decide(
            "9",
            ["Ah", "7c"],
            "H",
            "Pedí: contra 9, un 18 pierde más de lo que gana y una carta no te puede pasar.",
          ),
          decide(
            "5",
            ["As", "7d"],
            "D",
            "Doblá: el crupier con 5 está débil y tu mano no se pasa con una carta.",
          ),
          decide(
            "7",
            ["Ad", "7s"],
            "S",
            "Plantate: tu 18 le gana al 17 que el crupier suele armar.",
          ),
          decide("A", ["Ac", "7h"], "H", "Pedí: contra As, 18 blando pierde."),
          decide(
            "2",
            ["Ah", "7s"],
            "S",
            "Plantate contra 2 (en mesas S17; en mesas H17 se dobla).",
          ),
          info("Las demás blandas", [
            "**A,8 y A,9:** plantate siempre (en mesas H17, A,8 contra 6 se dobla).",
            "**A,2 a A,6:** pedí, salvo contra un crupier débil, donde se doblan. Lo ves en la próxima lección.",
          ]),
        ],
      },
      {
        id: "l10",
        title: "Cuándo doblar",
        sum: [
          "Doblar es duplicar la apuesta a cambio de una sola carta más, con tus dos primeras cartas.",
          "11 se dobla contra todo menos As; 10 contra 2 a 9; 9 contra 3 a 6.",
          "Las blandas chicas se doblan contra un crupier débil, sobre todo contra 5 y 6.",
        ],
        steps: [
          info("Doblar", [
            "Doblar (en inglés, *double* o *double down*) es **duplicar tu apuesta** a cambio de recibir **una sola carta más**.",
            "Se hace con tus dos primeras cartas, cuando sos favorito en la mano.",
          ]),
          ...scene([
            {
              bank: 100,
              bet: 10,
              d: ["6c", "Qh?"],
              p: ["6h", "5d"],
              say: "Apostaste 10 y tenés **11** contra un 6.",
            },
            {
              bank: 90,
              act: "D",
              say: "Es la mejor mano para doblar: casi un tercio de las cartas te dejan en 21. Tocá **Doblar**.",
            },
            {
              bet: 20,
              bank: 80,
              p: ["6h", "5d", "Kd"],
              say: "Una K: **21**, con el doble apostado.",
            },
            {
              d: ["6c", "Qh"],
              meter: true,
              say: "El crupier tiene 16 y pide.",
            },
            { d: ["6c", "Qh", "4s"], say: "Un 4: **20**. Se planta." },
            {
              stamp: { p: "win" },
              bank: 120,
              say: "Tu 21 gana y cobrás 20: el doble que sin doblar.",
            },
          ]),
          info(
            "Los dobles duros",
            [
              "**11:** doblá contra todo, menos contra As (en mesas H17, también contra As).",
              "**10:** doblá contra 2 a 9.",
              "**9:** doblá contra 3 a 6.",
            ],
            { v: "chart", tab: "hard", rows: [11, 10, 9] },
          ),
          info(
            "Los dobles blandos",
            [
              "Contra **5 y 6**: doblá de A,2 a A,7.",
              "Contra **4**: de A,4 a A,7.",
              "Contra **3**: A,6 y A,7.",
              "Contra **2**: ninguna (en mesas H17, A,7).",
            ],
            { v: "chart", tab: "soft", rows: [18, 17, 16, 15, 14, 13] },
          ),
          decide(
            "10",
            ["6c", "4s"],
            "H",
            "Pedí 10 contra 10: el crupier tiene una carta tan buena como la tuya.",
          ),
          decide(
            "2",
            ["5h", "4c"],
            "H",
            "Pedí 9 contra 2: el 9 solo se dobla contra 3 a 6.",
          ),
          decide("4", ["Ad", "4c"], "D", "Doblá A,4 contra 4."),
          decide(
            "4",
            ["As", "2h"],
            "H",
            "Pedí A,2 contra 4: A,2 y A,3 se doblan solo contra 5 y 6.",
          ),
          decide("A", ["7d", "4s"], "H", "Pedí 11 contra As (en mesas S17)."),
          quiz(
            "Pediste con 5,4 y te salió un 2: tenés 11 con tres cartas contra un 6. ¿Podés doblar?",
            ["Sí", "No: solo se dobla con las dos primeras cartas"],
            1,
            "Con tres cartas ya no se puede doblar: pedí.",
          ),
        ],
      },
      {
        id: "l11",
        title: "Separar ases y ochos",
        sum: [
          "Separar es dividir un par en dos manos, poniendo otra apuesta igual.",
          "Separá siempre los ases y los ochos.",
          "Después de separar, As + 10 es 21 común, no blackjack.",
        ],
        steps: [
          info(
            "Separar",
            [
              "Con dos cartas iguales podés **separarlas** (en inglés, *split*): ponés otra apuesta igual a la primera y cada carta arranca una mano nueva.",
            ],
            { v: "cards", cards: ["8h", "8c"], caption: "Un par de 8" },
          ),
          ...scene([
            {
              bank: 100,
              bet: 10,
              d: ["10s", "7d?"],
              p: ["8h", "8c"],
              say: "Apostaste 10 y tenés un par de 8 contra un 10. Juntos son **16**, la peor mano del juego.",
            },
            { bank: 90, act: "P", say: "Separalos: tocá **Separar**." },
            {
              hands: [["8h"], ["8c"]],
              bank: 80,
              say: "Ponés otra apuesta de 10 y cada 8 arranca su propia mano.",
            },
            {
              hands: [
                ["8h", "3d"],
                ["8c", "Kc"],
              ],
              say: "Llega una carta a cada una: **11** y **18**. Dos manos mucho mejores que un 16.",
            },
            {
              say: "Desde ahí, cada mano se juega por separado, como cualquier otra. Separando los 8 contra un 10 perdés menos que jugando el 16.",
            },
          ]),
          info("Los ases: siempre", [
            "Dos ases juntos suman un 12 flojo. Separados, cada As arranca en 11 y cualquier carta de 10 te deja en 21.",
            "**Separá los ases siempre.** En casi todos los casinos recibís una sola carta por As, y A + 10 después de separar es 21, no blackjack.",
          ]),
          info("Los ochos: siempre", [
            "8,8 es 16, la peor mano del juego. Separados, cada 8 arranca una mano mucho mejor.",
            "Incluso contra 10 o As: separando perdés menos que jugando el 16. Única excepción: en mesas H17 con rendición, contra As conviene rendirse.",
          ]),
          decide(
            "10",
            ["8d", "8s"],
            "P",
            "Separá: dos manos que arrancan en 8 pierden menos que un 16.",
          ),
          decide("6", ["Ah", "Ad"], "P", "Separá siempre los ases."),
          decide(
            "A",
            ["8c", "8h"],
            "P",
            "Separá (en mesas S17; con H17 y rendición, rendite).",
          ),
          quiz(
            "Separaste ases y en uno te salió una K. ¿Tenés blackjack?",
            ["Sí, cobro 3 a 2", "No: es 21 y se paga 1 a 1"],
            1,
            "Después de separar, A + 10 cuenta como 21 común.",
          ),
        ],
      },
      {
        id: "l12",
        title: "Pares que nunca se separan",
        sum: [
          "Nunca separes los dieces: 20 gana casi siempre.",
          "Nunca separes los cincos: jugalos como un 10.",
          "9,9 se separa contra 2 a 9, menos contra 7; el 4,4 solo contra 5 y 6.",
        ],
        steps: [
          ...scene([
            {
              bank: 100,
              bet: 10,
              d: ["6d", "9c?"],
              p: ["Kh", "Ks"],
              say: "Apostaste 10 y tenés dos K contra un 6. Es tentador separar contra un crupier débil…",
            },
            {
              bank: 90,
              act: "S",
              say: "…pero 20 ya es una mano ganadora. Nunca separes los dieces: tocá **Plantarse**.",
            },
            {
              d: ["6d", "9c"],
              meter: true,
              say: "El crupier da vuelta un 9: tiene 15 y pide.",
            },
            {
              d: ["6d", "9c", "Jh"],
              stamp: { d: "bust", p: "win" },
              bank: 110,
              say: "Una J: **25**, se pasó. Tu 20 cobra.",
            },
          ]),
          info("Nunca separes los dieces", [
            "10,10 es 20: gana casi siempre.",
            "Separarlos es cambiar una mano ganadora por dos manos que arrancan en 10.",
          ]),
          info("Nunca separes los cincos", [
            "5,5 es 10, una gran mano para doblar.",
            "Jugala como un 10: doblá contra 2 a 9 y pedí contra 10 y As.",
          ]),
          info(
            "El resto de los pares",
            [
              "**9,9:** separá contra 2 a 9, menos contra 7 (plantate: tu 18 le gana a su 17 probable). Contra 10 y As, plantate.",
              "**7,7:** separá contra 2 a 7. **6,6:** contra 2 a 6. **2,2 y 3,3:** contra 2 a 7. **4,4:** solo contra 5 y 6.",
              "Si la mesa **no deja doblar después de separar**: el 6,6 se separa contra 3 a 6, el 2,2 y el 3,3 contra 4 a 7, y el 4,4 nunca.",
            ],
            { v: "chart", tab: "pairs" },
          ),
          decide("8", ["5c", "5d"], "D", "Doblá: 5,5 se juega como un 10."),
          decide(
            "7",
            ["9h", "9c"],
            "S",
            "Plantate: 18 le gana al 17 probable del crupier.",
          ),
          decide(
            "9",
            ["9s", "9d"],
            "P",
            "Separá: contra 9 dos manos de 9 rinden más que un 18.",
          ),
          decide(
            "3",
            ["4h", "4s"],
            "H",
            "Pedí: el 4,4 solo se separa contra 5 y 6.",
          ),
          decide("7", ["7c", "7h"], "P", "Separá los 7 contra 7."),
        ],
      },
      {
        id: "lt",
        title: "La tabla completa",
        sum: [
          "La tabla junta todo: tu mano en las filas, la carta del crupier en las columnas.",
          "H pedir, S plantarse, D doblar, P separar: las letras que vas a ver en todo el mundo.",
          "Primero fijate si tenés un par, después si es blanda; si no, es dura.",
        ],
        steps: [
          info(
            "Todo en una tabla",
            [
              "Ya sabés jugar cada tipo de mano. La **tabla de estrategia básica** (*basic strategy*) las junta todas: en cada casilla está la jugada que más plata te deja, o la que menos te hace perder.",
              "Las letras son las que se usan en todo el mundo: **H** pedir (*hit*), **S** plantarse (*stand*), **D** doblar (*double*) y **P** separar (*split*).",
            ],
            { v: "chart", tab: "hard" },
          ),
          info(
            "Cómo se lee",
            [
              "Buscá **tu mano** en la columna de la izquierda y la **carta visible del crupier** arriba. Donde se cruzan está la jugada.",
              "Acá: tenés **16** y el crupier muestra un **10**. La casilla marcada dice **H**: pedí.",
            ],
            {
              v: "chart",
              tab: "hard",
              rows: [17, 16, 15, 14, 13, 12],
              hl: [16, 8],
            },
          ),
          info("Tres tablas", [
            "**Pares**: tus dos primeras cartas son iguales. Es lo primero que mirás, porque ahí aparece la opción de separar.",
            "**Blandas** (*soft*): tenés un As que vale 11.",
            "**Duras** (*hard*): todo lo demás, incluso si tenés un As que ya vale 1.",
          ]),
          quiz(
            "Tenés A,7. ¿En qué tabla lo buscás?",
            ["Duras", "Blandas", "Pares"],
            1,
            "El As vale 11, así que es un 18 blando.",
          ),
          quiz(
            "Tenés 8,8. ¿En qué tabla lo buscás?",
            ["Duras", "Blandas", "Pares"],
            2,
            "Dos cartas iguales: primero mirás la tabla de pares.",
          ),
          quiz(
            "Tenés A, 5 y 10. ¿En qué tabla lo buscás?",
            ["Duras", "Blandas", "Pares"],
            0,
            "Si el As valiera 11 te pasarías: vale 1 y tenés 16 duro.",
            { cards: ["Ah", "5c", "Ts"] },
          ),
          info(
            "Las duras, en palabras",
            [
              "Así se dice la tabla de duras con las reglas de tu mesa. Leela de arriba abajo: es más fácil de lo que parece.",
            ],
            { v: "chartWords", tab: "hard" },
          ),
          info(
            "Las blandas, en palabras",
            [
              "Con las blandas casi nunca te plantás antes de 18, porque no te podés pasar con una carta.",
            ],
            { v: "chartWords", tab: "soft" },
          ),
          info(
            "Los pares, en palabras",
            [
              "Ases y ochos: siempre. Dieces y cincos: nunca. El resto depende de la carta del crupier.",
            ],
            { v: "chartWords", tab: "pairs" },
          ),
          decide(
            "10",
            ["Ts", "6h"],
            "H",
            "Pedí: 13 a 16 se plantan solo contra 2 a 6.",
          ),
          decide(
            "4",
            ["Th", "2c"],
            "S",
            "Plantate: con 12, plantate contra 4, 5 y 6.",
          ),
          decide("6", ["Ah", "7d"], "D", "Doblá: A,7 contra 3 a 6 se dobla."),
          decide("A", ["8h", "8s"], "P", "Separá: ases y ochos, siempre."),
          decide("5", ["9s", "2d"], "D", "Doblá: 11 se dobla casi siempre."),
          decide(
            "9",
            ["Ad", "7c"],
            "H",
            "Pedí: A,7 contra 9, 10 o As es una mano floja.",
          ),
          info("Tu tabla, siempre a mano", [
            "En **Aprender**, tocá el botón de la tabla (arriba a la derecha) para verla cuando quieras.",
            "Cada casilla te dice por qué se juega así y cómo te va con esa mano en Entrenar: un punto verde si la dominás y uno rojo si te cuesta.",
          ]),
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Plata, ventajas y trampas",
    desc: "Las trampas que te cuestan plata antes de que salga una carta",
    icon: "d",
    lessons: [
      {
        id: "l13",
        title: "Mesas 3:2 y 6:5",
        sum: [
          "Fijate en el cartel: el blackjack tiene que pagar 3:2.",
          "Una mesa 6:5 le suma a la casa alrededor de 1,4 %.",
          "Que el crupier pida con 17 blando o no poder doblar después de separar también te cuesta.",
        ],
        steps: [
          info(
            "El cartelito que importa",
            [
              "En la mesa vas a ver cuánto paga el blackjack: **3 a 2** o **6 a 5**.",
              "Parece un detalle, pero es la regla que más plata te cuesta.",
            ],
            { v: "payout" },
          ),
          ...scene([
            {
              bank: 100,
              bet: 10,
              d: ["9h", "7s?"],
              p: ["As", "Kh"],
              stamp: { p: "bj" },
              say: "Apostaste 10 y te salió blackjack. En una mesa **3:2**, cobrás 15.",
            },
            { bank: 115, say: "Recuperás tus 10 y cobrás 15: quedás con 115." },
            {
              say: "En una mesa **6:5**, el mismo blackjack paga 12: te quedarían 112. Parece poco, pero te sale un blackjack más o menos una vez cada 21 manos, toda la noche.",
            },
          ]),
          info("Cuánto cuesta", [
            "Cobrar 6:5 en vez de 3:2 le suma a la casa alrededor de **1,4 %**: casi el triple de toda la ventaja que tiene contra la estrategia básica.",
          ]),
          info("Otras reglas que importan", [
            "**A tu favor:** que el crupier se plante con 17 blando, doblar después de separar, la rendición y el corte del zapato bien atrás.",
            "**En contra:** pagar 6:5, que el crupier pida con 17 blando y no poder doblar después de separar.",
          ]),
          quiz(
            "Apostás 10 en una mesa 6:5 y sacás blackjack. ¿Cuánto ganás?",
            ["15", "12", "10"],
            1,
            "6 a 5: por cada 5 cobrás 6. Con 10, 12.",
          ),
          quiz(
            "Hay una mesa 3:2 con mínimo 25 y una 6:5 con mínimo 10. Vas a apostar 25 por mano. ¿Cuál conviene?",
            ["La 6:5, es más barata", "La 3:2"],
            1,
            "Si vas a apostar lo mismo, la 3:2 te cuesta mucho menos a la larga.",
          ),
          quiz(
            "¿Qué regla le suma ventaja a la casa?",
            [
              "El crupier se planta con 17 blando",
              "El crupier pide con 17 blando",
              "Se permite rendirse",
            ],
            1,
            "Cuando el crupier pide con 17 blando a veces mejora su mano: la casa gana alrededor de 0,2 % más.",
          ),
        ],
      },
      {
        id: "l14",
        title: "El seguro",
        sum: [
          "El seguro es una apuesta aparte a que el crupier tiene blackjack; paga 2 a 1.",
          "Sin contar cartas pierde alrededor de 7 %: no lo tomes.",
          "El pago parejo es lo mismo que el seguro: tampoco conviene.",
        ],
        steps: [
          info(
            "Qué es",
            [
              "Cuando el crupier muestra un As, te ofrece un **seguro** (*insurance*): apostás la mitad de tu apuesta a que tiene blackjack.",
              "Si lo tiene, el seguro paga **2 a 1**.",
            ],
            {
              v: "cards",
              cards: ["Ah", "X"],
              caption: "El crupier muestra As",
            },
          ),
          ...scene([
            {
              bank: 100,
              bet: 10,
              d: ["Ah", "7s?"],
              p: ["10c", "Qd"],
              say: "Apostaste 10 y tenés 20. El crupier muestra un As y te ofrece el **seguro**: apostar 5 más a que tiene blackjack.",
            },
            {
              bank: 90,
              ask: {
                q: "¿Tomás el seguro?",
                o: ["Sí, para proteger mi 20", "No"],
                a: 1,
                x: "El seguro no protege tu mano: es una apuesta aparte sobre su carta tapada, y sin contar cartas pierde plata.",
              },
            },
            {
              d: ["Ah", "7s"],
              meter: true,
              say: "El crupier mira su carta: no tiene blackjack. Tiene **18** y se planta.",
            },
            {
              stamp: { p: "win" },
              bank: 110,
              say: "Tu 20 gana. Si hubieras tomado el seguro, además habrías perdido 5.",
            },
          ]),
          info(
            "Por qué pierde",
            [
              "Para que el seguro no pierda plata, más de un tercio de las cartas que quedan tendrían que valer 10.",
              "Normalmente son 4 de cada 13 (31 %). Por eso el seguro pierde alrededor de **7 %** a la larga.",
            ],
            {
              v: "tiles",
              items: [
                { v: "33 %", l: "de dieces para empatar", tone: "mid" },
                { v: "31 %", l: "lo que hay normalmente", tone: "bad" },
              ],
            },
          ),
          info("El pago parejo", [
            "Si tenés blackjack y el crupier muestra As, te ofrecen **pago parejo** (even money): cobrar 1 a 1 en el acto.",
            "Es exactamente lo mismo que tomar el seguro, así que tampoco conviene.",
          ]),
          quiz(
            "¿Cuánto paga el seguro?",
            ["1 a 1", "2 a 1", "3 a 2"],
            1,
            "Paga 2 a 1 si el crupier tiene blackjack.",
          ),
          quiz(
            "¿Cuándo sí conviene el seguro?",
            [
              "Nunca",
              "Cuando contás cartas y quedan muchos dieces",
              "Cuando tenés blackjack",
            ],
            1,
            "Con el conteo alto quedan suficientes dieces. Lo ves en la sección 4.",
          ),
        ],
      },
      {
        id: "l15",
        title: "Cuándo levantarse",
        sum: [
          "Las rachas no cambian tus chances: solo importa qué cartas quedan.",
          "Decidí cuánto jugar y cuánto podés perder antes de sentarte.",
          "Ningún sistema de apuestas, como la martingala, le gana a la casa.",
        ],
        steps: [
          info("Las rachas no existen", [
            'Haber perdido cinco manos seguidas no hace que "te toque ganar".',
            "Lo único que cambia tus chances es **qué cartas quedan en el zapato**, y eso es justamente lo que mide el conteo.",
          ]),
          info("Tus límites, antes de sentarte", [
            "Decidí cuánto vas a jugar y cuánto podés perder **antes** de llegar.",
            "Jugá solo plata que no necesitás. Apostar más para recuperar es la forma más rápida de perder mucho.",
          ]),
          info("Los sistemas de apuestas", [
            "Duplicar la apuesta después de perder (la martingala) y otras progresiones **no cambian la ventaja**: solo cambian cuándo y cuánto perdés.",
            "El conteo funciona porque mira las cartas, no los resultados anteriores.",
          ]),
          quiz(
            "Perdiste cinco manos seguidas. ¿La próxima tenés más chances de ganar?",
            ["Sí, ya me toca", "No: los resultados anteriores no cambian nada"],
            1,
            "Las cartas no se acuerdan de lo que ganaste o perdiste.",
          ),
          quiz(
            "¿Qué hace la martingala (doblar la apuesta después de perder)?",
            [
              "Le gana a la casa",
              "No cambia la ventaja y arriesga mucho para ganar poco",
            ],
            1,
            "Ganás seguido de a poco, pero cuando llega una racha larga perdés todo junto.",
          ),
          quiz(
            "¿Cuándo conviene decidir tu límite de pérdida?",
            [
              "Antes de empezar a jugar",
              "Cuando ya perdí bastante",
              "No hace falta",
            ],
            0,
            "En caliente se decide mal. Y si el juego deja de ser entretenimiento, frená y pedí ayuda.",
          ),
        ],
      },
    ],
  },
  {
    id: 4,
    title: "El conteo",
    desc: "Contá el zapato y quedate con la ventaja",
    icon: "c",
    lessons: [
      {
        id: "l16",
        title: "Por qué funciona contar",
        sum: [
          "Las cartas que salen no vuelven hasta la próxima mezcla.",
          "Si quedan muchas cartas altas, la ventaja pasa a tu lado.",
          "Contar no es memorizar cartas: es llevar un solo número.",
        ],
        steps: [
          info("Las cartas que salen no vuelven", [
            "En un zapato, las cartas repartidas no vuelven hasta la próxima mezcla.",
            "Si salieron muchas cartas chicas, quedan más cartas altas. Y al revés.",
          ]),
          ...scene([
            {
              row: ["2c", "5d", "3h", "6s", "4c", "5h", "2d", "9s"],
              say: "Supongamos que en las primeras manos del zapato salen estas 8 cartas: siete chicas y un 9.",
            },
            {
              row: ["2c", "5d", "3h", "6s", "4c", "5h", "2d", "9s"],
              say: "Esas cartas chicas ya no están. Lo que queda en el zapato tiene **más dieces y ases** que lo normal: ahora el zapato te favorece a vos.",
            },
          ]),
          info("Las cartas altas te ayudan", [
            "Con muchos 10 y ases salen más blackjacks (que vos cobrás 3 a 2 y el crupier no), tus dobles salen mejor y el crupier se pasa más con 12 a 16, porque **está obligado a pedir**.",
          ]),
          info("Las chicas ayudan a la casa", [
            "Con muchas cartas chicas el crupier llega a 17 sin pasarse y tus dobles fallan.",
            "El conteo te dice cuál de las dos situaciones tenés, sin memorizar ninguna carta.",
          ]),
          quiz(
            "Salieron muchas cartas chicas. ¿Qué queda en el zapato?",
            ["Más cartas altas", "Más cartas chicas", "Lo mismo de siempre"],
            0,
            "Si las chicas ya salieron, en proporción quedan más altas.",
          ),
          quiz(
            "¿Por qué un zapato con muchas cartas altas te favorece?",
            [
              "Porque el crupier está obligado a pedir con 12 a 16 y se pasa más",
              "Porque el crupier juega peor",
              "Porque las cartas altas pagan más",
            ],
            0,
            "Y además salen más blackjacks y tus dobles mejoran.",
          ),
          quiz(
            "¿Contar cartas es memorizar todas las cartas que salieron?",
            ["Sí", "No: es llevar un solo número que sube y baja"],
            1,
            "Con Hi-Lo llevás un solo número. Lo ves en la próxima lección.",
          ),
        ],
      },
      {
        id: "l17",
        title: "Los valores de las cartas",
        sum: [
          "Hi-Lo: del 2 al 6 valen +1; 7, 8 y 9 valen 0; dieces, figuras y ases valen −1.",
          "Sumá el valor de cada carta que ves: ese total es el conteo corrido (running count).",
          "Un mazo completo suma 0.",
        ],
        steps: [
          ...scene([
            {
              bank: 100,
              rc: 0,
              left: 6,
              say: "Volvés a la mesa, ahora para contar. El sistema **Hi-Lo** le da a cada carta un valor: **+1, 0 o −1**. Mirá qué pasa cuando salen cartas.",
            },
            {
              bet: 10,
              bank: 90,
              d: ["5d", "Kc?"],
              p: ["3h", "6s"],
              tags: true,
              say: "Te tocan un 3 y un 6, y el crupier muestra un 5. Las tres son **bajas (del 2 al 6)**: cada una vale **+1**.",
            },
            {
              rc: 3,
              tags: true,
              say: "Salieron tres cartas bajas: en el zapato quedan más altas que antes, y eso te conviene. El **conteo corrido** (*running count*) sube a **+3**.",
            },
            {
              p: ["3h", "6s", "8c"],
              tags: true,
              say: "Pedís y sale un 8. **El 7, el 8 y el 9 valen 0**: no cambian nada. Seguís en **+3**.",
            },
            {
              d: ["5d", "Kc"],
              tags: true,
              ask: {
                q: "El crupier da vuelta una K. ¿Cuánto vale?",
                o: ["+1", "0", "−1"],
                a: 2,
                x: "Las altas (10, J, Q, K y As) valen −1: quedan menos cartas altas en el zapato.",
              },
            },
            {
              rc: 2,
              d: ["5d", "Kc", "9h"],
              stamp: { d: "bust", p: "win" },
              bank: 110,
              tags: true,
              say: "La K resta 1: **+2**. El crupier pide y saca un 9, neutro: tiene **24**, se pasó. Terminás la ronda con conteo **+2**.",
            },
          ]),
          info(
            "Los valores",
            [
              "Cuando sale una carta baja, quedan más altas: es bueno para vos, **sumá 1**.",
              "Cuando sale una alta, **restá 1**. Las del medio no cambian nada.",
              "Sumá a medida que ves cada carta. Ese total es tu **conteo corrido** (*running count*).",
            ],
            { v: "values" },
          ),
          {
            t: "deal",
            title: "Miralo en acción",
            intro:
              "Estas son las cartas de una ronda. Repartilas de a una y sumá el valor de cada una.",
            cards: ["2s", "5h", "Kc", "6d", "9s", "3h"],
            after: [
              "Salieron cuatro cartas bajas y una alta: el zapato que queda tiene más cartas altas de lo normal.",
              "Tu conteo corrido es **+3**. Cuánto pesa eso depende de cuántos mazos quedan: lo ves en la lección 19.",
            ],
          },
          {
            t: "tags",
            title: "Probalo",
            cards: ["5h", "Ks", "8d", "2c", "Ah"],
          },
          quiz(
            "¿Cuánto vale un 7 en Hi-Lo?",
            ["+1", "0", "−1"],
            1,
            "El 7, el 8 y el 9 son neutros.",
          ),
          quiz(
            "¿Cuánto vale un As en Hi-Lo?",
            ["+1", "0", "−1"],
            2,
            "El As es carta alta: −1.",
          ),
          quiz(
            "Un mazo completo tiene 20 cartas de +1, 12 de 0 y 20 de −1. ¿Cuánto suma?",
            ["0", "+20", "−20"],
            0,
            "Las +1 y las −1 se cancelan: un mazo completo suma 0. Por eso Hi-Lo es un sistema balanceado.",
          ),
        ],
      },
      {
        id: "l18",
        title: "El conteo corrido",
        sum: [
          "El conteo corrido arranca en 0 al mezclar y sigue hasta la próxima mezcla.",
          "Contá todas las cartas que ves: las tuyas, las de los demás y las del crupier.",
          "Cancelá de a pares: una alta y una baja juntas suman 0.",
        ],
        steps: [
          ...scene([
            {
              bank: 100,
              rc: 0,
              left: 6,
              others: [{ name: "Ana", cards: [] }],
              say: "El conteo corrido arranca en **0** cuando mezclan y sigue mano tras mano hasta la próxima mezcla. Contás **todas** las cartas que ves, también las de los demás.",
            },
            {
              bet: 10,
              bank: 90,
              others: [{ name: "Ana", cards: ["Kh", "4c"] }],
              d: ["5h", "10c?"],
              p: ["9s", "Qd"],
              tags: true,
              say: "Primera ronda: Ana tiene K y 4, vos 9 y Q, y el crupier muestra un 5.",
            },
            {
              tags: true,
              ask: {
                q: "¿Cuánto da el conteo hasta acá?",
                o: ["−1", "0", "+1"],
                a: 1,
                x: "La K se cancela con el 4, tu Q con el 5 del crupier y el 9 es neutro: 0.",
              },
            },
            {
              tags: true,
              say: "Ese es el truco: **cancelar de a pares**. Una alta y una baja juntas suman 0, así que no sumás carta por carta: solo mueven el conteo las que sobran.",
            },
            {
              d: ["5h", "10c"],
              rc: -1,
              tags: true,
              say: "Ana y vos se plantan. El crupier da vuelta un 10: **−1**.",
            },
            {
              d: ["5h", "10c", "7s"],
              stamp: { d: "bust", p: "win" },
              bank: 110,
              tags: true,
              say: "Pide y saca un 7: **22**, se pasó. El 7 es neutro: el conteo queda en **−1**, y así sigue en la próxima mano.",
            },
            {
              reset: true,
              bank: 100,
              bet: 10,
              rc: -1,
              left: 6,
              others: [{ name: "Ana", cards: ["8d", "8h"] }],
              d: ["2c", "9h?"],
              p: ["Ad", "3s"],
              tags: true,
              say: "Mano nueva, pero el conteo **no vuelve a 0**: arrancás en −1. Ana tiene dos 8, el crupier muestra un 2 y vos, As y 3.",
            },
            {
              tags: true,
              ask: {
                q: "¿Cuánto es el conteo corrido ahora?",
                o: ["−1", "0", "+1"],
                a: 1,
                x: "Venías en −1. Los 8 son neutros, el 2 y el 3 suman 2 y el As resta 1: −1 + 2 − 1 = 0.",
              },
            },
            {
              rc: 0,
              say: "Conteo **0**. Así se lleva durante todo el zapato: cada carta que ves lo mueve, hasta que mezclan.",
            },
          ]),
          {
            t: "deal",
            title: "Contá conmigo",
            intro: "Repartí las cartas y mirá cómo se mueve el conteo.",
            cards: ["10h", "3c", "Ad", "5s", "7h", "Jc", "4d", "2s"],
            after: [
              "Terminaste en **+1**. Fijate cómo las altas y las bajas se fueron cancelando.",
            ],
          },
          {
            t: "count",
            title: "Ahora vos",
            intro: "Mirá las 8 cartas y después decí el conteo.",
            cards: ["6s", "Kd", "3h", "9c", "2d", "Qs", "5c", "4h"],
            ms: 1300,
            options: ["+1", "+2", "+3", "+4"],
            answer: 2,
            explain:
              "6 (+1), K (−1), 3 (+1), 9 (0), 2 (+1), Q (−1), 5 (+1), 4 (+1): +3.",
          },
          {
            t: "count",
            title: "Otra más",
            intro: "Esta vez salen muchas altas.",
            cards: ["Ac", "10d", "8s", "Jh", "3d", "Kc", "7s", "Qd"],
            ms: 1200,
            options: ["−2", "−3", "−4", "−5"],
            answer: 2,
            explain:
              "A (−1), 10 (−1), 8 (0), J (−1), 3 (+1), K (−1), 7 (0), Q (−1): −4.",
          },
          quiz(
            "¿El conteo corrido vuelve a 0 en cada mano?",
            ["Sí", "No: sigue hasta que mezclan el zapato"],
            1,
            "Se lleva durante todo el zapato.",
          ),
        ],
      },
      {
        id: "l19",
        title: "El conteo real",
        sum: [
          "Conteo real = conteo corrido ÷ mazos que quedan.",
          "Los mazos que quedan se estiman mirando la bandeja de descarte.",
          "En esta app se redondea hacia abajo: +2,7 cuenta como +2.",
        ],
        steps: [
          ...scene([
            {
              rc: 6,
              left: 5,
              say: "Vas jugando y el conteo corrido es **+6**. ¿Es mucho? Depende de cuántas cartas quedan por repartir.",
            },
            {
              left: 1,
              say: "Si quedara **un solo mazo**, +6 serían seis cartas altas de más en apenas 52 cartas: muchísimo.",
            },
            {
              left: 6,
              say: "Con **6 mazos** por repartir, esas seis altas de más se reparten entre 312 cartas: casi no se notan.",
            },
            {
              left: 3,
              say: "Para comparar se usa el **conteo real** (*true count*): el conteo corrido dividido por los **mazos que quedan**.",
            },
            {
              ask: {
                q: "Corrido +6 y quedan 3 mazos. ¿Cuál es el conteo real?",
                o: ["+2", "+3", "+6"],
                a: 0,
                x: "+6 ÷ 3 = +2.",
              },
            },
            {
              tc: 2,
              say: "Conteo real **+2**. Es el número que mirás para apostar y para las jugadas que cambian con el conteo.",
            },
            {
              rc: 9,
              left: 4,
              tc: null,
              say: "Más tarde: corrido **+9** y quedan **4 mazos**.",
            },
            {
              ask: {
                q: "¿Cuál es el conteo real?",
                o: ["+2", "+3", "+9"],
                a: 0,
                x: "9 ÷ 4 = 2,25. En esta app se redondea hacia abajo: +2.",
              },
            },
            {
              tc: 2,
              say: "**+2**: siempre redondeás hacia abajo, que es lo más prudente para apostar.",
            },
          ]),
          info(
            "La bandeja de descarte",
            [
              "Los mazos que quedan se estiman mirando la **bandeja de descarte**, donde van las cartas ya jugadas.",
              "En un zapato de 6 mazos, si en la bandeja hay 3, quedan 3 por repartir.",
            ],
            { v: "tray", shoe: 6, played: 3 },
          ),
          info("Redondeá hacia abajo", [
            "En esta app el conteo real se redondea **hacia abajo**: +2,7 cuenta como +2 y −0,5 como −1.",
            "Es lo más prudente para apostar. Y para jugar las desviaciones da lo mismo: se mira si llegaste al índice.",
          ]),
          quiz(
            "Conteo corrido +8 y quedan 4 mazos. ¿Conteo real?",
            ["+2", "+4", "+8", "+1"],
            0,
            "+8 ÷ 4 = +2.",
          ),
          quiz(
            "Conteo corrido +9 y quedan 2 mazos. ¿Conteo real?",
            ["+3", "+4", "+5"],
            1,
            "9 ÷ 2 = 4,5. Redondeando hacia abajo: +4.",
          ),
          quiz(
            "Conteo corrido −6 y quedan 3 mazos. ¿Conteo real?",
            ["−2", "+2", "−3"],
            0,
            "−6 ÷ 3 = −2.",
          ),
          quiz(
            "Conteo corrido +5 y quedan 5 mazos. ¿Conteo real?",
            ["+1", "+5", "0"],
            0,
            "+5 ÷ 5 = +1.",
          ),
        ],
      },
      {
        id: "l20",
        title: "Apostar según el conteo",
        sum: [
          "Cada punto de conteo real mueve la ventaja alrededor de 0,5 %.",
          "La escala: hasta +1, 1 unidad; +2, 2; +3, 4; +4, 6; +5 o más, 8.",
          "Subí y bajá la apuesta de a poco para no llamar la atención.",
        ],
        steps: [
          ...scene([
            {
              rc: 0,
              left: 6,
              tc: 0,
              bet: 10,
              say: "Tu **unidad** es tu apuesta base: acá, 10. Con el conteo real en 0, apostás **1 unidad**.",
            },
            {
              say: "Cada punto de conteo real mueve la ventaja alrededor de **0,5 %** a tu favor. La casa arranca con cerca de 0,5 %: recién con **+1 o +2** la ventaja pasa a ser tuya.",
            },
            {
              rc: 8,
              left: 4,
              tc: 2,
              bet: 20,
              say: "Salieron muchas cartas chicas: corrido **+8** con **4 mazos**, conteo real **+2**. La escala dice **2 unidades**: 20.",
            },
            {
              rc: 12,
              left: 3,
              tc: null,
              bet: null,
              ask: {
                q: "Corrido +12 y quedan 3 mazos. ¿Cuánto apostás?",
                o: ["20", "40", "60", "80"],
                a: 2,
                x: "+12 ÷ 3 = +4 → 6 unidades → 60.",
              },
            },
            {
              tc: 4,
              bet: 60,
              d: ["7c", "Kd?"],
              p: ["Ah", "Js"],
              stamp: { p: "bj" },
              say: "Conteo real **+4**: apostás **6 unidades**, 60. Te sale blackjack y cobrás 90: con el conteo alto salen más blackjacks, y vos tenés más plata en la mesa.",
            },
            {
              reset: true,
              rc: -4,
              left: 2,
              tc: -2,
              bet: 10,
              say: "Cuando el conteo baja, volvés a **1 unidad**. Corrido −4 con 2 mazos: conteo real −2, apuesta mínima.",
            },
          ]),
          info(
            "Cuánto vale cada punto",
            [
              "Ventaja aproximada según el conteo real, con 6 mazos y buenas reglas.",
            ],
            { v: "edge" },
          ),
          info(
            "Una escala simple",
            ["Tu **unidad** es tu apuesta base. Apostá según el conteo real:"],
            { v: "ramp" },
          ),
          info("En la práctica", [
            "Si tu unidad es 10, con conteo real +3 apostás 40.",
            "Saltar de golpe de 1 a 8 unidades llama mucho la atención: en un casino, subí y bajá de a poco.",
          ]),
          quiz(
            "Conteo real +3 y tu unidad es 10. ¿Cuánto apostás?",
            ["10", "20", "40", "80"],
            2,
            "+3 → 4 unidades → 40.",
          ),
          quiz(
            "Conteo real −2. ¿Cuánto apostás?",
            ["Nada: me levanto", "1 unidad, la mínima", "2 unidades"],
            1,
            "En la mesa, apostá el mínimo. Si podés mirar sin jugar, también podés esperar a que suba (lo ves en la sección 5).",
          ),
          quiz(
            "Conteo corrido +10 y quedan 5 mazos. ¿Cuántas unidades?",
            ["1", "2", "4", "8"],
            1,
            "+10 ÷ 5 = +2 → 2 unidades.",
          ),
        ],
      },
      {
        id: "l21",
        title: "Cuándo el seguro se vuelve buena apuesta",
        sum: [
          "Con conteo real +3 o más, el seguro gana plata: tomalo.",
          "Con menos de +3, nunca: tampoco el pago parejo.",
          "Es la desviación que más vale de todo el Illustrious 18.",
        ],
        steps: [
          info("El seguro y los dieces", [
            "El seguro gana plata si más de un tercio de las cartas que quedan son dieces.",
            "Con el conteo alto quedan muchos dieces. **Con conteo real +3 o más, tomá el seguro.**",
          ]),
          ...scene([
            {
              bank: 100,
              bet: 10,
              tc: 4,
              d: ["Ah", "Kd?"],
              p: ["9h", "8c"],
              say: "Apostaste 10 y el conteo real es **+4**. El crupier muestra un As.",
            },
            {
              bank: 90,
              ask: {
                q: "¿Tomás el seguro?",
                o: ["Sí", "No"],
                a: 0,
                x: "Con conteo real +3 o más quedan suficientes dieces: el seguro pasa a ganar plata.",
              },
            },
            { bank: 85, say: "Ponés 5 de seguro, la mitad de tu apuesta." },
            {
              d: ["Ah", "Kd"],
              stamp: { d: "bj", p: "lose" },
              bank: 100,
              say: "Tenía blackjack. Tu 17 pierde los 10, pero el seguro paga 2 a 1: recuperás tus 5 y cobrás 10. Quedás igual que antes de la mano.",
            },
          ]),
          info("La desviación más valiosa", [
            "De todas las jugadas que cambian con el conteo, el seguro es la que más plata vale.",
            "Es la primera del **Illustrious 18**, la lista de desviaciones de la sección 5.",
          ]),
          quiz(
            "Conteo real +1, el crupier muestra As y tenés blackjack. ¿Pago parejo?",
            ["Sí, siempre", "No: con conteo real menor a +3 tampoco conviene"],
            1,
            "El pago parejo es lo mismo que el seguro.",
          ),
          quiz(
            "Conteo corrido +9, quedan 3 mazos y el crupier muestra As. ¿Qué hacés?",
            ["Tomo el seguro", "No lo tomo"],
            0,
            "+9 ÷ 3 = +3: justo en el índice. Tomalo.",
          ),
        ],
      },
      {
        id: "l22",
        title: "Perder mientras ganás",
        sum: [
          "Contando bien tenés alrededor de 1 % de ventaja: es real, pero chica.",
          "La suerte de una noche pesa mucho más que la ventaja.",
          "Una referencia común: una banca de al menos 100 apuestas máximas.",
        ],
        steps: [
          ...scene([
            {
              bank: 920,
              rc: 10,
              left: 2,
              tc: 5,
              bet: 80,
              d: ["10c", "Ad?"],
              p: ["10h", "Qs"],
              say: "Conteo real **+5**: apostás lo máximo, 8 unidades. Te toca **20** contra un 10. Mejor, imposible.",
            },
            {
              d: ["10c", "Ad"],
              stamp: { d: "bj", p: "lose" },
              bank: 920,
              say: "El crupier revisa su carta tapada: un As. **Blackjack**. Perdés 80 en la mejor situación de la noche.",
            },
            {
              reset: true,
              bank: 860,
              rc: 9,
              left: 2,
              tc: 4,
              bet: 60,
              d: ["10d", "Ks?"],
              p: ["10s", "6h"],
              play: {
                a: "S",
                x: "16 contra 10 con conteo real 0 o más: plantate. Es la desviación más famosa del Illustrious 18.",
              },
              say: "Siguiente mano, conteo real **+4**: 6 unidades. Te toca 16 contra un 10. ¿Pedís o te plantás?",
            },
            {
              d: ["10d", "Ks"],
              stamp: { p: "lose" },
              say: "El crupier tenía 20. Jugaste perfecto y perdiste **140 en dos manos**. No es mala suerte rara: pasa todo el tiempo.",
            },
            {
              dots: {
                n: 47,
                label:
                  "noches de 100 manos que terminan abajo, con 1 % de ventaja",
              },
              say: "Contando bien tenés alrededor de **1 % de ventaja**. Es real, pero chica: después de 100 manos, vas abajo casi la mitad de las veces.",
            },
          ]),
          info(
            "Lo que dicen los números",
            [
              "Con 1 % de ventaja y apuesta fija, después de **100 manos** vas abajo casi la mitad de las veces. Después de **10.000**, todavía 1 de cada 5.",
              "Variando la apuesta, como hace un contador, las oscilaciones son todavía más grandes.",
            ],
            {
              v: "tiles",
              items: [
                { v: "47 %", l: "abajo tras 100 manos", tone: "bad" },
                { v: "39 %", l: "tras 1.000", tone: "mid" },
                { v: "19 %", l: "tras 10.000", tone: "good" },
              ],
            },
          ),
          info("La banca", [
            "Por eso los contadores separan una **banca** solo para jugar y apuestan chico en relación a ella.",
            "Una referencia común: tener al menos **100 veces tu apuesta máxima**. Con una apuesta máxima de 80, una banca de 8.000.",
          ]),
          quiz(
            "Jugaste perfecto toda la noche y perdiste. ¿Qué significa?",
            [
              "Que contar no funciona",
              "Nada: es la varianza; la ventaja se ve en miles de manos",
            ],
            1,
            "Una noche es una muestra chiquita.",
          ),
          quiz(
            "¿Para qué sirve una banca grande?",
            [
              "Para impresionar en la mesa",
              "Para aguantar las malas rachas sin quedarte sin plata",
            ],
            1,
            "Con banca chica, una mala racha normal te saca del juego antes de que la ventaja aparezca.",
          ),
        ],
      },
    ],
  },
  {
    id: 5,
    title: "Nivel avanzado",
    desc: "Desviaciones, rendición, banca y cómo jugar sin llamar la atención",
    icon: "crown",
    lessons: [
      {
        id: "l23",
        title: "Las desviaciones",
        sum: [
          "Las desviaciones son jugadas que cambian según el conteo real.",
          "Cada una tiene un índice: el conteo a partir del cual cambia la jugada.",
          "Las más valiosas: el seguro con +3, 16 contra 10 con 0 y 15 contra 10 con +4.",
        ],
        steps: [
          info("Jugar distinto según el conteo", [
            "La estrategia básica supone un zapato neutro. Con el conteo alto o bajo, algunas jugadas cambian: son las **desviaciones**.",
            "Cada una tiene un **índice**: el conteo real a partir del cual cambia la jugada.",
          ]),
          ...scene([
            {
              bank: 100,
              bet: 10,
              tc: 1,
              d: ["10c", "7s?"],
              p: ["10h", "6d"],
              say: "Apostaste 10 y tenés 16 contra un 10, pero ahora el conteo real es **+1**: quedan más cartas altas de lo normal.",
            },
            {
              bank: 90,
              play: {
                a: "S",
                x: "Con conteo real 0 o más, plantate: con tantas cartas altas, pedir te pasa demasiado seguido.",
              },
              say: "Con conteo real +1, ¿qué hacés?",
            },
            {
              d: ["10c", "7s"],
              meter: true,
              stamp: { p: "lose" },
              say: "El crupier tenía 17. Esta vez perdiste: la desviación gana a la larga, no en cada mano.",
            },
          ]),
          info(
            "Las más valiosas",
            [
              "Esta es la parte de arriba del **Illustrious 18**. En el juego se aplican cuando el conteo real llega al índice o lo supera.",
            ],
            { v: "devlist", which: "top" },
          ),
          info(
            "Las negativas",
            [
              "Con conteo bajo, algunas plantadas pasan a pedir. Se aplican cuando el conteo real queda **por debajo** del índice.",
            ],
            { v: "devlist", which: "neg" },
          ),
          decide(
            "3",
            ["10c", "2d"],
            "S",
            "Con conteo real +2 o más, plantate con 12 contra 3.",
            { tc: 2 },
          ),
          decide(
            "4",
            ["9h", "3c"],
            "H",
            "Con conteo real por debajo de 0, pedí con 12 contra 4.",
            { tc: -1 },
          ),
          decide(
            "10",
            ["6s", "4d"],
            "D",
            "Con conteo real +4 o más, doblá 10 contra 10.",
            { tc: 4 },
          ),
          decide(
            "6",
            ["Kc", "Qh"],
            "S",
            "Separar dieces contra 6 recién conviene con +4. Con +2, plantate.",
            { tc: 2 },
          ),
          quiz(
            "Conteo real +5 y tenés 10,10 contra un 5. ¿Qué hacés?",
            ["Me planto", "Separo"],
            1,
            "+5 es el índice: separá. Ojo: en un casino es la jugada que más llama la atención.",
          ),
        ],
      },
      {
        id: "l24",
        title: "Rendición y el Fab 4",
        sum: [
          "Rendirse es abandonar la mano y recuperar la mitad de la apuesta.",
          "En mesas S17: 16 contra 9, 10 y As, y 15 contra 10.",
          "Solo se puede con tus dos primeras cartas, y no después de separar.",
        ],
        steps: [
          info("Rendirse", [
            "La **rendición tardía** (*late surrender*) te deja abandonar tu mano después de que el crupier revisó que no tiene blackjack. Perdés la mitad de la apuesta.",
            "Solo se puede con tus dos primeras cartas.",
          ]),
          ...scene([
            {
              bank: 100,
              bet: 10,
              rules: { surrender: true },
              d: ["10c", "9s?"],
              p: ["10d", "6h"],
              say: "Esta mesa permite **rendirse**. Apostaste 10 y tenés 16 contra un 10.",
            },
            {
              bank: 90,
              act: "R",
              say: "Abandonás la mano y te devuelven la mitad. Tocá **Rendirse**.",
            },
            {
              d: ["10c", "9s"],
              stamp: { p: "surrender" },
              bank: 95,
              say: "Recuperás 5. El crupier tenía 19: jugando la mano, lo más probable era perder los 10.",
            },
          ]),
          info("Cuándo rendirse", [
            "En mesas **S17**: 16 contra 9, 10 o As, y 15 contra 10.",
            "En mesas **H17** se suman 15 contra As, 17 contra As y 8,8 contra As.",
          ]),
          info("El Fab 4", ["Cuatro rendiciones que dependen del conteo:"], {
            v: "devlist",
            which: "fab4",
          }),
          decide(
            "9",
            ["10s", "5c"],
            "R",
            "Con conteo real +2 o más, rendite con 15 contra 9.",
            { rules: { surrender: true }, tc: 2 },
          ),
          decide(
            "10",
            ["9d", "5h"],
            "H",
            "14 contra 10 se rinde recién con +3. Con +1, pedí.",
            { rules: { surrender: true }, tc: 1 },
          ),
          quiz(
            "¿Te podés rendir después de pedir una carta?",
            ["Sí", "No: solo con las dos primeras cartas"],
            1,
            "Con tres cartas la rendición ya no está disponible.",
          ),
        ],
      },
      {
        id: "l25",
        title: "Tu banca y el riesgo",
        sum: [
          "Aun con ventaja, una mala racha te puede dejar sin banca.",
          "Si la banca baja mucho, bajá la unidad.",
          "Nunca metas plata de otra cosa para recuperar.",
        ],
        steps: [
          info("El riesgo de ruina", [
            "Aun con ventaja, una mala racha te puede dejar sin banca.",
            "Ese riesgo depende de tu ventaja, de cuánto variás la apuesta y del tamaño de tu banca comparado con lo que apostás.",
          ]),
          info(
            "Reglas prácticas",
            [
              "Apostá chico en relación a tu banca.",
              "Si la banca baja mucho, **bajá la unidad**. Si sube, la podés subir de a poco.",
              "Nunca metas plata de otra cosa para recuperar.",
            ],
            {
              v: "tiles",
              items: [
                { v: "8.000", l: "banca" },
                { v: "10", l: "unidad" },
                { v: "80", l: "apuesta máxima" },
              ],
            },
          ),
          quiz(
            "Tu banca bajó a la mitad. ¿Qué conviene?",
            ["Duplicar la unidad para recuperar", "Bajar la unidad"],
            1,
            "Con menos banca, apuestas más chicas: así seguís en juego.",
          ),
          quiz(
            "Con la ventaja a tu favor, ¿podés perder toda la banca?",
            [
              "No, es imposible",
              "Sí, si la banca es chica para lo que apostás",
            ],
            1,
            "La ventaja gana a la larga, pero hay que llegar al largo plazo.",
          ),
        ],
      },
      {
        id: "l26",
        title: "Que no te descubran",
        sum: [
          "Contar con la cabeza es legal, pero el casino puede pedirte que no juegues.",
          "Usar el celular u otro aparato en la mesa está prohibido.",
          "Variá la apuesta de a poco y comportate como un jugador más.",
        ],
        steps: [
          info("Es legal, pero…", [
            "Contar con la cabeza no es trampa. Pero el casino puede pedirte que dejes de jugar al blackjack, limitarte las apuestas o mezclar más seguido.",
            "**Usar el celular o cualquier aparato en la mesa para contar está prohibido**, y en muchos lugares es ilegal.",
          ]),
          info("Lo que llama la atención", [
            "Saltos grandes de apuesta justo cuando el conteo sube, separar dieces, mirar fijo todas las cartas y jugar demasiado perfecto.",
            "Los contadores varían la apuesta de forma gradual y se comportan como un jugador más.",
          ]),
          info("Entrar y salir", [
            "Algunos miran la mesa sin jugar y entran cuando el conteo sube (se llama **wonging**). Muchos casinos no dejan entrar a mitad de zapato.",
          ]),
          quiz(
            "¿Contar cartas mentalmente es trampa?",
            ["Sí", "No, pero el casino puede pedirte que no juegues"],
            1,
            "Es una habilidad, no una trampa. Pero el casino decide a quién deja jugar.",
          ),
          quiz(
            "¿Qué jugada llama más la atención?",
            ["Plantarse con 17", "Separar dieces", "Pedir con 11"],
            1,
            "Casi nadie separa dieces salvo los contadores.",
          ),
        ],
      },
      {
        id: "l27",
        title: "Online contra casino físico",
        sum: [
          "En el online automático (RNG) se mezcla en cada mano: contar no sirve.",
          "En el online en vivo suelen cortar cerca de la mitad: sirve muy poco.",
          "La estrategia básica sirve en cualquier mesa.",
        ],
        steps: [
          info("Online automático (RNG)", [
            "En el blackjack online sin crupier real, el programa **mezcla todas las cartas en cada mano**.",
            "El conteo vuelve a cero cada vez: **contar no sirve**. La estrategia básica sí.",
          ]),
          info("Online en vivo", [
            "Con crupier real por video se usan zapatos de 8 mazos, pero suelen cortar cerca de la mitad.",
            "Contar sirve muy poco: los conteos altos llegan tarde y casi nunca.",
          ]),
          info("Casino físico", [
            "Lo mejor: un zapato mezclado a mano, con el corte bien atrás (75 % o más) y que pague 3:2.",
            "Las **máquinas de mezcla continua** funcionan como el RNG: contar no sirve.",
          ]),
          info("Probalo", [
            'En **Jugar → Mesa** podés elegir "Online automático" y ver cómo el conteo se borra en cada mano.',
          ]),
          quiz(
            "¿Sirve contar en un blackjack online automático?",
            ["Sí", "No: se mezcla en cada mano"],
            1,
            "Sin cartas que salgan del juego, no hay nada que contar.",
          ),
          quiz(
            "¿Qué mesa es mejor para contar?",
            [
              "Zapato con corte al 50 %",
              "Zapato con corte al 80 %",
              "Máquina de mezcla continua",
            ],
            1,
            "Cuanto más atrás el corte, más seguido llegan los conteos altos.",
          ),
          quiz(
            "¿La estrategia básica sirve online?",
            ["No sirve", "Sirve siempre: baja la ventaja de la casa"],
            1,
            "La estrategia básica funciona en cualquier mesa.",
          ),
        ],
      },
    ],
  },
  {
    id: 6,
    title: "Práctica de casino",
    desc: "Todo junto: elegir la mesa, contar, apostar y saber cuándo irte",
    icon: "target",
    lessons: [
      {
        id: "l28",
        title: "Elegir la mesa",
        sum: [
          "Buscá blackjack 3:2, el corte bien atrás y, si se puede, que el crupier se plante con 17 blando.",
          "Evitá las mesas 6:5 y las máquinas de mezcla continua: ahí contar no sirve.",
          "Tu unidad es el mínimo de la mesa, y tu banca tiene que aguantar 100 apuestas máximas.",
        ],
        steps: [
          ...scene([
            {
              bank: 1000,
              sign: [
                { k: "Apuesta mínima", v: "$10" },
                { k: "El blackjack paga", v: "3 a 2", tone: "good" },
                { k: "El crupier", v: "se planta con 17 blando" },
                { k: "Mazos", v: "6" },
              ],
              say: "Llegás al casino con **1.000** para jugar. Antes de sentarte, leé el cartel de la mesa: ahí están las reglas que importan.",
            },
            {
              sign: [
                { k: "Apuesta mínima", v: "$10" },
                { k: "El blackjack paga", v: "3 a 2", tone: "good" },
                { k: "El crupier", v: "se planta con 17 blando" },
                { k: "Mazos", v: "6" },
              ],
              say: "Esta mesa paga el blackjack **3 a 2**, el crupier **se planta con 17 blando** (S17) y usa 6 mazos. Hasta acá, todo bien.",
            },
            {
              sign: [
                { k: "Carta de corte", v: "al 75 % del zapato", tone: "good" },
                { k: "Mezcla", v: "a mano" },
              ],
              say: "Ahora mirá dónde ponen la **carta de corte** (*cut card*): si la ponen a tres cuartos del zapato, se reparte el **75 %** antes de mezclar. Cuanto más atrás, más seguido llegan los conteos altos.",
            },
            {
              sign: [
                { k: "El blackjack paga", v: "6 a 5", tone: "bad" },
                { k: "El crupier", v: "pide con 17 blando" },
                { k: "Mezcla", v: "máquina continua", tone: "bad" },
              ],
              ask: {
                q: "La mesa de al lado paga 6:5 y usa una máquina de mezcla continua. ¿Te sirve para contar?",
                o: ["Sí, si cuento rápido", "No"],
                a: 1,
                x: "Con mezcla continua las cartas vuelven al mazo enseguida: no hay nada que contar. Y el 6:5 solo ya le suma a la casa alrededor de 1,4 %.",
              },
            },
          ]),
          info(
            "Tu unidad y tu banca",
            [
              "Tu **unidad** es la apuesta mínima de la mesa. Con la escala de 1 a 8 unidades, tu apuesta máxima es de **8 unidades**.",
              "Una referencia prudente: que tu banca alcance para **100 apuestas máximas**. Con unidad de 10, la máxima es 80 y la banca, 8.000.",
            ],
            {
              v: "tiles",
              items: [
                { v: "10", l: "unidad" },
                { v: "80", l: "apuesta máxima" },
                { v: "8.000", l: "banca" },
              ],
            },
          ),
          quiz(
            "Tenés 4.000 para jugar. ¿Qué unidad te conviene?",
            ["5", "10", "25"],
            0,
            "Con unidad de 5, la apuesta máxima es 40, y 100 veces 40 son 4.000. Con unidad de 10 necesitarías 8.000.",
          ),
          quiz(
            "¿Qué mesa elegís para contar?",
            [
              "3:2, 6 mazos, corte al 75 %",
              "3:2, 8 mazos, corte a la mitad",
              "6:5, un solo mazo",
            ],
            0,
            "3:2 y corte bien atrás. Con el corte a la mitad los conteos altos casi no llegan, y el 6:5 cuesta más de lo que te da contar.",
          ),
          quiz(
            "¿En qué momento te conviene sentarte?",
            [
              "Cuando están mezclando",
              "En cualquier momento, da igual",
              "Con el zapato por la mitad",
            ],
            0,
            "Si te sentás después de la mezcla, contás desde la primera carta. A mitad de zapato no sabés qué salió antes.",
          ),
        ],
      },
      {
        id: "l29",
        title: "Contar una mesa llena",
        sum: [
          "Contá todas las cartas que ves: las del crupier, las tuyas y las de los demás jugadores.",
          "Cancelá de a pares mientras caen: al final de la ronda solo cuenta lo que sobró.",
          "Si alguien se pasa, el crupier levanta sus cartas enseguida: contalas apenas salen.",
        ],
        steps: [
          info("Todas las cartas cuentan", [
            "En la mesa no estás solo. **Todas las cartas que se ven** cambian lo que queda en el zapato: las del crupier, las tuyas y las de los otros jugadores.",
            "Con más jugadores salen más cartas por ronda: cancelá de a pares para no atrasarte.",
          ]),
          ...scene([
            {
              bank: 1000,
              rc: 0,
              left: 6,
              others: [
                { name: "Ana", cards: [] },
                { name: "Bruno", cards: [] },
              ],
              say: "Zapato recién mezclado: el conteo corrido (*running count*) arranca en **0**. En la mesa están Ana y Bruno.",
            },
            {
              bet: 10,
              bank: 990,
              others: [
                { name: "Ana", cards: ["Kd", "5c"] },
                { name: "Bruno", cards: ["9h", "9s"] },
              ],
              d: ["4s", "Qh?"],
              p: ["Jc", "2d"],
              say: "Primera ronda. Ana tiene K y 5, Bruno 9 y 9, vos J y 2, y el crupier muestra un 4. Contá todo lo que se ve.",
            },
            {
              tags: true,
              ask: {
                q: "¿Cuánto vale el conteo corrido ahora?",
                o: ["0", "+1", "+3"],
                a: 1,
                x: "La K de Ana se cancela con su 5, tu J con tu 2, los 9 de Bruno son neutros y el 4 del crupier suma: +1.",
              },
            },
            {
              rc: 1,
              tags: true,
              others: [
                { name: "Ana", cards: ["Kd", "5c", "7h"] },
                { name: "Bruno", cards: ["9h", "9s"] },
              ],
              say: "Ana pide y saca un 7: **22**, se pasó. El crupier levanta sus cartas enseguida, así que contá el 7 apenas cae. Es neutro: seguís en **+1**.",
            },
            {
              others: [
                { name: "Ana", cards: [] },
                { name: "Bruno", cards: ["9h", "9s"] },
              ],
              play: {
                a: "S",
                x: "12 contra un 4: plantate y dejá que pida el crupier. Contar no te cambia esta jugada.",
              },
              say: "Te toca a vos: **12** contra un 4. ¿Pedís o te plantás?",
            },
            {
              d: ["4s", "Qh", "9c"],
              stamp: { d: "bust", p: "win" },
              bank: 1010,
              say: "El crupier da vuelta una Q: 14, y pide. Un 9: **23**, se pasó. Ganás 10, y Bruno también.",
            },
            {
              tags: true,
              ask: {
                q: "Terminó la ronda. ¿Cuánto es el conteo corrido?",
                o: ["−1", "0", "+1"],
                a: 1,
                x: "Venías en +1. La Q del crupier resta 1 y el 9 es neutro: 0.",
              },
            },
            {
              rc: 0,
              say: "Conteo corrido **0**. En una ronda viste 11 cartas y el número casi no se movió: eso pasa seguido, por eso conviene cancelar de a pares en vez de sumar carta por carta.",
            },
          ]),
          quiz(
            "Un jugador se pasa y el crupier se lleva sus cartas antes de que termine la ronda. ¿Las contás?",
            ["No, ya no están", "Sí, apenas salen"],
            1,
            "Esas cartas ya salieron del zapato: cambian lo que queda igual que las demás.",
          ),
          quiz(
            "En una ronda salen: 2, 5, K, 8, A, 3 y 6. ¿Cuánto cambió el conteo?",
            ["+1", "+2", "+3"],
            1,
            "2 (+1), 5 (+1), K (−1), 8 (0), A (−1), 3 (+1), 6 (+1): +2.",
          ),
          {
            t: "count",
            title: "Una ronda entera",
            intro:
              "Tres jugadores y el crupier: mirá las cartas de la ronda y después decí el conteo.",
            cards: ["Qs", "4h", "7d", "2c", "Ks", "5d", "9c", "3h", "Ad"],
            ms: 1100,
            options: ["−1", "0", "+1", "+2"],
            answer: 2,
            explain:
              "Q (−1), 4 (+1), 7 (0), 2 (+1), K (−1), 5 (+1), 9 (0), 3 (+1), A (−1): +1.",
          },
        ],
      },
      {
        id: "l30",
        title: "El conteo manda la apuesta",
        sum: [
          "Antes de cada mano: conteo corrido ÷ mazos que quedan = conteo real. Con eso elegís la apuesta.",
          "Hasta +1, 1 unidad; +2, 2; +3, 4; +4, 6; +5 o más, 8.",
          "Subí y bajá de a poco: un salto de 1 a 8 unidades llama la atención.",
        ],
        steps: [
          ...scene([
            {
              bank: 1000,
              rc: 2,
              left: 5,
              say: "Vas por el primer mazo del zapato. Conteo corrido **+2** y quedan unos **5 mazos**.",
            },
            {
              ask: {
                q: "¿Cuál es el conteo real (true count)?",
                o: ["0", "+1", "+2"],
                a: 0,
                x: "+2 ÷ 5 = 0,4. Redondeado hacia abajo: 0. Apostás el mínimo.",
              },
            },
            {
              tc: 0,
              bet: 10,
              bank: 990,
              say: "Conteo real **0**: apostás **1 unidad**, 10.",
            },
            {
              reset: true,
              bank: 1000,
              rc: 9,
              left: 3,
              say: "Un rato después salieron muchas cartas chicas. Conteo corrido **+9** y quedan **3 mazos**.",
            },
            {
              ask: {
                q: "¿Cuántas unidades apostás?",
                o: ["1", "2", "4", "8"],
                a: 2,
                x: "+9 ÷ 3 = +3. Con conteo real +3, la escala dice 4 unidades: 40.",
              },
            },
            {
              tc: 3,
              bet: 40,
              bank: 960,
              say: "Conteo real **+3**: **4 unidades**, 40. Ahora la ventaja es tuya.",
            },
            {
              d: ["6c", "Kd?"],
              p: ["Ah", "Ks"],
              stamp: { p: "bj" },
              bank: 1060,
              say: "¡Blackjack! Con 40 en juego cobrás 60. Por eso se apuesta más con el conteo alto: quedan más dieces y ases, y salen más blackjacks.",
            },
            {
              reset: true,
              bank: 1050,
              rc: -5,
              left: 2,
              tc: -2,
              bet: 10,
              say: "Más adelante el zapato se dio vuelta: corrido **−5** con **2 mazos** por delante, conteo real **−2**. Volvés a la apuesta mínima.",
            },
          ]),
          info(
            "De a poco",
            [
              "En un casino, saltar de 10 a 80 de una mano a la otra es justo la señal que buscan.",
              "Los contadores suben **de a un escalón** por mano y bajan cuando el conteo baja o después de perder una mano, como haría cualquier jugador.",
            ],
            { v: "ramp" },
          ),
          quiz(
            "Conteo corrido +12 y quedan 4 mazos. Tu unidad es 25. ¿Cuánto apostás?",
            ["25", "50", "100", "150"],
            2,
            "+12 ÷ 4 = +3 → 4 unidades → 100.",
          ),
          quiz(
            "Conteo corrido +7 y quedan 2 mazos. ¿Cuántas unidades?",
            ["2", "4", "6"],
            1,
            "+7 ÷ 2 = 3,5. Redondeado hacia abajo, +3 → 4 unidades.",
          ),
          quiz(
            "Venías apostando 1 unidad y el conteo real salta a +5. ¿Qué hacés en una mesa de casino?",
            [
              "Salto directo a 8 unidades",
              "Subo a 2 o 4 y sigo subiendo si el conteo se mantiene",
            ],
            1,
            "La escala dice 8, pero un salto así llama mucho la atención. Subir de a poco cuesta un poco de ventaja y te deja seguir jugando.",
          ),
        ],
      },
      {
        id: "l31",
        title: "Cuándo levantarte",
        sum: [
          "Con el conteo real en −2 o menos, una buena opción es levantarte hasta la próxima mezcla.",
          "Antes de sentarte, decidí cuánto podés perder y cuánto tiempo vas a jugar, y respetalo.",
          "Si te piden que dejes de jugar al blackjack, agradecé y andate: no discutas.",
        ],
        steps: [
          ...scene([
            {
              bank: 800,
              rc: -8,
              left: 4,
              tc: -2,
              bet: 10,
              say: "Llevás un rato perdiendo y el zapato viene mal: corrido **−8** con **4 mazos**, conteo real **−2**.",
            },
            {
              ask: {
                q: "¿Qué conviene?",
                o: [
                  "Subir la apuesta para recuperar",
                  "Apostar el mínimo o levantarme hasta la mezcla",
                ],
                a: 1,
                x: "Con el conteo negativo la ventaja es de la casa. Lo mejor es apostar el mínimo o directamente no jugar hasta que mezclen.",
              },
            },
            {
              bet: null,
              say: "Te levantás y mirás la mesa desde la barra. Seguís contando: cuando mezclen, volvés con el conteo en 0.",
            },
          ]),
          info("Antes de sentarte, decidí", [
            "**Cuánto podés perder hoy.** Si llegás a ese número, terminó la noche: la ventaja se ve en miles de manos, no en una.",
            "**Cuánto tiempo vas a jugar.** Contar cansa, y cansado te equivocás: esos errores cuestan más de lo que te da contar.",
          ]),
          info("Si te piden que te vayas", [
            "Contar con la cabeza es legal, pero el casino puede pedirte que no juegues al blackjack.",
            "Si pasa, agradecé y andate tranquilo. No discutas ni des explicaciones.",
          ]),
          quiz(
            "Perdiste tu límite de la noche, pero el conteo real está en +4. ¿Qué hacés?",
            ["Sigo: con +4 tengo ventaja", "Me voy: el límite es el límite"],
            1,
            "Una mano con ventaja cambia muy poco a la larga, y romper tus propias reglas cambia mucho. Mañana hay otro zapato.",
          ),
          quiz(
            "¿Qué jugador tiene más chances de que lo descubran?",
            [
              "El que sube la apuesta de a poco y charla con la mesa",
              "El que salta de 10 a 80 cuando el conteo sube",
            ],
            1,
            "Los saltos grandes justo cuando sube el conteo son la señal más clara. Subir de a poco disimula.",
          ),
        ],
      },
      {
        id: "exam",
        title: "Examen final",
        exam: true,
        minutes: 15,
        sum: [
          "Jugaste un zapato completo con la estrategia básica.",
          "Llevaste el conteo y apostaste según el conteo real.",
          "Sabés contar cartas.",
        ],
        steps: [],
      },
    ],
  },
  {
    id: 7,
    title: "Apuestas laterales y variantes",
    desc: "Lo que te ofrecen al costado de la mesa, y otras formas de jugar",
    icon: "sparkle",
    lessons: [
      {
        id: "l32",
        title: "Apuestas laterales",
        sum: [
          "Las apuestas laterales pagan mucho pero tienen mucha más ventaja para la casa que el juego normal.",
          "Pares perfectos, 21+3 y Lucky Ladies le dejan a la casa entre 3 % y más de 10 %.",
          "Si querés ventaja, jugá la mano principal con estrategia básica y conteo.",
        ],
        steps: [
          info("Los casilleros chicos de la mesa", [
            "Al lado de tu apuesta muchas mesas tienen casilleros extra: son **apuestas laterales** (*side bets*).",
            "Se resuelven con tus primeras cartas, pagan premios grandes y no dependen de cómo jugás la mano.",
          ]),
          info("Las más comunes", [
            "**Pares perfectos:** apostás a que tus dos primeras cartas forman un par. La casa se queda con alrededor de **4 a 6 %**.",
            "**21+3:** tus dos cartas y la visible del crupier forman una mano de póker (color, escalera, trío). Alrededor de **3 a 4 %**.",
            "**Lucky Ladies:** apostás a que tus dos cartas suman 20. Puede pasar el **10 %** para la casa.",
          ]),
          info("Comparalo con tu juego", [
            "Con estrategia básica, la casa tiene alrededor de **0,5 %** en la mano principal. Las laterales cuestan de 6 a 20 veces más.",
            "Algunas se pueden ganar contando con sistemas especiales, pero es muy avanzado y los casinos las vigilan. Para empezar: **no las juegues**.",
          ]),
          quiz(
            "¿Por qué los casinos ponen apuestas laterales?",
            [
              "Porque ganan mucho más con ellas que con la mano normal",
              "Para ayudar a los jugadores a recuperar",
              "Porque pagan más que el blackjack",
            ],
            0,
            "Pagan premios grandes, pero la ventaja de la casa es varias veces la del juego normal.",
          ),
          quiz(
            "¿Qué apuesta te cuesta menos a la larga?",
            ["21+3", "La mano principal con estrategia básica", "Lucky Ladies"],
            1,
            "La mano principal con estrategia básica deja a la casa alrededor de 0,5 %.",
          ),
          quiz(
            "¿El resultado de una lateral depende de cómo jugás tu mano?",
            ["Sí", "No: se decide con las primeras cartas"],
            1,
            "Se resuelve apenas salen las cartas: no hay ninguna decisión tuya que la mejore.",
          ),
        ],
      },
      {
        id: "l33",
        title: "Jugar dos manos",
        sum: [
          "Jugar dos manos no cambia la ventaja de cada una.",
          "Dos manos de 50 tienen menos riesgo que una de 100, porque comparten la carta del crupier.",
          "Con el conteo alto, algunos contadores pasan a dos manos para poner más plata con menos riesgo.",
        ],
        steps: [
          info("Dos casilleros, dos manos", [
            "En muchas mesas podés jugar **dos lugares a la vez**. Cada mano se juega por separado, con la misma tabla.",
            "La ventaja de cada mano no cambia: si la casa tiene 0,5 % en una, tiene 0,5 % en cada una.",
          ]),
          info("Menos riesgo por la misma plata", [
            "Una mano de **100** y dos manos de **50** ponen la misma plata en juego.",
            "Pero las dos manos comparten la carta del crupier y no siempre ganan o pierden juntas: el resultado se mueve menos que con una sola mano grande.",
          ]),
          info("Cómo lo usan los contadores", [
            "Con el conteo alto, en vez de apostar una sola mano enorme, pasan a **dos manos**: más plata con ventaja y menos riesgo.",
            "Además se reparten más cartas por ronda, y el conteo avanza más rápido. Ojo: pasar de una mano chica a dos grandes de golpe también llama la atención.",
          ]),
          quiz(
            "Jugando dos manos, ¿cambia la ventaja de la casa en cada una?",
            ["Sí, sube", "No, es la misma", "Sí, baja"],
            1,
            "Cada mano tiene la misma ventaja que si la jugaras sola.",
          ),
          quiz(
            "Con el conteo alto, ¿qué tiene menos riesgo?",
            ["Una mano de 100", "Dos manos de 50"],
            1,
            "Las dos manos no siempre van juntas: con la misma plata, el resultado se mueve menos.",
          ),
        ],
      },
      {
        id: "l34",
        title: "Otras variantes",
        sum: [
          "Spanish 21 juega sin los 10 del mazo y tiene su propia tabla.",
          "Free Bet y Blackjack Switch regalan algo, pero el crupier empata con 22.",
          "El blackjack clásico 3:2 con buenas reglas sigue siendo el mejor para contar.",
        ],
        steps: [
          info("Spanish 21", [
            "Se juega con mazos de 48 cartas: **sacan los 10** (las figuras quedan). Eso solo le suma a la casa alrededor de 2 %.",
            "Para compensar, tiene reglas generosas: tu 21 siempre gana, premios por algunos 21, doblar con cualquier cantidad de cartas y rendición.",
            "Tiene **su propia tabla de estrategia**: la que aprendiste acá no sirve tal cual.",
          ]),
          info("Free Bet y Blackjack Switch", [
            "**Free Bet:** te regalan los dobles con 9, 10 y 11 y muchas separaciones. La trampa: si el crupier termina en **22, empata con todos**.",
            "**Blackjack Switch:** jugás dos manos y podés cambiar la segunda carta entre ellas. A cambio, el blackjack paga **1 a 1** y el crupier también empata con 22.",
          ]),
          info("¿Cuál conviene?", [
            "Cada variante tiene su propia tabla, y el conteo Hi-Lo funciona peor en casi todas.",
            "Para aplicar lo que aprendiste, buscá el **blackjack clásico que paga 3:2** con buenas reglas y el corte bien atrás.",
          ]),
          quiz(
            "En Spanish 21, ¿qué cartas sacan del mazo?",
            ["Los ases", "Los 10 (las figuras quedan)", "Las figuras"],
            1,
            "Se sacan los 10 de los cuatro palos: quedan 48 cartas por mazo.",
          ),
          quiz(
            "¿Cuál es la trampa de Free Bet Blackjack?",
            [
              "No se puede doblar",
              "Si el crupier termina en 22, empata con todos",
              "Paga el blackjack 6:5",
            ],
            1,
            "Con 22 el crupier no se pasa: empata, y eso compensa todo lo que te regalan.",
          ),
          quiz(
            "¿Sirve la tabla que aprendiste en Spanish 21?",
            ["Sí, igual", "No del todo: tiene su propia tabla"],
            1,
            "Sin los 10 cambian las probabilidades, y con ellas varias jugadas.",
          ),
        ],
      },
    ],
  },
];
const EXTRA_LESSONS = {
  use: {
    id: "use",
    title: "Usar el conteo",
    sum: [
      "Antes de apostar, pasá el conteo corrido a conteo real.",
      "El mismo conteo vale más cuantos menos mazos quedan.",
      "La escala te dice cuántas unidades apostar.",
    ],
    steps: [
      { t: "usecount", rc: 6, played: 3, left: 3 },
      { t: "usecount", rc: 6, played: 1, left: 5, earlier: true },
      quiz(
        "Conteo corrido +8 y quedan 2 mazos. ¿Cuántas unidades apostás?",
        ["1", "2", "4", "6"],
        3,
        "+8 ÷ 2 = +4 → 6 unidades.",
      ),
      quiz(
        "Conteo corrido +3 y quedan 5 mazos. ¿Cuántas unidades?",
        ["1", "2", "4"],
        0,
        "+3 ÷ 5 = +0,6 → redondeado hacia abajo, 0 → 1 unidad.",
      ),
    ],
  },
};
const LESSONS = SECTIONS.flatMap((a) =>
  a.lessons.map((e) => ({ ...e, section: a.id })),
);
function getLesson(a) {
  return (
    LESSONS.find((e) => e.id === a) ||
    (EXTRA_LESSONS[a] ? { ...EXTRA_LESSONS[a], section: 0 } : null)
  );
}
function nextLessonId(a) {
  let e = LESSONS.findIndex((t) => t.id === a);
  return e >= 0 && e + 1 < LESSONS.length ? LESSONS[e + 1].id : null;
}
function lessonIndex(a) {
  return LESSONS.findIndex((e) => e.id === a);
}
function lessonMinutes(a) {
  if (a.minutes) return a.minutes;
  return Math.max(2, Math.min(5, Math.round(a.steps.length / 4)));
}
// Abre una lección (el examen final no es una lección: abre el simulador en modo examen).
function openLesson(nav, lesson, replace = false) {
  const [name, params] = lesson.exam
    ? ["shoeChallenge", { mode: "exam", confirmExit: true, flex: true }]
    : ["lesson", { id: lesson.id, confirmExit: true }];
  if (replace) nav.replace(name, params);
  else nav.push(name, params);
}
export {
  LESSONS,
  SECTIONS,
  getLesson,
  lessonIndex,
  lessonMinutes,
  nextLessonId,
  openLesson,
};
