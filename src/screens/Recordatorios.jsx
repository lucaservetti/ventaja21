// Ajustes → Recordatorios: cuándo avisar para practicar (solo en la app de Android). La persona
// decide todo desde aquí: prenderlos o apagarlos, qué días, a qué hora y el aviso de racha.
import { useEffect, useState } from "react";
import { useStore } from "../state.js";
import { Button, Pills, Toggle, cx } from "../ui/components.jsx";
import { TopBar } from "../ui/common.jsx";
import { useNav } from "../nav.js";
import { NATIVE } from "../platform.js";
import {
  PRESETS,
  planRecordatorios,
  tipoFrecuencia,
} from "../recordatorios-plan.js";
import {
  ajustesRecordatorios,
  permiso,
  probarRecordatorio,
  setRecordatorios,
} from "../recordatorios.js";
import { activityStreak, dayKey } from "../state.js";
import { LOCALE } from "../i18n/index.js";

// La semana empieza el lunes (0 = domingo en JavaScript). Las letras y los nombres salen del
// idioma de la app.
const ORDEN = [1, 2, 3, 4, 5, 6, 0];
const enFecha = (n) => new Date(2024, 0, 7 + n); // el 7 de enero de 2024 fue domingo
const LETRA = (n) =>
  new Intl.DateTimeFormat(LOCALE, { weekday: "narrow" }).format(enFecha(n));
const NOMBRE = (n) =>
  new Intl.DateTimeFormat(LOCALE, { weekday: "long" }).format(enFecha(n));

function cuando(at) {
  const hoy = new Date();
  const man = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
  const hora = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  if (at.toDateString() === hoy.toDateString()) return `hoy a las ${hora}`;
  if (at.toDateString() === man.toDateString()) return `mañana a las ${hora}`;
  return `el ${NOMBRE(at.getDay())} a las ${hora}`;
}

function Recordatorios() {
  const st = useStore();
  const nav = useNav();
  const rec = ajustesRecordatorios(st);
  const [frec, setFrec] = useState(tipoFrecuencia(rec.dias));
  const [estado, setEstado] = useState(NATIVE ? "?" : "web");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (NATIVE) permiso().then(setEstado);
  }, [rec.on]);

  const cambiar = async (c) => {
    setAviso("");
    const r = await setRecordatorios(c);
    if (r === "denied") {
      setEstado("denied");
      setAviso(
        "Android no dejó mostrar notificaciones. Mira cómo activarlas aquí abajo.",
      );
    } else if (NATIVE) setEstado(await permiso());
  };
  const elegirFrecuencia = (f) => {
    setFrec(f);
    if (f === "todos" || f === "semana") cambiar({ dias: PRESETS[f] });
    else if (f === "semanal")
      cambiar({
        dias: [rec.dias.length === 1 ? rec.dias[0] : new Date().getDay()],
      });
  };
  const tocarDia = (n) => {
    if (frec === "semanal") return cambiar({ dias: [n] });
    const dias = rec.dias.includes(n)
      ? rec.dias.filter((d) => d !== n)
      : [...rec.dias, n];
    if (dias.length) cambiar({ dias });
  };
  const hoy = dayKey();
  const proximo = rec.on
    ? planRecordatorios(rec, {
        hoyHecho: !!st.activity[hoy] || !!st.daily.results[hoy],
        racha: activityStreak(st.activity),
      }).find((n) => n.id < 2000)
    : null;

  return (
    <div className="recordatorios fade-up">
      <TopBar
        onClose={() => nav.pop()}
        closeIcon="back"
        title="Recordatorios"
      />
      <p className="muted" style={{ margin: "0 2px 16px" }}>
        Un aviso para practicar, solo los días y a la hora que elijas. Si ese
        día ya practicaste, no te molesta.
      </p>

      <div className="card rec-card">
        <Toggle
          id="rec-on"
          label="Recordarme practicar"
          sub={
            proximo
              ? `Próximo aviso: ${cuando(proximo.at)}`
              : rec.on
                ? "Sin avisos en los próximos días"
                : "Apagados"
          }
          checked={rec.on}
          onChange={(on) => cambiar({ on })}
        />
      </div>

      <div className={cx("rec-opts", !rec.on && "off")} aria-disabled={!rec.on}>
        <h3 className="rec-h">Con qué frecuencia</h3>
        <Pills
          className="rec-pills"
          options={[
            { value: "todos", label: "Todos los días" },
            { value: "semana", label: "Lunes a viernes" },
            { value: "semanal", label: "Una vez por semana" },
            { value: "elegir", label: "Elegir días" },
          ]}
          value={frec}
          onChange={elegirFrecuencia}
        />
        {frec === "semanal" || frec === "elegir" ? (
          <div
            className="rec-days"
            role="group"
            aria-label={frec === "semanal" ? "Qué día" : "Qué días"}
          >
            {ORDEN.map((n) => (
              <button
                type="button"
                key={n}
                className={cx("rec-day", rec.dias.includes(n) && "on")}
                aria-pressed={rec.dias.includes(n)}
                aria-label={NOMBRE(n)}
                onClick={() => tocarDia(n)}
              >
                {LETRA(n).toUpperCase()}
              </button>
            ))}
          </div>
        ) : null}

        <h3 className="rec-h">A qué hora</h3>
        <input
          className="inp rec-time"
          type="time"
          step={900}
          value={rec.hora}
          aria-label="Hora del recordatorio"
          onChange={(e) => e.target.value && cambiar({ hora: e.target.value })}
        />

        <div className="card rec-card" style={{ marginTop: 18 }}>
          <Toggle
            id="rec-racha"
            label="Avisarme si estoy por perder la racha"
            sub="A las 21 h, solo si todavía no practicaste ese día."
            checked={rec.racha}
            onChange={(racha) => cambiar({ racha })}
          />
        </div>

        {NATIVE ? (
          <Button
            kind="outline"
            style={{ marginTop: 16 }}
            onClick={async () =>
              setAviso(
                (await probarRecordatorio())
                  ? "Listo: te llega en 5 segundos."
                  : "Android no dejó mostrar notificaciones.",
              )
            }
          >
            Probar un aviso
          </Button>
        ) : null}
      </div>

      {aviso ? (
        <p className="small rec-msg" role="status">
          {aviso}
        </p>
      ) : null}

      {estado === "denied" ? (
        <div className="card rec-help">
          <b>Las notificaciones de Edge 21 están apagadas en Android</b>
          <p className="muted small">
            Para activarlas: Ajustes del celular → Apps → Edge 21 →
            Notificaciones. Después vuelve aquí y prende los recordatorios.
          </p>
        </div>
      ) : null}
      {estado === "web" ? (
        <p className="muted small" style={{ marginTop: 16 }}>
          Los avisos salen en la app de Android. En la web se guardan tus
          preferencias.
        </p>
      ) : null}
    </div>
  );
}

export { Recordatorios };
