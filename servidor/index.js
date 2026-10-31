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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

// Lecciones terminadas según el progreso guardado en la nube (users/{uid}, comprimido).
async function lessonsDone(doc) {
  try {
    let text = field(doc, "text");
    const gz = field(doc, "gz");
    if (!text && gz) {
      const bytes = Uint8Array.from(atob(gz), (c) => c.charCodeAt(0));
      const stream = new Blob([bytes])
        .stream()
        .pipeThrough(new DecompressionStream("gzip"));
      text = await new Response(stream).text();
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

  // Podio: las últimas 4 semanas terminadas.
  const podios = [];
  for (let w = 1; w <= 4; w++) {
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
  if (run >= 7) merece.push({ id: "racha7", dias: 2 });
  if (run >= 30) merece.push({ id: "racha30", dias: 7 });
  if (lecciones >= 36) merece.push({ id: "graduacion", dias: 3 });
  for (const m of podios) merece.push({ id: `podio-${m}`, dias: 2 });
  const nuevos = [];
  const tope = [];
  let usados = diasRecientes(ganados, now);
  for (const p of merece) {
    if (ganados[p.id]) continue;
    if (usados + p.dias > TOPE_DIAS) {
      tope.push(p.id);
      continue;
    }
    ganados[p.id] = { dias: p.dias, t: now };
    usados += p.dias;
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
    const progreso = p.id.startsWith("racha") ? run : lecciones;
    return {
      id: p.id,
      dias: p.dias,
      meta: p.meta,
      progreso: Math.min(progreso, p.meta),
      estado: estado(p.id, progreso >= p.meta),
    };
  });
  return {
    premios: lista,
    nuevos: nuevos.map((id) => (id.startsWith("podio-") ? "podio" : id)),
    dias: nuevos.reduce((s, id) => s + ganados[id].dias, 0),
    hasta,
    usados,
    tope: TOPE_DIAS,
  };
}

// Al borrar la cuenta: se borran sus premios y el Premium de regalo. El Premium para siempre
// (puesto a mano o comprado) queda, por si vuelve a entrar con la misma cuenta.
async function borrar(uid, env) {
  const d = db(env);
  const premium = await d.get(`premium/${uid}`);
  const writes = [{ delete: d.name(`premios/${uid}`) }];
  if (premium && field(premium, "hasta"))
    writes.push({ delete: d.name(`premium/${uid}`) });
  await d.commit(writes);
}

// ---- Limpieza diaria (Cron de Cloudflare) ----
// Borra los puntajes del ranking de hace más de 60 días y los reportes de errores vencidos. Firebase
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
  const vencidos = await d.query("", {
    from: [{ collectionId: "errores" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "expireAt" },
        op: "LESS_THAN",
        value: { timestampValue: new Date(now).toISOString() },
      },
    },
    ...soloNombre,
  });
  for (const x of vencidos || []) if (x.document) nombres.push(x.document.name);
  for (let i = 0; i < nombres.length; i += 500)
    await d.commit(nombres.slice(i, i + 500).map((n) => ({ delete: n })));
  return nombres.length;
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
    if ((route !== "/premios" && route !== "/borrar") || req.method !== "POST")
      return json(req, 404, { error: "no existe" });
    let uid;
    try {
      const auth = req.headers.get("Authorization") || "";
      uid = await verifyIdToken(auth.replace(/^Bearer\s+/i, ""), env);
    } catch {
      return json(req, 401, { error: "Entrá con tu cuenta de Google" });
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

export { borrar, limpiar, premios, serviceToken, verifyIdToken };
