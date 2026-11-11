// Pantalla de edad (ver src/edad.js): pregunta el año de nacimiento antes de usar la app.
// Si da menos de 18, la app queda cerrada en este aparato.
import { useState } from "react";
import { Button } from "../ui/components.jsx";
import { Logo } from "../ui/common.jsx";
import { calcularEdad, guardarEdad } from "../edad.js";
import { sfx } from "../sound.js";
import { LANG } from "../i18n/index.js";

const ANIO = new Date().getFullYear();

function Edad({ onListo }) {
  const [texto, setTexto] = useState("");
  const [preguntaCumple, setPreguntaCumple] = useState(false);
  const anio = Number(texto);
  const valido = /^\d{4}$/.test(texto) && anio >= ANIO - 110 && anio <= ANIO;
  const terminar = (yaCumplio) => {
    sfx.tap();
    onListo(guardarEdad(calcularEdad(anio, yaCumplio)));
  };
  const seguir = (e) => {
    e.preventDefault();
    if (!valido) return;
    // Solo si el año da justo 18 hace falta saber si ya cumplió.
    if (ANIO - anio === 18) setPreguntaCumple(true);
    else terminar(true);
  };
  return (
    <div className="layer full onb onb-welcome edad">
      <div className="onb-hero">
        <Logo size={80} />
        <h1>Antes de empezar</h1>
        {!preguntaCumple ? (
          <form onSubmit={seguir} className="edad-form">
            <label className="field" style={{ marginTop: 0 }}>
              <span>¿En qué año naciste?</span>
              <input
                className="inp edad-inp"
                type="text"
                inputMode="numeric"
                autoComplete="bday-year"
                maxLength={4}
                placeholder={LANG === "en" ? "YYYY" : "AAAA"}
                value={texto}
                onChange={(e) => setTexto(e.target.value.replace(/\D/g, ""))}
                aria-describedby="edad-ayuda"
              />
            </label>
            <p id="edad-ayuda" className="muted small">
              No guardamos tu año de nacimiento: solo lo usamos para saber si
              puedes usar la app.
            </p>
            <div className="bottom-actions">
              <Button type="submit" disabled={!valido}>
                Seguir
              </Button>
            </div>
          </form>
        ) : (
          <div className="edad-form">
            <p>¿Ya cumpliste años este año?</p>
            <div className="bottom-actions">
              <Button onClick={() => terminar(true)}>Sí</Button>
              <Button kind="outline" onClick={() => terminar(false)}>
                Todavía no
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SoloMayores() {
  return (
    <div className="layer full onb onb-welcome edad" role="alert">
      <div className="onb-hero">
        <Logo size={80} />
        <h1>Edge 21 es para mayores de 18</h1>
        <p className="muted">
          Trata sobre un juego de casino, aunque no se juegue con dinero real.
          ¡Te esperamos cuando cumplas 18!
        </p>
        <p className="small">
          <a
            className="link"
            href={`https://edge21.app/terminos.html${LANG === "en" ? "#en" : ""}`}
            target="_blank"
            rel="noreferrer"
          >
            Términos de uso
          </a>
        </p>
      </div>
    </div>
  );
}

export { Edad, SoloMayores };
