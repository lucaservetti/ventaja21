// Textos de las guías de la web (edge21.app/guias/ y edge21.app/en/guides/). HTML simple: <b>, <em>,
// <a>. Las armas con: node tools/guias/armar.mjs
export const SITIO = "https://edge21.app";

export const RUTAS = {
  es: { inicio: "/", guias: "/guias/", estrategia: "/guias/estrategia-basica/", conteo: "/guias/contar-cartas/" },
  en: { inicio: "/", guias: "/en/guides/", estrategia: "/en/guides/basic-strategy/", conteo: "/en/guides/card-counting/" },
};

export const COMUN = {
  es: {
    nav: { inicio: "Inicio", guias: "Guías", jugar: "Jugar ahora" },
    otro: "EN",
    pie: "Edge 21 ♠ · Es para aprender: juega solo dinero que no necesitas.",
    privacidad: "Política de privacidad",
    terminos: "Términos de uso",
    ctaTitulo: "Practícalo gratis en Edge 21",
    ctaTexto: "Lecciones cortas, una mesa que te corrige cada jugada y una ruta de 10 niveles para aprender a contar. Sin dinero real.",
    ctaBoton: "Jugar gratis ahora",
    migas: "Guías",
    leer: "Leer la guía",
    min: "min de lectura",
    faq: "Preguntas frecuentes",
    gratis: "Gratis",
    premium: "Premium",
  },
  en: {
    nav: { inicio: "Home", guias: "Guides", jugar: "Play now" },
    otro: "ES",
    pie: "Edge 21 ♠ · It's for learning: only play with money you don't need.",
    privacidad: "Privacy policy",
    terminos: "Terms of use",
    ctaTitulo: "Practice it for free on Edge 21",
    ctaTexto: "Short lessons, a table that corrects every play and a 10-level path to learn to count. No real money.",
    ctaBoton: "Play free now",
    migas: "Guides",
    leer: "Read the guide",
    min: "min read",
    faq: "Frequently asked questions",
    gratis: "Free",
    premium: "Premium",
  },
};

export const INDICE = {
  es: {
    titulo: "Guías de blackjack gratis | Edge 21",
    descripcion: "Guías claras para jugar blackjack mejor: la tabla de estrategia básica interactiva y cómo contar cartas con el método Hi-Lo, paso a paso.",
    h1: "Guías de blackjack",
    intro: "Todo lo que necesitas para jugar cada mano bien y entender cómo se cuentan cartas, explicado simple y con ejemplos que puedes tocar.",
  },
  en: {
    titulo: "Free blackjack guides | Edge 21",
    descripcion: "Clear guides to play blackjack better: the interactive basic strategy chart and how to count cards with the Hi-Lo method, step by step.",
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
          "<b>3. Juega lo que dice la casilla.</b> Siempre, aunque la intuición te diga otra cosa: la tabla ya hizo la cuenta de millones de manos por tú.",
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
      intro: "Entender el Hi-Lo lleva diez minutos. Contar un zapato entero, rápido y sin que se te note, lleva práctica.",
      items: [
        { t: "La ruta de conteo", p: "10 niveles, del valor de cada carta a contar un zapato entero al ritmo del casino, con Hi-Lo o KO.", tag: "gratis" },
        { t: "El desafío diario", p: "Un formato distinto cada día y un ranking para compararte con los demás.", tag: "gratis" },
        { t: "Las desviaciones", p: "Usar el conteo también para jugar: los Illustrious 18 y el Fab 4, que suman la mayor parte de la ventaja extra.", tag: "premium" },
        { t: "Sistemas avanzados y casino real", p: "Hi-Opt I y II, Zen, Omega II y Wong Halves, el modo casino con tu dinero y vigilancia, y el simulador de banca para saber cuánto necesitas.", tag: "premium" },
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
      h: "What's next: counting for real",
      intro: "Understanding Hi-Lo takes ten minutes. Counting a whole shoe, fast and without it showing, takes practice.",
      items: [
        { t: "The counting path", p: "10 levels, from each card's value to counting a whole shoe at casino speed, with Hi-Lo or KO.", tag: "gratis" },
        { t: "The daily challenge", p: "A different format every day and a leaderboard to compare yourself with others.", tag: "gratis" },
        { t: "Deviations", p: "Using the count to play too: the Illustrious 18 and the Fab 4, which add most of the extra edge.", tag: "premium" },
        { t: "Advanced systems and real casino", p: "Hi-Opt I and II, Zen, Omega II and Wong Halves, casino mode with your money and surveillance, and the bankroll simulator to know how much you need.", tag: "premium" },
      ],
    },
    faq: [
      ["Is counting cards legal?", "Counting in your head is legal in most places. Using a phone or any device at the table is prohibited, and the casino can ask you to stop playing."],
      ["How long does it take to learn to count?", "The values take minutes. Keeping the count of a whole shoe, fast and at a full table, takes weeks of practice. Edge 21 has a 10-level path that gets you there step by step."],
      ["Is Hi-Lo the best system?", "It's the most used because it's simple and performs very well. There are more precise systems (like Zen or Omega II), but they're harder and the difference is small."],
    ],
  },
};
