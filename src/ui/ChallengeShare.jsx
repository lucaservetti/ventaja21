// Botón "Desafiar a un amigo" y el resultado de un desafío recibido.
import { useState } from "react";
import { Icon } from "./icons.jsx";
import { Button, Modal, cx } from "./components.jsx";
import { challengeName, shareChallenge, verdict } from "../challenge.js";
import { useAccount } from "../cloud.js";

// data: lo que repite el desafío (k, s, sc y, en el conteo, n, sp, m). text: el mensaje.
function ChallengeButton({
  data,
  text,
  label = "Desafiar a un amigo",
  kind = "outline",
}) {
  const { acct } = useAccount();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(
    () => challengeName() || (acct && acct.nick) || "",
  );
  const send = async () => {
    setOpen(false);
    await shareChallenge({ ...data, nm: name.trim() }, text);
  };
  return (
    <>
      <Button kind={kind} onClick={() => setOpen(true)}>
        <Icon name="users" size={18} /> {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 style={{ fontSize: 22 }}>Desafiá a un amigo</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Le llega un enlace con lo mismo que jugaste vos y tu puntaje. Si lo
          abre, juega exactamente lo mismo y comparan.
        </p>
        <label className="field">
          <span>Tu nombre (para que sepa quién lo desafía)</span>
          <input
            className="inp"
            type="text"
            value={name}
            maxLength={20}
            placeholder="Ej.: Luca"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="btns" style={{ marginTop: 14 }}>
          <Button onClick={send}>
            <Icon name="share" size={18} /> Mandar el desafío
          </Button>
          <Button kind="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </>
  );
}

// Cartel del resultado contra el amigo, con el botón para devolverle el desafío.
function ChallengeOutcome({ challenge, score, data, text }) {
  const v = verdict(score, challenge.sc);
  const who = challenge.nm || "Tu amigo";
  return (
    <div className={cx("card chal-out", v)} role="status">
      <div className="eyebrow acc">{`Desafío de ${who}`}</div>
      <h2>
        {v === "win" ? "¡Ganaste!" : v === "lose" ? `Ganó ${who}` : "¡Empate!"}
      </h2>
      <div className="chal-vs">
        <div>
          <div className="muted small">Vos</div>
          <b className="num">{score}</b>
        </div>
        <span className="muted">contra</span>
        <div>
          <div className="muted small">{who}</div>
          <b className="num">{challenge.sc}</b>
        </div>
      </div>
      <ChallengeButton
        data={data}
        text={text}
        kind="primary"
        label={v === "win" ? "Contarle que ganaste" : "Devolverle el desafío"}
      />
    </div>
  );
}

export { ChallengeButton, ChallengeOutcome };
