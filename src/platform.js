// Lo que cambia en la app de Android (Play Store): algunos anuncios y la compra de Premium.
// En la web (GitHub Pages) no hay anuncios ni compras y todo queda abierto, como siempre.
// Para probar en la compu cómo se ve en Android: localStorage.setItem("v21.sim", "1") y recargar.
import { Capacitor, registerPlugin } from "@capacitor/core";
import {
  AdMob,
  AdmobConsentStatus,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
} from "@capacitor-community/admob";
import { InAppReview } from "@capacitor-community/in-app-review";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import {
  exportBackup,
  getActivityTick,
  getSessionCloud,
  getState,
  importBackup,
  setSettings,
  subscribe,
} from "./state.js";

function simulated() {
  try {
    return localStorage.getItem("v21.sim") === "1";
  } catch {
    return false;
  }
}
const NATIVE = Capacitor.isNativePlatform();
// "Modo app": la de Android, o la web simulándola.
const APP_MODE = NATIVE || simulated();

// Productos de Google Play (tienen que llamarse igual en Play Console, ver store/monetizacion.md).
const SUB_ID = "edge21_premium"; // suscripción con dos planes: "mensual" y "anual"
const PLAN_MONTHLY = "mensual";
const PLAN_YEARLY = "anual";
const LIFETIME_ID = "premium"; // pago único, para siempre

// Premium: comprado en Google Play (en Android) o marcado en tu cuenta (premium/{uid} en Firebase,
// vale también en la web). La web ya no es Premium para todos.
// En la web no se puede comprar Premium: solo vale el de la cuenta, y solo si el servidor lo
// confirmó en esta sesión. Lo guardado en el navegador no alcanza, porque se puede tocar a mano. En
// Android manda la compra de Google Play. En localhost sí se confía, para las pruebas y las capturas.
const LOCAL =
  !NATIVE &&
  typeof location !== "undefined" &&
  /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
function cloudPremiumOf(st) {
  return NATIVE || LOCAL ? st.settings.cloudPremium : getSessionCloud();
}
function hasPremium(st = getState()) {
  const c = cloudPremiumOf(st);
  return (
    ((NATIVE || LOCAL) && !!st.settings.premium) ||
    c === true ||
    (typeof c === "number" && c > Date.now())
  );
}
// Hasta cuándo dura el Premium de regalo (0 si no hay).
function giftUntil(st = getState()) {
  const c = cloudPremiumOf(st);
  return typeof c === "number" && c > Date.now() ? c : 0;
}

// Sistemas de conteo de Premium. Hi-Lo, KO y Hi-Opt I son gratis.
const PREMIUM_SYSTEMS = ["hiopt2", "zen", "omega2", "halves"];

// Pantallas que son de Premium. La ruta de desviaciones es gratis hasta el nivel 2.
function needsPremium(name, params = {}, st = getState()) {
  if (hasPremium(st)) return false;
  let locked = [
    "casino",
    "casinoPlay",
    "bankroll",
    "journal",
    "looks",
    "mistakes",
  ].includes(name);
  if (name === "devLevel") {
    const n =
      params.level ||
      Object.keys((st.devPath && st.devPath.passed) || {}).length + 1;
    locked = n >= 3;
  }
  return locked;
}

// ---- Anuncios ----
// Reglas para que no molesten:
// - nunca en medio de una lección, una tanda o la mesa: solo al volver al menú;
// - solo después de terminar 2 cosas (lecciones, tandas, ejercicios) desde el último;
// - como mucho uno cada 5 minutos y 6 por día;
// - el primer día de uso, ninguno;
// - con Premium (o la prueba gratis), ninguno.
// Los anuncios con premio son siempre opcionales: los elegís vos para ganar algo.
const AD_GAP_MS = 5 * 60 * 1000;
const ADS_PER_DAY = 6;
const ACTIVITIES_PER_AD = 2;
const GRACE_MS = 24 * 60 * 60 * 1000;
const AD_ID = __ADMOB_INTERSTITIAL__;
const REWARD_ID = __ADMOB_REWARDED__;
const ADS_KEY = "edge21.ads";
const ads = {
  ready: false,
  loaded: false,
  rewardLoaded: false,
  canRequest: false,
  lastAt: 0,
  done: 0,
  tick: 0,
};

function adsToday() {
  try {
    const d = JSON.parse(localStorage.getItem(ADS_KEY) || "{}");
    return d.day === new Date().toDateString() ? d.n || 0 : 0;
  } catch {
    return 0;
  }
}
function countAd() {
  try {
    localStorage.setItem(
      ADS_KEY,
      JSON.stringify({ day: new Date().toDateString(), n: adsToday() + 1 }),
    );
  } catch {
    // Sin almacenamiento no se cuenta: igual queda la pausa de 5 minutos.
  }
}

async function loadInterstitial() {
  if (!ads.ready || !ads.canRequest || ads.loaded) return;
  try {
    await AdMob.prepareInterstitial({ adId: AD_ID });
    ads.loaded = true;
  } catch {
    ads.loaded = false;
  }
}
async function loadRewarded() {
  if (!ads.ready || !ads.canRequest || ads.rewardLoaded) return;
  try {
    await AdMob.prepareRewardVideoAd({ adId: REWARD_ID });
    ads.rewardLoaded = true;
  } catch {
    ads.rewardLoaded = false;
  }
}

async function initAds() {
  if (!NATIVE || hasPremium()) return;
  try {
    // Consentimiento (Europa y otros lugares que lo piden): Google muestra su formulario si hace falta.
    const info = await AdMob.requestConsentInfo();
    let status = info;
    if (
      info.status === AdmobConsentStatus.REQUIRED &&
      info.isConsentFormAvailable
    )
      status = await AdMob.showConsentForm();
    ads.canRequest = status.canRequestAds !== false;
    await AdMob.initialize();
    ads.ready = true;
    loadInterstitial();
    loadRewarded();
  } catch {
    ads.ready = false;
  }
}

// Se llama al volver a una pestaña. Si mientras tanto terminaste algo, cuenta; y si se cumplen
// todas las reglas de arriba, aparece un anuncio. Devuelve cuántos van hoy si mostró uno (si no, 0).
async function maybeShowAd() {
  const tick = getActivityTick();
  if (tick !== ads.tick) {
    ads.tick = tick;
    ads.done++;
  }
  if (!NATIVE || hasPremium() || !ads.loaded) return 0;
  const now = Date.now();
  const created = getState().profile.createdAt || now;
  if (
    ads.done < ACTIVITIES_PER_AD ||
    now - created < GRACE_MS ||
    now - ads.lastAt < AD_GAP_MS ||
    adsToday() >= ADS_PER_DAY
  )
    return 0;
  let shown = 0;
  try {
    ads.loaded = false;
    ads.lastAt = now;
    ads.done = 0;
    countAd();
    // Se espera a que lo cierren, así lo que venga después no queda tapado por el anuncio.
    let closeAd;
    const closed = new Promise((resolve) => {
      closeAd = resolve;
      setTimeout(resolve, 60000);
    });
    const handle = await AdMob.addListener(
      InterstitialAdPluginEvents.Dismissed,
      () => closeAd(),
    );
    try {
      await AdMob.showInterstitial();
      await closed;
    } finally {
      handle.remove();
    }
    shown = adsToday();
  } catch {
    /* si no se pudo mostrar, no pasa nada */
  }
  setTimeout(loadInterstitial, 1500);
  return shown;
}

// Anuncio con premio, que la persona elige mirar. Devuelve true si se ganó el premio.
// Si no hay anuncio para mostrar (sin conexión, sin anuncios disponibles), el premio se da igual.
async function watchAdForReward() {
  if (!APP_MODE || hasPremium()) return true;
  if (!NATIVE) return true; // web simulando Android: no hay anuncios de verdad
  if (!ads.rewardLoaded) {
    await loadRewarded();
    if (!ads.rewardLoaded) return true;
  }
  ads.rewardLoaded = false;
  const handles = [];
  const result = await new Promise((resolve) => {
    let earned = false;
    let settled = false;
    const end = (v) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    Promise.all([
      AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        earned = true;
      }),
      // Al cerrarlo se espera un instante: el aviso del premio puede llegar justo después.
      AdMob.addListener(RewardAdPluginEvents.Dismissed, () =>
        setTimeout(() => end(earned), 400),
      ),
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => end(true)),
    ])
      .then((hs) => {
        handles.push(...hs);
        return AdMob.showRewardVideoAd();
      })
      .then(() => {
        earned = true;
      })
      .catch(() => end(true));
  });
  for (const h of handles) h.remove();
  setTimeout(loadRewarded, 1500);
  return result;
}

// Botón de "Privacidad de los anuncios" (obligatorio donde se pide consentimiento).
async function showAdPrivacy() {
  if (!NATIVE) return;
  try {
    await AdMob.showPrivacyOptionsForm();
  } catch {
    /* no hace falta en esta región */
  }
}

// ---- Compra de Premium (Google Play Billing, con cordova-plugin-purchase) ----
// Tres opciones: mensual, anual (con 7 días gratis para quien nunca la tuvo) y para siempre.
const shop = {
  ready: false,
  plans: {}, // monthly, yearly, lifetime: { price, micros, currency, offerId, trialDays }
  kind: null, // "sub" o "lifetime": lo que tenés
  error: null,
  busy: false,
  listeners: new Set(),
};
function emitShop() {
  for (const fn of shop.listeners) fn();
}
function onShop(fn) {
  shop.listeners.add(fn);
  return () => shop.listeners.delete(fn);
}

// "P1W" → 7, "P3D" → 3, "P1M" → 30.
function periodDays(p) {
  const m = /^P(\d+)([DWMY])$/.exec(p || "");
  if (!m) return 0;
  return Number(m[1]) * { D: 1, W: 7, M: 30, Y: 365 }[m[2]];
}
function readPlans(C) {
  const { store, Platform } = C;
  const plans = {};
  const sub = store.get(SUB_ID, Platform.GOOGLE_PLAY);
  for (const o of (sub && sub.offers) || []) {
    const base = o.id.split("@")[1];
    const phases = o.pricingPhases || [];
    const paid = phases.find((p) => p.priceMicros > 0) || phases[0];
    if (!paid) continue;
    const key =
      base === PLAN_MONTHLY
        ? "monthly"
        : base === PLAN_YEARLY
          ? "yearly"
          : null;
    if (!key) continue;
    const trial = phases.find((p) => p.paymentMode === "FreeTrial");
    const plan = {
      price: paid.price,
      micros: paid.priceMicros,
      currency: paid.currency,
      offerId: o.id,
      trialDays: trial ? periodDays(trial.billingPeriod) || 7 : 0,
    };
    // Google solo manda la oferta con prueba gratis a quien puede usarla; si está, gana.
    if (!plans[key] || (plan.trialDays && !plans[key].trialDays))
      plans[key] = plan;
  }
  const life = store.get(LIFETIME_ID, Platform.GOOGLE_PLAY);
  if (life && life.pricing)
    plans.lifetime = {
      price: life.pricing.price,
      micros: life.pricing.priceMicros,
      currency: life.pricing.currency,
      offerId: null,
      trialDays: 0,
    };
  return plans;
}

let shopInitialized = false;
async function initShop() {
  if (!NATIVE) return;
  // El plugin se carga con la app nativa; puede tardar un instante en aparecer.
  for (let i = 0; i < 50 && !window.CdvPurchase; i++)
    await new Promise((r) => setTimeout(r, 100));
  const C = window.CdvPurchase;
  if (!C) return;
  const { store, ProductType, Platform } = C;
  store.register([
    {
      id: SUB_ID,
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.GOOGLE_PLAY,
    },
    {
      id: LIFETIME_ID,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.GOOGLE_PLAY,
    },
  ]);
  const sync = () => {
    const life = store.owned(LIFETIME_ID);
    const sub = store.owned(SUB_ID);
    const owned = life || sub;
    shop.kind = life ? "lifetime" : sub ? "sub" : null;
    // Antes de que la tienda termine de cargar no se saca Premium (las compras llegan después).
    if (owned !== !!getState().settings.premium && (owned || shopInitialized))
      setSettings({ premium: owned });
    shop.plans = readPlans(C);
    shop.ready = Object.keys(shop.plans).length > 0;
    emitShop();
  };
  store
    .when()
    .productUpdated(sync)
    .approved((t) => t.verify())
    .verified((r) => r.finish())
    .finished(() => {
      sync();
      if (getState().settings.premium) shop.busy = false;
      emitShop();
    })
    .receiptUpdated(sync);
  store.error((e) => {
    shop.error = e && e.message;
    shop.busy = false;
    emitShop();
  });
  await store.initialize([Platform.GOOGLE_PLAY]);
  shopInitialized = true;
  sync();
}

// plan: "monthly", "yearly" o "lifetime".
async function buyPremium(plan = "yearly") {
  const C = window.CdvPurchase;
  if (!C) {
    shop.error = "La tienda no está disponible.";
    emitShop();
    return;
  }
  let offer = null;
  if (plan === "lifetime") {
    const p = C.store.get(LIFETIME_ID, C.Platform.GOOGLE_PLAY);
    offer = p && p.getOffer();
  } else {
    const info = shop.plans[plan];
    const p = C.store.get(SUB_ID, C.Platform.GOOGLE_PLAY);
    offer = info && p ? p.getOffer(info.offerId) : null;
  }
  if (!offer) {
    shop.error = "No pudimos cargar el precio. Revisá la conexión.";
    emitShop();
    return;
  }
  shop.error = null;
  shop.busy = true;
  emitShop();
  const err = await offer.order();
  if (err) {
    shop.busy = false;
    shop.error =
      err.code === C.ErrorCode.PAYMENT_CANCELLED ? null : err.message;
    emitShop();
  }
}

async function restorePremium() {
  const C = window.CdvPurchase;
  if (!C) return;
  shop.busy = true;
  emitShop();
  await C.store.restorePurchases();
  shop.busy = false;
  emitShop();
}

// Abre la pantalla de Google Play para cambiar de plan o cancelar.
function manageSubscription() {
  const C = window.CdvPurchase;
  if (C) C.store.manageSubscriptions(C.Platform.GOOGLE_PLAY);
}

// Pedido de reseña de Google Play, en un buen momento (al ganar un logro): solo después de 3 días
// de uso y como mucho una vez cada 90 días. Google decide si muestra la ventanita o no.
const REVIEW_KEY = "edge21.review";
function maybeAskReview() {
  if (!NATIVE) return;
  try {
    const created = getState().profile.createdAt || Date.now();
    const last = Number(localStorage.getItem(REVIEW_KEY) || 0);
    const day = 24 * 60 * 60 * 1000;
    if (Date.now() - created < 3 * day || Date.now() - last < 90 * day) return;
    localStorage.setItem(REVIEW_KEY, String(Date.now()));
    setTimeout(() => InAppReview.requestReview().catch(() => {}), 1500);
  } catch {
    // Sin almacenamiento no se pide.
  }
}

// ---- Copia automática del progreso ----
// El progreso también se guarda en un archivo de la app. Android lo incluye en su copia de
// seguridad automática en Google Drive: al reinstalar o cambiar de celular con la misma cuenta
// de Google, el progreso vuelve solo, sin crear ninguna cuenta.
const MIRROR = "progreso.txt";
async function restoreFromMirror() {
  if (getState().profile.onboarded) return;
  try {
    const r = await Filesystem.readFile({
      path: MIRROR,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    importBackup(r.data);
  } catch {
    // No hay copia (primera vez) o no se pudo leer.
  }
}
function keepMirror() {
  let timer = 0;
  const write = () => {
    if (!getState().profile.onboarded) return;
    Filesystem.writeFile({
      path: MIRROR,
      data: exportBackup(),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    }).catch(() => {});
  };
  subscribe(() => {
    clearTimeout(timer);
    timer = setTimeout(write, 4000);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(timer);
      write();
    }
  });
}

// Si en Android elegiste letra grande, la app activa "Letra más grande" (una vez por cada cambio
// en los ajustes del celular; después manda lo que elijas en la app).
const FontScale = registerPlugin("FontScale");
async function followSystemFont() {
  try {
    const { scale } = await FontScale.get();
    const st = getState().settings;
    if (!scale || st.systemFontScale === scale) return;
    setSettings({
      systemFontScale: scale,
      bigText: scale >= 1.15 ? true : st.bigText,
    });
  } catch {
    // Versión vieja de la app sin el complemento: no pasa nada.
  }
}

// Botón "atrás" de Android. fn(canGoBack) devuelve false si no hay nada que hacer: ahí se cierra
// la app. Sin esto Capacitor ya vuelve atrás en el historial, pero cierra la app en cualquier
// pestaña.
const AppPlugin = NATIVE ? registerPlugin("App") : null;
function onAndroidBack(fn) {
  if (!AppPlugin) return undefined;
  const h = AppPlugin.addListener("backButton", ({ canGoBack }) => {
    if (!fn(canGoBack)) AppPlugin.exitApp();
  });
  return () => {
    Promise.resolve(h).then((x) => x && x.remove());
  };
}

function initPlatform() {
  if (!NATIVE) return;
  followSystemFont();
  restoreFromMirror().finally(keepMirror);
  initShop().catch(() => {});
  initAds();
}

export {
  APP_MODE,
  NATIVE,
  PREMIUM_SYSTEMS,
  buyPremium,
  giftUntil,
  hasPremium,
  initPlatform,
  manageSubscription,
  maybeAskReview,
  maybeShowAd,
  needsPremium,
  onAndroidBack,
  onShop,
  restorePremium,
  shop,
  showAdPrivacy,
  watchAdForReward,
};
