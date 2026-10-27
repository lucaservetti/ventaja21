// Lo que cambia en la app de Android (Play Store): anuncios de vez en cuando y la compra de Premium.
// En la web (GitHub Pages) no hay anuncios ni compras y todo queda abierto, como siempre.
// Para probar en la compu cómo se ve en Android: localStorage.setItem("v21.sim", "1") y recargar.
import { Capacitor } from "@capacitor/core";
import { AdMob, AdmobConsentStatus } from "@capacitor-community/admob";
import { getState, setSettings } from "./state.js";

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

const PREMIUM_ID = "premium";
const AD_EVERY_MS = 4 * 60 * 1000; // como mucho un anuncio cada 4 minutos
const FIRST_AD_AFTER_MS = 3 * 60 * 1000; // y nunca en los primeros 3 minutos de uso
const AD_ID = __ADMOB_INTERSTITIAL__;

function hasPremium(st = getState()) {
  return !APP_MODE || !!st.settings.premium;
}

// Pantallas que son de Premium. La ruta de desviaciones es gratis hasta el nivel 2.
function needsPremium(name, params = {}, st = getState()) {
  if (hasPremium(st)) return false;
  if (["casino", "casinoPlay", "bankroll", "journal"].includes(name))
    return true;
  if (name === "devLevel") {
    const n =
      params.level ||
      Object.keys((st.devPath && st.devPath.passed) || {}).length + 1;
    return n >= 3;
  }
  return false;
}

// ---- Anuncios ----
const ads = { ready: false, loaded: false, canRequest: false, lastAt: 0 };
const startedAt = Date.now();

async function loadInterstitial() {
  if (!ads.ready || !ads.canRequest || ads.loaded) return;
  try {
    await AdMob.prepareInterstitial({ adId: AD_ID });
    ads.loaded = true;
  } catch {
    ads.loaded = false;
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
  } catch {
    ads.ready = false;
  }
}

// Se llama al terminar algo (volver a una pestaña después de una lección, una tanda o un ejercicio).
// Nunca interrumpe una práctica.
async function maybeShowAd() {
  if (!NATIVE || hasPremium() || !ads.loaded) return;
  const now = Date.now();
  if (now - startedAt < FIRST_AD_AFTER_MS || now - ads.lastAt < AD_EVERY_MS)
    return;
  try {
    ads.loaded = false;
    ads.lastAt = now;
    await AdMob.showInterstitial();
  } catch {
    /* si no se pudo mostrar, no pasa nada */
  }
  setTimeout(loadInterstitial, 1500);
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
const shop = {
  ready: false,
  price: null,
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
      id: PREMIUM_ID,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.GOOGLE_PLAY,
    },
  ]);
  const sync = () => {
    const owned = store.owned(PREMIUM_ID);
    if (owned !== !!getState().settings.premium)
      setSettings({ premium: owned });
    const p = store.get(PREMIUM_ID, Platform.GOOGLE_PLAY);
    shop.price = p && p.pricing ? p.pricing.price : shop.price;
    shop.ready = !!p;
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
  sync();
}

async function buyPremium() {
  const C = window.CdvPurchase;
  if (!C) {
    shop.error = "La tienda no está disponible.";
    emitShop();
    return;
  }
  const p = C.store.get(PREMIUM_ID, C.Platform.GOOGLE_PLAY);
  const offer = p && p.getOffer();
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

function initPlatform() {
  if (!NATIVE) return;
  initShop().catch(() => {});
  initAds();
}

export {
  APP_MODE,
  NATIVE,
  buyPremium,
  hasPremium,
  initPlatform,
  maybeShowAd,
  needsPremium,
  onShop,
  restorePremium,
  shop,
  showAdPrivacy,
};
