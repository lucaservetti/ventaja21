// Pestaña Jugar: el simulador libre, con la mesa y las ayudas que elegís en "Mesa".
import { useEffect, useMemo, useRef, useState } from "react";
import {
  TABLE_PRESETS,
  describeRules,
  getState,
  markActive,
  recordHandResult,
  setRules,
  setSettings,
  setState,
  setTable,
  useStore,
  withRules,
} from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { ACTION_NAMES } from "../engine/strategy.js";
import { sfx } from "../sound.js";
import {
  Button,
  IconButton,
  Modal,
  Pills,
  Sheet,
  StrategyChart,
  Toggle,
  cx,
} from "../ui/components.jsx";
import { evFor } from "../engine/ev.js";
import { systemFor } from "../engine/systems.js";
import { TABLE_SPEEDS, Table, money } from "../engine/table.js";
import { TableView } from "./TableView.jsx";
import { useNav } from "../nav.js";

let tableInstance = null;
function tableOptions(st) {
  const t = st.table;
  return {
    rules: withRules(st.settings.rules),
    system: st.settings.system,
    bots: t.bots,
    unit: t.unit,
    startBankroll: t.startBankroll,
    speed: t.speed,
    coach: t.coach,
    betCoach: t.betCoach,
    deviations: t.deviations,
    countCheck: t.countCheck,
    pressure: t.pressure,
    quietResults: true,
  };
}
function getTable() {
  if (!tableInstance) {
    const st = getState();
    tableInstance = new Table({
      ...tableOptions(st),
      bankroll: st.table.bankroll,
    });
  }
  return tableInstance;
}

function PlayTab({ active }) {
  const st = useStore();
  const nav = useNav();
  const table = getTable();
  const [sheet, setSheet] = useState(null); // chart | stats | table
  const [shoeSummary, setShoeSummary] = useState(null);
  const lastSession = useRef(null);
  const sys = systemFor(st.settings.system);
  const optionsKey = JSON.stringify(tableOptions(st));

  // Las opciones de "Mesa" y de Ajustes viven en el estado guardado; acá se pasan a la mesa.
  useEffect(() => {
    const opts = tableOptions(st);
    const rulesChanged =
      JSON.stringify(withRules(table.rules)) !== JSON.stringify(opts.rules);
    table.configure({ ...opts, reshuffle: rulesChanged && !table.running });
  }, [optionsKey]);

  // Al terminar cada mano se guardan la banca y las estadísticas acumuladas.
  useEffect(() => {
    table.onRoundEnd = (result, t) => {
      const s = t.session;
      const prev = lastSession.current || {
        hands: 0,
        net: 0,
        decisions: 0,
        decisionsOk: 0,
        bets: 0,
        betsOk: 0,
      };
      setState((state) =>
        markActive({
          ...state,
          table: { ...state.table, bankroll: t.bankroll },
          play: {
            ...state.play,
            hands: state.play.hands + (s.hands - prev.hands),
            net: state.play.net + (s.net - prev.net),
            decisions: state.play.decisions + (s.decisions - prev.decisions),
            decisionsOk:
              state.play.decisionsOk + (s.decisionsOk - prev.decisionsOk),
            bets: state.play.bets + (s.bets - prev.bets),
            betsOk: state.play.betsOk + (s.betsOk - prev.betsOk),
            shoes: (state.play.shoes || 0) + (s.shoes - (prev.shoes || 0)),
          },
        }),
      );
      // Las jugadas que fallaste en la mesa pasan a tus errores de Entrenar.
      const seenSeq =
        (lastSession.current && lastSession.current.mistakeSeq) || 0;
      for (const m of s.mistakes)
        if (m.seq > seenSeq && m.hand)
          recordHandResult({ ...m.hand, src: "mesa" }, false);
      lastSession.current = { ...s };
      if (result.net > 0) sfx.win();
    };
  }, []);

  const onCheck = (result) =>
    setState((state) => ({
      ...state,
      play: {
        ...state.play,
        checks: state.play.checks + 1,
        checksOk: state.play.checksOk + (result.ok ? 1 : 0),
      },
    }));

  const net = table.session.net;
  const top = (
    <div className="sim-top">
      <IconButton
        icon="crown"
        label="Modo casino real"
        onClick={() => nav.push("casino")}
        className="sq small-ib casino-ib"
        size={20}
      />
      <div className="sim-stat">
        <span className="eyebrow">Fichas</span>
        <b className="num">${money(table.bankroll)}</b>
      </div>
      <div className="sim-stat">
        <span className="eyebrow">Sesión</span>
        <b className={cx("num", net > 0 ? "good" : net < 0 ? "bad" : "")}>
          {net > 0 ? "+" : net < 0 ? "−" : ""}${money(Math.abs(net))}
        </b>
      </div>
      <span className="grow" />
      <IconButton
        icon="grid"
        label="Tabla de estrategia"
        onClick={() => setSheet("chart")}
        className="sq small-ib"
        size={20}
      />
      <IconButton
        icon="stats"
        label="Estadísticas de la sesión"
        onClick={() => setSheet("stats")}
        className="sq small-ib"
        size={20}
      />
      <button
        type="button"
        className="table-btn"
        onClick={() => setSheet("table")}
        aria-label="Mesa y ayudas"
      >
        <Icon name="gear" size={18} />
        <span className="table-btn-text">Mesa</span>
      </button>
    </div>
  );

  const rules = table.rules;
  return (
    <>
      <TableView
        table={table}
        active={active}
        top={top}
        showCount={st.table.showCount}
        onToggleCount={() => setTable({ showCount: !st.table.showCount })}
        xray={st.table.xray}
        betHint={st.table.betCoach && sys.id === "hilo" && rules.pen > 0}
        onCheck={onCheck}
        onShoeEnd={(stats) => setShoeSummary(stats)}
      />
      <ShoeSummary stats={shoeSummary} onClose={() => setShoeSummary(null)} />
      <Sheet
        open={sheet === "chart"}
        onClose={() => setSheet(null)}
        title="Estrategia básica"
        tall={true}
      >
        <StrategyChart rules={rules} />
        <div className="tags" style={{ marginTop: 14 }}>
          {describeRules(rules).map((r) => (
            <span className="chip-tag" key={r}>
              {r}
            </span>
          ))}
        </div>
      </Sheet>
      <Sheet
        open={sheet === "stats"}
        onClose={() => setSheet(null)}
        title="Esta sesión"
        tall={true}
      >
        <SessionStats table={table} st={st} />
      </Sheet>
      <TableSheet
        open={sheet === "table"}
        onClose={() => setSheet(null)}
        table={table}
      />
    </>
  );
}

function ShoeSummary({ stats, onClose }) {
  return (
    <Modal open={!!stats}>
      {stats ? (
        <div>
          <div className="eyebrow acc center">Fin del zapato</div>
          <h2 className="center" style={{ fontSize: 26, marginTop: 6 }}>
            Resumen del zapato
          </h2>
          <div className="tiles two" style={{ marginTop: 16 }}>
            <div className="tile">
              <div className="tile-v num">{stats.hands}</div>
              <div className="tile-l">manos</div>
            </div>
            <div className="tile">
              <div
                className={cx(
                  "tile-v num",
                  stats.net > 0 ? "good" : stats.net < 0 ? "bad" : "",
                )}
              >
                {stats.net >= 0 ? "+" : "−"}${money(Math.abs(stats.net))}
              </div>
              <div className="tile-l">resultado</div>
            </div>
            <div className="tile">
              <div className="tile-v num">
                {stats.decisions
                  ? Math.round((stats.decisionsOk / stats.decisions) * 100) +
                    "%"
                  : "—"}
              </div>
              <div className="tile-l">jugadas correctas</div>
            </div>
            <div className="tile">
              <div className="tile-v num">
                {stats.checks ? `${stats.checksOk}/${stats.checks}` : "—"}
              </div>
              <div className="tile-l">chequeos de conteo</div>
            </div>
          </div>
          <p className="muted small center" style={{ marginTop: 12 }}>
            El resultado de un zapato es casi pura suerte. Lo que importa es
            jugar bien y apostar según el conteo.
          </p>
          <Button onClick={onClose} style={{ marginTop: 16 }}>
            Mezclar y seguir
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}

function SessionStats({ table, st }) {
  const s = table.session;
  const pctOf = (ok, n) => (n ? `${Math.round((ok / n) * 100)} %` : "—");
  return (
    <div>
      <div className="tiles">
        <div className="tile">
          <div className="tile-v num">{s.hands}</div>
          <div className="tile-l">manos</div>
        </div>
        <div className="tile">
          <div
            className={cx(
              "tile-v num",
              s.net > 0 ? "good" : s.net < 0 ? "bad" : "",
            )}
          >
            {s.net >= 0 ? "+" : "−"}
            {money(Math.abs(s.net))}
          </div>
          <div className="tile-l">resultado ($)</div>
        </div>
        <div className="tile">
          <div className="tile-v num">{s.bj}</div>
          <div className="tile-l">blackjacks</div>
        </div>
      </div>
      <div className="card flat" style={{ marginTop: 14 }}>
        <div className="kv">
          <span className="kv-k">Ganadas / perdidas / empates</span>
          <span className="kv-v num">
            {s.won} / {s.lost} / {s.push}
          </span>
        </div>
        <div className="kv">
          <span className="kv-k">Jugadas correctas</span>
          <span className="kv-v num">
            {pctOf(s.decisionsOk, s.decisions)}{" "}
            <span className="muted tiny">
              ({s.decisionsOk}/{s.decisions})
            </span>
          </span>
        </div>
        <div className="kv">
          <span className="kv-k">Apuestas según el conteo</span>
          <span className="kv-v num">{pctOf(s.betsOk, s.bets)}</span>
        </div>
        <div className="kv">
          <span className="kv-k">Chequeos de conteo</span>
          <span className="kv-v num">
            {s.checks ? `${s.checksOk}/${s.checks}` : "—"}
          </span>
        </div>
        <div className="kv">
          <span className="kv-k">Seguro bien decidido</span>
          <span className="kv-v num">
            {s.insurance ? `${s.insuranceOk}/${s.insurance}` : "—"}
          </span>
        </div>
        <div className="kv">
          <span className="kv-k">Zapatos terminados</span>
          <span className="kv-v num">{s.shoes}</span>
        </div>
        {table.opts.pressure ? (
          <div className="kv">
            <span className="kv-k">Decisiones lentas (más de 5 s)</span>
            <span className="kv-v num">{s.slow}</span>
          </div>
        ) : null}
      </div>
      {s.mistakes.length ? (
        <>
          <h3 style={{ margin: "20px 0 8px" }}>Errores de la sesión</h3>
          <div className="list">
            {s.mistakes
              .slice(-8)
              .reverse()
              .map((m, i) => (
                <div className="list-item" key={i}>
                  <span className="li-text">
                    <span className="li-title" style={{ fontSize: 16 }}>
                      {m.spot}
                    </span>
                    <span className="li-sub" style={{ display: "block" }}>
                      Jugaste <b className="bad">{ACTION_NAMES[m.chosen]}</b> ·
                      era <b className="acc">{ACTION_NAMES[m.best]}</b>
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
          <span className="kv-v num">{st.play.hands}</span>
        </div>
        <div className="kv">
          <span className="kv-k">Resultado acumulado</span>
          <span className={cx("kv-v num", st.play.net < 0 && "bad")}>
            {st.play.net >= 0 ? "+" : "−"}${money(Math.abs(st.play.net))}
          </span>
        </div>
        <div className="kv">
          <span className="kv-k">Jugadas correctas</span>
          <span className="kv-v num">
            {pctOf(st.play.decisionsOk, st.play.decisions)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TableSheet({ open, onClose, table }) {
  const st = useStore();
  const nav = useNav();
  const t = st.table;
  const rules = withRules(st.settings.rules);
  const houseEdge = useMemo(() => {
    const ev = -evFor(rules).gameEV();
    const deckAdj = { 4: -9e-4, 6: -5e-4, 8: -3e-4 }[rules.decks] || 0;
    return ev + deckAdj;
  }, [
    rules.h17,
    rules.das,
    rules.surrender,
    rules.bjPays,
    rules.decks,
    rules.doubleOn,
  ]);
  const preset = TABLE_PRESETS.find((p) =>
    Object.entries(p.rules).every(([k, v]) => rules[k] === v),
  );
  return (
    <Sheet open={open} onClose={onClose} title="Mesa" tall={true}>
      <button
        type="button"
        className="card list-item casino-entry"
        onClick={() => {
          onClose();
          nav.push("casino");
        }}
      >
        <span className="li-icon">
          <Icon name="crown" />
        </span>
        <span className="li-text">
          <span className="li-title">Modo casino real</span>
          <span className="li-sub" style={{ display: "block" }}>
            Tu plata, límites de mesa, tiempo para decidir y vigilancia
          </span>
        </span>
        <Icon name="chev" className="li-chev" />
      </button>
      <div className="eyebrow">Tipo de mesa</div>
      <div className="preset-list">
        {TABLE_PRESETS.map((p) => (
          <button
            type="button"
            className={cx("preset", preset && preset.id === p.id && "on")}
            onClick={() => {
              setRules(p.rules);
              setTable({ preset: p.id });
            }}
            key={p.id}
          >
            <b>{p.name}</b>
            <span className="muted small">{p.desc}</span>
          </button>
        ))}
      </div>
      <div className="note-box" style={{ marginTop: 12 }}>
        Ventaja de la casa con estrategia básica:{" "}
        <b>≈ {(houseEdge * 100).toFixed(1).replace(".", ",")} %</b>
        {rules.bjPays < 1.5 ? " (el 6:5 solo ya suma 1,4 %)" : ""}
      </div>
      <h3 className="sheet-sub">Reglas</h3>
      <div className="field">
        <span>Mazos</span>
        <Pills
          options={[4, 6, 8].map((n) => ({ value: n, label: String(n) }))}
          value={rules.decks}
          onChange={(n) => setRules({ decks: n })}
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
          value={rules.pen}
          onChange={(pen) => setRules({ pen })}
        />
      </div>
      <div className="field">
        <span>Blackjack paga</span>
        <Pills
          options={[
            { value: 1.5, label: "3:2" },
            { value: 1.2, label: "6:5" },
          ]}
          value={rules.bjPays}
          onChange={(bjPays) => setRules({ bjPays })}
        />
      </div>
      <Toggle
        id="r-h17"
        label="El crupier pide con 17 blando (H17)"
        checked={rules.h17}
        onChange={(h17) => setRules({ h17 })}
      />
      <Toggle
        id="r-das"
        label="Doblar después de separar"
        checked={rules.das}
        onChange={(das) => setRules({ das })}
      />
      <Toggle
        id="r-ls"
        label="Rendición tardía (surrender)"
        checked={rules.surrender}
        onChange={(surrender) => setRules({ surrender })}
      />
      <Toggle
        id="r-rsa"
        label="Volver a separar ases"
        checked={rules.rsa}
        onChange={(rsa) => setRules({ rsa })}
      />
      <p className="muted tiny">
        Cambiar las reglas o los mazos mezcla el zapato de nuevo.
      </p>
      <h3 className="sheet-sub">Juego</h3>
      <div className="field">
        <span>Otros jugadores</span>
        <Pills
          options={[0, 1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
          value={t.bots}
          onChange={(bots) => setTable({ bots })}
        />
      </div>
      <div className="field">
        <span>Velocidad</span>
        <Pills
          options={Object.entries(TABLE_SPEEDS).map(([value, s]) => ({
            value,
            label: s.label,
          }))}
          value={t.speed}
          onChange={(speed) => setTable({ speed })}
        />
      </div>
      <div className="field">
        <span>Unidad de apuesta</span>
        <Pills
          options={[5, 10, 25, 50, 100].map((n) => ({
            value: n,
            label: `$${n}`,
          }))}
          value={t.unit}
          onChange={(unit) => setTable({ unit })}
        />
      </div>
      <div className="field">
        <span>Fichas al recargar</span>
        <Pills
          options={[500, 1000, 5000, 10000].map((n) => ({
            value: n,
            label: `$${n.toLocaleString("es-UY")}`,
          }))}
          value={t.startBankroll}
          onChange={(startBankroll) => setTable({ startBankroll })}
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
          value={t.countCheck}
          onChange={(countCheck) => setTable({ countCheck })}
        />
      </div>
      <Toggle
        id="t-sound"
        label="Sonido"
        checked={st.settings.sound}
        onChange={(sound) => setSettings({ sound })}
      />
      <h3 className="sheet-sub">Ayudas</h3>
      <Toggle
        id="t-coach"
        label="Coach de jugadas"
        sub="Te avisa si una jugada no era la correcta"
        checked={t.coach}
        onChange={(coach) => setTable({ coach })}
      />
      <Toggle
        id="t-dev"
        label="Jugar con desviaciones"
        sub="El coach usa el Illustrious 18 y el Fab 4 (Hi-Lo)"
        checked={t.deviations}
        onChange={(deviations) => setTable({ deviations })}
      />
      <Toggle
        id="t-bet"
        label="Coach de apuestas"
        sub="Sugiere la apuesta según el conteo real (Hi-Lo)"
        checked={t.betCoach}
        onChange={(betCoach) => setTable({ betCoach })}
      />
      <Toggle
        id="t-count"
        label="Mostrar el conteo"
        sub="Apagalo para practicar de verdad"
        checked={t.showCount}
        onChange={(showCount) => setTable({ showCount })}
      />
      <Toggle
        id="t-xray"
        label="Rayos X del zapato"
        sub="Muestra qué cartas quedan (altas y bajas)"
        checked={t.xray}
        onChange={(xray) => setTable({ xray })}
      />
      <Toggle
        id="t-press"
        label="Modo presión de casino"
        sub="Más velocidad, charla de mesa y chequeos sorpresa"
        checked={t.pressure}
        onChange={(pressure) =>
          setTable({ pressure, speed: pressure ? "fast" : t.speed })
        }
      />
      <div className="btns" style={{ marginTop: 20 }}>
        <Button
          kind="secondary"
          onClick={() => {
            table.refill();
            setTable({ bankroll: table.bankroll });
          }}
        >
          Recargar fichas (${t.startBankroll.toLocaleString("es-UY")})
        </Button>
        <Button
          kind="secondary"
          onClick={() => {
            if (table.running) return;
            table.newShoe();
            table.clearTable();
            table.emit();
            onClose();
          }}
          disabled={table.running}
        >
          Mezclar el zapato ahora
        </Button>
      </div>
    </Sheet>
  );
}

export { PlayTab };
