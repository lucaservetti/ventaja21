import { useMemo, useState } from "react";
import { markActive, setState } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { makeCard, parseCard } from "../engine/cards.js";
import { sfx, vibrate } from "../sound.js";
import {
  Button,
  IconButton,
  PlayingCard,
  Segments,
  cx,
} from "../ui/components.jsx";
import { SECTIONS } from "../lessons/content.js";
import { Logo } from "../ui/common.jsx";
import { useNav } from "../nav.js";

// Test de nivel: como mucho 8 preguntas, de la sección 1 a la 4. Termina en la primera que no
// sabés: ahí empezás. Así el que recién arranca contesta una o dos, y el que ya sabe, todas.
const PLACEMENT_QUESTIONS = [
  {
    s: 1,
    q: "El crupier tiene 16. ¿Qué tiene que hacer?",
    o: ["Plantarse", "Pedir carta", "Lo que él quiera"],
    a: 1,
  },
  {
    s: 1,
    q: "Tenés As y 6. ¿Cuánto vale tu mano?",
    o: ["Solo 7", "7 o 17 (17 blando)", "16"],
    a: 1,
    cards: ["Ah", "6s"],
  },
  {
    s: 2,
    q: "Tenés 12 y el crupier muestra un 4. ¿Qué hacés?",
    o: ["Pedir", "Plantarme", "Doblar"],
    a: 1,
    cards: ["10c", "2d"],
    up: "4h",
  },
  {
    s: 2,
    q: "Tenés 11 y el crupier muestra un 6.",
    o: ["Pedir", "Plantarme", "Doblar"],
    a: 2,
    cards: ["6d", "5c"],
    up: "6s",
  },
  {
    s: 2,
    q: "Tenés 8,8 y el crupier muestra un 10.",
    o: ["Separar", "Plantarme", "Pedir"],
    a: 0,
    cards: ["8h", "8c"],
    up: "Ks",
  },
  {
    s: 3,
    q: "Sin contar cartas, ¿conviene tomar el seguro?",
    o: ["Sí, cuando tengo buena mano", "No, nunca", "Solo con 20"],
    a: 1,
  },
  {
    s: 4,
    q: "En el sistema Hi-Lo, ¿cuánto vale un 5?",
    o: ["+1", "0", "−1"],
    a: 0,
  },
  {
    s: 4,
    q: "Conteo corrido +6 y quedan 3 mazos. ¿Cuál es el conteo real?",
    o: ["+2", "+3", "+18"],
    a: 0,
  },
];
// Bienvenida: una sola pantalla y adentro. El test de nivel se ofrece después, en Aprender (es
// opcional), así nadie se abruma antes de empezar.
function Onboarding() {
  const empezar = () => {
    sfx.tap();
    setState((m) =>
      markActive({
        ...m,
        profile: {
          ...m.profile,
          onboarded: true,
          createdAt: m.profile.createdAt || Date.now(),
        },
        lastTab: "aprender",
      }),
    );
  };
  return (
    <div className="layer full onb onb-welcome">
      <div className="onb-hero">
        <Logo size={96} />
        <h1>Edge 21</h1>
        <p className="muted">
          Aprendé estrategia básica y conteo de cartas, paso a paso, con manos
          de verdad.
        </p>
        <div className="onb-cards">
          <PlayingCard card={makeCard("A", "s")} size="lg" deal={true} />
          <PlayingCard card={makeCard("K", "h")} size="lg" deal={true} />
        </div>
        <ul className="onb-bullets">
          <li>Lecciones de 2 a 5 minutos</li>
          <li>Una mesa que te corrige cada jugada</li>
          <li>Sin plata real</li>
        </ul>
      </div>
      <div className="bottom-actions">
        <Button onClick={empezar}>Empezar</Button>
        <p className="center dim tiny" style={{ marginTop: 10 }}>
          Es para aprender: contar con la cabeza es legal, pero usar el
          celular en la mesa no.
        </p>
      </div>
    </div>
  );
}
function Placement({
  embedded: a = false,
  retake: e = false,
  exp: t = null,
  goal: s = null,
  onBack: n,
}) {
  let l = useNav(),
    [i, o] = useState(-1),
    [c, r] = useState([]),
    [u, d] = useState(null),
    p = PLACEMENT_QUESTIONS[i],
    f = i >= PLACEMENT_QUESTIONS.length,
    y = (v) => {
      if (u !== null) return;
      d(v);
      let m = v === p.a;
      if (m) {
        sfx.good();
      } else {
        sfx.tap();
      }
      vibrate(6);
      setTimeout(() => {
        r((b) => [...b, { s: p.s, ok: m }]);
        d(null);
        // La primera que no sabés termina el test: empezás por esa sección.
        o((b) => (m ? b + 1 : PLACEMENT_QUESTIONS.length));
      }, 650);
    },
    C = useMemo(() => {
      if (!f) return null;
      let v = {};
      for (let b of c) {
        v[b.s] = v[b.s] || { ok: 0, n: 0 };
        v[b.s].n++;
        if (b.ok) {
          v[b.s].ok++;
        }
      }
      let m = 5;
      for (let b of [1, 2, 3, 4]) {
        let S = v[b];
        if (!S || S.ok < S.n) {
          m = b;
          break;
        }
      }
      if (t === "never") {
        m = Math.min(m, 2);
      }
      return { bySec: v, start: m };
    }, [f]),
    k = () => {
      let v = C.start;
      setState((m) => {
        let b = { ...m.lessons };
        for (let M of SECTIONS)
          if (!(M.id >= v))
            for (let R of M.lessons) {
              if (!b[R.id] || !b[R.id].done) {
                b[R.id] = { done: true, viaTest: true, at: Date.now() };
              }
            }
        let S = {
          ...m.profile,
          onboarded: true,
          testHecho: true,
          startSection: v,
          placement: { t: Date.now(), ...C.bySec },
        };
        if (t) {
          S.experience = t;
        }
        if (s) {
          S.goal = s;
        }
        if (!S.createdAt) {
          S.createdAt = Date.now();
        }
        let D = m.table,
          _ = m.settings;
        if (s === "online" && a) {
          D = { ...D, preset: "live" };
          _ = {
            ..._,
            rules: {
              ..._.rules,
              decks: 8,
              h17: false,
              das: true,
              surrender: false,
              bjPays: 1.5,
              pen: 0.5,
            },
          };
        }
        return markActive({
          ...m,
          lessons: b,
          profile: S,
          table: D,
          settings: _,
          lastTab: "aprender",
        });
      });
      if (!a) {
        l.pop();
      }
    };
  if (i === -1)
    return (
      <div className={cx("onb-q fade-up", !a && "layer-pad")}>
        <div className="lesson-top">
          <IconButton
            icon="back"
            className="sq"
            label="Atrás"
            onClick={() => (a ? n() : l.pop())}
          />
          <div className="grow" />
        </div>
        <div className="eyebrow acc" style={{ marginTop: 20 }}>
          Test de nivel · 2 minutos
        </div>
        <h1>¿Por dónde empezás?</h1>
        <p className="muted" style={{ marginTop: 12, fontSize: 18 }}>
          {`Hasta ${PLACEMENT_QUESTIONS.length} preguntas cortas. Cuando una no la sepas, tocá `}
          <b style={{ color: "var(--text)" }}>No sé</b>
          {": ahí termina y empezás desde esa parte. Lo anterior queda como superado."}
        </p>
        <div className="bottom-actions">
          <Button onClick={() => o(0)}>Empezar el test</Button>
          {a ? (
            <Button
              kind="ghost"
              onClick={() => {
                r([]);
                o(PLACEMENT_QUESTIONS.length);
              }}
            >
              Saltar y empezar desde cero
            </Button>
          ) : null}
        </div>
      </div>
    );
  if (f) {
    let v = SECTIONS.find((b) => b.id === C.start) || SECTIONS[0],
      m = c.length === 0;
    return (
      <div className={cx("onb-q fade-up", !a && "layer-pad")}>
        <div className="eyebrow acc" style={{ marginTop: 30 }}>
          Tu punto de partida
        </div>
        <h1>
          {"Sección "}
          {v.id}
          {": "}
          <span className="acc">{v.title}</span>
        </h1>
        <p className="muted" style={{ marginTop: 12, fontSize: 17 }}>
          {m
            ? "Arrancás desde la primera lección. Podés hacer el test cuando quieras desde Ajustes."
            : C.start === 1
              ? "Arrancamos por las bases: en pocos minutos vas a tener las reglas claras."
              : "Las lecciones anteriores quedan marcadas como superadas. Podés repasarlas cuando quieras."}
        </p>
        {m ? null : (
          <div className="card" style={{ marginTop: 20 }}>
            {SECTIONS.slice(0, 4).map((b) => {
              let S = C.bySec[b.id] || { ok: 0, n: 0 },
                D = S.n && S.ok === S.n;
              return (
                <div className="kv" style={{ alignItems: "center" }} key={b.id}>
                  <span className="kv-k" style={{ fontWeight: 600 }}>
                    {b.title}
                  </span>
                  <span
                    className={cx("row num", D ? "good" : "bad")}
                    style={{ gap: 6, fontWeight: 700 }}
                  >
                    {S.ok}/{S.n}
                    <Icon name={D ? "check" : "x"} size={18} stroke={3} />
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {s === "online" && a ? (
          <p className="note-box" style={{ marginTop: 14 }}>
            Como vas a jugar online, dejamos el simulador listo con una mesa en
            vivo de 8 mazos. Lo cambiás en Jugar → Mesa.
          </p>
        ) : null}
        <div className="bottom-actions">
          <Button onClick={k}>{a ? "Empezar a aprender" : "Listo"}</Button>
        </div>
      </div>
    );
  }
  return (
    <div className={cx("onb-q", !a && "layer-pad")}>
      <div className="lesson-top">
        <IconButton
          icon="close"
          className="sq"
          label="Salir"
          onClick={() => (a ? n() : l.pop())}
        />
        <Segments
          total={PLACEMENT_QUESTIONS.length}
          done={i}
          current={i}
          className="grow"
        />
        <span className="lesson-count num">
          {i + 1}
          {" de "}
          {PLACEMENT_QUESTIONS.length}
        </span>
      </div>
      <div className="fade-up" key={i}>
        {p.cards ? <PlacementCards q={p} /> : null}
        <h2 className="quiz-q">{p.q}</h2>
        <div className="options">
          {[...p.o, "No sé"].map((v, m) => {
            let b = m === p.o.length,
              S =
                u === null
                  ? ""
                  : m === p.a
                    ? "right"
                    : m === u
                      ? "wrong"
                      : "off";
            return (
              <button
                type="button"
                className={cx("option", S, b && "ns")}
                onClick={() => y(b ? -1 : m)}
                disabled={u !== null}
                key={m}
              >
                <span>{v}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function PlacementCards({ q: a }) {
  let e = useMemo(() => a.cards.map(parseCard), [a]),
    t = useMemo(() => (a.up ? parseCard(a.up) : null), [a]);
  return (
    <div className="deal-card compact" style={{ marginTop: 12 }}>
      <div className="deal-grid">
        {t ? (
          <>
            <div className="deal-side">
              <div className="eyebrow">Crupier</div>
              <div className="card-row" style={{ marginTop: 10 }}>
                <PlayingCard card={t} size="md" deal={true} />
                <PlayingCard card={t} size="md" down={true} />
              </div>
            </div>
            <div className="deal-divider" />
          </>
        ) : null}
        <div className="deal-side">
          <div className="eyebrow">Tu mano</div>
          <div className="card-row" style={{ marginTop: 10 }}>
            {e.map((s) => (
              <PlayingCard card={s} size="md" deal={true} key={s.id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export { Onboarding, Placement };
