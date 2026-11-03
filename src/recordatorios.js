// Recordatorios para practicar (solo en la app de Android): notificaciones que programa el mismo
// celular, sin servidor y sin mandar ningún dato. Qué días y a qué hora los elige la persona en
// Ajustes → Recordatorios (ver recordatorios-plan.js). Cada vez que abre la app o practica, se
// vuelven a calcular: si ese día ya practicó, el recordatorio no sale.
import { LocalNotifications } from "@capacitor/local-notifications";
import { NATIVE } from "./platform.js";
import {
  dayKey,
  getState,
  goalMet,
  goalStreak,
  setSettings,
  subscribe,
} from "./state.js";
import {
  ID_PRACTICA,
  ID_RACHA,
  planRecordatorios,
} from "./recordatorios-plan.js";

const CANAL = "recordatorios";
const DEFAULT = {
  on: false,
  dias: [0, 1, 2, 3, 4, 5, 6],
  hora: "19:00",
  racha: true,
};

function ajustes(st = getState()) {
  return { ...DEFAULT, ...(st.settings.recordatorios || {}) };
}
function infoHoy(st = getState()) {
  const hoy = dayKey();
  const hoyHecho =
    goalMet(st, hoy) ||
    !!(st.daily && st.daily.results && st.daily.results[hoy]);
  return { hoyHecho, racha: goalStreak(st) };
}
const nuestros = (id) => id >= ID_PRACTICA && id < ID_RACHA + 100;

// ¿Se pueden mostrar notificaciones? "granted", "denied" o "prompt".
async function permiso() {
  if (!NATIVE) return "denied";
  try {
    return (await LocalNotifications.checkPermissions()).display;
  } catch {
    return "denied";
  }
}
async function pedirPermiso() {
  if (!NATIVE) return "denied";
  try {
    return (await LocalNotifications.requestPermissions()).display;
  } catch {
    return "denied";
  }
}

let firma = "";
let corriendo = Promise.resolve();
// Borra los recordatorios programados y vuelve a programar los que tocan.
function reprogramar(forzar = false) {
  if (!NATIVE) return Promise.resolve();
  const st = getState();
  const rec = ajustes(st);
  const info = infoHoy(st);
  const nueva = JSON.stringify([rec, info, dayKey()]);
  if (!forzar && nueva === firma) return corriendo;
  firma = nueva;
  corriendo = corriendo.then(async () => {
    try {
      const { notifications } = await LocalNotifications.getPending();
      const viejos = notifications.filter((n) => nuestros(n.id));
      if (viejos.length)
        await LocalNotifications.cancel({
          notifications: viejos.map((n) => ({ id: n.id })),
        });
      if (!rec.on || (await permiso()) !== "granted") return;
      const plan = planRecordatorios(rec, info, new Date());
      if (!plan.length) return;
      await LocalNotifications.schedule({
        notifications: plan.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          extra: n.extra,
          channelId: CANAL,
          schedule: { at: n.at, allowWhileIdle: true },
          // Sin alarma exacta: unos minutos de diferencia no importan, y así Android no pide permisos.
          isExactNotification: false,
        })),
      });
    } catch {
      firma = "";
    }
  });
  return corriendo;
}

// Una notificación de prueba en 5 segundos (botón "Probar" de la pantalla de ajustes).
async function probarRecordatorio() {
  if (!NATIVE) return false;
  if ((await permiso()) !== "granted" && (await pedirPermiso()) !== "granted")
    return false;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 3000,
        title: "Así se ven los recordatorios 🃏",
        body: "Te vamos a avisar los días y a la hora que elegiste.",
        channelId: CANAL,
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
        isExactNotification: false,
        extra: { ir: "conteo" },
      },
    ],
  });
  return true;
}

// Cambiar los ajustes. Al prenderlos, pide el permiso de Android; si no lo dan, quedan apagados.
async function setRecordatorios(cambios) {
  const rec = { ...ajustes(), ...cambios };
  if (
    cambios.on &&
    NATIVE &&
    (await permiso()) !== "granted" &&
    (await pedirPermiso()) !== "granted"
  ) {
    setSettings({ recordatorios: { ...rec, on: false } });
    return "denied";
  }
  setSettings({ recordatorios: rec });
  await reprogramar(true);
  return "ok";
}

function initRecordatorios() {
  if (!NATIVE) return;
  LocalNotifications.createChannel({
    id: CANAL,
    name: "Recordatorios",
    description: "Recordatorios para practicar y avisos de racha",
    importance: 3,
  }).catch(() => {});
  // Tocar la notificación abre la pestaña del desafío diario.
  LocalNotifications.addListener("localNotificationActionPerformed", (a) => {
    const ir =
      a && a.notification && a.notification.extra && a.notification.extra.ir;
    if (ir) window.dispatchEvent(new CustomEvent("v21-ir", { detail: ir }));
  }).catch(() => {});
  let t = 0;
  subscribe(() => {
    clearTimeout(t);
    t = setTimeout(() => reprogramar(), 3000);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") reprogramar();
  });
  setTimeout(() => reprogramar(true), 2000);
}

export {
  ajustes as ajustesRecordatorios,
  initRecordatorios,
  pedirPermiso,
  permiso,
  probarRecordatorio,
  reprogramar,
  setRecordatorios,
};
