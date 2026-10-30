import { useStore, withRules } from "../state.js";
import { Icon } from "./icons.jsx";
import { makeCard } from "../engine/cards.js";
import { Badge, IconButton, PlayingCard, RatingGem } from "./components.jsx";
import { parseSpot } from "../engine/trainer.js";
import { useNav } from "../nav.js";

function useRules(a) {
  let e = useStore();
  return withRules({ ...e.settings.rules, ...(a || {}) });
}
// Ficha de Edge 21: dorada, con la pica y el 21 calado.
const LOGO_SPADE =
  "M0,-60 C18,-34 58,-14 58,16 C58,40 34,52 14,40 C10,38 6,34 4,30 C6,48 14,62 26,70 L-26,70 C-14,62 -6,48 -4,30 C-6,34 -10,38 -14,40 C-34,52 -58,40 -58,16 C-58,-14 -18,-34 0,-60 Z";
const LOGO_21 =
  "M255.61 296L225.81 296L225.81 290.07L241.88 265.03Q243.68 262.23 245.20 259.81Q246.72 257.39 247.69 254.70Q248.67 252.01 248.67 248.50Q248.67 244.13 247.26 241.63Q245.86 239.14 242.35 239.14Q239.39 239.14 237.75 240.78Q236.11 242.41 235.49 245.07Q234.86 247.72 234.86 250.76L234.86 252.87L226.52 252.87L226.52 250.68Q226.52 244.99 228.04 240.89Q229.56 236.80 232.95 234.54Q236.34 232.27 241.96 232.27Q249.60 232.27 253.35 236.60Q257.09 240.93 257.09 248.58Q257.09 252.63 256.12 255.67Q255.14 258.72 253.58 261.37Q252.02 264.02 250.15 266.83L235.64 288.98L255.61 288.98M281.58 296L273.24 296L273.24 243.74Q273.16 243.82 271.48 244.21Q269.81 244.60 267.70 244.99Q265.59 245.38 263.96 245.69Q262.32 246 262.24 246L262.24 239.68Q263.57 239.37 265.32 238.83Q267.08 238.28 268.91 237.50Q270.74 236.72 272.42 235.55Q274.10 234.38 275.27 232.82L281.58 232.82";
function Logo({ size: a = 40 }) {
  return (
    <svg width={a} height={a} viewBox="50 50 412 412" aria-hidden="true">
      <circle cx="256" cy="256" r="206" fill="#e9b949" />
      <circle
        cx="256"
        cy="256"
        r="184"
        fill="none"
        stroke="#1d1405"
        strokeWidth="44"
        pathLength="360"
        strokeDasharray="27 62.99999999999999"
        transform="rotate(-58.5 256 256)"
      />
      <circle
        cx="256"
        cy="256"
        r="184"
        fill="none"
        stroke="#1d1405"
        strokeWidth="44"
        pathLength="360"
        strokeDasharray="10.799999999999999 79.2"
        transform="rotate(-95.4 256 256)"
      />
      <circle
        cx="256"
        cy="256"
        r="142"
        fill="none"
        stroke="#1d1405"
        strokeWidth="5"
      />
      <path
        transform="translate(256 256) scale(1.75)"
        fill="#1d1405"
        d={LOGO_SPADE}
      />
      <path fill="#e9b949" d={LOGO_21} />
    </svg>
  );
}
function RatingBadge({ showDelta: a = false }) {
  let e = useStore(),
    t = e.rating.value,
    s = e.rating.history,
    n = Date.now() - 7 * 86400000,
    l = 0;
  if (a && s.length) {
    let i = e.train.sessions.find((o) => o.t >= n);
    if (i) {
      l = t - i.before;
    }
  }
  return (
    <Badge icon={<RatingGem />} label={`Puntaje ${t}`} tone="rating">
      <span className="num">{t}</span>
      {a && l ? (
        <small className={l < 0 ? "neg" : ""}>
          {l > 0 ? "▲" : "▼"}
          {Math.abs(l)}
        </small>
      ) : null}
    </Badge>
  );
}
function SettingsButton() {
  let a = useNav();
  return (
    <IconButton
      icon="gear"
      label="Ajustes"
      onClick={() => a.openSheet("settings")}
    />
  );
}
// Encabezado de cada pestaña: título, botones a la derecha y una línea opcional debajo.
function PageHeader({ title, sub, actions }) {
  return (
    <header className="ph">
      <div className="ph-row">
        <h1 className="ph-title">{title}</h1>
        {actions ? <div className="ph-actions">{actions}</div> : null}
      </div>
      {sub ? <p className="ph-sub">{sub}</p> : null}
    </header>
  );
}
function BrandBar({ right: a }) {
  return (
    <div className="topbar">
      <div className="brand grow">
        <span className="brand-mark">
          <Logo size={30} />
        </span>
        Edge 21
      </div>
      {a}
    </div>
  );
}
const upText = (a) => (a === "T" ? "10" : a === "A" ? "As" : a);
function spotTitle(a) {
  let e = parseSpot(a);
  return e.kind === "pair"
    ? `${e.g === "T" ? "10,10" : e.g === "A" ? "A,A" : e.g + "," + e.g} vs ${upText(e.up)}`
    : `${e.kind === "soft" ? "Blando" : "Duro"} ${e.total} vs ${upText(e.up)}`;
}
function MiniCards({ ranks: a = ["K", "8"], suits: e = ["s", "s"] }) {
  return (
    <span className="mini-cards">
      <span className="card-row">
        <PlayingCard card={makeCard(a[0], e[0])} size="xs" />
        <PlayingCard card={makeCard(a[1], e[1])} size="xs" />
      </span>
    </span>
  );
}
function TopBar({
  onClose: a,
  closeIcon: e = "close",
  title: t,
  sub: s,
  right: n,
  left: l,
}) {
  return (
    <div className="topbar">
      {a ? (
        <IconButton
          icon={e}
          onClick={a}
          label={e === "back" ? "Volver" : "Cerrar"}
          className="sq"
        />
      ) : null}
      {l}
      <div className="grow center" style={{ minWidth: 0 }}>
        {t ? (
          <div style={{ fontWeight: 700, fontSize: 19, lineHeight: 1.2 }}>
            {t}
          </div>
        ) : null}
        {s ? (
          <div className="muted small num" style={{ fontWeight: 600 }}>
            {s}
          </div>
        ) : null}
      </div>
      {n || <span style={{ width: 44 }} />}
    </div>
  );
}
function InfoDot({ onClick: a, label: e = "Más información" }) {
  return (
    <button type="button" className="info-dot" onClick={a} aria-label={e}>
      <Icon name="info" size={22} />
    </button>
  );
}
function pct(a) {
  return `${Math.round(a * 100)} %`;
}
export {
  LOGO_21,
  LOGO_SPADE,
  BrandBar,
  PageHeader,
  InfoDot,
  Logo,
  MiniCards,
  RatingBadge,
  SettingsButton,
  TopBar,
  pct,
  spotTitle,
  useRules,
};
