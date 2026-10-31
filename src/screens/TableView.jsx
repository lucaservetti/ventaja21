// La mesa del simulador. La usan la pestaña Jugar y los desafíos de zapato completo
// (nivel 10 de la ruta de conteo y examen final).
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Icon } from "../ui/icons.jsx";
import { handTotalText, handValue, isBlackjack } from "../engine/cards.js";
import { ACTION_NAMES, ACTION_EN } from "../engine/strategy.js";
import { sfx, startAmbience, stopAmbience, vibrate } from "../sound.js";
import {
  Button,
  CHIP_VALUES,
  Chip,
  ChipStack,
  Keypad,
  Modal,
  PlayingCard,
  Sheet,
  cx,
  formatKeypad,
  parseKeypad,
} from "../ui/components.jsx";
import { floorTC, fmtSigned } from "../engine/systems.js";
import { money } from "../engine/table.js";
import { useStore } from "../state.js";
import { useNav } from "../nav.js";
import { demoTake } from "../platform.js";
import { Tray } from "./drills.jsx";

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
const ACT_CLS = { H: "hit", S: "stand", D: "dbl", P: "split", R: "surr" };

function useTable(table) {
  const subscribe = useMemo(() => (fn) => table.subscribe(fn), [table]);
  useSyncExternalStore(
    subscribe,
    () => table.version,
    () => table.version,
  );
}

function decksText(decks) {
  return (Math.round(decks * 2) / 2)
    .toFixed(1)
    .replace(".0", "")
    .replace(".", ",");
}

function TableView({
  table,
  active = true,
  top,
  showCount = true,
  onToggleCount,
  countLabel,
  xray = false,
  betHint = false,
  unitBets = false,
  onCheck,
  onShoeEnd,
  onRefill,
  refillLabel = "Recargar fichas",
}) {
  useTable(table);
  const nav = useNav();
  // Repartir (en la web de prueba hay un límite de manos por día; ver platform.js).
  const dealOk = (pre) => {
    if (!demoTake("jugar")) {
      nav.push("enApp", { feature: "jugar" });
      return;
    }
    if (pre && !pre()) return;
    table.deal();
  };
  const [check, setCheck] = useState(null); // { value, result, final }
  const [whyOpen, setWhyOpen] = useState(false);
  const [chatter, setChatter] = useState(null);
  const sys = table.sys;
  const rules = table.rules;
  const settings = useStore().settings;

  // Ambiente de casino: solo mientras la mesa está a la vista.
  const ambient = active && settings.sound && settings.ambience;
  useEffect(() => {
    if (ambient) startAmbience();
    else stopAmbience();
    return stopAmbience;
  }, [ambient]);

  // Sonido de cada carta que cae y de la mezcla.
  const cardCount =
    table.dealer.cards.length +
    table.hands.reduce((n, h) => n + h.cards.length, 0) +
    table.botSeats.reduce(
      (n, s) => n + s.hands.reduce((m, h) => m + h.cards.length, 0),
      0,
    );
  const prevCards = useRef(0);
  useEffect(() => {
    if (cardCount > prevCards.current && active) sfx.card();
    prevCards.current = cardCount;
  }, [cardCount]);
  useEffect(() => {
    if (table.phase === "shuffle" && active) sfx.shuffle();
  }, [table.phase]);

  // Chequeo de conteo (después de algunas manos y al final del zapato).
  useEffect(() => {
    if (table.phase === "settle" && table.countCheckDue && !check) {
      const timer = setTimeout(
        () =>
          setCheck({
            value: "",
            result: null,
            final: table.countCheckDue === "final",
          }),
        700,
      );
      return () => clearTimeout(timer);
    }
    if (
      table.phase === "settle" &&
      table.shoeEnded &&
      !table.countCheckDue &&
      !check
    ) {
      table.shoeEnded = false;
      if (onShoeEnd) onShoeEnd({ ...table.shoeStats });
    }
  }, [table.phase, table.countCheckDue, table.version]);

  useEffect(() => {
    if (!table.feedback) return;
    if (table.feedback.ok) sfx.good();
    else {
      sfx.bad();
      vibrate(30);
    }
    setWhyOpen(false);
  }, [table.feedback && table.feedback.id]);

  // Modo presión: charla de mesa cada tanto.
  useEffect(() => {
    if (!table.opts.pressure || !active) return;
    const timer = setInterval(() => {
      if (table.phase !== "bet") {
        setChatter(table.randomChatter());
        setTimeout(() => setChatter(null), 2600);
      }
    }, 7000);
    return () => clearInterval(timer);
  }, [table.opts.pressure, active]);

  const submitCheck = () => {
    const value = parseKeypad(check.value);
    if (value === null) return;
    const result = table.submitCountCheck(value);
    if (result.ok) sfx.good();
    else sfx.bad();
    setCheck({ ...check, result });
    if (onCheck) onCheck(result);
  };
  const closeCheck = () => {
    const final = check && check.result && check.result.final;
    setCheck(null);
    if (final || table.shoeEnded) {
      table.shoeEnded = false;
      if (onShoeEnd) onShoeEnd({ ...table.shoeStats });
    }
  };

  const allowed = table.allowed();
  const reshuffling =
    (table.shoe.needsShuffle || table.pendingShuffle) && rules.pen > 0;
  const suggested = betHint ? table.suggestedBet : null;
  const tcNow = floorTC(table.tc);
  const dealerBadge = table.dealer.cards.length
    ? table.result && table.result.dealerBJ
      ? "Blackjack"
      : table.result && table.result.dealerBust
        ? `Se pasó · ${handValue(table.dealer.cards).hard}`
        : table.dealer.hidden
          ? handTotalText([table.dealer.cards[0]])
          : handTotalText(table.dealer.cards)
    : null;
  const comp = xray ? table.composition() : null;

  // Un solo lugar para los avisos: el del coach manda; si no hay, el último aviso de la mesa; si no, la charla.
  const toast = table.toasts[table.toasts.length - 1];
  const fb = table.feedback;
  let message = null;
  if (fb) {
    message = (
      <button
        type="button"
        className={cx("sim-msg coach-line", fb.ok ? "ok" : "bad")}
        onClick={() => fb.note && setWhyOpen(true)}
      >
        <span className="fb-icon">
          <Icon name={fb.ok ? "check" : "x"} size={14} stroke={3} />
        </span>
        <span className="msg-text">
          <b>
            {fb.ok
              ? `Bien: ${ACTION_NAMES[fb.best].toLowerCase()}`
              : fb.title ||
                `Lo correcto era ${ACTION_NAMES[fb.best].toLowerCase()}`}
          </b>
          {fb.note ? (
            <span className="msg-more">
              {fb.ok ? "por qué" : "ver por qué"}
            </span>
          ) : null}
        </span>
      </button>
    );
  } else if (toast) {
    message = (
      <div
        className={cx("sim-msg", `msg-${toast.kind}`)}
        key={toast.id}
        role="status"
      >
        <span className="msg-text">{toast.msg}</span>
      </div>
    );
  } else if (chatter) {
    message = (
      <div className="sim-msg msg-chatter">
        <span className="msg-text">“{chatter}”</span>
      </div>
    );
  }

  return (
    <div className="sim">
      {typeof top === "function" ? top(table) : top}
      <div className="sim-hud">
        <div className="hud-side">
          <Tray
            shoe={rules.decks}
            cards={table.shoe.dealt}
            small={true}
            height={30}
          />
          <span className="tiny muted num">
            ≈ {decksText(table.decksRemaining)} mazos
          </span>
        </div>
        <div className="hud-center">
          {rules.pen <= 0 ? (
            <span className="count-pill rng">Se mezcla en cada mano</span>
          ) : showCount === null ? null : (
            <button
              type="button"
              className={cx("count-pill", !showCount && "hidden-count")}
              onClick={onToggleCount}
              disabled={!onToggleCount}
              aria-label={showCount ? "Ocultar conteo" : "Mostrar conteo"}
            >
              {showCount ? (
                <>
                  <span className="num">CC {fmtSigned(table.rcSys)}</span>
                  {sys.balanced ? (
                    <span className="num">
                      {" "}
                      · CR{" "}
                      {table.tcSys === null ? "—" : fmtSigned(table.tcSys, 1)}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <Icon name="eyeoff" size={16} />{" "}
                  {countLabel || "Conteo oculto"}
                </>
              )}
            </button>
          )}
          {comp ? <XRay comp={comp} /> : null}
          {sys.id !== "hilo" && showCount ? (
            <span className="tiny muted">{sys.short || sys.name}</span>
          ) : null}
        </div>
        <div className="hud-side right">
          <span className="shoe-ic">
            <Icon name="shoe" size={26} />
          </span>
          <span className="tiny muted num">{table.shoe.remaining} cartas</span>
        </div>
      </div>

      <div
        className={cx(
          "felt",
          table.phase === "shuffle" && "shuffling",
          table.botSeats.length > 0 && "has-bots",
        )}
      >
        <div className="seat dealer-seat">
          <span className="eyebrow">Crupier</span>
          <div className="card-row overlap cr-md">
            {table.dealer.cards.map((card) => (
              <PlayingCard
                card={card}
                size="md"
                deal={true}
                down={!card.faceUp}
                key={card.id}
              />
            ))}
          </div>
          {dealerBadge !== null ? (
            <span
              className={cx(
                "total-badge num",
                table.result && table.result.dealerBust && "bad",
              )}
            >
              {dealerBadge}
            </span>
          ) : (
            <span className="total-badge ghost">·</span>
          )}
        </div>
        {table.botSeats.length ? (
          <div className="bots">
            {table.botSeats.map((seat) => (
              <div className="bot" key={seat.name}>
                <div className="bot-hands">
                  {seat.hands.map((hand) => (
                    <div
                      className={cx(
                        "bot-hand",
                        hand.result && `r-${hand.result}`,
                      )}
                      key={hand.id}
                    >
                      <div className="card-row overlap cr-sm">
                        {hand.cards.map((card) => (
                          <PlayingCard
                            card={card}
                            size="xs"
                            deal={true}
                            key={card.id}
                          />
                        ))}
                      </div>
                      {hand.cards.length ? (
                        <span className="tiny num bot-total">
                          {hand.surrendered ? "R" : handTotalText(hand.cards)}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
                <span className="tiny muted">{seat.name}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className={cx("player-hands", table.hands.length > 1 && "multi")}>
          {table.hands.length ? (
            table.hands.map((hand, i) => {
              const isActive = table.phase === "player" && i === table.active;
              const v = handValue(hand.cards);
              const label = hand.result
                ? RESULT_LABELS[hand.result]
                : !hand.cards.length
                  ? ""
                  : v.bust
                    ? `Te pasaste · ${v.hard}`
                    : isBlackjack(hand.cards, hand.fromSplit)
                      ? "Blackjack"
                      : handTotalText(hand.cards);
              return (
                <div
                  className={cx(
                    "p-hand",
                    isActive && "active",
                    hand.result && `r-${hand.result}`,
                  )}
                  key={hand.id}
                >
                  <div
                    className={cx(
                      "card-row overlap",
                      table.hands.length > 1 ? "cr-sm" : "cr-md",
                    )}
                  >
                    {hand.cards.map((card) => (
                      <PlayingCard
                        card={card}
                        size={table.hands.length > 2 ? "sm" : "md"}
                        deal={true}
                        key={card.id}
                      />
                    ))}
                  </div>
                  <div className="p-meta">
                    <span
                      className={cx(
                        "total-badge num",
                        hand.result &&
                          ["win", "bj"].includes(hand.result) &&
                          "good",
                        ((hand.result &&
                          ["lose", "bust", "surrender"].includes(
                            hand.result,
                          )) ||
                          (!hand.result && v.bust)) &&
                          "bad",
                      )}
                    >
                      {label}
                    </span>
                    <span className="p-bet">
                      <ChipStack amount={hand.bet} size={24} />
                      <span className="tiny num">{table.fmt(hand.bet)}</span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bet-spot">
              {table.bet ? (
                <ChipStack amount={table.bet} size={42} />
              ) : (
                <span className="bet-ring">APOSTÁ</span>
              )}
              {table.bet ? (
                <b className="num bet-amt">{table.fmt(table.bet)}</b>
              ) : null}
            </div>
          )}
        </div>
        {table.insuranceBet ? (
          <div className="ins-chip tiny">
            Seguro {table.fmt(table.insuranceBet)}
          </div>
        ) : null}
      </div>

      <div className="sim-msgs" aria-live="polite">
        {message}
      </div>

      <div className="controls">
        {table.phase === "settle" && table.countCheckDue ? (
          <div className="phase-msg muted">Chequeo de conteo…</div>
        ) : unitBets && (table.phase === "bet" || table.phase === "settle") ? (
          <UnitBets table={table} />
        ) : table.phase === "bet" ? (
          <>
            <div className="bet-hint tiny">
              {suggested ? (
                reshuffling ? (
                  <>
                    Se mezcla antes de esta mano: apuesta sugerida{" "}
                    <b>{table.fmt(suggested)}</b> (1 u.)
                  </>
                ) : (
                  <>
                    Con conteo real {fmtSigned(tcNow)}: apuesta sugerida{" "}
                    <b>{table.fmt(suggested)}</b> ({suggested / table.opts.unit}{" "}
                    u.)
                  </>
                )
              ) : reshuffling ? (
                "Se mezcla el zapato antes de esta mano."
              ) : (
                "\xA0"
              )}
            </div>
            <div className="chip-rack">
              {(table.opts.chips || CHIP_VALUES).map((value) => (
                <Chip
                  value={value}
                  size={52}
                  onClick={(v) => table.addChip(v)}
                  disabled={value > table.bankroll - table.bet}
                  key={value}
                />
              ))}
            </div>
            <div className="bet-row">
              <Button
                kind="secondary"
                small={true}
                onClick={() => table.undoChip()}
                disabled={!table.bet}
              >
                Deshacer
              </Button>
              <Button
                kind="secondary"
                small={true}
                onClick={() => table.clearBet()}
                disabled={!table.bet}
              >
                Borrar
              </Button>
              {table.bankroll < table.minBet ? (
                <Button
                  small={true}
                  onClick={() => (onRefill ? onRefill() : table.refill())}
                  className="grow"
                >
                  {refillLabel}
                </Button>
              ) : (
                <Button
                  small={true}
                  onClick={() => {
                    vibrate(10);
                    dealOk();
                  }}
                  disabled={!table.bet}
                  className="grow deal-btn"
                >
                  Repartir
                </Button>
              )}
            </div>
          </>
        ) : table.phase === "settle" ? (
          <div className="settle-row">
            <Button
              kind="secondary"
              small={true}
              onClick={() => table.newBet()}
            >
              Nueva apuesta
            </Button>
            <Button
              small={true}
              onClick={() => dealOk(() => table.rebet(1))}
              disabled={table.lastBet > table.bankroll}
            >
              Repetir {table.fmt(table.lastBet)}
            </Button>
            <Button
              kind="secondary"
              small={true}
              onClick={() => dealOk(() => table.rebet(2))}
              disabled={table.lastBet * 2 > table.bankroll}
            >
              ×2
            </Button>
          </div>
        ) : table.phase === "player" ? (
          <div className="sim-actions">
            {table.decisionDeadline ? (
              <DecisionTimer
                deadline={table.decisionDeadline}
                total={table.opts.decisionTime * 1000}
              />
            ) : null}
            <SimAction action="P" allowed={allowed} table={table} />
            <SimAction action="D" allowed={allowed} table={table} />
            <SimAction action="H" allowed={allowed} table={table} />
            <SimAction action="S" allowed={allowed} table={table} />
            {rules.surrender ? (
              <SimAction action="R" allowed={allowed} table={table} />
            ) : null}
          </div>
        ) : table.phase === "insurance" ? (
          <div className="ins-panel fade-up">
            <b>
              {isBlackjack(table.hands[0].cards)
                ? "¿Pago parejo? (even money)"
                : "¿Seguro? (insurance)"}
            </b>
            <p className="muted small">
              {isBlackjack(table.hands[0].cards)
                ? "Tenés blackjack y el crupier muestra As. Pago parejo: cobrás 1 a 1 ya, tenga o no blackjack."
                : `El crupier muestra As. El seguro cuesta ${table.fmt(table.hands[0].bet / 2)} y paga 2 a 1 si tiene blackjack.`}
            </p>
            <div className="ins-btns">
              <Button
                kind="secondary"
                small={true}
                className="grow"
                onClick={() => table.insure(true)}
                disabled={table.hands[0].bet / 2 > table.bankroll}
              >
                {isBlackjack(table.hands[0].cards)
                  ? "Sí, cobrar"
                  : "Sí, seguro"}
              </Button>
              <Button
                small={true}
                className="grow"
                onClick={() => table.insure(false)}
              >
                No, gracias
              </Button>
            </div>
          </div>
        ) : (
          <div className="phase-msg muted">
            {PHASE_LABELS[table.phase] || ""}
          </div>
        )}
      </div>

      <Modal open={!!check}>
        {check ? (
          check.result ? (
            <div className="center">
              <span
                className={cx("res-icon big", check.result.ok ? "ok" : "bad")}
              >
                <Icon
                  name={check.result.ok ? "check" : "x"}
                  size={34}
                  stroke={3}
                />
              </span>
              <h2 style={{ fontSize: 28, marginTop: 12 }}>
                {check.result.ok ? "¡Exacto!" : "No era ese"}
              </h2>
              <p className="muted" style={{ marginTop: 8 }}>
                El conteo corrido es{" "}
                <b className="acc num">{fmtSigned(check.result.correct)}</b>
                {check.result.ok ? null : (
                  <>
                    {" "}
                    y pusiste{" "}
                    <b className="bad num">
                      {fmtSigned(parseKeypad(check.value))}
                    </b>
                  </>
                )}
                .
              </p>
              {sys.balanced && rules.pen > 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  Quedan ≈ {decksText(table.decksRemaining)} mazos: conteo real{" "}
                  {fmtSigned(table.tcSys, 1)}.
                </p>
              ) : null}
              <Button onClick={closeCheck} style={{ marginTop: 18 }}>
                Seguir
              </Button>
            </div>
          ) : (
            <div>
              <div className="eyebrow acc center">
                {check.final ? "Fin del zapato" : "Chequeo de conteo"}
              </div>
              <h2 className="center" style={{ fontSize: 24, marginTop: 6 }}>
                ¿Cuál es el conteo corrido?
              </h2>
              <p className="center muted small" style={{ marginTop: 4 }}>
                {sys.name}
                {sys.balanced
                  ? " · running count"
                  : ` · arrancó en ${fmtSigned(sys.irc(rules.decks))}`}
              </p>
              <div className="keypad-display">{formatKeypad(check.value)}</div>
              <Keypad
                value={check.value}
                onChange={(value) => setCheck({ ...check, value })}
                onSubmit={submitCheck}
                allowHalf={sys.id === "halves"}
                submitLabel="Comprobar"
              />
              {table.opts.countCheck === "exam" ? null : (
                <Button
                  kind="ghost"
                  onClick={() => {
                    table.skipCountCheck();
                    closeCheck();
                  }}
                >
                  Saltar
                </Button>
              )}
            </div>
          )
        ) : null}
      </Modal>

      <Sheet
        open={whyOpen && !!fb}
        onClose={() => setWhyOpen(false)}
        title="Por qué"
      >
        {fb ? (
          <>
            <div className="res-moves" style={{ marginTop: 0 }}>
              <div>
                <div className="eyebrow">Tu jugada</div>
                <div className={cx("res-move", fb.ok ? "good" : "bad")}>
                  {ACTION_NAMES[fb.chosen]}
                </div>
              </div>
              <div>
                <div className="eyebrow">La correcta</div>
                <div className="res-move acc">{ACTION_NAMES[fb.best]}</div>
              </div>
            </div>
            <p style={{ marginTop: 14, lineHeight: 1.5 }}>{fb.note}</p>
          </>
        ) : null}
      </Sheet>
    </div>
  );
}

// Apuesta en unidades (1, 2, 4, 6 u 8), la escala de la lección 20. La usan los desafíos de zapato completo.
const UNIT_STEPS = [1, 2, 4, 6, 8];
function UnitBets({ table }) {
  const unit = table.opts.unit;
  const settled = table.phase === "settle";
  const current = settled ? 0 : table.bet;
  return (
    <>
      <div className="bet-hint tiny">
        {settled
          ? "Elegí la apuesta de la próxima mano según el conteo real."
          : `Tu unidad es ${table.fmt(unit)}. Elegí cuántas unidades apostar.`}
      </div>
      <div className="unit-bets">
        {UNIT_STEPS.map((u) => (
          <button
            type="button"
            className={cx("unit-bet", current === u * unit && "on")}
            onClick={() => {
              vibrate(6);
              sfx.chip();
              table.setBet(u * unit);
            }}
            disabled={u * unit > table.bankroll}
            key={u}
          >
            <b className="num">{u}</b>
            <span className="num">{table.fmt(u * unit)}</span>
          </button>
        ))}
      </div>
      <div className="bet-row">
        {table.bankroll < unit ? (
          <Button small={true} onClick={() => table.refill()} className="grow">
            Recargar fichas
          </Button>
        ) : (
          <Button
            small={true}
            onClick={() => {
              vibrate(10);
              table.deal();
            }}
            disabled={settled || !table.bet}
            className="grow deal-btn"
          >
            {settled
              ? "Elegí tu apuesta"
              : `Repartir · ${table.fmt(table.bet)}`}
          </Button>
        )}
      </div>
    </>
  );
}

// Modo casino: la barra que se vacía mientras decidís.
function DecisionTimer({ deadline, total }) {
  const left = Math.max(0, deadline - Date.now());
  // A 2 segundos del final, un toque de aviso.
  useEffect(() => {
    const timer = setTimeout(
      () => {
        sfx.tap();
        vibrate(15);
      },
      Math.max(0, deadline - Date.now() - 2000),
    );
    return () => clearTimeout(timer);
  }, [deadline]);
  return (
    <div className="decide-timer" aria-hidden="true">
      <i
        key={deadline}
        style={{
          width: `${(left / total) * 100}%`,
          animationDuration: `${left}ms`,
        }}
      />
    </div>
  );
}

function SimAction({ action, allowed, table }) {
  return (
    <button
      type="button"
      className={cx("sim-act", `act-${action}`)}
      disabled={!allowed[action]}
      onClick={() => {
        vibrate(8);
        table.act(action);
      }}
    >
      <span className={cx("act-letter", `c-${ACT_CLS[action]}`)}>{action}</span>
      <span className="act-label">{ACTION_NAMES[action].toUpperCase()}</span>
      <span className="act-en">{ACTION_EN[action]}</span>
    </button>
  );
}

function XRay({ comp }) {
  const total = comp.total || 1;
  const extra = comp.high - comp.low;
  return (
    <div className="xray" title="Cartas que quedan en el zapato">
      <div className="xray-bar">
        <span
          className="xr-lo"
          style={{ width: `${(comp.low / total) * 100}%` }}
        />
        <span
          className="xr-mid"
          style={{ width: `${(comp.mid / total) * 100}%` }}
        />
        <span
          className="xr-hi"
          style={{ width: `${(comp.high / total) * 100}%` }}
        />
      </div>
      <div className="xray-lbl tiny">
        <span className="bad">BAJAS</span>
        <span className="muted">
          RAYOS X{" "}
          {extra > 0
            ? `· +${extra} altas`
            : extra < 0
              ? `· ${-extra} bajas de más`
              : ""}
        </span>
        <span className="good">ALTAS</span>
      </div>
    </div>
  );
}

export { TableView, decksText, RESULT_LABELS };
