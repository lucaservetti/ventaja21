// Punto de entrada de la app. Antes de abrirla trae el diccionario del idioma (i18n/<idioma>-<huella>.json):
// así cada persona descarga solo el suyo, y en español ninguno. Los textos se traducen al cargar cada
// módulo, por eso la app (main.jsx) se importa recién cuando el diccionario está listo.
// Si no se puede traer (sin internet y sin la copia guardada), la app abre igual, en español.
import { detectar } from "./detectar.js";

const lang = detectar();
async function cargar() {
  if (lang === "es") return;
  try {
    // eslint-disable-next-line no-undef
    const r = await fetch(__I18N__[lang]);
    if (r.ok) globalThis.__EDGE21_I18N = { [lang]: await r.json() };
  } catch {
    // Se sigue en español.
  }
}
cargar().then(() => import("../main.jsx"));
