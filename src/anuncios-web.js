// Anuncios en la web (iPhone y computadora) con Google AdSense, con la API de anuncios para juegos
// web (Ad Placement API: adBreak). Hay dos clases, igual que en Android:
// - entre actividades ("next"): los decide platform.js con las mismas reglas que en Android;
// - con premio ("reward"): los elige la persona, para ganar algo (la segunda oportunidad).
// La configuración está en anuncios.config.json (ver ANUNCIOS_WEB.md). Sin cliente, está apagado:
// ni siquiera se carga el código de Google.
const CFG = typeof __ADSENSE__ !== "undefined" ? __ADSENSE__ : null;
const ANUNCIOS_WEB = !!(CFG && CFG.cliente);

let listo = false;
// Carga el código de AdSense una sola vez. Mientras no termina de cargar, los pedidos quedan en la
// cola (window.adsbygoogle) y Google los atiende después.
function iniciarAnunciosWeb() {
  if (!ANUNCIOS_WEB || listo || typeof document === "undefined") return;
  listo = true;
  window.adsbygoogle = window.adsbygoogle || [];
  window.adBreak = window.adConfig = (o) => window.adsbygoogle.push(o);
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CFG.cliente)}`;
  // Google tampoco muestra más de uno cada 5 minutos (las reglas de la app son más estrictas).
  s.dataset.adFrequencyHint = "300s";
  if (CFG.prueba) s.dataset.adbreakTest = "on";
  document.head.appendChild(s);
  window.adConfig({ preloadAdBreaks: "on", sound: "on" });
}

// Un pedido de anuncio con tiempo máximo: si Google no contesta, la app sigue como si nada.
function pedir(opciones, espera) {
  return new Promise((ok) => {
    let fin = false;
    const terminar = (v) => {
      if (fin) return;
      fin = true;
      ok(v);
    };
    setTimeout(() => terminar(null), espera);
    try {
      window.adBreak({ ...opciones, adBreakDone: (info) => terminar(info || {}) });
    } catch {
      terminar(null);
    }
  });
}

// Anuncio entre actividades. Devuelve true si se mostró.
async function intersticialWeb() {
  if (!ANUNCIOS_WEB) return false;
  iniciarAnunciosWeb();
  const info = await pedir({ type: "next", name: "entre-actividades" }, 60000);
  return !!info && (info.breakStatus === "viewed" || info.breakStatus === "dismissed");
}

// Anuncio con premio. Devuelve true si se ganó el premio. Si no hay anuncio para mostrar (sin
// conexión, sin anuncios disponibles, bloqueador), el premio se da igual, como en Android.
async function premioWeb() {
  if (!ANUNCIOS_WEB) return true;
  iniciarAnunciosWeb();
  let visto = false;
  let hubo = false;
  const info = await pedir(
    {
      type: "reward",
      name: "segunda-oportunidad",
      beforeReward: (mostrar) => {
        hubo = true;
        mostrar();
      },
      adViewed: () => {
        visto = true;
      },
      adDismissed: () => {},
    },
    90000,
  );
  if (visto) return true;
  // Lo cerró antes de terminar: sin premio. Si no hubo anuncio, el premio va igual.
  return !(hubo && info && info.breakStatus === "dismissed");
}

// "Privacidad de los anuncios": vuelve a mostrar el mensaje de consentimiento de Google (donde se pide).
function privacidadWeb() {
  try {
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    window.googlefc.callbackQueue.push(() => window.googlefc.showRevocationMessage());
  } catch {
    /* sin el mensaje de Google, no hay nada que mostrar */
  }
}

export { ANUNCIOS_WEB, iniciarAnunciosWeb, intersticialWeb, premioWeb, privacidadWeb };
