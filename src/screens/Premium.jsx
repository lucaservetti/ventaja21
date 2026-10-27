// Edge 21 Premium: un solo pago, sin anuncios y con todo lo avanzado.
import { useEffect, useState } from "react";
import { useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { Button } from "../ui/components.jsx";
import { TopBar } from "../ui/common.jsx";
import {
  NATIVE,
  buyPremium,
  hasPremium,
  onShop,
  restorePremium,
  shop,
  showAdPrivacy,
} from "../platform.js";
import { useNav } from "../nav.js";

const FEATURES = {
  casino: "El modo casino real",
  casinoPlay: "El modo casino real",
  bankroll: "El simulador de banca",
  journal: "El diario de casino real",
  devLevel: "La ruta de desviaciones completa",
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
    sub: "Tu plata, límites de mesa, tiempo para decidir, vigilancia, modo turista y el examen con certificado.",
  },
  {
    icon: "target",
    title: "Ruta de desviaciones completa",
    sub: "Los 10 niveles: los Illustrious 18, el Fab 4 y calcular el conteo real.",
  },
  {
    icon: "stats",
    title: "Simulador de banca",
    sub: "Cuánta plata necesitás y tu riesgo de quebrar, en tu moneda.",
  },
  {
    icon: "book",
    title: "Diario de casino real",
    sub: "Anotá lo que jugás de verdad y mirá tu resultado por hora.",
  },
];

function Premium({ feature }) {
  const st = useStore();
  const nav = useNav();
  const [, setTick] = useState(0);
  useEffect(() => onShop(() => setTick((x) => x + 1)), []);
  const owned = hasPremium(st);
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
            ? "¡Ya sos Premium! Gracias por apoyar la app."
            : feature && FEATURES[feature]
              ? `${FEATURES[feature]} es parte de Premium. Un solo pago y es tuyo para siempre.`
              : "Un solo pago y es tuyo para siempre. Sin suscripciones."}
        </p>
      </div>
      <div className="card prem-perks">
        {PERKS.map((p) => (
          <div className="prem-perk" key={p.title}>
            <span className="li-icon">
              <Icon name={p.icon} />
            </span>
            <span>
              <b>{p.title}</b>
              <span className="muted small" style={{ display: "block" }}>
                {p.sub}
              </span>
            </span>
          </div>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 12 }}>
        Las lecciones, la ruta de conteo, Entrenar, los ejercicios y el
        simulador siguen siendo gratis.
      </p>
      {shop.error ? (
        <p className="small bad" style={{ marginTop: 10, fontWeight: 600 }}>
          {shop.error}
        </p>
      ) : null}
      <div className="bottom-actions">
        {owned ? (
          <Button onClick={() => nav.pop()}>Seguir</Button>
        ) : (
          <div className="btns">
            <Button onClick={buyPremium} disabled={shop.busy || !NATIVE}>
              {shop.busy
                ? "Procesando…"
                : `Comprar Premium${shop.price ? ` · ${shop.price}` : ""}`}
            </Button>
            <Button
              kind="ghost"
              onClick={restorePremium}
              disabled={shop.busy || !NATIVE}
            >
              Ya lo compré: restaurar
            </Button>
          </div>
        )}
        {NATIVE && !owned ? (
          <button
            type="button"
            className="link small prem-privacy"
            onClick={showAdPrivacy}
          >
            Privacidad de los anuncios
          </button>
        ) : null}
      </div>
    </div>
  );
}

// Etiqueta "Premium" para lo que está bloqueado en la app de Android.
function PremiumTag({ st }) {
  if (hasPremium(st)) return null;
  return (
    <span className="prem-tag">
      <Icon name="crown" size={12} /> Premium
    </span>
  );
}

export { Premium, PremiumTag };
