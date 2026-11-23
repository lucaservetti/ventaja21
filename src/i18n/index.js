// Idioma de la app. Los textos se escriben en español en el código y la compilación los envuelve
// en __t()/__tf() (scripts/i18n-core.mjs); en inglés se buscan en en.json y en portugués, en pt.json.
// Los diccionarios van en archivos aparte (app/i18n/), y arranque.js trae solo el del idioma antes de
// abrir la app; en español no se trae ninguno. (Las herramientas que arman las guías y los videos
// pueden pasarlo también en un <script type="application/json" id="i18n-<idioma>">.)
import { KEY, detectar } from "./detectar.js";

function loadDict(lang) {
  const cargado = globalThis.__EDGE21_I18N && globalThis.__EDGE21_I18N[lang];
  if (cargado) return cargado;
  try {
    const el = typeof document !== "undefined" && document.getElementById(`i18n-${lang}`);
    return el ? JSON.parse(el.textContent) : null;
  } catch {
    return null;
  }
}
export const LANG = detectar();
// El diccionario se lee la primera vez que hace falta, no al cargar este archivo: esbuild lo evalúa
// apenas arranca la página (lo inyecta en todos los archivos), antes de que llegue el diccionario.
let DICT = null;
function dict() {
  if (LANG !== "es" && !DICT) DICT = loadDict(LANG);
  return DICT;
}
export const LOCALE = { en: "en-US", pt: "pt-BR" }[LANG] || "es-UY";
export const DEC = LANG === "en" ? "." : ",";

export function __t(s) {
  const d = dict();
  return d && d[s] != null ? d[s] : s;
}
export function __tf(key, args) {
  const d = dict();
  const s = d && d[key] != null ? d[key] : key;
  return s.replace(/\{(\d+)\}/g, (_, i) => String(args[i]));
}
// Cambia el idioma y recarga, para que todo (también lo que se arma al iniciar) quede en el idioma nuevo.
export function setLang(lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // Si no se puede guardar, igual se recarga con el idioma del celular.
  }
  location.reload();
}
if (typeof document !== "undefined") document.documentElement.lang = LANG;
