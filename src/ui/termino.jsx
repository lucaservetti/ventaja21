// Palabras técnicas que se pueden tocar: muestran qué significan en una hoja (una sola para toda la
// app, montada en main.jsx). Las lecciones las marcan solas con marcarTerminos (ver rich()).
import { useSyncExternalStore } from "react";
import { GLOSSARY, MARCAR } from "../lessons/glosario.js";
import { Sheet } from "./components.jsx";

let abierto = null;
const subs = new Set();
function abrir(t) {
  abierto = t;
  for (const f of subs) f();
}

function Termino({ t, children }) {
  const ir = (e) => {
    e.stopPropagation();
    abrir(t);
  };
  return (
    <span
      className="termino"
      role="button"
      tabIndex={0}
      onClick={ir}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          ir(e);
        }
      }}
    >
      {children}
    </span>
  );
}

function TerminoSheet() {
  const t = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => abierto,
  );
  const entrada = t ? GLOSSARY.find((g) => g[0] === t) : null;
  return (
    <Sheet
      open={!!entrada}
      onClose={() => abrir(null)}
      title={entrada ? entrada[0] : ""}
    >
      <p className="termino-def">{entrada ? entrada[1] : ""}</p>
    </Sheet>
  );
}

// "Desviación" también encuentra "desviaciones"; el resto, el plural con s o es.
const LETRA = "[\\p{L}\\p{N}]";
function patron(a) {
  const esc = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return /ción$/i.test(a)
    ? esc.slice(0, -4) + "(?:ción|ciones)"
    : esc + "(?:es|s)?";
}
const ENTRADAS = MARCAR.map((term) => ({
  term,
  res: term.split(" / ").map((a) => new RegExp(`^${patron(a.trim())}$`, "iu")),
}));
const RE = new RegExp(
  `(?<!${LETRA})(${MARCAR.flatMap((t) => t.split(" / ").map((a) => patron(a.trim()))).join("|")})(?!${LETRA})`,
  "giu",
);

// Marca en un texto la primera aparición de cada palabra técnica (las ya marcadas van en `usados`).
function marcarTerminos(texto, usados, clave = "") {
  const out = [];
  let ultimo = 0;
  let m;
  RE.lastIndex = 0;
  while ((m = RE.exec(texto))) {
    const e = ENTRADAS.find((x) => x.res.some((r) => r.test(m[0])));
    if (!e || usados.has(e.term)) continue;
    usados.add(e.term);
    if (m.index > ultimo) out.push(texto.slice(ultimo, m.index));
    out.push(
      <Termino t={e.term} key={`${clave}t${m.index}`}>
        {m[0]}
      </Termino>,
    );
    ultimo = m.index + m[0].length;
  }
  if (!out.length) return texto;
  if (ultimo < texto.length) out.push(texto.slice(ultimo));
  return out;
}

export { Termino, TerminoSheet, marcarTerminos };
