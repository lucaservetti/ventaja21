// Modo casino real: llevás tu plata, cambiás fichas al sentarte y jugás sin ayudas, con los límites
// de la mesa, tiempo para decidir y la vigilancia del casino mirando cómo apostás.
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
import { Table, money } from "../engine/table.js";
import { TopBar, useRules } from "../ui/common.jsx";
import { TableView } from "./TableView.jsx";
import { useNav } from "../nav.js";

const WALLETS = [300, 500, 1000, 2000, 5000];
const BUY_INS = [100, 200, 300, 500, 1000, 2000];
const MINS = [5, 10, 25, 50, 100];
const MAXES = [100, 250, 500, 1000, 2500, 5000];
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
};

function signedMoney(v) {
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}$${money(Math.abs(v))}`;
}
function pct(ok, n) {
  return n ? `${Math.round((ok / n) * 100)} %` : "—";
}
function setSetup(patch) {
  setState((st) => ({
    ...st,
    casino: { ...st.casino, setup: { ...st.casino.setup, ...patch } },
  }));
}

function CasinoSetup() {
  const st = useStore();
  const nav = useNav();
  const rules = useRules();
  const s = st.casino.setup;
  const buyIn = Math.min(s.buyIn, s.wallet);
  const maxes = MAXES.filter((v) => v >= s.minBet * 10);
  const maxBet = maxes.includes(s.maxBet) ? s.maxBet : maxes[0];
  const minBets = Math.floor(s.wallet / s.minBet);
  const trips = st.casino.trips.slice().reverse();
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
        <span>Plata que llevás al casino</span>
        <Pills
          options={WALLETS.map((v) => ({ value: v, label: `$${money(v)}` }))}
          value={s.wallet}
          onChange={(wallet) => setSetup({ wallet })}
        />
      </div>
      <div className="field">
        <span>Fichas que cambiás al sentarte (entrada)</span>
        <Pills
          options={BUY_INS.filter((v) => v <= s.wallet).map((v) => ({
            value: v,
            label: `$${money(v)}`,
          }))}
          value={buyIn}
          onChange={(v) => setSetup({ buyIn: v })}
        />
      </div>

      <h3 className="sheet-sub">La mesa</h3>
      <div className="field">
        <span>Apuesta mínima</span>
        <Pills
          options={MINS.map((v) => ({ value: v, label: `$${v}` }))}
          value={s.minBet}
          onChange={(minBet) => setSetup({ minBet })}
        />
      </div>
      <div className="field">
        <span>Apuesta máxima</span>
        <Pills
          options={maxes.map((v) => ({ value: v, label: `$${money(v)}` }))}
          value={maxBet}
          onChange={(v) => setSetup({ maxBet: v })}
        />
      </div>
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
          Con ${money(s.wallet)} y mínima de ${s.minBet} te alcanza para{" "}
          {minBets} apuestas mínimas: una mala racha te deja sin plata
          enseguida.
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
                  <b className="num">{signedMoney(t.net)}</b>
                </span>
                <span className="li-text">
                  <span className="li-title">{END_TEXT[t.end]}</span>
                  <span className="li-sub num" style={{ display: "block" }}>
                    {new Date(t.t).toLocaleDateString("es-UY", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {t.hands} manos · mesa ${t.minBet}–${money(t.maxBet)}
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
          Sentarme con ${money(buyIn)} en fichas
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

function CasinoPlay({ setup }) {
  const nav = useNav();
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
      countCheck: "off",
      pressure: false,
      silent: true,
      quietResults: true,
      minBet: setup.minBet,
      maxBet: setup.maxBet,
      decisionTime: setup.decisionTime,
      heat: setup.heat,
    });
  });
  const [, setTick] = useState(0);
  const pocket = useRef(setup.wallet - setup.buyIn);
  const bought = useRef(setup.buyIn);
  const started = useRef(Date.now());
  const seenSeq = useRef(0);
  const [modal, setModal] = useState(null); // leave | buy | broke | backoff
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

  const finish = (end) => {
    const s = table.session;
    const cashOut = table.bankroll + pocket.current;
    const trip = {
      t: Date.now(),
      end,
      wallet: setup.wallet,
      bought: bought.current,
      cashOut,
      net: cashOut - setup.wallet,
      hands: s.hands,
      decisions: s.decisions,
      decisionsOk: s.decisionsOk,
      bets: s.bets,
      betsOk: s.betsOk,
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
    if (s.hands > 0) recordCasinoTrip(trip);
    else setState((st) => markActive(st));
    setModal(null);
    setResult(trip);
  };

  const buy = (amount) => {
    pocket.current -= amount;
    bought.current += amount;
    table.bankroll += amount;
    table.toast(`Cambiaste $${money(amount)} en fichas.`, "info");
    setModal(null);
  };

  if (result) return <CasinoResult trip={result} />;

  const canBuy = !table.running && pocket.current >= setup.minBet;
  const top = (t) => (
    <>
      <div className="sim-top casino-top">
        <IconButton
          icon="close"
          label="Retirarme"
          className="sq small-ib"
          size={20}
          onClick={() => setModal("leave")}
        />
        <div className="sim-stat">
          <span className="eyebrow">Fichas</span>
          <b className="num">${money(t.bankroll)}</b>
        </div>
        <div className="sim-stat">
          <span className="eyebrow">Bolsillo</span>
          <b className="num">${money(pocket.current)}</b>
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
          Mesa ${setup.minBet}–${money(setup.maxBet)}
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
        <h2 style={{ fontSize: 24 }}>¿Te retirás de la mesa?</h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          {table.running
            ? "Terminá la mano que está en juego y después te retirás."
            : `Te vas con $${money(table.bankroll + pocket.current)} (llegaste con $${money(setup.wallet)}).`}
        </p>
        <div className="btns">
          <Button kind="secondary" onClick={() => setModal(null)}>
            Seguir jugando
          </Button>
          <Button
            kind="danger"
            onClick={() => finish("left")}
            disabled={table.running}
          >
            Retirarme
          </Button>
        </div>
      </Modal>
      <Modal open={modal === "buy"} onClose={() => setModal(null)}>
        <h2 style={{ fontSize: 24 }}>Comprar fichas</h2>
        <p className="muted" style={{ margin: "10px 0 16px" }}>
          Te quedan ${money(pocket.current)} en el bolsillo. ¿Cuánto cambiás?
        </p>
        <div className="btns">
          {buyOptions.map((v) => (
            <Button kind="secondary" onClick={() => buy(v)} key={v}>
              ${money(v)}
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
          No te alcanza para la apuesta mínima de ${setup.minBet}. Pasa hasta
          jugando perfecto: por eso importa cuánta plata llevás.
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
    </>
  );
}

function CasinoResult({ trip }) {
  const nav = useNav();
  const st = useStore();
  const hours = trip.hands / HANDS_PER_HOUR[trip.bots || 0];
  const timeText =
    hours >= 1
      ? `≈ ${hours.toFixed(1).replace(".", ",")} h de casino`
      : `≈ ${Math.max(1, Math.round(hours * 60))} min de casino`;
  const decisions = trip.decisions ? trip.decisionsOk / trip.decisions : 1;
  const bets = trip.bets ? trip.betsOk / trip.bets : 1;
  const tip =
    trip.end === "backoff"
      ? "Para durar más en un casino: subí la apuesta de a poco (no de 1 a 8 de golpe), no la bajes a la mínima justo después de mezclar y cada tanto hacé una apuesta que no siga el conteo."
      : decisions < 0.9
        ? "Las jugadas te costaron plata: repasá la tabla en Entrenar antes de volver."
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
      <div className="center" style={{ marginTop: 26 }}>
        <div className="eyebrow">{END_TEXT[trip.end]}</div>
        <h1
          className={cx(
            "num casino-net",
            trip.net > 0 ? "good" : trip.net < 0 ? "bad" : "",
          )}
        >
          {signedMoney(trip.net)}
        </h1>
        <p className="muted">
          Llegaste con ${money(trip.wallet)} y te vas con ${money(trip.cashOut)}
          .
        </p>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="kv">
          <span className="kv-k">Manos jugadas</span>
          <span className="kv-v num">
            {trip.hands} <span className="muted">· {timeText}</span>
          </span>
        </div>
        <div className="kv">
          <span className="kv-k">Fichas que compraste</span>
          <span className="kv-v num">${money(trip.bought)}</span>
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
              ${money(trip.betLow)} a ${money(trip.betHigh)}
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
      <div className="note-box" style={{ marginTop: 14 }}>
        {tip}
      </div>
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
