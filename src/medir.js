// Medición anónima: para saber cuánta gente entra, de dónde viene, hasta dónde llega y si vuelve.
// - Un identificador al azar de este aparato (no es tu cuenta ni nada tuyo).
// - "nuevo" la primera vez, "activo" una vez por día, y cada hito una sola vez por aparato.
// - Sin cookies ni servicios de afuera: va a nuestro servidor (servidor/index.js → /m), que solo suma
//   contadores por día. Se apaga en Ajustes ("Estadísticas anónimas").
// - En las pruebas (localhost) no manda nada.
import { getState, subscribe } from "./state.js";
import { NATIVE } from "./platform.js";
import { LANG } from "./i18n/index.js";

const CFG = typeof __FIREBASE__ !== "undefined" ? __FIREBASE__ : null;
const API = CFG && CFG.api;
const LOCAL =
  typeof location !== "undefined" &&
  /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const K_ID = "edge21.mid";
const K_HITOS = "edge21.mhitos";
const K_DIA = "edge21.mdia";
const K_ORIGEN = "edge21.origen";

function leer(k) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function guardar(k, v) {
  try {
    localStorage.setItem(k, v);
  } catch {
    // sin almacenamiento: se mide igual, pero puede repetirse
  }
}
const apagada = () =>
  !API || (LOCAL && !window.__medirTest) || !!getState().settings.sinEstadisticas;

function plataforma() {
  if (NATIVE) return "android";
  let instalada = false;
  try {
    instalada =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  } catch {
    // sin matchMedia
  }
  const ua = navigator.userAgent || "";
  const ios =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) return instalada ? "iphone-app" : "iphone";
  if (window.innerWidth >= 1024) return instalada ? "compu-app" : "compu";
  return "celu";
}
// De dónde llegó: ?ref=… (por ejemplo, edge21.app/?ref=tiktok_video3), ?utm_source=… o la página
// anterior (tiktok, instagram, google…). Lo guarda la primera página que visita (la web, las
// guías o la app) y queda para siempre.
function origen() {
  if (NATIVE) return "android";
  let o = leer(K_ORIGEN);
  if (!o) {
    try {
      const u = new URLSearchParams(location.search);
      o = u.get("ref") || u.get("utm_source") || "";
      if (!o && document.referrer) {
        const h = new URL(document.referrer).hostname;
        if (!h.endsWith(location.hostname)) o = h;
      }
    } catch {
      o = "";
    }
    o = o || "directo";
    guardar(K_ORIGEN, o);
  }
  o = String(o).toLowerCase();
  for (const red of [
    "tiktok",
    "instagram",
    "facebook",
    "youtube",
    "google",
    "bing",
    "whatsapp",
    "twitter",
    "reddit",
  ])
    if (o.includes(red) && !/^[a-z0-9_]+$/.test(o)) return red;
  if (o === "t.co" || o === "x.com") return "twitter";
  const limpio = o.replace(/[^a-z0-9_]/g, "_").slice(0, 24);
  return limpio || "otro";
}
function idAparato() {
  let id = leer(K_ID);
  if (!id || !/^[a-z0-9]{8,24}$/.test(id)) {
    id = "";
    const a = new Uint8Array(12);
    crypto.getRandomValues(a);
    for (const b of a) id += (b % 36).toString(36);
    guardar(K_ID, id);
  }
  return id;
}
function mandar(e, extra = {}) {
  if (apagada()) return;
  const cuerpo = JSON.stringify({ e, id: idAparato(), p: plataforma(), l: LANG, ...extra });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(`${API}/m`, cuerpo)) return;
  } catch {
    // sigue con fetch
  }
  fetch(`${API}/m`, { method: "POST", body: cuerpo, keepalive: true }).catch(() => {});
}
function hitosHechos() {
  try {
    return new Set(JSON.parse(leer(K_HITOS) || "[]"));
  } catch {
    return new Set();
  }
}
// Un hito (una sola vez por aparato).
function hito(nombre) {
  if (apagada()) return;
  const h = hitosHechos();
  if (h.has(nombre)) return;
  h.add(nombre);
  guardar(K_HITOS, JSON.stringify([...h]));
  mandar(nombre);
}

// Los hitos que se ven en el progreso: se revisan cada vez que cambia.
function hitosDelProgreso(st) {
  const out = [];
  if (st.profile && st.profile.onboarded) out.push("empezar");
  const lec = Object.values(st.lessons || {}).filter(
    (l) => l && l.done && !l.viaTest,
  ).length;
  if (lec >= 1) out.push("leccion1");
  if (lec >= 3) out.push("leccion3");
  if (st.profile && (st.profile.testHecho || st.profile.placement))
    out.push("test");
  if (st.train && st.train.sessions && st.train.sessions.length)
    out.push("entreno");
  if (st.play && st.play.hands > 0) out.push("mesa");
  if (
    st.countPath &&
    st.countPath.passed &&
    Object.keys(st.countPath.passed).length
  )
    out.push("conteo");
  if (st.daily && st.daily.results && Object.keys(st.daily.results).length)
    out.push("desafio");
  if (leer("edge21.account")) out.push("cuenta");
  if (st.settings && st.settings.premium === true) out.push("compra");
  return out;
}

function initMedir() {
  if (!API || (LOCAL && !window.__medirTest)) return;
  const primeraVez = !leer(K_ID);
  idAparato();
  // Un aparato que ya venía usando la app (antes de la medición): lo que ya hizo no se cuenta
  // como si fuera de hoy.
  if (primeraVez) {
    const st = getState();
    if (st.profile && st.profile.onboarded) {
      guardar(K_HITOS, JSON.stringify(hitosDelProgreso(st)));
    } else mandar("nuevo", { src: origen() });
  }
  const hoy = new Date().toDateString();
  if (leer(K_DIA) !== hoy) {
    guardar(K_DIA, hoy);
    if (!primeraVez || getState().profile.onboarded) mandar("activo");
  }
  const revisar = () => {
    for (const h of hitosDelProgreso(getState())) hito(h);
  };
  revisar();
  subscribe(revisar);
}

export { hito, initMedir };
