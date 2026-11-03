// Pagar Premium desde la web (iPhone, computadora) con Paddle. Paddle cobra (tarjeta, Apple Pay,
// Google Pay, PayPal), se encarga de los impuestos de cada país y le avisa al servidor
// (servidor/index.js → /pagos/paddle), que anota Premium en la cuenta de Google. Por eso hace falta
// entrar con Google antes de pagar: así el Premium queda en la cuenta y sirve en todos lados.
// La configuración está en pagos.config.json (ver PAGOS_WEB.md). Sin token, está apagado.
// En la app de Android esto no se usa: ahí se compra con Google Play (lo piden sus reglas).
import { APP_MODE } from "./platform.js";
import { LANG } from "./i18n/index.js";

const CFG = typeof __PAGOS__ !== "undefined" ? __PAGOS__ : null;
const PRECIOS = (CFG && CFG.paddle && CFG.paddle.precios) || {};
// Encendido solo en la web, con token y con los precios cargados.
const PAGOS_WEB = !!(
  !APP_MODE &&
  CFG &&
  CFG.paddle &&
  CFG.paddle.token &&
  PRECIOS.monthly &&
  PRECIOS.yearly &&
  PRECIOS.lifetime
);
const MOSTRAR = (CFG && CFG.mostrar) || {};

let cargando = null;
const oyentes = new Set();
function avisar(e) {
  for (const f of oyentes) f(e);
}
// Avisos del pago: "listo" (pagó), "cerrado" (cerró sin pagar), "error".
function onPagoWeb(f) {
  oyentes.add(f);
  return () => oyentes.delete(f);
}

function cargarPaddle() {
  if (cargando) return cargando;
  cargando = new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.async = true;
    s.onload = () => {
      try {
        const P = window.Paddle;
        if (CFG.paddle.entorno === "sandbox") P.Environment.set("sandbox");
        P.Initialize({
          token: CFG.paddle.token,
          eventCallback: (ev) => {
            if (!ev || !ev.name) return;
            if (ev.name === "checkout.completed") avisar("listo");
            else if (ev.name === "checkout.closed") avisar("cerrado");
            else if (ev.name === "checkout.error") avisar("error");
          },
        });
        ok(P);
      } catch (e) {
        cargando = null;
        mal(e);
      }
    };
    s.onerror = () => {
      cargando = null;
      s.remove();
      mal(new Error("no cargó Paddle"));
    };
    document.head.appendChild(s);
  });
  return cargando;
}

// Abre el pago de Paddle para el plan (monthly, yearly o lifetime) y la cuenta de Google.
async function pagarWeb(plan, acct) {
  if (!PAGOS_WEB || !acct || !PRECIOS[plan]) return false;
  const P = await cargarPaddle();
  P.Checkout.open({
    items: [{ priceId: PRECIOS[plan], quantity: 1 }],
    customer: acct.email ? { email: acct.email } : undefined,
    customData: { uid: acct.uid },
    settings: {
      displayMode: "overlay",
      theme: "dark",
      locale: LANG === "en" ? "en" : "es",
      allowLogout: false,
    },
  });
  return true;
}

export { MOSTRAR, PAGOS_WEB, onPagoWeb, pagarWeb };
