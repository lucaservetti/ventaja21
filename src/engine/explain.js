import { upLabel } from "./cards.js";
import { bustChances } from "./ev.js";

const bustCache = {};
function bustPct(a, e) {
  let t = e.h17 ? "h" : "s";
  if (!bustCache[t]) {
    bustCache[t] = bustChances(e.h17);
  }
  let s = a === "A" ? 1 : ["10", "J", "Q", "K", "T"].includes(a) ? 10 : +a;
  return Math.round(bustCache[t][s] * 100);
}
const upName = (a) => (a === "A" ? "As" : a);
const vsText = (a) => `contra ${a === "A" ? "un As" : "un " + a}`;
function softName(a) {
  return `${a} blando (A,${a - 11})`;
}
function explainBest(a, e, t, s) {
  let n = upLabel(a.upRank),
    l = upName(n),
    i = ["2", "3", "4", "5", "6"].includes(n),
    o = bustPct(a.upRank, s),
    c = a.total,
    r = (t === "D" || t === "Ds") && e !== "D";
  if (a.kind === "pair") {
    let u = a.g;
    if (e === "R")
      return `Con H17 y rendición, el 8,8 ${vsText(l)} pierde un poco menos rindiéndose que separando: recuperás la mitad de la apuesta.`;
    switch (u) {
      case "A":
        return "Separá siempre los ases. Juntos suman un 12 flojo; separados, cada As arranca una mano que puede llegar a 21.";
      case "T":
        return e === "P"
          ? `Separar dieces solo conviene con el conteo muy alto: quedan tantas cartas altas que cada 10 ${vsText(l)} vale más que el 20.`
          : "Nunca separes los dieces: 20 gana casi siempre. Romper una mano así es regalar plata.";
      case "9":
        return e === "S" && n === "7"
          ? "Plantate con 9,9 contra 7. Tu 18 ya le gana al 17 que el crupier va a hacer seguido."
          : e === "S"
            ? `Plantate con 9,9 ${vsText(l)}. Separar contra una carta tan fuerte arma dos manos que pierden; 18 se defiende mejor.`
            : `Separá los 9 ${vsText(l)}. Dos manos que arrancan en 9 le ganan más al crupier que un 18 solo.`;
      case "8":
        return `Separá los ochos ${vsText(l)}. 16 es la peor mano del juego; dos manos que arrancan en 8 pierden mucho menos.`;
      case "7":
        return e === "P"
          ? `Separá los 7 ${vsText(l)}. 14 es una mano mala; dos manos de 7 contra una carta de hasta 7 rinden más.`
          : `No separes los 7 ${vsText(l)}: contra una carta fuerte armarías dos manos malas. Jugalo como 14 duro y pedí.`;
      case "6":
        return e === "P"
          ? `Separá los 6 ${vsText(l)}. El crupier arranca débil y dos manos de 6 le sacan más que un 12.`
          : n === "2"
            ? "Con 6,6 contra 2 se separa solo si te dejan doblar después de separar. En esta mesa no: pedí."
            : `No separes los 6 ${vsText(l)}: contra una carta fuerte armarías dos manos perdedoras. Pedí.`;
      case "5":
        return e === "D"
          ? `Nunca separes los 5: son un 10, la segunda mejor mano para doblar. Doblá ${vsText(l)}.`
          : r
            ? "Nunca separes los 5. Juegan como un 10: acá doblarías, pero si no se puede, pedí."
            : `Nunca separes los 5: jugalos como un 10. ${vsText(l).replace(/^c/, "C")} no conviene doblar, así que pedí.`;
      case "4":
        return e === "P"
          ? `Separá los 4 ${vsText(l)} porque podés doblar después de separar: cada 4 puede terminar en una buena mano para doblar.`
          : "Con 4,4 pedí: 8 no se dobla ni conviene separarlo.";
      case "3":
      case "2":
        return e === "P"
          ? `Separá ${u},${u} ${vsText(l)}. Con el crupier sin una carta alta, dos manos chicas rinden más que un ${+u * 2} que igual tenés que pedir.`
          : `No separes ${u},${u} ${vsText(l)}. Pedí: ${s.das ? "contra cartas altas" : "sin poder doblar después de separar"} dos manos chicas no rinden.`;
      default:
        break;
    }
  }
  if (a.kind === "soft") {
    let u = softName(c);
    return c >= 20
      ? `Con ${c} blando te plantás siempre: es una mano ganadora.`
      : c === 19
        ? e === "D"
          ? "Con H17, doblá 19 blando contra 6: el crupier con 6 se pasa muchísimo y tu mano no se puede pasar con una carta."
          : r
            ? "Lo ideal es doblar 19 blando contra 6, pero como ya no se puede, te plantás."
            : "Plantate con 19 blando: es una mano ganadora contra cualquier carta."
        : c === 18
          ? e === "D"
            ? `Doblá ${u} ${vsText(l)}. El crupier con ${l} se pasa el ${o} % de las veces y tu mano no se puede pasar con una carta.`
            : r
              ? `Lo ideal es doblar 18 blando ${vsText(l)}, pero con más de dos cartas no se puede: entonces te plantás.`
              : e === "S"
                ? `Plantate con 18 blando ${vsText(l)}. Contra ${l}, 18 ya gana más de lo que pierde.`
                : `Pedí con 18 blando ${vsText(l)}. 18 parece bueno, pero contra ${l} pierde más de lo que gana. Una carta no te puede pasar y puede mejorarte.`
          : c === 21
            ? "Con 21 te plantás."
            : c === 12
              ? "Pedí con 12 blando: ninguna carta te puede pasar y 12 no le gana a nada."
              : e === "D"
                ? `Doblá ${u} ${vsText(l)}. Una carta no te puede pasar y el crupier con ${l} está en problemas: es el momento de poner más plata.`
                : r
                  ? `${u.charAt(0).toUpperCase() + u.slice(1)} se dobla ${vsText(l)}, pero con más de dos cartas no se puede: pedí.`
                  : c === 17
                    ? `Pedí con 17 blando ${vsText(l)}. Un 17 casi nunca gana y una carta no te puede pasar: la carta es gratis.`
                    : `Pedí con ${u}. No te podés pasar con una carta y ${c} blando es muy poco para plantarse.`;
  }
  return e === "R"
    ? c === 17
      ? "17 contra As en una mesa H17 pierde tanto que rendirse sale más barato: recuperás la mitad de la apuesta."
      : `Rendite: recuperás la mitad de la apuesta. ${c} ${vsText(l)} pierde más de la mitad de las veces aunque la juegues perfecto.`
    : c <= 8
      ? `Con ${c} siempre pedís. Ninguna carta te puede pasar y ${c} no le gana a nada.`
      : c >= 17
        ? `Con ${c} duro te plantás siempre. Pedir te hace pasar demasiado seguido, muestre lo que muestre el crupier.`
        : c === 9
          ? e === "D"
            ? `Doblá 9 ${vsText(l)}. El crupier con ${l} está débil y con una carta tenés buenas chances de llegar a 19 o 20.`
            : r
              ? `9 ${vsText(l)} se dobla, pero con más de dos cartas no se puede: pedí.`
              : n === "2"
                ? "Pedí con 9 contra 2. El 2 no es tan débil como parece: doblar no alcanza a pagar."
                : `Pedí con 9 ${vsText(l)}. El crupier arranca fuerte; no conviene poner más plata con un 9.`
          : c === 10
            ? e === "D"
              ? `Doblá 10 ${vsText(l)}. Cualquier figura te deja en 20 y el crupier arranca más débil que vos.`
              : r
                ? `10 ${vsText(l)} se dobla, pero con más de dos cartas no se puede: pedí.`
                : `Pedí con 10 ${vsText(l)}. El crupier tiene una carta tan buena como la tuya: no es momento de doblar.`
            : c === 11
              ? e === "D"
                ? `Doblá 11 ${vsText(l)}. Es la mejor mano para doblar: casi un tercio de las cartas valen 10 y te dejan en 21.`
                : r
                  ? `11 ${vsText(l)} se dobla, pero con más de dos cartas no se puede: pedí.`
                  : "Pedí con 11 contra As. Si el crupier se planta con 17 blando, el As es demasiado fuerte para doblar (en mesas H17 sí se dobla)."
              : e === "S"
                ? c === 12
                  ? `Plantate con 12 ${vsText(l)}. El crupier con ${l} se pasa el ${o} % de las veces; no te arriesgues a pasarte primero.`
                  : i
                    ? `Plantate con ${c} ${vsText(l)}. Un crupier que muestra ${l} se pasa el ${o} % de las veces: tu trabajo es no pasarte primero y dejar que pierda solo.`
                    : `Plantate con ${c} ${vsText(l)}. Con el conteo alto quedan muchas cartas altas: pedir te pasa demasiado y el crupier se pasa más.`
                : c === 12 && (n === "2" || n === "3")
                  ? `Pedí con 12 ${vsText(l)}. Solo te pasás con un 10 o una figura, y con ${l} el crupier se pasa menos de lo que parece (${o} %).`
                  : i
                    ? `Pedí con ${c} ${vsText(l)}. Con el conteo bajo quedan muchas cartas chicas: el crupier se pasa menos y pedir te pasa poco.`
                    : c === 16 && n === "10"
                      ? "Pedí con 16 contra 10. Es la mano más odiada del blackjack: perdés seguido hagas lo que hagas, pero pedir pierde un poco menos que plantarse."
                      : `Pedí con ${c} ${vsText(l)}. Duele, pero con ${l} el crupier termina en 17 o más la mayoría de las veces: plantarte con ${c} solo espera a perder.`;
}
function explainMistake(a, e, t, s) {
  let n = upLabel(a.upRank),
    l = upName(n),
    i = bustPct(a.upRank, s),
    o = a.total,
    c = a.kind === "hard" && o >= 12 && o <= 16;
  return e === "R"
    ? "Rendirte acá regala media apuesta en una mano que se puede jugar mejor."
    : t === "R"
      ? "Acá rendirse pierde menos que cualquier otra jugada: te devuelven la mitad de la apuesta."
      : e === "P"
        ? "Separar acá arma dos manos peores que la que tenías."
        : t === "P"
          ? "Esta mano rinde más separada que jugada como total."
          : e === "S" && t === "H"
            ? c
              ? `Plantarte con ${o} te deja esperando que el crupier se pase, y con ${l} eso pasa solo el ${i} % de las veces.`
              : a.kind === "soft"
                ? `Plantarte con ${o} blando desperdicia una carta gratis: ninguna carta te puede pasar.`
                : `Plantarte con ${o} es muy poco: el crupier llega a 17 o más casi siempre.`
            : e === "H" && t === "S"
              ? c
                ? `Pedir con ${o} te arriesgó a pasarte sin necesidad. ${vsText(l).replace(/^c/, "C")}, el crupier se pasa seguido y esta mano gana esperando.`
                : "Pedir acá arriesga una mano que ya es buena."
              : e === "H" && t === "D"
                ? "Pedir iba en la dirección correcta, pero con poca plata. Esta mano es favorita: la carta llega igual, así que conviene que llegue con el doble de apuesta."
                : e === "S" && t === "D"
                  ? "Plantarte desperdicia una mano favorita: acá conviene doblar la apuesta."
                  : e === "D" && t === "H"
                    ? "Doblar pone más plata en una mano que no es favorita. Pedí sin aumentar la apuesta."
                    : e === "D" && t === "S"
                      ? "Doblar te obliga a tomar una carta y esta mano gana más plantándose."
                      : "";
}
function costText(a) {
  if (!(a > 0.001)) return "";
  let e = a * 100;
  return `Este error cuesta en promedio ${e >= 10 ? Math.round(e).toString() : e.toFixed(1).replace(".", ",")} % de la apuesta.`;
}
function explainDeviation(a, e, t, s) {
  let n = t.h17 ? a.h17 : a.s17,
    l = n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0",
    i = a.up === "A" ? "As" : a.up,
    o = vsText(i),
    c = s >= n;
  if (a.type === "ins")
    return c
      ? `Con conteo real ${l} o más, más de un tercio de las cartas que quedan valen 10: el seguro pasa a ganar plata. Tomalo.`
      : `Sin conteo real de ${l} o más, el seguro pierde plata: quedan menos de un tercio de dieces. No lo tomes.`;
  if (a.type === "pair")
    return c
      ? `Con conteo real ${l} o más, separá los dieces ${o}: cada 10 arranca una mano muy fuerte contra un crupier débil. Ojo: en un casino es la jugada que más llama la atención.`
      : `Plantate con 20 ${o}. Separar dieces recién conviene con conteo real ${l} o más.`;
  let r = a.total;
  return a.at === "R"
    ? c
      ? `Con conteo real ${l} o más, rendite con ${r} ${o}: con tantas cartas altas tu mano pierde todavía más seguido.`
      : `Con conteo real menor a ${l}, no te rindas con ${r} ${o}: pedí.`
    : a.at === "D"
      ? n < 0
        ? c
          ? `Doblá ${r} ${o}. Recién dejás de doblar si el conteo real baja de ${l}.`
          : `Con conteo real menor a ${l} quedan pocas cartas altas: pedí con ${r} en vez de doblar.`
        : c
          ? `Con conteo real ${l} o más, doblá ${r} ${o}: sobran cartas altas para completar tu mano.`
          : `Con conteo real menor a ${l}, pedí con ${r} ${o}: todavía no conviene doblar.`
      : n <= 0
        ? c
          ? `Plantate con ${r} ${o}${n < 0 ? `: recién con conteo real menor a ${l} conviene pedir` : ": con conteo real 0 o más, pedir te pasa más seguido de lo que te salva"}.`
          : `Con conteo real menor a ${l}, pedí con ${r} ${o}: quedan muchas cartas chicas, el crupier se pasa menos y pedir te pasa poco.`
        : c
          ? `Con conteo real ${l} o más, plantate con ${r} ${o}: quedan muchas cartas altas, pedir te pasa más y el crupier se pasa más.`
          : `Con conteo real menor a ${l}, pedí con ${r} ${o}: la estrategia básica manda y el conteo todavía no alcanza para cambiarla.`;
}
export { costText, explainBest, explainDeviation, explainMistake };
