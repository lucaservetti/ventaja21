// Celebración de un logro grande (subir de rango, terminar una sección, aprobar un nivel de conteo):
// fichas y palos que caen, sonido, y un botón para compartirlo. Ver src/celebraciones.js.
import { useEffect, useMemo, useRef } from "react";
import { Button } from "../ui/components.jsx";
import { ShareButton } from "../ui/ShareButton.jsx";
import { cerrarCelebracion } from "../celebraciones.js";
import { getState } from "../state.js";
import { sfx, vibrate } from "../sound.js";

const PALOS = ["♠", "♥", "♦", "♣"];
const COLORES = ["#e9b949", "#d23b3b", "#2f9e5b", "#ece6d6", "#7fb6ff"];

function Particulas() {
  // Fijas por celebración (no cambian si la pantalla se vuelve a dibujar).
  const ps = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: Math.round(Math.random() * 100),
        delay: (Math.random() * 0.9).toFixed(2),
        dur: (2.2 + Math.random() * 1.6).toFixed(2),
        rot: Math.round(Math.random() * 540 - 270),
        chip: i % 3 !== 0,
        color: COLORES[i % COLORES.length],
        palo: PALOS[i % 4],
        size: Math.round(14 + Math.random() * 14),
      })),
    [],
  );
  return (
    <div className="cele-fx" aria-hidden="true">
      {ps.map((p, i) =>
        p.chip ? (
          <i
            key={i}
            className="cele-chip"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              "--c": p.color,
              "--r": `${p.rot}deg`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ) : (
          <i
            key={i}
            className={
              p.palo === "♥" || p.palo === "♦" ? "cele-suit red" : "cele-suit"
            }
            style={{
              left: `${p.left}%`,
              fontSize: p.size + 4,
              "--r": `${p.rot}deg`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          >
            {p.palo}
          </i>
        ),
      )}
    </div>
  );
}

function Celebracion({ item }) {
  const boton = useRef(null);
  useEffect(() => {
    if (getState().settings.sound) sfx.win();
    vibrate([18, 60, 18]);
    const t = setTimeout(
      () =>
        boton.current &&
        boton.current.querySelector("button") &&
        boton.current.querySelector("button").focus(),
      350,
    );
    const esc = (e) => e.key === "Escape" && cerrarCelebracion();
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", esc);
    };
  }, [item]);
  const compartir = () => ({
    title: "Edge 21",
    text:
      item.tipo === "rango"
        ? `Subí a ${item.titulo} en Edge 21 🃏`
        : item.tipo === "nivel"
          ? `${item.titulo} en la ruta de conteo de Edge 21 🧠`
          : `Terminé "${item.titulo}" en Edge 21 🃏`,
    card: { eyebrow: item.eyebrow, big: item.titulo, sub: item.sub, lines: [] },
  });
  return (
    <div
      className="cele"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cele-t"
      aria-describedby="cele-d"
    >
      <Particulas key={`${item.tipo}-${item.titulo}`} />
      <div className="cele-card">
        <div
          className={`cele-badge cele-${item.tipo}`}
          aria-hidden="true"
          style={item.color ? { "--c": item.color } : undefined}
        >
          {item.tipo === "rango" ? (
            <span className="cele-bigchip" />
          ) : item.tipo === "nivel" ? (
            "🧠"
          ) : (
            "♠"
          )}
        </div>
        <p className="eyebrow acc">{item.eyebrow}</p>
        <h2 id="cele-t" className="cele-title">
          {item.titulo}
        </h2>
        <p id="cele-d" className="muted">
          {item.sub}
        </p>
        <div className="cele-btns" ref={boton}>
          <Button onClick={cerrarCelebracion}>Seguir</Button>
          <ShareButton make={compartir} label="Compartir" />
        </div>
      </div>
    </div>
  );
}

export { Celebracion };
