// Pantalla al abrir el enlace de un desafío: quién te desafía, a qué y su puntaje.
import { Icon } from "../ui/icons.jsx";
import { Button } from "../ui/components.jsx";
import { TopBar } from "../ui/common.jsx";
import { useNav } from "../nav.js";
import { DRILL_SPEEDS } from "./drills.jsx";

function Challenge({ challenge: c }) {
  const nav = useNav();
  const who = c.nm || "Un amigo";
  const what =
    c.k === "c"
      ? `Conteo corrido: ${c.n} cartas ${c.m === "pairs" ? "de a dos" : "de a una"} a ritmo ${((DRILL_SPEEDS.find((s) => s.id === c.sp) || {}).label || "normal").toLowerCase()}. Las mismas cartas que le tocaron.`
      : "Contrarreloj: 60 segundos para acertar todas las manos que puedas. Las mismas manos que le tocaron.";
  return (
    <div className="challenge fade-up">
      <TopBar onClose={() => nav.pop()} closeIcon="back" title="Desafío" />
      <div className="card chal-hero">
        <span className="li-icon acc-ic">
          <Icon name="users" />
        </span>
        <h1>{`${who} te desafía`}</h1>
        <p className="muted">{what}</p>
        <div className="chal-score">
          Su puntaje: <b className="num">{c.sc}</b>{" "}
          {c.k === "b"
            ? c.sc === 1
              ? "mano"
              : "manos"
            : c.sc === 1
              ? "punto"
              : "puntos"}
        </div>
      </div>
      <div className="bottom-actions">
        <Button
          onClick={() =>
            c.k === "c"
              ? nav.replace("drillRunning", { challenge: c, confirmExit: true })
              : nav.replace("blitz", { challenge: c })
          }
        >
          Aceptar el desafío
        </Button>
      </div>
    </div>
  );
}

export { Challenge };
