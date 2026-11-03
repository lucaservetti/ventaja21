// Prueba las reglas de la base de datos (firestore.rules) contra el emulador de Firestore: intenta
// hacer lo que no se debe (leer o escribir datos ajenos, darse Premium, inventar rankings…).
// Hace falta: firebase emulators:start --project demo-edge21 --only auth,firestore
// Uso: node tests/reglas.mjs
const P = "demo-edge21";
const FS = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";

async function cuenta() {
  const r = await fetch(`${AUTH}/accounts:signUp?key=x`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }) });
  const d = await r.json();
  return { uid: d.localId, token: d.idToken };
}
const f = (o) => ({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "number" ? { integerValue: String(v) } : typeof v === "boolean" ? { booleanValue: v } : v instanceof Date ? { timestampValue: v.toISOString() } : v && v.bytes ? { bytesValue: v.bytes } : { stringValue: v }])) });
async function pedir(method, path, token, body) {
  const r = await fetch(`${FS}/${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return r.status;
}
const dia = (n = 0) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const lunes = (() => { const d = new Date(); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();

let fallas = 0;
async function espera(nombre, ok, p) {
  const s = await p;
  const bien = ok ? s === 200 : s === 403 || s === 400;
  if (!bien) fallas++;
  console.log(`${bien ? "✓" : "✗"} ${nombre} (${s})`);
}
const a = await cuenta();
const b = await cuenta();
const chico = { gz: { bytes: Buffer.from("hola").toString("base64") }, updatedAt: 1, version: "1.13.0" };

await espera("guardar mi progreso", true, pedir("PATCH", `users/${a.uid}`, a.token, f(chico)));
await espera("leer mi progreso", true, pedir("GET", `users/${a.uid}`, a.token));
await espera("leer el progreso de otro", false, pedir("GET", `users/${a.uid}`, b.token));
await espera("pisar el progreso de otro", false, pedir("PATCH", `users/${a.uid}`, b.token, f(chico)));
await espera("leer progreso sin cuenta", false, pedir("GET", `users/${a.uid}`));
await espera("progreso gigante", false, pedir("PATCH", `users/${a.uid}`, a.token, f({ text: "x".repeat(700000) })));
await espera("progreso con campos de más", false, pedir("PATCH", `users/${a.uid}`, a.token, f({ ...chico, premium: true })));
await espera("darme Premium", false, pedir("PATCH", `premium/${a.uid}`, a.token, f({ until: 9e12 })));
await espera("darme premios", false, pedir("PATCH", `premios/${a.uid}`, a.token, f({ dias: 99 })));
await espera("leer el Premium de otro", false, pedir("GET", `premium/${b.uid}`, a.token));
const pt = (n) => f({ name: "Ana", score: n, ok: true, t: Date.now() });
await espera("puntaje de hoy", true, pedir("PATCH", `daily/${dia()}/scores/${a.uid}`, a.token, pt(110)));
await espera("puntaje semanal", true, pedir("PATCH", `weekly/${lunes}/scores/${a.uid}`, a.token, pt(500)));
await espera("leer el ranking sin cuenta", true, pedir("GET", `daily/${dia()}/scores/${a.uid}`));
await espera("puntaje imposible", false, pedir("PATCH", `daily/${dia()}/scores/${a.uid}`, a.token, pt(999)));
await espera("puntaje a nombre de otro", false, pedir("PATCH", `daily/${dia()}/scores/${b.uid}`, a.token, pt(100)));
await espera("ranking de una fecha vieja", false, pedir("PATCH", `daily/2024-01-01/scores/${a.uid}`, a.token, pt(100)));
await espera("ranking de una fecha futura", false, pedir("PATCH", `daily/${dia(10)}/scores/${a.uid}`, a.token, pt(100)));
await espera("ranking con fecha inventada", false, pedir("PATCH", `daily/hola/scores/${a.uid}`, a.token, pt(100)));
await espera("otra colección inventada", false, pedir("PATCH", `trampa/${dia()}/scores/${a.uid}`, a.token, pt(100)));
await espera("nombre de 200 letras", false, pedir("PATCH", `daily/${dia()}/scores/${a.uid}`, a.token, f({ name: "x".repeat(200), score: 1 })));
await espera("leer los errores", false, pedir("GET", `errores/x`, a.token));
console.log(fallas ? `${fallas} falla(s)` : "las reglas aguantan todo");
process.exit(fallas ? 1 : 0);
