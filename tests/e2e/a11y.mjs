// Revisión de accesibilidad con axe-core en las pantallas principales (lector de pantalla,
// nombres de botones, contraste, etc.). Uso: npm run build && node tests/e2e/a11y.mjs
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const ONB = { v: 1, profile: { onboarded: true, experience: "rules", goal: "casino", startSection: 1, createdAt: 1760000000000 }, lastTab: "aprender" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  fs.readFile(path.join(ROOT, p), (e, d) => (e ? res.writeHead(404).end() : res.writeHead(200, { "content-type": p.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" }).end(d)));
});
await new Promise((ok) => srv.listen(0, ok));
const base = `http://localhost:${srv.address().port}`;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "es-UY" });
await ctx.addInitScript(`if (!sessionStorage.getItem("s")) { sessionStorage.setItem("s","1"); localStorage.setItem("ventaja21.state.v1", ${JSON.stringify(JSON.stringify(ONB))}); }`);
const page = await ctx.newPage();
await page.goto(base + "/app/index.html");
await page.waitForTimeout(1000);
const pantallas = [
  ["Aprender", null],
  ["Entrenar", null],
  ["Jugar", null],
  ["Conteo", null],
  ["Progreso", null],
  ["Entrenar", "Repartir 10 manos"],
];
const all = {};
for (const [tab, click] of pantallas) {
  if (await page.locator(".layer.full").filter({ visible: true }).count()) {
    await page.goBack();
    await page.waitForTimeout(400);
  }
  await page.locator(`nav.tabbar button:has-text("${tab}")`).first().click();
  await page.waitForTimeout(500);
  if (click) {
    await page.getByText(click).filter({ visible: true }).first().click();
    await page.waitForTimeout(900);
  }
  await page.evaluate(AXE);
  const r = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const res = await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "best-practice"], rules: { region: { enabled: false } } });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, ej: v.nodes.slice(0, 3).map((x) => x.target.join(" ") + " :: " + (x.failureSummary || "").split("\n")[1]) }));
  });
  for (const v of r) {
    const k = v.id;
    all[k] = all[k] || { ...v, where: [] };
    all[k].where.push(`${tab}${click ? " > " + click : ""} (${v.n})`);
  }
}
for (const v of Object.values(all).sort((a, b) => (a.impact < b.impact ? -1 : 1)))
  console.log(`[${v.impact}] ${v.id}: ${v.help}\n   en: ${v.where.join(", ")}\n   ej: ${v.ej.join("\n       ")}`);
if (!Object.keys(all).length) console.log("sin problemas");
await b.close();
srv.close();
