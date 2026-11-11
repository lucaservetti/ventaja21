// Premios: días de Premium de regalo por jugar seguido, quedar en el podio de la semana o terminar
// las lecciones. Los da el servidor (servidor/), así nadie se los puede dar solo.
import { useEffect, useState } from "react";
import { useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { Button, cx } from "../ui/components.jsx";
import { TopBar } from "../ui/common.jsx";
import { useNav } from "../nav.js";
import { checkPremios, useAccount, usePremios } from "../cloud.js";
import {
  AMIGO_DIAS,
  AMIGO_META,
  AMIGO_PLAZO,
  AMIGO_TOPE,
  PODIO_ACTIVO,
  PREMIOS,
  TOPE_DIAS,
} from "../premios.js";
import { LOCALE } from "../i18n/index.js";
import { giftUntil } from "../platform.js";

const INFO = {
  bienvenida: {
    icon: "user",
    title: "Bienvenida",
    sub: "Por entrar con tu cuenta de Google.",
  },
  racha7: {
    icon: "bolt",
    title: "Racha de 7 días",
    sub: "Juega el desafío diario 7 días seguidos.",
    unit: "días seguidos",
  },
  racha30: {
    icon: "calendar",
    title: "Racha de 30 días",
    sub: "Juega el desafío diario 30 días seguidos.",
    unit: "días seguidos",
  },
  podio: {
    icon: "podium",
    title: "Podio de la semana",
    sub: "Termina la semana entre los 3 primeros del ranking (con 10 jugadores o más). Se puede ganar todas las semanas.",
  },
  graduacion: {
    icon: "trophy",
    title: "Graduación",
    sub: "Termina 36 lecciones (las secciones 1 a 7).",
    unit: "lecciones",
  },
};

function diasText(n) {
  return n === 1 ? "1 día" : n === 7 ? "1 semana" : `${n} días`;
}

// Si a ti te invitaron: cuánto te falta para que ganen los dos.
function Invitado({ inv }) {
  const ok = inv.estado === "nuevo" || inv.estado === "ganado";
  return (
    <div className={cx("card pz-invitado", ok && "done")}>
      <b>
        {ok
          ? `¡Ganaron ${diasText(AMIGO_DIAS)} de Premium tú y tu amigo!`
          : "Te invitó un amigo"}
      </b>
      {ok ? null : inv.estado === "vencido" ? (
        <p className="muted small">
          {`Se terminó el plazo de ${AMIGO_PLAZO} días para este premio.`}
        </p>
      ) : (
        <>
          <p className="muted small">
            {`Juega el desafío diario ${AMIGO_META} días distintos en tus primeras dos semanas y ganan ${diasText(AMIGO_DIAS)} de Premium los dos.`}
          </p>
          <div className="pz-progress">
            <span className="pz-bar">
              <i style={{ width: `${(inv.dias / inv.meta) * 100}%` }} />
            </span>
            <span className="small num">
              {inv.dias} de {inv.meta} días
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// Tu enlace para invitar amigos y cómo va cada uno.
function Invitar({ acct, inv, nav }) {
  const [copiado, setCopiado] = useState(false);
  const enlace = inv && inv.codigo ? `https://edge21.app/?amigo=${inv.codigo}` : null;
  const compartir = async () => {
    const texto = `Estoy aprendiendo blackjack con Edge 21. Entra con mi enlace y, si juegas el desafío diario ${AMIGO_META} días, ganamos ${diasText(AMIGO_DIAS)} de Premium los dos:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Edge 21", text: texto, url: enlace });
        return;
      }
    } catch {
      return; // canceló
    }
    try {
      await navigator.clipboard.writeText(`${texto} ${enlace}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // sin portapapeles
    }
  };
  return (
    <div className="card pz-invitar">
      <div className="pz-head">
        <b>Invita amigos</b>
        <span className="pz-days">+{diasText(AMIGO_DIAS)} c/u</span>
      </div>
      <p className="muted small">
        {`Cuando un amigo entra con tu enlace, con una cuenta de Google nueva, y juega el desafío diario ${AMIGO_META} días distintos en sus primeras dos semanas, ganan ${diasText(AMIGO_DIAS)} de Premium los dos. Hasta ${AMIGO_TOPE} amigos.`}
      </p>
      {!acct ? (
        <Button kind="secondary" onClick={() => nav.push("account")}>
          Entra con Google para tener tu enlace
        </Button>
      ) : enlace ? (
        <>
          <div className="pz-link num">{enlace.replace("https://", "")}</div>
          <Button onClick={compartir}>
            {copiado ? "¡Copiado!" : "Compartir mi enlace"}
          </Button>
          <p className="small pz-state">
            {inv.ganados} de {inv.tope} amigos con premio
          </p>
          {inv.amigos.length ? (
            <div className="pz-amigos">
              {inv.amigos.map((a, i) => (
                <div className="kv" key={i}>
                  <span className="kv-k">{a.nick}</span>
                  <span className={cx("kv-v small", a.estado === "ganado" && "good")}>
                    {a.estado === "ganado"
                      ? "¡Premio ganado!"
                      : a.estado === "vencido"
                        ? "No llegó a tiempo"
                        : a.estado === "tope"
                          ? "Cumplió (ya llegaste a 10)"
                          : `${a.dias} de ${inv.meta} días`}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p className="muted small">Revisa tus premios para ver tu enlace.</p>
      )}
    </div>
  );
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
  const gift = giftUntil(st);
  return (
    <div className="premios fade-up">
      <TopBar onClose={() => nav.pop()} closeIcon="back" title="Premios" />
      <div className="prem-hero">
        <span className="cert-seal" aria-hidden="true">
          <Icon name="sparkle" size={32} stroke={2.2} />
        </span>
        <h1 className="prem-title">Gana Premium jugando</h1>
        <p className="muted">
          {PODIO_ACTIVO
            ? "Días de Premium de regalo por jugar seguido, quedar en el podio o terminar las lecciones."
            : "Días de Premium de regalo por jugar seguido o terminar las lecciones."}
        </p>
      </div>
      {!acct ? (
        <div className="card pz-signin">
          <p>
            Los premios se guardan en tu cuenta de Google, así valen en el
            celular y en la web. Entra para empezar a sumar.
          </p>
          <Button onClick={() => nav.push("account")}>Entrar con Google</Button>
        </div>
      ) : null}
      {gift ? (
        <p className="pz-gift">
          <Icon name="crown" size={16} />
          <span>
            Tienes Premium de regalo hasta el{" "}
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
      {mine && mine.invitado ? <Invitado inv={mine.invitado} /> : null}
      <div className="pz-list">
        {PREMIOS.map((p) => {
          const info = INFO[p.id];
          const s = mine && mine.premios.find((x) => x.id === p.id);
          const estado =
            p.id === "podio" && !PODIO_ACTIVO && !(s && s.veces)
              ? "proximamente"
              : s
                ? s.estado
                : "progreso";
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
                  <span className="pz-days">
                    {estado === "proximamente"
                      ? "Próximamente"
                      : `+${diasText(p.dias)}`}
                  </span>
                </div>
                <p className="muted small">{info.sub}</p>
                {s && s.meta && !done && estado !== "pronto" ? (
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
                  {estado === "proximamente"
                    ? "Se activa cuando haya más jugadores en el ranking."
                    : estado === "pronto"
                    ? "Ya lo tienes guardado: se activa cuando la app salga en Google Play."
                    : estado === "nuevo"
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
      <Invitar acct={acct} inv={mine && mine.invitar} nav={nav} />
      {acct ? (
        <div className="pz-foot">
          <p className="muted small">
            {mine
              ? `Este mes usaste ${mine.usados} de ${TOPE_DIAS} días de regalo. `
              : ""}
            La racha cuenta los días que jugaste el desafío diario con tu cuenta
            (así apareces en el ranking).
          </p>
          {error ? (
            <p className="small bad">
              No se pudo revisar los premios. Revisa la conexión.
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
