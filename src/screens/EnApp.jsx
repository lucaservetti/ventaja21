// "Seguí en la app": lo que aparece en la web de prueba cuando se llega al límite (ver WEB_DEMO en
// platform.js). Invita a guardar el progreso con Google, a seguir las redes y a ser tester.
import { Icon } from "../ui/icons.jsx";
import { Button } from "../ui/components.jsx";
import { TopBar } from "../ui/common.jsx";
import { useNav } from "../nav.js";
import { ACCOUNTS, useAccount } from "../cloud.js";

const INSTAGRAM = "https://www.instagram.com/edge21app/";
const TIKTOK = "https://www.tiktok.com/@edge21app";
const TESTER =
  "mailto:soporte@edge21.app?subject=Quiero%20probar%20Edge%2021%20en%20Android&body=Mi%20mail%20de%20Google%20Play%20es%3A%20";

const TEXTOS = {
  aprender: [
    "Lo que sigue está en la app",
    "En la web probás las secciones 1 y 2. Contar cartas, apostar con el conteo y el resto del camino están en la app.",
  ],
  conteo: [
    "Los niveles que siguen están en la app",
    "En la web llegás hasta el nivel 3 de la ruta de conteo. Del 4 al 10, y la práctica sin límite, en la app.",
  ],
  entrenar: [
    "Ya jugaste la tanda de hoy",
    "En la web hay una por día. Mañana tenés otra, o seguí sin límite en la app.",
  ],
  jugar: [
    "Ya jugaste las 20 manos de hoy",
    "En la web hay 20 manos por día en la mesa. Mañana tenés más, o jugá sin límite en la app.",
  ],
  premium: [
    "Premium es de la app",
    "El modo casino real, las desviaciones, el análisis de tus errores y lo demás de Premium están en la app de Android.",
  ],
  info: [
    "Estás en la versión web de prueba",
    "Acá probás una parte de Edge 21. La app completa sale en Google Play en unas semanas.",
  ],
};

function EnApp({ feature }) {
  const nav = useNav();
  const { acct } = useAccount();
  const [title, sub] = TEXTOS[feature] || TEXTOS.info;
  return (
    <div className="enapp fade-up">
      <TopBar onClose={() => nav.pop()} closeIcon="back" title="Edge 21" />
      <div className="prem-hero">
        <span className="cert-seal" aria-hidden="true">
          <Icon name="sparkle" size={32} stroke={2.2} />
        </span>
        <h1 className="prem-title">{title}</h1>
        <p className="muted">{sub}</p>
        {feature !== "info" ? (
          <p className="muted small">
            La app de Android sale pronto en Google Play.
          </p>
        ) : null}
      </div>

      {ACCOUNTS ? (
        <div className="card ea-card">
          <span className="li-icon">
            <Icon name="user" />
          </span>
          <div>
            {acct ? (
              <>
                <b>Tu progreso ya está guardado</b>
                <p className="muted small">
                  Cuando bajes la app, entrá con la misma cuenta de Google y
                  seguís donde estabas. Y te esperan 3 días de Premium de
                  regalo.
                </p>
              </>
            ) : (
              <>
                <b>Guardá tu progreso para la app</b>
                <p className="muted small">
                  Entrá con Google: lo que hiciste acá pasa a la app, y te
                  llevás 3 días de Premium de regalo cuando salga.
                </p>
                <Button onClick={() => nav.push("account")}>
                  Entrar con Google
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}

      <div className="card ea-card">
        <span className="li-icon">
          <Icon name="share" />
        </span>
        <div>
          <b>Enterate cuando salga</b>
          <p className="muted small">
            Seguinos: avisamos el día que sale y subimos un tip por día.
          </p>
          <div className="ea-links">
            <a
              className="btn btn-secondary btn-sm"
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              className="btn btn-secondary btn-sm"
              href={TIKTOK}
              target="_blank"
              rel="noopener noreferrer"
            >
              TikTok
            </a>
          </div>
        </div>
      </div>

      <div className="card ea-card">
        <span className="li-icon">
          <Icon name="play" />
        </span>
        <div>
          <b>¿Tenés Android? Probala antes que nadie</b>
          <p className="muted small">
            Buscamos personas para probar la app antes de que salga. Escribinos
            con el mail de tu cuenta de Google Play.
          </p>
          <a className="btn btn-secondary btn-sm" href={TESTER}>
            Quiero ser tester
          </a>
        </div>
      </div>
    </div>
  );
}

export { EnApp };
