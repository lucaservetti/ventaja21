// Simulador de banca: con tu forma de apostar y las reglas de tu mesa, cuánto ganás por hora en promedio,
// cuánto se mueve el resultado y qué tan probable es quedarte sin plata.
// Modelo: el conteo real se mide jugando zapatos simulados (Hi-Lo); cada +1 de conteo real suma ≈ 0,5 %
// de ventaja y cada mano tiene una varianza de ≈ 1,3 apuestas al cuadrado.
import { useMemo, useState } from "react";
import { Pills, cx } from "../ui/components.jsx";
import { evFor } from "../engine/ev.js";
import { betUnits } from "../engine/systems.js";
import { money } from "../engine/table.js";
import { TopBar, useRules } from "../ui/common.jsx";
import { useNav } from "../nav.js";

const RAMPS = [
  { id: "app", label: "1 a 8", units: (tc) => betUnits(tc) },
  {
    id: "soft",
    label: "1 a 4",
    units: (tc) => (tc <= 1 ? 1 : Math.min(4, tc)),
  },
  {
    id: "wide",
    label: "1 a 12",
    units: (tc) =>
      tc <= 1 ? 1 : tc === 2 ? 2 : tc === 3 ? 4 : tc === 4 ? 8 : 12,
  },
  { id: "flat", label: "Siempre la mínima", units: () => 1 },
];
const HANDS_PER_HOUR = [200, 140, 110, 85, 70];
const VAR_PER_HAND = 1.32;
const PATHS = 500;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Conteos reales al empezar cada mano, jugando zapatos con estas reglas.
function trueCounts(decks, pen, seats) {
  const rand = rng(21);
  const out = [];
  if (pen <= 0) return [0];
  const perRound = 2.7 * (seats + 1);
  for (let shoe = 0; shoe < 300; shoe++) {
    const cards = [];
    for (let d = 0; d < decks * 4; d++)
      cards.push(1, 1, 1, 1, 1, 0, 0, 0, -1, -1, -1, -1, -1);
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    const cut = Math.floor(cards.length * pen);
    let pos = 0;
    let rc = 0;
    let carry = 0;
    while (pos < cut) {
      out.push(rc / ((cards.length - pos) / 52));
      carry += perRound;
      const n = Math.floor(carry);
      carry -= n;
      for (let k = 0; k < n && pos < cards.length; k++) rc += cards[pos++];
    }
  }
  return out;
}

// Promedio y varianza por mano (en unidades) para una escala de apuestas.
function perHand(tcs, ramp, base) {
  let mean = 0;
  let sq = 0;
  let bet = 0;
  for (const tc of tcs) {
    const b = ramp.units(Math.floor(tc));
    mean += b * (base + 0.005 * tc);
    sq += VAR_PER_HAND * b * b;
    bet += b;
  }
  return {
    mean: mean / tcs.length,
    variance: sq / tcs.length,
    bet: bet / tcs.length,
  };
}

function simulate({ bank, unit, hours, hph, h }) {
  const rand = rng(7);
  const mu = h.mean * unit * hph;
  const sd = Math.sqrt(h.variance * hph) * unit;
  const paths = [];
  let ruined = 0;
  for (let p = 0; p < PATHS; p++) {
    const path = new Float64Array(hours + 1);
    let v = 0;
    let broke = false;
    for (let t = 1; t <= hours; t++) {
      if (!broke) {
        const u1 = rand() || 1e-9;
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rand());
        v += mu + sd * z;
        if (v <= -bank) {
          v = -bank;
          broke = true;
        }
      }
      path[t] = v;
    }
    if (broke) ruined++;
    paths.push(path);
  }
  const bands = [];
  const col = new Float64Array(PATHS);
  for (let t = 0; t <= hours; t++) {
    for (let p = 0; p < PATHS; p++) col[p] = paths[p][t];
    col.sort();
    bands.push({
      t,
      lo: col[Math.floor(PATHS * 0.1)],
      mid: col[Math.floor(PATHS * 0.5)],
      hi: col[Math.floor(PATHS * 0.9)],
    });
  }
  return { bands, ruin: ruined / PATHS, mu, sd };
}

function sm(v) {
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}$${money(Math.round(Math.abs(v)))}`;
}
function pctText(v, digits = 1) {
  return `${(v * 100).toFixed(digits).replace(".", ",")} %`;
}

function FanChart({ bands, bank }) {
  const [hover, setHover] = useState(null);
  const W = 340;
  const H = 190;
  const pad = { l: 8, r: 8, t: 12, b: 22 };
  const last = bands[bands.length - 1];
  const showRuin = bands.some((b) => b.lo <= -bank * 0.98);
  let lo = Math.min(0, ...bands.map((b) => b.lo));
  let hi = Math.max(0, ...bands.map((b) => b.hi));
  if (hi - lo < 1) hi = lo + 1;
  const span = hi - lo;
  lo -= span * 0.06;
  hi += span * 0.06;
  const x = (t) => pad.l + (t / last.t) * (W - pad.l - pad.r);
  const y = (v) => pad.t + ((hi - v) / (hi - lo)) * (H - pad.t - pad.b);
  const area =
    bands.map((b, i) => `${i ? "L" : "M"}${x(b.t)},${y(b.hi)}`).join("") +
    bands
      .slice()
      .reverse()
      .map((b) => `L${x(b.t)},${y(b.lo)}`)
      .join("") +
    "Z";
  const line = bands
    .map((b, i) => `${i ? "L" : "M"}${x(b.t)},${y(b.mid)}`)
    .join("");
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const t = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * last.t);
    setHover(Math.max(0, Math.min(last.t, t)));
  };
  const hb = hover !== null ? bands[hover] : null;
  return (
    <div className="fan">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Resultado después de ${last.t} horas: la mitad de las veces ${sm(last.mid)}; 8 de cada 10 veces entre ${sm(last.lo)} y ${sm(last.hi)}.`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <line
          x1={pad.l}
          x2={W - pad.r}
          y1={y(0)}
          y2={y(0)}
          className="fan-zero"
        />
        {showRuin ? (
          <>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(-bank)}
              y2={y(-bank)}
              className="fan-ruin"
            />
            <text
              x={W - pad.r}
              y={y(-bank) - 5}
              className="fan-lbl"
              textAnchor="end"
            >
              sin plata
            </text>
          </>
        ) : null}
        <path d={area} className="fan-band" />
        <path d={line} className="fan-mid" />
        <text x={pad.l} y={H - 6} className="fan-lbl">
          0 h
        </text>
        <text x={W - pad.r} y={H - 6} className="fan-lbl" textAnchor="end">
          {last.t} h
        </text>
        {hb ? (
          <>
            <line
              x1={x(hb.t)}
              x2={x(hb.t)}
              y1={pad.t}
              y2={H - pad.b}
              className="fan-cross"
            />
            <circle cx={x(hb.t)} cy={y(hb.mid)} r="4.5" className="fan-dot" />
          </>
        ) : null}
      </svg>
      <div className="fan-tip small" aria-live="polite">
        {hb ? (
          <>
            <b>Hora {hb.t}</b> · mitad de las veces {sm(hb.mid)} · 8 de cada 10
            entre {sm(hb.lo)} y {sm(hb.hi)}
          </>
        ) : (
          <span className="muted">
            Tocá el gráfico para ver cada hora. La franja es donde terminás 8 de
            cada 10 veces; la línea, la mitad de las veces.
          </span>
        )}
      </div>
    </div>
  );
}

function BankrollSim({ unit: unit0 = 10, bank: bank0 = 2000 }) {
  const nav = useNav();
  const rules = useRules();
  const [bank, setBank] = useState(bank0);
  const [unit, setUnit] = useState(unit0);
  const [rampId, setRampId] = useState("app");
  const [seats, setSeats] = useState(0);
  const [hours, setHours] = useState(100);
  // Ventaja de la casa con estrategia básica (igual que en Jugar → Mesa).
  const base = useMemo(
    () =>
      evFor(rules).gameEV() -
      ({ 4: -9e-4, 6: -5e-4, 8: -3e-4 }[rules.decks] || 0),
    [rules],
  );
  const tcs = useMemo(
    () => trueCounts(rules.decks, rules.pen, seats + 1),
    [rules.decks, rules.pen, seats],
  );
  const ramp = RAMPS.find((r) => r.id === rampId);
  const h = useMemo(() => perHand(tcs, ramp, base), [tcs, ramp, base]);
  const hph = HANDS_PER_HOUR[seats];
  const sim = useMemo(
    () => simulate({ bank, unit, hours, hph, h }),
    [bank, unit, hours, hph, h],
  );
  const last = sim.bands[sim.bands.length - 1];
  const muHand = h.mean * unit;
  const varHand = h.variance * unit * unit;
  const ror = muHand > 0 ? Math.exp((-2 * muHand * bank) / varHand) : 1;
  const bank5 = muHand > 0 ? (Math.log(20) * varHand) / (2 * muHand) : null;
  const n0Hours = muHand > 0 ? varHand / (muHand * muHand) / hph : null;
  const edge = h.mean / h.bet;
  return (
    <div className="bankroll fade-up">
      <TopBar
        onClose={() => nav.pop()}
        closeIcon="back"
        title="Simulador de banca"
        sub={`${rules.decks} mazos · corte ${Math.round(rules.pen * 100)} % · Hi-Lo`}
      />
      <div className="field">
        <span>Tu banca (toda la plata para jugar)</span>
        <Pills
          options={[500, 1000, 2000, 5000, 10000, 20000].map((v) => ({
            value: v,
            label: `$${money(v)}`,
          }))}
          value={bank}
          onChange={setBank}
        />
      </div>
      <div className="field">
        <span>Apuesta mínima (tu unidad)</span>
        <Pills
          options={[5, 10, 25, 50, 100].map((v) => ({
            value: v,
            label: `$${v}`,
          }))}
          value={unit}
          onChange={setUnit}
        />
      </div>
      <div className="field">
        <span>Escala de apuestas (unidades según el conteo)</span>
        <Pills
          options={RAMPS.map((r) => ({ value: r.id, label: r.label }))}
          value={rampId}
          onChange={setRampId}
        />
        <p className="muted small" style={{ marginTop: 8 }}>
          {rampId === "flat"
            ? "Apostás siempre la mínima, sin importar el conteo."
            : `Conteo real +1 o menos: 1 u. · ${[2, 3, 4, 5].map((tc) => `+${tc}: ${ramp.units(tc)} u.`).join(" · ")}`}
        </p>
      </div>
      <div className="field">
        <span>Otros jugadores en la mesa</span>
        <Pills
          options={[0, 1, 2, 3, 4].map((n) => ({
            value: n,
            label: String(n),
          }))}
          value={seats}
          onChange={setSeats}
        />
      </div>
      <div className="field">
        <span>Horas de juego</span>
        <Pills
          options={[10, 25, 50, 100, 250].map((v) => ({
            value: v,
            label: `${v} h`,
          }))}
          value={hours}
          onChange={setHours}
        />
      </div>

      <div className="tiles br-tiles">
        <div className="tile">
          <div className={cx("tile-v num", edge > 0 ? "t-good" : "t-bad")}>
            {pctText(edge, 2)}
          </div>
          <div className="tile-l">tu ventaja</div>
        </div>
        <div className="tile">
          <div className={cx("tile-v num", sim.mu > 0 ? "t-good" : "t-bad")}>
            {sm(sim.mu)}
          </div>
          <div className="tile-l">por hora, en promedio</div>
        </div>
        <div className="tile">
          <div
            className={cx(
              "tile-v num",
              ror < 0.05 ? "t-good" : ror < 0.2 ? "t-mid" : "t-bad",
            )}
          >
            {ror >= 0.995 ? "≈ 100 %" : pctText(ror, ror < 0.1 ? 1 : 0)}
          </div>
          <div className="tile-l">riesgo de quebrar</div>
        </div>
      </div>

      <div className="card br-chart">
        <div className="eyebrow">Tu resultado en {hours} horas</div>
        <FanChart bands={sim.bands} bank={bank} />
      </div>

      <div className="card br-read">
        <p>
          Después de {hours} horas, la mitad de las veces terminás{" "}
          <b className={last.mid >= 0 ? "good" : "bad"}>{sm(last.mid)}</b>. 8 de
          cada 10 veces, entre <b>{sm(last.lo)}</b> y <b>{sm(last.hi)}</b>.
        </p>
        <p>
          Cada hora el resultado se mueve ± <b>${money(Math.round(sim.sd))}</b>:
          {sim.sd > Math.abs(sim.mu) * 5
            ? " muchísimo más que lo que ganás en promedio. Por eso hay días y semanas malas aunque juegues perfecto."
            : " más que lo que ganás en promedio."}
        </p>
        {muHand > 0 ? (
          <>
            <p>
              En estas {hours} horas te quedaste sin plata{" "}
              <b>{pctText(sim.ruin, 0)}</b> de las veces. Para bajar el riesgo
              total a 5 %, necesitás una banca de unos{" "}
              <b>${money(Math.ceil(bank5 / 100) * 100)}</b>.
            </p>
            <p className="muted small">
              La ventaja le gana a la suerte después de unas{" "}
              {Math.round(n0Hours).toLocaleString("es-UY")} horas de juego.
            </p>
          </>
        ) : (
          <p>
            Con esta escala <b>no tenés ventaja</b>: la casa gana a la larga y,
            jugando suficiente, cualquier banca se termina. Probá una escala más
            amplia (la ventaja sale de apostar más con el conteo alto).
          </p>
        )}
        {rules.pen <= 0 ? (
          <p className="muted small">
            Tu mesa mezcla cada mano: el conteo no sirve. Cambialo en Jugar →
            Mesa.
          </p>
        ) : null}
      </div>
      <p className="muted tiny" style={{ marginTop: 12 }}>
        Es una estimación: cuenta cada +1 de conteo real como 0,5 % más de
        ventaja, una varianza por mano de 1,3 y unas {hph} manos por hora. No
        incluye desviaciones ni seguro.
      </p>
    </div>
  );
}

export { BankrollSim };
