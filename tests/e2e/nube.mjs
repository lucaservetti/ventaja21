// Prueba de la cuenta de Google, la nube y el ranking contra los emuladores de Firebase.
// Hace falta firebase-tools (con Java) corriendo los emuladores de Auth (9099) y Firestore (8080):
//   firebase emulators:start --project demo-edge21 --only auth,firestore   (con firestore.rules)
// y armar la app apuntando a ellos:
//   FIREBASE_API_KEY=x FIREBASE_PROJECT_ID=demo-edge21 GOOGLE_WEB_CLIENT_ID=x FIREBASE_EMULATOR=127.0.0.1 npm run build
// Uso: node tests/e2e/nube.mjs   (al terminar, volvé a correr npm run build sin esas variables)
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FS = "http://127.0.0.1:8080/v1/projects/demo-edge21/databases/(default)/documents";
const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();
const base = { v: 1, profile: { onboarded: true, experience: "rules", goal: "casino", startSection: 1, createdAt: 1760000000000 }, lastTab: "aprender" };
const conProgreso = { ...base, lessons: { l1: { done: true, stars: 3 } }, train: { totalHands: 42 }, daily: { last: today, streak: 1, best: 1, results: { [today]: { ok: true, err: 0, score: 110 } } } };
const otroProgreso = { ...base, lessons: { l1: { done: true }, l2: { done: true } }, train: { totalHands: 7 } };

const fails = [];
function check(c, msg) {
  if (!c) throw new Error(msg);
}
async function owner(url, method = "GET") {
  const r = await fetch(url, { method, headers: { Authorization: "Bearer owner" } });
  return r.status === 404 ? null : r.json();
}
const fakeGoogle = (sub, name, email) => JSON.stringify({ sub, name, email, email_verified: true });

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  fs.readFile(path.join(ROOT, p), (e, d) => (e ? res.writeHead(404).end() : res.writeHead(200, { "content-type": p.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" }).end(d)));
});
await new Promise((ok) => srv.listen(0, ok));
const url = `http://localhost:${srv.address().port}/index.html`;
const browser = await chromium.launch();
async function phone(state) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "es-UY" });
  if (state) await ctx.addInitScript(`if (!sessionStorage.getItem("s")) { sessionStorage.setItem("s","1"); localStorage.setItem("ventaja21.state.v1", ${JSON.stringify(JSON.stringify(state))}); }`);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForTimeout(900);
  page.errors = errors;
  return page;
}
const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("ventaja21.state.v1")));
async function paso(nombre, fn) {
  try {
    await fn();
    console.log(`✓ ${nombre}`);
  } catch (e) {
    fails.push(nombre);
    console.log(`✗ ${nombre}: ${String(e.message || e).split("\n")[0]}`);
  }
}

// Limpieza de corridas anteriores.
await fetch("http://127.0.0.1:8080/emulator/v1/projects/demo-edge21/databases/(default)/documents", { method: "DELETE" });
await fetch("http://127.0.0.1:9099/emulator/v1/projects/demo-edge21/accounts", { method: "DELETE" });

const a = await phone(conProgreso);
let uid = null;
await paso("entrar con Google sube el progreso", async () => {
  const r = await a.evaluate((t) => window.__cloudTest.finishSignIn(t), fakeGoogle("g-ana", "Ana Pérez", "ana@ejemplo.com"));
  check(r === "uploaded", `resultado ${r}`);
  uid = await a.evaluate(() => JSON.parse(localStorage.getItem("edge21.account")).uid);
  const doc = await owner(`${FS}/users/${uid}`);
  check(doc && doc.fields && (doc.fields.gz || doc.fields.text), "no está el documento del usuario");
});
await paso("el puntaje de hoy entra al ranking", async () => {
  await a.waitForTimeout(800);
  const doc = await owner(`${FS}/daily/${today}/scores/${uid}`);
  check(doc && doc.fields.score.integerValue === "110", "no está el puntaje del día");
  check(doc.fields.name.stringValue === "Ana P.", `nombre ${doc.fields.name.stringValue}`);
});
await paso("la pantalla de ranking lo muestra", async () => {
  await a.locator('nav.tabbar button:has-text("Conteo")').click();
  await a.getByText("Ver el ranking del desafío").click();
  await a.getByText("Ana P.").waitFor({ timeout: 5000 });
  const txt = await a.locator(".rank-list").innerText();
  check(/110/.test(txt), "no aparece el puntaje");
  await a.goBack();
});
await paso("los cambios se guardan solos en la nube", async () => {
  await a.evaluate(() => window.__cloudTest.syncNow());
  const before = await owner(`${FS}/users/${uid}`);
  check(before, "sin documento");
});

const b = await phone(null);
await paso("en otro celular nuevo, entrar trae el progreso", async () => {
  const r = await b.evaluate((t) => window.__cloudTest.finishSignIn(t), fakeGoogle("g-ana", "Ana Pérez", "ana@ejemplo.com"));
  check(r === "restored", `resultado ${r}`);
  await b.waitForTimeout(500);
  const st = await state(b);
  check(st.profile.onboarded && st.lessons.l1 && st.lessons.l1.done && st.train.totalHands === 42, "no se restauró el progreso");
  check(await b.locator("nav.tabbar").isVisible(), "no pasó la bienvenida");
});

const c = await phone(otroProgreso);
await paso("con progreso en los dos lados pregunta, y elegir el de la cuenta lo trae", async () => {
  // Abrir la pantalla de cuenta desde Ajustes.
  await c.locator('nav.tabbar button:has-text("Conteo")').click();
  await c.getByRole("button", { name: "Ajustes" }).filter({ visible: true }).first().click();
  await c.getByText("Tu cuenta", { exact: true }).click();
  await c.waitForTimeout(400);
  c.evaluate((t) => window.__cloudTest.finishSignIn(t), fakeGoogle("g-ana", "Ana Pérez", "ana@ejemplo.com"));
  await c.getByText("¿Con qué progreso te quedás?").waitFor({ timeout: 8000 });
  await c.getByText("Usar el de la cuenta").click();
  await c.waitForTimeout(600);
  const st = await state(c);
  check(st.train.totalHands === 42 && !(st.lessons.l2 && st.lessons.l2.done), "no se usó el progreso de la cuenta");
});

await paso("los errores de la app llegan a la nube", async () => {
  await a.evaluate(() => setTimeout(() => {
    throw new Error("error de prueba");
  }));
  await a.waitForTimeout(800);
  const list = await owner(`${FS}/errores`);
  check(list && list.documents && list.documents.some((d) => d.fields.msg.stringValue.includes("error de prueba")), "no llegó el error");
});

await paso("borrar la cuenta borra la nube y el ranking", async () => {
  await a.locator('nav.tabbar button:has-text("Conteo")').click();
  await a.getByRole("button", { name: "Ajustes" }).filter({ visible: true }).first().click();
  await a.getByText("Tu cuenta", { exact: true }).click();
  await a.getByText("Borrar mi cuenta y mis datos de la nube").click();
  await a.getByText("Sí, borrar todo").click();
  await a.getByText("Guardá tu progreso en tu cuenta de Google").waitFor({ timeout: 8000 });
  check(!(await owner(`${FS}/users/${uid}`)), "quedó el progreso en la nube");
  check(!(await owner(`${FS}/daily/${today}/scores/${uid}`)), "quedó el puntaje");
});

await paso("sin errores en la consola", async () => {
  const all = [...a.errors, ...b.errors, ...c.errors].filter((e) => !/error de prueba/.test(e));
  check(!all.length, all.join(" | "));
});

await browser.close();
srv.close();
console.log(fails.length ? `${fails.length} paso(s) fallaron` : "la nube funciona");
process.exit(fails.length ? 1 : 0);
