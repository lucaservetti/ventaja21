// Edge 21 Premium: por mes, por año (con prueba gratis) o para siempre. Sin anuncios y con todo lo avanzado.
import { useEffect, useState } from "react";
import { useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { Button, cx } from "../ui/components.jsx";
import { TopBar } from "../ui/common.jsx";
import {
  APP_MODE,
  NATIVE,
  buyPremium,
  earnFeatureTrial,
  hasPremium,
  manageSubscription,
  onShop,
  restorePremium,
  shop,
  showAdPrivacy,
  trialFor,
} from "../platform.js";
import { useNav } from "../nav.js";
import { ACCOUNTS, useAccount } from "../cloud.js";

const FEATURES = {
  casino: "El modo casino real",
  casinoPlay: "El modo casino real",
  bankroll: "El simulador de banca",
  journal: "El diario de casino real",
  devLevel: "La ruta de desviaciones completa",
  looks: "Elegir paños y mazos",
  mistakes: "El análisis de tus errores",
  systems: "Usar sistemas de conteo avanzados",
};
// Funciones que no son una pantalla sino una hoja (se abren desde el menú).
const SHEET_FEATURES = { systems: "system" };
// Cada función (menos "sin anuncios") se puede probar 30 minutos una vez, mirando un anuncio.
const PERKS = [
  {
    icon: "close",
    title: "Sin anuncios",
    sub: "Nunca más, en ninguna pantalla.",
  },
  {
    icon: "crown",
    feature: "casino",
    title: "Modo casino real",
    sub: "Tu plata, límites de mesa, tiempo para decidir, vigilancia, modo turista y el examen con certificado.",
  },
  {
    icon: "target",
    feature: "devLevel",
    title: "Ruta de desviaciones completa",
    sub: "Los 10 niveles: los Illustrious 18, el Fab 4 y calcular el conteo real.",
  },
  {
    icon: "stats",
    feature: "bankroll",
    title: "Simulador de banca",
    sub: "Cuánta plata necesitás y tu riesgo de quebrar, en tu moneda.",
  },
  {
    icon: "eye",
    feature: "mistakes",
    title: "Análisis de tus errores",
    sub: "Tu tabla pintada según dónde fallás, las jugadas que más te cuestan y cómo vas mejorando.",
  },
  {
    icon: "sparkle",
    feature: "looks",
    title: "Paños y mazos",
    sub: "El color de la mesa, el dorso de las cartas y el mazo de 4 colores.",
  },
  {
    icon: "layers",
    feature: "systems",
    title: "Sistemas de conteo avanzados",
    sub: "Hi-Opt II, Zen, Omega II y Wong Halves. Hi-Lo, KO y Hi-Opt I siguen gratis.",
  },
  {
    icon: "book",
    feature: "journal",
    title: "Diario de casino real",
    sub: "Anotá lo que jugás de verdad y mirá tu resultado por hora.",
  },
];
// Precios de muestra para ver la pantalla en la compu (en el celular vienen de Google Play,
// en la moneda de cada país).
const SAMPLE = {
  monthly: { micros: 2990000, currency: "USD", trialDays: 0 },
  yearly: { micros: 19990000, currency: "USD", trialDays: 5 },
  lifetime: { micros: 49990000, currency: "USD", trialDays: 0 },
};
function money(micros, currency) {
  try {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: currency || "USD",
    }).format(micros / 1e6);
  } catch {
    return (micros / 1e6).toFixed(2);
  }
}

function Premium({ feature, then }) {
  const st = useStore();
  const nav = useNav();
  const [, setTick] = useState(0);
  const [plan, setPlan] = useState("yearly");
  const [passBusy, setPassBusy] = useState(false);
  useEffect(() => onShop(() => setTick((x) => x + 1)), []);
  const owned = hasPremium(st);
  const { acct } = useAccount();
  // En la web (no en Android) todavía no se puede pagar: Premium llega por la cuenta.
  const web = !APP_MODE;
  const trial = trialFor(feature, st);
  const plans = NATIVE
    ? shop.plans
    : Object.fromEntries(
        Object.entries(SAMPLE).map(([k, p]) => [
          k,
          { ...p, price: money(p.micros, p.currency) },
        ]),
      );
  const m = plans.monthly;
  const y = plans.yearly;
  const save =
    m && y && m.currency === y.currency
      ? Math.round((1 - y.micros / (12 * m.micros)) * 100)
      : 0;
  const options = [
    y && {
      id: "yearly",
      name: "Anual",
      price: `${y.price} al año`,
      note: `${money(y.micros / 12, y.currency)} por mes`,
      badge: y.trialDays
        ? `${y.trialDays} días gratis`
        : save > 0
          ? `Ahorrás ${save} %`
          : null,
      extra: y.trialDays && save > 0 ? `Ahorrás ${save} %` : null,
    },
    m && {
      id: "monthly",
      name: "Mensual",
      price: `${m.price} al mes`,
      note: "Cancelás cuando quieras",
    },
    plans.lifetime && {
      id: "lifetime",
      name: "Para siempre",
      price: plans.lifetime.price,
      note: "Un solo pago, sin suscripción",
    },
  ].filter(Boolean);
  const pick = options.find((o) => o.id === plan)
    ? plan
    : options[0] && options[0].id;
  const info = pick ? plans[pick] : null;
  const cta = !info
    ? "Cargando precios…"
    : pick === "lifetime"
      ? `Comprar · ${info.price}`
      : info.trialDays
        ? `Probar ${info.trialDays} días gratis`
        : `Suscribirme · ${info.price} ${pick === "yearly" ? "al año" : "al mes"}`;
  const terms = !info
    ? null
    : pick === "lifetime"
      ? "Pagás una vez y Premium es tuyo para siempre en esta cuenta de Google."
      : info.trialDays
        ? `Gratis por ${info.trialDays} días; después, ${info.price} por año. Se renueva solo y lo cancelás cuando quieras en Google Play. Si cancelás antes de que termine la prueba, no se te cobra nada.`
        : `${info.price} por ${pick === "yearly" ? "año" : "mes"}. Se renueva solo y lo cancelás cuando quieras en Google Play.`;

  async function tryWithAd(f = feature, params = then) {
    setPassBusy(f);
    const ok = await earnFeatureTrial(f);
    setPassBusy(false);
    if (ok && f) openFeature(f, params);
  }
  function openFeature(f, params) {
    if (SHEET_FEATURES[f]) {
      nav.pop();
      nav.openSheet(SHEET_FEATURES[f]);
    } else nav.replace(f, params || {});
  }

  return (
    <div className="premium fade-up">
      <TopBar onClose={() => nav.pop()} closeIcon="back" title="Premium" />
      <div className="prem-hero">
        <span className="cert-seal" aria-hidden="true">
          <Icon name="crown" size={34} stroke={2.2} />
        </span>
        <h1 className="prem-title">Edge 21 Premium</h1>
        <p className="muted">
          {owned
            ? shop.kind === "lifetime"
              ? "Tenés Premium para siempre. ¡Gracias por apoyar la app!"
              : "¡Ya sos Premium! Gracias por apoyar la app."
            : feature && FEATURES[feature]
              ? trial.used
                ? `${FEATURES[feature]} es parte de Premium.`
                : `${FEATURES[feature]} es parte de Premium. Podés probarlo gratis 30 minutos.`
              : "Todo lo avanzado y sin anuncios."}
        </p>
      </div>
      <div className="card prem-perks">
        {PERKS.map((p) => {
          const tr = p.feature ? trialFor(p.feature, st) : null;
          return (
            <div className="prem-perk" key={p.title}>
              <span className="li-icon">
                <Icon name={p.icon} />
              </span>
              <span className="prem-perk-text">
                <b>{p.title}</b>
                <span className="muted small" style={{ display: "block" }}>
                  {p.sub}
                </span>
              </span>
              {owned || !tr ? null : tr.active ? (
                <button
                  type="button"
                  className="prem-try on"
                  onClick={() => openFeature(p.feature, {})}
                >
                  Abrir
                </button>
              ) : !tr.used ? (
                <button
                  type="button"
                  className="prem-try"
                  onClick={() => tryWithAd(p.feature, {})}
                  disabled={!!passBusy}
                  aria-label={`Probar ${p.title} 30 minutos gratis`}
                >
                  {passBusy === p.feature ? "…" : "Probar"}
                </button>
              ) : (
                <span className="prem-try used">Probada</span>
              )}
            </div>
          );
        })}
        {!owned ? (
          <p className="muted small prem-try-note">
            {web
              ? "Cada función la podés probar gratis 30 minutos, una sola vez."
              : "Cada función la podés probar 30 minutos mirando un anuncio, una sola vez."}
          </p>
        ) : null}
      </div>
      {!owned && options.length ? (
        <div className="prem-plans" role="radiogroup" aria-label="Planes">
          {web ? (
            <p className="small prem-web">
              Por ahora Premium se compra en la app de Android, que sale muy
              pronto en Google Play. Si ya sos Premium, entrá con tu cuenta de
              Google y lo tenés también acá.
            </p>
          ) : null}
          {options.map((o) => (
            <button
              type="button"
              role="radio"
              aria-checked={pick === o.id}
              className={cx("prem-plan", pick === o.id && "on")}
              onClick={() => setPlan(o.id)}
              key={o.id}
            >
              <span className="prem-radio" aria-hidden="true" />
              <span className="prem-plan-main">
                <b>{o.name}</b>
                <span className="muted small">{o.note}</span>
              </span>
              <span className="prem-plan-price">
                {o.badge ? <span className="prem-badge">{o.badge}</span> : null}
                <b className="num">{o.price}</b>
                {o.extra ? <span className="small good">{o.extra}</span> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {!owned && terms ? (
        <p className="muted small prem-terms">{terms}</p>
      ) : null}
      {shop.error ? (
        <p className="small bad" style={{ marginTop: 10, fontWeight: 600 }}>
          {shop.error}
        </p>
      ) : null}
      <p className="muted small" style={{ marginTop: 12 }}>
        Las lecciones, la ruta de conteo, Entrenar, los ejercicios y el
        simulador siguen siendo gratis.
      </p>
      {!owned ? (
        <div className="btns prem-more">
          {feature && FEATURES[feature] && !trial.used ? (
            <>
              <Button
                kind="outline"
                onClick={() => tryWithAd()}
                disabled={!!passBusy}
              >
                {passBusy
                  ? "Cargando…"
                  : web
                    ? "Probarlo 30 minutos gratis"
                    : "Probarlo 30 minutos con un anuncio"}
              </Button>
              <p className="muted small prem-once">
                Podés probar cada función una sola vez.
              </p>
            </>
          ) : feature && FEATURES[feature] ? (
            <p className="muted small prem-once">
              Ya usaste tu prueba de esta función. Para volver a usarla, pasate
              a Premium.
            </p>
          ) : null}
          <Button
            kind="ghost"
            onClick={restorePremium}
            disabled={shop.busy || !NATIVE}
          >
            Ya lo compré: restaurar
          </Button>
          {NATIVE ? (
            <button
              type="button"
              className="link small prem-privacy"
              onClick={showAdPrivacy}
            >
              Privacidad de los anuncios
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="bottom-actions">
        {owned ? (
          <div className="btns">
            <Button onClick={() => nav.pop()}>Seguir</Button>
            {NATIVE && shop.kind === "sub" ? (
              <Button kind="ghost" onClick={manageSubscription}>
                Cambiar de plan o cancelar
              </Button>
            ) : null}
          </div>
        ) : web ? (
          ACCOUNTS && !acct ? (
            <Button onClick={() => nav.push("account")}>
              Ya soy Premium: entrar con mi cuenta
            </Button>
          ) : (
            <Button disabled={true}>Muy pronto: pagar desde la web</Button>
          )
        ) : (
          <Button
            onClick={() => buyPremium(pick)}
            disabled={shop.busy || !NATIVE || !info}
          >
            {shop.busy ? "Procesando…" : cta}
          </Button>
        )}
      </div>
    </div>
  );
}

// Etiqueta "Premium" para lo que está bloqueado sin Premium.
function PremiumTag({ st }) {
  if (hasPremium(st)) return null;
  return (
    <span className="prem-tag">
      <Icon name="crown" size={12} /> Premium
    </span>
  );
}

export { Premium, PremiumTag };
