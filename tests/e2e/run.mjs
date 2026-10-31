// Pruebas de punta a punta: abren la app en un Chromium con tamaño de celular y la recorren como
// una persona (en español y en inglés). Uso: npm run build && npm run test:e2e
// Con FOTOS=1 guarda una captura de cada paso en tests/e2e/fotos/.
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FOTOS = process.env.FOTOS ? path.join(ROOT, "tests/e2e/fotos") : null;
const SOLO = process.argv[2] || null;
const ONB = { v: 1, profile: { onboarded: true, experience: "rules", goal: "casino", startSection: 1, createdAt: 1760000000000 }, lastTab: "aprender" };

function servidor() {
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".json": "application/json" };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) return res.writeHead(403).end();
    fs.readFile(f, (e, d) => (e ? res.writeHead(404).end() : res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }).end(d)));
  });
  return new Promise((ok) => srv.listen(0, () => ok(srv)));
}

class Fallo extends Error {}
function check(cond, msg) {
  if (!cond) throw new Fallo(msg);
}

// Lo que cada prueba puede hacer con la app.
function helpers(page, lang, name) {
  let n = 0;
  const T = (es, en) => (lang === "es" ? es : en);
  const h = {
    page,
    T,
    async foto(label) {
      if (!FOTOS) return;
      fs.mkdirSync(FOTOS, { recursive: true });
      await page.screenshot({ path: path.join(FOTOS, `${name}-${lang}-${String(++n).padStart(2, "0")}-${label}.png`) });
    },
    async tab(es, en) {
      await page.locator(`nav.tabbar button:has-text("${T(es, en)}")`).first().click();
      await page.waitForTimeout(300);
    },
    async click(es, en, opts = {}) {
      await page.getByText(T(es, en), { exact: !!opts.exact }).filter({ visible: true }).first().click({ timeout: opts.timeout || 5000 });
      await page.waitForTimeout(opts.wait ?? 300);
    },
    async css(sel, wait = 300) {
      await page.locator(sel).filter({ visible: true }).first().click({ timeout: 5000 });
      await page.waitForTimeout(wait);
    },
    async see(es, en, timeout = 5000) {
      await page.getByText(T(es, en)).first().waitFor({ state: "visible", timeout }).catch(() => {
        throw new Fallo(`no aparece "${T(es, en)}"`);
      });
    },
    // Texto de la pantalla de arriba de todo (o de la pestaña visible).
    async screenText() {
      return page.evaluate(() => {
        const l = [...document.querySelectorAll(".layer")].filter((x) => !x.hidden && x.offsetParent !== null).pop();
        return (l || document.body).innerText;
      });
    },
    state() {
      return page.evaluate(() => JSON.parse(localStorage.getItem("ventaja21.state.v1") || "{}"));
    },
  };
  return h;
}

const PRUEBAS = {
  // Desde cero: la bienvenida y las preguntas hasta llegar a las pestañas.
  async onboarding(h) {
    const { page } = h;
    for (let i = 0; i < 60; i++) {
      if (await page.locator("nav.tabbar").isVisible().catch(() => false)) break;
      const opt = page.locator(".option:not(.picked):not([disabled])").filter({ visible: true }).first();
      const primary = page.locator(".bottom-actions button:not([disabled])").filter({ visible: true }).first();
      const waiting = await page.locator(".bottom-actions button[disabled]").filter({ visible: true }).count();
      try {
        if (waiting && (await opt.isVisible())) await opt.click({ timeout: 3000 });
        else if (await primary.isVisible()) await primary.click({ timeout: 3000 });
        else if (await opt.isVisible()) await opt.click({ timeout: 3000 });
      } catch {
        // La pantalla cambió justo antes del toque: se reintenta en la próxima vuelta.
      }
      await page.waitForTimeout(350);
    }
    await h.foto("fin");
    check(await page.locator("nav.tabbar").isVisible(), "no se llegó a las pestañas");
    const st = await h.state();
    check(st.profile && st.profile.onboarded, "el perfil no quedó marcado como listo");
  },

  // Una lección completa de la primera sección.
  async leccion(h) {
    const { page } = h;
    await h.tab("Aprender", "Learn");
    await page.locator("section:not([hidden]) .rail li button, section:not([hidden]) .rail li a, section:not([hidden]) .rail li").first().click();
    await page.waitForTimeout(600);
    await h.foto("abre");
    for (let i = 0; i < 80; i++) {
      const st = await h.state();
      if (st.lessons && Object.values(st.lessons).some((l) => l && l.done)) break;
      const opt = page.locator(".layer.full:not([hidden]) .option:not([disabled])").first();
      const act = page.locator(".layer.full:not([hidden]) .act-btn:not([disabled])").first();
      const primary = page.locator(".layer.full:not([hidden]) .bottom-actions button:not([disabled])").first();
      if (await primary.isVisible().catch(() => false)) await primary.click();
      else if (await opt.isVisible().catch(() => false)) await opt.click();
      else if (await act.isVisible().catch(() => false)) await act.click();
      await page.waitForTimeout(250);
    }
    await h.foto("fin");
    const st = await h.state();
    check(st.lessons && Object.values(st.lessons).some((l) => l && l.done), "la lección no quedó terminada");
  },

  // Todas las lecciones, una por una, contestando lo primero que aparece. Busca pantallas que se
  // rompan (como un código de carta mal traducido). Tarda: solo corre con TODAS=1 (y en GitHub).
  async lecciones(h) {
    if (!process.env.TODAS) return;
    const { page } = h;
    await page.evaluate(() => {
      const k = "ventaja21.state.v1";
      const s = JSON.parse(localStorage.getItem(k));
      s.settings = { ...(s.settings || {}), unlockAll: true };
      // El examen final es una mesa de verdad (apostar y contar un zapato entero): lo cubren las
      // pruebas de la mesa, acá se da por aprobado para seguir con las lecciones que vienen después.
      s.lessons = { ...(s.lessons || {}), exam: { done: true, stars: 3 } };
      s.finalExam = { ...(s.finalExam || {}), passed: true };
      localStorage.setItem(k, JSON.stringify(s));
      // Que la app no pise esto al guardar antes de recargar.
      Storage.prototype.setItem = () => {};
    });
    // Reloj falso: en cada paso se adelanta un poco, así no se espera la narración ni las animaciones.
    await page.clock.install();
    await page.addStyleTag({ content: "*,*::before,*::after{animation-duration:1ms!important;transition-duration:1ms!important}" }).catch(() => {});
    await page.reload();
    await page.waitForTimeout(900);
    await page.addStyleTag({ content: "*,*::before,*::after{animation-duration:1ms!important;transition-duration:1ms!important}" });
    await h.tab("Aprender", "Learn");
    const total = await page.locator("section:not([hidden]) .rail li").count();
    check(total > 20, `hay pocas lecciones (${total})`);
    const doneCount = async () => {
      const st = await h.state();
      return Object.values(st.lessons || {}).filter((l) => l && l.done).length;
    };
    // Al terminar una lección, "Empezar la próxima lección" lleva a la siguiente: se encadenan.
    let last = -1;
    let stuck = 0;
    for (let i = 0; i < 4000; i++) {
      const done = await doneCount();
      if (done >= total) break;
      if (done !== last && process.env.TODAS === "2") console.log(`  ${done}/${total}`);
      stuck = done === last ? stuck + 1 : 0;
      last = done;
      check(stuck < 250, `se trabó después de ${done} lecciones`);
      if (!(await page.locator(".layer.full").filter({ visible: true }).count())) {
        // En la pestaña: abrir la primera lección sin terminar.
        const next = page.locator("section:not([hidden]) .rail li:not(.rr-done)").first();
        await next.evaluate((el) => el.scrollIntoView({ block: "center" }));
        await next.click({ timeout: 3000, force: true }).catch(() => {});
        await page.waitForTimeout(400);
        continue;
      }
      const txt = await h.screenText();
      check(!/Algo salió mal|Something went wrong/.test(txt), `una lección se rompió (${done} terminadas): ${txt.slice(-160)}`);
      // El examen final (ya dado por aprobado): se sale y se sigue con la próxima lección.
      if (/Examen final|Final exam/.test(txt)) {
        const leave = page.getByText(h.T("Salir", "Leave"), { exact: true }).filter({ visible: true });
        if (await leave.count()) await leave.first().click().catch(() => {});
        else await page.locator(".layer.full button").filter({ visible: true }).first().click().catch(() => {});
        await page.clock.fastForward(500);
        await page.waitForTimeout(200);
        continue;
      }
      const primary = page.locator(".layer.full .bottom-actions button:not([disabled])").filter({ visible: true }).first();
      const opt = page.locator(".layer.full .option:not([disabled])").filter({ visible: true }).first();
      const act = page.locator(".layer.full .act-btn:not([disabled])").filter({ visible: true }).first();
      const key = page.locator(".layer.full .keypad .key").filter({ visible: true }).filter({ hasText: /^1$/ }).first();
      const ok = page.locator(".layer.full .keypad-ok:not([disabled])").filter({ visible: true }).first();
      try {
        if (await primary.isVisible()) await primary.click({ timeout: 2000 });
        else if (await opt.isVisible()) await opt.click({ timeout: 2000 });
        else if (await act.isVisible()) await act.click({ timeout: 2000 });
        else if (await ok.isVisible()) await ok.click({ timeout: 2000 });
        else if (await key.isVisible()) await key.click({ timeout: 2000 });
        else {
          // Lo interactivo de cada lección (repartir una carta, tocar una ficha…).
          const other = page
            .locator(".layer.full button:not([disabled])")
            .filter({ visible: true })
            .filter({ hasNot: page.locator("svg.icon-close, svg.icon-back") });
          const n = await other.count();
          for (let k = 0; k < n; k++) {
            const b = other.nth(k);
            const inTop = await b.evaluate((el) => !!el.closest(".lesson-top, .topbar, .sheet"));
            if (!inTop) {
              await b.click({ timeout: 2000 });
              break;
            }
          }
        }
      } catch {
        // Cambió la pantalla: se sigue.
      }
      await page.clock.fastForward(700);
      await page.waitForTimeout(30);
    }
    const done = await doneCount();
    check(done >= total, `solo se terminaron ${done} de ${total} lecciones`);
    await h.foto("todas");
  },

  // Entrenar: una tanda, contestar una mano y ver la explicación.
  async entrenar(h) {
    await h.tab("Entrenar", "Train");
    await h.click("Repartir 10 manos", "Deal 10 hands", { wait: 900 });
    await h.css(".act-btn.act-S", 500);
    const txt = await h.screenText();
    check(/Correcto|No era esa|Correct|Not that one/.test(txt), "no aparece la corrección de la jugada");
    await h.foto("respuesta");
    const st = await h.state();
    check(st.train && st.train.totalHands >= 1, "la mano no se guardó");
  },

  // La mesa: apostar, repartir y terminar la ronda.
  async mesa(h) {
    const { page } = h;
    await h.tab("Jugar", "Play");
    await h.css("section:not([hidden]) .chip-rack .chip >> nth=2", 200);
    const before = (await h.state()).table;
    await page.locator(`section:not([hidden]) button:has-text("${h.T("Repartir", "Deal")}")`).first().click();
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(400);
      const s = page.locator("section:not([hidden]) .sim-act.act-S:not([disabled])");
      const ins = page.getByText(h.T("No, gracias", "No thanks"), { exact: false }).filter({ visible: true });
      if (await ins.first().isVisible().catch(() => false)) await ins.first().click();
      else if (await s.first().isVisible().catch(() => false)) await s.first().click();
      const st = await h.state();
      if (st.play && st.play.hands > 0) break;
    }
    await h.foto("ronda");
    const st = await h.state();
    check(st.play && st.play.hands > 0, "la ronda no terminó");
    check(before !== undefined, "no había estado de mesa");
  },

  // Contrarreloj: empezar, contestar y que corra el reloj.
  async contrarreloj(h) {
    const { page } = h;
    await h.tab("Entrenar", "Train");
    await h.click("Contrarreloj", "Beat the clock", { wait: 500 });
    await h.click("Empezar", "Start", { exact: true, wait: 1200 });
    const t1 = Number(await page.locator(".blitz-time").innerText());
    await h.css(".act-btn.act-H", 300);
    await h.css(".act-btn.act-S", 1500);
    const t2 = Number(await page.locator(".blitz-time").innerText());
    check(t2 < t1, `el reloj no bajó (${t1} → ${t2})`);
    const done = Number((await page.locator(".blitz-pts").innerText()).match(/\d+/)[0]);
    check(done >= 0, "no hay puntaje");
    await h.foto("jugando");
  },

  // Desafío diario: aparece, se juega y queda guardado.
  async desafio(h) {
    const { page } = h;
    await h.tab("Conteo", "Count");
    await h.click("Desafío diario", "Daily challenge", { wait: 500 });
    await h.click("Empezar", "Start", { exact: true, wait: 200 });
    // Esperar a que terminen de caer las cartas y escribir un número cualquiera.
    await page.locator(".keypad").first().waitFor({ timeout: 90000 });
    await h.foto("teclado");
    await page.locator(".keypad .key").filter({ hasText: /^0$/ }).first().click();
    await page.locator(".keypad-ok").first().click();
    await page.waitForTimeout(600);
    const st = await h.state();
    check(st.daily && Object.keys(st.daily.results || {}).length === 1, "el desafío no se guardó");
    await h.foto("resultado");
  },

  // Desafiar a un amigo: el contrarreloj manda un enlace; quien lo abre ve las mismas manos y el resultado.
  async amigo(h) {
    const { page } = h;
    await page.clock.install();
    await page.reload();
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      navigator.share = async (d) => {
        window.__shared = d;
      };
    });
    await h.tab("Entrenar", "Train");
    await h.click("Contrarreloj", "Beat the clock", { wait: 500 });
    await h.click("Empezar", "Start", { exact: true, wait: 600 });
    const firstHand = await page.locator(".blitz-deal").innerText();
    await h.css(".act-btn.act-S", 200);
    // Se adelanta el reloj: terminan los 60 segundos.
    await page.clock.fastForward(62000);
    await page.locator(".blitz-time").waitFor({ state: "detached", timeout: 5000 });
    await h.foto("fin");
    await h.click("Desafiar a un amigo", "Challenge a friend", { wait: 300 });
    await page.locator(".modal input").fill("Ana");
    await h.click("Mandar el desafío", "Send the challenge", { wait: 500 });
    const shared = await page.evaluate(() => window.__shared && window.__shared.text);
    check(shared && /#reto=/.test(shared), "no se compartió el enlace");
    const link = shared.match(/https?:\/\/\S+#reto=[\w-]+/)[0];
    const code = link.split("#reto=")[1];
    // Otra persona abre el enlace.
    const other = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, locale: h.T("es-UY", "en-US") });
    await other.addInitScript(`localStorage.setItem("edge21.lang", ${JSON.stringify(h.T("es", "en"))}); localStorage.setItem("ventaja21.state.v1", ${JSON.stringify(JSON.stringify(ONB))});`);
    const p2 = await other.newPage();
    await p2.goto(page.url().split("#")[0] + "#reto=" + code);
    await p2.waitForTimeout(1200);
    await p2.getByText(h.T("Ana te desafía", "Ana challenges you")).first().waitFor({ timeout: 5000 });
    if (FOTOS) await p2.screenshot({ path: path.join(FOTOS, `amigo-${h.T("es", "en")}-recibe.png`) });
    await p2.getByText(h.T("Aceptar el desafío", "Accept the challenge")).click();
    await p2.waitForTimeout(400);
    await p2.getByText(h.T("Empezar", "Start"), { exact: true }).filter({ visible: true }).first().click();
    await p2.waitForTimeout(600);
    const hand2 = await p2.locator(".blitz-deal").innerText();
    check(hand2 === firstHand, `la mano no es la misma (${firstHand} / ${hand2})`);
    await other.close();
  },

  // En la web (sin Android simulado) Premium también está bloqueado y explica cómo tenerlo.
  async webPremium(h) {
    await h.tab("Jugar", "Play");
    await h.css("section:not([hidden]) button", 700);
    await h.see("Edge 21 Premium", "Edge 21 Premium");
    await h.see("Por ahora Premium se compra en la app de Android", "For now Premium is bought in the Android app");
    await h.click("Probarlo 30 minutos gratis", "Try it free for 30 minutes", { wait: 800 });
    await h.see("Modo casino real", "Real casino mode");
  },

  // Con 3 lecciones hechas aparece la tarjeta de Premium en Aprender; desde ahí se prueba cada función.
  async tarjetaPremium(h) {
    const { page } = h;
    await page.evaluate(() => {
      const k = "ventaja21.state.v1";
      const s = JSON.parse(localStorage.getItem(k));
      s.lessons = { l1: { done: true, stars: 3 }, l2: { done: true, stars: 3 }, l3: { done: true, stars: 3 } };
      localStorage.setItem(k, JSON.stringify(s));
      Storage.prototype.setItem = () => {};
    });
    await page.reload();
    await page.waitForTimeout(1200);
    await h.see("Modo casino real, las 10 desviaciones y sin anuncios", "Real casino mode, all 10 deviation levels and no ads");
    await h.foto("tarjeta");
    await h.css(".prem-card-main", 700);
    await h.see("Cada función la podés probar gratis 30 minutos", "You can try each feature free for 30 minutes");
    await h.foto("probar");
    await h.css(".prem-try", 900);
    await h.see("Tu plata", "Your money");
  },

  // Funciones nuevas de Premium: análisis de errores, paños y mazos, sistemas avanzados bloqueados sin Premium.
  async premiumNuevo(h) {
    const { page } = h;
    // Sin Premium: un sistema avanzado abre la pantalla de Premium.
    await h.tab("Progreso", "Progress");
    await h.css('section:not([hidden]) button[aria-label="Ajustes"], section:not([hidden]) button[aria-label="Settings"]', 600);
    await h.click("Sistema de conteo", "Counting system", { wait: 600 });
    await h.click("Zen Count", "Zen Count", { wait: 700 });
    await h.see("Usar sistemas de conteo avanzados es parte de Premium", "Using advanced counting systems is part of Premium");
    // Con Premium (cuenta): todo abierto.
    await page.evaluate(() => {
      const k = "ventaja21.state.v1";
      const s = JSON.parse(localStorage.getItem(k));
      s.settings = { ...(s.settings || {}), cloudPremium: true };
      s.train = {
        ...(s.train || {}),
        totalHands: 40,
        totalOk: 31,
        cells: { "H16|T": { n: 6, ok: 2, recent: [0, 1, 0, 0, 1, 0] }, "H12|4": { n: 5, ok: 5, recent: [1, 1, 1, 1, 1] } },
        sessions: [{ t: Date.now() - 9 * 864e5, ok: 6, n: 10 }, { t: Date.now(), ok: 9, n: 10 }],
        mistakes: [{ key: "H16|T", cards: ["10", "6"], up: "T", chosen: "S", best: "R", t: Date.now(), misses: 3, streak: 0 }],
      };
      localStorage.setItem(k, JSON.stringify(s));
      Storage.prototype.setItem = () => {};
    });
    await page.reload();
    await page.waitForTimeout(1200);
    await h.tab("Progreso", "Progress");
    await h.click("Análisis de tus errores", "Mistake analysis", { wait: 700 });
    await h.see("Tus errores más caros", "Your most expensive mistakes");
    await h.see("10, 6", "10, 6");
    await h.foto("analisis");
    await page.locator(".layer.full button").filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    await h.css('section:not([hidden]) button[aria-label="Ajustes"], section:not([hidden]) button[aria-label="Settings"]', 600);
    await h.click("Paños y mazos", "Tables and decks", { wait: 700 });
    await h.css('.look-sw[aria-label="Azul"], .look-sw[aria-label="Blue"]', 300);
    await h.foto("panos");
    const felt = await page.evaluate(() => document.documentElement.dataset.felt);
    check(felt === "azul", `el paño no cambió (${felt})`);
  },

  // Premium en modo app (simulado): planes, condiciones y la prueba de 30 minutos una sola vez.
  async premium(h) {
    const { page } = h;
    await page.evaluate(() => localStorage.setItem("v21.sim", "1"));
    await page.reload();
    await page.waitForTimeout(1200);
    await h.tab("Jugar", "Play");
    await h.css("section:not([hidden]) button", 700);
    await h.see("Edge 21 Premium", "Edge 21 Premium");
    await h.see("5 días gratis", "5 days free");
    await h.see("Para siempre", "Lifetime");
    await h.foto("planes");
    await h.click("Probarlo 30 minutos con un anuncio", "Try it for 30 minutes with an ad", { wait: 800 });
    await h.see("Modo casino real", "Real casino mode");
    const st = await h.state();
    check(st.settings.premiumTrials && st.settings.premiumTrials.casino > Date.now(), "la prueba no quedó activa");
  },
};

(async () => {
  const srv = await servidor();
  const base = `http://localhost:${srv.address().port}`;
  const browser = await chromium.launch();
  let fails = 0;
  const langs = process.env.IDIOMA ? [process.env.IDIOMA] : ["es", "en"];
  for (const lang of langs) {
    for (const [name, fn] of Object.entries(PRUEBAS)) {
      if (SOLO && SOLO !== name) continue;
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: lang === "es" ? "es-UY" : "en-US" });
      const seed = name === "onboarding" ? null : ONB;
      await ctx.addInitScript(`if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded","1"); localStorage.setItem("edge21.lang", ${JSON.stringify(lang)}); ${seed ? `localStorage.setItem("ventaja21.state.v1", ${JSON.stringify(JSON.stringify(seed))});` : ""} }`);
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
      const t0 = Date.now();
      try {
        await page.goto(base + "/app/index.html");
        await page.waitForTimeout(900);
        await fn(helpers(page, lang, name));
        check(!errors.length, "errores en la consola: " + errors.join(" | "));
        console.log(`✓ ${name} (${lang}) ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      } catch (e) {
        fails++;
        console.log(`✗ ${name} (${lang}): ${e instanceof Fallo ? e.message : String(e).split("\n")[0]}`);
        fs.mkdirSync(path.join(ROOT, "tests/e2e/fallas"), { recursive: true });
        await page.screenshot({ path: path.join(ROOT, `tests/e2e/fallas/${name}-${lang}.png`) }).catch(() => {});
      }
      await ctx.close();
    }
  }
  await browser.close();
  srv.close();
  console.log(fails ? `${fails} prueba(s) fallaron` : "todas las pruebas pasaron");
  process.exit(fails ? 1 : 0);
})();
