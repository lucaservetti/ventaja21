// Ruta de conteo: la tarjeta de la pestaña Conteo, la pantalla de cada nivel
// y el ejercicio nuevo de cancelar de a pares (nivel 2).
import { useMemo, useRef, useState } from "react";
import {
  recordDrill,
  recordLevel,
  recordLevelPractice,
  useStore,
} from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { RANKS, SUITS, makeCard, randInt, shuffle } from "../engine/cards.js";
import { sfx, vibrate } from "../sound.js";
import {
  Button,
  PlayingCard,
  Segments,
  Toasts,
  cx,
} from "../ui/components.jsx";
import { fmtTag, hiloValue } from "../engine/systems.js";
import {
  COUNT_LEVELS,
  currentLevel,
  levelByN,
  levelPassed,
  levelPracticed,
  levelUnlocked,
  passedCount,
} from "../engine/countPath.js";
import { TopBar } from "../ui/common.jsx";
import { rich } from "../lessons/visuals.jsx";
import { useNav } from "../nav.js";

function openLevel(nav, level, replace = false) {
  const params = { level: level.n };
  if (replace) nav.replace("countLevel", params);
  else nav.push("countLevel", params);
}

// Primera tarjeta de la pestaña Conteo.
function CountPathCard() {
  const st = useStore();
  const nav = useNav();
  const [showAll, setShowAll] = useState(false);
  const [toast, setToast] = useState(null);
  const cur = currentLevel(st);
  const done = passedCount(st);
  const tries = cur ? st.countPath.tries[cur.id] || 0 : 0;

  const tap = (level) => {
    if (!levelUnlocked(st, level)) {
      setToast({
        id: Date.now(),
        msg: `Aprobá el nivel ${level.n - 1} para desbloquear este.`,
        kind: "info",
      });
      setTimeout(() => setToast(null), 2200);
      return;
    }
    openLevel(nav, level);
  };

  return (
    <div className="card cpath">
      <div className="cpath-head">
        <div className="grow">
          <div className="eyebrow acc">Ruta de conteo</div>
          <h2 className="cpath-title">Aprendé a contar, paso a paso</h2>
        </div>
        <span className="cpath-count num">
          <b>{done}</b>/{COUNT_LEVELS.length}
        </span>
      </div>
      <Segments
        total={COUNT_LEVELS.length}
        done={done}
        current={cur ? cur.n - 1 : -1}
        className="cpath-segs"
      />
      {cur ? (
        <>
          <button type="button" className="cpath-next" onClick={() => tap(cur)}>
            <span className="cpath-n num">{cur.n}</span>
            <span className="li-text">
              <span className="eyebrow">
                Nivel {cur.n} de {COUNT_LEVELS.length}
              </span>
              <span className="li-title cpath-next-title">{cur.title}</span>
              <span className="li-sub">{cur.goal}</span>
            </span>
          </button>
          {done === 0 && !(st.lessons.l17 && st.lessons.l17.done) ? (
            <button
              type="button"
              className="cpath-first"
              onClick={() =>
                nav.push("lesson", { id: "l17", confirmExit: true })
              }
            >
              <Icon name="book" size={18} />
              <span>
                <b>¿Primera vez contando?</b> Mirá antes la lección de 3 minutos
                sobre los valores de las cartas.
              </span>
              <Icon name="chev" size={16} />
            </button>
          ) : null}
          <Button onClick={() => tap(cur)} iconRight="arrow">
            {tries
              ? `Reintentar el nivel ${cur.n}`
              : cur.n === 1
                ? "Empezar la ruta"
                : `Empezar el nivel ${cur.n}`}
          </Button>
        </>
      ) : (
        <div className="cpath-done">
          <Icon name="trophy" size={30} />
          <p>
            <b>Terminaste la ruta.</b> Ya sabés contar un zapato entero. Seguí
            practicando en el simulador con el conteo oculto, o rendí el examen
            final en Aprender.
          </p>
        </div>
      )}
      <button
        type="button"
        className="link small cpath-toggle"
        onClick={() => setShowAll(!showAll)}
      >
        {showAll
          ? "Ocultar los niveles"
          : `Ver los ${COUNT_LEVELS.length} niveles`}
        <Icon
          name="down"
          size={16}
          className={cx("cpath-chev", showAll && "up")}
        />
      </button>
      {showAll ? (
        <div className="cpath-list">
          {COUNT_LEVELS.map((level) => {
            const passed = levelPassed(st, level);
            const open = levelUnlocked(st, level);
            const isCur = cur && cur.n === level.n;
            return (
              <button
                type="button"
                className={cx(
                  "cpath-row",
                  passed && "done",
                  isCur && "cur",
                  !open && "locked",
                )}
                onClick={() => tap(level)}
                key={level.id}
              >
                <span className="cpath-dot num">
                  {passed ? (
                    <Icon name="check" size={15} stroke={3} />
                  ) : open ? (
                    level.n
                  ) : (
                    <Icon name="lock" size={14} />
                  )}
                </span>
                <span className="li-text">
                  <span className="cpath-row-title">{level.title}</span>
                  <span className="li-sub">{level.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      <Toasts items={toast ? [toast] : []} />
    </div>
  );
}

// Pantalla de presentación de cada nivel.
function CountLevel({ level: n }) {
  const st = useStore();
  const nav = useNav();
  const level = levelByN(n) || COUNT_LEVELS[0];
  const passed = st.countPath.passed[level.id];
  const tries = st.countPath.tries[level.id] || 0;
  const practiced = levelPracticed(st, level);
  const start = (practice) =>
    nav.replace(level.screen, {
      level: level.n,
      practice: practice || undefined,
      confirmExit: true,
      flex: level.screen === "shoeChallenge",
      mode: level.screen === "shoeChallenge" ? "level" : undefined,
    });
  // La primera vez conviene practicar con ayuda; después, rendir.
  const practiceFirst = !passed && !practiced;
  return (
    <div className="drill fade-up level-intro">
      <TopBar
        onClose={() => nav.pop()}
        title="Ruta de conteo"
        sub={`Nivel ${level.n} de ${COUNT_LEVELS.length}`}
      />
      <Segments
        total={COUNT_LEVELS.length}
        done={level.n - 1}
        current={level.n - 1}
        className="drill-segs"
      />
      <div className="level-hero">
        <span className="level-badge num">{level.n}</span>
        <h1>{level.title}</h1>
        <p className="muted">{level.sub}</p>
      </div>
      <div className="card">
        <div className="eyebrow">Qué vas a hacer</div>
        <p style={{ marginTop: 6 }}>{rich(level.what)}</p>
        <div className="level-goal">
          <Icon name="target" size={20} />
          <span>
            <b>Para aprobar:</b> {level.goal}
          </span>
        </div>
        {passed ? (
          <p className="good small" style={{ marginTop: 10, fontWeight: 700 }}>
            Ya lo aprobaste. Podés repetirlo cuando quieras.
          </p>
        ) : tries ? (
          <p className="muted small" style={{ marginTop: 10 }}>
            Lo intentaste {tries} {tries === 1 ? "vez" : "veces"}. Cada intento
            suma práctica.
          </p>
        ) : null}
      </div>
      {level.tips ? (
        <div className="card level-tips">
          <div className="eyebrow acc">Cómo hacerlo</div>
          <ul>
            {level.tips.map((t) => (
              <li key={t}>
                <Icon name="sparkle" size={16} />
                <span>{rich(t)}</span>
              </li>
            ))}
          </ul>
          <p className="level-help">
            <Icon name="eye" size={16} />
            <span>
              <b>Practicar con ayuda:</b> {level.help} No cuenta como intento.
              {practiced
                ? ` Ya practicaste ${practiced} ${practiced === 1 ? "vez" : "veces"}.`
                : ""}
            </span>
          </p>
        </div>
      ) : null}
      {level.lesson ? (
        <button
          type="button"
          className="card list-item level-lesson"
          onClick={() =>
            nav.push("lesson", { id: level.lesson, confirmExit: true })
          }
        >
          <span className="li-icon">
            <Icon name="book" />
          </span>
          <span className="li-text">
            <span className="li-title" style={{ fontSize: 16 }}>
              ¿Querés repasar antes?
            </span>
            <span className="li-sub" style={{ display: "block" }}>
              Abrí la lección sobre este tema
            </span>
          </span>
          <Icon name="chev" className="li-chev" />
        </button>
      ) : null}
      <div className="bottom-actions">
        {practiceFirst ? (
          <div className="btns">
            <Button onClick={() => start(true)}>Practicar con ayuda</Button>
            <Button kind="outline" onClick={() => start(false)}>
              Rendir el nivel directo
            </Button>
          </div>
        ) : (
          <div className="btns">
            <Button onClick={() => start(false)}>
              {passed
                ? "Rendir otra vez"
                : tries
                  ? "Reintentar el nivel"
                  : "Rendir el nivel"}
            </Button>
            <Button kind="outline" onClick={() => start(true)}>
              Practicar con ayuda
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Bloque de resultado de un nivel, para poner dentro del resumen de cada ejercicio.
function LevelOutcome({ level, passed, detail, practice = false }) {
  const next = levelByN(level.n + 1);
  if (practice)
    return (
      <div className="card level-outcome practice">
        <div className="row" style={{ gap: 12 }}>
          <span className="res-icon">
            <Icon name="eye" size={22} />
          </span>
          <div className="grow">
            <div className="eyebrow">
              Práctica · Nivel {level.n} de {COUNT_LEVELS.length}
            </div>
            <b className="level-outcome-title">Práctica terminada</b>
          </div>
        </div>
        <p className="muted small" style={{ marginTop: 8 }}>
          {detail ||
            "No cuenta como intento. Cuando te sientas listo, rendí el nivel sin ayuda."}
        </p>
      </div>
    );
  return (
    <div className={cx("card level-outcome", passed ? "ok" : "bad")}>
      <div className="row" style={{ gap: 12 }}>
        <span className={cx("res-icon", passed ? "ok" : "bad")}>
          <Icon name={passed ? "check" : "x"} size={22} stroke={3} />
        </span>
        <div className="grow">
          <div className="eyebrow">
            Nivel {level.n} de {COUNT_LEVELS.length}
          </div>
          <b className="level-outcome-title">
            {passed
              ? next
                ? "¡Nivel superado!"
                : "¡Terminaste la ruta!"
              : "Todavía no"}
          </b>
        </div>
      </div>
      <p className="muted small" style={{ marginTop: 8 }}>
        {detail ||
          (passed
            ? next
              ? `Se desbloqueó el nivel ${next.n}: ${next.title}.`
              : "Ya sabés contar un zapato entero."
            : `Para aprobar: ${level.goal}`)}
      </p>
    </div>
  );
}
function LevelActions({ level, passed, practice = false }) {
  const nav = useNav();
  const next = levelByN(level.n + 1);
  const go = (p) =>
    nav.replace(level.screen, {
      level: level.n,
      practice: p || undefined,
      confirmExit: true,
      flex: level.screen === "shoeChallenge",
      mode: level.screen === "shoeChallenge" ? "level" : undefined,
    });
  if (practice)
    return (
      <div className="btns">
        <Button onClick={() => go(false)} iconRight="arrow">
          Rendir el nivel {level.n}
        </Button>
        <Button kind="outline" onClick={() => go(true)}>
          Practicar otra vez
        </Button>
      </div>
    );
  return (
    <div className="btns">
      {passed && next ? (
        <Button onClick={() => openLevel(nav, next, true)} iconRight="arrow">
          Seguir: nivel {next.n}
        </Button>
      ) : (
        <Button onClick={() => openLevel(nav, level, true)}>
          {passed ? "Repetir el nivel" : "Reintentar"}
        </Button>
      )}
      <Button kind="outline" onClick={() => nav.pop()}>
        Volver a Conteo
      </Button>
    </div>
  );
}

// ---- Ejercicio: cancelar de a pares ----

const LOW = ["2", "3", "4", "5", "6"];
const MID = ["7", "8", "9"];
const HIGH = ["10", "J", "Q", "K", "A"];
function makePairs(count) {
  // Casi la mitad se cancelan (alta + baja), el resto mezcla dos bajas, dos altas y neutras.
  const kinds = [
    "cancel",
    "cancel",
    "cancel",
    "cancel",
    "low2",
    "high2",
    "mixLow",
    "mixHigh",
    "neutral2",
    "cancel",
  ];
  const pickOf = (list) => list[randInt(list.length)];
  const out = [];
  const order = shuffle([...kinds]);
  for (let i = 0; i < count; i++) {
    const kind = order[i % order.length];
    let a, b;
    if (kind === "cancel") [a, b] = [pickOf(LOW), pickOf(HIGH)];
    else if (kind === "low2") [a, b] = [pickOf(LOW), pickOf(LOW)];
    else if (kind === "high2") [a, b] = [pickOf(HIGH), pickOf(HIGH)];
    else if (kind === "mixLow") [a, b] = [pickOf(LOW), pickOf(MID)];
    else if (kind === "mixHigh") [a, b] = [pickOf(MID), pickOf(HIGH)];
    else [a, b] = [pickOf(MID), pickOf(MID)];
    const pair = randInt(2) ? [a, b] : [b, a];
    out.push(pair.map((r) => makeCard(r, SUITS[randInt(4)])));
  }
  return out;
}
function pairExplain([a, b]) {
  const va = hiloValue(a);
  const vb = hiloValue(b);
  const name = (c) => (c.r === "A" ? "As" : c.r);
  const sum = va + vb;
  if (va && vb && va === -vb)
    return `${name(a)} (${fmtTag(va)}) y ${name(b)} (${fmtTag(vb)}) se cancelan: 0.`;
  if (va === 0 && vb === 0) return `Las dos son neutras: 0.`;
  if (va === 0 || vb === 0) {
    const other = va === 0 ? b : a;
    return `${name(va === 0 ? a : b)} es neutra: queda el ${name(other)}, ${fmtTag(sum)}.`;
  }
  return `${sum > 0 ? "Dos bajas" : "Dos altas"}: ${fmtTag(sum)}.`;
}

// Valor Hi-Lo debajo de una carta (práctica con ayuda).
function CardTag({ card }) {
  const v = hiloValue(card);
  return (
    <span className={cx("card-tag num", v > 0 ? "pos" : v < 0 ? "neg" : "")}>
      {fmtTag(v)}
    </span>
  );
}

function DrillPairs({ level: levelN, practice = false }) {
  const nav = useNav();
  const level = levelN ? levelByN(levelN) : null;
  const count = level ? level.count : 10;
  const [pairs] = useState(() => makePairs(count));
  const [i, setI] = useState(0);
  const [marks, setMarks] = useState([]);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(null);
  const started = useRef(Date.now());
  const pair = pairs[i];
  const answer = pair ? hiloValue(pair[0]) + hiloValue(pair[1]) : 0;

  const pick = (v) => {
    if (picked !== null) return;
    const ok = v === answer;
    if (ok) sfx.good();
    else sfx.bad();
    vibrate(ok ? 6 : 25);
    setPicked(v);
    const next = [...marks, ok];
    setMarks(next);
    setTimeout(
      () => {
        setPicked(null);
        if (i + 1 >= pairs.length) finish(next);
        else setI(i + 1);
      },
      ok ? 650 : 1700,
    );
  };
  const finish = (all) => {
    const ok = all.filter(Boolean).length;
    recordDrill("pairs", {
      t: Date.now(),
      n: pairs.length,
      ok,
      ms: Date.now() - started.current,
    });
    const passed = level && !practice ? ok >= level.pass : null;
    if (level && practice) recordLevelPractice(level.id);
    else if (level) recordLevel(level.id, passed, ok / pairs.length);
    setDone({ ok, passed, missed: pairs.filter((_, k) => !all[k]) });
  };

  if (done) {
    return (
      <div className="fade-up drill-result">
        <TopBar
          onClose={() => nav.pop()}
          closeIcon="back"
          title="Cancelar de a pares"
        />
        <div className="center" style={{ marginTop: 6 }}>
          <div className="big-num acc">
            {done.ok}
            <span className="muted" style={{ fontSize: 30 }}>
              /{pairs.length}
            </span>
          </div>
          <p className="muted">pares bien</p>
        </div>
        {level ? (
          <LevelOutcome
            level={level}
            passed={done.passed}
            practice={practice}
          />
        ) : null}
        {done.missed.length ? (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Los que te costaron
            </div>
            {done.missed.map((p, k) => (
              <div className="row" style={{ padding: "6px 0", gap: 6 }} key={k}>
                <PlayingCard card={p[0]} size="xs" />
                <PlayingCard card={p[1]} size="xs" />
                <span className="grow small">{pairExplain(p)}</span>
              </div>
            ))}
          </div>
        ) : null}
        <p className="center muted" style={{ margin: "18px 0" }}>
          {done.ok === pairs.length
            ? "Perfecto. Cuando cuentes una mesa, buscá estas parejas y las cancelás de un vistazo."
            : "La clave: una alta y una baja juntas no mueven el conteo. Solo cuentan las que sobran."}
        </p>
        {level ? (
          <LevelActions
            level={level}
            passed={done.passed}
            practice={practice}
          />
        ) : (
          <div className="btns">
            <Button onClick={() => nav.replace("drillPairs", {})}>
              Otra vez
            </Button>
            <Button kind="outline" onClick={() => nav.pop()}>
              Volver
            </Button>
          </div>
        )}
      </div>
    );
  }

  const states = pairs.map((_, k) =>
    k < marks.length ? (marks[k] ? "ok" : "miss") : k === i ? "cur" : "",
  );
  return (
    <div className="drill">
      <TopBar
        onClose={() => nav.pop()}
        title={practice ? "Práctica: de a pares" : "Cancelar de a pares"}
        sub={`${i + 1} / ${pairs.length}`}
      />
      <Segments total={pairs.length} states={states} className="drill-segs" />
      <h2 className="center drill-q">¿Cuánto suman juntas?</h2>
      <p className="center muted small">
        Hi-Lo: bajas +1, 7 a 9 valen 0, altas −1
      </p>
      <div className="pair-stage" key={i}>
        {pair.map((c) => (
          <span className="tagged-card" key={c.id}>
            <PlayingCard
              card={c}
              size="lg"
              deal={true}
              glow={
                picked !== null ? (picked === answer ? "good" : "bad") : null
              }
            />
            {practice ? <CardTag card={c} /> : null}
          </span>
        ))}
      </div>
      <p
        className={cx(
          "center tag-fb",
          picked !== null && (picked === answer ? "good" : "bad"),
        )}
      >
        {picked !== null
          ? picked === answer
            ? `Bien. ${pairExplain(pair)}`
            : pairExplain(pair)
          : "\xA0"}
      </p>
      <div className="tag-btns pair-btns">
        {[-2, -1, 0, 1, 2].map((v) => (
          <button
            type="button"
            className={cx(
              "tag-btn",
              v < 0 ? "neg" : v > 0 ? "pos" : "",
              picked !== null && v === answer && "reveal",
            )}
            onClick={() => pick(v)}
            key={v}
          >
            {fmtTag(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

export {
  CardTag,
  CountLevel,
  CountPathCard,
  DrillPairs,
  LevelActions,
  LevelOutcome,
  openLevel,
};
