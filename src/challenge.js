// Desafiar a un amigo: un enlace con las mismas cartas (conteo) o las mismas manos (contrarreloj)
// y tu puntaje. Quien lo abre juega exactamente lo mismo y comparan. No hace falta cuenta.
import { getState, setSettings } from "./state.js";
import { shareText } from "./share.js";

const SITE = "https://edge21.app/app/";
const KEY = "edge21.reto";

function b64url(s) {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function unb64url(s) {
  const p = s.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(p + "===".slice((p.length + 3) % 4))));
}

// k: "c" (conteo) o "b" (contrarreloj); s: semilla; sc: puntaje; nm: nombre.
// Conteo además: n (cartas), sp (velocidad), m (de a una o de a dos).
function challengeLink(data) {
  return `${SITE}#reto=${b64url(JSON.stringify(data))}`;
}
function parseChallenge(code) {
  try {
    const d = JSON.parse(unb64url(code));
    if (!d || (d.k !== "c" && d.k !== "b") || !Number.isFinite(d.s))
      return null;
    return {
      k: d.k,
      s: d.s >>> 0,
      sc: Math.max(0, Math.min(999, Number(d.sc) || 0)),
      nm: String(d.nm || "").slice(0, 20),
      n: d.k === "c" ? Math.max(5, Math.min(52, Number(d.n) || 15)) : undefined,
      sp: d.k === "c" ? String(d.sp || "normal") : undefined,
      m: d.k === "c" ? (d.m === "pairs" ? "pairs" : "single") : undefined,
    };
  } catch {
    return null;
  }
}
// Al abrir la app con un enlace de desafío, se guarda para mostrarlo apenas se pueda
// (después de la bienvenida, si es alguien nuevo).
function takeChallengeFromUrl() {
  try {
    const m = /[#&]reto=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (!m) return;
    const d = parseChallenge(m[1]);
    history.replaceState(
      history.state,
      "",
      location.pathname + location.search,
    );
    if (d) localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // Enlace roto: se ignora.
  }
}
function pendingChallenge() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    localStorage.removeItem(KEY);
    return d;
  } catch {
    return null;
  }
}
const randomSeed = () => Math.floor(Math.random() * 2 ** 31) + 1;
function challengeName() {
  return getState().settings.challengeName || "";
}
function shareChallenge(data, text) {
  const name = String(data.nm || "").slice(0, 20);
  if (name) setSettings({ challengeName: name });
  return shareText(`${text} ${challengeLink({ ...data, nm: name })}`);
}
// Quién gana: más puntos. En el contrarreloj, si empatan, gana quien se equivocó menos.
function verdict(mine, theirs) {
  if (mine > theirs) return "win";
  if (mine < theirs) return "lose";
  return "tie";
}

export {
  challengeLink,
  challengeName,
  parseChallenge,
  pendingChallenge,
  randomSeed,
  shareChallenge,
  takeChallengeFromUrl,
  verdict,
};
