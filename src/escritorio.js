// La web en la compu: con pantalla ancha, el menú pasa al costado y el contenido se ensancha (ver
// .app.escritorio en styles.css). En Android no aplica.
// También guarda el aviso del navegador para instalar Edge 21 como app de escritorio (Chrome y
// Edge lo ofrecen): así se abre en su propia ventana, con su ícono, sin la barra del navegador.
import { useSyncExternalStore } from "react";
import { NATIVE } from "./platform.js";

const ANCHO = "(min-width: 1024px)";
const mq =
  !NATIVE && typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(ANCHO)
    : null;
function useEscritorio() {
  return useSyncExternalStore(
    (cb) => {
      if (!mq) return () => {};
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => !!(mq && mq.matches),
  );
}

let aviso = null;
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f());
if (!NATIVE && typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    aviso = e;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    aviso = null;
    avisar();
  });
}
// ¿Se puede ofrecer instalarla? Solo en la compu (en el celular hay otro aviso, en Aprender).
function usePuedeInstalar() {
  const desk = useEscritorio();
  const hay = useSyncExternalStore(
    (cb) => {
      oyentes.add(cb);
      return () => oyentes.delete(cb);
    },
    () => !!aviso,
  );
  return desk && hay;
}
async function instalarEscritorio() {
  if (!aviso) return;
  const e = aviso;
  aviso = null;
  avisar();
  try {
    await e.prompt();
  } catch {
    // el navegador no dejó: no pasa nada
  }
}

// Atajos de teclado en la compu: H, S, D, P y R toman esa jugada (pedir, plantarse, doblar,
// separar, rendirse) en la mesa y en Entrenar. Solo si el botón está a la vista y habilitado, y no
// mientras se escribe en un campo.
if (!NATIVE && typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))
      return;
    const k = String(e.key || "").toUpperCase();
    if (!"HSDPR".includes(k) || k.length !== 1) return;
    // La pantalla de más arriba que se ve (una abierta encima de las pestañas, si hay).
    const capas = [...document.querySelectorAll(".app .layer:not([hidden])")];
    const capa = capas.sort(
      (a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0),
    )[0];
    if (!capa || document.querySelector(".sheet-wrap, .modal-wrap")) return;
    const btn = [
      ...capa.querySelectorAll(
        `.sim-act.act-${k}:not([disabled]), .act-btn.act-${k}:not([disabled])`,
      ),
    ].find((b) => b.offsetParent !== null);
    if (!btn) return;
    e.preventDefault();
    btn.click();
  });
}

export { instalarEscritorio, useEscritorio, usePuedeInstalar };
