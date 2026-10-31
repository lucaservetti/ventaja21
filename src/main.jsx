import {
  Activity,
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { jsx as _jsx } from "react/jsx-runtime";
import {
  getState,
  resetAll,
  setSettings,
  setState,
  useStore,
} from "./state.js";
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
import { SpeedDrill } from "./screens/SpeedDrill.jsx";
import { Blitz } from "./screens/Blitz.jsx";
import { Premium } from "./screens/Premium.jsx";
import { Account } from "./screens/Account.jsx";
import { Ranking } from "./screens/Ranking.jsx";
import { initCloud, onPremio, reportError } from "./cloud.js";
import { Challenge } from "./screens/Challenge.jsx";
import { Looks } from "./screens/Looks.jsx";
import { Premios } from "./screens/Premios.jsx";
import { Mistakes } from "./screens/Mistakes.jsx";
import { pendingChallenge, takeChallengeFromUrl } from "./challenge.js";
import {
  NATIVE,
  PREMIUM_SYSTEMS,
  hasPremium,
  initPlatform,
  maybeAskReview,
  maybeShowAd,
  needsPremium,
  onAndroidBack,
} from "./platform.js";
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
  speedDrill: SpeedDrill,
  blitz: Blitz,
  premium: Premium,
  looks: Looks,
  premios: Premios,
  mistakes: Mistakes,
  account: Account,
  challenge: Challenge,
  ranking: Ranking,
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
  // Android: "atrás" cierra lo que esté abierto; en otra pestaña vuelve a Aprender, y recién en
  // Aprender sale de la app.
  let tabRef = useRef(e);
  tabRef.current = e;
  useEffect(
    () =>
      onAndroidBack((canGoBack) => {
        if (canGoBack) history.back();
        else if (tabRef.current !== "aprender") y.setTab("aprender");
        else return false;
        return true;
      }),
    [],
  );
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
        // Sin Premium (ni prueba activa), lo de Premium abre la pantalla de Premium.
        if (needsPremium(k, v)) {
          v = { feature: k, then: v };
          k = "premium";
        }
        let m = p();
        i((b) => [...b, { name: k, params: v, key: screenSeq++, hist: m }]);
      },
      replace(k, v = {}) {
        if (needsPremium(k, v)) {
          v = { feature: k, then: v };
          k = "premium";
        }
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
  // Sin pantallas encima ni hojas abiertas: momento seguro para recargar si hay una versión nueva.
  const idle = l.length === 0 && !o;
  useEffect(() => {
    window.__v21Idle = idle;
    if (idle) window.dispatchEvent(new Event("v21-idle"));
  }, [idle]);
  // Con la app quieta se preparan las otras pestañas, de a una, para que cambiar sea instantáneo.
  const pending = a.profile.onboarded ? TABS.find((k) => !s[k.id]) : null;
  useEffect(() => {
    if (!pending) return undefined;
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
    const cancel = window.cancelIdleCallback || clearTimeout;
    let id = 0;
    const t0 = setTimeout(() => {
      id = idle(() => n((v) => ({ ...v, [pending.id]: true })), {
        timeout: 3000,
      });
    }, 700);
    return () => {
      clearTimeout(t0);
      cancel(id);
    };
  }, [pending]);
  // Un desafío de un amigo (enlace con #reto=…): se abre apenas termina la bienvenida.
  const onboardedNow = a.profile.onboarded;
  useEffect(() => {
    if (!onboardedNow) return undefined;
    const open = () => {
      const c = pendingChallenge();
      if (c) y.push("challenge", { challenge: c });
    };
    open();
    const onHash = () => {
      takeChallengeFromUrl();
      open();
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [onboardedNow]);
  // Tema (oscuro o claro) y tamaño de letra.
  const theme = a.settings.theme || "dark";
  const bigText = !!a.settings.bigText;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.text = bigText ? "large" : "normal";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "light" ? "#f4efe4" : "#06110c";
  }, [theme, bigText]);
  // Paños y mazos (Premium): se ven con Premium; si no (o si se venció), la mesa de siempre.
  const looksOn = hasPremium(a);
  const look = looksOn
    ? {
        felt: a.settings.felt || "",
        back: a.settings.cardBack || "",
        deck: a.settings.fourColor ? "4" : "",
      }
    : { felt: "", back: "", deck: "" };
  useEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(look)) {
      if (v) root.dataset[k] = v;
      else delete root.dataset[k];
    }
  }, [look.felt, look.back, look.deck]);
  // Un sistema de conteo de Premium sin Premium (por ejemplo, se venció un regalo): vuelve a Hi-Lo.
  const sysLocked =
    PREMIUM_SYSTEMS.includes(a.settings.system) && !hasPremium(a);
  useEffect(() => {
    if (sysLocked) setSettings({ system: "hilo" });
  }, [sysLocked]);
  // Al volver a una pestaña después de terminar algo, a veces un anuncio (solo en Android, sin Premium).
  const depth = useRef(0);
  const [premToast, setPremToast] = useState(null);
  const showPremToast = (msg, ms = 4200) => {
    setPremToast({ id: Date.now(), msg, kind: "info" });
    setTimeout(() => setPremToast(null), ms);
  };
  useEffect(() => {
    if (depth.current > 0 && l.length === 0)
      maybeShowAd().then((n) => {
        // Después del 2.º y el 5.º anuncio del día, un recordatorio de que con Premium no hay.
        if (n === 2 || n === 5)
          showPremToast(
            "¿Muchos anuncios? Con Premium no ves ninguno. Está en Ajustes → Premium.",
          );
      });
    depth.current = l.length;
  }, [l.length]);
  // Meta diaria: el reloj corre en pantallas de práctica y jugando en el simulador.
  const top = l.length ? l[l.length - 1].name : null;
  const practicing =
    a.profile.onboarded && (top ? PRACTICE_SCREENS.has(top) : e === "jugar");
  usePracticeClock(practicing);
  // Premios: cuando el servidor da días de Premium nuevos, un aviso.
  useEffect(
    () =>
      onPremio((r) =>
        showPremToast(
          r.dias === 1
            ? "¡Ganaste 1 día de Premium! Mirá tus premios en Progreso."
            : `¡Ganaste ${r.dias} días de Premium! Mirá tus premios en Progreso.`,
          5000,
        ),
      ),
    [],
  );
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
    maybeAskReview();
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
          const shown = k.id === e && l.length === 0;
          const sec = (
            <section
              className={cx("layer with-tabbar", k.layerClass)}
              hidden={!shown}
              aria-label={k.label}
              key={k.id}
            >
              {_jsx(v, { active: shown })}
              {k.id !== "jugar" ? (
                <p className="credit">Edge 21 ♠ · para aprender, sin plata real</p>
              ) : null}
            </section>
          );
          // Las pestañas ocultas no se vuelven a dibujar mientras practicás (React las actualiza
          // cuando hay tiempo libre). La mesa queda afuera: su ronda sigue andando aunque no se vea.
          return k.id === "jugar" ? (
            sec
          ) : (
            <Activity mode={shown ? "visible" : "hidden"} key={k.id}>
              {sec}
            </Activity>
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
        <Toasts items={[goalToast, achToast, premToast].filter(Boolean)} />
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
      console.error("Edge 21:", e, t && t.componentStack);
      reportError(e, t && t.componentStack);
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
// Se vuelve a medir al abrir, al volver a la app y un rato después: al arrancar, iOS puede informar
// medidas que todavía no son las finales.
function isIOS() {
  const ua = navigator.userAgent || "";
  return (
    /iP(hone|ad|od)/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}
function fitScreen() {
  const standalone =
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;
  if (!standalone || !isIOS()) return;
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;left:0;top:0;bottom:0;width:1px;visibility:hidden;pointer-events:none";
  document.body.appendChild(el);
  const viewH = el.offsetHeight;
  el.remove();
  const portrait = viewH >= window.innerWidth;
  const screenH = portrait
    ? Math.max(screen.width, screen.height)
    : Math.min(screen.width, screen.height);
  const gap = screenH - viewH;
  // Hueco del tamaño de la barra de estado y contenido metido debajo de ella: es el error de iOS.
  // Esa franja de abajo el iPhone no la dibuja, así que la app termina ahí: sin el margen de la
  // barra de inicio (que queda fuera de la vista), la barra de pestañas se apoya en ese borde.
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;height:env(safe-area-inset-top);width:1px;visibility:hidden";
  document.body.appendChild(probe);
  const safeTop = probe.offsetHeight;
  probe.remove();
  const fix = gap > 0 && gap <= 80 && safeTop > 0 ? gap : 0;
  const root = document.documentElement.style;
  if (fix) root.setProperty("--safe-b", "0px");
  else root.removeProperty("--safe-b");
  window.__v21Fit = { screenH, viewH, gap, fix };
}
fitScreen();
for (const ev of ["resize", "pageshow", "load"])
  window.addEventListener(ev, fitScreen);
window.addEventListener("orientationchange", () => setTimeout(fitScreen, 300));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") setTimeout(fitScreen, 100);
});
setTimeout(fitScreen, 400);
setTimeout(fitScreen, 1500);
const appRoot = createRoot(document.getElementById("root"));
appRoot.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
// Actualizaciones: el iPhone retoma la app suspendida sin recargarla, así que al volver se busca
// una versión nueva; cuando llega, se recarga en cuanto estés en una pestaña (nunca a mitad de algo).
takeChallengeFromUrl();
initPlatform();
initCloud();
if ("serviceWorker" in navigator && !NATIVE) {
  const hadController = !!navigator.serviceWorker.controller;
  let updateReady = false;
  const reloadIfIdle = () => {
    if (updateReady && window.__v21Idle) location.reload();
  };
  window.addEventListener("load", () => {
    try {
      if (location.protocol === "https:" || location.hostname === "localhost") {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
      }
    } catch {}
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return;
    updateReady = true;
    reloadIfIdle();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    navigator.serviceWorker
      .getRegistration()
      .then((r) => r && r.update())
      .catch(() => {});
    reloadIfIdle();
  });
  window.addEventListener("v21-idle", reloadIfIdle);
}
