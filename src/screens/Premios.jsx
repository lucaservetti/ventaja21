// Premios: días de Premium de regalo por jugar seguido, quedar en el podio de la semana o terminar
// las lecciones. Los da el servidor (servidor/), así nadie se los puede dar solo.
import { useEffect } from "react";
import { useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { Button, cx } from "../ui/components.jsx";
import { TopBar } from "../ui/common.jsx";
import { useNav } from "../nav.js";
import { checkPremios, useAccount, usePremios } from "../cloud.js";
import { PREMIOS, TOPE_DIAS } from "../premios.js";
import { LOCALE } from "../i18n/index.js";

const INFO = {
  racha7: {
    icon: "bolt",
    title: "Racha de 7 días",
    sub: "Jugá el desafío diario 7 días seguidos.",
    unit: "días seguidos",
  },
  racha30: {
    icon: "calendar",
    title: "Racha de 30 días",
    sub: "Jugá el desafío diario 30 días seguidos.",
    unit: "días seguidos",
  },
  podio: {
    icon: "podium",
    title: "Podio de la semana",
    sub: "Terminá la semana entre los 3 primeros del ranking (con 10 jugadores o más). Se puede ganar todas las semanas.",
  },
  graduacion: {
    icon: "trophy",
    title: "Graduación",
    sub: "Terminá todas las lecciones.",
    unit: "lecciones",
  },
};

function diasText(n) {
  return n === 1 ? "1 día" : n === 7 ? "1 semana" : `${n} días`;
}

function Premios() {
  const nav = useNav();
  const st = useStore();
  const { acct } = useAccount();
  const { data, busy, error } = usePremios();
  useEffect(() => {
    if (acct) checkPremios();
  }, [acct && acct.uid]);
  const mine = data && acct && data.uid === acct.uid ? data : null;
  const gift =
    typeof st.settings.cloudPremium === "number" &&
    st.settings.cloudPremium > Date.now()
      ? st.settings.cloudPremium
      : 0;
  return (
    <div className="premios fade-up">
      <TopBar onClose={() => nav.pop()} closeIcon="back" title="Premios" />
      <div className="prem-hero">
        <span className="cert-seal" aria-hidden="true">
          <Icon name="sparkle" size={32} stroke={2.2} />
        </span>
        <h1 className="prem-title">Ganá Premium jugando</h1>
        <p className="muted">
          Días de Premium de regalo por jugar seguido, quedar en el podio o
          terminar las lecciones.
        </p>
      </div>
      {!acct ? (
        <div className="card pz-signin">
          <p>
            Los premios se guardan en tu cuenta de Google, así valen en el
            celular y en la web. Entrá para empezar a sumar.
          </p>
          <Button onClick={() => nav.push("account")}>Entrar con Google</Button>
        </div>
      ) : null}
      {gift ? (
        <p className="pz-gift">
          <Icon name="crown" size={16} />
          <span>
            Tenés Premium de regalo hasta el{" "}
            <b>
              {new Date(gift).toLocaleDateString(LOCALE, {
                day: "numeric",
                month: "long",
              })}
            </b>
            .
          </span>
        </p>
      ) : null}
      <div className="pz-list">
        {PREMIOS.map((p) => {
          const info = INFO[p.id];
          const s = mine && mine.premios.find((x) => x.id === p.id);
          const estado = s ? s.estado : "progreso";
          const done = estado === "ganado" || estado === "nuevo";
          return (
            <div
              className={cx("card pz-item", done && "done", `pz-${estado}`)}
              key={p.id}
            >
              <span className="li-icon">
                <Icon name={done ? "check" : info.icon} />
              </span>
              <div className="pz-text">
                <div className="pz-head">
                  <b>{info.title}</b>
                  <span className="pz-days">+{diasText(p.dias)}</span>
                </div>
                <p className="muted small">{info.sub}</p>
                {s && s.meta && !done ? (
                  <div className="pz-progress">
                    <span className="pz-bar">
                      <i style={{ width: `${(s.progreso / s.meta) * 100}%` }} />
                    </span>
                    <span className="small num">
                      {s.progreso} de {s.meta} {info.unit}
                    </span>
                  </div>
                ) : null}
                <p className="small pz-state">
                  {estado === "nuevo"
                    ? `¡Ganaste ${diasText(p.dias)} de Premium!`
                    : estado === "ganado"
                      ? "Ya lo ganaste."
                      : estado === "tope"
                        ? `Lo cumpliste. Llegaste al tope de ${TOPE_DIAS} días de regalo por mes: se suma cuando se libere lugar.`
                        : p.id === "podio" && s && s.veces
                          ? s.veces === 1
                            ? "Lo ganaste 1 vez."
                            : `Lo ganaste ${s.veces} veces.`
                          : null}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {acct ? (
        <div className="pz-foot">
          <p className="muted small">
            {mine
              ? `Este mes usaste ${mine.usados} de ${TOPE_DIAS} días de regalo. `
              : ""}
            La racha cuenta los días que jugaste el desafío diario con tu cuenta
            (así aparecés en el ranking).
          </p>
          {error ? (
            <p className="small bad">
              No se pudo revisar los premios. Revisá la conexión.
            </p>
          ) : null}
          <Button
            kind="secondary"
            onClick={() => checkPremios(true)}
            disabled={busy}
          >
            {busy ? "Revisando…" : "Revisar mis premios"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { Premios };
