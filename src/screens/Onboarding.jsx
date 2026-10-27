import { useMemo, useState } from "react";
import { markActive, setGoalMinutes, setState, useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { makeCard, parseCard } from "../engine/cards.js";
import { sfx, vibrate } from "../sound.js";
import {
  Button,
  IconButton,
  Pills,
  PlayingCard,
  Segments,
  cx,
} from "../ui/components.jsx";
import { SECTIONS } from "../lessons/content.js";
import { Logo } from "../ui/common.jsx";
import { ActionButton } from "./TrainSession.jsx";
import { useNav } from "../nav.js";

const ONB_SLIDES = [
  {
    eyebrow: "Cómo aprendés",
    title: ["Practicá con ", "manos reales"],
    text: "Jugás manos de verdad y te mostramos la mejor jugada al instante. Se aprende haciendo, no leyendo.",
    demo: "hand",
  },
  {
    eyebrow: "Siempre sabés por qué",
    title: ["Entendé ", "cada jugada"],
    text: "Después de cada mano te explicamos la jugada correcta en palabras simples: aprendés la razón, no solo la regla.",
    demo: "note",
  },
  {
    eyebrow: "Afilá el conteo",
    title: ["Contá cada vez ", "más rápido"],
    text: "Los ejercicios te piden cada vez más velocidad y precisión, hasta que contar te salga solo, aun con presión.",
    demo: "count",
  },
  {
    eyebrow: "Como en el casino",
    title: ["Entrená con ", "presión de mesa"],
    text: "Sumamos velocidad, charla y chequeos sorpresa, para que tu primera vez en un casino ya te resulte conocida.",
    demo: "table",
  },
];
const EXPERIENCE_OPTIONS = [
  { value: "never", label: "Nunca jugué" },
  { value: "rules", label: "Conozco las reglas" },
  { value: "basic", label: "Uso la estrategia básica" },
  { value: "count", label: "Ya cuento cartas" },
];
const GOAL_OPTIONS = [
  { value: "casino", label: "En un casino" },
  { value: "online", label: "Online" },
  { value: "home", label: "En casa, con amigos" },
  { value: "learn", label: "Solo quiero aprender" },
];
const PLACEMENT_QUESTIONS = [
  {
    s: 1,
    q: "Te pasás de 21 y después el crupier también se pasa. ¿Qué pasa?",
    o: ["Empate", "Perdés vos", "Gana el que se pasó por menos"],
    a: 1,
  },
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
    q: "Tenés A,7 y el crupier muestra un 9.",
    o: ["Plantarme", "Pedir", "Doblar"],
    a: 1,
    cards: ["As", "7h"],
    up: "9d",
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
    s: 3,
    q: "¿Qué mesa conviene?",
    o: ["La que paga el blackjack 3:2", "La que paga 6:5", "Da lo mismo"],
    a: 0,
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
  {
    s: 4,
    q: "Con el conteo real alto, ¿qué conviene?",
    o: ["Apostar más", "Apostar menos", "Lo mismo"],
    a: 0,
  },
];
const MINUTE_OPTIONS = [
  { value: 5, label: "tranqui" },
  { value: 10, label: "lo normal" },
  { value: 15, label: "en serio" },
  { value: 20, label: "a fondo" },
];
function Onboarding() {
  const st = useStore();
  let [a, e] = useState("welcome"),
    [t, s] = useState(0),
    [n, l] = useState(null),
    [i, o] = useState(null);
  if (a === "welcome")
    return (
      <div className="layer full onb onb-welcome">
        <div className="onb-hero">
          <Logo size={96} />
          <h1>Edge 21</h1>
          <p className="muted">
            Aprendé estrategia básica y conteo de cartas, paso a paso, como un
            profesional.
          </p>
          <div className="onb-cards">
            <PlayingCard card={makeCard("A", "s")} size="lg" deal={true} />
            <PlayingCard card={makeCard("K", "h")} size="lg" deal={true} />
          </div>
        </div>
        <div className="bottom-actions">
          <Button onClick={() => e("slides")}>Empezar</Button>
          <p className="center dim tiny" style={{ marginTop: 10 }}>
            Es para aprender: contar con la cabeza es legal, pero usar el
            celular en la mesa no.
          </p>
        </div>
      </div>
    );
  if (a === "slides") {
    let c = ONB_SLIDES[t];
    return (
      <div className="layer full onb">
        <div className="lesson-top">
          <IconButton
            icon="back"
            className="sq"
            label="Atrás"
            onClick={() => (t ? s(t - 1) : e("welcome"))}
          />
          <div className="onb-progress grow">
            <span
              style={{ width: `${((t + 1) / (ONB_SLIDES.length + 4)) * 100}%` }}
            />
          </div>
        </div>
        <div className="onb-demo" key={t}>
          <OnbDemo kind={c.demo} />
        </div>
        <div className="onb-text fade-up" key={"t" + t}>
          <div className="eyebrow acc">{c.eyebrow}</div>
          <h1>
            {c.title[0]}
            <span className="acc">{c.title[1]}</span>
          </h1>
          <p className="muted">{c.text}</p>
        </div>
        <div className="bottom-actions">
          <Button
            kind="white"
            onClick={() => (t + 1 < ONB_SLIDES.length ? s(t + 1) : e("exp"))}
          >
            Seguir
          </Button>
        </div>
      </div>
    );
  }
  if (a === "exp" || a === "goal") {
    let c = a === "exp",
      r = c ? EXPERIENCE_OPTIONS : GOAL_OPTIONS,
      u = c ? n : i;
    return (
      <div className="layer full onb">
        <div className="lesson-top">
          <IconButton
            icon="back"
            className="sq"
            label="Atrás"
            onClick={() => e(c ? "slides" : "exp")}
          />
          <div className="onb-progress grow">
            <span
              style={{
                width: `${((ONB_SLIDES.length + (c ? 1 : 2)) / (ONB_SLIDES.length + 4)) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="onb-q fade-up" key={a}>
          <div className="eyebrow acc">Contanos de vos</div>
          <h1>{c ? "¿Cuánto sabés de blackjack?" : "¿Dónde pensás jugar?"}</h1>
          <div className="options" style={{ marginTop: 22 }}>
            {r.map((d) => (
              <button
                type="button"
                className={cx("option", u === d.value && "picked")}
                onClick={() => {
                  vibrate(6);
                  if (c) {
                    l(d.value);
                  } else {
                    o(d.value);
                  }
                }}
                key={d.value}
              >
                <span>{d.label}</span>
                {u === d.value ? (
                  <Icon name="check" size={20} stroke={3} />
                ) : null}
              </button>
            ))}
          </div>
        </div>
        <div className="bottom-actions">
          <Button disabled={!u} onClick={() => e(c ? "goal" : "minutes")}>
            Seguir
          </Button>
        </div>
      </div>
    );
  }
  if (a === "minutes") {
    const picked = st.dailyGoal.chosen ? st.dailyGoal.minutes : null;
    return (
      <div className="layer full onb">
        <div className="lesson-top">
          <IconButton
            icon="back"
            className="sq"
            label="Atrás"
            onClick={() => e("goal")}
          />
          <div className="onb-progress grow">
            <span
              style={{
                width: `${((ONB_SLIDES.length + 3) / (ONB_SLIDES.length + 4)) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="onb-q onb-minutes fade-up" key={a}>
          <div className="eyebrow acc">Tu meta diaria</div>
          <h1>¿Cuánto tiempo por día querés practicar?</h1>
          <p className="muted" style={{ marginTop: 10 }}>
            Un anillo se llena con lo que practicás y tu racha suma un día cada
            vez que cumplís la meta. La cambiás cuando quieras.
          </p>
          <div className="options" style={{ marginTop: 22 }}>
            {MINUTE_OPTIONS.map((opt) => (
              <button
                type="button"
                className={cx("option", picked === opt.value && "picked")}
                onClick={() => {
                  vibrate(6);
                  setGoalMinutes(opt.value);
                }}
                key={opt.value}
              >
                <span>
                  <b>{opt.value} minutos</b>{" "}
                  <span className="muted">· {opt.label}</span>
                </span>
                {picked === opt.value ? (
                  <Icon name="check" size={20} stroke={3} />
                ) : null}
              </button>
            ))}
          </div>
        </div>
        <div className="bottom-actions">
          <Button disabled={!picked} onClick={() => e("quiz")}>
            Seguir
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="layer full onb">
      <Placement embedded={true} exp={n} goal={i} onBack={() => e("minutes")} />
    </div>
  );
}
function OnbDemo({ kind: a }) {
  if (a === "hand") {
    let e = { H: true, S: true, D: true, P: true, R: false };
    return (
      <div className="demo-wrap">
        <div className="deal-card compact">
          <div className="deal-grid">
            <div className="deal-side">
              <div className="eyebrow">El crupier muestra 9</div>
              <div className="card-row" style={{ marginTop: 10 }}>
                <PlayingCard card={makeCard("9", "c")} size="md" deal={true} />
                <PlayingCard card={makeCard("9", "c")} size="md" down={true} />
              </div>
            </div>
            <div className="deal-side">
              <div className="eyebrow acc">Tu mano</div>
              <div className="card-row" style={{ marginTop: 10 }}>
                <PlayingCard card={makeCard("9", "h")} size="md" deal={true} />
                <PlayingCard card={makeCard("9", "s")} size="md" deal={true} />
              </div>
            </div>
          </div>
        </div>
        <div className="action-grid demo-actions">
          <ActionButton a="H" allowed={e} onClick={() => {}} compact={true} />
          <ActionButton a="S" allowed={e} onClick={() => {}} compact={true} />
          <ActionButton a="D" allowed={e} onClick={() => {}} compact={true} />
          <span className="demo-pick">
            <ActionButton a="P" allowed={e} onClick={() => {}} compact={true} />
          </span>
        </div>
        <div className="demo-best">
          <span className="fb-icon ok">
            <Icon name="check" size={16} stroke={3} />
          </span>
          La mejor jugada: separar
        </div>
      </div>
    );
  }
  if (a === "note")
    return (
      <div className="demo-wrap">
        <div className="result-card" style={{ margin: 0 }}>
          <div className="row">
            <span className="res-icon bad">
              <Icon name="x" size={20} stroke={3} />
            </span>
            <h2 className="grow" style={{ fontSize: 26 }}>
              No era esa
            </h2>
            <span className="res-delta bad num">−18</span>
          </div>
          <div className="res-moves">
            <div>
              <div className="eyebrow">Tu jugada</div>
              <div className="res-move">Plantarse</div>
            </div>
            <div>
              <div className="eyebrow">La mejor</div>
              <div className="res-move acc">Pedir</div>
            </div>
          </div>
          <div className="res-note">
            <h3>Por qué</h3>
            <p>
              Pedí con 15 contra un 10. Duele, pero el crupier termina en 17 o
              más la mayoría de las veces: plantarte solo espera a perder.
            </p>
          </div>
        </div>
      </div>
    );
  if (a === "count") {
    let e = ["9c", "5h", "Kc", "3h"].map(parseCard),
      t = ["0", "+1", "−1", "+1"];
    return (
      <div className="demo-wrap center">
        <div className="eyebrow">Conteo corrido</div>
        <div
          className="card-row"
          style={{ justifyContent: "center", marginTop: 12 }}
        >
          {e.map((s, n) => (
            <div className="center" key={s.id}>
              <PlayingCard card={s} size="md" deal={true} />
              <div
                className={cx(
                  "demo-tag num",
                  t[n] === "+1" ? "good" : t[n] === "−1" ? "bad" : "muted",
                )}
              >
                {t[n]}
              </div>
            </div>
          ))}
        </div>
        <div className="demo-rc">
          <span>Conteo corrido</span>
          <b className="acc num">+1</b>
        </div>
        <Pills
          options={["Relajado", "Normal", "Rápido", "Pro"].map((s) => ({
            value: s,
            label: s,
          }))}
          value="Pro"
          onChange={() => {}}
        />
      </div>
    );
  }
  return (
    <div className="demo-wrap">
      <div className="tiles">
        <div className="tile">
          <div className="eyebrow">Banca</div>
          <div className="tile-v num" style={{ fontSize: 24 }}>
            $500
          </div>
        </div>
        <div className="tile">
          <div className="eyebrow">Apuesta</div>
          <div className="tile-v num" style={{ fontSize: 24 }}>
            $25
          </div>
        </div>
        <div className="tile">
          <div className="eyebrow">Ritmo</div>
          <div className="tile-v acc" style={{ fontSize: 24 }}>
            Pro
          </div>
        </div>
      </div>
      <div
        className="card-row"
        style={{ justifyContent: "center", margin: "16px 0" }}
      >
        <PlayingCard card={makeCard("J", "c")} size="md" deal={true} />
        <PlayingCard card={makeCard("J", "h")} size="md" deal={true} />
      </div>
      <div className="demo-best wide">
        <span className="fb-icon acc-bg">
          <Icon name="plus" size={16} stroke={3} />
        </span>
        <span>
          <b>Chequeo de conteo</b>
          <br />
          <span className="muted small">¿Cuál es el conteo corrido?</span>
        </span>
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
        o((b) => b + 1);
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
          Test de nivel
        </div>
        <h1>¿Por dónde empezamos?</h1>
        <p className="muted" style={{ marginTop: 12, fontSize: 18 }}>
          {"Son "}
          {PLACEMENT_QUESTIONS.length}
          {
            " preguntas cortas, de reglas, estrategia, plata y conteo. Si no sabés una, elegí "
          }
          <b style={{ color: "var(--text)" }}>No sé</b>: así te ubicamos mejor.
        </p>
        <div className="placement-secs">
          {SECTIONS.slice(0, 4).map((v) => (
            <div className="row" style={{ gap: 12 }} key={v.id}>
              <span className="how-n">{v.id}</span>
              <span>{v.title}</span>
            </div>
          ))}
        </div>
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
