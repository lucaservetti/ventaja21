import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  TABLE_PRESETS,
  describeRules,
  getState,
  markActive,
  setRules,
  setState,
  setTable,
  useStore,
  withRules,
} from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { handTotalText, handValue, isBlackjack } from "../engine/cards.js";
import { ACTION_NAMES } from "../engine/strategy.js";
import { sfx, vibrate } from "../sound.js";
import {
  Button,
  CHIP_VALUES,
  Chip,
  ChipStack,
  IconButton,
  Keypad,
  Modal,
  Pills,
  PlayingCard,
  Sheet,
  StrategyChart,
  Toasts,
  Toggle,
  cx,
  formatKeypad,
  parseKeypad,
} from "../ui/components.jsx";
import { evFor } from "../engine/ev.js";
import { betUnits, floorTC, fmtSigned, systemFor } from "../engine/systems.js";
import { TABLE_SPEEDS, Table, money } from "../engine/table.js";
import { Tray } from "./drills.jsx";
import { useNav } from "../nav.js";

let tableInstance = null;
function tableOptions(a) {
  let e = a.table;
  return {
    rules: withRules(a.settings.rules),
    system: a.settings.system,
    bots: e.bots,
    unit: e.unit,
    startBankroll: e.startBankroll,
    speed: e.speed,
    coach: e.coach,
    betCoach: e.betCoach,
    deviations: e.deviations,
    countCheck: e.countCheck,
    pressure: e.pressure,
  };
}
function getTable() {
  if (!tableInstance) {
    let a = getState();
    tableInstance = new Table({
      ...tableOptions(a),
      bankroll: a.table.bankroll,
    });
  }
  return tableInstance;
}
const RESULT_LABELS = {
  win: "Ganaste",
  lose: "Perdiste",
  push: "Empate",
  bj: "Blackjack",
  bust: "Te pasaste",
  surrender: "Te rendiste",
};
const PHASE_LABELS = {
  deal: "Repartiendo…",
  bots: "Juegan los demás…",
  dealer: "Juega el crupier…",
  shuffle: "Mezclando el zapato…",
  insurance: "",
};
function PlayTab({ active: a }) {
  let e = useStore(),
    t = useNav(),
    s = getTable(),
    n = useMemo(() => (w) => s.subscribe(w), [s]);
  useSyncExternalStore(
    n,
    () => s.version,
    () => s.version,
  );
  let [l, i] = useState(null),
    [o, c] = useState(null),
    [r, u] = useState(null),
    [d, p] = useState(false),
    [f, y] = useState(null),
    C = useRef(null),
    k = systemFor(e.settings.system),
    v = JSON.stringify(tableOptions(e));
  useEffect(() => {
    let w = s.rules,
      J = tableOptions(e),
      ba = JSON.stringify(withRules(w)) !== JSON.stringify(J.rules);
    s.configure({ ...J, reshuffle: ba && !s.running });
  }, [v]);
  useEffect(() => {
    s.onRoundEnd = (w, J) => {
      let ba = J.session,
        ye = C.current || {
          hands: 0,
          net: 0,
          decisions: 0,
          decisionsOk: 0,
          checks: 0,
          checksOk: 0,
          bets: 0,
          betsOk: 0,
        };
      setState((Ja) =>
        markActive({
          ...Ja,
          table: { ...Ja.table, bankroll: J.bankroll },
          play: {
            ...Ja.play,
            hands: Ja.play.hands + (ba.hands - ye.hands),
            net: Ja.play.net + (ba.net - ye.net),
            decisions: Ja.play.decisions + (ba.decisions - ye.decisions),
            decisionsOk:
              Ja.play.decisionsOk + (ba.decisionsOk - ye.decisionsOk),
            bets: Ja.play.bets + (ba.bets - ye.bets),
            betsOk: Ja.play.betsOk + (ba.betsOk - ye.betsOk),
          },
        }),
      );
      C.current = { ...ba };
      if (w.net > 0) {
        sfx.win();
      }
    };
  }, []);
  let m = useRef(0),
    b =
      s.dealer.cards.length +
      s.hands.reduce((w, J) => w + J.cards.length, 0) +
      s.botSeats.reduce(
        (w, J) => w + J.hands.reduce((ba, ye) => ba + ye.cards.length, 0),
        0,
      );
  useEffect(() => {
    if (b > m.current && a) {
      sfx.card();
    }
    m.current = b;
  }, [b]);
  useEffect(() => {
    if (s.phase === "shuffle" && a) {
      sfx.shuffle();
    }
  }, [s.phase]);
  useEffect(() => {
    if (s.phase === "settle" && s.countCheckDue && !o) {
      let w = setTimeout(
        () =>
          c({ value: "", result: null, final: s.countCheckDue === "final" }),
        700,
      );
      return () => clearTimeout(w);
    }
    if (s.phase === "settle" && s.shoeEnded && !s.countCheckDue && !r && !o) {
      s.shoeEnded = false;
      u({ ...s.shoeStats });
    }
  }, [s.phase, s.countCheckDue, s.version]);
  useEffect(() => {
    if (s.feedback) {
      if (s.feedback.ok) {
        sfx.good();
        p(false);
      } else {
        sfx.bad();
        vibrate(30);
        p(false);
      }
    }
  }, [s.feedback && s.feedback.id]);
  useEffect(() => {
    if (!s.opts.pressure || !a) return;
    let w = setInterval(() => {
      if (s.phase !== "bet") {
        y(s.randomChatter());
        setTimeout(() => y(null), 2600);
      }
    }, 7000);
    return () => clearInterval(w);
  }, [s.opts.pressure, a]);
  let S = s.rules,
    D = floorTC(s.tc),
    _ = e.table.showCount,
    M = s.decksRemaining,
    R = s.allowed(),
    V = !["bet", "settle"].includes(s.phase),
    B = (s.shoe.needsShuffle || s.pendingShuffle) && S.pen > 0,
    Z =
      e.table.betCoach && k.id === "hilo" && S.pen > 0
        ? (B ? 1 : betUnits(s.tc)) * s.opts.unit
        : null,
    ta = s.session,
    Ba = () => {
      vibrate(10);
      s.deal();
    },
    Ma = (w) => {
      if (s.rebet(w)) {
        s.deal();
      }
    },
    ca = () => {
      s.refill();
      setTable({ bankroll: s.bankroll });
    },
    ha = () => {
      let w = parseKeypad(o.value);
      if (w === null) return;
      let J = s.submitCountCheck(w);
      if (J.ok) {
        sfx.good();
      } else {
        sfx.bad();
      }
      c({ ...o, result: J });
      setState((ba) => ({
        ...ba,
        play: {
          ...ba.play,
          checks: ba.play.checks + 1,
          checksOk: ba.play.checksOk + (J.ok ? 1 : 0),
        },
      }));
    },
    Ia = () => {
      let w = o && o.result && o.result.final;
      c(null);
      if (w || s.shoeEnded) {
        s.shoeEnded = false;
        u({ ...s.shoeStats });
      }
    },
    X = s.dealer.cards.length
      ? s.dealer.hidden
        ? handTotalText([s.dealer.cards[0]])
        : handTotalText(s.dealer.cards)
      : null,
    P = e.table.xray ? s.composition() : null;
  return (
    <div className="sim">
      <div className="sim-top">
        <IconButton
          icon={e.settings.sound ? "volume" : "mute"}
          label={e.settings.sound ? "Silenciar" : "Activar sonido"}
          onClick={() =>
            setState((w) => ({
              ...w,
              settings: { ...w.settings, sound: !w.settings.sound },
            }))
          }
          className="sq small-ib"
          size={20}
        />
        <div className="sim-stat">
          <span className="eyebrow">Fichas</span>
          <b className="num">${money(s.bankroll)}</b>
        </div>
        <div className="sim-stat">
          <span className="eyebrow">Sesión</span>
          <b
            className={cx("num", ta.net > 0 ? "good" : ta.net < 0 ? "bad" : "")}
          >
            {ta.net > 0 ? "+" : ta.net < 0 ? "−" : ""}${money(Math.abs(ta.net))}
          </b>
        </div>
        <span className="grow" />
        <IconButton
          icon="grid"
          label="Tabla de estrategia"
          onClick={() => i("chart")}
          className="sq small-ib"
          size={20}
        />
        <IconButton
          icon="stats"
          label="Estadísticas de la sesión"
          onClick={() => i("stats")}
          className="sq small-ib"
          size={20}
        />
        <button type="button" className="table-btn" onClick={() => i("table")}>
          <Icon name="gear" size={18} />
          {" Mesa"}
        </button>
      </div>
      <div className="sim-hud">
        <div className="hud-side">
          <Tray shoe={S.decks} cards={s.shoe.dealt} small={true} />
          <span className="tiny muted num">
            {"≈ "}
            {decksText(M)}
            {" mazos"}
          </span>
        </div>
        <div className="hud-center">
          {S.pen <= 0 ? (
            <span className="count-pill rng">Se mezcla en cada mano</span>
          ) : (
            <button
              type="button"
              className={cx("count-pill", !_ && "hidden-count")}
              onClick={() => setTable({ showCount: !_ })}
              aria-label={_ ? "Ocultar conteo" : "Mostrar conteo"}
            >
              {_ ? (
                <>
                  <span className="num">
                    {"CC "}
                    {fmtSigned(s.rcSys)}
                  </span>
                  {k.balanced ? (
                    <span className="num">
                      {" · CR "}
                      {s.tcSys === null ? "—" : fmtSigned(s.tcSys, 1)}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <Icon name="eyeoff" size={16} />
                  {" Conteo oculto"}
                </>
              )}
            </button>
          )}
          {P ? <XRay comp={P} /> : null}
          {k.id !== "hilo" && _ ? (
            <span className="tiny muted">{k.short || k.name}</span>
          ) : null}
        </div>
        <div className="hud-side right">
          <span className="shoe-ic">
            <Icon name="shoe" size={30} />
          </span>
          <span className="tiny muted num">
            {s.shoe.remaining}
            {" cartas"}
          </span>
        </div>
      </div>
      <div className={cx("felt", s.phase === "shuffle" && "shuffling")}>
        <div className="seat dealer-seat">
          <span className="eyebrow">Crupier</span>
          <div className="card-row overlap cr-md">
            {s.dealer.cards.map((w) => (
              <PlayingCard
                card={w}
                size="md"
                deal={true}
                down={!w.faceUp}
                key={w.id}
              />
            ))}
          </div>
          {X !== null ? (
            <span
              className={cx(
                "total-badge num",
                s.result && s.result.dealerBust && "bad",
              )}
            >
              {s.result && s.result.dealerBust
                ? `Se pasó · ${handValue(s.dealer.cards).hard}`
                : X}
            </span>
          ) : (
            <span className="total-badge ghost">·</span>
          )}
        </div>
        {s.botSeats.length ? (
          <div className="bots">
            {s.botSeats.map((w) => (
              <div className="bot" key={w.name}>
                <div className="bot-hands">
                  {w.hands.map((J) => (
                    <div
                      className={cx("bot-hand", J.result && `r-${J.result}`)}
                      key={J.id}
                    >
                      <div className="card-row overlap cr-sm">
                        {J.cards.map((ba) => (
                          <PlayingCard
                            card={ba}
                            size="xs"
                            deal={true}
                            key={ba.id}
                          />
                        ))}
                      </div>
                      {J.cards.length ? (
                        <span className="tiny num bot-total">
                          {J.surrendered ? "R" : handTotalText(J.cards)}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
                <span className="tiny muted">{w.name}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className={cx("player-hands", s.hands.length > 1 && "multi")}>
          {s.hands.length ? (
            s.hands.map((w, J) => {
              let ba = s.phase === "player" && J === s.active;
              return (
                <div
                  className={cx(
                    "p-hand",
                    ba && "active",
                    w.result && `r-${w.result}`,
                  )}
                  key={w.id}
                >
                  <div
                    className={cx(
                      "card-row overlap",
                      s.hands.length > 1 ? "cr-sm" : "cr-md",
                    )}
                  >
                    {w.cards.map((ye) => (
                      <PlayingCard
                        card={ye}
                        size={s.hands.length > 2 ? "sm" : "md"}
                        deal={true}
                        key={ye.id}
                      />
                    ))}
                  </div>
                  <span
                    className={cx(
                      "total-badge num",
                      w.result && ["win", "bj"].includes(w.result) && "good",
                      w.result &&
                        ["lose", "bust", "surrender"].includes(w.result) &&
                        "bad",
                    )}
                  >
                    {w.result
                      ? RESULT_LABELS[w.result]
                      : w.cards.length
                        ? isBlackjack(w.cards, w.fromSplit)
                          ? "Blackjack"
                          : handTotalText(w.cards)
                        : ""}
                  </span>
                  <div className="p-bet">
                    <ChipStack amount={w.bet} size={30} />
                    <span className="tiny num">${money(w.bet)}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bet-spot">
              {s.bet ? (
                <ChipStack amount={s.bet} size={46} />
              ) : (
                <span className="bet-ring">APOSTÁ</span>
              )}
              {s.bet ? <b className="num bet-amt">${money(s.bet)}</b> : null}
            </div>
          )}
        </div>
        {s.insuranceBet ? (
          <div className="ins-chip tiny">Seguro ${money(s.insuranceBet)}</div>
        ) : null}
        {f ? <div className="chatter fade-up">“{f}”</div> : null}
      </div>
      {s.feedback && s.opts.coach ? (
        <button
          type="button"
          className={cx("coach-fb", s.feedback.ok ? "ok" : "bad", d && "open")}
          onClick={() => p(!d)}
        >
          <span className="fb-icon">
            <Icon name={s.feedback.ok ? "check" : "x"} size={16} stroke={3} />
          </span>
          <span className="grow" style={{ textAlign: "left" }}>
            <b>
              {s.feedback.ok
                ? `Bien: ${ACTION_NAMES[s.feedback.best].toLowerCase()}`
                : s.feedback.title ||
                  `Lo correcto era ${ACTION_NAMES[s.feedback.best].toLowerCase()}`}
            </b>
            {d && s.feedback.note ? (
              <span className="fb-note">{s.feedback.note}</span>
            ) : null}
            {!d && s.feedback.note ? (
              <span className="fb-more tiny">{" · ver por qué"}</span>
            ) : null}
          </span>
        </button>
      ) : null}
      <div className="controls">
        {s.phase === "bet" ? (
          <>
            {Z ? (
              <div className="bet-hint tiny">
                {B ? (
                  <>
                    {"Se mezcla antes de esta mano: apuesta sugerida "}
                    <b>${Z}</b>
                    {" (1 u.)"}
                  </>
                ) : (
                  <>
                    {"Con conteo real "}
                    {D >= 0 ? "+" : "−"}
                    {Math.abs(D)}
                    {": apuesta sugerida "}
                    <b>${Z}</b>
                    {" ("}
                    {Z / s.opts.unit}
                    {" u.)"}
                  </>
                )}
              </div>
            ) : B ? (
              <div className="bet-hint tiny">
                Se mezcla el zapato antes de esta mano.
              </div>
            ) : null}
            <div className="chip-rack">
              {CHIP_VALUES.map((w) => (
                <Chip
                  value={w}
                  size={54}
                  onClick={(J) => s.addChip(J)}
                  disabled={w > s.bankroll - s.bet}
                  key={w}
                />
              ))}
            </div>
            <div className="row" style={{ gap: 10, marginTop: 10 }}>
              <Button
                kind="secondary"
                small={true}
                onClick={() => s.undoChip()}
                disabled={!s.bet}
              >
                Deshacer
              </Button>
              <Button
                kind="secondary"
                small={true}
                onClick={() => s.clearBet()}
                disabled={!s.bet}
              >
                Borrar
              </Button>
              {s.bankroll < 1 ? (
                <Button small={true} onClick={ca} className="grow">
                  Recargar fichas
                </Button>
              ) : (
                <Button
                  small={true}
                  onClick={Ba}
                  disabled={!s.bet}
                  className="grow deal-btn"
                >
                  Repartir
                </Button>
              )}
            </div>
          </>
        ) : s.phase === "settle" ? (
          <div className="settle-row">
            <Button
              kind="secondary"
              small={true}
              onClick={() => s.clearTable() || s.emit()}
            >
              Nueva apuesta
            </Button>
            <Button
              small={true}
              onClick={() => Ma(1)}
              disabled={s.lastBet > s.bankroll}
            >
              Repetir ${money(s.lastBet)}
            </Button>
            <Button
              kind="secondary"
              small={true}
              onClick={() => Ma(2)}
              disabled={s.lastBet * 2 > s.bankroll}
            >
              ×2
            </Button>
          </div>
        ) : s.phase === "player" ? (
          <div className="sim-actions">
            <SimAction a="P" icon="split" allowed={R} t={s} />
            <SimAction a="D" allowed={R} t={s} />
            <SimAction a="H" icon="hand" allowed={R} t={s} />
            <SimAction a="S" icon="stand" allowed={R} t={s} />
            {S.surrender ? (
              <SimAction a="R" icon="surrender" allowed={R} t={s} />
            ) : null}
          </div>
        ) : s.phase === "insurance" ? (
          <div className="ins-panel fade-up">
            <b>
              {isBlackjack(s.hands[0].cards) ? "¿Pago parejo?" : "¿Seguro?"}
            </b>
            <p className="muted small">
              {isBlackjack(s.hands[0].cards)
                ? "Tenés blackjack y el crupier muestra As. Pago parejo: cobrás 1 a 1 ya, tenga o no blackjack."
                : `El crupier muestra As. El seguro cuesta $${money(s.hands[0].bet / 2)} y paga 2 a 1 si tiene blackjack.`}
            </p>
            <div className="row" style={{ gap: 10, marginTop: 10 }}>
              <Button
                kind="secondary"
                small={true}
                className="grow"
                onClick={() => s.insure(true)}
                disabled={s.hands[0].bet / 2 > s.bankroll}
              >
                {isBlackjack(s.hands[0].cards) ? "Sí, cobrar" : "Sí, seguro"}
              </Button>
              <Button
                small={true}
                className="grow"
                onClick={() => s.insure(false)}
              >
                No, gracias
              </Button>
            </div>
          </div>
        ) : (
          <div className="phase-msg muted">{PHASE_LABELS[s.phase] || ""}</div>
        )}
      </div>
      <Toasts items={s.toasts} />
      <Modal open={!!o}>
        {o ? (
          o.result ? (
            <div className="center">
              <span className={cx("res-icon big", o.result.ok ? "ok" : "bad")}>
                <Icon name={o.result.ok ? "check" : "x"} size={34} stroke={3} />
              </span>
              <h2 style={{ fontSize: 28, marginTop: 12 }}>
                {o.result.ok ? "¡Exacto!" : "No era ese"}
              </h2>
              <p className="muted" style={{ marginTop: 8 }}>
                {"El conteo corrido es "}
                <b className="acc num">{fmtSigned(o.result.correct)}</b>
                {o.result.ok ? null : (
                  <>
                    {" "}
                    {"y pusiste "}
                    <b className="bad num">{fmtSigned(parseKeypad(o.value))}</b>
                  </>
                )}
                .
              </p>
              {k.balanced && S.pen > 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  {"Quedan ≈ "}
                  {decksText(M)}
                  {" mazos: conteo real "}
                  {fmtSigned(s.tcSys, 1)}.
                </p>
              ) : null}
              <Button onClick={Ia} style={{ marginTop: 18 }}>
                Seguir
              </Button>
            </div>
          ) : (
            <div>
              <div className="eyebrow acc center">
                {o.final ? "Fin del zapato" : "Chequeo de conteo"}
              </div>
              <h2 className="center" style={{ fontSize: 24, marginTop: 6 }}>
                ¿Cuál es el conteo corrido?
              </h2>
              <p className="center muted small" style={{ marginTop: 4 }}>
                {k.name}
                {k.balanced ? "" : ` · arrancó en ${fmtSigned(k.irc(S.decks))}`}
              </p>
              <div className="keypad-display">{formatKeypad(o.value)}</div>
              <Keypad
                value={o.value}
                onChange={(w) => c({ ...o, value: w })}
                onSubmit={ha}
                allowHalf={k.id === "halves"}
                submitLabel="Comprobar"
              />
              <Button
                kind="ghost"
                onClick={() => {
                  s.skipCountCheck();
                  Ia();
                }}
              >
                Saltar
              </Button>
            </div>
          )
        ) : null}
      </Modal>
      <Modal open={!!r && !o}>
        {r ? (
          <div>
            <div className="eyebrow acc center">Fin del zapato</div>
            <h2 className="center" style={{ fontSize: 26, marginTop: 6 }}>
              Resumen del zapato
            </h2>
            <div className="tiles two" style={{ marginTop: 16 }}>
              <div className="tile">
                <div className="tile-v num">{r.hands}</div>
                <div className="tile-l">manos</div>
              </div>
              <div className="tile">
                <div
                  className={cx(
                    "tile-v num",
                    r.net > 0 ? "good" : r.net < 0 ? "bad" : "",
                  )}
                >
                  {r.net >= 0 ? "+" : "−"}${money(Math.abs(r.net))}
                </div>
                <div className="tile-l">resultado</div>
              </div>
              <div className="tile">
                <div className="tile-v num">
                  {r.decisions
                    ? Math.round((r.decisionsOk / r.decisions) * 100) + "%"
                    : "—"}
                </div>
                <div className="tile-l">jugadas correctas</div>
              </div>
              <div className="tile">
                <div className="tile-v num">
                  {r.checks ? `${r.checksOk}/${r.checks}` : "—"}
                </div>
                <div className="tile-l">chequeos de conteo</div>
              </div>
            </div>
            <p className="muted small center" style={{ marginTop: 12 }}>
              El resultado de un zapato es casi pura suerte. Lo que importa es
              jugar bien y apostar según el conteo.
            </p>
            <Button onClick={() => u(null)} style={{ marginTop: 16 }}>
              Mezclar y seguir
            </Button>
          </div>
        ) : null}
      </Modal>
      <Sheet
        open={l === "chart"}
        onClose={() => i(null)}
        title="Estrategia básica"
        tall={true}
      >
        <StrategyChart rules={S} />
        <div className="tags" style={{ marginTop: 14 }}>
          {describeRules(S).map((w) => (
            <span className="chip-tag" key={w}>
              {w}
            </span>
          ))}
        </div>
      </Sheet>
      <Sheet
        open={l === "stats"}
        onClose={() => i(null)}
        title="Esta sesión"
        tall={true}
      >
        <SessionStats t={s} st={e} />
      </Sheet>
      <TableSheet open={l === "table"} onClose={() => i(null)} t={s} />
    </div>
  );
}
function SimAction({ a, icon: e, allowed: t, t: s }) {
  let n = t[a];
  return (
    <button
      type="button"
      className={cx("sim-act", `act-${a}`)}
      disabled={!n}
      onClick={() => {
        vibrate(8);
        s.act(a);
      }}
    >
      {a === "D" ? (
        <span className="act-2x">2X</span>
      ) : (
        <Icon name={e} size={24} />
      )}
      <span>{ACTION_NAMES[a].toUpperCase()}</span>
    </button>
  );
}
function XRay({ comp: a }) {
  let e = a.total || 1,
    t = a.low / e,
    s = a.high / e,
    n = a.mid / e,
    l = a.high - a.low;
  return (
    <div className="xray" title="Cartas que quedan en el zapato">
      <div className="xray-bar">
        <span className="xr-lo" style={{ width: `${t * 100}%` }} />
        <span className="xr-mid" style={{ width: `${n * 100}%` }} />
        <span className="xr-hi" style={{ width: `${s * 100}%` }} />
      </div>
      <div className="xray-lbl tiny">
        <span className="bad">BAJAS</span>
        <span className="muted">
          {"RAYOS X "}
          {l > 0 ? `· +${l} altas` : l < 0 ? `· ${-l} bajas de más` : ""}
        </span>
        <span className="good">ALTAS</span>
      </div>
    </div>
  );
}
function decksText(a) {
  return (Math.round(a * 2) / 2).toFixed(1).replace(".0", "").replace(".", ",");
}
function SessionStats({ t: a, st: e }) {
  let t = a.session,
    s = (n, l) => (l ? `${Math.round((n / l) * 100)} %` : "—");
  return (
    <div>
      <div className="tiles">
        <div className="tile">
          <div className="tile-v num">{t.hands}</div>
          <div className="tile-l">manos</div>
        </div>
        <div className="tile">
          <div
            className={cx(
              "tile-v num",
              t.net > 0 ? "good" : t.net < 0 ? "bad" : "",
            )}
          >
            {t.net >= 0 ? "+" : "−"}
            {money(Math.abs(t.net))}
          </div>
          <div className="tile-l">resultado ($)</div>
        </div>
        <div className="tile">
          <div className="tile-v num">{t.bj}</div>
          <div className="tile-l">blackjacks</div>
        </div>
      </div>
      <div className="card flat" style={{ marginTop: 14 }}>
        <div className="kv">
          <span className="kv-k">Ganadas / perdidas / empates</span>
          <span className="kv-v num">
            {t.won}
            {" / "}
            {t.lost}
            {" / "}
            {t.push}
          </span>
        </div>
        <div className="kv">
          <span className="kv-k">Jugadas correctas</span>
          <span className="kv-v num">
            {s(t.decisionsOk, t.decisions)}{" "}
            <span className="muted tiny">
              ({t.decisionsOk}/{t.decisions})
            </span>
          </span>
        </div>
        <div className="kv">
          <span className="kv-k">Apuestas según el conteo</span>
          <span className="kv-v num">{s(t.betsOk, t.bets)}</span>
        </div>
        <div className="kv">
          <span className="kv-k">Chequeos de conteo</span>
          <span className="kv-v num">
            {t.checks ? `${t.checksOk}/${t.checks}` : "—"}
          </span>
        </div>
        <div className="kv">
          <span className="kv-k">Seguro bien decidido</span>
          <span className="kv-v num">
            {t.insurance ? `${t.insuranceOk}/${t.insurance}` : "—"}
          </span>
        </div>
        <div className="kv">
          <span className="kv-k">Zapatos terminados</span>
          <span className="kv-v num">{t.shoes}</span>
        </div>
        {a.opts.pressure ? (
          <div className="kv">
            <span className="kv-k">Decisiones lentas (más de 5 s)</span>
            <span className="kv-v num">{t.slow}</span>
          </div>
        ) : null}
      </div>
      {t.mistakes.length ? (
        <>
          <h3 style={{ margin: "20px 0 8px" }}>Errores de la sesión</h3>
          <div className="list">
            {t.mistakes
              .slice(-8)
              .reverse()
              .map((n, l) => (
                <div className="list-item" key={l}>
                  <span className="li-text">
                    <span className="li-title" style={{ fontSize: 16 }}>
                      {n.spot}
                    </span>
                    <span className="li-sub" style={{ display: "block" }}>
                      {"Jugaste "}
                      <b className="bad">{ACTION_NAMES[n.chosen]}</b>
                      {" · era "}
                      <b className="acc">{ACTION_NAMES[n.best]}</b>
                    </span>
                  </span>
                </div>
              ))}
          </div>
        </>
      ) : null}
      <h3 style={{ margin: "20px 0 8px" }}>En total</h3>
      <div className="card flat">
        <div className="kv">
          <span className="kv-k">Manos jugadas</span>
          <span className="kv-v num">{e.play.hands}</span>
        </div>
        <div className="kv">
          <span className="kv-k">Resultado acumulado</span>
          <span className={cx("kv-v num", e.play.net < 0 && "bad")}>
            {e.play.net >= 0 ? "+" : "−"}${money(Math.abs(e.play.net))}
          </span>
        </div>
        <div className="kv">
          <span className="kv-k">Jugadas correctas</span>
          <span className="kv-v num">
            {s(e.play.decisionsOk, e.play.decisions)}
          </span>
        </div>
      </div>
    </div>
  );
}
function TableSheet({ open: a, onClose: e, t }) {
  let s = useStore(),
    n = s.table,
    l = withRules(s.settings.rules),
    i = useMemo(() => {
      let u = -evFor(l).gameEV(),
        d = { 4: -9e-4, 6: -5e-4, 8: -3e-4 }[l.decks] || 0;
      return u + d;
    }, [l.h17, l.das, l.surrender, l.bjPays, l.decks, l.doubleOn]),
    o = (u) => setRules(u),
    c = (u) => {
      setRules(u.rules);
      setTable({ preset: u.id });
    },
    r = TABLE_PRESETS.find((u) =>
      Object.entries(u.rules).every(([d, p]) => l[d] === p),
    );
  return (
    <Sheet open={a} onClose={e} title="Mesa" tall={true}>
      <div className="eyebrow">Tipo de mesa</div>
      <div className="preset-list">
        {TABLE_PRESETS.map((u) => (
          <button
            type="button"
            className={cx("preset", r && r.id === u.id && "on")}
            onClick={() => c(u)}
            key={u.id}
          >
            <b>{u.name}</b>
            <span className="muted small">{u.desc}</span>
          </button>
        ))}
      </div>
      <div className="note-box" style={{ marginTop: 12 }}>
        {"Ventaja de la casa con estrategia básica: "}
        <b>
          {"≈ "}
          {(i * 100).toFixed(1).replace(".", ",")}
          {" %"}
        </b>
        {l.bjPays < 1.5 ? " (el 6:5 solo ya suma 1,4 %)" : ""}
      </div>
      <h3 className="sheet-sub">Reglas</h3>
      <div className="field">
        <span>Mazos</span>
        <Pills
          options={[4, 6, 8].map((u) => ({ value: u, label: String(u) }))}
          value={l.decks}
          onChange={(u) => o({ decks: u })}
        />
      </div>
      <div className="field">
        <span>Corte del zapato</span>
        <Pills
          options={[
            { value: 0, label: "Mezcla cada mano" },
            { value: 0.5, label: "50 %" },
            { value: 0.65, label: "65 %" },
            { value: 0.75, label: "75 %" },
            { value: 0.85, label: "85 %" },
          ]}
          value={l.pen}
          onChange={(u) => o({ pen: u })}
        />
      </div>
      <div className="field">
        <span>Blackjack paga</span>
        <Pills
          options={[
            { value: 1.5, label: "3:2" },
            { value: 1.2, label: "6:5" },
          ]}
          value={l.bjPays}
          onChange={(u) => o({ bjPays: u })}
        />
      </div>
      <Toggle
        id="r-h17"
        label="El crupier pide con 17 blando (H17)"
        checked={l.h17}
        onChange={(u) => o({ h17: u })}
      />
      <Toggle
        id="r-das"
        label="Doblar después de separar"
        checked={l.das}
        onChange={(u) => o({ das: u })}
      />
      <Toggle
        id="r-ls"
        label="Rendición tardía"
        checked={l.surrender}
        onChange={(u) => o({ surrender: u })}
      />
      <Toggle
        id="r-rsa"
        label="Volver a separar ases"
        checked={l.rsa}
        onChange={(u) => o({ rsa: u })}
      />
      <p className="muted tiny">
        Cambiar las reglas o los mazos mezcla el zapato de nuevo.
      </p>
      <h3 className="sheet-sub">Juego</h3>
      <div className="field">
        <span>Otros jugadores</span>
        <Pills
          options={[0, 1, 2, 3, 4].map((u) => ({ value: u, label: String(u) }))}
          value={n.bots}
          onChange={(u) => setTable({ bots: u })}
        />
      </div>
      <div className="field">
        <span>Velocidad</span>
        <Pills
          options={Object.entries(TABLE_SPEEDS).map(([u, d]) => ({
            value: u,
            label: d.label,
          }))}
          value={n.speed}
          onChange={(u) => setTable({ speed: u })}
        />
      </div>
      <div className="field">
        <span>Unidad de apuesta</span>
        <Pills
          options={[5, 10, 25, 50, 100].map((u) => ({
            value: u,
            label: `$${u}`,
          }))}
          value={n.unit}
          onChange={(u) => setTable({ unit: u })}
        />
      </div>
      <div className="field">
        <span>Fichas al recargar</span>
        <Pills
          options={[500, 1000, 5000, 10000].map((u) => ({
            value: u,
            label: `$${u.toLocaleString("es-UY")}`,
          }))}
          value={n.startBankroll}
          onChange={(u) => setTable({ startBankroll: u })}
        />
      </div>
      <div className="field">
        <span>Chequeos de conteo</span>
        <Pills
          options={[
            { value: "off", label: "Nunca" },
            { value: "shoe", label: "Fin del zapato" },
            { value: "sometimes", label: "A veces" },
            { value: "often", label: "Seguido" },
          ]}
          value={n.countCheck}
          onChange={(u) => setTable({ countCheck: u })}
        />
      </div>
      <h3 className="sheet-sub">Ayudas</h3>
      <Toggle
        id="t-coach"
        label="Coach de jugadas"
        sub="Te avisa si una jugada no era la correcta"
        checked={n.coach}
        onChange={(u) => setTable({ coach: u })}
      />
      <Toggle
        id="t-dev"
        label="Jugar con desviaciones"
        sub="El coach usa el Illustrious 18 y el Fab 4 (Hi-Lo)"
        checked={n.deviations}
        onChange={(u) => setTable({ deviations: u })}
      />
      <Toggle
        id="t-bet"
        label="Coach de apuestas"
        sub="Sugiere la apuesta según el conteo real (Hi-Lo)"
        checked={n.betCoach}
        onChange={(u) => setTable({ betCoach: u })}
      />
      <Toggle
        id="t-count"
        label="Mostrar el conteo"
        sub="Apagalo para practicar de verdad"
        checked={n.showCount}
        onChange={(u) => setTable({ showCount: u })}
      />
      <Toggle
        id="t-xray"
        label="Rayos X del zapato"
        sub="Muestra qué cartas quedan (altas y bajas)"
        checked={n.xray}
        onChange={(u) => setTable({ xray: u })}
      />
      <Toggle
        id="t-press"
        label="Modo presión de casino"
        sub="Más velocidad, charla de mesa y chequeos sorpresa"
        checked={n.pressure}
        onChange={(u) => setTable({ pressure: u, speed: u ? "fast" : n.speed })}
      />
      <div className="btns" style={{ marginTop: 20 }}>
        <Button
          kind="secondary"
          onClick={() => {
            t.refill();
            setTable({ bankroll: t.bankroll });
          }}
        >
          Recargar fichas (${n.startBankroll.toLocaleString("es-UY")})
        </Button>
        <Button
          kind="secondary"
          onClick={() => {
            if (!t.running) {
              t.newShoe();
              t.clearTable();
              t.emit();
              e();
            }
          }}
          disabled={t.running}
        >
          Mezclar el zapato ahora
        </Button>
      </div>
    </Sheet>
  );
}
export { PlayTab };
