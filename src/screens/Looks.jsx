// Paños y mazos (Premium): el color de la mesa, el dorso de las cartas y el mazo de 4 colores.
// Se aplican en <html> (data-felt, data-back, data-deck) solo con Premium.
import { setSettings, useStore } from "../state.js";
import { PlayingCard, Toggle, cx } from "../ui/components.jsx";
import { TopBar } from "../ui/common.jsx";
import { useNav } from "../nav.js";

const FELTS = [
  { id: "", label: "Verde", c: "#0f3a26" },
  { id: "azul", label: "Azul", c: "#123b5e" },
  { id: "bordo", label: "Bordó", c: "#5b1622" },
  { id: "violeta", label: "Violeta", c: "#3a2160" },
  { id: "negro", label: "Negro", c: "#262626" },
];
const BACKS = [
  { id: "", label: "Verde", c: "#0d261a", bg: "#fafaf6" },
  { id: "rojo", label: "Rojo", c: "#8e1b24", bg: "#fafaf6" },
  { id: "azul", label: "Azul", c: "#163a6b", bg: "#fafaf6" },
  { id: "oro", label: "Negro y oro", c: "#17140c", bg: "#d9b45a" },
];
const PREVIEW = [
  { r: "A", s: "s" },
  { r: "10", s: "h" },
  { r: "7", s: "d" },
  { r: "K", s: "c" },
];

function Swatch({ on, label, onClick, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={label}
      className={cx("look-sw", on && "on")}
      onClick={onClick}
    >
      {children}
      <span className="look-sw-label">{label}</span>
    </button>
  );
}

function Looks() {
  const st = useStore();
  const nav = useNav();
  const s = st.settings;
  const felt = s.felt || "";
  const back = s.cardBack || "";
  const four = !!s.fourColor;
  return (
    <div className="looks fade-up">
      <TopBar
        onClose={() => nav.pop()}
        closeIcon="back"
        title="Paños y mazos"
      />
      <div
        className="felt look-preview"
        tabIndex={0}
        role="img"
        aria-label="Vista previa del paño y las cartas"
        data-felt={felt || undefined}
        data-back={back || undefined}
        data-deck={four ? "4" : undefined}
      >
        <div className="look-cards">
          <PlayingCard card={{ r: "Q", s: "s" }} down={true} />
          {PREVIEW.map((c, i) => (
            <PlayingCard card={c} key={i} />
          ))}
        </div>
      </div>
      <h3 className="sheet-sub">Paño</h3>
      <div className="look-row" role="radiogroup" aria-label="Paño">
        {FELTS.map((f) => (
          <Swatch
            key={f.id || "verde"}
            on={felt === f.id}
            label={f.label}
            onClick={() => setSettings({ felt: f.id })}
          >
            <span className="look-felt" style={{ background: f.c }} />
          </Swatch>
        ))}
      </div>
      <h3 className="sheet-sub">Dorso de las cartas</h3>
      <div
        className="look-row"
        role="radiogroup"
        aria-label="Dorso de las cartas"
      >
        {BACKS.map((b) => (
          <Swatch
            key={b.id || "verde"}
            on={back === b.id}
            label={b.label}
            onClick={() => setSettings({ cardBack: b.id })}
          >
            <span
              className="look-back"
              style={{
                background: `repeating-linear-gradient(135deg, ${b.c} 0 3px, ${b.bg} 3px 7px)`,
                borderColor: b.bg,
              }}
            />
          </Swatch>
        ))}
      </div>
      <h3 className="sheet-sub">Mazo</h3>
      <Toggle
        id="look-four"
        label="Mazo de 4 colores"
        sub="Picas negras, corazones rojos, diamantes azules y tréboles verdes. Ayuda a no confundir cartas cuando van rápido."
        checked={four}
        onChange={(v) => setSettings({ fourColor: v })}
      />
      <p className="muted small" style={{ marginTop: 14 }}>
        Se usa en la mesa, el modo casino y los ejercicios con cartas.
      </p>
    </div>
  );
}

export { Looks };
