// Modo casino real: llevás tu plata, cambiás fichas al sentarte y jugás sin ayudas, con los límites
// de la mesa, tiempo para decidir y la vigilancia del casino mirando cómo apostás.
// También el examen de casino: 40 manos en esas condiciones; si lo aprobás, te llevás el certificado.
import { useEffect, useRef, useState } from "react";
import {
  describeRules,
  getState,
  markActive,
  recordCasinoTrip,
  recordHandResult,
  setState,
  useStore,
  withRules,
} from "../state.js";
import { Icon } from "../ui/icons.jsx";
import {
  Button,
  IconButton,
  Modal,
  Pills,
  Toggle,
  cx,
} from "../ui/components.jsx";
import { Table } from "../engine/table.js";
import { TopBar, useRules } from "../ui/common.jsx";
import {
  AmountPills,
  CURRENCIES,
  CurrencyPills,
  chipsFor,
  fmtMoney,
  fmtSignedMoney,
  useCurrency,
} from "../ui/money.jsx";
import { TableView } from "./TableView.jsx";
import { useNav } from "../nav.js";

const TIMES = [
  { value: 0, label: "Sin límite" },
  { value: 10, label: "10 s" },
  { value: 6, label: "6 s" },
  { value: 4, label: "4 s" },
];
// Manos por hora aproximadas según cuánta gente hay en la mesa.
const HANDS_PER_HOUR = [200, 140, 110, 85, 70];
const END_TEXT = {
  left: "Te retiraste",
  broke: "Te quedaste sin plata",
  backoff: "Te pidieron que te retires",
  exam: "Examen de casino",
};
const EXAM = {
  hands: 40,
  bots: 2,
  decisionTime: 6,
  decisions: 0.9,
  bets: 0.8,
  checks: 0.66,
  timeouts: 2,
};

function pct(ok, n) {
  return n ? `${Math.round((ok / n) * 100)} %` : "—";
}
function setSetup(patch) {
  setState((st) => ({
    ...st,
    casino: { ...st.casino, setup: { ...st.casino.setup, ...patch } },
  }));
}
function tripCur(t) {
  return CURRENCIES[t.cur] || CURRENCIES.USD;
}

function gradeExam(t) {
  const decisions = t.decisions ? t.decisionsOk / t.decisions : 0;
  const bets = t.bets ? t.betsOk / t.bets : 0;
  const checks = t.checks ? t.checksOk / t.checks : 0;
  const rows = [
    {
      l: "Jugadas correctas",
      v: pct(t.decisionsOk, t.decisions),
      ok: decisions >= EXAM.decisions,
      need: "90 %",
    },
    {
      l: "Apuestas según el conteo",
      v: pct(t.betsOk, t.bets),
      ok: bets >= EXAM.bets,
      need: "80 %",
    },
    {
      l: "Chequeos de conteo",
      v: `${t.checksOk || 0}/${t.checks || 0}`,
      ok: !t.checks || checks >= EXAM.checks,
      need: "2 de 3",
    },
    {
      l: "Decisiones a tiempo",
      v: `${t.timeouts} tarde`,
      ok: t.timeouts <= EXAM.timeouts,
      need: `máx. ${EXAM.timeouts}`,
    },
    {
      l: "Sin que te echen",
      v: t.end === "backoff" ? "Te echaron" : "Bien",
      ok: t.end !== "backoff",
      need: "",
    },
    {
      l: "Manos jugadas",
      v: String(t.hands),
      ok: t.hands >= EXAM.hands,
      need: String(EXAM.hands),
    },
  ];
  return { rows, passed: rows.every((r) => r.ok) };
}

function CasinoSetup() {
  const st = useStore();
  const nav = useNav();
  const rules = useRules();
  const cur = useCurrency();
  const s = st.casino.setup;
  const buyIn = Math.min(s.buyIn, s.wallet);
  const maxBet = Math.max(s.maxBet, s.minBet * 2);
  const minBets = Math.floor(s.wallet / s.minBet);
  const trips = st.casino.trips.slice().reverse();
  const exam = st.casino.exam || { attempts: [], passed: null };
  const examSetup = {
    ...cur.exam,
    bots: EXAM.bots,
    decisionTime: EXAM.decisionTime,
    heat: true,
  };
  return (
    <div className="casino fade-up">
      <TopBar
        onClose={() => nav.pop()}
        closeIcon="back"
        title="Modo casino real"
        sub="Como ir a jugar de verdad"
      />
      <div className="card casino-hero">
        <span className="casino-hero-ic">
          <Icon name="crown" size={26} />
        </span>
        <p>
          Llevás tu plata, cambiás fichas en la mesa y jugás <b>sin ayudas</b>:
          sin coach, sin el conteo a la vista, con el crupier rápido y tiempo
          para decidir. Al irte ves cuánto ganaste y cómo jugaste.
        </p>
      </div>

      <h3 className="sheet-sub">Tu plata</h3>
      <div className="field">
        <span>Moneda</span>
        <CurrencyPills />
      </div>
      <div className="field">
        <span>Plata que llevás al casino</span>
        <AmountPills
          cur={cur}
          title="Plata que llevás"
          options={cur.wallet}
          value={s.wallet}
          min={s.minBet}
          onChange={(wallet) => setSetup({ wallet })}
        />
      </div>
      <div className="field">
        <span>Fichas que cambiás al sentarte (entrada)</span>
        <AmountPills
          cur={cur}
          title="Fichas al sentarte"
          options={cur.buyIn.filter((v) => v <= s.wallet)}
          value={buyIn}
          min={s.minBet}
          onChange={(v) => setSetup({ buyIn: Math.min(v, s.wallet) })}
        />
      </div>

      <h3 className="sheet-sub">La mesa</h3>
      <div className="field">
        <span>Apuesta mínima</span>
        <AmountPills
          cur={cur}
          title="Apuesta mínima"
          options={cur.min}
          value={s.minBet}
          onChange={(minBet) => setSetup({ minBet })}
        />
      </div>
      <div className="field">
        <span>Apuesta máxima</span>
        <AmountPills
          cur={cur}
          title="Apuesta máxima"
          options={cur.max.filter((v) => v >= s.minBet * 2)}
          value={maxBet}
          min={s.minBet * 2}
          onChange={(v) => setSetup({ maxBet: v })}
        />
      </div>
      {maxBet < s.minBet * 8 ? (
        <p className="muted small">
          Con una máxima menor a 8 mínimas no vas a poder seguir toda la escala
          de apuestas del conteo.
        </p>
      ) : null}
      <div className="field">
        <span>Otros jugadores en la mesa</span>
        <Pills
          options={[0, 1, 2, 3, 4].map((n) => ({
            value: n,
            label: String(n),
          }))}
          value={s.bots}
          onChange={(bots) => setSetup({ bots })}
        />
      </div>
      <div className="field">
        <span>Tiempo para decidir cada jugada</span>
        <Pills
          options={TIMES}
          value={s.decisionTime}
          onChange={(decisionTime) => setSetup({ decisionTime })}
        />
      </div>
      <Toggle
        id="c-heat"
        label="Vigilancia del casino"
        sub="Si subís mucho la apuesta cuando el conteo está alto, el jefe de mesa sospecha. Si se calienta del todo, te piden que te retires."
        checked={s.heat}
        onChange={(heat) => setSetup({ heat })}
      />
      <div className="note-box" style={{ marginTop: 12 }}>
        <b>Reglas:</b> {describeRules(rules).join(" · ")}. Las cambiás en Jugar
        → Mesa.
      </div>
      {minBets < 30 ? (
        <div className="note-box casino-warn" style={{ marginTop: 10 }}>
          Con {fmtMoney(s.wallet, cur)} y mínima de {fmtMoney(s.minBet, cur)} te
          alcanza para {minBets} apuestas mínimas: una mala racha te deja sin
          plata enseguida.
        </div>
      ) : null}
      <button
        type="button"
        className="card list-item"
        style={{ marginTop: 12 }}
        onClick={() => nav.push("bankroll", { unit: s.minBet, bank: s.wallet })}
      >
        <span className="li-icon">
          <Icon name="stats" />
        </span>
        <span className="li-text">
          <span className="li-title">¿Cuánta plata llevar?</span>
          <span className="li-sub" style={{ display: "block" }}>
            Simulá tu banca con esta mesa
          </span>
        </span>
        <Icon name="chev" className="li-chev" />
      </button>

      <div className="section-title">
        <h2>Examen de casino</h2>
      </div>
      <button
        type="button"
        className={cx("card exam-card", exam.passed && "passed")}
        onClick={() =>
          nav.push("casinoPlay", {
            setup: examSetup,
            exam: true,
            confirmExit: true,
            flex: true,
          })
        }
      >
        <span className="exam-seal" aria-hidden="true">
          <Icon name={exam.passed ? "trophy" : "shield"} size={26} />
        </span>
        <span className="li-text">
          <span className="li-title">
            {exam.passed
              ? "Aprobado: tenés el certificado"
              : "Ganate el certificado"}
          </span>
          <span className="li-sub" style={{ display: "block" }}>
            {EXAM.hands} manos con {EXAM.bots} jugadores más,{" "}
            {EXAM.decisionTime} s para decidir, vigilancia y chequeos de conteo.
            Necesitás 90 % de jugadas bien y 80 % de apuestas según el conteo,
            sin que te echen.
          </span>
          {exam.attempts.length ? (
            <span
              className="tiny muted"
              style={{ display: "block", marginTop: 6 }}
            >
              {exam.attempts.length}{" "}
              {exam.attempts.length === 1 ? "intento" : "intentos"}
            </span>
          ) : null}
        </span>
        <Icon name="chev" className="li-chev" />
      </button>

      {trips.length ? (
        <>
          <div className="section-title">
            <h2>Tus visitas</h2>
          </div>
          <div className="list">
            {trips.slice(0, 8).map((t) => (
              <div className="list-item casino-trip" key={t.t}>
                <span
                  className={cx(
                    "score-pill",
                    t.net > 0 ? "good" : t.net < 0 ? "bad" : "mid",
                  )}
                >
                  <b className="num">{fmtSignedMoney(t.net, tripCur(t))}</b>
                </span>
                <span className="li-text">
                  <span className="li-title">
                    {t.exam
                      ? `Examen: ${t.passed ? "aprobado" : "no aprobado"}`
                      : END_TEXT[t.end]}
                  </span>
                  <span className="li-sub num" style={{ display: "block" }}>
                    {new Date(t.t).toLocaleDateString("es-UY", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {t.hands} manos · mesa {fmtMoney(t.minBet, tripCur(t))}–
                    {fmtMoney(t.maxBet, tripCur(t))}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="bottom-actions">
        <Button
          onClick={() =>
            nav.push("casinoPlay", {
              setup: { ...s, buyIn, maxBet },
              confirmExit: true,
              flex: true,
            })
          }
          iconRight="arrow"
        >
          Sentarme con {fmtMoney(buyIn, cur)}
        </Button>
      </div>
    </div>
  );
}

function HeatMeter({ heat }) {
  const tone = heat >= 70 ? "bad" : heat >= 35 ? "mid" : "good";
  const word =
    heat >= 70 ? "Te vigilan" : heat >= 35 ? "Te miran" : "Tranquila";
  return (
    <span className={cx("heat", tone)} aria-label={`Vigilancia: ${word}`}>
      <Icon name="eye" size={14} />
      <span className="heat-bar">
        <i style={{ width: `${Math.max(4, heat)}%` }} />
      </span>
      <span className="tiny">{word}</span>
    </span>
  );
}

function CasinoPlay({ setup, exam = false }) {
  const nav = useNav();
  const cur = useCurrency();
  const [table] = useState(() => {
    const st = getState();
    return new Table({
      rules: withRules(st.settings.rules),
      system: st.settings.system,
      bots: setup.bots,
      unit: setup.minBet,
      startBankroll: setup.buyIn,
      bankroll: setup.buyIn,
      speed: "fast",
      coach: false,
      betCoach: true,
      deviations: true,
      lenient: true,
      countCheck: exam ? "exam" : "off",
      pressure: false,
      silent: true,
      quietResults: true,
      minBet: setup.minBet,
      maxBet: setup.maxBet,
      decisionTime: setup.decisionTime,
      heat: setup.heat,
      sym: cur.sym,
      chips: chipsFor(setup.minBet),
    });
  });
  const [, setTick] = useState(0);
  const pocket = useRef(setup.wallet - setup.buyIn);
  const bought = useRef(setup.buyIn);
  const started = useRef(Date.now());
  const seenSeq = useRef(0);
  const [modal, setModal] = useState(null); // leave | buy | broke | backoff | examEnd
  const [result, setResult] = useState(null);

  useEffect(() => table.subscribe(() => setTick((x) => x + 1)), [table]);
  useEffect(() => {
    const onBack = () => setModal((m) => m || "leave");
    window.addEventListener("v21-back", onBack);
    return () => window.removeEventListener("v21-back", onBack);
  }, []);
  useEffect(() => {
    table.onRoundEnd = (_, t) => {
      // Las jugadas que fallaste pasan a tus errores de Entrenar.
      for (const m of t.session.mistakes)
        if (m.seq > seenSeq.current && m.hand)
          recordHandResult({ ...m.hand, src: "mesa" }, false);
      seenSeq.current = t.session.mistakeSeq || seenSeq.current;
      if (t.backedOff) setModal("backoff");
      else if (t.bankroll < setup.minBet && pocket.current < setup.minBet)
        setModal("broke");
    };
    return () => {
      table.onRoundEnd = null;
    };
  }, []);
  // Examen: después de la mano 40 (y del chequeo de conteo, si tocaba), se termina.
  const examDone =
    exam &&
    !result &&
    table.session.hands >= EXAM.hands &&
    table.phase === "settle" &&
    !table.running &&
    !table.countCheckDue;
  useEffect(() => {
    if (examDone && !modal) setModal("examEnd");
  }, [examDone, modal]);

  const finish = (end) => {
    const s = table.session;
    const cashOut = table.bankroll + pocket.current;
    const trip = {
      t: Date.now(),
      end,
      cur: cur.id,
      wallet: setup.wallet,
      bought: bought.current,
      cashOut,
      net: cashOut - setup.wallet,
      hands: s.hands,
      decisions: s.decisions,
      decisionsOk: s.decisionsOk,
      bets: s.bets,
      betsOk: s.betsOk,
      checks: s.checks,
      checksOk: s.checksOk,
      timeouts: s.timeouts,
      heatOn: setup.heat,
      heatPeak: Math.round(s.heatPeak),
      betLow: s.betLow,
      betHigh: s.betHigh,
      minBet: setup.minBet,
      maxBet: setup.maxBet,
      bots: setup.bots,
      decisionTime: setup.decisionTime,
      ms: Date.now() - started.current,
    };
    if (exam) {
      trip.exam = true;
      trip.passed = gradeExam(trip).passed;
      setState((st) => {
        const prev = st.casino.exam || { attempts: [], passed: null };
        return {
          ...st,
          casino: {
            ...st.casino,
            exam: {
              attempts: [
                ...prev.attempts,
                {
                  t: trip.t,
                  passed: trip.passed,
                  decisions: trip.decisions
                    ? trip.decisionsOk / trip.decisions
                    : 0,
                  bets: trip.bets ? trip.betsOk / trip.bets : 0,
                },
              ].slice(-20),
              passed: prev.passed || (trip.passed ? trip.t : null),
            },
          },
        };
      });
    }
    if (s.hands > 0) recordCasinoTrip(trip);
    else setState((st) => markActive(st));
    setModal(null);
    setResult(trip);
  };

  const buy = (amount) => {
    pocket.current -= amount;
    bought.current += amount;
    table.bankroll += amount;
    table.toast(`Cambiaste ${fmtMoney(amount, cur)} en fichas.`, "info");
    setModal(null);
  };

  if (result) return <CasinoResult trip={result} />;

  const canBuy = !table.running && pocket.current >= setup.minBet;
  const top = (t) => (
    <>
      <div className="sim-top casino-top">
        <IconButton
          icon="close"
          label={exam ? "Dejar el examen" : "Retirarme"}
          className="sq small-ib"
          size={20}
          onClick={() => setModal("leave")}
        />
        <div className="sim-stat">
          <span className="eyebrow">Fichas</span>
          <b className="num">{fmtMoney(t.bankroll, cur)}</b>
        </div>
        <div className="sim-stat">
          <span className="eyebrow">{exam ? "Mano" : "Bolsillo"}</span>
          <b className="num">
            {exam
              ? `${Math.min(t.session.hands + (t.running ? 1 : 0), EXAM.hands)}/${EXAM.hands}`
              : fmtMoney(pocket.current, cur)}
          </b>
        </div>
        <span className="grow" />
        <button
          type="button"
          className="table-btn"
          onClick={() => setModal("buy")}
          disabled={!canBuy}
          aria-label="Comprar fichas"
        >
          <Icon name="plus" size={18} />
          <span className="table-btn-text">Fichas</span>
        </button>
      </div>
      <div className="casino-strip">
        <span className="tiny muted num">
          {exam ? "Examen · " : ""}Mesa {fmtMoney(setup.minBet, cur)}–
          {fmtMoney(setup.maxBet, cur)}
          {setup.decisionTime ? ` · ${setup.decisionTime} s` : ""}
        </span>
        {setup.heat ? <HeatMeter heat={t.heat} /> : null}
      </div>
    </>
  );

  const buyOptions = [
    ...new Set(
      [setup.buyIn, Math.floor(setup.buyIn / 2), pocket.current].filter(
        (v) => v >= setup.minBet && v <= pocket.current,
      ),
    ),
  ].sort((a, b) => a - b);

  return (
    <>
      <TableView
        table={table}
        top={top}
        showCount={false}
        countLabel="Contá vos"
        betHint={false}
        onRefill={() => setModal(canBuy ? "buy" : "broke")}
        refillLabel={canBuy ? "Comprar fichas" : "Te quedaste sin fichas"}
      />
      <Modal open={modal === "leave"} onClose={() => setModal(null)}>
        <h2 style={{ fontSize: 24 }}>
          {exam ? "¿Dejar el examen?" : "¿Te retirás de la mesa?"}
        </h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          {exam
            ? "No cuenta como intento: podés rendirlo de nuevo cuando quieras."
            : table.running
              ? "Terminá la mano que está en juego y después te retirás."
              : `Te vas con ${fmtMoney(table.bankroll + pocket.current, cur)} (llegaste con ${fmtMoney(setup.wallet, cur)}).`}
        </p>
        <div className="btns">
          <Button kind="secondary" onClick={() => setModal(null)}>
            Seguir jugando
          </Button>
          <Button
            kind="danger"
            onClick={() => (exam ? nav.pop() : finish("left"))}
            disabled={!exam && table.running}
          >
            {exam ? "Salir" : "Retirarme"}
          </Button>
        </div>
      </Modal>
      <Modal open={modal === "buy"} onClose={() => setModal(null)}>
        <h2 style={{ fontSize: 24 }}>Comprar fichas</h2>
        <p className="muted" style={{ margin: "10px 0 16px" }}>
          Te quedan {fmtMoney(pocket.current, cur)} en el bolsillo. ¿Cuánto
          cambiás?
        </p>
        <div className="btns">
          {buyOptions.map((v) => (
            <Button kind="secondary" onClick={() => buy(v)} key={v}>
              {fmtMoney(v, cur)}
              {v === pocket.current ? " (todo)" : ""}
            </Button>
          ))}
          <Button kind="ghost" onClick={() => setModal(null)}>
            Mejor no
          </Button>
        </div>
      </Modal>
      <Modal open={modal === "broke"} onClose={() => finish("broke")}>
        <h2 style={{ fontSize: 24 }}>Te quedaste sin plata</h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          No te alcanza para la apuesta mínima de {fmtMoney(setup.minBet, cur)}.
          Pasa hasta jugando perfecto: por eso importa cuánta plata llevás.
        </p>
        <Button onClick={() => finish("broke")}>Ver cómo te fue</Button>
      </Modal>
      <Modal open={modal === "backoff"} onClose={() => finish("backoff")}>
        <span className="res-icon bad" style={{ margin: "0 auto 12px" }}>
          <Icon name="eye" size={26} />
        </span>
        <h2 style={{ fontSize: 24 }}>Te pidieron que te retires</h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          «Podés jugar a cualquier otra cosa, pero al blackjack no.» Tus
          apuestas subían demasiado con el conteo alto y el jefe de mesa se dio
          cuenta.
        </p>
        <Button onClick={() => finish("backoff")}>Ver cómo te fue</Button>
      </Modal>
      <Modal open={modal === "examEnd"} onClose={() => finish("exam")}>
        <h2 style={{ fontSize: 24 }}>Terminó el examen</h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          Jugaste las {EXAM.hands} manos. Veamos cómo te fue.
        </p>
        <Button onClick={() => finish("exam")}>Ver el resultado</Button>
      </Modal>
    </>
  );
}

function Certificate({ trip }) {
  const [msg, setMsg] = useState(null);
  const date = new Date(trip.t).toLocaleDateString("es-UY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const text = `Aprobé el examen de casino de Ventaja 21 (${date}): ${pct(trip.decisionsOk, trip.decisions)} de jugadas correctas y ${pct(trip.betsOk, trip.bets)} de apuestas según el conteo, sin que me descubran.`;
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setMsg("Copiado. Pegalo donde quieras.");
      }
    } catch {
      /* el usuario canceló */
    }
  };
  return (
    <div className="cert fade-up">
      <span className="cert-seal" aria-hidden="true">
        <Icon name="trophy" size={34} stroke={2.2} />
      </span>
      <div className="eyebrow acc">Ventaja 21</div>
      <h2 className="cert-title">Certificado de contador de casino</h2>
      <p className="muted small">{date}</p>
      <div className="cert-stats">
        <span>
          <b className="num">{pct(trip.decisionsOk, trip.decisions)}</b>
          jugadas bien
        </span>
        <span>
          <b className="num">{pct(trip.betsOk, trip.bets)}</b>
          apuestas con el conteo
        </span>
        <span>
          <b className="num">
            {trip.checksOk || 0}/{trip.checks || 0}
          </b>
          chequeos
        </span>
      </div>
      <Button kind="secondary" small={true} icon="copy" onClick={share}>
        Compartir
      </Button>
      {msg ? (
        <p className="tiny good" style={{ marginTop: 8 }}>
          {msg}
        </p>
      ) : null}
    </div>
  );
}

function CasinoResult({ trip }) {
  const nav = useNav();
  const st = useStore();
  const cur = tripCur(trip);
  const hours = trip.hands / HANDS_PER_HOUR[trip.bots || 0];
  const timeText =
    hours >= 1
      ? `≈ ${hours.toFixed(1).replace(".", ",")} h de casino`
      : `≈ ${Math.max(1, Math.round(hours * 60))} min de casino`;
  const decisions = trip.decisions ? trip.decisionsOk / trip.decisions : 1;
  const bets = trip.bets ? trip.betsOk / trip.bets : 1;
  const grade = trip.exam ? gradeExam(trip) : null;
  const tip =
    trip.end === "backoff"
      ? "Para durar más en un casino: subí la apuesta de a poco (no de 1 a 8 de golpe), no la bajes a la mínima justo después de mezclar y cada tanto hacé una apuesta que no siga el conteo."
      : decisions < 0.9
        ? "Las jugadas te costaron plata: repasá la tabla y las desviaciones en Entrenar antes de volver."
        : bets < 0.7
          ? "Tus apuestas no siguieron bien el conteo: sin eso, contar no te da ventaja. Practicá «Apostar según el conteo» en Conteo."
          : trip.net < 0
            ? "Jugaste bien y aun así perdiste: es la varianza. Con ventaja, la diferencia aparece después de muchas horas."
            : "Buena visita. Así se juega: tabla bien, apuestas con el conteo y sin llamar la atención.";
  const mistakes = (st.train.mistakes || []).filter(
    (m) => m.src === "mesa" && m.t >= trip.t - trip.ms,
  ).length;
  return (
    <div className="casino-result fade-up drill-result">
      {grade && grade.passed ? (
        <Certificate trip={trip} />
      ) : (
        <div className="center" style={{ marginTop: 26 }}>
          <div className="eyebrow">
            {grade ? "Examen de casino" : END_TEXT[trip.end]}
          </div>
          {grade ? (
            <h1 className="casino-net bad">Todavía no</h1>
          ) : (
            <h1
              className={cx(
                "num casino-net",
                trip.net > 0 ? "good" : trip.net < 0 ? "bad" : "",
              )}
            >
              {fmtSignedMoney(trip.net, cur)}
            </h1>
          )}
          <p className="muted">
            {grade
              ? "Mirá qué te faltó y volvé a intentarlo."
              : `Llegaste con ${fmtMoney(trip.wallet, cur)} y te vas con ${fmtMoney(trip.cashOut, cur)}.`}
          </p>
        </div>
      )}
      {grade ? (
        <div className="card" style={{ marginTop: 20 }}>
          {grade.rows.map((r) => (
            <div className="kv" key={r.l}>
              <span className="kv-k">
                <Icon
                  name={r.ok ? "check" : "x"}
                  size={16}
                  className={r.ok ? "good" : "bad"}
                />{" "}
                {r.l}
              </span>
              <span className={cx("kv-v num", r.ok ? "t-good" : "t-bad")}>
                {r.v}
                {r.need ? (
                  <span className="muted tiny"> / {r.need}</span>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="kv">
            <span className="kv-k">Manos jugadas</span>
            <span className="kv-v num">
              {trip.hands} <span className="muted">· {timeText}</span>
            </span>
          </div>
          <div className="kv">
            <span className="kv-k">Fichas que compraste</span>
            <span className="kv-v num">{fmtMoney(trip.bought, cur)}</span>
          </div>
          <div className="kv">
            <span className="kv-k">Jugadas correctas</span>
            <span
              className={cx("kv-v num", decisions >= 0.9 ? "t-good" : "t-bad")}
            >
              {pct(trip.decisionsOk, trip.decisions)}
            </span>
          </div>
          <div className="kv">
            <span className="kv-k">Apuestas según el conteo</span>
            <span className={cx("kv-v num", bets >= 0.7 ? "t-good" : "t-bad")}>
              {pct(trip.betsOk, trip.bets)}
            </span>
          </div>
          {trip.betHigh ? (
            <div className="kv">
              <span className="kv-k">Tus apuestas</span>
              <span className="kv-v num">
                {fmtMoney(trip.betLow, cur)} a {fmtMoney(trip.betHigh, cur)}
              </span>
            </div>
          ) : null}
          {trip.decisionTime ? (
            <div className="kv">
              <span className="kv-k">Se te pasó el tiempo</span>
              <span
                className={cx("kv-v num", trip.timeouts ? "t-bad" : "t-good")}
              >
                {trip.timeouts} {trip.timeouts === 1 ? "vez" : "veces"}
              </span>
            </div>
          ) : null}
          {trip.heatOn ? (
            <div className="kv">
              <span className="kv-k">Vigilancia más alta</span>
              <span className="kv-v">
                <HeatMeter heat={trip.heatPeak} />
              </span>
            </div>
          ) : null}
        </div>
      )}
      {grade && grade.passed ? (
        <p className="muted small center" style={{ marginTop: 14 }}>
          Resultado de la mesa: {fmtSignedMoney(trip.net, cur)} en {trip.hands}{" "}
          manos.
        </p>
      ) : (
        <div className="note-box" style={{ marginTop: 14 }}>
          {tip}
        </div>
      )}
      {mistakes ? (
        <p className="muted small" style={{ marginTop: 12 }}>
          Las {mistakes === 1 ? "jugada" : `${mistakes} jugadas`} que fallaste
          quedaron en «Tus errores», en Entrenar.
        </p>
      ) : null}
      <div className="btns" style={{ marginTop: 20 }}>
        <Button onClick={() => nav.pop()}>Volver al casino</Button>
        {mistakes ? (
          <Button
            kind="outline"
            onClick={() =>
              nav.replace("trainSession", {
                mode: "mistakes",
                confirmExit: true,
              })
            }
          >
            Practicar mis errores
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { CasinoPlay, CasinoSetup };
