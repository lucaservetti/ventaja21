import { useMemo } from "react";
import { jsx as _jsx } from "react/jsx-runtime";
import { describeRules, withRules } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { FAB_4, ILLUSTRIOUS_18 } from "../engine/strategy.js";
import { IconButton, StrategyChart, cx } from "../ui/components.jsx";
import { evFor } from "../engine/ev.js";
import { SYSTEMS, SYSTEM_IDS, fmtTag } from "../engine/systems.js";
import { useRules } from "../ui/common.jsx";
import { BetRamp, Visual, rich } from "../lessons/visuals.jsx";
import { useNav } from "../nav.js";

const GP = ({ children: a }) => (
  <p className="g-p">{typeof a == "string" ? rich(a) : a}</p>
);
const GH = ({ children: a }) => <h2 className="g-h">{a}</h2>;
const GList = ({ items: a }) => (
  <ul className="g-ul">
    {a.map((e, t) => (
      <li key={t}>{rich(e)}</li>
    ))}
  </ul>
);
function GuideRules() {
  return (
    <>
      <GP>
        El blackjack se juega contra el crupier. Ganás si tu mano suma más que
        la suya sin pasarte de 21, o si el crupier se pasa.
      </GP>
      <GH>Valores</GH>
      <GList
        items={[
          "Del 2 al 10: su número.",
          "J, Q y K: 10.",
          "As: 1 u 11, lo que más convenga.",
          "**Blackjack:** As + carta de 10 en las dos primeras cartas. Paga 3 a 2 (en mesas malas, 6 a 5).",
        ]}
      />
      <GH>Cómo se juega una mano</GH>
      <GList
        items={[
          "Apostás y recibís dos cartas. El crupier recibe una visible y otra tapada.",
          "Si el crupier muestra As o 10, revisa si tiene blackjack. Si muestra As, antes te ofrece el **seguro**.",
          "Jugás tu mano: **pedir**, **plantarte**, **doblar** (duplicás la apuesta y recibís una sola carta), **separar** un par (cada carta arranca una mano) o **rendirte** (si se permite: recuperás la mitad).",
          "Después juega el crupier: pide hasta 17 o más. Según la mesa, con 17 blando se planta (S17) o pide (H17).",
          "Si te pasaste, perdiste aunque después el crupier también se pase.",
        ]}
      />
      <GH>Pagos</GH>
      <GList
        items={[
          "Ganás: 1 a 1.",
          "Blackjack: 3 a 2.",
          "Seguro: 2 a 1.",
          "Empate: recuperás tu apuesta.",
          "Rendición: recuperás la mitad.",
        ]}
      />
    </>
  );
}
function GuideStrategy() {
  let a = useRules();
  return (
    <>
      <GP>
        La estrategia básica es la mejor forma de jugar cada mano sin contar
        cartas. Esta tabla se adapta a las reglas de tu mesa (las cambiás en
        Ajustes).
      </GP>
      <div className="tags" style={{ margin: "10px 0 16px" }}>
        {describeRules(a).map((e) => (
          <span className="chip-tag" key={e}>
            {e}
          </span>
        ))}
      </div>
      <StrategyChart rules={a} />
      <GH>Las reglas de oro</GH>
      <GList
        items={[
          "Con 17 duro o más, plantate siempre. Con 8 o menos, pedí siempre.",
          "Con 12 a 16: plantate contra 2 a 6 y pedí contra 7 a As. Excepción: 12 contra 2 y 3 se pide.",
          "Doblá 11 contra todo menos As, 10 contra 2 a 9, y 9 contra 3 a 6.",
          "Separá siempre ases y ochos. Nunca separes dieces ni cincos.",
          "A,7 (18 blando): plantate contra 2, 7 y 8; doblá contra 3 a 6; pedí contra 9, 10 y As.",
          "Nunca tomes el seguro (salvo contando, con conteo real +3 o más).",
        ]}
      />
    </>
  );
}
function GuideSystems() {
  let a = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "A"];
  return (
    <>
      <GP>
        Todos los sistemas hacen lo mismo: suman por las cartas bajas que salen
        y restan por las altas. Cambia cuánto pesa cada carta.
      </GP>
      <div className="g-table-wrap">
        <table className="g-table">
          <thead>
            <tr>
              <th>Sistema</th>
              {a.map((e) => (
                <th key={e}>{e === "T" ? "10" : e}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SYSTEM_IDS.map((e) => {
              let t = SYSTEMS[e];
              return (
                <tr key={e}>
                  <td>
                    <b>{t.short || t.name}</b>
                  </td>
                  {a.map((s) => {
                    let n = t.values[s];
                    return (
                      <td
                        className={cx(
                          "num",
                          n > 0 ? "good" : n < 0 ? "bad" : "dim",
                        )}
                        key={s}
                      >
                        {fmtTag(n)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <GH>Balanceados y no balanceados</GH>
      <GP>
        En un sistema **balanceado** (Hi-Lo, Hi-Opt, Zen, Omega II, Halves) un
        mazo completo suma 0, y para decidir tenés que dividir por los mazos que
        quedan (conteo real).
      </GP>
      <GP>
        En uno **no balanceado** como KO, un mazo suma +4. A cambio no hace
        falta dividir: arrancás en 4 − 4 × mazos (con 6 mazos, −20) y cuando el
        conteo corrido llega a +4 la ventaja es parecida a un conteo real Hi-Lo
        de +4, quede lo que quede del zapato. Se empieza a subir la apuesta un
        poco antes de ese punto.
      </GP>
      <GH>¿Cuál elegir?</GH>
      <GList
        items={[
          "**Hi-Lo:** el estándar. Casi toda la información de desviaciones y apuestas está pensada para Hi-Lo. Empezá acá.",
          "**KO:** si te cuesta dividir. Un poco menos preciso.",
          "**Zen, Omega II, Hi-Opt II, Halves:** más precisos, pero más trabajo mental. Valen la pena solo si ya dominás Hi-Lo.",
        ]}
      />
    </>
  );
}
function GuideTrueCount() {
  return (
    <>
      <GP>
        **Conteo real = conteo corrido ÷ mazos que quedan.** Los mazos que
        quedan se estiman mirando la bandeja de descarte, redondeando a medio
        mazo.
      </GP>
      <Visual v={{ v: "tc", rc: 6, decks: 3 }} />
      <GP>
        En esta app el conteo real se redondea **hacia abajo** (+2,7 → +2; −0,5
        → −1). Para las desviaciones da lo mismo: la jugada cambia cuando el
        conteo real llega al índice.
      </GP>
      <GH>Cuánto apostar</GH>
      <GP>
        Cada punto de conteo real suma alrededor de 0,5 % a tu favor. Una escala
        simple, en unidades:
      </GP>
      <BetRamp />
      <Visual v={{ v: "edge" }} />
      <GP>
        La ventaja con conteo neutro depende de las reglas: con malas reglas
        (H17, 6:5) hacen falta conteos más altos para estar arriba.
      </GP>
    </>
  );
}
function GuideDeviations() {
  let a = useRules(),
    e = (t) => {
      let s = t.s17,
        n = t.h17,
        l = (o) => (o > 0 ? `+${o}` : o < 0 ? `−${Math.abs(o)}` : "0"),
        i = {
          S: "Plantarse",
          H: "Pedir",
          D: "Doblar",
          P: "Separar",
          R: "Rendirse",
          I: "Tomar seguro",
          N: "Sin seguro",
        };
      return (
        <tr key={t.id}>
          <td className="num dim">{t.rank}</td>
          <td>
            <b>{t.label}</b>
          </td>
          <td>
            {i[t.at]}
            {" con "}
            {l(a.h17 ? n : s)}
            {" o más"}
            {s !== n ? (
              <span className="dim tiny">
                {" (S17 "}
                {l(s)}
                {" · H17 "}
                {l(n)})
              </span>
            ) : null}
          </td>
        </tr>
      );
    };
  return (
    <>
      <GP>
        Las desviaciones son jugadas que cambian según el conteo real (Hi-Lo).
        Por debajo del índice, se juega la estrategia básica. Están ordenadas
        por cuánto valen.
      </GP>
      <GH>Illustrious 18</GH>
      <div className="g-table-wrap">
        <table className="g-table left">
          <tbody>{ILLUSTRIOUS_18.map(e)}</tbody>
        </table>
      </div>
      <GP>
        Las de índice negativo (13 contra 2, 12 contra 4, 5 y 6, 13 contra 3) se
        leen al revés: te plantás hasta que el conteo real baja del índice, y
        ahí pedís.
      </GP>
      <GH>Fab 4 (solo con rendición)</GH>
      <div className="g-table-wrap">
        <table className="g-table left">
          <tbody>{FAB_4.map(e)}</tbody>
        </table>
      </div>
      <GP>
        Índices para zapatos de 4 a 8 mazos. Fuentes: Don Schlesinger, Blackjack
        Attack; Wizard of Odds.
      </GP>
    </>
  );
}
function GuideTableRules() {
  let a = withRules({
      decks: 6,
      h17: false,
      das: true,
      surrender: false,
      bjPays: 1.5,
    }),
    e = useMemo(() => {
      let t = (l) => -evFor(withRules({ ...a, ...l })).gameEV(),
        s = t({}),
        n = (l) => t(l) - s;
      return [
        { name: "El blackjack paga 6:5", v: n({ bjPays: 1.2 }) },
        { name: "El crupier pide con 17 blando", v: n({ h17: true }) },
        { name: "No se puede doblar después de separar", v: n({ das: false }) },
        { name: "Doblar solo con 10 y 11", v: n({ doubleOn: "10-11" }) },
        { name: "Doblar solo con 9 a 11", v: n({ doubleOn: "9-11" }) },
        { name: "Rendición tardía", v: n({ surrender: true }) },
        { name: "Volver a separar ases", v: n({ rsa: true }) },
      ];
    }, []);
  return (
    <>
      <GP>
        Cada regla mueve la ventaja de la casa. Estos son los cambios
        aproximados contra una mesa de 6 mazos, S17, que deja doblar después de
        separar y paga 3:2:
      </GP>
      <div className="card flat" style={{ marginTop: 10 }}>
        {e.map((t) => (
          <div className="kv" key={t.name}>
            <span className="kv-k" style={{ fontWeight: 600 }}>
              {t.name}
            </span>
            <span className={cx("kv-v num", t.v > 0 ? "bad" : "good")}>
              {t.v > 0 ? "+" : "−"}
              {Math.abs(t.v * 100)
                .toFixed(2)
                .replace(".", ",")}
              {" %"}
            </span>
          </div>
        ))}
      </div>
      <GP>
        Positivo = mejor para la casa. Calculado por la app con un modelo de
        mazo infinito; con 6 mazos los valores reales son muy parecidos.
      </GP>
      <GH>La penetración</GH>
      <GP>
        Es hasta dónde reparten antes de mezclar. Con el corte al 50 %, los
        conteos altos casi no llegan. Con 75 % o más, contar vale la pena. Es la
        regla que más le importa a un contador.
      </GP>
    </>
  );
}
function GuideBankroll() {
  return (
    <>
      <GP>
        Contar te da alrededor de 1 % de ventaja, pero la varianza del blackjack
        es grande: podés perder durante semanas jugando perfecto.
      </GP>
      <GList
        items={[
          "Separá una **banca** solo para jugar. Nunca uses plata que necesitás.",
          "Una referencia común: tener al menos **100 veces tu apuesta máxima**.",
          "Si la banca baja mucho, bajá la unidad. Si sube, la podés subir de a poco.",
          "Los sistemas de progresión (martingala y similares) no cambian la ventaja.",
          "Decidí tus límites antes de jugar. Si el juego deja de ser entretenimiento, pará y pedí ayuda.",
        ]}
      />
      <Visual
        v={{
          v: "tiles",
          items: [
            { v: "47 %", l: "abajo tras 100 manos", tone: "bad" },
            { v: "39 %", l: "tras 1.000", tone: "mid" },
            { v: "19 %", l: "tras 10.000", tone: "good" },
          ],
        }}
      />
      <GP>Probabilidad de ir perdiendo con 1 % de ventaja y apuesta fija.</GP>
    </>
  );
}
function GuideCasino() {
  return (
    <>
      <GH>En el casino</GH>
      <GList
        items={[
          "Contar mentalmente no es trampa, pero el casino puede pedirte que no juegues al blackjack, limitarte las apuestas o mezclar más seguido.",
          "**Usar el celular o cualquier aparato en la mesa está prohibido** y en muchos lugares es ilegal. Esta app es para practicar en casa.",
          "Llaman la atención los saltos grandes de apuesta, separar dieces y mirar fijo todas las cartas. Variá la apuesta de a poco.",
          "Buscá zapatos mezclados a mano, con el corte bien atrás y que paguen 3:2. Evitá las máquinas de mezcla continua.",
        ]}
      />
      <GH>Online</GH>
      <GList
        items={[
          "**Automático (RNG):** se mezcla en cada mano. Contar no sirve; la estrategia básica sí.",
          "**En vivo:** zapatos de 8 mazos que suelen cortar cerca de la mitad. Contar sirve muy poco.",
          "Algunas mesas en vivo dejan entrar y salir libremente: ahí se puede mirar sin jugar y entrar con el conteo alto, pero la penetración baja limita mucho la ventaja.",
        ]}
      />
    </>
  );
}
const GLOSSARY = [
  ["As blando", "As que vale 11 en tu mano (soft ace)."],
  [
    "Bandeja de descarte",
    "Donde van las cartas ya jugadas. Sirve para estimar los mazos que quedan (discard tray).",
  ],
  ["Banca", "La plata que separás solo para jugar (bankroll)."],
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
  ["Empate", "Mismo total que el crupier: recuperás tu apuesta (push)."],
  ["H17 / S17", "El crupier pide (H17) o se planta (S17) con 17 blando."],
  ["Índice", "Conteo real a partir del cual cambia una jugada (index)."],
  [
    "Pago parejo",
    "Cobrar 1 a 1 tu blackjack cuando el crupier muestra As (even money).",
  ],
  ["Pasarse", "Superar 21. Perdés la mano (bust)."],
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
function GuideGlossary() {
  return (
    <div className="card flat">
      {GLOSSARY.map(([a, e]) => (
        <div className="g-gl" key={a}>
          <b>{a}</b>
          <span className="muted">{e}</span>
        </div>
      ))}
    </div>
  );
}
const MYTHS = [
  [
    '"Contar cartas es ilegal."',
    "Contar con la cabeza es legal. Lo prohibido es usar aparatos. El casino sí puede pedirte que no juegues.",
  ],
  [
    '"Hay que tener memoria de genio."',
    "No se memoriza ninguna carta: se lleva un solo número.",
  ],
  [
    '"El que se sienta último arruina la mesa."',
    "Las decisiones de otros jugadores cambian qué carta recibe cada uno, pero no cambian las probabilidades de la mesa.",
  ],
  [
    '"Estoy en racha."',
    "Las cartas no se acuerdan de lo que pasó. Lo único que cambia tus chances es qué cartas quedan.",
  ],
  [
    '"El seguro protege mi mano."',
    "Es una apuesta aparte, sobre la carta tapada del crupier. Sin contar, pierde alrededor de 7 %.",
  ],
  [
    '"Con 12 nunca hay que pedir."',
    "Contra 2, 3 y 7 a As, pedir con 12 pierde menos que plantarse.",
  ],
  [
    '"Duplicar después de perder siempre gana."',
    "La martingala solo cambia cuándo perdés. Tarde o temprano llega una racha que la funde.",
  ],
];
function GuideMyths() {
  return (
    <div className="stack-s">
      {MYTHS.map(([a, e]) => (
        <div className="card tight" key={a}>
          <b style={{ fontSize: 17 }}>{a}</b>
          <p className="muted" style={{ marginTop: 6 }}>
            {e}
          </p>
        </div>
      ))}
    </div>
  );
}
const GUIDE_CHAPTERS = [
  {
    id: "rules",
    title: "Reglas del blackjack",
    sub: "Cómo se juega y cuánto paga",
    icon: "book",
    C: GuideRules,
  },
  {
    id: "strategy",
    title: "Estrategia básica",
    sub: "La tabla completa según tu mesa",
    icon: "grid",
    C: GuideStrategy,
  },
  {
    id: "systems",
    title: "Sistemas de conteo",
    sub: "Hi-Lo, KO, Zen, Omega II y más",
    icon: "layers",
    C: GuideSystems,
  },
  {
    id: "true",
    title: "Conteo real y apuestas",
    sub: "La cuenta y la escala de apuestas",
    icon: "target",
    C: GuideTrueCount,
  },
  {
    id: "devs",
    title: "Desviaciones",
    sub: "Illustrious 18 y Fab 4",
    icon: "sparkle",
    C: GuideDeviations,
  },
  {
    id: "tablerules",
    title: "Las reglas de la mesa",
    sub: "Cuánto vale cada regla",
    icon: "shoe",
    C: GuideTableRules,
  },
  {
    id: "bankroll",
    title: "Banca y varianza",
    sub: "Por qué se pierde aun ganando",
    icon: "shield",
    C: GuideBankroll,
  },
  {
    id: "casino",
    title: "Casino y online",
    sub: "Dónde sirve contar y cómo comportarse",
    icon: "users",
    C: GuideCasino,
  },
  {
    id: "glossary",
    title: "Glosario",
    sub: "Términos en español y en inglés",
    icon: "info",
    C: GuideGlossary,
  },
  {
    id: "myths",
    title: "Mitos",
    sub: "Lo que se dice y lo que es cierto",
    icon: "help",
    C: GuideMyths,
  },
];
function Guide() {
  let a = useNav();
  return (
    <div className="fade-up">
      <div className="topbar">
        <IconButton
          icon="back"
          className="sq"
          label="Volver"
          onClick={() => a.pop()}
        />
        <div className="grow" />
      </div>
      <div className="page-head">
        <div className="page-head-text">
          <h1>Guía</h1>
          <p className="page-sub">
            Todo el libro, para consultar cuando quieras
          </p>
        </div>
      </div>
      <div className="list">
        {GUIDE_CHAPTERS.map((e, t) => (
          <button
            type="button"
            className="list-item"
            onClick={() => a.push("guideChapter", { id: e.id })}
            key={e.id}
          >
            <span className="li-icon">
              <Icon name={e.icon} />
            </span>
            <span className="li-text">
              <span className="li-title" style={{ fontSize: 17 }}>
                {e.title}
              </span>
              <span className="li-sub" style={{ display: "block" }}>
                {e.sub}
              </span>
            </span>
            <Icon name="chev" className="li-chev" />
          </button>
        ))}
      </div>
    </div>
  );
}
function GuideChapter({ id: a }) {
  let e = useNav(),
    t = GUIDE_CHAPTERS.find((n) => n.id === a) || GUIDE_CHAPTERS[0],
    s = t.C;
  return (
    <div className="fade-up guide-ch">
      <div className="topbar">
        <IconButton
          icon="back"
          className="sq"
          label="Volver"
          onClick={() => e.pop()}
        />
        <div className="grow center" style={{ fontWeight: 700 }}>
          Guía
        </div>
        <span style={{ width: 44 }} />
      </div>
      <h1 className="g-title">{t.title}</h1>
      {_jsx(s, {})}
      <div style={{ height: 30 }} />
    </div>
  );
}
export { Guide, GuideChapter };
