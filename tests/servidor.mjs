// Prueba del servidor de premios (servidor/index.js) contra los emuladores de Firebase.
// Uso: npx firebase-tools emulators:exec --project demo-edge21 --only auth,firestore "node tests/servidor.mjs"
import worker, { limpiar, premios, serviceToken, verifyIdToken } from "../servidor/index.js";
import { DAY, dayKeyUTC, diasRecientes, mondayUTC } from "../src/premios.js";

const P = "demo-edge21";
const env = { PROJECT_ID: P, EMULATOR: "127.0.0.1", BIENVENIDA: "1" };
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

console.log(fails.length ? `${fails.length} prueba(s) fallaron` : "todas las pruebas pasaron");
process.exit(fails.length ? 1 : 0);
