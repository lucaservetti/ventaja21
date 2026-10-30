// Respaldo: guardar el progreso o pasarlo a otro celular (compartir el archivo, copiar el código)
// y restaurarlo, viendo antes qué tiene el respaldo.
import { useRef, useState } from "react";
import {
  canPersist,
  exportBackup,
  getState,
  importBackup,
  readBackup,
  setSettings,
  useStore,
} from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { Button, Modal, cx } from "../ui/components.jsx";
import { LESSONS } from "../lessons/content.js";
import { passedCount } from "../engine/countPath.js";
import { devPassedCount } from "../engine/devPath.js";
import { TopBar } from "../ui/common.jsx";
import { useNav } from "../nav.js";

function inIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
function fileName() {
  return `edge21-respaldo-${new Date().toISOString().slice(0, 10)}.txt`;
}
function dateText(t) {
  return new Date(t).toLocaleDateString("es-UY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Lo que tiene un progreso, en pocas líneas.
function summary(st) {
  const lessons = LESSONS.filter(
    (l) => !l.exam && st.lessons[l.id] && st.lessons[l.id].done,
  ).length;
  const days = Object.keys(st.activity || {}).sort();
  return [
    {
      k: "Lecciones",
      v: `${lessons} de ${LESSONS.filter((l) => !l.exam).length}`,
    },
    { k: "Manos en Entrenar", v: st.train.totalHands.toLocaleString("es-UY") },
    { k: "Ruta de conteo", v: `${passedCount(st)} de 10` },
    { k: "Ruta de desviaciones", v: `${devPassedCount(st)} de 10` },
    { k: "Visitas al casino", v: String((st.casino.trips || []).length) },
    {
      k: "Última práctica",
      v: days.length ? dateText(`${days[days.length - 1]}T12:00:00`) : "—",
    },
  ];
}

function Summary({ st }) {
  return (
    <div className="bk-sum">
      {summary(st).map((r) => (
        <div className="kv" key={r.k}>
          <span className="kv-k">{r.k}</span>
          <span className="kv-v num">{r.v}</span>
        </div>
      ))}
    </div>
  );
}

function Backup() {
  const st = useStore();
  const nav = useNav();
  const fileRef = useRef(null);
  const [code, setCode] = useState(null);
  const [paste, setPaste] = useState("");
  const [msg, setMsg] = useState(null);
  const [preview, setPreview] = useState(null); // { code, st }
  const last = st.settings.lastBackup;

  const mark = () => setSettings({ lastBackup: Date.now() });
  const share = async () => {
    const text = exportBackup();
    try {
      const file = new File([text], fileName(), { type: "text/plain" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Respaldo de Edge 21",
        });
        mark();
        setMsg({
          ok: true,
          text: "Listo. Guardalo donde puedas encontrarlo (Archivos, WhatsApp, mail).",
        });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text, title: "Respaldo de Edge 21" });
        mark();
        return;
      }
      await copy();
    } catch (e) {
      if (e && e.name === "AbortError") return;
      await copy();
    }
  };
  const copy = async () => {
    const text = exportBackup();
    setCode(text);
    try {
      await navigator.clipboard.writeText(text);
      mark();
      setMsg({
        ok: true,
        text: "Código copiado. Pegalo en una nota o mandátelo por mensaje.",
      });
    } catch {
      setMsg({ ok: true, text: "Seleccioná el código de abajo y copialo." });
    }
  };
  const download = () => {
    try {
      const blob = new Blob([exportBackup()], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      mark();
    } catch {
      setMsg({ ok: false, text: "No se pudo descargar. Usá «Copiar código»." });
    }
  };
  const check = (text) => {
    try {
      setPreview({ code: text, st: readBackup(text) });
      setMsg(null);
    } catch (e) {
      setMsg({ ok: false, text: e.message || "El código no es válido." });
    }
  };
  const openFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => check(String(reader.result || ""));
    reader.onerror = () =>
      setMsg({ ok: false, text: "No se pudo leer el archivo." });
    reader.readAsText(file);
  };
  const restore = () => {
    try {
      importBackup(preview.code);
      setPreview(null);
      setPaste("");
      setMsg({ ok: true, text: "Listo: restauramos tu progreso." });
    } catch (e) {
      setPreview(null);
      setMsg({ ok: false, text: e.message || "El código no es válido." });
    }
  };

  return (
    <div className="backup fade-up">
      <TopBar
        onClose={() => nav.pop()}
        closeIcon="back"
        title="Respaldo"
        sub="Tu progreso, a salvo"
      />
      {canPersist() ? null : (
        <p className="note-box casino-warn" style={{ marginBottom: 12 }}>
          Este navegador no deja guardar datos: tu progreso se pierde al cerrar.
          Instalá la app o usá otro navegador.
        </p>
      )}
      <div className="card">
        <div className="eyebrow">Tu progreso en este celular</div>
        <Summary st={st} />
        <p
          className={cx("small", last ? "muted" : "bad")}
          style={{ marginTop: 10 }}
        >
          {last
            ? `Último respaldo: ${dateText(last)}.`
            : "Todavía no hiciste ningún respaldo. Tu progreso vive solo en este celular."}
        </p>
      </div>

      <h3 className="sheet-sub">Guardar o pasar a otro celular</h3>
      <div className="btns">
        <Button onClick={share}>Compartir el respaldo</Button>
        <Button kind="secondary" icon="copy" onClick={copy}>
          Copiar código
        </Button>
        {inIframe() ? null : (
          <Button kind="secondary" icon="download" onClick={download}>
            Descargar archivo
          </Button>
        )}
      </div>
      {code ? (
        <textarea
          className="code-box"
          readOnly={true}
          value={code}
          onFocus={(e) => e.target.select()}
          rows={3}
          aria-label="Código de respaldo"
        />
      ) : null}
      <ol className="how bk-steps">
        <li>
          <span className="how-n">1</span>
          <span className="small">
            Compartí el archivo (por WhatsApp, AirDrop o mail) o copiá el
            código.
          </span>
        </li>
        <li>
          <span className="how-n">2</span>
          <span className="small">
            En el otro celular, abrí Edge 21 y entrá a Ajustes → Respaldo.
          </span>
        </li>
        <li>
          <span className="how-n">3</span>
          <span className="small">Abrí el archivo o pegá el código.</span>
        </li>
      </ol>

      <h3 className="sheet-sub">Restaurar</h3>
      <input
        ref={fileRef}
        type="file"
        accept=".txt,.json,text/plain,application/json"
        onChange={openFile}
        hidden={true}
      />
      <Button
        kind="secondary"
        icon="book"
        onClick={() => fileRef.current && fileRef.current.click()}
      >
        Abrir archivo de respaldo
      </Button>
      <label
        className="muted small"
        htmlFor="bk-in"
        style={{ display: "block", marginTop: 14 }}
      >
        O pegá el código
      </label>
      <textarea
        id="bk-in"
        className="code-box"
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
        placeholder="V21:…"
        rows={3}
      />
      <Button
        kind="secondary"
        onClick={() => check(paste)}
        disabled={!paste.trim()}
        style={{ marginTop: 8 }}
      >
        Revisar el código
      </Button>
      {msg ? (
        <p
          className={cx("small", msg.ok ? "good" : "bad")}
          style={{ marginTop: 12, fontWeight: 600 }}
          role="status"
        >
          {msg.text}
        </p>
      ) : null}

      <Modal open={!!preview} onClose={() => setPreview(null)}>
        <h2 style={{ fontSize: 24 }}>¿Restaurar este respaldo?</h2>
        {preview ? <Summary st={preview.st} /> : null}
        <p className="muted small" style={{ margin: "12px 0 18px" }}>
          Reemplaza el progreso de este celular
          {getState().train.totalHands || getState().train.sessions.length
            ? " (el que tenés ahora se pierde)"
            : ""}
          .
        </p>
        <div className="btns">
          <Button kind="danger" onClick={restore}>
            Restaurar
          </Button>
          <Button kind="secondary" onClick={() => setPreview(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Aviso en Progreso si hace mucho que no hacés un respaldo y ya tenés progreso para perder.
function BackupNudge({ st, nav }) {
  const last = st.settings.lastBackup;
  const progress =
    st.train.totalHands >= 30 ||
    Object.values(st.lessons).filter((l) => l.done).length >= 5;
  if (!progress || (last && Date.now() - last < 21 * 86400000)) return null;
  return (
    <button
      type="button"
      className="card list-item bk-nudge"
      onClick={() => nav.push("backup")}
    >
      <span className="li-icon">
        <Icon name="shield" />
      </span>
      <span className="li-text">
        <span className="li-title">Hacé un respaldo</span>
        <span className="li-sub" style={{ display: "block" }}>
          {last
            ? "Hace más de 3 semanas que no guardás tu progreso."
            : "Tu progreso vive solo en este celular. Guardalo por si lo cambiás."}
        </span>
      </span>
      <Icon name="chev" className="li-chev" />
    </button>
  );
}

export { Backup, BackupNudge, Summary };
