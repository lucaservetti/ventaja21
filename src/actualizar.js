// Aviso de versión nueva en Android. La versión publicada en Google Play se anota a mano en
// /version.json del sitio (ver PLAY_STORE.md, "Actualizar la app"):
// - "ultima": la que está en Play. Si la app es más vieja, aparece el aviso (se puede cerrar).
// - "minima": la más vieja que sigue andando bien. Si la app es más vieja, el aviso no se cierra.
// En la web no hace falta: se actualiza sola (ver el service worker en main.jsx).
import { useSyncExternalStore } from "react";
import { APP_MODE, NATIVE } from "./platform.js";

const TIENDA =
  "https://play.google.com/store/apps/details?id=com.lucaservetti.ventaja21";
const CERRADO = "v21.update";
let aviso = null;
const subs = new Set();
const avisar = () => subs.forEach((f) => f());

// -1 si a es más vieja que b, 0 si son iguales, 1 si es más nueva ("1.13.0" contra "1.14.0").
function comparar(a, b) {
  const x = String(a).split(".").map(Number);
  const y = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return Math.sign(d);
  }
  return 0;
}
async function revisarVersion() {
  if (!APP_MODE) return;
  try {
    const url = NATIVE ? "https://edge21.app/version.json" : "../version.json";
    const v = await (await fetch(url, { cache: "no-store" })).json();
    if (!v || !v.ultima || comparar(__APP_VERSION__, v.ultima) >= 0) return;
    const obligatoria = !!v.minima && comparar(__APP_VERSION__, v.minima) < 0;
    let cerrado = false;
    try {
      cerrado = localStorage.getItem(CERRADO) === v.ultima;
    } catch {
      // Sin almacenamiento: se muestra.
    }
    if (cerrado && !obligatoria) return;
    aviso = { ultima: v.ultima, obligatoria };
    avisar();
  } catch {
    // Sin conexión: se revisa la próxima vez.
  }
}
function cerrarAviso() {
  if (!aviso || aviso.obligatoria) return;
  try {
    localStorage.setItem(CERRADO, aviso.ultima);
  } catch {
    // Igual se cierra por ahora.
  }
  aviso = null;
  avisar();
}
function useAvisoVersion() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => aviso,
  );
}

export { TIENDA, cerrarAviso, comparar, revisarVersion, useAvisoVersion };
