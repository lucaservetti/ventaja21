// Tarjeta "Misiones de hoy" (Aprender y Progreso) y el aviso cuando cumples una.
import { useEffect } from "react";
import { dayKey, getState, setState, useStore } from "../state.js";
import { cobrarMisiones, misionesDeHoy, prepararMisiones } from "../misiones.js";
import { LESSONS, openLesson } from "../lessons/content.js";
import { useNav } from "../nav.js";
import { Icon } from "../ui/icons.jsx";
import { Button, cx } from "../ui/components.jsx";
import { sfx } from "../sound.js";

// Un cartelito abajo de la pantalla (lo muestra main.jsx).
function avisoGlobal(msg) {
  window.dispatchEvent(new CustomEvent("edge21:aviso", { detail: msg }));
}

// A dónde te lleva tocar cada misión.
function ir(nav, st, id) {
  if (id === "leccion") {
    const l = LESSONS.find((x) => !(st.lessons[x.id] && st.lessons[x.id].done));
    if (l) openLesson(nav, l);
    else nav.goTab("aprender");
  } else if (id === "entrenar") nav.goTab("entrenar");
  else if (id === "mesa") nav.goTab("jugar");
  else if (id === "desafio") nav.push("drillRunning", { daily: true, confirmExit: true });
  else if (id === "conteo") nav.goTab("conteo");
  else if (id === "meta") nav.openSheet("goal");
}

function Misiones({ compacta = false }) {
  const st = useStore();
  const nav = useNav();
  const hoy = misionesDeHoy(st);
  // Recién terminado el inicio (o pasada la medianoche con la app abierta): prepara las de hoy.
  useEffect(() => {
    if (!hoy) prepararMisiones();
  }, [!!hoy]);
  if (!hoy) return null;
  const { lista, hechas, todas, cobrado } = hoy;
  const abrir = () => {
    const gana = cobrarMisiones();
    sfx.win();
    avisoGlobal(
      gana
        ? "🎁 ¡Premio del día! Ganaste un protector de racha 🛡️"
        : "🎁 ¡Completaste las misiones de hoy! Ya tienes los 2 protectores.",
    );
  };
  // Hechas y cobradas: en Aprender queda una línea chica para no ocupar lugar.
  if (compacta && cobrado) {
    return (
      <div className="card flat misiones-ok">
        <Icon name="check" size={18} className="good" />
        <span className="small">Misiones de hoy completas. Mañana hay nuevas.</span>
      </div>
    );
  }
  return (
    <div className={cx("card misiones-card", todas && !cobrado && "lista")}>
      <div className="misiones-top">
        <span className="eyebrow acc">Misiones de hoy</span>
        <span className="misiones-n num">
          {hechas}/{lista.length}
        </span>
      </div>
      <div className="misiones-lista">
        {lista.map((m) => (
          <button
            type="button"
            key={m.id}
            className={cx("mision", m.done && "done")}
            onClick={() => !m.done && ir(nav, st, m.id)}
            aria-label={`${m.title}: ${m.done ? "hecha" : `${m.have} de ${m.need}`}`}
          >
            <span className="mision-ic">
              <Icon name={m.done ? "check" : m.icon} size={18} />
            </span>
            <span className="mision-txt">
              <span className="mision-t">{m.title}</span>
              {m.need > 1 && !m.done ? (
                <span className="mision-bar" aria-hidden="true">
                  <i style={{ width: `${(m.have / m.need) * 100}%` }} />
                </span>
              ) : null}
            </span>
            <span className="mision-v num small">
              {m.done ? "" : m.need > 1 ? `${m.have}/${m.need}` : ""}
            </span>
          </button>
        ))}
      </div>
      {todas && !cobrado ? (
        <Button onClick={abrir} icon="sparkle">
          Abrir el premio del día
        </Button>
      ) : cobrado ? (
        <p className="muted small misiones-pie">¡Listo por hoy! Mañana hay misiones nuevas.</p>
      ) : (
        <p className="muted small misiones-pie">
          Completa las 3 y gana un protector de racha 🛡️
        </p>
      )}
    </div>
  );
}

// Avisa con un cartelito cada vez que completas una misión (una sola vez por misión).
function useAvisoMisiones(avisar) {
  const st = useStore();
  const hoy = misionesDeHoy(st);
  const clave = hoy ? hoy.lista.map((m) => (m.done ? 1 : 0)).join("") : "";
  useEffect(() => {
    if (!hoy) return;
    const m = getState().misiones;
    const nuevas = hoy.lista.filter((x) => x.done && !(m.avisadas || {})[x.id]);
    if (!nuevas.length) return;
    setState((s) => ({
      ...s,
      misiones: {
        ...s.misiones,
        avisadas: {
          ...(s.misiones.avisadas || {}),
          ...Object.fromEntries(nuevas.map((x) => [x.id, dayKey()])),
        },
      },
    }));
    avisar(
      hoy.todas
        ? "🎁 ¡Completaste las 3 misiones de hoy! Abre tu premio en Aprender."
        : `✅ Misión cumplida: ${nuevas[0].title} (${hoy.hechas} de ${hoy.lista.length})`,
    );
  }, [clave]);
}

export { Misiones, useAvisoMisiones };
