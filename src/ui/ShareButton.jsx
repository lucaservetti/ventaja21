// Botón para compartir un resultado como imagen (ver src/share.js).
import { useState } from "react";
import { Button, IconButton } from "./components.jsx";
import { shareResult } from "../share.js";

function useShare(make) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (busy) return;
    setBusy(true);
    const r = await shareResult(make());
    setBusy(false);
    if (r === "saved")
      setNote("Listo: guardamos la imagen y copiamos el texto.");
    else if (r === "error") setNote("No se pudo compartir.");
    else setNote("");
  };
  return { go, note, busy };
}

function ShareButton({ make, label = "Compartir", kind = "secondary" }) {
  const { go, note, busy } = useShare(make);
  return (
    <>
      <Button kind={kind} icon="share" onClick={go} disabled={busy}>
        {label}
      </Button>
      {note ? (
        <p className="muted small center" style={{ marginTop: 8 }}>
          {note}
        </p>
      ) : null}
    </>
  );
}

function ShareIconButton({ make, label = "Compartir" }) {
  const { go } = useShare(make);
  return <IconButton icon="share" label={label} onClick={go} />;
}

export { ShareButton, ShareIconButton };
