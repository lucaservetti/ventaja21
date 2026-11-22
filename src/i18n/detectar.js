// Qué idioma usa la app: el que eligió la persona o, si no eligió, el del celular.
// Lo usan el arranque (para traer el diccionario antes de abrir la app) e index.js.
export const KEY = "edge21.lang";
export function detectar() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "es" || saved === "en" || saved === "pt") return saved;
  } catch {
    // Sin almacenamiento: se usa el idioma del celular.
  }
  const nav =
    (typeof navigator !== "undefined" &&
      ((navigator.languages && navigator.languages[0]) ||
        navigator.language)) ||
    "es";
  return /^es\b/i.test(nav) ? "es" : /^pt\b/i.test(nav) ? "pt" : "en";
}
