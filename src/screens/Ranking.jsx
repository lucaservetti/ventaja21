// Ranking del desafío diario: los mejores de hoy y de la semana.
import { useEffect, useState } from "react";
import { Icon } from "../ui/icons.jsx";
import { Button, Pills, cx } from "../ui/components.jsx";
import { TopBar } from "../ui/common.jsx";
import { useNav } from "../nav.js";
import { ACCOUNTS, topScores, useAccount } from "../cloud.js";

function Ranking() {
  const nav = useNav();
  const { acct } = useAccount();
  const [kind, setKind] = useState("daily");
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    setData(null);
    setErr(false);
    topScores(kind)
      .then((d) => live && setData(d))
      .catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, [kind, acct && acct.uid, acct && acct.nick]);
  const inTop = data && data.me && data.rows.some((r) => r.id === data.me.id);
  return (
    <div className="ranking fade-up">
      <TopBar onClose={() => nav.pop()} closeIcon="back" title="Ranking" />
      <Pills
        options={[
          { value: "daily", label: "Hoy" },
          { value: "weekly", label: "Esta semana" },
        ]}
        value={kind}
        onChange={setKind}
      />
      <p className="muted small" style={{ margin: "10px 2px 12px" }}>
        {kind === "daily"
          ? "Puntos del desafío diario de hoy. Cuenta tu primer intento."
          : "La suma de tus desafíos diarios desde el lunes."}
        {data && data.total
          ? ` ${data.total} ${data.total === 1 ? "jugador" : "jugadores"}.`
          : ""}
      </p>
      <div className="card rank-list" aria-busy={!data && !err}>
        {err ? (
          <p className="muted">
            No se pudo cargar el ranking. Revisá la conexión.
          </p>
        ) : !data ? (
          <p className="muted">Cargando…</p>
        ) : !data.rows.length ? (
          <p className="muted">Todavía nadie jugó. ¡Podés ser el primero!</p>
        ) : (
          <ol>
            {data.rows.map((r, i) => (
              <li
                className={cx("rank-row", acct && r.id === acct.uid && "me")}
                key={r.id}
              >
                <span className={cx("rank-pos num", i < 3 && `top${i + 1}`)}>
                  {i + 1}
                </span>
                <span className="grow rank-name">{r.name}</span>
                <b className="num">{r.score}</b>
              </li>
            ))}
          </ol>
        )}
        {data && data.me && !inTop ? (
          <div className="rank-row me rank-mine">
            <span className="rank-pos num">{data.me.rank}</span>
            <span className="grow rank-name">{data.me.name}</span>
            <b className="num">{data.me.score}</b>
          </div>
        ) : null}
      </div>
      {!acct && ACCOUNTS ? (
        <div className="card rank-join">
          <Icon name="podium" />
          <div className="grow">
            <b>¿Querés aparecer?</b>
            <div className="muted small">
              Entrá con tu cuenta de Google. Es opcional.
            </div>
          </div>
          <Button kind="outline" onClick={() => nav.push("account")}>
            Entrar
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { Ranking };
