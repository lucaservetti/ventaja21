// Textos de las guías de la web (edge21.app/guias/, edge21.app/en/guides/ y edge21.app/pt/guias/). HTML simple: <b>, <em>,
// <a>. Las armas con: node tools/guias/armar.mjs
export const SITIO = "https://edge21.app";

export const RUTAS = {
  es: { inicio: "/", guias: "/guias/", estrategia: "/guias/estrategia-basica/", conteo: "/guias/contar-cartas/" },
  en: { inicio: "/", guias: "/en/guides/", estrategia: "/en/guides/basic-strategy/", conteo: "/en/guides/card-counting/" },
};

export const COMUN = {
  es: {
    nav: { inicio: "Inicio", guias: "Guías", jugar: "Jugar ahora" },
    pie: "Edge 21 ♠ · Es para aprender: la práctica usa saldo virtual, sin dinero real ni premios.",
    privacidad: "Política de privacidad",
    terminos: "Términos de uso",
    ctaTitulo: "Practícalo gratis en Edge 21",
    ctaTexto: "Lecciones cortas, una mesa que te corrige cada jugada y una ruta de 10 niveles para aprender a contar. Sin dinero real.",
    ctaBoton: "Jugar gratis ahora",
    migas: "Guías",
    leer: "Leer la guía",
    min: "min de lectura",
    faq: "Preguntas frecuentes",
    masGuias: "Más guías",
    gratis: "Gratis",
    premium: "Premium",
  },
  en: {
    nav: { inicio: "Home", guias: "Guides", jugar: "Play now" },
    pie: "Edge 21 ♠ · It's for learning: practice uses a virtual balance, with no real money or prizes.",
    privacidad: "Privacy policy",
    terminos: "Terms of use",
    ctaTitulo: "Practice it for free on Edge 21",
    ctaTexto: "Short lessons, a table that corrects every play and a 10-level path to learn to count. No real money.",
    ctaBoton: "Play free now",
    migas: "Guides",
    leer: "Read the guide",
    min: "min read",
    faq: "Frequently asked questions",
    masGuias: "More guides",
    gratis: "Free",
    premium: "Premium",
  },
};

export const INDICE = {
  es: {
    titulo: "Guías de blackjack gratis | Edge 21",
    descripcion: "Guías claras para jugar blackjack mejor: las reglas, la tabla de estrategia básica interactiva, cuándo doblar y separar, el seguro, 3:2 o 6:5 y cómo contar cartas con Hi-Lo.",
    h1: "Guías de blackjack",
    intro: "Todo lo que necesitas para jugar cada mano bien y entender cómo se cuentan cartas, explicado simple y con ejemplos que puedes tocar.",
  },
  en: {
    titulo: "Free blackjack guides | Edge 21",
    descripcion: "Clear guides to play blackjack better: the rules, the interactive basic strategy chart, when to double and split, insurance, 3:2 vs 6:5 and how to count cards with Hi-Lo.",
    h1: "Blackjack guides",
    intro: "Everything you need to play every hand right and understand how card counting works, explained simply with examples you can tap.",
  },
};

export const ESTRATEGIA = {
  es: {
    titulo: "Tabla de estrategia básica de blackjack (interactiva) | Edge 21",
    descripcion: "La tabla de estrategia básica completa para 6 mazos: toca cualquier casilla y mira qué jugada conviene y por qué. Manos duras, blandas y pares.",
    h1: "Tabla de estrategia básica de blackjack",
    tarjeta: "La jugada correcta para cada mano, casilla por casilla, con el porqué.",
    minutos: 6,
    intro: "La estrategia básica es la forma matemáticamente correcta de jugar cada mano: para cada combinación de tus cartas y la carta visible del crupier, hay una jugada que pierde menos (o gana más) a la larga. Jugándola perfecto, la ventaja de la casa baja a alrededor de <b>0,5 %</b>. Toca cualquier casilla para ver la jugada y por qué.",
    reglas: "Reglas de la tabla",
    reglaS17: "El crupier se planta con 17 blando",
    reglaH17: "El crupier pide con 17 blando",
    reglasNota: "6 mazos, doblar con cualquier mano y doblar después de separar. Si en tu mesa el crupier pide con 17 blando, elige esa opción: cambian unas pocas casillas.",
    tabs: { hard: "Manos duras", soft: "Manos blandas", pairs: "Pares" },
    crupier: "Carta del crupier",
    tuMano: "Tu mano",
    elegi: "Toca una casilla para ver la jugada y por qué.",
    contra: "contra",
    acciones: { H: "Pedir", S: "Plantarse", D: "Doblar", P: "Separar", R: "Rendirse" },
    chicas: { s: "si no se puede doblar, plántate", h: "si no se puede rendirse, pide", p: "si no se puede rendirse, separa" },
    leyenda: "Las letras son las de todo el mundo: <b>H</b> pedir (<em>hit</em>), <b>S</b> plantarse (<em>stand</em>), <b>D</b> doblar (<em>double</em>), <b>P</b> separar (<em>split</em>). Una letra chica dice qué hacer si la jugada no se permite.",
    filas: { hard: (r) => (r === 17 ? "17+" : r === 8 ? "5–8" : String(r)), soft: (r) => `A,${r - 11}`, pairs: (r) => (r === "T" ? "10,10" : `${r},${r}`) },
    secciones: [
      {
        h: "Cómo se lee",
        p: [
          "<b>1. Mira qué tipo de mano tienes.</b> Si tienes un As que puede valer 11 sin pasarte, es una mano <em>blanda</em> (por ejemplo, A,6 es 17 blando). Si tienes dos cartas iguales, es un <em>par</em>. Todo lo demás es una mano <em>dura</em>.",
          "<b>2. Busca tu fila y la columna de la carta visible del crupier.</b> Las figuras (J, Q, K) cuentan como 10.",
          "<b>3. Juega lo que dice la casilla.</b> Siempre, aunque la intuición te diga otra cosa: la tabla ya hizo la cuenta de millones de manos por ti.",
        ],
      },
      {
        h: "Las 6 jugadas que más dinero ahorran",
        lista: [
          "<b>Separa siempre los ases y los ochos.</b> Dos ases juntos son un 12 flojo; 8,8 es un 16, la peor mano del juego.",
          "<b>Nunca separes los dieces ni los cincos.</b> 20 gana casi siempre, y 5,5 es un 10: mejor doblarlo.",
          "<b>Dobla el 11 contra casi todo.</b> Hay tantas cartas de 10 que es la mejor oportunidad para meter más dinero.",
          "<b>Plántate con 12 contra 4, 5 o 6.</b> El crupier está débil: deja que se arriesgue él.",
          "<b>Pide con 16 contra 10.</b> Duele, pero plantarse pierde todavía más.",
          "<b>No tomes el seguro.</b> Sin contar cartas, es una apuesta que pierde a la larga.",
        ],
      },
      {
        h: "¿Por qué funciona?",
        p: [
          "La ventaja de la casa viene de una sola regla: <b>si te pasas, pierdes aunque el crupier también se pase después</b>. La estrategia básica no la elimina, pero la achica al mínimo: te dice cuándo arriesgar (doblar, separar) y cuándo dejar que el crupier corra el riesgo.",
          "Es pura matemática: cada casilla compara cuánto ganas o pierdes en promedio con cada jugada posible y se queda con la mejor. Por eso, aunque una mano puntual salga mal, a la larga jugarla siempre así es lo que más rinde.",
        ],
      },
    ],
    sigue: {
      h: "Lo que sigue: de la tabla a la mesa",
      intro: "Leer la tabla es el primer paso. Lo que hace la diferencia es jugarla sin pensar, y después saber cuándo conviene salirse de ella.",
      items: [
        { t: "Sabértela de memoria", p: "Tandas de manos que apuntan justo a las que fallas y tarjetas con repaso espaciado, hasta que cada jugada te salga sola.", tag: "gratis" },
        { t: "Jugar con la mesa de verdad", p: "Un simulador con otros jugadores que te corrige cada decisión mientras juegas, como en un casino.", tag: "gratis" },
        { t: "Las 18 desviaciones", p: "Con el conteo, algunas jugadas cambian: por ejemplo, 16 contra 10 te plantas si el conteo es positivo. Los Illustrious 18 y el Fab 4, practicados nivel por nivel.", tag: "premium" },
        { t: "Tu tabla, tu mesa", p: "Ajusta cada regla (8 mazos, el crupier que pide con 17 blando, rendición) y practica con la tabla exacta de la mesa donde juegas.", tag: "premium" },
      ],
    },
    faq: [
      ["¿La estrategia básica garantiza ganar?", "No. Baja la ventaja de la casa al mínimo (alrededor de 0,5 %), pero la casa sigue teniendo ventaja. Es la base para jugar bien, y la base para contar cartas."],
      ["¿Sirve para cualquier casino?", "Sirve para mesas de 4 a 8 mazos. Lo único que cambia algunas casillas es si el crupier pide o se planta con 17 blando: elige la opción de tu mesa arriba de la tabla."],
      ["¿Hay que memorizarla?", "Sí, para usarla en una mesa de verdad (no se puede usar el celular en la mesa). Se aprende rápido por partes: primero los pares, después las blandas y al final las duras. En Edge 21 la tabla se va encendiendo a medida que la aprendes."],
    ],
  },
  en: {
    titulo: "Blackjack basic strategy chart (interactive) | Edge 21",
    descripcion: "The full 6-deck basic strategy chart: tap any cell to see the right play and why. Hard hands, soft hands and pairs.",
    h1: "Blackjack basic strategy chart",
    tarjeta: "The right play for every hand, cell by cell, with the why.",
    minutos: 6,
    intro: "Basic strategy is the mathematically correct way to play every hand: for each combination of your cards and the dealer's up card, there's one play that loses the least (or wins the most) in the long run. Played perfectly, it cuts the house edge to about <b>0.5%</b>. Tap any cell to see the play and why.",
    reglas: "Chart rules",
    reglaS17: "Dealer stands on soft 17",
    reglaH17: "Dealer hits soft 17",
    reglasNota: "6 decks, double on any two cards and double after split. If the dealer at your table hits soft 17, pick that option: a few cells change.",
    tabs: { hard: "Hard hands", soft: "Soft hands", pairs: "Pairs" },
    crupier: "Dealer's card",
    tuMano: "Your hand",
    elegi: "Tap a cell to see the play and why.",
    contra: "vs",
    acciones: { H: "Hit", S: "Stand", D: "Double", P: "Split", R: "Surrender" },
    chicas: { s: "if you can't double, stand", h: "if you can't surrender, hit", p: "if you can't surrender, split" },
    leyenda: "The letters are the standard ones: <b>H</b> hit, <b>S</b> stand, <b>D</b> double, <b>P</b> split. A small letter tells you what to do if the play isn't allowed.",
    filas: { hard: (r) => (r === 17 ? "17+" : r === 8 ? "5–8" : String(r)), soft: (r) => `A,${r - 11}`, pairs: (r) => (r === "T" ? "10,10" : `${r},${r}`) },
    secciones: [
      {
        h: "How to read it",
        p: [
          "<b>1. Check what kind of hand you have.</b> If you have an Ace that can count as 11 without busting, it's a <em>soft</em> hand (A,6 is soft 17, for example). If you have two equal cards, it's a <em>pair</em>. Everything else is a <em>hard</em> hand.",
          "<b>2. Find your row and the column of the dealer's up card.</b> Face cards (J, Q, K) count as 10.",
          "<b>3. Play what the cell says.</b> Always, even if your gut says otherwise: the chart already did the math on millions of hands for you.",
        ],
      },
      {
        h: "The 6 plays that save the most money",
        lista: [
          "<b>Always split aces and eights.</b> Two aces together are a weak 12; 8,8 is 16, the worst hand in the game.",
          "<b>Never split tens or fives.</b> 20 almost always wins, and 5,5 is a 10: better to double it.",
          "<b>Double 11 against almost everything.</b> There are so many 10-value cards that it's your best chance to put more money in.",
          "<b>Stand on 12 against 4, 5 or 6.</b> The dealer is weak: let them take the risk.",
          "<b>Hit 16 against 10.</b> It hurts, but standing loses even more.",
          "<b>Don't take insurance.</b> Without counting cards, it's a losing bet in the long run.",
        ],
      },
      {
        h: "Why it works",
        p: [
          "The house edge comes from a single rule: <b>if you bust, you lose even if the dealer busts afterwards</b>. Basic strategy doesn't remove it, but shrinks it to the minimum: it tells you when to take risks (double, split) and when to let the dealer take them.",
          "It's pure math: each cell compares how much you win or lose on average with every possible play and keeps the best one. That's why, even if a single hand goes wrong, always playing it this way pays off the most in the long run.",
        ],
      },
    ],
    sigue: {
      h: "What's next: from the chart to the table",
      intro: "Reading the chart is the first step. What makes the difference is playing it without thinking, and then knowing when to leave it.",
      items: [
        { t: "Know it by heart", p: "Rounds of hands aimed exactly at the ones you miss, plus spaced-repetition cards, until every play comes out on its own.", tag: "gratis" },
        { t: "Play at a real table", p: "A simulator with other players that corrects every decision as you play, like in a casino.", tag: "gratis" },
        { t: "The 18 deviations", p: "With the count, some plays change: for example, you stand on 16 against a 10 when the count is positive. The Illustrious 18 and the Fab 4, practiced level by level.", tag: "premium" },
        { t: "Your chart, your table", p: "Adjust every rule (8 decks, dealer hits soft 17, surrender) and practice with the exact chart for the table you play at.", tag: "premium" },
      ],
    },
    faq: [
      ["Does basic strategy guarantee winning?", "No. It cuts the house edge to the minimum (about 0.5%), but the house still has the edge. It's the foundation for playing well, and the foundation for counting cards."],
      ["Does it work at any casino?", "It works for 4- to 8-deck games. The only thing that changes a few cells is whether the dealer hits or stands on soft 17: pick your table's option above the chart."],
      ["Do I have to memorize it?", "Yes, to use it at a real table (you can't use your phone at the table). It's quick to learn in parts: pairs first, then soft hands and hard hands last. In Edge 21 the chart lights up as you learn it."],
    ],
  },
};

export const CONTEO = {
  es: {
    titulo: "Cómo contar cartas en blackjack: método Hi-Lo paso a paso | Edge 21",
    descripcion: "Aprende a contar cartas con el método Hi-Lo: los valores de cada carta, el conteo corrido, el conteo real y cuánto apostar. Con un ejercicio para practicar aquí mismo.",
    h1: "Cómo contar cartas en blackjack",
    tarjeta: "El método Hi-Lo en 4 pasos, con un ejercicio para probarte.",
    minutos: 7,
    intro: "Contar cartas no es memorizar el mazo ni tener una mente prodigiosa: es llevar <b>un solo número</b> en la cabeza, que sube y baja con las cartas que salen. Ese número te dice cuándo quedan más cartas altas en el zapato, que es cuando el jugador tiene ventaja. Aquí va el método más usado del mundo, <b>Hi-Lo</b>, en 4 pasos.",
    porque: {
      h: "Por qué funciona",
      p: "Las cartas altas (10, J, Q, K y As) te favorecen: hay más blackjacks (que pagan 3 a 2), tus dobles salen mejor y el crupier, que está obligado a pedir hasta 17, se pasa más seguido. Las bajas (2 a 6) lo favorecen a él. Cuando ya salieron muchas bajas, en el zapato quedan más altas, y ahí conviene apostar más.",
    },
    pasos: [
      {
        h: "Paso 1 · El valor de cada carta",
        p: "Cada carta que ves suma o resta así. Nada más.",
        valores: true,
      },
      {
        h: "Paso 2 · El conteo corrido",
        p: "Empiezas en 0 cuando mezclan y vas sumando el valor de cada carta que aparece en la mesa, la tuya, la de los demás y la del crupier. Ese total es el <b>conteo corrido</b>. Por ejemplo: sale un 5 (+1), un K (−1), un 3 (+1) y un 6 (+1): el conteo corrido es <b>+2</b>.",
        practica: true,
      },
      {
        h: "Paso 3 · El conteo real",
        p: "Un +6 no significa lo mismo con 6 mazos por delante que con 1. Por eso se divide el conteo corrido por los mazos que quedan sin repartir (se calcula mirando la bandeja de descarte). El resultado es el <b>conteo real</b>, y es el que manda.",
        tabla: [
          ["Conteo corrido", "Mazos que quedan", "Conteo real"],
          ["+6", "6", "+1"],
          ["+6", "3", "+2"],
          ["+6", "1,5", "+4"],
          ["−4", "2", "−2"],
        ],
      },
      {
        h: "Paso 4 · Cuánto apostar",
        p: "Con conteo real de +1 o menos, apuestas lo mínimo (1 unidad). Desde +2, subes de a poco. Un ejemplo prudente:",
        tabla: [
          ["Conteo real", "Apuesta"],
          ["+1 o menos", "1 unidad"],
          ["+2", "2 unidades"],
          ["+3", "4 unidades"],
          ["+4 o más", "6 a 8 unidades"],
        ],
        nota: "La ventaja que da contar es chica (1 a 2 %) y aparece a la larga, con cientos de horas. En el corto plazo se puede perder, incluso contando perfecto.",
      },
    ],
    practica: {
      h: "Pruébalo: cuenta estas cartas",
      p: "Van a salir 10 cartas, una por una. Lleva la cuenta Hi-Lo y al final escribe el conteo corrido.",
      empezar: "Empezar",
      otra: "Otra vez",
      pregunta: "¿Cuál es el conteo corrido?",
      comprobar: "Comprobar",
      bien: "¡Exacto!",
      mal: "Casi: era {0}.",
      detalle: "Así quedó, carta por carta:",
    },
    mitos: {
      h: "4 mitos sobre contar cartas",
      lista: [
        "<b>“Es ilegal.”</b> Contar con la cabeza es legal en la mayoría de los lugares. Lo que está prohibido es usar aparatos en la mesa, y el casino puede pedirte que no juegues al blackjack.",
        "<b>“Hay que memorizar todas las cartas.”</b> Llevas un solo número.",
        "<b>“Hay que ser un genio.”</b> Es sumar y restar de a uno. Lo difícil es hacerlo rápido, con la mesa llena: eso se entrena.",
        "<b>“Contando ganas siempre.”</b> La ventaja es chica y a la larga. Por eso es para aprender y entender el juego, no para hacerse rico.",
      ],
    },
    sigue: {
      h: "Lo que sigue: contar en serio",
      intro: "Entender el Hi-Lo lleva diez minutos. Contar un zapato entero, rápido y sin errores, lleva práctica.",
      items: [
        { t: "La ruta de conteo", p: "10 niveles, del valor de cada carta a contar un zapato entero a ritmo real, con Hi-Lo o KO.", tag: "gratis" },
        { t: "El desafío diario", p: "Un formato distinto cada día y un ranking para compararte con los demás.", tag: "gratis" },
        { t: "Las desviaciones", p: "Usar el conteo también para jugar: los Illustrious 18 y el Fab 4, que suman la mayor parte de la ventaja extra.", tag: "premium" },
        { t: "Sistemas avanzados y casino simulado", p: "Hi-Opt I y II, Zen, Omega II y Wong Halves, el modo casino simulado con saldo virtual y vigilancia, y el simulador de banca para saber cuánto necesitas.", tag: "premium" },
      ],
    },
    faq: [
      ["¿Contar cartas es legal?", "Contar mentalmente es legal en la mayoría de los lugares. Usar un celular o cualquier aparato en la mesa está prohibido, y el casino puede pedirte que dejes de jugar."],
      ["¿Cuánto tiempo lleva aprender a contar?", "Los valores se aprenden en minutos. Llevar el conteo de un zapato entero, rápido y con la mesa llena, lleva semanas de práctica. En Edge 21 hay una ruta de 10 niveles que te lleva de a poco."],
      ["¿Hi-Lo es el mejor sistema?", "Es el más usado porque es simple y rinde muy bien. Hay sistemas más precisos (como Zen u Omega II), pero son más difíciles y la diferencia es chica."],
    ],
  },
  en: {
    titulo: "How to count cards in blackjack: the Hi-Lo method step by step | Edge 21",
    descripcion: "Learn to count cards with the Hi-Lo method: each card's value, the running count, the true count and how much to bet. With a drill to practice right here.",
    h1: "How to count cards in blackjack",
    tarjeta: "The Hi-Lo method in 4 steps, with a drill to test yourself.",
    minutos: 7,
    intro: "Counting cards isn't memorizing the deck or having a genius mind: it's keeping <b>one single number</b> in your head that goes up and down with the cards that come out. That number tells you when more high cards are left in the shoe, which is when the player has the edge. Here's the world's most used method, <b>Hi-Lo</b>, in 4 steps.",
    porque: {
      h: "Why it works",
      p: "High cards (10, J, Q, K and Ace) favor you: there are more blackjacks (which pay 3 to 2), your doubles do better and the dealer, who must hit until 17, busts more often. Low cards (2 to 6) favor the dealer. When lots of low cards are already out, more high cards are left in the shoe, and that's when betting more pays off.",
    },
    pasos: [
      {
        h: "Step 1 · Each card's value",
        p: "Add or subtract like this for every card you see. That's it.",
        valores: true,
      },
      {
        h: "Step 2 · The running count",
        p: "You start at 0 after the shuffle and add the value of every card that appears on the table: yours, the other players' and the dealer's. That total is the <b>running count</b>. For example: a 5 comes out (+1), a K (−1), a 3 (+1) and a 6 (+1): the running count is <b>+2</b>.",
        practica: true,
      },
      {
        h: "Step 3 · The true count",
        p: "A +6 doesn't mean the same with 6 decks left as with 1. So you divide the running count by the decks left to be dealt (estimated by looking at the discard tray). The result is the <b>true count</b>, and that's the one that matters.",
        tabla: [
          ["Running count", "Decks left", "True count"],
          ["+6", "6", "+1"],
          ["+6", "3", "+2"],
          ["+6", "1.5", "+4"],
          ["−4", "2", "−2"],
        ],
      },
      {
        h: "Step 4 · How much to bet",
        p: "With a true count of +1 or less, bet the minimum (1 unit). From +2, raise it gradually. A careful example:",
        tabla: [
          ["True count", "Bet"],
          ["+1 or less", "1 unit"],
          ["+2", "2 units"],
          ["+3", "4 units"],
          ["+4 or more", "6 to 8 units"],
        ],
        nota: "The edge from counting is small (1 to 2%) and shows up in the long run, over hundreds of hours. In the short run you can lose, even counting perfectly.",
      },
    ],
    practica: {
      h: "Try it: count these cards",
      p: "10 cards will come out, one by one. Keep the Hi-Lo count and type the running count at the end.",
      empezar: "Start",
      otra: "Again",
      pregunta: "What's the running count?",
      comprobar: "Check",
      bien: "Exactly!",
      mal: "Close: it was {0}.",
      detalle: "Here's how it went, card by card:",
    },
    mitos: {
      h: "4 myths about counting cards",
      lista: [
        "<b>“It's illegal.”</b> Counting in your head is legal in most places. What's prohibited is using devices at the table, and the casino can ask you not to play blackjack.",
        "<b>“You have to memorize every card.”</b> You keep a single number.",
        "<b>“You have to be a genius.”</b> It's adding and subtracting one at a time. The hard part is doing it fast at a full table: that's trainable.",
        "<b>“Counting means you always win.”</b> The edge is small and long-term. That's why it's for learning and understanding the game, not for getting rich.",
      ],
    },
    sigue: {
      h: "What's next: counting a whole shoe",
      intro: "Understanding Hi-Lo takes ten minutes. Counting a whole shoe, fast and without mistakes, takes practice.",
      items: [
        { t: "The counting path", p: "10 levels, from each card's value to counting a whole shoe at real speed, with Hi-Lo or KO.", tag: "gratis" },
        { t: "The daily challenge", p: "A different format every day and a leaderboard to compare yourself with others.", tag: "gratis" },
        { t: "Deviations", p: "Using the count to play too: the Illustrious 18 and the Fab 4, which add most of the extra edge.", tag: "premium" },
        { t: "Advanced systems and simulated casino", p: "Hi-Opt I and II, Zen, Omega II and Wong Halves, simulated casino mode with a virtual balance and surveillance, and the bankroll simulator to know how much you need.", tag: "premium" },
      ],
    },
    faq: [
      ["Is counting cards legal?", "Counting in your head is legal in most places. Using a phone or any device at the table is prohibited, and the casino can ask you to stop playing."],
      ["How long does it take to learn to count?", "The values take minutes. Keeping the count of a whole shoe, fast and at a full table, takes weeks of practice. Edge 21 has a 10-level path that gets you there step by step."],
      ["Is Hi-Lo the best system?", "It's the most used because it's simple and performs very well. There are more precise systems (like Zen or Omega II), but they're harder and the difference is small."],
    ],
  },
};

// ---- Português (Brasil) ----
RUTAS.pt = { inicio: "/", guias: "/pt/guias/", estrategia: "/pt/guias/estrategia-basica/", conteo: "/pt/guias/contagem-de-cartas/" };

COMUN.pt = {
  nav: { inicio: "Início", guias: "Guias", jugar: "Jogar agora" },
  pie: "Edge 21 ♠ · É para aprender: a prática usa saldo virtual, sem dinheiro real nem prêmios.",
  privacidad: "Política de privacidade",
  terminos: "Termos de uso",
  ctaTitulo: "Pratique de graça no Edge 21",
  ctaTexto: "Lições curtas, uma mesa que corrige cada jogada e uma trilha de 10 níveis para aprender a contar. Sem dinheiro real.",
  ctaBoton: "Jogar grátis agora",
  migas: "Guias",
  leer: "Ler o guia",
  min: "min de leitura",
  faq: "Perguntas frequentes",
  masGuias: "Mais guias",
  gratis: "Grátis",
  premium: "Premium",
};

INDICE.pt = {
  titulo: "Guias de blackjack grátis | Edge 21",
  descripcion: "Guias claros para jogar blackjack melhor: as regras, a tabela de estratégia básica interativa, quando dobrar e dividir, o seguro, 3:2 ou 6:5 e como contar cartas com Hi-Lo.",
  h1: "Guias de blackjack",
  intro: "Tudo o que você precisa para jogar cada mão certo e entender como se contam cartas, explicado de forma simples e com exemplos que você pode tocar.",
};

ESTRATEGIA.pt = {
  titulo: "Tabela de estratégia básica de blackjack (interativa) | Edge 21",
  descripcion: "A tabela de estratégia básica completa para 6 baralhos: toque em qualquer casa e veja qual jogada convém e por quê. Mãos duras, macias e pares.",
  h1: "Tabela de estratégia básica de blackjack",
  tarjeta: "A jogada certa para cada mão, casa por casa, com o porquê.",
  minutos: 6,
  intro: "A estratégia básica é a forma matematicamente correta de jogar cada mão: para cada combinação das suas cartas com a carta aberta do dealer, existe uma jogada que perde menos (ou ganha mais) a longo prazo. Jogando-a perfeitamente, a vantagem da casa cai para cerca de <b>0,5%</b>. Toque em qualquer casa para ver a jogada e por quê.",
  reglas: "Regras da tabela",
  reglaS17: "O dealer para com 17 macio",
  reglaH17: "O dealer pede com 17 macio",
  reglasNota: "6 baralhos, dobrar com qualquer mão e dobrar depois de dividir. Se na sua mesa o dealer pede com 17 macio, escolha essa opção: mudam poucas casas.",
  tabs: { hard: "Mãos duras", soft: "Mãos macias", pairs: "Pares" },
  crupier: "Carta do dealer",
  tuMano: "Sua mão",
  elegi: "Toque em uma casa para ver a jogada e por quê.",
  contra: "contra",
  acciones: { H: "Pedir", S: "Parar", D: "Dobrar", P: "Dividir", R: "Desistir" },
  chicas: { s: "se não puder dobrar, pare", h: "se não puder desistir, peça", p: "se não puder desistir, divida" },
  leyenda: "As letras são as do mundo todo, em inglês: <b>H</b> pedir (<em>hit</em>), <b>S</b> parar (<em>stand</em>), <b>D</b> dobrar (<em>double</em>), <b>P</b> dividir (<em>split</em>). Uma letra pequena diz o que fazer se a jogada não for permitida.",
  filas: ESTRATEGIA.es.filas,
  secciones: [
    {
      h: "Como ler",
      p: [
        "<b>1. Veja que tipo de mão você tem.</b> Se você tem um Ás que pode valer 11 sem estourar, é uma mão <em>macia</em> (por exemplo, A,6 é 17 macio). Se tem duas cartas iguais, é um <em>par</em>. Todo o resto é uma mão <em>dura</em>.",
        "<b>2. Procure sua linha e a coluna da carta aberta do dealer.</b> As figuras (J, Q, K) valem 10.",
        "<b>3. Jogue o que a casa diz.</b> Sempre, mesmo que a intuição diga outra coisa: a tabela já fez a conta de milhões de mãos por você.",
      ],
    },
    {
      h: "As 6 jogadas que mais economizam dinheiro",
      lista: [
        "<b>Divida sempre os ases e os oitos.</b> Dois ases juntos são um 12 fraco; 8,8 é um 16, a pior mão do jogo.",
        "<b>Nunca divida os dez nem os cincos.</b> 20 ganha quase sempre, e 5,5 é um 10: melhor dobrar.",
        "<b>Dobre o 11 contra quase tudo.</b> Há tantas cartas de 10 que é a melhor oportunidade para colocar mais dinheiro.",
        "<b>Pare com 12 contra 4, 5 ou 6.</b> O dealer está fraco: deixe que ele corra o risco.",
        "<b>Peça com 16 contra 10.</b> Dói, mas parar perde ainda mais.",
        "<b>Não faça o seguro.</b> Sem contar cartas, é uma aposta que perde a longo prazo.",
      ],
    },
    {
      h: "Por que funciona?",
      p: [
        "A vantagem da casa vem de uma única regra: <b>se você estoura, perde mesmo que o dealer também estoure depois</b>. A estratégia básica não a elimina, mas a reduz ao mínimo: diz quando arriscar (dobrar, dividir) e quando deixar o dealer correr o risco.",
        "É pura matemática: cada casa compara quanto você ganha ou perde em média com cada jogada possível e fica com a melhor. Por isso, mesmo que uma mão específica dê errado, jogar sempre assim é o que mais rende a longo prazo.",
      ],
    },
  ],
  sigue: {
    h: "O que vem depois: da tabela para a mesa",
    intro: "Ler a tabela é o primeiro passo. O que faz a diferença é jogá-la sem pensar e, depois, saber quando vale a pena sair dela.",
    items: [
      { t: "Saber de cor", p: "Rodadas de mãos que miram justamente as que você erra e cartões com repetição espaçada, até cada jogada sair sozinha.", tag: "gratis" },
      { t: "Jogar numa mesa de verdade", p: "Um simulador com outros jogadores que corrige cada decisão enquanto você joga, como num cassino.", tag: "gratis" },
      { t: "Os 18 desvios", p: "Com a contagem, algumas jogadas mudam: por exemplo, com 16 contra 10 você para se a contagem for positiva. Os Illustrious 18 e o Fab 4, praticados nível por nível.", tag: "premium" },
      { t: "Sua tabela, sua mesa", p: "Ajuste cada regra (8 baralhos, dealer que pede com 17 macio, desistência) e pratique com a tabela exata da mesa onde você joga.", tag: "premium" },
    ],
  },
  faq: [
    ["A estratégia básica garante ganhar?", "Não. Ela reduz a vantagem da casa ao mínimo (cerca de 0,5%), mas a casa continua com vantagem. É a base para jogar bem, e a base para contar cartas."],
    ["Serve para qualquer cassino?", "Serve para mesas de 4 a 8 baralhos. A única coisa que muda algumas casas é se o dealer pede ou para com 17 macio: escolha a opção da sua mesa acima da tabela."],
    ["Preciso decorar?", "Sim, para usá-la numa mesa de verdade (não dá para usar o celular na mesa). Dá para aprender rápido por partes: primeiro os pares, depois as macias e por último as duras. No Edge 21 a tabela vai acendendo à medida que você aprende."],
  ],
};

CONTEO.pt = {
  titulo: "Como contar cartas no blackjack: método Hi-Lo passo a passo | Edge 21",
  descripcion: "Aprenda a contar cartas com o método Hi-Lo: o valor de cada carta, a contagem corrente, a contagem real e quanto apostar. Com um exercício para praticar aqui mesmo.",
  h1: "Como contar cartas no blackjack",
  tarjeta: "O método Hi-Lo em 4 passos, com um exercício para você se testar.",
  minutos: 7,
  intro: "Contar cartas não é decorar o baralho nem ter uma mente prodigiosa: é guardar <b>um único número</b> na cabeça, que sobe e desce com as cartas que saem. Esse número diz quando restam mais cartas altas no sapato, que é quando o jogador tem vantagem. Aqui está o método mais usado do mundo, o <b>Hi-Lo</b>, em 4 passos.",
  porque: {
    h: "Por que funciona",
    p: "As cartas altas (10, J, Q, K e Ás) favorecem você: saem mais blackjacks (que pagam 3 para 2), suas dobras rendem mais e o dealer, que é obrigado a pedir até 17, estoura com mais frequência. As baixas (2 a 6) favorecem o dealer. Quando já saíram muitas baixas, restam mais altas no sapato, e aí vale a pena apostar mais.",
  },
  pasos: [
    {
      h: "Passo 1 · O valor de cada carta",
      p: "Cada carta que você vê soma ou subtrai assim. Só isso.",
      valores: true,
    },
    {
      h: "Passo 2 · A contagem corrente",
      p: "Você começa em 0 quando embaralham e vai somando o valor de cada carta que aparece na mesa: a sua, a dos outros e a do dealer. Esse total é a <b>contagem corrente</b>. Por exemplo: sai um 5 (+1), um K (−1), um 3 (+1) e um 6 (+1): a contagem corrente é <b>+2</b>.",
      practica: true,
    },
    {
      h: "Passo 3 · A contagem real",
      p: "Um +6 não significa o mesmo com 6 baralhos pela frente e com 1. Por isso se divide a contagem corrente pelos baralhos que ainda faltam distribuir (calculados olhando a bandeja de descarte). O resultado é a <b>contagem real</b>, e é ela que manda.",
      tabla: [
        ["Contagem corrente", "Baralhos restantes", "Contagem real"],
        ["+6", "6", "+1"],
        ["+6", "3", "+2"],
        ["+6", "1,5", "+4"],
        ["−4", "2", "−2"],
      ],
    },
    {
      h: "Passo 4 · Quanto apostar",
      p: "Com contagem real de +1 ou menos, aposte o mínimo (1 unidade). A partir de +2, aumente aos poucos. Um exemplo prudente:",
      tabla: [
        ["Contagem real", "Aposta"],
        ["+1 ou menos", "1 unidade"],
        ["+2", "2 unidades"],
        ["+3", "4 unidades"],
        ["+4 ou mais", "6 a 8 unidades"],
      ],
      nota: "A vantagem de contar é pequena (1 a 2%) e aparece a longo prazo, ao longo de centenas de horas. No curto prazo dá para perder, mesmo contando perfeitamente.",
    },
  ],
  practica: {
    h: "Teste: conte estas cartas",
    p: "Vão sair 10 cartas, uma por uma. Faça a contagem Hi-Lo e no final escreva a contagem corrente.",
    empezar: "Começar",
    otra: "De novo",
    pregunta: "Qual é a contagem corrente?",
    comprobar: "Conferir",
    bien: "Exato!",
    mal: "Quase: era {0}.",
    detalle: "Foi assim, carta por carta:",
  },
  mitos: {
    h: "4 mitos sobre contar cartas",
    lista: [
      "<b>“É ilegal.”</b> Contar de cabeça é legal na maioria dos lugares. O que é proibido é usar aparelhos na mesa, e o cassino pode pedir que você não jogue blackjack.",
      "<b>“É preciso decorar todas as cartas.”</b> Você guarda um único número.",
      "<b>“É preciso ser um gênio.”</b> É somar e subtrair de um em um. O difícil é fazer isso rápido, com a mesa cheia: isso se treina.",
      "<b>“Contando, você ganha sempre.”</b> A vantagem é pequena e a longo prazo. Por isso é para aprender e entender o jogo, não para ficar rico.",
    ],
  },
  sigue: {
    h: "O que vem depois: contar de verdade",
    intro: "Entender o Hi-Lo leva dez minutos. Contar um sapato inteiro, rápido e sem erros, leva prática.",
    items: [
      { t: "A trilha de contagem", p: "10 níveis, do valor de cada carta até contar um sapato inteiro no ritmo real, com Hi-Lo ou KO.", tag: "gratis" },
      { t: "O desafio diário", p: "Um formato diferente a cada dia e um ranking para você se comparar com os outros.", tag: "gratis" },
      { t: "Os desvios", p: "Usar a contagem também para jogar: os Illustrious 18 e o Fab 4, que somam a maior parte da vantagem extra.", tag: "premium" },
      { t: "Sistemas avançados e cassino simulado", p: "Hi-Opt I e II, Zen, Omega II e Wong Halves, o modo cassino simulado com saldo virtual e vigilância, e o simulador de banca para saber de quanto você precisa.", tag: "premium" },
    ],
  },
  faq: [
    ["Contar cartas é legal?", "Contar de cabeça é legal na maioria dos lugares. Usar um celular ou qualquer aparelho na mesa é proibido, e o cassino pode pedir que você pare de jogar."],
    ["Quanto tempo leva para aprender a contar?", "Os valores se aprendem em minutos. Acompanhar a contagem de um sapato inteiro, rápido e com a mesa cheia, leva semanas de prática. No Edge 21 há uma trilha de 10 níveis que leva você aos poucos."],
    ["O Hi-Lo é o melhor sistema?", "É o mais usado porque é simples e rende muito bem. Existem sistemas mais precisos (como Zen ou Omega II), mas são mais difíceis e a diferença é pequena."],
  ],
};
