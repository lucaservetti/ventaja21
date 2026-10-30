const ICON_PATHS = {
  drills: (
    <>
      <rect x="3.5" y="5.5" width="11" height="15" rx="2.5" />
      <path d="M9.5 3.5h7a2.5 2.5 0 0 1 2.5 2.5v11" />
      <path d="M9 15.2c-1.6-1-2.6-2-2.6-3.1 0-.9.7-1.6 1.5-1.6.5 0 .9.3 1.1.7.2-.4.6-.7 1.1-.7.8 0 1.5.7 1.5 1.6 0 1.1-1 2.1-2.6 3.1z" />
    </>
  ),
  train: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10.2 8.7v6.6l5.2-3.3z" strokeLinejoin="round" />
    </>
  ),
  learn: (
    <>
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" strokeLinejoin="round" />
      <path d="M6.5 11.5v4c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4" />
      <path d="M21.5 9.5v5" />
    </>
  ),
  stats: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M8 16.5v-3M12 16.5v-5M16 16.5v-7" />
      <path d="M7.5 10.5 11 8l2.5 1.5 3.5-3" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.3 1a7.4 7.4 0 0 0-2.6-1.5L14.2 2.5h-4.4l-.3 2.6A7.4 7.4 0 0 0 6.9 6.6l-2.3-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.3-1a7.4 7.4 0 0 0 2.6 1.5l.3 2.6h4.4l.3-2.6a7.4 7.4 0 0 0 2.6-1.5l2.3 1 2-3.4z"
        strokeLinejoin="round"
      />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  back: <path d="M15 5l-7 7 7 7" />,
  chev: <path d="M9 5l7 7-7 7" />,
  down: <path d="M5 9l7 7 7-7" />,
  flag: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4h10l-2 3.5L16 11H6" strokeLinejoin="round" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r=".6" fill="currentColor" />
    </>
  ),
  help: (
    <>
      <path d="M9.2 9a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.1v.6" />
      <circle cx="12" cy="18" r=".6" fill="currentColor" />
    </>
  ),
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  x: <path d="M7 7l10 10M17 7 7 17" />,
  book: (
    <>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"
        strokeLinejoin="round"
      />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
      <path d="M8.5 7.5h7" />
    </>
  ),
  volume: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" strokeLinejoin="round" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" strokeLinejoin="round" />
      <path d="M16 10l4 4M20 10l-4 4" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4h-4" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeoff: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5c1.6 0 3 .4 4.2 1M21.5 12S18 18.5 12 18.5c-1.6 0-3-.4-4.2-1" />
      <path d="M4 20 20 4" />
    </>
  ),
  trophy: (
    <>
      <path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z" />
      <path d="M7.5 6H4.5a3 3 0 0 0 3 3.5M16.5 6h3a3 3 0 0 1-3 3.5M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  backspace: (
    <>
      <path d="M8.5 5.5H20v13H8.5L3 12z" strokeLinejoin="round" />
      <path d="M11.5 9.5l5 5M16.5 9.5l-5 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
      <path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.5 14.6c1.8.6 3 2.2 3.5 4.9" />
    </>
  ),
  bolt: <path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z" strokeLinejoin="round" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  hand: (
    <>
      <path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M11 10.5V5a1.5 1.5 0 0 1 3 0v5.5" />
      <path d="M14 10.5V6.5a1.5 1.5 0 0 1 3 0v6.5" />
      <path d="M8 12.5V11a1.5 1.5 0 0 0-3 0v3.5c0 3.6 2.9 6.5 6.5 6.5h.5c2.8 0 5-2.2 5-5v-3" />
    </>
  ),
  stand: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" />
      <path d="M8.5 12h7" />
    </>
  ),
  split: (
    <>
      <path d="M12 4v16" />
      <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" />
    </>
  ),
  surrender: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4.5c4-2 6 2 12 0v8c-6 2-8-2-12 0" strokeLinejoin="round" />
    </>
  ),
  shield: (
    <path
      d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"
      strokeLinejoin="round"
    />
  ),
  sparkle: (
    <path
      d="M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9z"
      strokeLinejoin="round"
    />
  ),
  crown: (
    <>
      <path d="M3.5 8l4 4 4.5-7 4.5 7 4-4-1.8 10H5.3z" strokeLinejoin="round" />
    </>
  ),
  shoe: (
    <>
      <path d="M3 17.5 8.5 7h11l1.5 10.5z" strokeLinejoin="round" />
      <path d="M8.5 7 10 4.5h8L19.5 7" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  share: (
    <>
      <path d="M12 3.5v11M7.5 8 12 3.5 16.5 8" />
      <path d="M8 11.5H6.5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H16" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
      <path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
    </>
  ),
  trash: (
    <>
      <path
        d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"
        strokeLinejoin="round"
      />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5 21 8l-9 4.5L3 8z" strokeLinejoin="round" />
      <path d="M3 12l9 4.5 9-4.5M3 16l9 4.5 9-4.5" strokeLinejoin="round" />
    </>
  ),
};
function Icon({
  name: a,
  size: e = 24,
  stroke: t = 2,
  className: s,
  style: n,
  title: l,
}) {
  let i = ICON_PATHS[a];
  return (
    <svg
      className={s}
      style={n}
      width={e}
      height={e}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={t}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={l ? undefined : "true"}
      role={l ? "img" : undefined}
    >
      {l ? <title>{l}</title> : null}
      {i}
    </svg>
  );
}
const SUIT_PATHS = {
  s: "M12 2.2c-2.6 3.9-8.3 7-8.3 11.4 0 2.6 2 4.5 4.4 4.5 1.5 0 2.7-.7 3.4-1.7-.3 2-1.2 3.6-2.6 5.1h6.2c-1.4-1.5-2.3-3.1-2.6-5.1.7 1 1.9 1.7 3.4 1.7 2.4 0 4.4-1.9 4.4-4.5 0-4.4-5.7-7.5-8.3-11.4z",
  h: "M12 21.3S2.7 15.5 2.7 9.1C2.7 6 5 3.6 7.9 3.6c1.8 0 3.3.9 4.1 2.3.8-1.4 2.3-2.3 4.1-2.3 2.9 0 5.2 2.4 5.2 5.5 0 6.4-9.3 12.2-9.3 12.2z",
  d: "M12 1.8c2.6 3.7 5.3 6.9 8.3 10.2-3 3.3-5.7 6.5-8.3 10.2-2.6-3.7-5.3-6.9-8.3-10.2 3-3.3 5.7-6.5 8.3-10.2z",
  c: "M12 2.4a4.4 4.4 0 0 0-4.1 6A4.4 4.4 0 1 0 10.9 15c-.3 2.4-1.3 4.4-2.9 6.6h8c-1.6-2.2-2.6-4.2-2.9-6.6a4.4 4.4 0 1 0 3-6.6 4.4 4.4 0 0 0-4.1-6z",
};
function SuitIcon({ s: a, size: e = 24, className: t, style: s }) {
  return (
    <svg
      className={t}
      style={s}
      width={e}
      height={e}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={SUIT_PATHS[a]} fill="currentColor" />
    </svg>
  );
}
export { Icon, SuitIcon };
