import { Component, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { jsx as _jsx } from "react/jsx-runtime";
import { getState, resetAll, setState, useStore } from "./state.js";
import { Icon } from "./ui/icons.jsx";
import { vibrate } from "./sound.js";
import { Toasts, cx } from "./ui/components.jsx";
import { TrainSession } from "./screens/TrainSession.jsx";
import { Onboarding, Placement } from "./screens/Onboarding.jsx";
import { LearnTab } from "./screens/LearnTab.jsx";
import { CountTab } from "./screens/CountTab.jsx";
import { TrainTab } from "./screens/TrainTab.jsx";
import {
  DeckCountdown,
  DrillBet,
  DrillDecks,
  DrillRunning,
  DrillTrue,
  DrillValues,
} from "./screens/drills.jsx";
import { PlayTab } from "./screens/PlayTab.jsx";
import { ProgressTab } from "./screens/ProgressTab.jsx";
import { TrainSummary } from "./screens/TrainSummary.jsx";
import { Lesson } from "./lessons/Lesson.jsx";
import { Review } from "./lessons/Review.jsx";
import { Guide, GuideChapter } from "./screens/Guide.jsx";
import { ChartSheet, SettingsSheet, SystemSheet } from "./screens/sheets.jsx";
import { NavContext } from "./nav.js";
import { CountLevel, DrillPairs } from "./screens/countPath.jsx";
import { ShoeChallenge } from "./screens/ShoeChallenge.jsx";
import { MyChart } from "./screens/MyChart.jsx";
import { JumpTest } from "./lessons/JumpTest.jsx";
import { TrainHistory } from "./screens/TrainHistory.jsx";
import {
  AchievementsScreen,
  useAchievementWatcher,
} from "./screens/achievements.jsx";
import { CasinoPlay, CasinoSetup } from "./screens/Casino.jsx";
import { BankrollSim } from "./screens/Bankroll.jsx";
import { Journal } from "./screens/Journal.jsx";
import { DevLevel } from "./screens/DevPath.jsx";
import { Backup } from "./screens/Backup.jsx";
import {
  GoalSheet,
  PRACTICE_SCREENS,
  useGoalCelebration,
  usePracticeClock,
} from "./screens/goal.jsx";

const TABS = [
  { id: "conteo", label: "Conteo", icon: "drills" },
  { id: "entrenar", label: "Entrenar", icon: "train" },
  { id: "jugar", label: "Jugar", icon: "play", layerClass: "layer-sim" },
  { id: "aprender", label: "Aprender", icon: "learn" },
  { id: "progreso", label: "Progreso", icon: "stats" },
];
const TAB_SCREENS = {
  conteo: CountTab,
  entrenar: TrainTab,
  jugar: PlayTab,
  aprender: LearnTab,
  progreso: ProgressTab,
};
const SCREENS = {
  trainSession: TrainSession,
  trainSummary: TrainSummary,
  lesson: Lesson,
  drillValues: DrillValues,
  drillRunning: DrillRunning,
  drillTrue: DrillTrue,
  drillDecks: DrillDecks,
  drillBet: DrillBet,
  deckCountdown: DeckCountdown,
  guide: Guide,
  guideChapter: GuideChapter,
  placement: Placement,
  countLevel: CountLevel,
  review: Review,
  drillPairs: DrillPairs,
  shoeChallenge: ShoeChallenge,
  myChart: MyChart,
  jumpTest: JumpTest,
  trainHistory: TrainHistory,
  achievements: AchievementsScreen,
  casino: CasinoSetup,
  casinoPlay: CasinoPlay,
  bankroll: BankrollSim,
  journal: Journal,
  devLevel: DevLevel,
  backup: Backup,
};
const SHEETS = {
  settings: SettingsSheet,
  system: SystemSheet,
  chartView: ChartSheet,
  goal: GoalSheet,
};
let screenSeq = 1;
function App() {
  let a = useStore(),
    [e, t] = useState(() =>
      TABS.some((k) => k.id === a.lastTab) ? a.lastTab : "aprender",
    ),
    [s, n] = useState(() => ({ [e]: true })),
    [l, i] = useState([]),
    [o, c] = useState(null),
    r = useRef(l),
    u = useRef(o);
  r.current = l;
  u.current = o;
  let d = useRef(0),
    p = () => {
      try {
        history.pushState({ v21: screenSeq }, "");
        return true;
      } catch {
        return false;
      }
    },
    f = (k) => {
      if (k && k.hist) {
        d.current++;
        try {
          history.back();
        } catch {
          d.current--;
        }
      }
    };
  useEffect(() => {
    let k = () => {
      if (d.current > 0) {
        d.current--;
        return;
      }
      if (u.current) {
        c(null);
        return;
      }
      if (r.current.length) {
        let v = r.current[r.current.length - 1];
        if (v.params && v.params.confirmExit) {
          p();
          window.dispatchEvent(new CustomEvent("v21-back"));
          return;
        }
        i((m) => m.slice(0, -1));
      }
    };
    window.addEventListener("popstate", k);
    return () => window.removeEventListener("popstate", k);
  }, []);
  let y = useMemo(
    () => ({
      get tab() {
        return e;
      },
      setTab(k) {
        vibrate(6);
        t(k);
        n((v) => (v[k] ? v : { ...v, [k]: true }));
        if (getState().lastTab !== k) {
          setState((v) => ({ ...v, lastTab: k }));
        }
      },
      push(k, v = {}) {
        let m = p();
        i((b) => [...b, { name: k, params: v, key: screenSeq++, hist: m }]);
      },
      replace(k, v = {}) {
        i((m) => {
          if (!m.length)
            return [{ name: k, params: v, key: screenSeq++, hist: p() }];
          let b = m[m.length - 1];
          return [
            ...m.slice(0, -1),
            { name: k, params: v, key: screenSeq++, hist: b.hist },
          ];
        });
      },
      pop() {
        let k = r.current;
        if (!k.length) return;
        let v = k[k.length - 1];
        i(k.slice(0, -1));
        f(v);
      },
      popAll() {
        let k = r.current;
        i([]);
        let v = k.filter((m) => m.hist).length;
        if (v) {
          d.current += 1;
          try {
            history.go(-v);
          } catch {
            d.current--;
          }
        }
      },
      goTab(k) {
        this.popAll();
        this.setTab(k);
      },
      openSheet(k, v = {}) {
        let m = u.current;
        if (m) {
          c({ name: k, props: v, hist: m.hist });
          return;
        }
        let b = p();
        c({ name: k, props: v, hist: b });
      },
      closeSheet() {
        let k = u.current;
        c(null);
        f(k);
      },
    }),
    [e],
  );
  // Meta diaria: el reloj corre en pantallas de práctica y jugando en el simulador.
  const top = l.length ? l[l.length - 1].name : null;
  const practicing =
    a.profile.onboarded && (top ? PRACTICE_SCREENS.has(top) : e === "jugar");
  usePracticeClock(practicing);
  const [goalToast, setGoalToast] = useState(null);
  useGoalCelebration((streak) => {
    const msg =
      streak > 1
        ? `¡Meta del día cumplida! Llevás ${streak} días seguidos.`
        : "¡Meta del día cumplida! Es el primer día de tu racha.";
    setGoalToast({ id: Date.now(), msg, kind: "good" });
    setTimeout(() => setGoalToast(null), 3600);
  });
  const [achToast, setAchToast] = useState(null);
  useAchievementWatcher((ach) => {
    setAchToast({
      id: Date.now() + ach.id,
      msg: `Logro: ${ach.title}`,
      kind: "good",
    });
    setTimeout(() => setAchToast(null), 3800);
  });
  if (!a.profile.onboarded)
    return (
      <NavContext.Provider value={y}>
        <div className="app">
          <Onboarding />
        </div>
      </NavContext.Provider>
    );
  let C = o ? SHEETS[o.name] : null;
  return (
    <NavContext.Provider value={y}>
      <div className="app">
        {TABS.map((k) => {
          if (!s[k.id]) return null;
          let v = TAB_SCREENS[k.id];
          return (
            <section
              className={cx("layer with-tabbar", k.layerClass)}
              hidden={k.id !== e || l.length > 0}
              aria-label={k.label}
              key={k.id}
            >
              {_jsx(v, { active: k.id === e && l.length === 0 })}
            </section>
          );
        })}
        {l.map((k, v) => {
          let m = SCREENS[k.name];
          return m ? (
            <section
              className={cx("layer full", k.params.flex && "flex")}
              hidden={v !== l.length - 1}
              style={{ zIndex: 20 + v }}
              key={k.key}
            >
              {_jsx(m, { ...k.params })}
            </section>
          ) : null;
        })}
        {l.length === 0 ? <TabBar tab={e} onTab={(k) => y.setTab(k)} /> : null}
        {C ? (
          <C open={true} onClose={() => y.closeSheet()} {...o.props} />
        ) : null}
        <Toasts items={[goalToast, achToast].filter(Boolean)} />
      </div>
    </NavContext.Provider>
  );
}
function TabBar({ tab: a, onTab: e }) {
  return (
    <nav className="tabbar" aria-label="Secciones">
      <div className="tabbar-in">
        {TABS.map((t) => (
          <button
            type="button"
            className={cx("tab", t.id === a && "on")}
            onClick={() => e(t.id)}
            aria-current={t.id === a ? "page" : undefined}
            key={t.id}
          >
            <span className="tab-ic">
              <Icon name={t.icon} size={24} stroke={t.id === a ? 2.3 : 2} />
            </span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
const ErrorBoundary = class extends Component {
  constructor(e) {
    super(e);
    this.state = { err: null };
  }
  static getDerivedStateFromError(e) {
    return { err: e };
  }
  componentDidCatch(e, t) {
    try {
      console.error("Ventaja 21:", e, t && t.componentStack);
    } catch {}
  }
  render() {
    return this.state.err ? (
      <div className="app">
        <div
          className="layer full"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <h1 style={{ fontSize: 30 }}>Algo salió mal</h1>
          <p className="muted">
            Hubo un error inesperado. Tu progreso está guardado. Probá volver a
            abrir la app.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => location.reload()}
          >
            Volver a abrir
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              resetAll();
              location.reload();
            }}
          >
            Si sigue fallando: borrar datos y empezar de cero
          </button>
          <p className="dim tiny">
            {String(this.state.err && this.state.err.message)}
          </p>
        </div>
      </div>
    ) : (
      this.props.children
    );
  }
};
// iPhone con la app instalada en la pantalla de inicio: en iOS 26 el alto de la pantalla que informa
// el sistema le resta la barra de estado, y la app terminaba antes del borde (la barra de pestañas
// quedaba flotando, con una franja negra abajo). Se mide ese hueco y se estira lo que va pegado abajo.
function fitScreen() {
  if (window.navigator.standalone !== true) return;
  const probe = (css) => {
    const el = document.createElement("div");
    el.style.cssText = `position:fixed;left:0;width:1px;visibility:hidden;pointer-events:none;${css}`;
    document.body.appendChild(el);
    const h = el.offsetHeight;
    el.remove();
    return h;
  };
  const safeTop = probe("top:0;height:env(safe-area-inset-top)");
  const viewH = probe("top:0;bottom:0");
  const portrait = viewH >= window.innerWidth;
  const screenH = portrait
    ? Math.max(screen.width, screen.height)
    : Math.min(screen.width, screen.height);
  const gap = screenH - viewH;
  document.documentElement.style.setProperty(
    "--app-gap",
    gap > 0 && gap <= safeTop + 12 ? `${gap}px` : "0px",
  );
}
fitScreen();
window.addEventListener("resize", fitScreen);
window.addEventListener("orientationchange", () => setTimeout(fitScreen, 300));
const appRoot = createRoot(document.getElementById("root"));
appRoot.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    try {
      if (location.protocol === "https:" || location.hostname === "localhost") {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
      }
    } catch {}
  });
}
