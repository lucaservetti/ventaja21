// Tu cuenta (opcional): guardar el progreso en tu cuenta de Google, el nombre del ranking y borrar todo.
import { useEffect, useRef, useState } from "react";
import { Icon } from "../ui/icons.jsx";
import { Button, Modal } from "../ui/components.jsx";
import { TopBar } from "../ui/common.jsx";
import { useNav } from "../nav.js";
import {
  CLOUD_NATIVE,
  deleteAccount,
  renderWebButton,
  resolveConflict,
  setNick,
  signInNative,
  signOut,
  syncNow,
  useAccount,
} from "../cloud.js";
import { Summary } from "./Backup.jsx";

function ago(t) {
  if (!t) return "todavía no";
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "recién";
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return `hace ${Math.round(s / 86400)} días`;
}

function SignIn({ onError }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (CLOUD_NATIVE || !ref.current) return;
    renderWebButton(ref.current, (p) =>
      p.catch((e) => onError(e.message)),
    ).catch((e) => onError(e.message));
  }, []);
  if (!CLOUD_NATIVE) return <div className="gsi-btn" ref={ref} />;
  return (
    <Button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signInNative();
        } catch (e) {
          if (!/cancel/i.test(String(e && e.message))) onError(e.message);
        }
        setBusy(false);
      }}
    >
      <Icon name="user" size={18} />{" "}
      {busy ? "Conectando…" : "Continuar con Google"}
    </Button>
  );
}

function Account() {
  const nav = useNav();
  const { acct, sync } = useAccount();
  const [err, setErr] = useState(null);
  const [nick, setNickText] = useState(acct ? acct.nick : "");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setNickText(acct ? acct.nick : ""), [acct && acct.uid]);

  return (
    <div className="account fade-up">
      <TopBar onClose={() => nav.pop()} closeIcon="back" title="Tu cuenta" />
      {!acct ? (
        <>
          <div className="card acc-hero">
            <span className="li-icon acc-ic">
              <Icon name="user" />
            </span>
            <h2>Guardá tu progreso en tu cuenta de Google</h2>
            <ul className="acc-list">
              <li>No lo perdés si cambiás de celular o borrás la app.</li>
              <li>Lo seguís en otro celular o en la web.</li>
              <li>Aparecés en el ranking del desafío diario.</li>
            </ul>
            <p className="muted small">
              Es opcional: sin cuenta la app funciona igual. Solo guardamos tu
              progreso, tu nombre para el ranking y tu mail.
            </p>
          </div>
          <div className="acc-signin">
            <SignIn onError={setErr} />
          </div>
        </>
      ) : (
        <>
          <div className="card acc-user">
            <span className="acc-avatar" aria-hidden="true">
              {(acct.name || acct.email || "?").trim()[0].toUpperCase()}
            </span>
            <div className="grow">
              <b>{acct.name || "Tu cuenta"}</b>
              <div className="muted small">{acct.email}</div>
            </div>
          </div>
          <div className="card">
            <div className="row" style={{ gap: 10 }}>
              <Icon name={sync.status === "error" ? "x" : "check"} />
              <div className="grow">
                <b>
                  {sync.status === "syncing"
                    ? "Guardando…"
                    : sync.status === "error"
                      ? "No se pudo guardar"
                      : `Guardado en la nube ${ago(sync.at || acct.lastSync)}`}
                </b>
                <div className="muted small">
                  {sync.status === "error"
                    ? "Revisá la conexión. Se vuelve a intentar solo."
                    : "Se guarda solo mientras usás la app."}
                </div>
              </div>
            </div>
            <Button
              kind="outline"
              onClick={syncNow}
              disabled={sync.status === "syncing"}
              style={{ marginTop: 12 }}
            >
              Guardar ahora
            </Button>
          </div>
          <div className="card">
            <label className="field" style={{ marginTop: 0 }}>
              <span>Tu nombre en el ranking</span>
              <input
                className="inp"
                type="text"
                value={nick}
                maxLength={20}
                onChange={(e) => setNickText(e.target.value)}
                onBlur={() => setNick(nick)}
              />
            </label>
            <p className="muted small">
              Lo ven los demás. Podés usar un apodo.
            </p>
          </div>
          <div className="btns" style={{ marginTop: 14 }}>
            <Button kind="ghost" onClick={signOut}>
              Cerrar sesión
            </Button>
            <button
              type="button"
              className="link small bad acc-delete"
              onClick={() => setConfirm(true)}
            >
              Borrar mi cuenta y mis datos de la nube
            </button>
          </div>
          <p className="muted small" style={{ marginTop: 8 }}>
            Al cerrar sesión, tu progreso queda en este celular.
          </p>
        </>
      )}
      {err ? (
        <p className="small bad" style={{ marginTop: 12, fontWeight: 600 }}>
          {err}
        </p>
      ) : null}

      <Modal
        open={sync.status === "conflict" && !!sync.conflict}
        onClose={() => {}}
      >
        {sync.conflict ? (
          <>
            <h2 style={{ fontSize: 22 }}>¿Con qué progreso te quedás?</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Hay progreso en este celular y otro en tu cuenta. Elegí uno; el
              otro se reemplaza.
            </p>
            <div className="acc-choice">
              <div className="card">
                <div className="eyebrow acc">Este celular</div>
                <Summary st={sync.conflict.local} />
                <Button onClick={() => resolveConflict(false)}>
                  Usar este
                </Button>
              </div>
              <div className="card">
                <div className="eyebrow acc">Tu cuenta</div>
                <Summary st={sync.conflict.cloud} />
                <Button kind="outline" onClick={() => resolveConflict(true)}>
                  Usar el de la cuenta
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </Modal>
      <Modal open={confirm} onClose={() => setConfirm(false)}>
        <h2 style={{ fontSize: 22 }}>¿Borrar tu cuenta?</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Se borran tu cuenta de Edge 21, tu progreso guardado en la nube y tus
          puntajes del ranking. El progreso de este celular queda.
        </p>
        <div className="btns" style={{ marginTop: 16 }}>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await deleteAccount();
                setConfirm(false);
              } catch (e) {
                setErr(e.message);
              }
              setBusy(false);
            }}
          >
            {busy ? "Borrando…" : "Sí, borrar todo"}
          </Button>
          <Button kind="ghost" onClick={() => setConfirm(false)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export { Account };
