// Panel de la medición (solo para el dueño de la app): cuánta gente llega, de dónde, hasta dónde
// avanza y si vuelve. Los datos son anónimos y vienen del servidor (ver src/medir.js).
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../ui/common.jsx";
import { Pills } from "../ui/components.jsx";
import { useNav } from "../nav.js";
import { pedirPanel } from "../cloud.js";

const EMBUDO = [
  ["empezar", "Tocaron Empezar"],
  ["leccion1", "Terminaron 1 lección"],
  ["leccion3", "Terminaron 3 lecciones"],
  ["test", "Hicieron el test de nivel"],
  ["entreno", "Entrenaron"],
  ["mesa", "Jugaron en la mesa"],
  ["conteo", "Pasaron un nivel de conteo"],
  ["desafio", "Jugaron el desafío diario"],
  ["cuenta", "Entraron con Google"],
  ["premium", "Vieron Premium"],
  ["compra", "Compraron Premium"],
];
const PLATAFORMAS = {
  android: "App de Android",
  "iphone-app": "iPhone (instalada)",
  iphone: "iPhone (Safari)",
  "compu-app": "Compu (instalada)",
  compu: "Compu (navegador)",
  celu: "Celular (navegador)",
  otra: "Otra",
};
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)} %` : "—");
const suma = (dias, f) => dias.reduce((s, d) => s + (f(d) || 0), 0);
function juntar(dias, clave) {
  const out = {};
  for (const d of dias)
    for (const [k, v] of Object.entries(d[clave] || {}))
      out[k] = (out[k] || 0) + v;
  return Object.entries(out).sort((a, b) => b[1] - a[1]);
}
const fecha = (k) => {
  const [, m, d] = k.split("-");
  return `${Number(d)}/${Number(m)}`;
};

function Panel() {
  const nav = useNav();
  const [rango, setRango] = useState(7);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    setError(null);
    pedirPanel(30)
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  const dias = useMemo(
    () => (data ? data.dias.slice(0, rango) : []),
    [data, rango],
  );
  const llegaron = suma(dias, (d) => d.e.nuevo);
  // Para "vuelven" solo cuentan los días que ya tuvieron su día siguiente (o su semana).
  const conManana = dias.filter((d) => d.dia !== (data && data.hoy));
  const conSemana = data
    ? dias.filter((d) => Date.parse(data.hoy) - Date.parse(d.dia) >= 7 * 864e5)
    : [];
  const fuentes = juntar(dias, "src");
  const plats = juntar(dias, "plat");
  const maxAct = Math.max(1, ...dias.map((d) => d.e.activo || 0));
  return (
    <div className="panel fade-up">
      <TopBar
        onClose={() => nav.pop()}
        closeIcon="back"
        title="Estadísticas"
        sub="Anónimas · solo las ves vos"
      />
      <Pills
        options={[
          { value: 7, label: "Últimos 7 días" },
          { value: 30, label: "Últimos 30 días" },
        ]}
        value={rango}
        onChange={setRango}
      />
      {error ? (
        <p className="small bad" role="alert" style={{ marginTop: 14 }}>
          {error}
        </p>
      ) : !data ? (
        <p className="muted" style={{ marginTop: 14 }}>
          Cargando…
        </p>
      ) : (
        <>
          <div className="tiles" style={{ marginTop: 14 }}>
            <div className="tile">
              <div className="tile-v num">{llegaron}</div>
              <div className="tile-l">llegaron</div>
            </div>
            <div className="tile">
              <div className="tile-v num">
                {pct(
                  suma(conManana, (d) => d.r.d1),
                  suma(conManana, (d) => d.e.nuevo),
                )}
              </div>
              <div className="tile-l">vuelven al día siguiente</div>
            </div>
            <div className="tile">
              <div className="tile-v num">
                {pct(
                  suma(conManana, (d) => d.r.semana),
                  suma(conManana, (d) => d.e.nuevo),
                )}
              </div>
              <div className="tile-l">vuelven en la semana</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="eyebrow">Hasta dónde llegan</div>
            <p className="muted small" style={{ margin: "4px 0 10px" }}>
              De los que llegaron en estos días, cuántos hicieron cada cosa.
            </p>
            {EMBUDO.map(([k, nombre]) => {
              const n = suma(dias, (d) => d.c[k]);
              return (
                <div className="pn-row" key={k}>
                  <span className="pn-name">{nombre}</span>
                  <span className="pn-bar">
                    <i
                      style={{
                        width: `${llegaron ? Math.min(100, (n / llegaron) * 100) : 0}%`,
                      }}
                    />
                  </span>
                  <span className="pn-num num">
                    {n} <span className="muted">· {pct(n, llegaron)}</span>
                  </span>
                </div>
              );
            })}
            {conSemana.length ? (
              <p className="muted small" style={{ marginTop: 10 }}>
                A los 7 días justos volvieron{" "}
                {pct(
                  suma(conSemana, (d) => d.r.d7),
                  suma(conSemana, (d) => d.e.nuevo),
                )}
                .
              </p>
            ) : null}
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="eyebrow">De dónde vienen</div>
            {fuentes.length ? (
              fuentes.map(([k, n]) => (
                <div className="kv" key={k}>
                  <span className="kv-k">{k}</span>
                  <span className="kv-v num">
                    {n} <span className="muted">· {pct(n, llegaron)}</span>
                  </span>
                </div>
              ))
            ) : (
              <p className="muted small" style={{ marginTop: 6 }}>
                Todavía nadie.
              </p>
            )}
            <p className="muted small" style={{ marginTop: 10 }}>
              Para saber qué video trae gente, usá enlaces con nombre: por
              ejemplo, edge21.app/?ref=tiktok_video3.
            </p>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="eyebrow">Dónde la usan</div>
            {plats.map(([k, n]) => (
              <div className="kv" key={k}>
                <span className="kv-k">{PLATAFORMAS[k] || k}</span>
                <span className="kv-v num">{n}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="eyebrow">Por día</div>
            <div className="pn-row pn-head">
              <span className="pn-name">Día</span>
              <span className="pn-bar small muted">usaron la app</span>
              <span className="pn-num small muted">nuevos</span>
            </div>
            {dias.map((d) => (
              <div className="pn-row" key={d.dia}>
                <span className="pn-name num">{fecha(d.dia)}</span>
                <span className="pn-bar" title={`${d.e.activo || 0}`}>
                  <i style={{ width: `${((d.e.activo || 0) / maxAct) * 100}%` }} />
                  <b className="num">{d.e.activo || 0}</b>
                </span>
                <span className="pn-num num">{d.e.nuevo || 0}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export { Panel };
