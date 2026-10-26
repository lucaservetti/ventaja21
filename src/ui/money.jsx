// Moneda del casino, el simulador de banca y el diario: dólares, pesos o euros, con montos
// sugeridos para cada una y la opción de escribir cualquier monto.
import { useState } from "react";
import { setState, useStore } from "../state.js";
import { money } from "../engine/table.js";
import { Button, Modal, Pills, cx } from "./components.jsx";

const CURRENCIES = {
  USD: {
    id: "USD",
    label: "Dólares",
    sym: "US$",
    wallet: [300, 500, 1000, 2000, 5000],
    buyIn: [100, 200, 300, 500, 1000, 2000],
    min: [5, 10, 25, 50, 100],
    max: [100, 250, 500, 1000, 2500, 5000],
    bank: [500, 1000, 2000, 5000, 10000, 20000],
    setup: { wallet: 1000, buyIn: 300, minBet: 10, maxBet: 500 },
    exam: { wallet: 1000, buyIn: 500, minBet: 10, maxBet: 200 },
  },
  UYU: {
    id: "UYU",
    label: "Pesos",
    sym: "$",
    wallet: [5000, 10000, 20000, 40000, 100000],
    buyIn: [2000, 4000, 6000, 10000, 20000, 40000],
    min: [100, 200, 500, 1000, 2000],
    max: [5000, 10000, 20000, 50000, 100000],
    bank: [20000, 40000, 100000, 200000, 500000, 1000000],
    setup: { wallet: 20000, buyIn: 6000, minBet: 200, maxBet: 10000 },
    exam: { wallet: 40000, buyIn: 20000, minBet: 200, maxBet: 5000 },
  },
  EUR: {
    id: "EUR",
    label: "Euros",
    sym: "€",
    wallet: [300, 500, 1000, 2000, 5000],
    buyIn: [100, 200, 300, 500, 1000, 2000],
    min: [5, 10, 25, 50, 100],
    max: [100, 250, 500, 1000, 2500, 5000],
    bank: [500, 1000, 2000, 5000, 10000, 20000],
    setup: { wallet: 1000, buyIn: 300, minBet: 10, maxBet: 500 },
    exam: { wallet: 1000, buyIn: 500, minBet: 10, maxBet: 200 },
  },
};

function currencyOf(st) {
  return CURRENCIES[st.settings.currency] || CURRENCIES.USD;
}
function useCurrency() {
  return currencyOf(useStore());
}
function fmtMoney(v, cur) {
  return `${v < 0 ? "−" : ""}${cur.sym}${money(Math.round(Math.abs(v)))}`;
}
function fmtSignedMoney(v, cur) {
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${cur.sym}${money(Math.round(Math.abs(v)))}`;
}
// Fichas de la mesa según la apuesta mínima.
function chipsFor(minBet) {
  if (minBet < 25) return [1, 5, 25, 100, 500];
  if (minBet < 100) return [5, 25, 100, 500, 1000];
  if (minBet < 500) return [25, 100, 500, 1000, 5000];
  return [100, 500, 1000, 5000, 10000];
}
// Al cambiar de moneda, el casino arranca con los montos típicos de esa moneda.
function setCurrency(id) {
  setState((st) => ({
    ...st,
    settings: { ...st.settings, currency: id },
    casino: {
      ...st.casino,
      setup: { ...st.casino.setup, ...CURRENCIES[id].setup },
    },
  }));
}

function CurrencyPills() {
  const cur = useCurrency();
  return (
    <Pills
      options={Object.values(CURRENCIES).map((c) => ({
        value: c.id,
        label: `${c.label} (${c.sym})`,
      }))}
      value={cur.id}
      onChange={setCurrency}
    />
  );
}

// Montos sugeridos más "Otro…" para escribir cualquiera.
function AmountPills({ value, options, onChange, cur, title, min = 1 }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const custom = !options.includes(value);
  const typed = Number(text.replace(/[^\d]/g, ""));
  const ok = typed >= min;
  return (
    <>
      <Pills
        options={[
          ...options.map((v) => ({ value: v, label: fmtMoney(v, cur) })),
          {
            value: "__other",
            label: custom ? `${fmtMoney(value, cur)} ✎` : "Otro…",
          },
        ]}
        value={custom ? "__other" : value}
        onChange={(v) => {
          if (v === "__other") {
            setText(custom ? String(value) : "");
            setOpen(true);
          } else onChange(v);
        }}
      />
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 style={{ fontSize: 24 }}>{title}</h2>
        <label className="amount-input">
          <b>{cur.sym}</b>
          <input
            className="inp num"
            type="text"
            inputMode="numeric"
            autoFocus={true}
            value={text ? money(typed) : ""}
            placeholder="0"
            onChange={(e) =>
              setText(e.target.value.replace(/[^\d]/g, "").slice(0, 8))
            }
            aria-label={title}
          />
        </label>
        <p
          className={cx("small", ok || !text ? "muted" : "bad")}
          style={{ marginTop: 8 }}
        >
          {ok || !text
            ? "Escribí el monto que quieras."
            : `Tiene que ser al menos ${fmtMoney(min, cur)}.`}
        </p>
        <div className="btns" style={{ marginTop: 16 }}>
          <Button
            disabled={!ok}
            onClick={() => {
              onChange(typed);
              setOpen(false);
            }}
          >
            Usar {ok ? fmtMoney(typed, cur) : "este monto"}
          </Button>
          <Button kind="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </>
  );
}

export {
  AmountPills,
  CURRENCIES,
  CurrencyPills,
  chipsFor,
  currencyOf,
  fmtMoney,
  fmtSignedMoney,
  setCurrency,
  useCurrency,
};
