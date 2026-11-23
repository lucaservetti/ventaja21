// Guías de texto (sin la tabla interactiva ni el ejercicio de conteo): reglas, doblar y separar, el
// seguro y 3:2 contra 6:5. Cada una en español (neutro, de tú), inglés y portugués de Brasil.
// Una sección puede tener: p (párrafos), lista, tabla (la primera fila es el encabezado), cartas
// (manos de ejemplo: [[["A","s"],["K","h"]], "pie"]), nota y calc (la calculadora de 6:5).
// Las arma tools/guias/armar.mjs.

export const SLUGS = {
  reglas: { es: "/guias/reglas-del-blackjack/", en: "/en/guides/blackjack-rules/", pt: "/pt/guias/regras-do-blackjack/" },
  doblar: { es: "/guias/doblar-y-separar/", en: "/en/guides/double-down-and-split/", pt: "/pt/guias/dobrar-e-dividir/" },
  seguro: { es: "/guias/seguro/", en: "/en/guides/insurance/", pt: "/pt/guias/seguro/" },
  pago: { es: "/guias/3-2-o-6-5/", en: "/en/guides/3-2-vs-6-5/", pt: "/pt/guias/3-2-ou-6-5/" },
};

export const ARTICULOS = {
  // ---------------------------------------------------------------- Reglas
  reglas: {
    es: {
      titulo: "Reglas del blackjack: cómo se juega, paso a paso | Edge 21",
      descripcion: "Las reglas del blackjack explicadas simple: cuánto vale cada carta, qué es un blackjack, qué hace el crupier y cuándo pedir, plantarse, doblar, separar o rendirse.",
      h1: "Reglas del blackjack",
      tarjeta: "Cómo se juega: el valor de las cartas, el crupier y las 5 jugadas.",
      minutos: 5,
      intro: "El blackjack es el juego de casino con reglas más simples y, jugado bien, el que menos ventaja le deja a la casa. Juegas <b>contra el crupier</b>, no contra los demás jugadores: ganas si terminas más cerca de 21 que él sin pasarte.",
      secciones: [
        {
          h: "Cuánto vale cada carta",
          lista: [
            "<b>Del 2 al 10:</b> lo que dice la carta.",
            "<b>J, Q y K:</b> valen 10.",
            "<b>El As:</b> vale 11 o 1, lo que más te convenga. Una mano con un As que vale 11 se llama <em>blanda</em> (A,6 es 17 blando): puedes pedir otra carta sin miedo, porque si te pasas, el As pasa a valer 1.",
          ],
          cartas: [
            [[["A", "s"], ["6", "h"]], "17 blando"],
            [[["10", "d"], ["7", "c"]], "17 duro"],
            [[["A", "h"], ["K", "s"]], "Blackjack"],
          ],
        },
        {
          h: "Cómo es una ronda",
          p: [
            "<b>1. Apuestas.</b> Cada jugador pone sus fichas antes de que salgan las cartas.",
            "<b>2. El reparto.</b> Cada jugador recibe dos cartas boca arriba. El crupier recibe una boca arriba (la <em>carta visible</em>) y otra boca abajo.",
            "<b>3. Tu turno.</b> Decides qué hacer con tu mano (abajo están las 5 jugadas). Puedes pedir cartas hasta plantarte o pasarte de 21.",
            "<b>4. El turno del crupier.</b> Da vuelta su carta y juega con reglas fijas: <b>pide hasta llegar a 17 o más</b>. No decide nada: no puede plantarse con 15 aunque tú tengas 13.",
            "<b>5. Se paga.</b> Si estás más cerca de 21 que el crupier, ganas lo mismo que apostaste. Si empatan, te devuelven la apuesta. Si él se pasa, ganan todos los que siguen en juego.",
          ],
        },
        {
          h: "El blackjack",
          p: [
            "Si tus dos primeras cartas son un As y una carta de 10 (10, J, Q o K), tienes un <b>blackjack</b>: la mejor mano. Gana al instante y paga <b>3 a 2</b>: por cada 10 apostados, cobras 15. Solo empata si el crupier también tiene blackjack.",
            "Un 21 hecho con tres cartas o más no es un blackjack: vale 21 y paga 1 a 1. Y ojo con las mesas que pagan el blackjack <b>6 a 5</b>: parece poco, pero es de lo que más dinero cuesta (<a href=\"{pago}\">lo explicamos aquí</a>).",
          ],
        },
        {
          h: "Las 5 jugadas",
          lista: [
            "<b>Pedir:</b> te dan otra carta. Puedes pedir las veces que quieras, hasta plantarte o pasarte.",
            "<b>Plantarse:</b> te quedas con lo que tienes y termina tu turno.",
            "<b>Doblar:</b> duplicas la apuesta y recibes <b>una sola carta</b> más. Se hace con las dos primeras cartas, cuando tienes buenas chances de ganar.",
            "<b>Separar:</b> si tus dos primeras cartas son iguales, las separas en dos manos y pones otra apuesta igual para la segunda. Cada mano sigue por su cuenta.",
            "<b>Rendirse:</b> en algunas mesas puedes abandonar la mano apenas empieza y recuperar la mitad de la apuesta. Conviene en muy pocas manos.",
          ],
          nota: "Cuándo conviene cada una no es cuestión de intuición: está calculado. Lo tienes casilla por casilla en la <a href=\"{estrategia}\">tabla de estrategia básica</a>, y doblar y separar tienen <a href=\"{doblar}\">su propia guía</a>.",
        },
        {
          h: "La regla que le da ventaja a la casa",
          p: [
            "Si te pasas de 21, <b>pierdes en el acto</b>, aunque después el crupier también se pase. Como tú juegas primero, a veces pierdes una mano que el crupier también habría perdido. Esa sola regla le da ventaja a la casa.",
            "Jugando bien cada mano, esa ventaja baja a alrededor de <b>0,5 %</b>: la más baja de todo el casino. Con el <a href=\"{conteo}\">conteo de cartas</a>, en algunos momentos hasta se da vuelta.",
          ],
        },
        {
          h: "Reglas que cambian de mesa en mesa",
          tabla: [
            ["Regla", "A tu favor", "En tu contra"],
            ["Pago del blackjack", "3 a 2", "6 a 5"],
            ["El crupier con 17 blando", "Se planta (S17)", "Pide (H17)"],
            ["Doblar después de separar", "Se permite", "No se permite"],
            ["Rendirse", "Se permite", "No se permite"],
            ["Mazos", "Menos mazos", "Más mazos"],
          ],
          nota: "Antes de sentarte, mira el cartel de la mesa: ahí están estas reglas.",
        },
      ],
      faq: [
        ["¿Qué pasa si empato con el crupier?", "Es un empate (en inglés, <em>push</em>): te devuelven la apuesta y no ganas ni pierdes."],
        ["¿El crupier puede elegir qué hacer?", "No. Juega siempre igual: pide hasta 17 o más. Lo único que cambia según la mesa es qué hace con 17 blando (A,6): en algunas pide y en otras se planta."],
        ["¿Juego contra los otros jugadores?", "No. Cada uno juega solo contra el crupier. Lo que hagan los demás no cambia tus chances a la larga."],
      ],
      relacionadas: ["estrategia", "doblar", "seguro"],
    },
    en: {
      titulo: "Blackjack rules: how to play, step by step | Edge 21",
      descripcion: "Blackjack rules explained simply: what each card is worth, what a blackjack is, what the dealer does, and when to hit, stand, double, split or surrender.",
      h1: "Blackjack rules",
      tarjeta: "How it's played: card values, the dealer and the 5 plays.",
      minutos: 5,
      intro: "Blackjack is the casino game with the simplest rules and, played well, the one that leaves the house the smallest edge. You play <b>against the dealer</b>, not against the other players: you win if you end closer to 21 than the dealer without going over.",
      secciones: [
        {
          h: "What each card is worth",
          lista: [
            "<b>2 to 10:</b> the number on the card.",
            "<b>J, Q and K:</b> worth 10.",
            "<b>The Ace:</b> worth 11 or 1, whichever helps you more. A hand with an Ace counted as 11 is called <em>soft</em> (A,6 is soft 17): you can take another card without fear, because if you go over, the Ace becomes 1.",
          ],
          cartas: [
            [[["A", "s"], ["6", "h"]], "Soft 17"],
            [[["10", "d"], ["7", "c"]], "Hard 17"],
            [[["A", "h"], ["K", "s"]], "Blackjack"],
          ],
        },
        {
          h: "How a round works",
          p: [
            "<b>1. Bets.</b> Every player places their chips before the cards come out.",
            "<b>2. The deal.</b> Each player gets two cards face up. The dealer gets one face up (the <em>up card</em>) and one face down.",
            "<b>3. Your turn.</b> You decide what to do with your hand (the 5 plays are below). You can take cards until you stand or go over 21.",
            "<b>4. The dealer's turn.</b> The dealer flips the hidden card and plays by fixed rules: <b>hit until reaching 17 or more</b>. No choices: the dealer can't stand on 15 even if you have 13.",
            "<b>5. Payout.</b> If you're closer to 21 than the dealer, you win what you bet. On a tie, you get your bet back. If the dealer busts, everyone still in the hand wins.",
          ],
        },
        {
          h: "The blackjack",
          p: [
            "If your first two cards are an Ace and a 10-value card (10, J, Q or K), you have a <b>blackjack</b>: the best hand. It wins right away and pays <b>3 to 2</b>: for every 10 you bet, you get 15. It only ties if the dealer also has blackjack.",
            "A 21 made with three or more cards isn't a blackjack: it's worth 21 and pays 1 to 1. And watch out for tables that pay blackjack <b>6 to 5</b>: it looks minor, but it's one of the costliest rules there is (<a href=\"{pago}\">we explain it here</a>).",
          ],
        },
        {
          h: "The 5 plays",
          lista: [
            "<b>Hit:</b> you get another card. You can hit as many times as you want, until you stand or bust.",
            "<b>Stand:</b> you keep what you have and your turn ends.",
            "<b>Double down:</b> you double your bet and get <b>exactly one</b> more card. It's done on your first two cards, when your chances of winning are good.",
            "<b>Split:</b> if your first two cards are the same, you split them into two hands and place an equal bet on the second. Each hand plays on its own.",
            "<b>Surrender:</b> at some tables you can give up the hand right at the start and get half your bet back. It's right on very few hands.",
          ],
          nota: "When to use each one isn't a gut call: it's been calculated. You have it cell by cell in the <a href=\"{estrategia}\">basic strategy chart</a>, and doubling and splitting have <a href=\"{doblar}\">their own guide</a>.",
        },
        {
          h: "The rule that gives the house its edge",
          p: [
            "If you go over 21, <b>you lose on the spot</b>, even if the dealer busts afterwards. Since you play first, you sometimes lose a hand the dealer would have lost too. That single rule gives the house its edge.",
            "Playing every hand correctly, that edge drops to about <b>0.5%</b>: the lowest in the whole casino. With <a href=\"{conteo}\">card counting</a>, at some moments it even flips to your side.",
          ],
        },
        {
          h: "Rules that change from table to table",
          tabla: [
            ["Rule", "In your favor", "Against you"],
            ["Blackjack payout", "3 to 2", "6 to 5"],
            ["Dealer on soft 17", "Stands (S17)", "Hits (H17)"],
            ["Double after split", "Allowed", "Not allowed"],
            ["Surrender", "Allowed", "Not allowed"],
            ["Decks", "Fewer decks", "More decks"],
          ],
          nota: "Before you sit down, check the sign on the table: these rules are on it.",
        },
      ],
      faq: [
        ["What happens if I tie with the dealer?", "It's a <em>push</em>: you get your bet back and neither win nor lose."],
        ["Can the dealer choose what to do?", "No. The dealer always plays the same way: hit until 17 or more. The only thing that varies by table is soft 17 (A,6): at some tables the dealer hits, at others stands."],
        ["Am I playing against the other players?", "No. Everyone plays only against the dealer. What the others do doesn't change your odds in the long run."],
      ],
      relacionadas: ["estrategia", "doblar", "seguro"],
    },
    pt: {
      titulo: "Regras do blackjack: como se joga, passo a passo | Edge 21",
      descripcion: "As regras do blackjack explicadas de forma simples: quanto vale cada carta, o que é um blackjack, o que o dealer faz e quando pedir, parar, dobrar, dividir ou desistir.",
      h1: "Regras do blackjack",
      tarjeta: "Como se joga: o valor das cartas, o dealer e as 5 jogadas.",
      minutos: 5,
      intro: "O blackjack é o jogo de cassino com as regras mais simples e, jogado bem, o que deixa a menor vantagem para a casa. Você joga <b>contra o dealer</b>, não contra os outros jogadores: ganha se terminar mais perto de 21 que ele sem passar.",
      secciones: [
        {
          h: "Quanto vale cada carta",
          lista: [
            "<b>Do 2 ao 10:</b> o número da carta.",
            "<b>J, Q e K:</b> valem 10.",
            "<b>O Ás:</b> vale 11 ou 1, o que for melhor para você. Uma mão com um Ás valendo 11 se chama <em>macia</em> (A,6 é 17 macio): você pode pedir outra carta sem medo, porque se passar de 21, o Ás passa a valer 1.",
          ],
          cartas: [
            [[["A", "s"], ["6", "h"]], "17 macio"],
            [[["10", "d"], ["7", "c"]], "17 duro"],
            [[["A", "h"], ["K", "s"]], "Blackjack"],
          ],
        },
        {
          h: "Como é uma rodada",
          p: [
            "<b>1. Apostas.</b> Cada jogador coloca suas fichas antes de as cartas saírem.",
            "<b>2. A distribuição.</b> Cada jogador recebe duas cartas viradas para cima. O dealer recebe uma para cima (a <em>carta aberta</em>) e outra para baixo.",
            "<b>3. Sua vez.</b> Você decide o que fazer com sua mão (as 5 jogadas estão abaixo). Pode pedir cartas até parar ou estourar 21.",
            "<b>4. A vez do dealer.</b> Ele vira a carta escondida e joga com regras fixas: <b>pede até chegar a 17 ou mais</b>. Ele não decide nada: não pode parar com 15 mesmo que você tenha 13.",
            "<b>5. O pagamento.</b> Se você estiver mais perto de 21 que o dealer, ganha o mesmo valor que apostou. Se empatarem, a aposta volta para você. Se ele estourar, ganham todos que ainda estão no jogo.",
          ],
        },
        {
          h: "O blackjack",
          p: [
            "Se suas duas primeiras cartas forem um Ás e uma carta de 10 (10, J, Q ou K), você tem um <b>blackjack</b>: a melhor mão. Ganha na hora e paga <b>3 para 2</b>: a cada 10 apostados, você recebe 15. Só empata se o dealer também tiver blackjack.",
            "Um 21 feito com três cartas ou mais não é blackjack: vale 21 e paga 1 para 1. E cuidado com as mesas que pagam o blackjack <b>6 para 5</b>: parece pouco, mas é uma das regras que mais custam dinheiro (<a href=\"{pago}\">explicamos aqui</a>).",
          ],
        },
        {
          h: "As 5 jogadas",
          lista: [
            "<b>Pedir:</b> você recebe outra carta. Pode pedir quantas vezes quiser, até parar ou estourar.",
            "<b>Parar:</b> você fica com o que tem e sua vez termina.",
            "<b>Dobrar:</b> você dobra a aposta e recebe <b>só mais uma</b> carta. Se faz com as duas primeiras cartas, quando suas chances de ganhar são boas.",
            "<b>Dividir:</b> se suas duas primeiras cartas forem iguais, você as separa em duas mãos e coloca outra aposta igual na segunda. Cada mão segue por conta própria.",
            "<b>Desistir:</b> em algumas mesas você pode abandonar a mão logo no começo e recuperar metade da aposta. Vale a pena em pouquíssimas mãos.",
          ],
          nota: "Quando usar cada uma não é questão de intuição: está calculado. Você tem isso casa por casa na <a href=\"{estrategia}\">tabela de estratégia básica</a>, e dobrar e dividir têm <a href=\"{doblar}\">um guia próprio</a>.",
        },
        {
          h: "A regra que dá vantagem à casa",
          p: [
            "Se você passar de 21, <b>perde na hora</b>, mesmo que depois o dealer também estoure. Como você joga primeiro, às vezes perde uma mão que o dealer também teria perdido. Essa única regra dá vantagem à casa.",
            "Jogando cada mão certo, essa vantagem cai para cerca de <b>0,5%</b>: a menor de todo o cassino. Com a <a href=\"{conteo}\">contagem de cartas</a>, em alguns momentos ela chega a virar para o seu lado.",
          ],
        },
        {
          h: "Regras que mudam de mesa para mesa",
          tabla: [
            ["Regra", "A seu favor", "Contra você"],
            ["Pagamento do blackjack", "3 para 2", "6 para 5"],
            ["O dealer com 17 macio", "Para (S17)", "Pede (H17)"],
            ["Dobrar depois de dividir", "Permitido", "Não permitido"],
            ["Desistir", "Permitido", "Não permitido"],
            ["Baralhos", "Menos baralhos", "Mais baralhos"],
          ],
          nota: "Antes de sentar, olhe a placa da mesa: essas regras estão nela.",
        },
      ],
      faq: [
        ["O que acontece se eu empatar com o dealer?", "É um empate (em inglês, <em>push</em>): a aposta volta para você e ninguém ganha nem perde."],
        ["O dealer pode escolher o que fazer?", "Não. Ele joga sempre igual: pede até 17 ou mais. A única coisa que muda conforme a mesa é o que ele faz com 17 macio (A,6): em algumas pede e em outras para."],
        ["Eu jogo contra os outros jogadores?", "Não. Cada um joga só contra o dealer. O que os outros fazem não muda suas chances a longo prazo."],
      ],
      relacionadas: ["estrategia", "doblar", "seguro"],
    },
  },

  // ---------------------------------------------------------------- Doblar y separar
  doblar: {
    es: {
      titulo: "Cuándo doblar y cuándo separar en blackjack | Edge 21",
      descripcion: "Todas las manos en las que conviene doblar o separar en blackjack, según la estrategia básica para 6 mazos: el 11, el 10, las manos blandas y cada par.",
      h1: "Cuándo doblar y cuándo separar",
      tarjeta: "Las manos en las que conviene poner más dinero, y por qué.",
      minutos: 6,
      intro: "Doblar y separar son las dos jugadas en las que pones <b>más dinero en la mesa</b>. Por eso son las que más pesan en tu resultado: hacerlas en las manos justas es de donde sale buena parte de lo que rinde la estrategia básica. Todo lo de esta guía es para 6 mazos, doblando después de separar.",
      secciones: [
        {
          h: "La idea detrás",
          p: [
            "Conviene poner más dinero cuando tú tienes la ventaja en esa mano: cuando tu mano es fuerte (un 10 o un 11 que espera una figura) o cuando el crupier está débil. Con un 4, 5 o 6 visible, el crupier tiene que pedir sobre una mano mala y <b>se pasa en alrededor del 40 % de las veces</b>.",
          ],
        },
        {
          h: "Cuándo doblar con manos duras",
          tabla: [
            ["Tu mano", "Dobla contra", "Si no, pide"],
            ["11", "2 a 10", "contra As"],
            ["10", "2 a 9", "contra 10 y As"],
            ["9", "3 a 6", "contra 2 y del 7 en adelante"],
            ["8 o menos", "Nunca", "Siempre"],
          ],
          nota: "Si el crupier pide con 17 blando, el 11 también se dobla contra As. Con 12 o más no se dobla nunca: una sola carta más rara vez te deja en una buena mano.",
        },
        {
          h: "Cuándo doblar con manos blandas",
          p: ["Las manos blandas se doblan contra un crupier débil: no te puedes pasar con una carta más, y él tiene muchas chances de pasarse."],
          tabla: [
            ["Tu mano", "Dobla contra", "Si no se puede doblar"],
            ["A,7 (18 blando)", "3 a 6 (y 2 si pide con 17 blando)", "plántate"],
            ["A,6 (17 blando)", "3 a 6", "pide"],
            ["A,4 y A,5", "4 a 6", "pide"],
            ["A,2 y A,3", "5 y 6", "pide"],
            ["A,8 (19 blando)", "solo 6, si pide con 17 blando", "plántate"],
          ],
        },
        {
          h: "Cuándo separar cada par",
          tabla: [
            ["Par", "Qué hacer"],
            ["A,A y 8,8", "Separa siempre"],
            ["10,10", "Nunca: 20 ya gana casi siempre"],
            ["5,5", "Nunca: es un 10, dóblalo contra 2 a 9"],
            ["9,9", "Separa contra 2 a 6, 8 y 9. Contra 7, 10 y As, plántate"],
            ["7,7", "Separa contra 2 a 7"],
            ["6,6", "Separa contra 2 a 6"],
            ["4,4", "Separa solo contra 5 y 6"],
            ["2,2 y 3,3", "Separa contra 2 a 7"],
          ],
          nota: "Si en tu mesa no se puede doblar después de separar, se separa un poco menos (por ejemplo, 4,4 no se separa nunca).",
        },
        {
          h: "Los casos que más confunden",
          lista: [
            "<b>8,8 contra 10.</b> Separar parece tirar más dinero a una mano perdida, pero 16 es la peor mano del juego. Dos manos que empiezan con 8 pierden menos que un 16.",
            "<b>9,9 contra 7.</b> Te plantas: 18 le gana al 17 que el crupier suele hacer con un 7.",
            "<b>11 contra As.</b> Con la mayoría de las reglas solo se pide; se dobla si el crupier pide con 17 blando.",
            "<b>A,7 contra 9, 10 o As.</b> 18 blando parece bueno, pero contra esas cartas pierde más plantándose: pide.",
          ],
        },
      ],
      faq: [
        ["¿Puedo doblar con cualquier mano?", "Depende de la mesa. En la mayoría se puede doblar con cualquier par de cartas iniciales; en algunas, solo con 9, 10 u 11."],
        ["¿Qué pasa con los ases separados?", "En casi todos los casinos, cada As separado recibe una sola carta. Si sale una figura, vale 21, no blackjack."],
        ["¿Cuántas veces puedo separar?", "Suele permitirse hasta tener 3 o 4 manos. Volver a separar ases se permite en pocas mesas."],
      ],
      relacionadas: ["estrategia", "reglas", "pago"],
    },
    en: {
      titulo: "When to double down and when to split in blackjack | Edge 21",
      descripcion: "Every hand where you should double down or split in blackjack, by 6-deck basic strategy: 11, 10, soft hands and every pair.",
      h1: "When to double down and split",
      tarjeta: "The hands where putting more money in pays off, and why.",
      minutos: 6,
      intro: "Doubling and splitting are the two plays where you put <b>more money on the table</b>. That's why they weigh the most on your results: making them on the right hands is where a big part of basic strategy's value comes from. Everything in this guide is for 6 decks, with double after split.",
      secciones: [
        {
          h: "The idea behind it",
          p: [
            "Putting more money in pays off when you have the edge in that hand: when your hand is strong (a 10 or 11 waiting for a face card) or when the dealer is weak. With a 4, 5 or 6 showing, the dealer has to hit a bad hand and <b>busts about 40% of the time</b>.",
          ],
        },
        {
          h: "When to double hard hands",
          tabla: [
            ["Your hand", "Double against", "Otherwise, hit"],
            ["11", "2 to 10", "against an Ace"],
            ["10", "2 to 9", "against 10 and Ace"],
            ["9", "3 to 6", "against 2 and 7 or higher"],
            ["8 or less", "Never", "Always"],
          ],
          nota: "If the dealer hits soft 17, also double 11 against an Ace. Never double with 12 or more: a single extra card rarely leaves you with a good hand.",
        },
        {
          h: "When to double soft hands",
          p: ["Soft hands are doubled against a weak dealer: one more card can't bust you, and the dealer has a good chance of busting."],
          tabla: [
            ["Your hand", "Double against", "If you can't double"],
            ["A,7 (soft 18)", "3 to 6 (and 2 if the dealer hits soft 17)", "stand"],
            ["A,6 (soft 17)", "3 to 6", "hit"],
            ["A,4 and A,5", "4 to 6", "hit"],
            ["A,2 and A,3", "5 and 6", "hit"],
            ["A,8 (soft 19)", "only 6, if the dealer hits soft 17", "stand"],
          ],
        },
        {
          h: "When to split each pair",
          tabla: [
            ["Pair", "What to do"],
            ["A,A and 8,8", "Always split"],
            ["10,10", "Never: 20 almost always wins"],
            ["5,5", "Never: it's a 10, double it against 2 to 9"],
            ["9,9", "Split against 2 to 6, 8 and 9. Against 7, 10 and Ace, stand"],
            ["7,7", "Split against 2 to 7"],
            ["6,6", "Split against 2 to 6"],
            ["4,4", "Split only against 5 and 6"],
            ["2,2 and 3,3", "Split against 2 to 7"],
          ],
          nota: "If your table doesn't allow doubling after a split, you split a little less (for example, never split 4,4).",
        },
        {
          h: "The most confusing cases",
          lista: [
            "<b>8,8 against 10.</b> Splitting looks like throwing more money at a lost hand, but 16 is the worst hand in the game. Two hands starting with 8 lose less than one 16.",
            "<b>9,9 against 7.</b> Stand: 18 beats the 17 the dealer usually makes with a 7.",
            "<b>11 against an Ace.</b> Under most rules you just hit; you double if the dealer hits soft 17.",
            "<b>A,7 against 9, 10 or Ace.</b> Soft 18 looks good, but against those cards standing loses more: hit.",
          ],
        },
      ],
      faq: [
        ["Can I double on any hand?", "It depends on the table. Most let you double on any two starting cards; some only on 9, 10 or 11."],
        ["What happens with split aces?", "At almost every casino, each split Ace gets just one card. If a face card comes, it's 21, not blackjack."],
        ["How many times can I split?", "Usually up to 3 or 4 hands. Resplitting aces is allowed at few tables."],
      ],
      relacionadas: ["estrategia", "reglas", "pago"],
    },
    pt: {
      titulo: "Quando dobrar e quando dividir no blackjack | Edge 21",
      descripcion: "Todas as mãos em que vale a pena dobrar ou dividir no blackjack, segundo a estratégia básica para 6 baralhos: o 11, o 10, as mãos macias e cada par.",
      h1: "Quando dobrar e quando dividir",
      tarjeta: "As mãos em que vale a pena colocar mais dinheiro, e por quê.",
      minutos: 6,
      intro: "Dobrar e dividir são as duas jogadas em que você coloca <b>mais dinheiro na mesa</b>. Por isso são as que mais pesam no seu resultado: fazê-las nas mãos certas é de onde sai boa parte do que a estratégia básica rende. Tudo neste guia é para 6 baralhos, dobrando depois de dividir.",
      secciones: [
        {
          h: "A ideia por trás",
          p: [
            "Vale a pena colocar mais dinheiro quando você tem a vantagem naquela mão: quando sua mão é forte (um 10 ou um 11 esperando uma figura) ou quando o dealer está fraco. Com um 4, 5 ou 6 aberto, o dealer tem que pedir sobre uma mão ruim e <b>estoura em cerca de 40% das vezes</b>.",
          ],
        },
        {
          h: "Quando dobrar com mãos duras",
          tabla: [
            ["Sua mão", "Dobre contra", "Se não, peça"],
            ["11", "2 a 10", "contra Ás"],
            ["10", "2 a 9", "contra 10 e Ás"],
            ["9", "3 a 6", "contra 2 e do 7 em diante"],
            ["8 ou menos", "Nunca", "Sempre"],
          ],
          nota: "Se o dealer pede com 17 macio, o 11 também se dobra contra Ás. Com 12 ou mais nunca se dobra: uma única carta a mais raramente deixa você com uma boa mão.",
        },
        {
          h: "Quando dobrar com mãos macias",
          p: ["As mãos macias se dobram contra um dealer fraco: você não pode estourar com mais uma carta, e ele tem muitas chances de estourar."],
          tabla: [
            ["Sua mão", "Dobre contra", "Se não puder dobrar"],
            ["A,7 (18 macio)", "3 a 6 (e 2 se ele pede com 17 macio)", "pare"],
            ["A,6 (17 macio)", "3 a 6", "peça"],
            ["A,4 e A,5", "4 a 6", "peça"],
            ["A,2 e A,3", "5 e 6", "peça"],
            ["A,8 (19 macio)", "só 6, se ele pede com 17 macio", "pare"],
          ],
        },
        {
          h: "Quando dividir cada par",
          tabla: [
            ["Par", "O que fazer"],
            ["A,A e 8,8", "Divida sempre"],
            ["10,10", "Nunca: 20 já ganha quase sempre"],
            ["5,5", "Nunca: é um 10, dobre contra 2 a 9"],
            ["9,9", "Divida contra 2 a 6, 8 e 9. Contra 7, 10 e Ás, pare"],
            ["7,7", "Divida contra 2 a 7"],
            ["6,6", "Divida contra 2 a 6"],
            ["4,4", "Divida só contra 5 e 6"],
            ["2,2 e 3,3", "Divida contra 2 a 7"],
          ],
          nota: "Se na sua mesa não dá para dobrar depois de dividir, divide-se um pouco menos (por exemplo, 4,4 nunca se divide).",
        },
        {
          h: "Os casos que mais confundem",
          lista: [
            "<b>8,8 contra 10.</b> Dividir parece jogar mais dinheiro numa mão perdida, mas 16 é a pior mão do jogo. Duas mãos começando com 8 perdem menos que um 16.",
            "<b>9,9 contra 7.</b> Pare: 18 ganha do 17 que o dealer costuma fazer com um 7.",
            "<b>11 contra Ás.</b> Com a maioria das regras só se pede; dobra-se se o dealer pede com 17 macio.",
            "<b>A,7 contra 9, 10 ou Ás.</b> 18 macio parece bom, mas contra essas cartas parar perde mais: peça.",
          ],
        },
      ],
      faq: [
        ["Posso dobrar com qualquer mão?", "Depende da mesa. Na maioria dá para dobrar com quaisquer duas cartas iniciais; em algumas, só com 9, 10 ou 11."],
        ["O que acontece com os ases divididos?", "Em quase todos os cassinos, cada Ás dividido recebe uma única carta. Se sair uma figura, vale 21, não blackjack."],
        ["Quantas vezes posso dividir?", "Costuma ser permitido até ter 3 ou 4 mãos. Dividir ases de novo é permitido em poucas mesas."],
      ],
      relacionadas: ["estrategia", "reglas", "pago"],
    },
  },

  // ---------------------------------------------------------------- Seguro
  seguro: {
    es: {
      titulo: "El seguro en blackjack: ¿conviene tomarlo? | Edge 21",
      descripcion: "Qué es el seguro en blackjack, cuánto paga, por qué pierde dinero a la larga (también el pago par) y el único caso en que conviene: con el conteo alto.",
      h1: "El seguro en blackjack: ¿conviene?",
      tarjeta: "Por qué casi nunca conviene, y el único caso en que sí.",
      minutos: 4,
      intro: "Cuando la carta visible del crupier es un As, te ofrecen un <b>seguro</b>. Suena prudente, pero la respuesta corta es: <b>no lo tomes</b>, salvo que estés contando cartas y el conteo esté alto.",
      secciones: [
        {
          h: "Qué es el seguro",
          p: [
            "Es una apuesta aparte, de hasta la mitad de tu apuesta, a que el crupier tiene un blackjack (una carta de 10 boca abajo). Si lo tiene, el seguro paga <b>2 a 1</b>; si no, lo pierdes y la mano sigue normal.",
            "Por ejemplo: apuestas 10 y tomas un seguro de 5. Si el crupier tiene blackjack, pierdes los 10 de la mano pero cobras 10 del seguro: quedas igual. Si no lo tiene, pierdes los 5 del seguro.",
          ],
        },
        {
          h: "Por qué pierde a la larga",
          p: [
            "Para que el seguro no pierda dinero, el crupier tendría que tener blackjack <b>1 de cada 3 veces</b>. Pero con 6 mazos, de las cartas que quedan, solo alrededor del <b>31 %</b> valen 10.",
            "Ese 31 % contra el 33 % que haría falta parece poca diferencia, pero alcanza: el seguro le deja a la casa una ventaja de alrededor del <b>7 %</b>, más de diez veces lo que pierdes jugando bien una mano normal.",
          ],
          tabla: [
            ["De cada 100 seguros de 5", "Resultado"],
            ["Unas 31 veces el crupier tiene blackjack", "cobras 31 × 10 = 310"],
            ["Unas 69 veces no lo tiene", "pierdes 69 × 5 = 345"],
            ["Total", "pierdes unos 35, el 7 % de lo que apostaste en seguros"],
          ],
        },
        {
          h: "¿Y el “pago par” con blackjack?",
          p: [
            "Si tienes blackjack y el crupier muestra un As, te ofrecen <b>pago par</b> (<em>even money</em>): cobrar 1 a 1 ya, en lugar de arriesgarte al empate. Es exactamente lo mismo que tomar el seguro con un blackjack, con el mismo resultado: a la larga, cobras menos. Sin contar cartas, di que no.",
          ],
        },
        {
          h: "El único caso en que conviene",
          p: [
            "Si cuentas cartas con Hi-Lo, el seguro pasa a convenir cuando el <b>conteo real es +3 o más</b>: quedan tantas cartas altas que el crupier tiene blackjack más de 1 de cada 3 veces. Es la desviación más valiosa de los <em>Illustrious 18</em>. Si todavía no sabes qué es el conteo real, está en la <a href=\"{conteo}\">guía de contar cartas</a>.",
          ],
        },
      ],
      faq: [
        ["¿El seguro protege mi mano buena?", "No. Es una apuesta aparte que no cambia nada de tu mano. Que tu mano sea buena o mala no cambia lo que vale el seguro."],
        ["¿Y si tengo 20?", "Igual no conviene. Que tengas dos cartas de 10 en tu mano hasta lo empeora un poco: hay menos dieces para el crupier."],
        ["¿Por qué los casinos lo ofrecen siempre?", "Porque gana dinero para la casa. Muchos jugadores lo toman por miedo, y es de las apuestas que más les cuestan."],
      ],
      relacionadas: ["conteo", "reglas", "estrategia"],
    },
    en: {
      titulo: "Blackjack insurance: should you take it? | Edge 21",
      descripcion: "What insurance is in blackjack, what it pays, why it loses money in the long run (even money too) and the only time it's worth it: when the count is high.",
      h1: "Blackjack insurance: is it worth it?",
      tarjeta: "Why it's almost never worth it, and the one time it is.",
      minutos: 4,
      intro: "When the dealer's up card is an Ace, you're offered <b>insurance</b>. It sounds prudent, but the short answer is: <b>don't take it</b>, unless you're counting cards and the count is high.",
      secciones: [
        {
          h: "What insurance is",
          p: [
            "It's a side bet, up to half your bet, that the dealer has blackjack (a 10-value card face down). If they do, insurance pays <b>2 to 1</b>; if not, you lose it and the hand goes on as usual.",
            "For example: you bet 10 and take 5 of insurance. If the dealer has blackjack, you lose the 10 on the hand but collect 10 from insurance: you break even. If not, you lose the 5 of insurance.",
          ],
        },
        {
          h: "Why it loses in the long run",
          p: [
            "For insurance not to lose money, the dealer would need blackjack <b>1 time in 3</b>. But with 6 decks, only about <b>31%</b> of the remaining cards are worth 10.",
            "That 31% against the 33% it would need looks like a small gap, but it's enough: insurance gives the house an edge of about <b>7%</b>, more than ten times what you lose playing a normal hand well.",
          ],
          tabla: [
            ["Out of 100 insurance bets of 5", "Result"],
            ["About 31 times the dealer has blackjack", "you collect 31 × 10 = 310"],
            ["About 69 times they don't", "you lose 69 × 5 = 345"],
            ["Total", "you lose about 35, 7% of what you put on insurance"],
          ],
        },
        {
          h: "What about “even money” with a blackjack?",
          p: [
            "If you have blackjack and the dealer shows an Ace, you're offered <b>even money</b>: get paid 1 to 1 right now instead of risking a push. It's exactly the same as taking insurance on a blackjack, with the same outcome: in the long run, you collect less. Without counting, say no.",
          ],
        },
        {
          h: "The only time it's worth it",
          p: [
            "If you count cards with Hi-Lo, insurance becomes worth it when the <b>true count is +3 or more</b>: so many high cards are left that the dealer has blackjack more than 1 time in 3. It's the most valuable deviation of the <em>Illustrious 18</em>. If you don't know the true count yet, it's in the <a href=\"{conteo}\">card counting guide</a>.",
          ],
        },
      ],
      faq: [
        ["Does insurance protect my good hand?", "No. It's a separate bet that changes nothing about your hand. Whether your hand is good or bad doesn't change what insurance is worth."],
        ["What if I have 20?", "Still not worth it. Having two 10-value cards in your hand even makes it slightly worse: there are fewer tens left for the dealer."],
        ["Why do casinos always offer it?", "Because it makes money for the house. Many players take it out of fear, and it's one of the bets that costs them the most."],
      ],
      relacionadas: ["conteo", "reglas", "estrategia"],
    },
    pt: {
      titulo: "Seguro no blackjack: vale a pena fazer? | Edge 21",
      descripcion: "O que é o seguro no blackjack, quanto paga, por que perde dinheiro a longo prazo (o pagamento igual também) e o único caso em que vale a pena: com a contagem alta.",
      h1: "Seguro no blackjack: vale a pena?",
      tarjeta: "Por que quase nunca vale a pena, e o único caso em que vale.",
      minutos: 4,
      intro: "Quando a carta aberta do dealer é um Ás, oferecem a você um <b>seguro</b>. Parece prudente, mas a resposta curta é: <b>não faça</b>, a não ser que esteja contando cartas e a contagem esteja alta.",
      secciones: [
        {
          h: "O que é o seguro",
          p: [
            "É uma aposta à parte, de até metade da sua aposta, de que o dealer tem um blackjack (uma carta de 10 virada para baixo). Se ele tiver, o seguro paga <b>2 para 1</b>; se não, você o perde e a mão segue normal.",
            "Por exemplo: você aposta 10 e faz um seguro de 5. Se o dealer tiver blackjack, você perde os 10 da mão mas recebe 10 do seguro: fica no zero a zero. Se não tiver, você perde os 5 do seguro.",
          ],
        },
        {
          h: "Por que perde a longo prazo",
          p: [
            "Para o seguro não perder dinheiro, o dealer teria que ter blackjack <b>1 a cada 3 vezes</b>. Mas com 6 baralhos, das cartas que restam, só cerca de <b>31%</b> valem 10.",
            "Esses 31% contra os 33% necessários parecem pouca diferença, mas bastam: o seguro deixa para a casa uma vantagem de cerca de <b>7%</b>, mais de dez vezes o que você perde jogando bem uma mão normal.",
          ],
          tabla: [
            ["A cada 100 seguros de 5", "Resultado"],
            ["Umas 31 vezes o dealer tem blackjack", "você recebe 31 × 10 = 310"],
            ["Umas 69 vezes ele não tem", "você perde 69 × 5 = 345"],
            ["Total", "você perde uns 35, 7% do que apostou em seguros"],
          ],
        },
        {
          h: "E o “pagamento igual” com blackjack?",
          p: [
            "Se você tem blackjack e o dealer mostra um Ás, oferecem o <b>pagamento igual</b> (<em>even money</em>): receber 1 para 1 na hora, em vez de arriscar o empate. É exatamente o mesmo que fazer o seguro com um blackjack, com o mesmo resultado: a longo prazo, você recebe menos. Sem contar cartas, diga não.",
          ],
        },
        {
          h: "O único caso em que vale a pena",
          p: [
            "Se você conta cartas com Hi-Lo, o seguro passa a valer a pena quando a <b>contagem real é +3 ou mais</b>: restam tantas cartas altas que o dealer tem blackjack mais de 1 a cada 3 vezes. É o desvio mais valioso dos <em>Illustrious 18</em>. Se você ainda não sabe o que é a contagem real, está no <a href=\"{conteo}\">guia de contar cartas</a>.",
          ],
        },
      ],
      faq: [
        ["O seguro protege minha mão boa?", "Não. É uma aposta à parte que não muda nada na sua mão. Sua mão ser boa ou ruim não muda o que o seguro vale."],
        ["E se eu tiver 20?", "Mesmo assim não vale. Ter duas cartas de 10 na mão até piora um pouco: restam menos dez para o dealer."],
        ["Por que os cassinos sempre oferecem?", "Porque dá dinheiro para a casa. Muitos jogadores fazem o seguro por medo, e é uma das apostas que mais custam a eles."],
      ],
      relacionadas: ["conteo", "reglas", "estrategia"],
    },
  },

  // ---------------------------------------------------------------- 3:2 o 6:5
  pago: {
    es: {
      titulo: "Blackjack 3:2 o 6:5: cuánto te cuesta la mesa que paga 6 a 5 | Edge 21",
      descripcion: "La diferencia entre el blackjack que paga 3:2 y el que paga 6:5, en números: cuánto sube la ventaja de la casa y cuánto pierdes por hora. Con una calculadora.",
      h1: "Blackjack 3:2 o 6:5: cuánto te cuesta",
      tarjeta: "Una regla chica que cuesta más que todo lo demás junto.",
      minutos: 4,
      intro: "En el cartel de la mesa dice cuánto paga el blackjack: <b>3 a 2</b> o <b>6 a 5</b>. Parece un detalle, pero es la regla que más dinero te cuesta de todas: más que jugar con 8 mazos, más que un crupier que pide con 17 blando, más que no poder rendirse.",
      secciones: [
        {
          h: "La diferencia en una mano",
          tabla: [
            ["Apuesta", "Con 3:2", "Con 6:5", "Diferencia"],
            ["10", "15", "12", "3"],
            ["25", "37,50", "30", "7,50"],
            ["100", "150", "120", "30"],
          ],
        },
        {
          h: "La diferencia a la larga",
          p: [
            "Sacas un blackjack más o menos <b>una vez cada 21 manos</b> (4,75 %). Cada vez, con 6:5 cobras un 30 % de tu apuesta menos. Sumado, eso le agrega a la casa alrededor de <b>1,4 % de ventaja</b>: con estrategia básica perfecta, la mesa pasa de 0,5 % a casi 2 %. Es decir, <b>pierdes casi cuatro veces más</b>.",
            "Y para quien cuenta cartas es peor todavía: la ventaja del conteo es de 1 a 2 %, así que en una mesa 6:5 prácticamente desaparece.",
          ],
        },
        {
          h: "Calcula lo que te cuesta",
          calc: true,
        },
        {
          h: "Cómo darte cuenta",
          lista: [
            "Mira el paño: casi siempre está impreso, “BLACKJACK PAYS 3 TO 2” o “6 TO 5”.",
            "Las mesas 6:5 suelen tener la apuesta mínima más baja o ser de un solo mazo, para que parezcan mejores. No lo son.",
            "Si dudas, pregúntale al crupier antes de sentarte. Si es 6:5, busca otra mesa.",
          ],
        },
      ],
      faq: [
        ["¿Y si la mesa 6:5 es de un solo mazo?", "Igual sale peor. Un solo mazo le baja a la casa alrededor de 0,5 %, pero el 6:5 le sube 1,4 %."],
        ["¿Pasa lo mismo en el blackjack online?", "Sí. Mira las reglas de la mesa: en la mayoría de las mesas online el blackjack paga 3:2, pero algunas pagan 6:5 o hasta 1:1."],
        ["¿Hay algo peor que 6:5?", "Pagar el blackjack 1 a 1 (igual que cualquier mano ganadora). Le suma a la casa más de 2 %."],
      ],
      relacionadas: ["reglas", "estrategia", "seguro"],
      calc: {
        apuesta: "Tu apuesta",
        manos: "Manos por hora",
        horas: "Horas que juegas",
        res: "Con 6:5 pierdes unos <b>{0}</b> más que con 3:2.",
        nota: "Promedio: blackjack 4,75 % de las manos, 30 % menos de pago cada vez.",
        dec: ",",
      },
    },
    en: {
      titulo: "Blackjack 3:2 vs 6:5: what the 6 to 5 table really costs | Edge 21",
      descripcion: "The difference between blackjack that pays 3:2 and 6:5, in numbers: how much the house edge goes up and how much you lose per hour. With a calculator.",
      h1: "Blackjack 3:2 vs 6:5: what it costs you",
      tarjeta: "One small rule that costs more than everything else combined.",
      minutos: 4,
      intro: "The table sign tells you what blackjack pays: <b>3 to 2</b> or <b>6 to 5</b>. It looks like a detail, but it's the costliest rule of all: worse than 8 decks, worse than the dealer hitting soft 17, worse than no surrender.",
      secciones: [
        {
          h: "The difference on one hand",
          tabla: [
            ["Bet", "At 3:2", "At 6:5", "Difference"],
            ["10", "15", "12", "3"],
            ["25", "37.50", "30", "7.50"],
            ["100", "150", "120", "30"],
          ],
        },
        {
          h: "The difference in the long run",
          p: [
            "You get a blackjack about <b>once every 21 hands</b> (4.75%). Each time, at 6:5 you collect 30% of your bet less. Added up, that gives the house about <b>1.4% more edge</b>: with perfect basic strategy, the table goes from 0.5% to almost 2%. In other words, <b>you lose almost four times as much</b>.",
            "And for card counters it's even worse: the counting edge is 1 to 2%, so at a 6:5 table it practically disappears.",
          ],
        },
        {
          h: "Work out what it costs you",
          calc: true,
        },
        {
          h: "How to spot it",
          lista: [
            "Look at the felt: it's almost always printed, “BLACKJACK PAYS 3 TO 2” or “6 TO 5”.",
            "6:5 tables often have lower minimums or use a single deck, to look better. They aren't.",
            "If in doubt, ask the dealer before you sit down. If it's 6:5, find another table.",
          ],
        },
      ],
      faq: [
        ["What if the 6:5 table is single-deck?", "It still comes out worse. A single deck lowers the house edge by about 0.5%, but 6:5 raises it by 1.4%."],
        ["Is it the same in online blackjack?", "Yes. Check the table rules: most online tables pay 3:2, but some pay 6:5 or even 1:1."],
        ["Is there anything worse than 6:5?", "Paying blackjack 1 to 1 (like any winning hand). It adds more than 2% to the house edge."],
      ],
      relacionadas: ["reglas", "estrategia", "seguro"],
      calc: {
        apuesta: "Your bet",
        manos: "Hands per hour",
        horas: "Hours you play",
        res: "At 6:5 you lose about <b>{0}</b> more than at 3:2.",
        nota: "On average: blackjack on 4.75% of hands, 30% less paid each time.",
        dec: ".",
      },
    },
    pt: {
      titulo: "Blackjack 3:2 ou 6:5: quanto custa a mesa que paga 6 para 5 | Edge 21",
      descripcion: "A diferença entre o blackjack que paga 3:2 e o que paga 6:5, em números: quanto sobe a vantagem da casa e quanto você perde por hora. Com uma calculadora.",
      h1: "Blackjack 3:2 ou 6:5: quanto custa",
      tarjeta: "Uma regra pequena que custa mais que todo o resto junto.",
      minutos: 4,
      intro: "Na placa da mesa está escrito quanto paga o blackjack: <b>3 para 2</b> ou <b>6 para 5</b>. Parece um detalhe, mas é a regra que mais custa dinheiro de todas: mais que jogar com 8 baralhos, mais que um dealer que pede com 17 macio, mais que não poder desistir.",
      secciones: [
        {
          h: "A diferença numa mão",
          tabla: [
            ["Aposta", "Com 3:2", "Com 6:5", "Diferença"],
            ["10", "15", "12", "3"],
            ["25", "37,50", "30", "7,50"],
            ["100", "150", "120", "30"],
          ],
        },
        {
          h: "A diferença a longo prazo",
          p: [
            "Você tira um blackjack mais ou menos <b>uma vez a cada 21 mãos</b> (4,75%). A cada vez, com 6:5 você recebe 30% da aposta a menos. Somado, isso dá à casa cerca de <b>1,4% a mais de vantagem</b>: com estratégia básica perfeita, a mesa passa de 0,5% para quase 2%. Ou seja, <b>você perde quase quatro vezes mais</b>.",
            "E para quem conta cartas é ainda pior: a vantagem da contagem é de 1 a 2%, então numa mesa 6:5 ela praticamente desaparece.",
          ],
        },
        {
          h: "Calcule quanto custa",
          calc: true,
        },
        {
          h: "Como perceber",
          lista: [
            "Olhe o feltro: quase sempre está impresso, “BLACKJACK PAYS 3 TO 2” ou “6 TO 5”.",
            "As mesas 6:5 costumam ter aposta mínima mais baixa ou usar um só baralho, para parecerem melhores. Não são.",
            "Na dúvida, pergunte ao dealer antes de sentar. Se for 6:5, procure outra mesa.",
          ],
        },
      ],
      faq: [
        ["E se a mesa 6:5 for de um só baralho?", "Mesmo assim sai pior. Um só baralho reduz a vantagem da casa em cerca de 0,5%, mas o 6:5 a aumenta em 1,4%."],
        ["Acontece o mesmo no blackjack online?", "Sim. Veja as regras da mesa: na maioria das mesas online o blackjack paga 3:2, mas algumas pagam 6:5 ou até 1:1."],
        ["Existe algo pior que 6:5?", "Pagar o blackjack 1 para 1 (igual a qualquer mão vencedora). Soma mais de 2% à vantagem da casa."],
      ],
      relacionadas: ["reglas", "estrategia", "seguro"],
      calc: {
        apuesta: "Sua aposta",
        manos: "Mãos por hora",
        horas: "Horas que você joga",
        res: "Com 6:5 você perde cerca de <b>{0}</b> a mais que com 3:2.",
        nota: "Em média: blackjack em 4,75% das mãos, 30% a menos de pagamento a cada vez.",
        dec: ",",
      },
    },
  },
};
