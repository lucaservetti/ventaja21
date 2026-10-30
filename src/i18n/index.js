// Idioma de la app. Los textos se escriben en español en el código y la compilación los envuelve
// en __t()/__tf() (scripts/i18n-core.mjs); en inglés se buscan en en.json.
// El diccionario va aparte en el HTML, como JSON: en español ni se lee, así la app arranca antes.
function loadDict() {
  try {
    const el = document.getElementById("i18n-en");
    return el ? JSON.parse(el.textContent) : {};
  } catch {
    return {};
  }
}

const KEY = "edge21.lang";
function detect() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "es" || saved === "en") return saved;
  } catch {
    // Sin almacenamiento: se usa el idioma del celular.
  }
  const nav =
    (typeof navigator !== "undefined" &&
      ((navigator.languages && navigator.languages[0]) ||
        navigator.language)) ||
    "es";
  return /^es\b/i.test(nav) ? "es" : "en";
}

export const LANG = detect();
const DICT = LANG === "en" ? loadDict() : null;
export const LOCALE = LANG === "en" ? "en-US" : "es-UY";
export const DEC = LANG === "en" ? "." : ",";

export function __t(s) {
  return DICT && DICT[s] != null ? DICT[s] : s;
}
export function __tf(key, args) {
  const s = DICT && DICT[key] != null ? DICT[key] : key;
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
