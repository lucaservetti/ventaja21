// Tu perfil de jugador: qué tan bien te va en cada habilidad (estrategia y conteo),
// tus puntos fuertes y débiles, y qué te conviene practicar ahora.
import { useMemo } from "react";
import { Icon } from "../ui/icons.jsx";
import { ProgressBar, cx } from "../ui/components.jsx";
import { SKILLS } from "../engine/trainer.js";
import { skillStats } from "../engine/skills.js";
import { currentLevel } from "../engine/countPath.js";
import { LESSONS } from "../lessons/content.js";
import { reviewCount } from "../lessons/Review.jsx";
import { useRules } from "../ui/common.jsx";
import { useNav } from "../nav.js";

const MIN_HANDS = 5;

function avgSessions(list, last = 5) {
  const s = (list || []).slice(-last).filter((x) => x && x.n);
  if (!s.length) return null;
  return { acc: s.reduce((a, x) => a + x.ok / x.n, 0) / s.length, n: s.length };
}

// Todas las habilidades con datos suficientes, con su precisión reciente.
function playerSkills(st, rules) {
  const out = [];
  for (const sk of SKILLS) {
    if (sk.id === "surrender" && !rules.surrender) continue;
    const s = skillStats(st.train.cells, sk.id, rules);
    out.push({
      id: sk.id,
      area: "estrategia",
      name: sk.id === "count" ? "Desviaciones" : sk.name,
      acc: s.n >= MIN_HANDS ? s.acc : null,
      n: s.n,
      coverage: s.coverage,
      go: {
        screen: "trainSession",
        params:
          sk.id === "count"
            ? { mode: "count" }
            : { mode: "skill", focus: sk.id },
      },
    });
  }
  const d = st.drills;
  const running = (d.running.sessions || []).slice(-10);
  const count = [
    {
      id: "values",
      name: "Valores de las cartas",
      s: avgSessions(d.values.sessions),
      screen: "drillValues",
    },
    {
      id: "pairs",
      name: "Cancelar de a pares",
      s: avgSessions(d.pairs && d.pairs.sessions),
      screen: "drillPairs",
    },
    {
      id: "running",
      name: "Conteo corrido",
      s: running.length
        ? {
            acc: running.filter((r) => r.ok).length / running.length,
            n: running.length,
          }
        : null,
      screen: "drillRunning",
    },
    {
      id: "true",
      name: "Conteo real",
      s: avgSessions(d.true.sessions),
      screen: "drillTrue",
    },
    {
      id: "bet",
      name: "Apuesta según el conteo",
      s: avgSessions(d.bet.sessions),
      screen: "drillBet",
    },
    {
      id: "checks",
      name: "Conteo en la mesa",
      s:
        st.play.checks >= 3
          ? { acc: st.play.checksOk / st.play.checks, n: st.play.checks }
          : null,
      tab: "jugar",
    },
  ];
  for (const c of count)
    out.push({
      id: c.id,
      area: "conteo",
      name: c.name,
      acc: c.s ? c.s.acc : null,
      n: c.s ? c.s.n : 0,
      go: c.tab ? { tab: c.tab } : { screen: c.screen, params: {} },
    });
  return out;
}

function profileOf(st, rules) {
  const skills = playerSkills(st, rules);
  const known = skills.filter((s) => s.acc !== null);
  const strong = known
    .filter((s) => s.acc >= 0.9)
    .sort((a, b) => b.acc - a.acc)
    .slice(0, 3);
  const weak = known
    .filter((s) => s.acc < 0.8)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3);
  return { skills, strong, weak, known: known.length };
}

// Qué te conviene hacer ahora, en orden.
function recommendations(st, rules) {
  const out = [];
  const pending = reviewCount(st);
  if (pending)
    out.push({
      id: "review",
      icon: "refresh",
      title: "Repasá lo que fallaste en las lecciones",
      sub:
        pending === 1
          ? "1 pregunta pendiente"
          : `${pending} preguntas pendientes`,
      go: { screen: "review", params: {} },
    });
  const mistakes = (st.train.mistakes || []).length;
  if (mistakes >= 3)
    out.push({
      id: "mistakes",
      icon: "target",
      title: "Repetí las manos que fallaste",
      sub: `${mistakes} ${mistakes === 1 ? "mano" : "manos"}, con las mismas cartas`,
      go: { screen: "trainSession", params: { mode: "mistakes" } },
    });
  const { weak } = profileOf(st, rules);
  for (const w of weak.slice(0, 2))
    out.push({
      id: "weak-" + w.id,
      icon: w.area === "conteo" ? "drills" : "train",
      title: `Practicá ${w.name.toLowerCase()}`,
      sub: `Vas ${Math.round(w.acc * 100)} %: es tu punto más flojo${w.area === "conteo" ? " de conteo" : ""}`,
      go: w.go,
    });
  const nextLesson = LESSONS.find(
    (l) => !(st.lessons[l.id] && st.lessons[l.id].done),
  );
  if (nextLesson)
    out.push({
      id: "lesson",
      icon: "learn",
      title: nextLesson.exam
        ? "Rendí el examen final"
        : `Lección: ${nextLesson.title}`,
      sub: `Sección ${nextLesson.section} · ${LESSONS.indexOf(nextLesson) + 1} de ${LESSONS.length}`,
      go: nextLesson.exam
        ? { screen: "shoeChallenge", params: { mode: "exam", flex: true } }
        : { screen: "lesson", params: { id: nextLesson.id } },
    });
  const level = currentLevel(st);
  if (level)
    out.push({
      id: "level",
      icon: "drills",
      title: `Ruta de conteo: nivel ${level.n}`,
      sub: level.title,
      go: { screen: "countLevel", params: { level: level.n } },
    });
  if (!st.train.sessions.length)
    out.push({
      id: "first",
      icon: "train",
      title: "Hacé tu primera tanda en Entrenar",
      sub: "Diez manos para encontrar tu nivel",
      go: { screen: "trainSession", params: { mode: "level" } },
    });
  out.push({
    id: "sim",
    icon: "play",
    title: "Jugá un zapato en el simulador",
    sub: "Contando y apostando como en un casino",
    go: { tab: "jugar" },
  });
  return out;
}

function runGo(nav, go) {
  if (go.tab) nav.goTab(go.tab);
  else nav.push(go.screen, { confirmExit: true, ...go.params });
}

// "Lo que te conviene ahora": lista corta de próximos pasos.
function NextSteps({
  st,
  limit = 3,
  title = "Lo que te conviene ahora",
  className,
  onGo,
}) {
  const nav = useNav();
  const rules = useRules();
  const list = useMemo(
    () => recommendations(st, rules).slice(0, limit),
    [st, rules, limit],
  );
  return (
    <div className={cx("card next-up", className)}>
      {title ? <div className="eyebrow acc">{title}</div> : null}
      {list.map((r) => (
        <button
          type="button"
          className="next-up-item"
          onClick={() => {
            if (onGo) onGo();
            runGo(nav, r.go);
          }}
          key={r.id}
        >
          <span className="li-icon">
            <Icon name={r.icon} />
          </span>
          <span className="li-text">
            <span className="li-title">{r.title}</span>
            <span className="li-sub">{r.sub}</span>
          </span>
          <Icon name="chev" className="li-chev" />
        </button>
      ))}
    </div>
  );
}

function SkillRow({ s, nav }) {
  const tone =
    s.acc === null ? "" : s.acc >= 0.9 ? "good" : s.acc >= 0.7 ? "mid" : "bad";
  return (
    <button type="button" className="pf-skill" onClick={() => runGo(nav, s.go)}>
      <span className="pf-skill-name">{s.name}</span>
      <span className="pf-skill-bar">
        <ProgressBar value={s.acc === null ? 0 : s.acc} tone={tone} />
      </span>
      <span className={cx("pf-skill-v num", tone && `t-${tone}`)}>
        {s.acc === null ? "—" : `${Math.round(s.acc * 100)} %`}
      </span>
    </button>
  );
}

// Tarjeta completa del perfil (Progreso).
function ProfileCard({ st }) {
  const nav = useNav();
  const rules = useRules();
  const p = useMemo(() => profileOf(st, rules), [st, rules]);
  return (
    <div className="card profile-card">
      <div className="eyebrow">Tu perfil de jugador</div>
      {p.known ? (
        <div className="pf-tags">
          {p.strong.length ? (
            <div>
              <span className="pf-tag-title good">Puntos fuertes</span>
              <div className="tags">
                {p.strong.map((s) => (
                  <span className="chip-tag good" key={s.id}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {p.weak.length ? (
            <div>
              <span className="pf-tag-title bad">A mejorar</span>
              <div className="tags">
                {p.weak.map((s) => (
                  <span className="chip-tag bad" key={s.id}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {!p.strong.length && !p.weak.length ? (
            <p className="muted small">
              Vas parejo: ninguna habilidad muy floja ni del todo dominada
              todavía.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="muted small" style={{ marginTop: 8 }}>
          Entrená unas manos y hacé un par de ejercicios de conteo: tu perfil se
          arma solo con lo que practicás.
        </p>
      )}
      <h3 className="pf-area">Estrategia</h3>
      {p.skills
        .filter((s) => s.area === "estrategia")
        .map((s) => (
          <SkillRow s={s} nav={nav} key={s.id} />
        ))}
      <h3 className="pf-area">Conteo</h3>
      {p.skills
        .filter((s) => s.area === "conteo")
        .map((s) => (
          <SkillRow s={s} nav={nav} key={s.id} />
        ))}
      <p className="muted tiny" style={{ marginTop: 10 }}>
        Precisión reciente. Tocá una habilidad para practicarla.
      </p>
    </div>
  );
}

// Resumen corto (Entrenar): fuertes y flojos en chips.
function ProfileChips({ st, onMore }) {
  const rules = useRules();
  const p = useMemo(() => profileOf(st, rules), [st, rules]);
  if (!p.known) return null;
  return (
    <button type="button" className="card profile-chips" onClick={onMore}>
      <span className="row between" style={{ width: "100%" }}>
        <span className="eyebrow">Tu perfil</span>
        <span className="link small">Ver completo →</span>
      </span>
      <span className="tags" style={{ marginTop: 10 }}>
        {p.strong.map((s) => (
          <span className="chip-tag good" key={s.id}>
            {s.name}
          </span>
        ))}
        {p.weak.map((s) => (
          <span className="chip-tag bad" key={s.id}>
            {s.name}
          </span>
        ))}
        {!p.strong.length && !p.weak.length ? (
          <span className="muted small">
            Vas parejo en todo. Seguí sumando manos.
          </span>
        ) : null}
      </span>
    </button>
  );
}

export {
  NextSteps,
  ProfileCard,
  ProfileChips,
  profileOf,
  recommendations,
  runGo,
};
