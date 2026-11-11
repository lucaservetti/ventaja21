// Glosario de blackjack: lo usan la Guía (lista completa) y las lecciones (algunas palabras se
// pueden tocar para ver qué significan; ver ui/termino.jsx).
const GLOSSARY = [
  ["As blando", "As que vale 11 en tu mano (soft ace)."],
  [
    "Bandeja de descarte",
    "Donde van las cartas ya jugadas. Sirve para estimar los mazos que quedan (discard tray).",
  ],
  ["Banca", "El dinero que separas solo para jugar (bankroll)."],
  ["Blackjack", "As + carta de 10 en las dos primeras cartas. Paga 3 a 2."],
  ["Blanda (mano)", "Mano con un As que vale 11, como A,7 (soft)."],
  [
    "Carta de corte",
    "Marca dentro del zapato: cuando sale, se termina la ronda y se mezcla (cut card).",
  ],
  [
    "Conteo corrido",
    "La suma de los valores de todas las cartas vistas desde la última mezcla (running count).",
  ],
  [
    "Conteo real",
    "Conteo corrido dividido por los mazos que quedan (true count).",
  ],
  ["Crupier", "Quien reparte y juega por la casa (en inglés, dealer)."],
  ["Desviación", "Jugada que cambia según el conteo (deviation)."],
  ["Doblar", "Duplicar la apuesta y recibir una sola carta (double)."],
  ["Dura (mano)", "Mano sin As, o con el As valiendo 1 (hard)."],
  ["Empate", "Mismo total que el crupier: recuperas tu apuesta (push)."],
  ["H17 / S17", "El crupier pide (H17) o se planta (S17) con 17 blando."],
  ["Índice", "Conteo real a partir del cual cambia una jugada (index)."],
  [
    "Pago parejo",
    "Cobrar 1 a 1 tu blackjack cuando el crupier muestra As (even money).",
  ],
  ["Pasarse", "Superar 21. Pierdes la mano (bust)."],
  ["Pedir", "Recibir otra carta (hit)."],
  [
    "Penetración",
    "Qué parte del zapato se reparte antes de mezclar (penetration).",
  ],
  ["Plantarse", "No recibir más cartas (stand)."],
  ["Rendirse", "Abandonar la mano y recuperar la mitad (surrender)."],
  [
    "RNG",
    "Generador aleatorio: el blackjack online automático que mezcla cada mano.",
  ],
  [
    "Seguro",
    "Apuesta aparte a que el crupier tiene blackjack. Paga 2 a 1 (insurance).",
  ],
  ["Separar", "Dividir un par en dos manos (split)."],
  [
    "Unidad",
    "Tu apuesta base. La escala de apuestas se mide en unidades (unit).",
  ],
  ["Wonging", "Mirar la mesa sin jugar y entrar cuando el conteo sube."],
  [
    "Zapato",
    "Caja de donde se reparten las cartas cuando se juega con varios mazos (shoe).",
  ],
];

// Palabras técnicas que se marcan en las lecciones (la primera vez que aparecen en cada texto).
// Cada una apunta a su entrada del glosario. Las palabras comunes (pedir, doblar, crupier) no se
// marcan: ya se explican en la lección y llenarían todo de subrayados.
const MARCAR = [
  "Zapato",
  "Conteo corrido",
  "Conteo real",
  "Desviación",
  "Penetración",
  "Carta de corte",
  "Bandeja de descarte",
  "Índice",
  "Unidad",
  "Banca",
  "H17 / S17",
  "Wonging",
  "RNG",
  "Pago parejo",
  "As blando",
];
export { GLOSSARY, MARCAR };
