// Diario de casino real: anotás cada sesión que jugás de verdad y ves tu resultado acumulado.
import { useState } from "react";
import { dayKey, setState, useStore } from "../state.js";
import { Icon } from "../ui/icons.jsx";
import { Button, Modal, Pills, cx } from "../ui/components.jsx";
import { money } from "../engine/table.js";
import { TopBar } from "../ui/common.jsx";
import { useNav } from "../nav.js";

const HOURS = [0.5, 1, 1.5, 2, 3, 4, 5, 6];

function sm(v) {
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}$${money(Math.round(Math.abs(v)))}`;
}
function hoursText(h) {
  return `${String(h).replace(".", ",")} h`;
}
function dateText(d) {
  return new Date(`${d}T12:00:00`).toLocaleDateString("es-UY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Resultado acumulado, sesión por sesión.
function JournalChart({ entries }) {
  const [sel, setSel] = useState(entries.length - 1);
  const W = 340;
  const H = 150;
  const pad = { l: 8, r: 8, t: 12, b: 12 };
  let acc = 0;
  const pts = [{ v: 0 }, ...entries.map((e) => ({ v: (acc += e.result), e }))];
  let lo = Math.min(0, ...pts.map((p) => p.v));
  let hi = Math.max(0, ...pts.map((p) => p.v));
  if (hi - lo < 1) hi = lo + 1;
  const span = hi - lo;
  lo -= span * 0.08;
  hi += span * 0.08;
  const x = (i) => pad.l + (i / (pts.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + ((hi - v) / (hi - lo)) * (H - pad.t - pad.b);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.v)}`).join("");
  const cur = pts[sel + 1];
  const pick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(
      ((px - pad.l) / (W - pad.l - pad.r)) * (pts.length - 1),
    );
    setSel(Math.max(0, Math.min(entries.length - 1, i - 1)));
  };
  return (
    <div className="fan">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Resultado acumulado: ${sm(pts[pts.length - 1].v)} en ${entries.length} sesiones.`}
        onPointerDown={pick}
        onPointerMove={(e) => e.buttons && pick(e)}
      >
        <line
          x1={pad.l}
          x2={W - pad.r}
          y1={y(0)}
          y2={y(0)}
          className="fan-zero"
        />
        <path d={line} className="fan-mid" />
        <line
          x1={x(sel + 1)}
          x2={x(sel + 1)}
          y1={pad.t}
          y2={H - pad.b}
          className="fan-cross"
        />
        <circle cx={x(sel + 1)} cy={y(cur.v)} r="4.5" className="fan-dot" />
      </svg>
      <div className="fan-tip small">
        <b>{dateText(cur.e.date)}</b> · {sm(cur.e.result)} · acumulado{" "}
        <b className={cur.v >= 0 ? "good" : "bad"}>{sm(cur.v)}</b>
      </div>
    </div>
  );
}

function EntryForm({ onClose }) {
  const [date, setDate] = useState(dayKey());
  const [place, setPlace] = useState("");
  const [hours, setHours] = useState(2);
  const [sign, setSign] = useState(1);
  const [amount, setAmount] = useState("");
  const value = Number(String(amount).replace(/[^\d]/g, ""));
  const save = () => {
    const entry = {
      id: Date.now(),
      date,
      place: place.trim().slice(0, 40),
      hours,
      result: sign * value,
    };
    setState((st) => ({
      ...st,
      journal: {
        entries: [...st.journal.entries, entry]
          .sort((a, b) =>
            a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id,
          )
          .slice(-300),
      },
    }));
    onClose();
  };
  return (
    <>
      <h2 style={{ fontSize: 24 }}>Anotar una sesión</h2>
      <label className="field">
        <span>Fecha</span>
        <input
          className="inp"
          type="date"
          value={date}
          max={dayKey()}
          onChange={(e) => setDate(e.target.value || dayKey())}
        />
      </label>
      <label className="field">
        <span>Casino (opcional)</span>
        <input
          className="inp"
          type="text"
          value={place}
          placeholder="Ej.: Casino Carrasco"
          maxLength={40}
          onChange={(e) => setPlace(e.target.value)}
        />
      </label>
      <div className="field">
        <span>Horas que jugaste</span>
        <Pills
          options={HOURS.map((h) => ({ value: h, label: hoursText(h) }))}
          value={hours}
          onChange={setHours}
        />
      </div>
      <div className="field">
        <span>Resultado</span>
        <div className="jr-result">
          <Pills
            options={[
              { value: 1, label: "Gané" },
              { value: -1, label: "Perdí" },
            ]}
            value={sign}
            onChange={setSign}
          />
          <span className="jr-amount">
            <b>$</b>
            <input
              className="inp num"
              type="text"
              inputMode="numeric"
              value={amount}
              placeholder="0"
              onChange={(e) =>
                setAmount(e.target.value.replace(/[^\d]/g, "").slice(0, 7))
              }
              aria-label="Monto"
            />
          </span>
        </div>
      </div>
      <div className="btns" style={{ marginTop: 10 }}>
        <Button onClick={save}>
          Guardar {value || sign < 0 ? sm(sign * value) : "$0"}
        </Button>
        <Button kind="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </>
  );
}

function Journal() {
  const st = useStore();
  const nav = useNav();
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState(null);
  const entries = st.journal.entries;
  const total = entries.reduce((a, e) => a + e.result, 0);
  const hours = entries.reduce((a, e) => a + e.hours, 0);
  const wins = entries.filter((e) => e.result > 0).length;
  return (
    <div className="journal fade-up">
      <TopBar
        onClose={() => nav.pop()}
        closeIcon="back"
        title="Diario de casino real"
        sub="Lo que jugás de verdad"
      />
      {entries.length ? (
        <>
          <div className="tiles">
            <div className="tile">
              <div
                className={cx(
                  "tile-v num",
                  total > 0 ? "t-good" : total < 0 ? "t-bad" : "",
                )}
              >
                {sm(total)}
              </div>
              <div className="tile-l">resultado</div>
            </div>
            <div className="tile">
              <div className="tile-v num">{hoursText(hours)}</div>
              <div className="tile-l">jugadas</div>
            </div>
            <div className="tile">
              <div
                className={cx(
                  "tile-v num",
                  total > 0 ? "t-good" : total < 0 ? "t-bad" : "",
                )}
              >
                {sm(hours ? total / hours : 0)}
              </div>
              <div className="tile-l">por hora</div>
            </div>
          </div>
          {entries.length >= 2 ? (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="eyebrow">Resultado acumulado</div>
              <JournalChart entries={entries} />
            </div>
          ) : null}
          <p className="muted small" style={{ marginTop: 12 }}>
            {entries.length} {entries.length === 1 ? "sesión" : "sesiones"},{" "}
            {wins} {wins === 1 ? "ganada" : "ganadas"}.{" "}
            {hours < 100
              ? "Con pocas horas, el resultado es casi todo suerte: lo que importa es jugar bien. Compará con lo que espera el simulador de banca."
              : "Ya tenés horas suficientes para que el resultado empiece a mostrar tu ventaja."}
          </p>
          <div className="section-title">
            <h2>Sesiones</h2>
          </div>
          <div className="list">
            {entries
              .slice()
              .reverse()
              .map((e) => (
                <div className="list-item jr-item" key={e.id}>
                  <span
                    className={cx(
                      "score-pill",
                      e.result > 0 ? "good" : e.result < 0 ? "bad" : "mid",
                    )}
                  >
                    <b className="num">{sm(e.result)}</b>
                  </span>
                  <span className="li-text">
                    <span className="li-title">{e.place || "Casino"}</span>
                    <span className="li-sub num" style={{ display: "block" }}>
                      {dateText(e.date)} · {hoursText(e.hours)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="icon-btn sq small-ib"
                    aria-label="Borrar sesión"
                    onClick={() => setDel(e)}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              ))}
          </div>
        </>
      ) : (
        <div className="card flat center jr-empty">
          <Icon name="book" size={34} />
          <p style={{ marginTop: 10 }}>
            Anotá cada vez que jugás en un casino de verdad: cuántas horas y
            cuánto ganaste o perdiste. Acá vas a ver tu resultado acumulado y
            cuánto ganás por hora.
          </p>
          <p className="muted small" style={{ marginTop: 8 }}>
            Se guarda solo en este celular, como el resto de tu progreso.
          </p>
        </div>
      )}
      <div className="bottom-actions">
        <Button onClick={() => setAdding(true)} icon="plus">
          Anotar una sesión
        </Button>
      </div>
      <Modal open={adding} onClose={() => setAdding(false)}>
        {adding ? <EntryForm onClose={() => setAdding(false)} /> : null}
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)}>
        <h2 style={{ fontSize: 24 }}>¿Borrar esta sesión?</h2>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          {del ? `${dateText(del.date)} · ${sm(del.result)}` : ""}
        </p>
        <div className="btns">
          <Button kind="secondary" onClick={() => setDel(null)}>
            Dejarla
          </Button>
          <Button
            kind="danger"
            onClick={() => {
              setState((st) => ({
                ...st,
                journal: {
                  entries: st.journal.entries.filter((x) => x.id !== del.id),
                },
              }));
              setDel(null);
            }}
          >
            Borrar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export { Journal };
