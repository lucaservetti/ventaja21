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
function Logo({ size: a = 40 }) {
  return (
    <svg width={a} height={a} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#e4e773" />
      <circle
        cx="24"
        cy="24"
        r="16.5"
        fill="none"
        stroke="#15160a"
        strokeWidth="2"
        strokeDasharray="4.2 3.2"
      />
      <text
        x="24"
        y="30.5"
        textAnchor="middle"
        fontFamily="Oswald, 'Arial Narrow', sans-serif"
        fontWeight="600"
        fontSize="18"
        fill="#15160a"
      >
        21
      </text>
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
        Ventaja 21
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
