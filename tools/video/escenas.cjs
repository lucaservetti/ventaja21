// Escenas que se graban de la app. Cada una es una lista de toques y esperas en tiempo de video:
// v.wait(ms) avanza el video, v.tap(...) toca algo (con el círculo del dedo), v.tab("Entrenar", "Train")
// cambia de pestaña y v.scroll(px) baja la pantalla suave. Si run devuelve false, la escena salió
// mal (por ejemplo, la jugada no era la correcta) y con probar: true se busca otra semilla.
module.exports = {
  // Para el video "¿Sabés jugar esta mano?": aparece la mano, 3 segundos para pensar y la respuesta.
  // Arranca directo en Entrenar, para que la mano aparezca en el primer segundo.
  quiz: {
    probar: true,
    estado: (s) => ({ ...s, lastTab: "entrenar" }),
    async run(v) {
      await v.wait(300);
      await v.tap(v.text("Repartir 10 manos", "Deal 10 hands"));
      await v.wait(4300); // la cuenta regresiva del video va acá
      await v.tap(".act-btn.act-S");
      await v.wait(200);
      const txt = await v.page.locator(".layer.full").last().innerText();
      if (/No era esa|Not that one/.test(txt)) return false;
      await v.wait(3600);
    },
  },
  count: {
    estado: (s) => ({ ...s, lastTab: "conteo" }),
    async run(v) {
      await v.wait(500);
      await v.tap(v.text("Empezar el nivel 4", "Start level 4"));
      await v.wait(1000);
      await v.tap(v.text("Practicar con ayuda", "Practice with help", true));
      await v.wait(800);
      const go = v.page.getByRole("button", { name: v.W("Empezar", "Start"), exact: true });
      if (await go.count()) await v.tap(go);
      await v.wait(6000);
    },
  },
  table: {
    estado: (s) => ({ ...s, lastTab: "jugar" }),
    async run(v) {
      await v.wait(600);
      await v.tap("section:not([hidden]) .chip-rack .chip >> nth=2");
      await v.wait(500);
      await v.tap(`section:not([hidden]) button:has-text("${v.W("Repartir", "Deal")}")`);
      await v.wait(4800);
    },
  },
  learn: {
    async run(v) {
      await v.wait(300);
      await v.tab("Aprender", "Learn");
      await v.wait(2200);
      await v.scroll(520, 1400);
      await v.wait(2600);
    },
  },
  progress: {
    async run(v) {
      await v.wait(300);
      await v.tab("Progreso", "Progress");
      await v.wait(1600);
      await v.scroll(640, 1400);
      await v.wait(2600);
    },
  },
  train: {
    probar: true,
    async run(v) {
      await v.wait(300);
      await v.tab("Entrenar", "Train");
      await v.wait(700);
      await v.tap(v.text("Repartir 10 manos", "Deal 10 hands"));
      await v.wait(1600);
      await v.tap(".act-btn.act-S");
      await v.wait(200);
      const txt = await v.page.locator(".layer.full").last().innerText();
      if (/No era esa|Not that one/.test(txt)) return false;
      await v.wait(2600);
    },
  },
};
