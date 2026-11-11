// Prueba del servidor de premios (servidor/index.js) contra los emuladores de Firebase.
// Uso: npx firebase-tools emulators:exec --project demo-edge21 --only auth,firestore "node tests/servidor.mjs"
import worker, { borrar, diaAR, gunzipConTope, medir, panel, unirme, limpiar, premios, serviceToken, verifyIdToken } from "../servidor/index.js";
import { DAY, dayKeyUTC, diasRecientes, mondayUTC } from "../src/premios.js";

const P = "demo-edge21";
// Sin límite de pedidos en las pruebas de premios (los límites se prueban aparte, al final).
const sinLimite = { limit: async () => ({ success: true }) };
const env = { PROJECT_ID: P, EMULATOR: "127.0.0.1", BIENVENIDA: "1", LIMITE_CUENTA: sinLimite, LIMITE_IP: sinLimite };
const FS = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
const always = () => true;
const fails = [];
function check(c, msg) {
  if (!c) throw new Error(msg);
}
async function paso(nombre, fn) {
  try {
    await fn();
    console.log(`✓ ${nombre}`);
  } catch (e) {
    fails.push(nombre);
    console.log(`✗ ${nombre}: ${e.message}`);
  }
}
async function user() {
  const r = await fetch(`${AUTH}/accounts:signUp?key=x`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  const d = await r.json();
  return { uid: d.localId, token: d.idToken };
}
function fields(o) {
  const f = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "boolean") f[k] = { booleanValue: v };
    else if (typeof v === "number") f[k] = { integerValue: String(v) };
    else if (v instanceof Date) f[k] = { timestampValue: v.toISOString() };
    else f[k] = { stringValue: String(v) };
  }
  return { fields: f };
}
async function put(path, o) {
  const r = await fetch(`${FS}/${path}`, {
    method: "PATCH",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify(fields(o)),
  });
  check(r.ok, `no se pudo escribir ${path}`);
}
async function get(path) {
  const r = await fetch(`${FS}/${path}`, { headers: { Authorization: "Bearer owner" } });
  return r.status === 404 ? null : r.json();
}
async function hastaDe(uid) {
  const d = await get(`premium/${uid}`);
  return d && d.fields.hasta ? Date.parse(d.fields.hasta.timestampValue) : 0;
}
async function racha(uid, n) {
  const now = Date.now();
  for (let i = 0; i < n; i++)
    await put(`daily/${dayKeyUTC(now - i * DAY)}/scores/${uid}`, { name: "x", score: 100, ok: true, t: now });
}
const call = (token, origin = "https://edge21.app") =>
  worker.fetch(
    new Request("https://api.edge21.app/premios", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Origin: origin },
    }),
    env,
  );
const estado = (r, id) => r.premios.find((p) => p.id === id).estado;

await paso("sin sesión o con una sesión trucha: no entra", async () => {
  check((await call("")).status === 401, "sin sesión debería dar 401");
  const fake = `${btoa(JSON.stringify({ alg: "none" }))}.${btoa(JSON.stringify({ aud: "otro", iss: "x", sub: "y", exp: 9e9, iat: 1 }))}.`;
  check((await call(fake)).status === 401, "una sesión de otro proyecto debería dar 401");
});

await paso("cuenta nueva: todo en progreso y CORS para la web", async () => {
  const u = await user();
  const r = await call(u.token);
  check(r.status === 200, `respondió ${r.status}`);
  check(r.headers.get("Access-Control-Allow-Origin") === "https://edge21.app", "falta CORS");
  const d = await r.json();
  // Lo único que da una cuenta nueva es la bienvenida: 3 días.
  check(d.nuevos.length === 1 && d.nuevos[0] === "bienvenida" && d.dias === 3, JSON.stringify(d));
  check(d.premios.filter((p) => p.id !== "bienvenida").every((p) => p.estado === "progreso"), JSON.stringify(d.premios));
});

await paso("trampa: puntajes de días pasados escritos hoy no cuentan para la racha", async () => {
  const u = await user();
  await racha(u.uid, 10);
  const d = await (await call(u.token)).json();
  check(estado(d, "racha7") === "progreso", `racha7 quedó ${estado(d, "racha7")}`);
  // Solo los 3 días de bienvenida, nada por la racha.
  check(d.dias === 3 && d.nuevos.join() === "bienvenida", `dio ${d.dias} días: ${JSON.stringify(d.nuevos)}`);
});

await paso("antes de salir en Play, la bienvenida queda en espera", async () => {
  const u = await user();
  const d = await premios(u.uid, { ...env, BIENVENIDA: "0" }, Date.now(), { onTime: always });
  check(d.dias === 0 && estado(d, "bienvenida") === "pronto", JSON.stringify(d));
  const d2 = await premios(u.uid, env, Date.now(), { onTime: always });
  check(d2.dias === 3 && estado(d2, "bienvenida") === "nuevo", `al activarla no la dio: ${JSON.stringify(d2)}`);
});

await paso("racha de 7 días: 2 días de Premium, una sola vez", async () => {
  const u = await user();
  await racha(u.uid, 7);
  const now = Date.now();
  const d = await premios(u.uid, env, now, { onTime: always });
  // 2 de la racha + 3 de bienvenida.
  check(estado(d, "racha7") === "nuevo" && d.dias === 5, JSON.stringify(d));
  const h = await hastaDe(u.uid);
  check(Math.abs(h - (now + 5 * DAY)) < 5000, "la fecha de Premium no es dentro de 5 días");
  const d2 = await premios(u.uid, env, Date.now(), { onTime: always });
  check(estado(d2, "racha7") === "ganado" && d2.dias === 0, "lo dio dos veces");
  check((await hastaDe(u.uid)) === h, "cambió la fecha la segunda vez");
});

await paso("racha de 30, graduación y podio suman, con tope de 14 días por mes", async () => {
  const u = await user();
  await racha(u.uid, 30);
  // Progreso con las 36 lecciones terminadas (como lo guarda la app).
  const lessons = Object.fromEntries(Array.from({ length: 36 }, (_, i) => [`l${i + 1}`, { done: true }]));
  const code = "V21:" + Buffer.from(JSON.stringify({ lessons })).toString("base64");
  await put(`users/${u.uid}`, { text: code, updatedAt: Date.now() });
  // Podio de la semana pasada, con 12 jugadores.
  const monday = mondayUTC(Date.now() - 7 * DAY);
  for (let i = 0; i < 11; i++) await put(`weekly/${monday}/scores/otro${i}`, { name: `o${i}`, score: 100 + i, t: 1 });
  await put(`weekly/${monday}/scores/${u.uid}`, { name: "yo", score: 700, t: 1 });
  // Y otro podio, dos semanas atrás: ese ya no entra en el tope.
  const monday2 = mondayUTC(Date.now() - 14 * DAY);
  for (let i = 0; i < 11; i++) await put(`weekly/${monday2}/scores/otro${i}`, { name: `o${i}`, score: 100 + i, t: 1 });
  await put(`weekly/${monday2}/scores/${u.uid}`, { name: "yo", score: 700, t: 1 });
  const d = await premios(u.uid, env, Date.now(), { onTime: always });
  // 2 + 7 + 3 + 2 = 14 (el tope), más los 3 de bienvenida, que no cuentan; el segundo podio espera.
  check(d.dias === 17, `dio ${d.dias} días: ${JSON.stringify(d.nuevos)}`);
  check(estado(d, "racha30") === "nuevo" && estado(d, "graduacion") === "nuevo", JSON.stringify(d.premios));
  check(estado(d, "podio") === "nuevo", "el podio no se dio");
  const d2 = await premios(u.uid, env, Date.now(), { onTime: always });
  check(d2.dias === 0 && estado(d2, "podio") === "tope", `el tope no frenó: ${JSON.stringify(d2)}`);
  // Los días de hace más de un mes ya no cuentan para el tope.
  check(diasRecientes({ a: { dias: 14, t: 0 } }, 31 * DAY) === 0, "el tope no se libera al mes");
});

await paso("podio en una semana con pocos jugadores: no cuenta", async () => {
  const u = await user();
  const monday = mondayUTC(Date.now() - 21 * DAY);
  for (let i = 0; i < 7; i++) await put(`daily/${dayKeyUTC(Date.parse(monday) + i * DAY)}/scores/${u.uid}`, { name: "solo", score: 120, ok: true, t: 1 });
  await put(`weekly/${monday}/scores/${u.uid}`, { name: "solo", score: 840, t: 1 });
  const d = await premios(u.uid, env, Date.now(), { onTime: always });
  check(estado(d, "podio") === "progreso", "dio podio con un solo jugador");
});

await paso("podio en pausa (PODIO = 0): no se da aunque gane, y figura como próximamente", async () => {
  const u = await user();
  const monday = mondayUTC(Date.now() - 7 * DAY);
  for (let i = 0; i < 7; i++) await put(`daily/${dayKeyUTC(Date.parse(monday) + i * DAY)}/scores/${u.uid}`, { name: "yo", score: 120, ok: true, t: 1 });
  for (let i = 0; i < 11; i++) await put(`weekly/${monday}/scores/pausa${i}`, { name: `o${i}`, score: 100 + i, t: 1 });
  await put(`weekly/${monday}/scores/${u.uid}`, { name: "yo", score: 700, t: 1 });
  const d = await premios(u.uid, { ...env, PODIO: "0" }, Date.now(), { onTime: always });
  check(estado(d, "podio") === "proximamente", `estado ${estado(d, "podio")}`);
  check(!d.nuevos.includes("podio"), "dio el podio estando en pausa");
});

await paso("puntaje semanal inventado (más que la suma de los diarios): no da podio", async () => {
  const u = await user();
  const monday = mondayUTC(Date.now() - 21 * DAY);
  for (let i = 0; i < 11; i++) await put(`weekly/${monday}/scores/rival${i}`, { name: `r${i}`, score: 100 + i, t: 1 });
  // Jugó dos días (200 puntos) pero escribió 840.
  for (let i = 0; i < 2; i++) await put(`daily/${dayKeyUTC(Date.parse(monday) + i * DAY)}/scores/${u.uid}`, { name: "tramposo", score: 100, ok: true, t: 1 });
  await put(`weekly/${monday}/scores/${u.uid}`, { name: "tramposo", score: 840, t: 1 });
  const d = await premios(u.uid, env, Date.now(), { onTime: always });
  check(estado(d, "podio") === "progreso", "dio podio con un puntaje semanal inventado");
});

await paso("Premium para siempre (puesto a mano): no se toca", async () => {
  const u = await user();
  await put(`premium/${u.uid}`, { activo: true });
  await racha(u.uid, 7);
  const d = await premios(u.uid, env, Date.now(), { onTime: always });
  check(estado(d, "racha7") === "nuevo" && d.hasta === true, JSON.stringify(d));
  const doc = await get(`premium/${u.uid}`);
  check(!doc.fields.hasta, "le puso fecha de vencimiento");
});

await paso("dos pedidos al mismo tiempo: los días se dan una sola vez", async () => {
  const u = await user();
  await racha(u.uid, 7);
  const now = Date.now();
  const rs = await Promise.allSettled([
    premios(u.uid, env, now, { onTime: always }),
    premios(u.uid, env, now, { onTime: always }),
  ]);
  const total = rs.filter((r) => r.status === "fulfilled").reduce((s, r) => s + r.value.dias, 0);
  check(total === 5, `dio ${total} días`);
  check(Math.abs((await hastaDe(u.uid)) - (now + 5 * DAY)) < 5000, "Premium quedó con otra fecha");
});

await paso("borrar la cuenta borra los premios y el Premium de regalo", async () => {
  const u = await user();
  await racha(u.uid, 7);
  await premios(u.uid, env, Date.now(), { onTime: always });
  check(await get(`premios/${u.uid}`), "no se guardaron los premios");
  const r = await worker.fetch(new Request("https://api.edge21.app/borrar", { method: "POST", headers: { Authorization: `Bearer ${u.token}` } }), env);
  check(r.status === 200, `respondió ${r.status}`);
  check(!(await get(`premios/${u.uid}`)) && !(await get(`premium/${u.uid}`)), "quedaron datos");
});

// Firmas de verdad (los emuladores no firman): se arma un par de claves y se hace pasar por Google.
const b64u = (buf) => Buffer.from(buf).toString("base64url");
const alg = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) };
async function firmar(payload, key, kid = "k1") {
  const head = b64u(JSON.stringify({ alg: "RS256", kid, typ: "JWT" }));
  const body = b64u(JSON.stringify(payload));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64u(sig)}`;
}
await paso("sesión firmada por Google: se acepta; firmada por otro o vencida: no", async () => {
  const google = await crypto.subtle.generateKey(alg, true, ["sign", "verify"]);
  const otro = await crypto.subtle.generateKey(alg, true, ["sign", "verify"]);
  const jwk = { ...(await crypto.subtle.exportKey("jwk", google.publicKey)), kid: "k1", alg: "RS256", use: "sig" };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) =>
    String(url).includes("securetoken@system.gserviceaccount.com")
      ? new Response(JSON.stringify({ keys: [jwk] }), { headers: { "Cache-Control": "max-age=600" } })
      : realFetch(url, opts);
  try {
    const env2 = { PROJECT_ID: "edge21-fb71e" };
    const now = Math.floor(Date.now() / 1000);
    const ok = { aud: "edge21-fb71e", iss: "https://securetoken.google.com/edge21-fb71e", sub: "abc", iat: now, exp: now + 3600 };
    check((await verifyIdToken(await firmar(ok, google.privateKey), env2)) === "abc", "rechazó una sesión buena");
    const mala = async (t, msg) => {
      let fallo = false;
      await verifyIdToken(t, env2).catch(() => (fallo = true));
      check(fallo, msg);
    };
    await mala(await firmar(ok, otro.privateKey), "aceptó una firma de otro");
    await mala(await firmar({ ...ok, exp: now - 10 }, google.privateKey), "aceptó una sesión vencida");
    await mala(await firmar({ ...ok, aud: "otro" }, google.privateKey), "aceptó una sesión de otro proyecto");
    await mala(await firmar(ok, google.privateKey, "k2"), "aceptó una clave desconocida");
  } finally {
    globalThis.fetch = realFetch;
  }
});

await paso("cuenta de servicio: arma un pedido firmado para entrar a Firestore", async () => {
  const sa = await crypto.subtle.generateKey(alg, true, ["sign", "verify"]);
  const pkcs8 = Buffer.from(await crypto.subtle.exportKey("pkcs8", sa.privateKey)).toString("base64");
  const pem = `-----BEGIN PRIVATE KEY-----\n${pkcs8.match(/.{1,64}/g).join("\n")}\n-----END PRIVATE KEY-----\n`;
  const realFetch = globalThis.fetch;
  let assertion = "";
  globalThis.fetch = async (url, opts) => {
    if (String(url) !== "https://oauth2.googleapis.com/token") return realFetch(url, opts);
    assertion = new URLSearchParams(opts.body).get("assertion");
    return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }));
  };
  try {
    const t = await serviceToken({ FIREBASE_SA: JSON.stringify({ client_email: "sa@x.iam.gserviceaccount.com", private_key: pem.replace(/\\n/g, "\n") }) });
    check(t === "tok", "no devolvió el acceso");
    const [h, b, sig] = assertion.split(".");
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", sa.publicKey, Buffer.from(sig, "base64url"), new TextEncoder().encode(`${h}.${b}`));
    check(ok, "la firma del pedido no es válida");
    const p = JSON.parse(Buffer.from(b, "base64url").toString());
    check(p.iss === "sa@x.iam.gserviceaccount.com" && p.scope.includes("datastore"), "el pedido no es el esperado");
  } finally {
    globalThis.fetch = realFetch;
  }
});

await paso("limpieza diaria: borra puntajes de hace más de 60 días y errores vencidos, nada más", async () => {
  const now = Date.now();
  const viejo = dayKeyUTC(now - 65 * DAY);
  const nuevo = dayKeyUTC(now - 30 * DAY);
  const lunesViejo = mondayUTC(now - 75 * DAY);
  await put(`daily/${viejo}/scores/a`, { name: "a", score: 50, t: 1 });
  await put(`daily/${viejo}/scores/b`, { name: "b", score: 60, t: 1 });
  await put(`daily/${nuevo}/scores/a`, { name: "a", score: 70, t: 1 });
  await put(`weekly/${lunesViejo}/scores/a`, { name: "a", score: 300, t: 1 });
  await put(`errores/vencido`, { msg: "x", stack: "", t: 1, expireAt: new Date(now - DAY) });
  await put(`errores/vigente`, { msg: "y", stack: "", t: 1, expireAt: new Date(now + 30 * DAY) });
  const n = await limpiar(env, now);
  check(n >= 4, `borró ${n}`);
  check(!(await get(`daily/${viejo}/scores/a`)) && !(await get(`daily/${viejo}/scores/b`)), "quedó un puntaje viejo");
  check(!(await get(`weekly/${lunesViejo}/scores/a`)), "quedó un puntaje semanal viejo");
  check(!(await get("errores/vencido")), "quedó un error vencido");
  check(await get(`daily/${nuevo}/scores/a`), "borró un puntaje de hace 30 días");
  check(await get("errores/vigente"), "borró un error que no venció");
});

await paso("límite de pedidos: una cuenta no puede pedir los premios 20 veces seguidas", async () => {
  const u = await user();
  const envLim = { PROJECT_ID: P, EMULATOR: "127.0.0.1", BIENVENIDA: "1" };
  const estados = [];
  for (let i = 0; i < 8; i++)
    estados.push((await worker.fetch(new Request("https://api.edge21.app/premios", { method: "POST", headers: { Authorization: `Bearer ${u.token}` } }), envLim)).status);
  check(estados.slice(0, 6).every((s) => s === 200), `los primeros 6 deberían andar: ${estados}`);
  check(estados.slice(6).every((s) => s === 429), `después del sexto debería frenar: ${estados}`);
});

await paso("errores: se guardan recortados, sin cuenta, y con límite por conexión", async () => {
  const envLim = { PROJECT_ID: P, EMULATOR: "127.0.0.1" };
  const mandar = (body, ip = "1.2.3.4") =>
    worker.fetch(new Request("https://api.edge21.app/errores", { method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip }, body: typeof body === "string" ? body : JSON.stringify(body) }), envLim);
  const r = await mandar({ msg: "x".repeat(5000), stack: "s", where: "w", version: "1", plataforma: "hackeo", idioma: "es", extra: "no" });
  check(r.status === 200, `debería guardarlo: ${r.status}`);
  check((await mandar("esto no es json", "5.6.7.8")).status === 400, "un pedido mal formado debería dar 400");
  check((await mandar("x".repeat(9000), "5.6.7.8")).status === 400, "un pedido gigante debería dar 400");
  const q = await fetch(`${FS}:runQuery`, { method: "POST", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "errores" }], where: { fieldFilter: { field: { fieldPath: "where" }, op: "EQUAL", value: { stringValue: "w" } } } } }) }).then((x) => x.json());
  const doc = q.find((x) => x.document).document;
  check(doc.fields.msg.stringValue.length === 300, "el mensaje no se recortó");
  check(doc.fields.plataforma.stringValue === "web", "el dineroforma no se limpió");
  check(!doc.fields.extra, "guardó un campo de más");
  const n = [];
  for (let i = 0; i < 12; i++) n.push((await mandar({ msg: "y" + i }, "9.9.9.9")).status);
  check(n.filter((s) => s === 429).length === 2, `debería frenar después de 10: ${n}`);
});

await paso("reportar un nombre: se guarda para revisarlo; datos raros no", async () => {
  const envLim = { PROJECT_ID: P, EMULATOR: "127.0.0.1" };
  const rep = (body) => worker.fetch(new Request("https://api.edge21.app/reportar", { method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": "7.7.7.7" }, body: JSON.stringify(body) }), envLim);
  check((await rep({ tipo: "daily", clave: "2026-11-03", uid: "abc123", nombre: "feo" })).status === 200, "debería guardar el reporte");
  check((await rep({ tipo: "daily", clave: "../../premium/x", uid: "abc", nombre: "x" })).status === 400, "una clave rara debería dar 400");
  check((await rep({ tipo: "daily", clave: "2026-11-03", uid: "a/b", nombre: "x" })).status === 400, "un uid raro debería dar 400");
  const q = await fetch(`${FS}:runQuery`, { method: "POST", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "reportes" }] } }) }).then((x) => x.json());
  check(q.some((x) => x.document && x.document.fields.puntaje.stringValue === "daily/2026-11-03/scores/abc123"), "no quedó el reporte");
});

await paso("progreso comprimido armado para ocupar gigas: se corta", async () => {
  const gz = await new Response(new Blob([new Uint8Array(20e6)]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
  let corto = false;
  try {
    await gunzipConTope(new Uint8Array(gz), 4e6);
  } catch {
    corto = true;
  }
  check(corto, "debería cortar al pasar el tope");
  const chico = await new Response(new Blob(["hola"]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
  check((await gunzipConTope(new Uint8Array(chico), 4e6)) === "hola", "uno normal debería andar");
});

await paso("pagos en la web (Paddle): firma, suscripción, pago único y avisos raros", async () => {
  const SECRETO = "pdl_ntfset_prueba";
  const envP = { PROJECT_ID: P, EMULATOR: "127.0.0.1", PADDLE_WEBHOOK_SECRET: SECRETO, PADDLE_PRECIO_SIEMPRE: "pri_siempre" };
  const firmar = async (raw, ts = Math.floor(Date.now() / 1000), secreto = SECRETO) => {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const h = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}:${raw}`)))].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `ts=${ts};h1=${h}`;
  };
  const avisar = async (ev, firma) => {
    const raw = JSON.stringify(ev);
    return worker.fetch(new Request("https://api.edge21.app/pagos/paddle", { method: "POST", headers: { "Content-Type": "application/json", "Paddle-Signature": firma || (await firmar(raw)) }, body: raw }), envP);
  };
  const { uid } = await user();
  const fin = new Date(Date.now() + 30 * DAY).toISOString();
  const sub = { event_type: "subscription.activated", data: { id: "sub_1", status: "active", customer_id: "ctm_1", custom_data: { uid }, items: [{ price: { id: "pri_mes" } }], current_billing_period: { starts_at: new Date().toISOString(), ends_at: fin } } };
  // Firma mala, vieja o de otro secreto: no entra y no anota nada.
  check((await avisar(sub, "ts=1;h1=abc")).status === 401, "firma mala debería dar 401");
  check((await avisar(sub, await firmar(JSON.stringify(sub), Math.floor(Date.now() / 1000) - 3600))).status === 401, "firma de hace una hora debería dar 401");
  check((await avisar(sub, await firmar(JSON.stringify(sub), undefined, "otro"))).status === 401, "firma con otro secreto debería dar 401");
  check(!(await get(`premium/${uid}`)), "no debería haber Premium con una firma mala");
  // Suscripción: Premium hasta el fin del período + 3 días.
  check((await avisar(sub)).status === 200, "el aviso firmado debería dar 200");
  const h1 = await hastaDe(uid);
  check(Math.abs(h1 - (Date.parse(fin) + 3 * DAY)) < 2000, `vence mal: ${new Date(h1).toISOString()}`);
  const doc = await get(`premium/${uid}`);
  check(doc.fields.activo.booleanValue === true && doc.fields.pago.mapValue.fields.fuente.stringValue === "paddle", "no quedó anotado el pago");
  // Un aviso viejo (período anterior) no acorta.
  const viejo = structuredClone(sub);
  viejo.data.current_billing_period.ends_at = new Date(Date.now() + 2 * DAY).toISOString();
  check((await avisar(viejo)).status === 200, "un aviso viejo igual se contesta bien");
  check((await hastaDe(uid)) === h1, "un aviso viejo no debería acortar");
  // Cancelada: se contesta bien y no cambia nada (vence sola).
  const cancel = structuredClone(sub);
  cancel.event_type = "subscription.canceled";
  cancel.data.status = "canceled";
  check((await avisar(cancel)).status === 200 && (await hastaDe(uid)) === h1, "cancelar no debería tocar la fecha");
  // Los premios no borran ni pisan el pago; borrar la cuenta tampoco borra lo pagado.
  await borrar(uid, envP);
  check((await hastaDe(uid)) === h1, "borrar la cuenta no debería sacar lo pagado");
  // Pago único: para siempre (sin fecha).
  const unico = { event_type: "transaction.completed", data: { id: "txn_1", status: "completed", customer_id: "ctm_1", custom_data: { uid }, items: [{ price: { id: "pri_siempre" } }], billing_period: null } };
  check((await avisar(unico)).status === 200, "el pago único debería dar 200");
  const d2 = await get(`premium/${uid}`);
  check(d2.fields.activo.booleanValue === true && !d2.fields.hasta, "el pago único debería quedar para siempre");
  // Una renovación después no le pone fecha a lo que es para siempre.
  check((await avisar(sub)).status === 200 && !(await get(`premium/${uid}`)).fields.hasta, "una renovación no debería ponerle fecha al para siempre");
  // Sin uid o con uno raro: se contesta bien pero no se anota nada.
  const raro = structuredClone(sub);
  raro.data.custom_data = { uid: "../users/x" };
  check((await avisar(raro)).status === 200, "un uid raro igual se contesta (para que no reintente)");
  const sinUid = structuredClone(sub);
  sinUid.data.custom_data = null;
  check((await avisar(sinUid)).status === 200, "sin uid igual se contesta");
});

await paso("medición: nuevo, vuelve al día siguiente y a la semana, hitos por día y por cohorte, datos raros no", async () => {
  const envM = { PROJECT_ID: P, EMULATOR: "127.0.0.1", DUENOS: "dueno1,dueno2" };
  const t0 = Date.parse("2026-10-01T15:00:00Z");
  const mandar = (o, t = t0) => medir(new Request("https://api.edge21.app/m", { method: "POST", body: JSON.stringify(o) }), envM, t);
  const met = async (dia) => {
    const doc = await get(`metricas/${dia}`);
    const out = {};
    const plano = (f, pre) => { for (const [k, v] of Object.entries(f || {})) { if (v.mapValue) plano(v.mapValue.fields, `${pre}${k}.`); else out[`${pre}${k}`] = Number(v.integerValue); } };
    plano(doc && doc.fields, "");
    return out;
  };
  const d0 = diaAR(t0);
  check((await mandar({ e: "nuevo", id: "aparato000001", p: "iphone", src: "tiktok" })) === 200, "nuevo");
  check((await mandar({ e: "nuevo", id: "aparato000001", p: "iphone", src: "tiktok" })) === 200, "nuevo repetido");
  await mandar({ e: "nuevo", id: "aparato000002", p: "compu", src: "google" });
  await mandar({ e: "leccion1", id: "aparato000001" });
  let m = await met(d0);
  check(m["e.nuevo"] === 2 && m["e.activo"] === 2, `nuevos/activos: ${JSON.stringify(m)}`);
  check(m["src.tiktok"] === 1 && m["src.google"] === 1 && m["plat.iphone"] === 1, `fuentes: ${JSON.stringify(m)}`);
  check(m["e.leccion1"] === 1 && m["c.leccion1"] === 1, `hito: ${JSON.stringify(m)}`);
  // El mismo día otra vez: no suma activo.
  await mandar({ e: "activo", id: "aparato000001" });
  check((await met(d0))["e.activo"] === 2, "activo dos veces el mismo día");
  // Al día siguiente: activo y vuelve al día 1 (se anota en el día que llegó).
  const t1 = t0 + DAY;
  await mandar({ e: "activo", id: "aparato000001" }, t1);
  await mandar({ e: "mesa", id: "aparato000001" }, t1);
  m = await met(d0);
  check(m["r.d1"] === 1 && m["r.semana"] === 1 && m["c.mesa"] === 1, `vuelve al día 1: ${JSON.stringify(m)}`);
  const m1 = await met(diaAR(t1));
  check(m1["e.activo"] === 1 && m1["e.mesa"] === 1, `al otro día: ${JSON.stringify(m1)}`);
  // A la semana: d7, pero "volvió en la semana" no se cuenta dos veces.
  await mandar({ e: "activo", id: "aparato000001" }, t0 + 7 * DAY);
  m = await met(d0);
  check(m["r.d7"] === 1 && m["r.semana"] === 1, `semana: ${JSON.stringify(m)}`);
  // Datos raros: no.
  check((await mandar({ e: "inventado", id: "aparato000003" })) === 400, "evento inventado");
  check((await mandar({ e: "activo", id: "../users/x" })) === 400, "id raro");
  // Panel: solo los dueños.
  check((await panel("otro", envM, t1)) === null, "el panel no debería abrirse a otros");
  const pn = await panel("dueno2", envM, t1, 3);
  check(pn && pn.dias.length === 3 && pn.dias[1].dia === d0 && pn.dias[1].e.nuevo === 2, `panel: ${JSON.stringify(pn && pn.dias[1])}`);
});

await paso("invitar amigos: código, unirse solo con cuenta nueva, 5 días de desafío, premio a los dos y tope de 10", async () => {
  const jugar = async (uid, dias) => {
    for (let i = 0; i < dias; i++) await put(`daily/${dayKeyUTC(Date.now() + i * DAY)}/scores/${uid}`, { name: "x", score: 100, ok: true, t: Date.now() });
  };
  const yo = await user();
  const r0 = await premios(yo.uid, env, Date.now(), { onTime: always });
  const codigo = r0.invitar.codigo;
  check(/^[A-HJ-NP-Z2-9]{6}$/.test(codigo), `código: ${codigo}`);
  check((await premios(yo.uid, env, Date.now(), { onTime: always })).invitar.codigo === codigo, "el código cambió");
  // Unirse: propio no, inválido no, nuevo sí (una sola vez), cuenta vieja no.
  check((await unirme(yo.uid, yo.token, codigo, env)).estado === "propio", "propio");
  const amigo = await user();
  check((await unirme(amigo.uid, amigo.token, "ZZZZZZ", env)).estado === "invalido", "inválido");
  check((await unirme(amigo.uid, amigo.token, codigo, env)).estado === "ok", "unirse");
  check((await unirme(amigo.uid, amigo.token, codigo, env)).estado === "ya", "dos veces");
  const viejo = await user();
  check((await unirme(viejo.uid, viejo.token, codigo, env, Date.now() + 4 * DAY)).estado === "vieja", "cuenta vieja");
  // Con 4 días todavía no; con 5, premio para los dos (sin tope del mes).
  await jugar(amigo.uid, 4);
  let ra = await premios(amigo.uid, env, Date.now(), { onTime: always });
  check(ra.invitado && ra.invitado.estado === "progreso" && ra.invitado.dias === 4, `4 días: ${JSON.stringify(ra.invitado)}`);
  let ry = await premios(yo.uid, env, Date.now(), { onTime: always });
  check(ry.invitar.amigos.length === 1 && ry.invitar.amigos[0].estado === "progreso" && ry.invitar.amigos[0].dias === 4, `amigos: ${JSON.stringify(ry.invitar)}`);
  await jugar(amigo.uid, 5);
  ra = await premios(amigo.uid, env, Date.now(), { onTime: always });
  check(ra.nuevos.includes("invitado") && ra.invitado.estado === "nuevo", `invitado: ${JSON.stringify(ra)}`);
  ry = await premios(yo.uid, env, Date.now(), { onTime: always });
  check(ry.nuevos.includes("amigo") && ry.invitar.ganados === 1 && ry.invitar.amigos[0].estado === "ganado", `quien invitó: ${JSON.stringify(ry.invitar)}`);
  check((await premios(yo.uid, env, Date.now(), { onTime: always })).nuevos.length === 0, "se dio dos veces");
  // Tope: con 11 amigos que cumplen, se dan 10.
  const otro = await user();
  const cod2 = (await premios(otro.uid, env, Date.now(), { onTime: always })).invitar.codigo;
  for (let i = 0; i < 11; i++) {
    const a = await user();
    await unirme(a.uid, a.token, cod2, env);
    await jugar(a.uid, 5);
  }
  const rt = await premios(otro.uid, env, Date.now(), { onTime: always });
  check(rt.invitar.ganados === 10 && rt.invitar.amigos.filter((x) => x.estado === "tope").length === 1, `tope: ${JSON.stringify(rt.invitar)}`);
  // Borrar la cuenta borra su código.
  await borrar(otro.uid, env);
  check(!(await get(`codigos/${cod2}`)), "el código quedó");
});

console.log(fails.length ? `${fails.length} prueba(s) fallaron` : "todas las pruebas pasaron");
process.exit(fails.length ? 1 : 0);
