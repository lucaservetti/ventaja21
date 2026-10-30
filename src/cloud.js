// Cuenta de Google opcional: guarda el progreso en la nube, suma tu puntaje al ranking del desafío
// diario y manda los errores de la app para poder arreglarlos. Usa Firebase (Auth y Firestore) por su
// API REST, sin el SDK de Firebase, así la app no pesa más. Sin configuración (firebase.config.json
// vacío) todo esto queda apagado y la app funciona igual que siempre.
import { useSyncExternalStore } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import {
  dayKey,
  exportBackup,
  getState,
  importBackup,
  readBackup,
  subscribe,
} from "./state.js";

const CFG = __FIREBASE__;
const CLOUD = !!(CFG && CFG.apiKey && CFG.projectId);
const ACCOUNTS = CLOUD && !!CFG.webClientId;
const NATIVE = Capacitor.isNativePlatform();
// Para las pruebas se puede apuntar a los emuladores de Firebase (CFG.emulator = "127.0.0.1").
const EMU = CLOUD && CFG.emulator;
const AUTH = EMU
  ? `http://${CFG.emulator}:9099/identitytoolkit.googleapis.com`
  : "https://identitytoolkit.googleapis.com";
const TOKEN = EMU
  ? `http://${CFG.emulator}:9099/securetoken.googleapis.com`
  : "https://securetoken.googleapis.com";
const FS = CLOUD
  ? `${EMU ? `http://${CFG.emulator}:8080` : "https://firestore.googleapis.com"}/v1/projects/${CFG.projectId}/databases/(default)/documents`
  : "";
const KEY = "edge21.account";
const DAY = 24 * 60 * 60 * 1000;
const KEEP_DAYS = 60; // los puntajes del ranking se borran solos después de 60 días

// ---- Estado de la cuenta (fuera del progreso: los tokens no van en los respaldos) ----
function loadAcct() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}
let acct = ACCOUNTS ? loadAcct() : null;
// status: "idle" | "syncing" | "ok" | "error" | "conflict"
let sync = {
  status: acct ? "idle" : "off",
  at: acct ? acct.lastSync : 0,
  conflict: null,
};
const listeners = new Set();
let snap = { acct, sync };
function emit() {
  snap = { acct, sync };
  for (const fn of listeners) fn();
}
function saveAcct(next) {
  acct = next;
  try {
    if (acct) localStorage.setItem(KEY, JSON.stringify(acct));
    else localStorage.removeItem(KEY);
  } catch {
    // Sin almacenamiento la sesión dura hasta cerrar la app.
  }
  emit();
}
function setSync(patch) {
  sync = { ...sync, ...patch };
  emit();
}
function useAccount() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => snap,
  );
}

// ---- Firestore: valores ----
function toFields(obj) {
  const f = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v instanceof Date) f[k] = { timestampValue: v.toISOString() };
    else if (typeof v === "boolean") f[k] = { booleanValue: v };
    else if (typeof v === "number")
      f[k] = Number.isInteger(v)
        ? { integerValue: String(v) }
        : { doubleValue: v };
    else if (v && v.bytes) f[k] = { bytesValue: v.bytes };
    else f[k] = { stringValue: String(v) };
  }
  return { fields: f };
}
function fromFields(doc) {
  const out = {};
  for (const [k, v] of Object.entries((doc && doc.fields) || {})) {
    if ("integerValue" in v) out[k] = Number(v.integerValue);
    else if ("doubleValue" in v) out[k] = v.doubleValue;
    else if ("booleanValue" in v) out[k] = v.booleanValue;
    else if ("bytesValue" in v) out[k] = { bytes: v.bytesValue };
    else if ("timestampValue" in v) out[k] = Date.parse(v.timestampValue);
    else if ("stringValue" in v) out[k] = v.stringValue;
  }
  return out;
}

async function http(url, { method = "GET", body, token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined)
    headers["Content-Type"] = form
      ? "application/x-www-form-urlencoded"
      : "application/json";
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(token ? url : `${url}${sep}key=${CFG.apiKey}`, {
    method,
    headers,
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
  });
  if (res.status === 404 && method === "GET") return null;
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data.error && (data.error.message || data.error.status)) ||
      `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---- Inicio de sesión ----
let socialReady = null;
function socialLogin() {
  const SocialLogin = registerPlugin("SocialLogin");
  if (!socialReady)
    socialReady = SocialLogin.initialize({
      google: { webClientId: CFG.webClientId, mode: "online" },
    });
  return socialReady.then(() =>
    SocialLogin.login({
      provider: "google",
      options: { scopes: ["email", "profile"] },
    }),
  );
}
// En la web: el botón oficial de Google (Google Identity Services) dibujado en `el`.
let gisLoading = null;
function loadGis() {
  if (!gisLoading)
    gisLoading = new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = () => ok(window.google);
      s.onerror = () => {
        gisLoading = null;
        fail(new Error("No se pudo cargar el inicio de sesión de Google."));
      };
      document.head.appendChild(s);
    });
  return gisLoading;
}
async function renderWebButton(el, onDone) {
  const google = await loadGis();
  google.accounts.id.initialize({
    client_id: CFG.webClientId,
    callback: (r) => onDone(finishSignIn(r.credential)),
  });
  google.accounts.id.renderButton(el, {
    theme: "filled_black",
    size: "large",
    shape: "pill",
    text: "continue_with",
    width: 300,
  });
}
// En Android: el selector de cuentas de Google del celular.
async function signInNative() {
  const r = await socialLogin();
  const idToken = r && r.result && r.result.idToken;
  if (!idToken) throw new Error("Google no devolvió la cuenta.");
  return finishSignIn(idToken);
}

function shortName(full) {
  const parts = String(full || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "Jugador";
  return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
}
async function finishSignIn(googleIdToken) {
  const r = await http(`${AUTH}/v1/accounts:signInWithIdp`, {
    method: "POST",
    body: {
      postBody: `id_token=${encodeURIComponent(googleIdToken)}&providerId=google.com`,
      requestUri: location.origin.startsWith("http")
        ? location.origin
        : "http://localhost",
      returnSecureToken: true,
      returnIdpCredential: true,
    },
  });
  const prev = acct && acct.uid === r.localId ? acct : null;
  saveAcct({
    uid: r.localId,
    refresh: r.refreshToken,
    token: r.idToken,
    exp: Date.now() + Number(r.expiresIn || 3600) * 1000,
    name: r.displayName || r.fullName || "",
    email: r.email || "",
    nick: (prev && prev.nick) || shortName(r.displayName || r.fullName),
    lastSync: prev ? prev.lastSync : 0,
    dirty: prev ? prev.dirty : false,
    posted: prev ? prev.posted || [] : [],
  });
  const result = await firstSync();
  // El puntaje de hoy entra al ranking apenas entrás.
  postScores().catch(() => {});
  return result;
}
async function token() {
  if (!acct) throw new Error("Sin sesión");
  if (acct.token && acct.exp > Date.now() + 60000) return acct.token;
  const r = await http(`${TOKEN}/v1/token`, {
    method: "POST",
    form: true,
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(acct.refresh)}`,
  });
  saveAcct({
    ...acct,
    token: r.id_token,
    refresh: r.refresh_token || acct.refresh,
    exp: Date.now() + Number(r.expires_in || 3600) * 1000,
  });
  return acct.token;
}
function signOut() {
  saveAcct(null);
  setSync({ status: "off", at: 0, conflict: null });
}

// ---- Progreso en la nube (users/{uid}) ----
async function pack(text) {
  if (typeof CompressionStream === "undefined") return { text };
  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000)
    bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { gz: { bytes: btoa(bin) } };
}
async function unpack(f) {
  if (f.text) return f.text;
  if (!f.gz) return null;
  const bin = atob(f.gz.bytes);
  const buf = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const stream = new Blob([buf])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}
const userDoc = () => `${FS}/users/${acct.uid}`;
async function getRemote() {
  const doc = await http(userDoc(), { token: await token() });
  if (!doc) return null;
  const f = fromFields(doc);
  const code = await unpack(f);
  return code ? { code, updatedAt: f.updatedAt || 0 } : null;
}
async function upload() {
  if (!acct) return;
  setSync({ status: "syncing" });
  const now = Date.now();
  const body = await pack(exportBackup());
  await http(userDoc(), {
    method: "PATCH",
    token: await token(),
    body: toFields({ ...body, updatedAt: now, version: __APP_VERSION__ }),
  });
  saveAcct({ ...acct, lastSync: now, dirty: false });
  setSync({ status: "ok", at: now, conflict: null });
}
let applying = false;
function applyRemote(remote) {
  applying = true;
  try {
    importBackup(remote.code);
  } finally {
    applying = false;
  }
  saveAcct({ ...acct, lastSync: remote.updatedAt, dirty: false });
  setSync({ status: "ok", at: remote.updatedAt, conflict: null });
}
// ¿Hay algo que valga la pena en este celular?
function hasProgress(st) {
  return (
    st.profile.onboarded &&
    (Object.values(st.lessons || {}).some((l) => l && l.done) ||
      (st.train && st.train.totalHands > 0) ||
      Object.keys(st.activity || {}).length > 1)
  );
}
// Al entrar: si la nube está vacía, se sube lo de este celular; si el celular está vacío, se baja lo de
// la nube; si hay progreso en los dos, se le pregunta a la persona con cuál quedarse.
async function firstSync() {
  setSync({ status: "syncing" });
  try {
    const remote = await getRemote();
    if (!remote) {
      await upload();
      return "uploaded";
    }
    if (!hasProgress(getState())) {
      applyRemote(remote);
      return "restored";
    }
    if (remote.updatedAt === acct.lastSync) {
      await upload();
      return "uploaded";
    }
    setSync({
      status: "conflict",
      conflict: { remote, local: getState(), cloud: readBackup(remote.code) },
    });
    return "conflict";
  } catch (e) {
    setSync({ status: "error", error: e.message });
    throw e;
  }
}
async function resolveConflict(useCloud) {
  const c = sync.conflict;
  if (!c) return;
  if (useCloud) applyRemote(c.remote);
  else await upload();
}
// Al abrir la app con sesión: si otro celular guardó algo más nuevo, se trae.
async function checkRemote() {
  if (!acct) return;
  try {
    const remote = await getRemote();
    if (!remote) return upload();
    if (remote.updatedAt > (acct.lastSync || 0)) {
      if (!acct.dirty) applyRemote(remote);
      else
        setSync({
          status: "conflict",
          conflict: {
            remote,
            local: getState(),
            cloud: readBackup(remote.code),
          },
        });
    } else if (acct.dirty) await upload();
    else setSync({ status: "ok", at: acct.lastSync });
  } catch (e) {
    setSync({ status: "error", error: e.message });
  }
}
function syncNow() {
  return upload().catch((e) => setSync({ status: "error", error: e.message }));
}

// ---- Ranking del desafío diario ----
function mondayKey(d = new Date()) {
  const m = new Date(d);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return dayKey(m);
}
function weekTotal(st, monday) {
  let total = 0;
  const d = new Date(`${monday}T12:00:00`);
  for (let i = 0; i < 7; i++) {
    const r = st.daily.results[dayKey(d)];
    if (r) total += r.score ?? (r.ok ? 100 : 0);
    d.setDate(d.getDate() + 1);
  }
  return total;
}
let lastPosted = "";
async function postScores() {
  if (!acct) return;
  const st = getState();
  const today = dayKey();
  const r = st.daily.results[today];
  if (!r) return;
  const score = r.score ?? (r.ok ? 100 : 0);
  const monday = mondayKey();
  const week = weekTotal(st, monday);
  const sig = `${today}:${score}:${week}:${acct.nick}`;
  if (sig === lastPosted) return;
  lastPosted = sig;
  const expireAt = new Date(Date.now() + KEEP_DAYS * DAY);
  const t = await token();
  const paths = [
    `daily/${today}/scores/${acct.uid}`,
    `weekly/${monday}/scores/${acct.uid}`,
  ];
  await http(`${FS}/${paths[0]}`, {
    method: "PATCH",
    token: t,
    body: toFields({
      name: acct.nick,
      score,
      ok: !!r.ok,
      t: Date.now(),
      expireAt,
    }),
  });
  await http(`${FS}/${paths[1]}`, {
    method: "PATCH",
    token: t,
    body: toFields({ name: acct.nick, score: week, t: Date.now(), expireAt }),
  });
  const posted = [...new Set([...(acct.posted || []), ...paths])].slice(-40);
  saveAcct({ ...acct, posted });
}
async function topScores(
  kind = "daily",
  key = kind === "daily" ? dayKey() : mondayKey(),
  limit = 20,
) {
  if (!CLOUD) return { rows: [], me: null, total: 0 };
  const parent = `${FS}/${kind}/${key}`;
  const q = {
    structuredQuery: {
      from: [{ collectionId: "scores" }],
      orderBy: [{ field: { fieldPath: "score" }, direction: "DESCENDING" }],
      limit,
    },
  };
  const opts = { method: "POST", body: q };
  if (acct) opts.token = await token().catch(() => null);
  const res = await http(`${parent}:runQuery`, opts);
  const rows = (res || [])
    .filter((x) => x.document)
    .map((x) => ({
      id: x.document.name.split("/").pop(),
      ...fromFields(x.document),
    }));
  let me = null;
  let total = 0;
  const count = async (where) => {
    const agg = await http(`${parent}:runAggregationQuery`, {
      method: "POST",
      token: opts.token,
      body: {
        structuredAggregationQuery: {
          structuredQuery: {
            from: [{ collectionId: "scores" }],
            ...(where ? { where } : {}),
          },
          aggregations: [{ alias: "n", count: {} }],
        },
      },
    });
    const v =
      agg &&
      agg[0] &&
      agg[0].result &&
      agg[0].result.aggregateFields &&
      agg[0].result.aggregateFields.n;
    return v ? Number(v.integerValue) : 0;
  };
  try {
    total = await count(null);
    if (acct) {
      const mine =
        rows.find((r) => r.id === acct.uid) ||
        (await http(`${parent}/scores/${acct.uid}`, { token: opts.token }).then(
          (d) => (d ? { id: acct.uid, ...fromFields(d) } : null),
        ));
      if (mine) {
        const above = await count({
          fieldFilter: {
            field: { fieldPath: "score" },
            op: "GREATER_THAN",
            value: { integerValue: String(mine.score) },
          },
        });
        me = { ...mine, rank: above + 1 };
      }
    }
  } catch {
    // Sin conteo: se muestra solo la lista.
  }
  return { rows, me, total };
}
async function setNick(nick) {
  const clean = String(nick || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);
  if (!acct || !clean) return;
  saveAcct({ ...acct, nick: clean });
  lastPosted = "";
  postScores().catch(() => {});
}

// ---- Borrar la cuenta (Google Play lo exige si la app permite crear cuentas) ----
async function deleteAccount() {
  if (!acct) return;
  const t = await token();
  for (const p of acct.posted || [])
    await http(`${FS}/${p}`, { method: "DELETE", token: t }).catch(() => {});
  await http(userDoc(), { method: "DELETE", token: t }).catch(() => {});
  await http(`${AUTH}/v1/accounts:delete`, {
    method: "POST",
    body: { idToken: t },
  });
  signOut();
}

// ---- Errores de la app ----
let reported = 0;
const seen = new Set();
function reportError(err, where = "") {
  if (!CLOUD || reported >= 5) return;
  const msg = String((err && err.message) || err || "error").slice(0, 300);
  if (seen.has(msg)) return;
  seen.add(msg);
  reported++;
  const stack = String((err && err.stack) || "").slice(0, 1500);
  fetch(`${FS}/errores?key=${CFG.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      toFields({
        msg,
        stack,
        where: String(where).slice(0, 200),
        version: __APP_VERSION__,
        plataforma: NATIVE ? "android" : "web",
        idioma: document.documentElement.lang || "",
        t: Date.now(),
        expireAt: new Date(Date.now() + 90 * DAY),
      }),
    ),
  }).catch(() => {});
}

// ---- Arranque ----
function initCloud() {
  if (!CLOUD) return;
  if (EMU)
    window.__cloudTest = { finishSignIn, topScores, syncNow, checkRemote };
  window.addEventListener("error", (e) =>
    reportError(e.error || e.message, "window"),
  );
  window.addEventListener("unhandledrejection", (e) =>
    reportError(e.reason, "promesa"),
  );
  if (!ACCOUNTS) return;
  let timer = 0;
  let lastScore = "";
  subscribe(() => {
    if (!acct || applying) return;
    if (!acct.dirty) saveAcct({ ...acct, dirty: true });
    clearTimeout(timer);
    timer = setTimeout(syncNow, 20000);
    const r = getState().daily.results[dayKey()];
    const s = r ? `${r.score}` : "";
    if (s !== lastScore) {
      lastScore = s;
      postScores().catch(() => {});
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && acct && acct.dirty) {
      clearTimeout(timer);
      syncNow();
    } else if (!document.hidden && acct) checkRemote();
  });
  if (acct) checkRemote();
}

export {
  ACCOUNTS,
  CLOUD,
  NATIVE as CLOUD_NATIVE,
  deleteAccount,
  initCloud,
  renderWebButton,
  reportError,
  resolveConflict,
  setNick,
  signInNative,
  signOut,
  syncNow,
  topScores,
  useAccount,
};
