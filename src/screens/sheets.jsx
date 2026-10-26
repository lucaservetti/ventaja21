import { useState } from "react";
import {
  TABLE_PRESETS,
  canPersist,
  describeRules,
  resetAll,
  setRules,
  setSettings,
  useStore,
  withRules,
} from "../state.js";
import { Icon } from "../ui/icons.jsx";
import {
  Button,
  Pills,
  Sheet,
  StrategyChart,
  Toggle,
  cx,
} from "../ui/components.jsx";
import { SYSTEMS, SYSTEM_IDS } from "../engine/systems.js";
import { HiLoValues } from "../lessons/visuals.jsx";
import { SystemValues } from "./CountTab.jsx";
import { useNav } from "../nav.js";

const VERSION = __APP_VERSION__;
function isStandalone() {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  } catch {
    return false;
  }
}
function SettingsSheet({ open: a, onClose: e }) {
  let t = useStore(),
    s = useNav(),
    n = t.settings,
    l = withRules(n.rules),
    [i, o] = useState(false),
    y = TABLE_PRESETS.find((m) =>
      Object.entries(m.rules).every(([b, S]) => l[b] === S),
    );
  return (
    <Sheet open={a} onClose={e} title="Ajustes" tall={true}>
      <h3 className="sheet-sub" style={{ marginTop: 4 }}>
        Meta diaria
      </h3>
      <button
        type="button"
        className="list-item setting-link"
        onClick={() => s.openSheet("goal")}
      >
        <span className="li-text">
          <span className="li-title" style={{ fontSize: 17 }}>
            {t.dailyGoal.minutes} minutos por día
          </span>
          <span className="li-sub" style={{ display: "block" }}>
            Cambiala y mirá tu racha
          </span>
        </span>
        <Icon name="chev" className="li-chev" />
      </button>
      <h3 className="sheet-sub">Conteo</h3>
      <button
        type="button"
        className="list-item setting-link"
        onClick={() => s.openSheet("system")}
      >
        <span className="li-text">
          <span className="li-title" style={{ fontSize: 17 }}>
            Sistema de conteo
          </span>
          <span className="li-sub" style={{ display: "block" }}>
            {SYSTEMS[n.system].name}
            {" · "}
            {SYSTEMS[n.system].level}
          </span>
        </span>
        <Icon name="chev" className="li-chev" />
      </button>
      <h3 className="sheet-sub">Reglas de tu mesa</h3>
      <p className="muted small" style={{ marginBottom: 10 }}>
        La estrategia, las tandas y el simulador se adaptan a estas reglas.
      </p>
      <div className="preset-list">
        {TABLE_PRESETS.filter((m) => m.id !== "rng").map((m) => (
          <button
            type="button"
            className={cx("preset", y && y.id === m.id && "on")}
            onClick={() => setRules(m.rules)}
            key={m.id}
          >
            <b>{m.name}</b>
            <span className="muted small">{m.desc}</span>
          </button>
        ))}
      </div>
      <div className="field">
        <span>Mazos</span>
        <Pills
          options={[4, 6, 8].map((m) => ({ value: m, label: String(m) }))}
          value={l.decks}
          onChange={(m) => setRules({ decks: m })}
        />
      </div>
      <Toggle
        id="s-h17"
        label="El crupier pide con 17 blando (H17)"
        checked={l.h17}
        onChange={(m) => setRules({ h17: m })}
      />
      <Toggle
        id="s-das"
        label="Doblar después de separar"
        checked={l.das}
        onChange={(m) => setRules({ das: m })}
      />
      <Toggle
        id="s-ls"
        label="Rendición tardía"
        checked={l.surrender}
        onChange={(m) => setRules({ surrender: m })}
      />
      <div className="tags" style={{ marginTop: 6 }}>
        {describeRules(l).map((m) => (
          <span className="chip-tag" key={m}>
            {m}
          </span>
        ))}
      </div>
      <h3 className="sheet-sub">Preferencias</h3>
      <Toggle
        id="s-sound"
        label="Sonido"
        checked={n.sound}
        onChange={(m) => setSettings({ sound: m })}
      />
      <Toggle
        id="s-hap"
        label="Vibración"
        sub="En Android. iPhone no permite vibrar desde la web."
        checked={n.haptics}
        onChange={(m) => setSettings({ haptics: m })}
      />
      <Toggle
        id="s-cost"
        label="Mostrar cuánto cuesta cada error"
        checked={n.showCost}
        onChange={(m) => setSettings({ showCost: m })}
      />
      <Toggle
        id="s-unlock"
        label="Desbloquear todas las lecciones"
        sub="Para saltar a cualquier tema"
        checked={n.unlockAll}
        onChange={(m) => setSettings({ unlockAll: m })}
      />
      <h3 className="sheet-sub">Tu progreso</h3>
      {canPersist() ? null : (
        <p className="note-box" style={{ marginBottom: 10 }}>
          Este navegador no deja guardar datos: tu progreso se pierde al cerrar.
          Instalá la app o usá otro navegador.
        </p>
      )}
      <button
        type="button"
        className="list-item setting-link"
        onClick={() => {
          e();
          s.push("backup");
        }}
      >
        <span className="li-text">
          <span className="li-title" style={{ fontSize: 17 }}>
            Respaldo y otro celular
          </span>
          <span className="li-sub" style={{ display: "block" }}>
            Guardá tu progreso o pasalo a otro celular
          </span>
        </span>
        <Icon name="chev" className="li-chev" />
      </button>
      <div className="btns" style={{ marginTop: 14 }}>
        <Button
          kind="secondary"
          onClick={() => {
            e();
            s.push("placement", { retake: true });
          }}
        >
          Repetir el test de nivel
        </Button>
        {i ? (
          <div className="note-box">
            <b>¿Seguro?</b>
            {
              " Se borran lecciones, puntaje, estadísticas y ajustes. No se puede deshacer."
            }
            <div className="btn-row" style={{ marginTop: 12 }}>
              <Button small={true} kind="secondary" onClick={() => o(false)}>
                Cancelar
              </Button>
              <Button
                small={true}
                kind="danger"
                onClick={() => {
                  resetAll();
                  e();
                }}
              >
                Borrar todo
              </Button>
            </div>
          </div>
        ) : (
          <Button kind="danger" icon="trash" onClick={() => o(true)}>
            Borrar todo el progreso
          </Button>
        )}
      </div>
      {isStandalone() ? null : (
        <>
          <h3 className="sheet-sub">Instalar en el celular</h3>
          <div className="note-box">
            <p>
              <b>iPhone:</b>
              {" abrí la app en Safari, tocá Compartir y elegí "}
              <b>Agregar a inicio</b>.
            </p>
            <p style={{ marginTop: 6 }}>
              <b>Android:</b>
              {" en Chrome, abrí el menú ⋮ y tocá "}
              <b>Instalar app</b>.
            </p>
            <p style={{ marginTop: 6 }}>
              Instalada desde tu enlace de GitHub, funciona sin conexión.
            </p>
          </div>
        </>
      )}
      <h3 className="sheet-sub">Juego responsable</h3>
      <p className="muted small">
        Ventaja 21 es para aprender. Contar cartas mentalmente es legal, pero
        los casinos pueden pedirte que no juegues, y usar el celular en la mesa
        está prohibido. Jugá solo plata que no necesitás. Si el juego deja de
        ser entretenimiento, frená y pedí ayuda.
      </p>
      <p className="dim tiny" style={{ marginTop: 18 }}>
        {"Ventaja 21 · versión "}
        {VERSION}
      </p>
    </Sheet>
  );
}
function SystemSheet({ open: a, onClose: e }) {
  let s = useStore().settings.system,
    n = SYSTEMS[s];
  return (
    <Sheet open={a} onClose={e} title="Sistema de conteo" tall={true}>
      <p className="muted" style={{ marginBottom: 14 }}>
        Define lo que enseñan los ejercicios y lo que se cuenta en la mesa. Para
        empezar, Hi-Lo.
      </p>
      <div className="sys-list">
        {SYSTEM_IDS.map((l) => {
          let i = SYSTEMS[l],
            o = l === s;
          return (
            <button
              type="button"
              className={cx("sys-item", o && "on")}
              onClick={() => setSettings({ system: l })}
              key={l}
            >
              <span className="li-text">
                <span className="row" style={{ gap: 10 }}>
                  <b style={{ fontSize: 19 }}>{i.name}</b>
                  <span className="eyebrow" style={{ fontSize: 11 }}>
                    {i.level}
                  </span>
                </span>
                <span
                  className="muted small"
                  style={{ display: "block", marginTop: 4 }}
                >
                  {i.blurb}
                </span>
              </span>
              {o ? (
                <Icon name="check" size={24} stroke={3} className="acc" />
              ) : null}
            </button>
          );
        })}
      </div>
      <h3 className="sheet-sub">
        {"Valores de "}
        {n.name}
      </h3>
      {s === "hilo" ? <HiLoValues /> : <SystemValues sys={n} />}
      {s !== "hilo" ? (
        <p className="note-box" style={{ marginTop: 12 }}>
          {
            "Las desviaciones, el coach de apuestas y las lecciones usan Hi-Lo, que es el estándar. Con "
          }
          {n.short || n.name}
          {
            " practicás los valores, el conteo corrido y los chequeos en la mesa."
          }
          {n.balanced
            ? ""
            : " En la mesa, KO arranca en 4 − 4 × mazos (con 6 mazos, −20)."}
        </p>
      ) : null}
    </Sheet>
  );
}
function ChartSheet({ open: a, onClose: e }) {
  let t = useStore(),
    s = useNav(),
    n = withRules(t.settings.rules);
  return (
    <Sheet open={a} onClose={e} title="Estrategia básica" tall={true}>
      <StrategyChart rules={n} />
      <div className="tags" style={{ marginTop: 14 }}>
        {describeRules(n).map((l) => (
          <span className="chip-tag" key={l}>
            {l}
          </span>
        ))}
      </div>
      <Button
        kind="secondary"
        onClick={() => s.openSheet("settings")}
        style={{ marginTop: 16 }}
      >
        Cambiar las reglas
      </Button>
    </Sheet>
  );
}
export { ChartSheet, SettingsSheet, SystemSheet };
