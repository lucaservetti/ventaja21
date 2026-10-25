// Un zapato completo en el simulador, con el conteo oculto y chequeos de conteo.
// mode "level": nivel 10 de la ruta de conteo (se aprueba con 4 de cada 5 chequeos bien).
// mode "exam": examen final (jugar bien, contar y apostar según el conteo).
import { useEffect, useState } from "react";
import {
  getState,
  recordLevel,
  setState,
  markActive,
  withRules,
} from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { ACTION_NAMES } from "../engine/strategy.js";
import { Button, IconButton, Modal, cx } from "../ui/components.jsx";
import { fmtSigned } from "../engine/systems.js";
import { Table, money } from "../engine/table.js";
import { levelByN } from "../engine/countPath.js";
import { TableView } from "./TableView.jsx";
import { LevelActions, LevelOutcome } from "./countPath.jsx";
import { useNav } from "../nav.js";

const EXAM_MIN = { decisions: 0.9, bets: 0.8, checks: 0.8 };

function ratio(ok, n) {
  return n ? ok / n : 0;
}
function pctText(ok, n) {
  return n ? `${Math.round((ok / n) * 100)} %` : "—";
}

function gradeExam(s) {
  const decisions = ratio(s.decisionsOk, s.decisions);
  const bets = ratio(s.betsOk, s.bets);
  const checks = ratio(s.checksOk, s.checks);
  return {
    decisions,
    bets,
    checks,
    passed:
      decisions >= EXAM_MIN.decisions &&
      bets >= EXAM_MIN.bets &&
      checks >= EXAM_MIN.checks,
  };
}

function ShoeChallenge({ mode = "level", level: levelN = 10 }) {
  const nav = useNav();
  const exam = mode === "exam";
  const level = exam ? null : levelByN(levelN);
  const [table] = useState(() => {
    const st = getState();
    return new Table({
      // Las reglas de tu mesa, pero siempre un zapato de 6 mazos cortado al 75 %.
      rules: {
        ...withRules(st.settings.rules),
        decks: 6,
        pen: 0.75,
        bjPays: 1.5,
      },
      system: "hilo",
      bots: 0,
      unit: 10,
      startBankroll: 1000,
      bankroll: 1000,
      speed: "normal",
      coach: !exam,
      betCoach: true,
      deviations: exam,
      lenient: true,
      countCheck: "exam",
      pressure: false,
      silent: exam,
      quietResults: true,
    });
  });
  const [result, setResult] = useState(null);
  const [exitOpen, setExitOpen] = useState(false);
  useEffect(() => {
    const onBack = () => setExitOpen(true);
    window.addEventListener("v21-back", onBack);
    return () => window.removeEventListener("v21-back", onBack);
  }, []);

  const finish = () => {
    const s = { ...table.session };
    if (exam) {
      const g = gradeExam(s);
      setState((st) =>
        markActive({
          ...st,
          finalExam: {
            attempts: [
              ...st.finalExam.attempts,
              { t: Date.now(), ...g, hands: s.hands },
            ].slice(-20),
            passed: st.finalExam.passed || (g.passed ? Date.now() : null),
          },
        }),
      );
      setResult({ s, ...g });
    } else {
      const r = ratio(s.checksOk, s.checks);
      const passed = s.checks > 0 && r >= level.passRatio;
      recordLevel(level.id, passed, r);
      setResult({ s, passed, checks: r });
    }
  };

  if (result)
    return <ChallengeResult result={result} exam={exam} level={level} />;

  const top = (t) => (
    <div className="sim-top challenge-top">
      <IconButton
        icon="close"
        label="Salir"
        className="sq small-ib"
        size={20}
        onClick={() => setExitOpen(true)}
      />
      <div className="grow challenge-title">
        <b>{exam ? "Examen final" : `Nivel ${level.n}: ${level.title}`}</b>
        <span className="challenge-progress">
          <i
            style={{
              width: `${Math.min(100, (t.shoe.dealt / (t.shoe.cut || t.shoe.total)) * 100)}%`,
            }}
          />
        </span>
      </div>
      <div className="sim-stat">
        <span className="eyebrow">Fichas</span>
        <b className="num">${money(t.bankroll)}</b>
      </div>
    </div>
  );
  return (
    <>
      <TableView
        table={table}
        top={top}
        showCount={false}
        countLabel="Contá vos"
        betHint={false}
        unitBets={true}
        onShoeEnd={finish}
      />
      <Modal open={exitOpen} onClose={() => setExitOpen(false)}>
        <h2 style={{ fontSize: 24 }}>
          {exam ? "¿Dejar el examen?" : "¿Salir del nivel?"}
        </h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          El intento no se va a contar. Podés empezarlo de nuevo cuando quieras.
        </p>
        <div className="btns">
          <Button kind="secondary" onClick={() => setExitOpen(false)}>
            Seguir jugando
          </Button>
          <Button kind="danger" onClick={() => nav.pop()}>
            Salir
          </Button>
        </div>
      </Modal>
    </>
  );
}

function ChallengeResult({ result, exam, level }) {
  const nav = useNav();
  const s = result.s;
  const rows = exam
    ? [
        {
          l: "Jugadas correctas",
          v: pctText(s.decisionsOk, s.decisions),
          ok: result.decisions >= EXAM_MIN.decisions,
          need: "90 %",
        },
        {
          l: "Apuestas según el conteo",
          v: pctText(s.betsOk, s.bets),
          ok: result.bets >= EXAM_MIN.bets,
          need: "80 %",
        },
        {
          l: "Chequeos de conteo",
          v: `${s.checksOk}/${s.checks}`,
          ok: result.checks >= EXAM_MIN.checks,
          need: "80 %",
        },
      ]
    : [
        {
          l: "Chequeos de conteo",
          v: `${s.checksOk}/${s.checks}`,
          ok: result.passed,
          need: "4 de cada 5",
        },
        { l: "Jugadas correctas", v: pctText(s.decisionsOk, s.decisions) },
        { l: "Apuestas según el conteo", v: pctText(s.betsOk, s.bets) },
      ];
  const passed = result.passed;
  return (
    <div className="fade-up drill-result challenge-result">
      <div className="topbar">
        <IconButton
          icon="back"
          className="sq"
          label="Volver"
          onClick={() => nav.pop()}
        />
        <div className="grow center" style={{ fontWeight: 700, fontSize: 19 }}>
          {exam ? "Examen final" : "Ruta de conteo"}
        </div>
        <span style={{ width: 44 }} />
      </div>
      <div className="center" style={{ marginTop: 6 }}>
        <span className={cx("res-icon big", passed ? "ok" : "bad")}>
          <Icon
            name={passed ? "trophy" : "x"}
            size={34}
            stroke={passed ? 2 : 3}
          />
        </span>
        <h1 className="challenge-verdict">
          {exam
            ? passed
              ? "¡Aprobaste el examen final!"
              : "Todavía no aprobaste"
            : passed
              ? "¡Contaste un zapato entero!"
              : "Todavía no"}
        </h1>
        <p className="muted" style={{ marginTop: 6 }}>
          {s.hands} manos · resultado {s.net >= 0 ? "+" : "−"}$
          {money(Math.abs(s.net))}
        </p>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        {rows.map((r) => (
          <div className="kv" key={r.l}>
            <span className="kv-k">
              {r.l}
              {r.need ? (
                <span className="muted small"> · para aprobar: {r.need}</span>
              ) : null}
            </span>
            <span
              className={cx(
                "kv-v num",
                r.ok === true && "good",
                r.ok === false && "bad",
              )}
            >
              {r.v}
            </span>
          </div>
        ))}
      </div>
      {level ? <LevelOutcome level={level} passed={passed} /> : null}
      {s.checkLog.some((c) => !c.ok) ? (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Chequeos que fallaste
          </div>
          {s.checkLog
            .filter((c) => !c.ok)
            .map((c, i) => (
              <div className="kv" key={i}>
                <span className="kv-k">
                  {c.final ? "Fin del zapato" : `Chequeo`}
                </span>
                <span className="kv-v num">
                  pusiste <b className="bad">{fmtSigned(c.value)}</b> · era{" "}
                  <b className="acc">{fmtSigned(c.correct)}</b>
                </span>
              </div>
            ))}
        </div>
      ) : null}
      {s.betMistakes.length ? (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Apuestas que no iban con el conteo
          </div>
          {s.betMistakes.slice(-6).map((b, i) => (
            <div className="kv" key={i}>
              <span className="kv-k">Conteo real {fmtSigned(b.tc)}</span>
              <span className="kv-v num">
                apostaste <b className="bad">${money(b.bet)}</b> · era{" "}
                <b className="acc">${money(b.ideal)}</b>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {s.mistakes.length ? (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Jugadas para repasar
          </div>
          {s.mistakes.slice(-8).map((m, i) => (
            <div className="kv" key={i}>
              <span className="kv-k">
                {m.spot}
                {m.tc !== null && m.tc !== undefined ? (
                  <span className="muted small"> · CR {fmtSigned(m.tc)}</span>
                ) : null}
              </span>
              <span className="kv-v">
                <b className="bad">{ACTION_NAMES[m.chosen]}</b> →{" "}
                <b className="acc">{ACTION_NAMES[m.best]}</b>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <p className="center muted" style={{ margin: "18px 0" }}>
        {exam
          ? passed
            ? "Jugaste un zapato entero como un contador: estrategia, conteo y apuestas. Lo que sigue es práctica para sostenerlo con presión de casino."
            : "Repasá lo que falló y volvé a intentarlo. En Jugar podés practicar con el conteo oculto y el coach prendido."
          : passed
            ? "Llevaste el conteo de un zapato completo mientras jugabas. Eso es contar cartas."
            : "Cuando un chequeo falla, el error suele venir de una mano con muchas cartas. Contá cada carta apenas cae."}
      </p>
      {level ? (
        <LevelActions level={level} passed={passed} />
      ) : (
        <div className="btns">
          <Button
            onClick={() =>
              nav.replace("shoeChallenge", {
                mode: "exam",
                confirmExit: true,
                flex: true,
              })
            }
          >
            {passed ? "Rendirlo otra vez" : "Reintentar"}
          </Button>
          <Button kind="outline" onClick={() => nav.pop()}>
            Volver
          </Button>
        </div>
      )}
    </div>
  );
}

export { ShoeChallenge };
