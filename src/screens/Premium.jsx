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
  giftUntil,
  hasPremium,
  manageSubscription,
  onShop,
  restorePremium,
  shop,
  showAdPrivacy,
  empezarPrueba,
  grupoDe,
  pruebaActiva,
  pruebaUsada,
  puedeProbar,
} from "../platform.js";
import { useNav } from "../nav.js";
import { ACCOUNTS, checkPremium, useAccount } from "../cloud.js";
import { MOSTRAR, PAGOS_WEB, onPagoWeb, pagarWeb } from "../pagos-web.js";
import { hito } from "../medir.js";
import { LANG, LOCALE } from "../i18n/index.js";

const FEATURES = {
  casino: "El modo casino real",
  casinoPlay: "El modo casino real",
  bankroll: "El simulador de banca",
  journal: "El diario de casino real",
  devLevel: "La ruta de desviaciones completa",
  looks: "Elegir paños y mazos",
  mistakes: "El análisis de tus errores",
  systems: "Usar sistemas de conteo avanzados",
  rules: "Ajustar cada regla de la mesa",
  hands: "Jugar dos manos por ronda",
  guideChapter: "Este capítulo de la guía",
  history: "Tu historial completo",
};
const PERKS = [
  {
    icon: "close",
    title: "Sin anuncios",
    sub: "Nunca más, en ninguna pantalla.",
  },
  {
    icon: "crown",
    title: "Modo casino real",
    sub: "Presupuesto simulado, límites de mesa, tiempo para decidir, vigilancia, modo turista y el examen con certificado.",
  },
  {
    icon: "target",
    title: "Ruta de desviaciones completa",
    sub: "Los 10 niveles: los Illustrious 18, el Fab 4 y calcular el conteo real.",
  },
  {
    icon: "shoe",
    title: "La mesa a tu medida",
    sub: "Ajusta cada regla a mano y juega dos manos por ronda.",
  },
  {
    icon: "book",
    title: "Guía y progreso completos",
    sub: "Los capítulos de desviaciones y del valor de cada regla, y tu historial con todas tus tandas.",
  },
  {
    icon: "stats",
    title: "Simulador de banca",
    sub: "Cuánto dinero necesitas y tu riesgo de quebrar, en tu moneda.",
  },
  {
    icon: "eye",
    title: "Análisis de tus errores",
    sub: "Tu tabla pintada según dónde fallas, las jugadas que más te cuestan y cómo vas mejorando.",
  },
  {
    icon: "sparkle",
    title: "Paños y mazos",
    sub: "El color de la mesa, el dorso de las cartas y el mazo de 4 colores.",
  },
  {
    icon: "layers",
    title: "Sistemas de conteo avanzados",
    sub: "Hi-Opt I, Hi-Opt II, Zen, Omega II y Wong Halves. Hi-Lo y KO siguen gratis.",
  },
  {
    icon: "book",
    title: "Diario de casino real",
    sub: "Anota lo que juegas de verdad y mira tu resultado por hora.",
  },
];
// Precios de la web (pagos.config.json): más baratos que en Google Play, porque no tienen su comisión.
const WEB_PRICES = {
  monthly: { micros: Math.round((MOSTRAR.monthly || 0) * 1e6), currency: MOSTRAR.moneda || "USD", trialDays: 0 },
  yearly: { micros: Math.round((MOSTRAR.yearly || 0) * 1e6), currency: MOSTRAR.moneda || "USD", trialDays: MOSTRAR.pruebaDias || 0 },
  lifetime: { micros: Math.round((MOSTRAR.lifetime || 0) * 1e6), currency: MOSTRAR.moneda || "USD", trialDays: 0 },
};
// Precios de muestra para ver la pantalla en la computadora (en el celular vienen de Google Play,
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
  const [probando, setProbando] = useState(false);
  const [, setTick] = useState(0);
  const [plan, setPlan] = useState("yearly");
  useEffect(() => onShop(() => setTick((x) => x + 1)), []);
  useEffect(() => hito("premium"), []);
  // Pago en la web: "abriendo", "esperando" (pagó; el servidor lo anota en unos segundos), "error".
  const [pago, setPago] = useState(null);
  useEffect(
    () =>
      onPagoWeb((e) => {
        if (e === "listo") {
          setPago("esperando");
          hito("compra");
        }
        else if (e === "error") setPago("error");
        else setPago((p) => (p === "abriendo" ? null : p));
      }),
    [],
  );
  // Premium regalado (días ganados en Premios) vence: igual se muestran los planes.
  const gift = !st.settings.premium ? giftUntil(st) : 0;
  const owned = hasPremium(st) && !gift;
  const { acct } = useAccount();
  // Después de pagar, el servidor anota Premium en unos segundos: se pregunta cada 2,5 s (hasta 30 s).
  useEffect(() => {
    if (pago !== "esperando") return;
    let n = 0;
    const id = setInterval(() => {
      n++;
      checkPremium();
      if (n >= 12) clearInterval(id);
    }, 2500);
    return () => clearInterval(id);
  }, [pago]);
  // En la web (no en Android) todavía no se puede pagar: Premium llega por la cuenta.
  const web = !APP_MODE;
  // Precios: en Android, los de Google Play; en la web con pagos, los de la web (más baratos, sin
  // la comisión de Google); si no, los de muestra.
  const base = PAGOS_WEB ? WEB_PRICES : SAMPLE;
  const plans = NATIVE
    ? shop.plans
    : Object.fromEntries(
        Object.entries(base).map(([k, p]) => [
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
          ? `Ahorras ${save} %`
          : null,
      extra: y.trialDays && save > 0 ? `Ahorras ${save} %` : null,
    },
    m && {
      id: "monthly",
      name: "Mensual",
      price: `${m.price} al mes`,
      note: "Cancelas cuando quieras",
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
    : web && PAGOS_WEB
      ? pick === "lifetime"
        ? "Pagas una vez y Premium es tuyo para siempre en esta cuenta de Google, en la web y en la app."
        : info.trialDays
          ? `Gratis por ${info.trialDays} días; después, ${info.price} por año. Se renueva solo y lo cancelas cuando quieras desde el mail del pago. Si cancelas antes de que termine la prueba, no se te cobra nada.`
          : `${info.price} por ${pick === "yearly" ? "año" : "mes"}. Se renueva solo y lo cancelas cuando quieras desde el mail del pago.`
      : pick === "lifetime"
      ? "Pagas una vez y Premium es tuyo para siempre en esta cuenta de Google."
      : info.trialDays
        ? `Gratis por ${info.trialDays} días; después, ${info.price} por año. Se renueva solo y lo cancelas cuando quieras en Google Play. Si cancelas antes de que termine la prueba, no se te cobra nada.`
        : `${info.price} por ${pick === "yearly" ? "año" : "mes"}. Se renueva solo y lo cancelas cuando quieras en Google Play.`;

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
              ? "Tienes Premium para siempre. ¡Gracias por apoyar la app!"
              : "¡Ya eres Premium! Gracias por apoyar la app."
            : gift
              ? `Tienes Premium de regalo hasta el ${new Date(gift).toLocaleDateString(LOCALE, { day: "numeric", month: "long" })}.`
              : feature && FEATURES[feature]
                ? `${FEATURES[feature]} es parte de Premium.`
                : "Todo lo avanzado y sin anuncios."}
        </p>
      </div>
      <PruebaGratis
        feature={feature}
        then={then}
        st={st}
        nav={nav}
        probando={probando}
        setProbando={setProbando}
        owned={owned}
      />
      <div className="card prem-perks">
        {PERKS.map((p) => (
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
          </div>
        ))}
      </div>
      {!owned && options.length ? (
        <div className="prem-plans" role="radiogroup" aria-label="Planes">
          {web && PAGOS_WEB ? (
            <p className="small prem-web">
              Pagas con tarjeta, Apple Pay, Google Pay o PayPal, en tu moneda.
              Premium queda en tu cuenta de Google: lo tienes aquí, en el iPhone,
              en la computadora y en la app de Android.
            </p>
          ) : web ? (
            <p className="small prem-web">
              Por ahora Premium se compra en la app de Android, que sale muy
              pronto en Google Play. Si ya eres Premium, entra con tu cuenta de
              Google y lo tienes también aquí.
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
      {pago === "esperando" ? (
        <p className="small good" role="status" style={{ marginTop: 10, fontWeight: 600 }}>
          ¡Pago recibido! Activando tu Premium…
        </p>
      ) : pago === "error" ? (
        <p className="small bad" role="status" style={{ marginTop: 10, fontWeight: 600 }}>
          No se pudo completar el pago. Prueba de nuevo o con otro medio.
        </p>
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
      {ACCOUNTS && !owned ? (
        <button
          type="button"
          className="card list-item prem-gift-link"
          onClick={() => nav.push("premios")}
        >
          <span className="li-icon">
            <Icon name="sparkle" />
          </span>
          <span className="li-text">
            <span className="li-title">También lo puedes ganar</span>
            <span className="li-sub" style={{ display: "block" }}>
              Días de Premium de regalo por jugar seguido o terminar las lecciones
            </span>
          </span>
          <Icon name="chev" className="li-chev" />
        </button>
      ) : null}
      {!owned ? (
        <div className="btns prem-more">
          {web && PAGOS_WEB ? (
            acct ? (
              <Button kind="ghost" onClick={() => checkPremium()}>
                Ya lo compré: revisar
              </Button>
            ) : null
          ) : (
            <Button
              kind="ghost"
              onClick={restorePremium}
              disabled={shop.busy || !NATIVE}
            >
              Ya lo compré: restaurar
            </Button>
          )}
          {NATIVE ? (
            <button
              type="button"
              className="link small prem-privacy"
              onClick={showAdPrivacy}
            >
              Privacidad de los anuncios
            </button>
          ) : null}
          <p className="small legal-links prem-legal">
            <a
              className="link"
              href={`https://edge21.app/terminos.html${LANG === "en" ? "#en" : ""}`}
              target="_blank"
              rel="noreferrer"
            >
              Términos de uso
            </a>
            <a
              className="link"
              href={`https://edge21.app/privacidad.html${LANG === "en" ? "#en" : ""}`}
              target="_blank"
              rel="noreferrer"
            >
              Política de privacidad
            </a>
          </p>
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
        ) : web && PAGOS_WEB ? (
          !acct ? (
            <Button onClick={() => nav.push("account")}>
              Entrar con Google para comprar
            </Button>
          ) : (
            <Button
              onClick={async () => {
                setPago("abriendo");
                try {
                  await pagarWeb(pick, acct);
                } catch {
                  setPago("error");
                }
              }}
              disabled={!info || pago === "abriendo" || pago === "esperando"}
            >
              {pago === "esperando" ? "Activando…" : cta}
            </Button>
          )
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
const PRUEBA_NOMBRE = {
  casino: "el modo casino real",
  bankroll: "el simulador de banca",
  journal: "el diario de casino real",
  devLevel: "la ruta de desviaciones completa",
  looks: "los paños y mazos",
  mistakes: "el análisis de tus errores",
  systems: "los sistemas de conteo avanzados",
  rules: "las reglas de la mesa a mano",
  hands: "las dos manos por ronda",
  guideChapter: "los capítulos Premium de la guía",
  history: "tu historial completo",
};
// Probar UNA función 20 minutos a cambio de un anuncio (una sola vez; ver platform.js).
function PruebaGratis({ feature, then, st, nav, probando, setProbando, owned }) {
  if (owned || !APP_MODE || !feature || !FEATURES[feature]) return null;
  const activa = pruebaActiva(st);
  if (activa && activa !== grupoDe(feature))
    return (
      <p className="small prem-prueba-nota">
        {`Tu prueba gratis es de otra función (${FEATURES[activa] || activa}). Para usar esta, hace falta Premium.`}
      </p>
    );
  if (pruebaUsada(st))
    return (
      <p className="small prem-prueba-nota">
        Ya usaste tu prueba gratis de 20 minutos. Para volver a usarla o probar
        otra función, hace falta Premium.
      </p>
    );
  if (!puedeProbar(st)) return null;
  return (
    <div className="card prem-prueba">
      <b>¿La quieres probar primero?</b>
      <p className="muted small">
        {`Mira un anuncio y usa ${PRUEBA_NOMBRE[grupoDe(feature)] || "esta función"} gratis durante 20 minutos. Es una sola prueba: después, para seguir usándola o probar otra función, hace falta Premium.`}
      </p>
      <Button
        kind="outline"
        disabled={probando}
        onClick={async () => {
          setProbando(true);
          const ok = await empezarPrueba(feature);
          setProbando(false);
          if (!ok) return;
          // Si venías a abrir una pantalla, se abre; si era un ajuste, se vuelve y ya se puede usar.
          if (then) nav.replace(feature, then);
          else nav.pop();
        }}
      >
        {probando ? "Cargando…" : "Probar 20 minutos (ver un anuncio)"}
      </Button>
    </div>
  );
}

function PremiumTag({ st }) {
  if (hasPremium(st)) return null;
  return (
    <span className="prem-tag">
      <Icon name="crown" size={12} /> Premium
    </span>
  );
}

export { Premium, PremiumTag };
