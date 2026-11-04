// Servidor de Edge 21 (Cloudflare Worker, gratis). Por ahora: los premios (y borrarlos con la cuenta).
// POST /premios con la sesión de Firebase de la persona → revisa qué premios ganó, da los días de
// Premium que correspondan (escribiendo premium/{uid}) y devuelve cómo va cada uno.
// Lo que la app guarda se puede tocar; por eso los días los da el servidor, con estos controles:
// - la sesión se verifica con las claves públicas de Google;
// - la racha se cuenta con los puntajes del ranking, y cada uno tiene que haberse guardado ese día;
// - el podio solo vale en semanas con 10 jugadores o más, y con un puntaje semanal que cuadre con
//   los puntajes diarios de esa semana;
// - cada premio se da una vez (el podio, una por semana) y hay un tope de 14 días cada 30 días.
// Configuración: wrangler.toml (PROJECT_ID) y el secreto FIREBASE_SA (clave de cuenta de servicio).
import {
  AMIGO_DIAS,
  AMIGO_META,
  AMIGO_PLAZO,
  AMIGO_TOPE,
  DAY,
  PODIO_MIN,
  PREMIOS,
  TOPE_DIAS,
  dayKeyUTC,
  diasRecientes,
  keyTime,
  longestRun,
  mondayUTC,
  savedOnTime,
} from "../src/premios.js";

const ORIGINS = [
  "https://edge21.app",
  "https://www.edge21.app",
  "https://localhost", // app de Android (Capacitor)
  "capacitor://localhost",
  "http://localhost",
];
const RACHA_DIAS = 42; // cuántos días para atrás se miran para la racha

function cors(req) {
  const o = req.headers.get("Origin") || "";
  const ok =
    ORIGINS.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
  return {
    "Access-Control-Allow-Origin": ok ? o : ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
function json(req, status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors(req) },
  });
}

// ---- base64url y JWT ----
function b64urlToBytes(s) {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}
function bytesToB64url(buf) {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const strToB64url = (s) => bytesToB64url(new TextEncoder().encode(s));
function decodeJwt(t) {
  const [h, p, sig] = String(t).split(".");
  const dec = (x) => JSON.parse(new TextDecoder().decode(b64urlToBytes(x)));
  return { header: dec(h), payload: dec(p), signed: `${h}.${p}`, sig };
}

// ---- Verificar la sesión de Firebase ----
let jwks = { keys: null, exp: 0 };
async function googleKeys() {
  if (jwks.keys && jwks.exp > Date.now()) return jwks.keys;
  const r = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  );
  const data = await r.json();
  const maxAge = /max-age=(\d+)/.exec(r.headers.get("Cache-Control") || "");
  jwks = {
    keys: data.keys,
    exp: Date.now() + (maxAge ? Number(maxAge[1]) * 1000 : 3600e3),
  };
  return jwks.keys;
}
async function verifyIdToken(token, env) {
  const { header, payload, signed, sig } = decodeJwt(token);
  const now = Date.now() / 1000;
  const pid = env.PROJECT_ID;
  if (
    payload.aud !== pid ||
    payload.iss !== `https://securetoken.google.com/${pid}` ||
    !(payload.exp > now) ||
    !(payload.iat <= now + 300) ||
    !payload.sub
  )
    throw new Error("sesión inválida");
  // Los emuladores de Firebase no firman las sesiones.
  if (env.EMULATOR) return payload.sub;
  if (header.alg !== "RS256") throw new Error("sesión inválida");
  const jwk = (await googleKeys()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("sesión inválida");
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(sig),
    new TextEncoder().encode(signed),
  );
  if (!ok) throw new Error("sesión inválida");
  return payload.sub;
}

// ---- Acceso a Firestore con la cuenta de servicio ----
let access = { token: null, exp: 0 };
async function serviceToken(env) {
  if (env.EMULATOR) return "owner";
  if (access.token && access.exp > Date.now() + 60e3) return access.token;
  const sa = JSON.parse(env.FIREBASE_SA);
  const now = Math.floor(Date.now() / 1000);
  const head = strToB64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = strToB64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const pem = sa.private_key.replace(/-----[^-]+-----|\s/g, "");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${head}.${body}`),
  );
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${head}.${body}.${bytesToB64url(sig)}`,
  });
  const data = await r.json();
  if (!data.access_token) throw new Error("sin acceso a Firestore");
  access = {
    token: data.access_token,
    exp: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return access.token;
}

function db(env) {
  const host = env.EMULATOR
    ? `http://${env.EMULATOR}:8080`
    : "https://firestore.googleapis.com";
  const name = `projects/${env.PROJECT_ID}/databases/(default)/documents`;
  const base = `${host}/v1/${name}`;
  async function call(url, body) {
    const r = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${await serviceToken(env)}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 404) return null;
    const data = await r.json();
    if (!r.ok) {
      const err = new Error(
        (data.error && data.error.message) || `Firestore ${r.status}`,
      );
      err.status = r.status;
      throw err;
    }
    return data;
  }
  return {
    name: (path) => `${name}/${path}`,
    get: (path) => call(`${base}/${path}`),
    // Varios documentos de una: devuelve { ruta: documento o null }.
    async getMany(paths) {
      const out = {};
      for (let i = 0; i < paths.length; i += 100) {
        const part = paths.slice(i, i + 100);
        const res = await call(`${base}:batchGet`, {
          documents: part.map((p) => `${name}/${p}`),
        });
        for (const r of res) {
          const full = r.found ? r.found.name : r.missing;
          out[full.slice(name.length + 1)] = r.found || null;
        }
      }
      return out;
    },
    query: (parent, structuredQuery) =>
      call(`${parent ? `${base}/${parent}` : base}:runQuery`, {
        structuredQuery,
      }),
    count: async (parent) => {
      const r = await call(`${base}/${parent}:runAggregationQuery`, {
        structuredAggregationQuery: {
          structuredQuery: { from: [{ collectionId: "scores" }] },
          aggregations: [{ alias: "n", count: {} }],
        },
      });
      const f = r && r[0] && r[0].result && r[0].result.aggregateFields;
      return f && f.n ? Number(f.n.integerValue) : 0;
    },
    commit: (writes) => call(`${base}:commit`, { writes }),
  };
}

// ---- Valores de Firestore ----
function val(v) {
  if (!v) return undefined;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return Date.parse(v.timestampValue);
  if ("stringValue" in v) return v.stringValue;
  if ("bytesValue" in v) return v.bytesValue;
  if ("mapValue" in v) {
    const o = {};
    for (const [k, x] of Object.entries(v.mapValue.fields || {})) o[k] = val(x);
    return o;
  }
  return undefined;
}
const field = (doc, k) => (doc && doc.fields ? val(doc.fields[k]) : undefined);

// Descomprime sin pasarse de `tope` bytes (un archivo armado a propósito podría ocupar gigas).
async function gunzipConTope(bytes, tope) {
  const reader = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"))
    .getReader();
  const partes = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > tope) {
      reader.cancel().catch(() => {});
      throw new Error("demasiado grande");
    }
    partes.push(value);
  }
  return new TextDecoder().decode(await new Blob(partes).arrayBuffer());
}

// Lecciones terminadas según el progreso guardado en la nube (users/{uid}, comprimido).
async function lessonsDone(doc) {
  try {
    let text = field(doc, "text");
    const gz = field(doc, "gz");
    if (!text && gz) {
      const bytes = Uint8Array.from(atob(gz), (c) => c.charCodeAt(0));
      text = await gunzipConTope(bytes, 4e6);
    }
    if (!text || !text.startsWith("V21:")) return 0;
    const bin = atob(text.slice(4));
    const st = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))),
    );
    return Object.values(st.lessons || {}).filter((l) => l && l.done).length;
  } catch {
    return 0;
  }
}

// `opts.onTime` solo lo cambian las pruebas (no se puede fechar un documento en el pasado).
async function premios(uid, env, now = Date.now(), opts = {}) {
  const d = db(env);
  const onTime = opts.onTime || savedOnTime;
  // Lo que ya ganó, su Premium y su progreso.
  const racha = [];
  for (let i = -1; i < RACHA_DIAS; i++) racha.push(dayKeyUTC(now - i * DAY));
  const docs = await d.getMany([
    `premios/${uid}`,
    `premium/${uid}`,
    `users/${uid}`,
    `amigos/${uid}`,
    `invita/${uid}`,
    ...racha.map((k) => `daily/${k}/scores/${uid}`),
  ]);
  const premiosDoc = docs[`premios/${uid}`];
  const premiumDoc = docs[`premium/${uid}`];
  const ganados = { ...(field(premiosDoc, "ganados") || {}) };

  // Racha: días con puntaje en el ranking, guardado el mismo día.
  const jugados = racha.filter((k) => {
    const doc = docs[`daily/${k}/scores/${uid}`];
    return doc && onTime(k, doc.createTime);
  });
  const run = longestRun(jugados);
  const lecciones = await lessonsDone(docs[`users/${uid}`]);

  // Podio: las últimas 4 semanas terminadas (si está activo: PODIO = "1" en wrangler.toml).
  const podios = [];
  const podioActivo = env.PODIO !== "0";
  for (let w = 1; podioActivo && w <= 4; w++) {
    const monday = mondayUTC(now - w * 7 * DAY);
    const parent = `weekly/${monday}`;
    const top = await d.query(parent, {
      from: [{ collectionId: "scores" }],
      orderBy: [
        { field: { fieldPath: "score" }, direction: "DESCENDING" },
        { field: { fieldPath: "t" }, direction: "ASCENDING" },
      ],
      limit: 3,
    });
    const mine = (top || []).find(
      (r) => r.document && r.document.name.endsWith(`/scores/${uid}`),
    );
    // El puntaje de la semana lo escribe la app: solo vale si no pasa de la suma de sus puntajes
    // diarios de esa semana guardados a tiempo (así no sirve escribir 840 a mano).
    let diarios = 0;
    for (let i = 0; i < 7; i++) {
      const k = dayKeyUTC(keyTime(monday) + i * DAY);
      const doc = docs[`daily/${k}/scores/${uid}`];
      if (doc && onTime(k, doc.createTime))
        diarios += Number(field(doc, "score")) || 0;
    }
    if (
      mine &&
      field(mine.document, "score") > 0 &&
      field(mine.document, "score") <= diarios &&
      onTime(monday, mine.document.createTime, 7) &&
      (await d.count(parent)) >= PODIO_MIN
    )
      podios.push(monday);
  }

  // Qué corresponde dar ahora.
  const merece = [];
  // Bienvenida: tener cuenta ya alcanza (la sesión de Google se verificó arriba). Se da recién
  // cuando la app está en Google Play (BIENVENIDA = "1" en wrangler.toml): antes, los días se
  // vencerían sin poder usarlos. Mientras tanto queda "pronto" y se da apenas se active.
  const bienvenida = env.BIENVENIDA === "1";
  if (bienvenida) merece.push({ id: "bienvenida", dias: 3, libre: true });
  if (run >= 7) merece.push({ id: "racha7", dias: 2 });
  if (run >= 30) merece.push({ id: "racha30", dias: 7 });
  if (lecciones >= 36) merece.push({ id: "graduacion", dias: 3 });
  for (const m of podios) merece.push({ id: `podio-${m}`, dias: 2 });

  // Invitar amigos (ver src/premios.js). Cada lado se da su premio cuando le toca revisar.
  // a) Si a esta cuenta la invitaron: vale cuando jugó el desafío AMIGO_META días en su plazo.
  const yoAmigo = docs[`amigos/${uid}`];
  let invitado = null;
  if (yoAmigo) {
    const t0 = field(yoAmigo, "t");
    const sus = await d.getMany(clavesDelPlazo(uid, t0));
    const dias = diasDeDesafio(sus, uid, t0, onTime);
    if (dias >= AMIGO_META)
      merece.push({ id: "invitado", dias: AMIGO_DIAS, libre: true });
    invitado = {
      dias: Math.min(dias, AMIGO_META),
      meta: AMIGO_META,
      vence: t0 + AMIGO_PLAZO * DAY,
    };
  }
  // b) Los amigos que invitó esta cuenta: hasta AMIGO_TOPE premios.
  const amigos = await misAmigos(d, uid, ganados, now, onTime);
  let cupo = AMIGO_TOPE - Object.keys(ganados).filter((k) => k.startsWith("amigo-")).length;
  for (const a of amigos)
    if (a.estado === "listo" && cupo > 0) {
      merece.push({ id: `amigo-${a.uid}`, dias: AMIGO_DIAS, libre: true });
      cupo--;
    }
  const nuevos = [];
  const tope = [];
  let usados = diasRecientes(ganados, now);
  for (const p of merece) {
    if (ganados[p.id]) continue;
    if (!p.libre && usados + p.dias > TOPE_DIAS) {
      tope.push(p.id);
      continue;
    }
    ganados[p.id] = { dias: p.dias, t: now };
    if (!p.libre) usados += p.dias;
    nuevos.push(p.id);
  }

  // Premium: se suman los días (si ya tenía Premium para siempre, no se toca).
  let hasta = null;
  const activo = field(premiumDoc, "activo") === true;
  const hastaPrev = field(premiumDoc, "hasta");
  const forever = activo && !hastaPrev;
  if (forever) hasta = true;
  else if (activo && hastaPrev > now) hasta = hastaPrev;
  if (nuevos.length) {
    const dias = nuevos.reduce((s, id) => s + ganados[id].dias, 0);
    const writes = [
      {
        update: {
          name: d.name(`premios/${uid}`),
          fields: {
            ganados: {
              mapValue: {
                fields: Object.fromEntries(
                  Object.entries(ganados).map(([k, g]) => [
                    k,
                    {
                      mapValue: {
                        fields: {
                          dias: { integerValue: String(g.dias) },
                          t: { integerValue: String(g.t) },
                        },
                      },
                    },
                  ]),
                ),
              },
            },
          },
        },
        // Si otro pedido cambió los premios mientras tanto, este no escribe (no se dan dos veces).
        currentDocument: premiosDoc
          ? { updateTime: premiosDoc.updateTime }
          : { exists: false },
      },
    ];
    if (!forever) {
      hasta = Math.max(now, typeof hasta === "number" ? hasta : 0) + dias * DAY;
      writes.push({
        update: {
          name: d.name(`premium/${uid}`),
          fields: {
            activo: { booleanValue: true },
            hasta: { timestampValue: new Date(hasta).toISOString() },
          },
        },
        updateMask: { fieldPaths: ["activo", "hasta"] },
      });
    }
    try {
      await d.commit(writes);
    } catch (e) {
      if (e.status === 400 || e.status === 409 || e.status === 412) {
        const err = new Error("otro pedido al mismo tiempo");
        err.retry = true;
        throw err;
      }
      throw e;
    }
  }

  const estado = (id, logrado) =>
    ganados[id]
      ? nuevos.includes(id)
        ? "nuevo"
        : "ganado"
      : tope.includes(id)
        ? "tope"
        : logrado
          ? "tope"
          : "progreso";
  const podiosGanados = Object.keys(ganados).filter((k) =>
    k.startsWith("podio-"),
  );
  const lista = PREMIOS.map((p) => {
    if (p.id === "podio" && !podioActivo && !podiosGanados.length)
      return { id: "podio", dias: p.dias, veces: 0, estado: "proximamente" };
    if (p.id === "podio")
      return {
        id: "podio",
        dias: p.dias,
        veces: podiosGanados.length,
        estado: podiosGanados.some((k) => nuevos.includes(k))
          ? "nuevo"
          : tope.some((k) => k.startsWith("podio-"))
            ? "tope"
            : "progreso",
      };
    if (p.id === "bienvenida" && !bienvenida && !ganados.bienvenida)
      return {
        id: p.id,
        dias: p.dias,
        meta: p.meta,
        progreso: 1,
        estado: "pronto",
      };
    const progreso =
      p.id === "bienvenida" ? 1 : p.id.startsWith("racha") ? run : lecciones;
    return {
      id: p.id,
      dias: p.dias,
      meta: p.meta,
      progreso: Math.min(progreso, p.meta),
      estado: estado(p.id, progreso >= p.meta),
    };
  });
  const codigo = await miCodigo(d, uid, docs[`invita/${uid}`]);
  const yaGanados = Object.keys(ganados).filter((k) => k.startsWith("amigo-")).length;
  return {
    premios: lista,
    invitar: {
      codigo,
      ganados: yaGanados,
      tope: AMIGO_TOPE,
      meta: AMIGO_META,
      plazo: AMIGO_PLAZO,
      dias: AMIGO_DIAS,
      amigos: amigos.map((a) => ({
        nick: a.nick,
        dias: a.dias,
        estado: ganados[`amigo-${a.uid}`]
          ? "ganado"
          : a.estado === "listo"
            ? "tope"
            : a.estado,
      })),
    },
    invitado: invitado && {
      ...invitado,
      estado: ganados.invitado
        ? nuevos.includes("invitado")
          ? "nuevo"
          : "ganado"
        : invitado.vence < now
          ? "vencido"
          : "progreso",
    },
    nuevos: nuevos.map((id) =>
      id.startsWith("podio-") ? "podio" : id.startsWith("amigo-") ? "amigo" : id,
    ),
    dias: nuevos.reduce((s, id) => s + ganados[id].dias, 0),
    hasta,
    usados,
    tope: TOPE_DIAS,
  };
}


// ---- Pagos en la web (Paddle) ----
// Premium comprado en la web (iPhone, computadora): Paddle cobra y avisa acá (webhook). Se anota en
// premium/{uid}, el mismo documento que leen la app y la web, así que vale en todos lados.
// - Pago único ("para siempre"): activo, sin fecha de vencimiento.
// - Suscripción: activo hasta el fin del período pagado, más 3 días de margen por si el cobro
//   siguiente se demora. Cada renovación lo estira. Si se cancela, vence solo al final del período.
// - Solo se estira, nunca se acorta: un aviso repetido o fuera de orden no hace daño, y los días de
//   regalo que ya tenía se respetan. Un reembolso se resuelve a mano (ver servidor/README.md).
// La firma (Paddle-Signature) se verifica con el secreto PADDLE_WEBHOOK_SECRET.
const MARGEN_PAGO = 3 * DAY;
const UID_OK = /^[A-Za-z0-9_-]{6,128}$/;

function hexDe(buf) {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function firmaPaddleOk(raw, cabecera, secreto, now = Date.now()) {
  if (!secreto || !cabecera) return false;
  const partes = Object.fromEntries(
    cabecera.split(";").map((x) => {
      const i = x.indexOf("=");
      return [x.slice(0, i).trim(), x.slice(i + 1).trim()];
    }),
  );
  const ts = Number(partes.ts);
  // Avisos de más de 5 minutos: se rechazan (alguien podría reenviar uno viejo).
  if (!ts || Math.abs(now / 1000 - ts) > 300 || !partes.h1) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const esperado = hexDe(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${partes.ts}:${raw}`),
    ),
  );
  // Comparación sin cortar antes (que no se pueda adivinar de a una letra).
  const h1 = String(partes.h1);
  let dif = esperado.length ^ h1.length;
  for (let i = 0; i < esperado.length; i++)
    dif |= esperado.charCodeAt(i) ^ (h1.charCodeAt(i) || 0);
  return dif === 0;
}

// Qué Premium corresponde por un aviso de Paddle: { uid, siempre } o { uid, hasta } (o null).
function premiumDePago(ev, env) {
  const d = ev && ev.data;
  if (!d || !d.custom_data || !UID_OK.test(String(d.custom_data.uid || "")))
    return null;
  const uid = String(d.custom_data.uid);
  const precios = (d.items || []).map((it) => it && it.price && it.price.id);
  if (ev.event_type === "transaction.completed") {
    if (env.PADDLE_PRECIO_SIEMPRE && precios.includes(env.PADDLE_PRECIO_SIEMPRE))
      return { uid, siempre: true, cliente: d.customer_id || "" };
    const fin = d.billing_period && Date.parse(d.billing_period.ends_at);
    return fin
      ? { uid, hasta: fin + MARGEN_PAGO, cliente: d.customer_id || "", sub: d.subscription_id || "" }
      : null;
  }
  if (
    /^subscription\.(created|activated|updated|resumed)$/.test(ev.event_type) &&
    (d.status === "active" || d.status === "trialing")
  ) {
    const fin =
      d.current_billing_period && Date.parse(d.current_billing_period.ends_at);
    return fin
      ? { uid, hasta: fin + MARGEN_PAGO, cliente: d.customer_id || "", sub: d.id || "" }
      : null;
  }
  return null;
}

async function anotarPago(p, env, now = Date.now()) {
  const d = db(env);
  const doc = await d.get(`premium/${p.uid}`);
  const activo = field(doc, "activo") === true;
  const hastaPrev = field(doc, "hasta");
  const pagoPrev = field(doc, "pago") || {};
  const forever = activo && !hastaPrev;
  // Ya es para siempre: solo se anota el pago.
  const siempre = p.siempre || forever;
  const hasta = siempre
    ? null
    : Math.max(p.hasta, activo && hastaPrev > now ? hastaPrev : 0);
  const pago = {
    fuente: { stringValue: "paddle" },
    tipo: { stringValue: p.siempre ? "siempre" : pagoPrev.tipo === "siempre" ? "siempre" : "suscripcion" },
    cliente: { stringValue: String(p.cliente || pagoPrev.cliente || "").slice(0, 80) },
    sub: { stringValue: String(p.sub || pagoPrev.sub || "").slice(0, 80) },
    t: { integerValue: String(now) },
  };
  const fields = { activo: { booleanValue: true }, pago: { mapValue: { fields: pago } } };
  if (!siempre) fields.hasta = { timestampValue: new Date(hasta).toISOString() };
  // Sin "hasta" en los campos pero sí en la máscara: Firestore lo borra (queda para siempre).
  await d.commit([
    {
      update: { name: d.name(`premium/${p.uid}`), fields },
      updateMask: { fieldPaths: ["activo", "hasta", "pago"] },
    },
  ]);
  return { uid: p.uid, hasta: siempre ? true : hasta };
}

async function avisoPaddle(req, env) {
  const raw = await req.text();
  if (raw.length > 200000) return new Response("grande", { status: 413 });
  if (
    !(await firmaPaddleOk(
      raw,
      req.headers.get("Paddle-Signature"),
      env.PADDLE_WEBHOOK_SECRET,
    ))
  )
    return new Response("firma", { status: 401 });
  let ev;
  try {
    ev = JSON.parse(raw);
  } catch {
    return new Response("json", { status: 400 });
  }
  const p = premiumDePago(ev, env);
  // Avisos que no cambian nada (otros eventos, cancelaciones): se contestan bien igual, para que
  // Paddle no los reintente.
  if (!p) return new Response("ok", { status: 200 });
  try {
    await anotarPago(p, env);
    return new Response("ok", { status: 200 });
  } catch {
    // Un 500 hace que Paddle lo reintente más tarde.
    return new Response("error", { status: 500 });
  }
}


// ---- Invitar amigos ----
const CODIGO_LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODIGO_OK = /^[A-HJ-NP-Z2-9]{6}$/;
// Los puntajes del desafío de `uid` en su plazo de amigo (desde el día antes de entrar).
function clavesDelPlazo(uid, t0) {
  const claves = [];
  for (let i = -1; i <= AMIGO_PLAZO; i++)
    claves.push(`daily/${dayKeyUTC(t0 + i * DAY)}/scores/${uid}`);
  return claves;
}
// Días distintos con puntaje del desafío (guardado ese día) entre que entró y su plazo.
function diasDeDesafio(docs, uid, t0, onTime) {
  let n = 0;
  for (let i = -1; i <= AMIGO_PLAZO; i++) {
    const k = dayKeyUTC(t0 + i * DAY);
    const doc = docs[`daily/${k}/scores/${uid}`];
    if (doc && onTime(k, doc.createTime) && Date.parse(doc.createTime) >= t0 - DAY)
      n++;
  }
  return n;
}
// Los amigos que invitó `uid`, con cuántos días jugó cada uno: "listo" (cumplió y falta darle el
// premio a quien invitó), "progreso" o "vencido".
async function misAmigos(d, uid, ganados, now, onTime) {
  const r = await d.query("", {
    from: [{ collectionId: "amigos" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "por" },
        op: "EQUAL",
        value: { stringValue: uid },
      },
    },
    limit: 40,
  });
  const lista = (r || [])
    .filter((x) => x.document)
    .map((x) => ({
      uid: x.document.name.split("/").pop(),
      t: field(x.document, "t"),
      nick: field(x.document, "nick") || "Amigo",
    }))
    .sort((a, b) => a.t - b.t);
  const out = [];
  for (const a of lista) {
    if (ganados[`amigo-${a.uid}`]) {
      out.push({ ...a, dias: AMIGO_META, estado: "ganado" });
      continue;
    }
    const sus = await d.getMany(clavesDelPlazo(a.uid, a.t));
    const dias = diasDeDesafio(sus, a.uid, a.t, onTime);
    out.push({
      ...a,
      dias: Math.min(dias, AMIGO_META),
      estado:
        dias >= AMIGO_META
          ? "listo"
          : now > a.t + AMIGO_PLAZO * DAY
            ? "vencido"
            : "progreso",
    });
  }
  return out;
}
// El código para invitar de `uid` (se crea la primera vez).
async function miCodigo(d, uid, invitaDoc) {
  const ya = field(invitaDoc, "codigo");
  if (ya) return ya;
  for (let intento = 0; intento < 4; intento++) {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const codigo = [...bytes]
      .map((b) => CODIGO_LETRAS[b % CODIGO_LETRAS.length])
      .join("");
    try {
      await d.commit([
        {
          update: {
            name: d.name(`codigos/${codigo}`),
            fields: { uid: { stringValue: uid } },
          },
          currentDocument: { exists: false },
        },
        {
          update: {
            name: d.name(`invita/${uid}`),
            fields: { codigo: { stringValue: codigo } },
          },
          currentDocument: { exists: false },
        },
      ]);
      return codigo;
    } catch (e) {
      // Ese código ya existía, o se creó al mismo tiempo en otro pedido.
      if (e.status !== 400 && e.status !== 409) throw e;
      const otra = await d.get(`invita/${uid}`);
      if (field(otra, "codigo")) return field(otra, "codigo");
    }
  }
  return null;
}
// Nombre corto para que quien invitó vea quién es: "Ana P." (nada más).
function nombreCorto(n) {
  const p = String(n || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!p.length) return "Amigo";
  const r = p[0].slice(0, 14) + (p[1] ? ` ${p[1][0].toUpperCase()}.` : "");
  return r.replace(/[<>&"]/g, "");
}
// ¿Cuándo se creó esta cuenta de Google en Firebase? (para aceptar solo cuentas nuevas)
async function cuentaCreada(idToken, env) {
  const host = env.EMULATOR
    ? `http://${env.EMULATOR}:9099/identitytoolkit.googleapis.com`
    : "https://identitytoolkit.googleapis.com";
  const r = await fetch(`${host}/v1/accounts:lookup?key=${env.API_KEY || "x"}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await r.json();
  const u = data && data.users && data.users[0];
  return u ? Number(u.createdAt) : 0;
}
// Unirse con el código de quien te invitó. Solo cuentas creadas hace menos de 3 días, una vez.
async function unirme(uid, idToken, codigo, env, now = Date.now()) {
  if (!CODIGO_OK.test(String(codigo || ""))) return { estado: "invalido" };
  const d = db(env);
  const [cod, ya] = await Promise.all([d.get(`codigos/${codigo}`), d.get(`amigos/${uid}`)]);
  const por = field(cod, "uid");
  if (!por) return { estado: "invalido" };
  if (por === uid) return { estado: "propio" };
  if (ya) return { estado: "ya" };
  const creada = await cuentaCreada(idToken, env);
  if (!creada || now - creada > 3 * DAY) return { estado: "vieja" };
  let nick = "Amigo";
  try {
    nick = nombreCorto(decodeJwt(idToken).payload.name);
  } catch {
    // sin nombre
  }
  try {
    await d.commit([
      {
        update: {
          name: d.name(`amigos/${uid}`),
          fields: {
            por: { stringValue: por },
            t: { integerValue: String(now) },
            nick: { stringValue: nick },
          },
        },
        currentDocument: { exists: false },
      },
    ]);
  } catch (e) {
    if (e.status === 400 || e.status === 409) return { estado: "ya" };
    throw e;
  }
  return { estado: "ok" };
}

// Al borrar la cuenta: se borran sus premios y el Premium de regalo. El Premium para siempre
// (puesto a mano o comprado) y el pagado en la web quedan, por si vuelve a entrar con la misma
// cuenta (o para pasarlo a mano a la nueva, ver servidor/README.md).
async function borrar(uid, env) {
  const d = db(env);
  const [premium, invita] = await Promise.all([
    d.get(`premium/${uid}`),
    d.get(`invita/${uid}`),
  ]);
  const writes = [
    { delete: d.name(`premios/${uid}`) },
    { delete: d.name(`amigos/${uid}`) },
    { delete: d.name(`invita/${uid}`) },
  ];
  if (field(invita, "codigo"))
    writes.push({ delete: d.name(`codigos/${field(invita, "codigo")}`) });
  if (premium && field(premium, "hasta") && !field(premium, "pago"))
    writes.push({ delete: d.name(`premium/${uid}`) });
  await d.commit(writes);
}

// ---- Limpieza diaria (Cron de Cloudflare) ----
// Borra los puntajes del ranking de hace más de 60 días y los errores y reportes vencidos. Firebase
// lo podría hacer solo (TTL), pero pide activar la facturación. Mira una franja de días (no solo
// ayer) por si algún día no corrió. Los premios miran como mucho 42 días para atrás.
const GUARDAR_DIAS = 60;
const FRANJA_DIAS = 14;
async function limpiar(env, now = Date.now()) {
  const d = db(env);
  const padres = new Set();
  for (let i = GUARDAR_DIAS + 1; i <= GUARDAR_DIAS + FRANJA_DIAS; i++) {
    padres.add(`daily/${dayKeyUTC(now - i * DAY)}`);
    padres.add(`weekly/${mondayUTC(now - (i + 7) * DAY)}`);
  }
  const nombres = [];
  const soloNombre = {
    select: { fields: [{ fieldPath: "__name__" }] },
    limit: 500,
  };
  for (const p of padres) {
    const r = await d.query(p, {
      from: [{ collectionId: "scores" }],
      ...soloNombre,
    });
    for (const x of r || []) if (x.document) nombres.push(x.document.name);
  }
  for (const coleccion of ["errores", "reportes"]) {
    const vencidos = await d.query("", {
      from: [{ collectionId: coleccion }],
      where: {
        fieldFilter: {
          field: { fieldPath: "expireAt" },
          op: "LESS_THAN",
          value: { timestampValue: new Date(now).toISOString() },
        },
      },
      ...soloNombre,
    });
    for (const x of vencidos || [])
      if (x.document) nombres.push(x.document.name);
  }
  // Medición: los aparatos que no abren la app hace más de 60 días.
  const viejas = await d.query("", {
    from: [{ collectionId: "instalaciones" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "ult" },
        op: "LESS_THAN",
        value: { stringValue: diaAR(now - MED_DIAS * DAY) },
      },
    },
    ...soloNombre,
  });
  for (const x of viejas || []) if (x.document) nombres.push(x.document.name);
  for (let i = 0; i < nombres.length; i += 500)
    await d.commit(nombres.slice(i, i + 500).map((n) => ({ delete: n })));
  return nombres.length;
}


// ---- Medición anónima ----
// La app manda eventos sueltos (abrió la app hoy, terminó su primera lección, entró con Google…)
// con un identificador al azar del aparato, que no se une a la cuenta ni a nada personal. No se
// guarda la IP. Acá solo se suman contadores por día (metricas/{día}) y, por aparato, el día que
// llegó y el último que abrió (instalaciones/{id}, se borra a los 60 días sin abrir), para saber
// cuántos vuelven al día siguiente y a la semana. Ver la sección "Estadísticas" en privacidad.html.
const HITOS = [
  "empezar",
  "leccion1",
  "leccion3",
  "seccion1",
  "test",
  "entreno",
  "mesa",
  "conteo",
  "desafio",
  "cuenta",
  "premium",
  "compra",
];
const PLATS = ["android", "iphone-app", "iphone", "compu-app", "compu", "celu"];
const ID_OK = /^[a-z0-9]{8,24}$/;
const MED_DIAS = 60;
// El día en la hora de Argentina (UTC−3): el panel lo lee el dueño, que está ahí.
const diaAR = (t) => new Date(t - 3 * 3600e3).toISOString().slice(0, 10);
const diasEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
function sumar(d, dia, campos) {
  return {
    transform: {
      document: d.name(`metricas/${dia}`),
      fieldTransforms: campos.map((c) => ({
        fieldPath: c,
        increment: { integerValue: "1" },
      })),
    },
  };
}

async function medir(req, env, now = Date.now()) {
  const raw = await req.text();
  if (raw.length > 2000) return 413;
  let m;
  try {
    m = JSON.parse(raw);
  } catch {
    return 400;
  }
  const ev = String(m && m.e);
  const id = String(m && m.id);
  if (!ID_OK.test(id) || !(ev === "nuevo" || ev === "activo" || HITOS.includes(ev)))
    return 400;
  const plat = PLATS.includes(m.p) ? m.p : "otra";
  const src = /^[a-z0-9_]{1,24}$/.test(m.src || "") ? m.src : "otro";
  const d = db(env);
  const dia = diaAR(now);
  const nombre = `instalaciones/${id}`;
  const inst = await d.get(nombre);
  const d0 = field(inst, "d0");
  const ult = field(inst, "ult");
  const writes = [];
  const nueva = () => ({
    update: {
      name: d.name(nombre),
      fields: {
        d0: { stringValue: dia },
        ult: { stringValue: dia },
        p: { stringValue: plat },
        src: { stringValue: src },
      },
    },
    currentDocument: { exists: false },
  });
  if (ev === "nuevo") {
    if (inst) return 200; // ya estaba: no se cuenta dos veces
    writes.push(nueva(), sumar(d, dia, ["e.nuevo", "e.activo", `src.${src}`, `plat.${plat}`]));
  } else if (ev === "activo") {
    if (!inst) {
      // Un aparato de antes de la medición: cuenta como activo, sin día de llegada conocido.
      writes.push(nueva(), sumar(d, dia, ["e.activo"]));
    } else if (ult !== dia) {
      const campos = ["e.activo"];
      writes.push({
        update: { name: d.name(nombre), fields: { ult: { stringValue: dia } } },
        updateMask: { fieldPaths: ["ult"] },
      });
      writes.push(sumar(d, dia, campos));
      const n = diasEntre(d0, dia);
      if (n === 1) writes.push(sumar(d, d0, ["r.d1"]));
      if (n === 7) writes.push(sumar(d, d0, ["r.d7"]));
      // Volvió alguna vez en la primera semana (cuenta una sola vez por aparato).
      if (n >= 1 && n <= 7 && !field(inst, "volvio")) {
        writes.push({
          update: { name: d.name(nombre), fields: { volvio: { booleanValue: true } } },
          updateMask: { fieldPaths: ["volvio"] },
        });
        writes.push(sumar(d, d0, ["r.semana"]));
      }
    } else return 200;
  } else {
    // Un hito: el día que pasó y, si se sabe, el día que llegó ese aparato (para el embudo).
    writes.push(sumar(d, dia, [`e.${ev}`]));
    if (d0) writes.push(sumar(d, d0, [`c.${ev}`]));
  }
  try {
    await d.commit(writes);
  } catch (e) {
    // Dos "nuevo" casi juntos del mismo aparato: el segundo no cuenta.
    if (e.status === 400 || e.status === 409) return 200;
    throw e;
  }
  return 200;
}

// Panel del dueño: los contadores de los últimos días (solo para las cuentas de DUENOS).
async function panel(uid, env, now = Date.now(), dias = 30) {
  const duenos = String(env.DUENOS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (!duenos.includes(uid)) return null;
  const d = db(env);
  const claves = [];
  for (let i = 0; i < Math.min(90, Math.max(1, dias)); i++)
    claves.push(diaAR(now - i * DAY));
  const docs = await d.getMany(claves.map((k) => `metricas/${k}`));
  return {
    hoy: claves[0],
    dias: claves.map((k) => {
      const doc = docs[`metricas/${k}`];
      return {
        dia: k,
        e: field(doc, "e") || {},
        c: field(doc, "c") || {},
        r: field(doc, "r") || {},
        src: field(doc, "src") || {},
        plat: field(doc, "plat") || {},
      };
    }),
  };
}

// ---- Límites de uso ----
// Cada cuenta (o cada conexión, para los errores) puede hacer unos pocos pedidos por minuto: así
// nadie gasta la cuota gratis de la base de datos a propósito. Usa el limitador de Cloudflare
// (wrangler.toml) y, si no está, uno en memoria.
const ventanas = new Map();
async function dentroDelLimite(env, nombre, clave, porMinuto) {
  const lim = env[nombre];
  if (lim && typeof lim.limit === "function") {
    try {
      return (await lim.limit({ key: clave })).success;
    } catch {
      // Sigue con el de memoria.
    }
  }
  const ahora = Date.now();
  const k = `${nombre}:${clave}`;
  let v = ventanas.get(k);
  if (!v || ahora - v.desde > 60e3) v = { desde: ahora, n: 0 };
  v.n++;
  ventanas.set(k, v);
  if (ventanas.size > 5000)
    for (const [kk, vv] of ventanas)
      if (ahora - vv.desde > 60e3) ventanas.delete(kk);
  return v.n <= porMinuto;
}
const muchos = (req) =>
  json(req, 429, { error: "Demasiados pedidos: probá en un minuto" });

// ---- Errores de la app ----
// La app manda acá sus errores (sin datos de la persona) y el servidor los guarda en errores/,
// recortados, con un límite por conexión. Vencen a los 90 días (los borra limpiar()).
const txt = (v, max) => String(v == null ? "" : v).slice(0, max);
async function guardarError(req, env) {
  let b;
  try {
    const raw = await req.text();
    if (raw.length > 8000) throw new Error("grande");
    b = JSON.parse(raw);
  } catch {
    return json(req, 400, { error: "mal formado" });
  }
  const now = Date.now();
  const fields = {
    msg: { stringValue: txt(b.msg, 300) || "error" },
    stack: { stringValue: txt(b.stack, 1500) },
    where: { stringValue: txt(b.where, 200) },
    version: { stringValue: txt(b.version, 20) },
    plataforma: {
      stringValue: b.plataforma === "android" ? "android" : "web",
    },
    idioma: { stringValue: txt(b.idioma, 10) },
    t: { integerValue: String(now) },
    expireAt: { timestampValue: new Date(now + 90 * DAY).toISOString() },
  };
  const d = db(env);
  await d.commit([
    { update: { name: d.name(`errores/${crypto.randomUUID()}`), fields } },
  ]);
  return json(req, 200, { ok: true });
}

// ---- Reportes de nombres del ranking ----
// Alguien reporta un nombre ofensivo: se guarda en reportes/ para revisarlo a mano (ver
// CUENTA_GOOGLE.md, "Moderar el ranking"). Vencen a los 90 días.
async function guardarReporte(req, env) {
  let b;
  try {
    const raw = await req.text();
    if (raw.length > 2000) throw new Error("grande");
    b = JSON.parse(raw);
  } catch {
    return json(req, 400, { error: "mal formado" });
  }
  const tipo = b.tipo === "weekly" ? "weekly" : "daily";
  const clave = String(b.clave || "");
  const uid = String(b.uid || "");
  if (!/^20\d\d-\d\d-\d\d$/.test(clave) || !/^[A-Za-z0-9_-]{1,128}$/.test(uid))
    return json(req, 400, { error: "mal formado" });
  const now = Date.now();
  const d = db(env);
  await d.commit([
    {
      update: {
        name: d.name(`reportes/${crypto.randomUUID()}`),
        fields: {
          puntaje: { stringValue: `${tipo}/${clave}/scores/${uid}` },
          nombre: { stringValue: txt(b.nombre, 40) },
          t: { integerValue: String(now) },
          expireAt: { timestampValue: new Date(now + 90 * DAY).toISOString() },
        },
      },
    },
  ]);
  return json(req, 200, { ok: true });
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(limpiar(env));
  },
  async fetch(req, env) {
    if (req.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url);
    const route = url.pathname;
    // Avisos de pago de Paddle (los firma Paddle; no pasan por la sesión ni por CORS).
    if (route === "/pagos/paddle" && req.method === "POST")
      return avisoPaddle(req, env);
    // Medición anónima (la app la manda con sendBeacon: no espera respuesta).
    if (route === "/m" && req.method === "POST") {
      const ip = req.headers.get("CF-Connecting-IP") || "local";
      if (!(await dentroDelLimite(env, "LIMITE_IP", `m:${ip}`, 10)))
        return muchos(req);
      try {
        return new Response(null, { status: await medir(req, env), headers: cors(req) });
      } catch {
        return new Response(null, { status: 500, headers: cors(req) });
      }
    }
    // Panel del dueño (con su sesión de Google).
    if (route === "/panel" && req.method === "GET") {
      let quien;
      try {
        const auth = req.headers.get("Authorization") || "";
        quien = await verifyIdToken(auth.replace(/^Bearer\s+/i, ""), env);
      } catch {
        return json(req, 401, { error: "Entrá con tu cuenta de Google" });
      }
      try {
        const r = await panel(quien, env, Date.now(), Number(url.searchParams.get("dias")) || 30);
        return r ? json(req, 200, r) : json(req, 403, { error: "Solo para el dueño" });
      } catch {
        return json(req, 500, { error: "No se pudo leer" });
      }
    }
    if (
      !["/premios", "/borrar", "/errores", "/reportar", "/amigos"].includes(route) ||
      req.method !== "POST"
    )
      return json(req, 404, { error: "no existe" });
    if (route === "/errores" || route === "/reportar") {
      const ip = req.headers.get("CF-Connecting-IP") || "local";
      if (!(await dentroDelLimite(env, "LIMITE_IP", ip, 10)))
        return muchos(req);
      try {
        return route === "/errores"
          ? await guardarError(req, env)
          : await guardarReporte(req, env);
      } catch {
        return json(req, 500, { error: "No se pudo guardar" });
      }
    }
    let uid;
    try {
      const auth = req.headers.get("Authorization") || "";
      uid = await verifyIdToken(auth.replace(/^Bearer\s+/i, ""), env);
    } catch {
      return json(req, 401, { error: "Entrá con tu cuenta de Google" });
    }
    if (!(await dentroDelLimite(env, "LIMITE_CUENTA", uid, 6)))
      return muchos(req);
    if (route === "/amigos") {
      try {
        const body = await req.json().catch(() => ({}));
        const auth = req.headers.get("Authorization") || "";
        return json(
          req,
          200,
          await unirme(uid, auth.replace(/^Bearer\s+/i, ""), body.codigo, env),
        );
      } catch {
        return json(req, 500, { error: "No se pudo" });
      }
    }
    if (route === "/borrar") {
      try {
        await borrar(uid, env);
        return json(req, 200, { ok: true });
      } catch {
        return json(req, 500, { error: "No se pudo borrar" });
      }
    }
    for (let i = 0; i < 2; i++) {
      try {
        return json(req, 200, await premios(uid, env));
      } catch (e) {
        if (!e.retry || i === 1)
          return json(req, 500, { error: "No se pudo revisar los premios" });
      }
    }
    return json(req, 500, { error: "No se pudo revisar los premios" });
  },
};

export {
  unirme,
  diaAR,
  medir,
  panel,
  anotarPago,
  avisoPaddle,
  borrar,
  firmaPaddleOk,
  premiumDePago,
  dentroDelLimite,
  gunzipConTope,
  limpiar,
  premios,
  serviceToken,
  verifyIdToken,
};
