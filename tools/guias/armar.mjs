// Arma las guías de la web (páginas aparte de la portada), en español y en inglés:
//   /guias/  ·  /guias/estrategia-basica/  ·  /guias/contar-cartas/
//   /en/guides/  ·  /en/guides/basic-strategy/  ·  /en/guides/card-counting/
// La tabla y el "por qué" de cada casilla salen del motor de la app (tools/guias/datos.mjs).
// También arma sitemap.xml y robots.txt. Uso: node tools/guias/armar.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { COMUN, CONTEO, ESTRATEGIA, INDICE, RUTAS, SITIO } from "./contenido.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const DATOS = JSON.parse(execFileSync(process.execPath, [path.join(ROOT, "tools/guias/datos.mjs")], { maxBuffer: 64e6 }).toString());
const OTRO = { es: "en", en: "es" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const texto = (s) => String(s).replace(/<[^>]+>/g, "");

const PIP = {
  s: "M12 2.2c-2.6 3.9-8.3 7-8.3 11.4 0 2.6 2 4.5 4.4 4.5 1.5 0 2.7-.7 3.4-1.7-.3 2-1.2 3.6-2.6 5.1h6.2c-1.4-1.5-2.3-3.1-2.6-5.1.7 1 1.9 1.7 3.4 1.7 2.4 0 4.4-1.9 4.4-4.5 0-4.4-5.7-7.5-8.3-11.4z",
  h: "M12 21.3S2.7 15.5 2.7 9.1C2.7 6 5 3.6 7.9 3.6c1.8 0 3.3.9 4.1 2.3.8-1.4 2.3-2.3 4.1-2.3 2.9 0 5.2 2.4 5.2 5.5 0 6.4-9.3 12.2-9.3 12.2z",
  d: "M12 1.8c2.6 3.7 5.3 6.9 8.3 10.2-3 3.3-5.7 6.5-8.3 10.2-2.6-3.7-5.3-6.9-8.3-10.2 3-3.3 5.7-6.5 8.3-10.2z",
  c: "M12 2.4a4.4 4.4 0 0 0-4.1 6A4.4 4.4 0 1 0 10.9 15c-.3 2.4-1.3 4.4-2.9 6.6h8c-1.6-2.2-2.6-4.2-2.9-6.6a4.4 4.4 0 1 0 3-6.6 4.4 4.4 0 0 0-4.1-6z",
};
const carta = (r, s) =>
  `<span class="g-card${s === "h" || s === "d" ? " red" : ""}" role="img" aria-label="${r}"><span class="g-rank${r === "10" ? " r10" : ""}">${r}</span><svg class="g-suit" viewBox="0 0 24 24" aria-hidden="true"><path d="${PIP[s]}"/></svg></span>`;

function pagina({ lang, clave, titulo, descripcion, cuerpo, jsonld = [], conScript = false }) {
  const c = COMUN[lang];
  const r = RUTAS[lang];
  const url = SITIO + r[clave];
  const alt = SITIO + RUTAS[OTRO[lang]][clave];
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<meta name="theme-color" content="#06110c">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="${lang}" href="${url}">
<link rel="alternate" hreflang="${OTRO[lang]}" href="${alt}">
<link rel="alternate" hreflang="x-default" href="${SITIO + RUTAS.es[clave]}">
<link rel="icon" href="/app/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/app/apple-touch-icon.png">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:image" content="${SITIO}/img/og.jpg">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Edge 21">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/guias/guias.css">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
</head>
<body>
<header class="bar">
  <div class="wrap">
    <a class="brand" href="${r.inicio}"><img src="/img/ficha.svg" alt="">Edge 21</a>
    <nav aria-label="${lang === "en" ? "Site" : "Sitio"}">
      <a href="${r.guias}"${clave === "guias" ? ' aria-current="page"' : ""}>${c.nav.guias}</a>
    </nav>
    <a class="lang-link" href="${RUTAS[OTRO[lang]][clave]}" hreflang="${OTRO[lang]}" lang="${OTRO[lang]}">${c.otro}</a>
    <a class="btn gold sm" href="/app/">${c.nav.jugar}</a>
  </div>
</header>
<main class="wrap">
${cuerpo}
  <section class="g-cta">
    <img src="/img/ficha.svg" alt="">
    <h2>${c.ctaTitulo}</h2>
    <p>${c.ctaTexto}</p>
    <a class="btn gold" href="/app/">${c.ctaBoton}</a>
  </section>
</main>
<footer class="wrap">
  <span>${c.pie}</span>
  <nav>
    <a href="${r.guias}">${c.nav.guias}</a>
    <a href="/privacidad.html${lang === "en" ? "#en" : ""}">${c.privacidad}</a>
    <a href="/terminos.html${lang === "en" ? "#en" : ""}">${c.terminos}</a>
    <a href="mailto:soporte@edge21.app">soporte@edge21.app</a>
    <a href="https://www.instagram.com/edge21.app/" rel="noopener">Instagram</a>
    <a href="https://www.tiktok.com/@edge21.app" rel="noopener">TikTok</a>
  </nav>
</footer>
<script>try{localStorage.setItem("edge21.lang","${lang}")}catch(e){}</script>
${conScript ? '<script src="/guias/guias.js" defer></script>' : ""}
</body>
</html>
`;
}

const migas = (lang, nombre) => {
  const c = COMUN[lang];
  return `<nav class="g-crumbs" aria-label="${lang === "en" ? "Breadcrumb" : "Ruta"}"><a href="${RUTAS[lang].guias}">${c.migas}</a> <span aria-hidden="true">›</span> <span>${esc(nombre)}</span></nav>`;
};
const faqHtml = (lang, faq) =>
  `<section class="g-sec"><h2>${COMUN[lang].faq}</h2>${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</section>`;
const faqLd = (faq) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: texto(q), acceptedAnswer: { "@type": "Answer", text: texto(a) } })),
});
const articuloLd = (lang, clave, t) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: t.h1,
  description: t.descripcion,
  inLanguage: lang,
  url: SITIO + RUTAS[lang][clave],
  image: `${SITIO}/img/og.jpg`,
  author: { "@type": "Organization", name: "Edge 21" },
  publisher: { "@type": "Organization", name: "Edge 21", logo: { "@type": "ImageObject", url: `${SITIO}/app/icon-512.png` } },
});
const migasLd = (lang, clave, nombre) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: COMUN[lang].migas, item: SITIO + RUTAS[lang].guias },
    { "@type": "ListItem", position: 2, name: nombre, item: SITIO + RUTAS[lang][clave] },
  ],
});

// ---- Estrategia básica ----
function estrategia(lang) {
  const t = ESTRATEGIA[lang];
  const datos = {
    tabla: DATOS[lang],
    filas: Object.fromEntries(
      Object.entries({ hard: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8], soft: [20, 19, 18, 17, 16, 15, 14, 13], pairs: ["A", "T", "9", "8", "7", "6", "5", "4", "3", "2"] }).map(([k, filas]) => [k, filas.map((f) => t.filas[k](f))]),
    ),
    tabs: t.tabs,
    acciones: t.acciones,
    chicas: t.chicas,
    contra: t.contra,
  };
  const secciones = t.secciones
    .map((s) => `<section class="g-sec"><h2>${s.h}</h2>${(s.p || []).map((p) => `<p>${p}</p>`).join("")}${s.lista ? `<ul class="g-list">${s.lista.map((l) => `<li>${l}</li>`).join("")}</ul>` : ""}</section>`)
    .join("\n");
  const cuerpo = `
  ${migas(lang, t.h1)}
  <article>
    <h1>${t.h1}</h1>
    <p class="g-lead">${t.intro}</p>
    <section class="g-chart" id="tabla" aria-label="${esc(t.h1)}">
      <div class="g-rules" role="radiogroup" aria-label="${esc(t.reglas)}">
        <button type="button" role="radio" aria-checked="true" data-v="s17">${t.reglaS17}</button>
        <button type="button" role="radio" aria-checked="false" data-v="h17">${t.reglaH17}</button>
      </div>
      <p class="g-note">${t.reglasNota}</p>
      <div class="g-tabs" role="tablist">
        ${["hard", "soft", "pairs"].map((k, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-tab="${k}">${t.tabs[k]}</button>`).join("")}
      </div>
      <div class="g-grid-wrap">
        <div class="g-axis" aria-hidden="true">${t.crupier} →</div>
        <table class="g-grid"><thead><tr><th scope="col"><span class="sr-only">${t.tuMano}</span></th>${["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"].map((u) => `<th scope="col">${u}</th>`).join("")}</tr></thead><tbody></tbody></table>
      </div>
      <div class="g-detail" id="detalle" aria-live="polite"><p class="g-muted">${t.elegi}</p></div>
      <p class="g-note">${t.leyenda}</p>
    </section>
    ${secciones}
    ${faqHtml(lang, t.faq)}
  </article>
  <script type="application/json" id="g-datos">${JSON.stringify(datos).replace(/</g, "\\u003c")}</script>`;
  return pagina({
    lang,
    clave: "estrategia",
    titulo: t.titulo,
    descripcion: t.descripcion,
    cuerpo,
    conScript: true,
    jsonld: [articuloLd(lang, "estrategia", t), migasLd(lang, "estrategia", t.h1), faqLd(t.faq)],
  });
}

// ---- Contar cartas ----
function conteo(lang) {
  const t = CONTEO[lang];
  const valores = `<div class="g-values">
      <div class="g-val"><div class="g-cards">${carta("2", "h")}${carta("4", "s")}${carta("6", "d")}</div><b class="plus">+1</b><span>2 · 3 · 4 · 5 · 6</span></div>
      <div class="g-val"><div class="g-cards">${carta("7", "c")}${carta("8", "h")}${carta("9", "s")}</div><b class="zero">0</b><span>7 · 8 · 9</span></div>
      <div class="g-val"><div class="g-cards">${carta("10", "d")}${carta("K", "c")}${carta("A", "s")}</div><b class="minus">−1</b><span>10 · J · Q · K · A</span></div>
    </div>`;
  const tabla = (filas) =>
    `<div class="g-table-wrap"><table class="g-table"><thead><tr>${filas[0].map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${filas
      .slice(1)
      .map((f) => `<tr>${f.map((x) => `<td>${x}</td>`).join("")}</tr>`)
      .join("")}</tbody></table></div>`;
  const pr = t.practica;
  const practica = `<div class="g-drill" id="practica" data-t="${esc(JSON.stringify(pr))}">
      <h3>${pr.h}</h3>
      <p class="g-muted">${pr.p}</p>
      <div class="g-drill-table"><div class="g-drill-card" aria-live="polite"></div><div class="g-drill-n"></div></div>
      <div class="g-drill-ask" hidden>
        <label for="g-drill-in">${pr.pregunta}</label>
        <div class="g-drill-row"><input id="g-drill-in" type="text" inputmode="numeric" autocomplete="off" placeholder="+0"><button type="button" class="btn gold sm" data-a="check">${pr.comprobar}</button></div>
      </div>
      <div class="g-drill-res" aria-live="polite"></div>
      <button type="button" class="btn gold" data-a="start">${pr.empezar}</button>
    </div>`;
  const pasos = t.pasos
    .map(
      (s) => `<section class="g-sec g-step"><h2>${s.h}</h2><p>${s.p}</p>${s.valores ? valores : ""}${s.tabla ? tabla(s.tabla) : ""}${s.nota ? `<p class="g-note">${s.nota}</p>` : ""}${s.practica ? practica : ""}</section>`,
    )
    .join("\n");
  const cuerpo = `
  ${migas(lang, t.h1)}
  <article>
    <h1>${t.h1}</h1>
    <p class="g-lead">${t.intro}</p>
    <section class="g-sec"><h2>${t.porque.h}</h2><p>${t.porque.p}</p></section>
    ${pasos}
    <section class="g-sec"><h2>${t.mitos.h}</h2><ul class="g-list">${t.mitos.lista.map((l) => `<li>${l}</li>`).join("")}</ul></section>
    ${faqHtml(lang, t.faq)}
  </article>`;
  return pagina({
    lang,
    clave: "conteo",
    titulo: t.titulo,
    descripcion: t.descripcion,
    cuerpo,
    conScript: true,
    jsonld: [articuloLd(lang, "conteo", t), migasLd(lang, "conteo", t.h1), faqLd(t.faq)],
  });
}

// ---- Índice de guías ----
function indice(lang) {
  const t = INDICE[lang];
  const c = COMUN[lang];
  const tarjeta = (clave, g, icono) => `<a class="g-tile" href="${RUTAS[lang][clave]}">
      <span class="g-tile-ic" aria-hidden="true">${icono}</span>
      <h2>${g.h1}</h2>
      <p>${g.tarjeta}</p>
      <span class="g-tile-meta">${g.minutos} ${c.min} · <b>${c.leer} →</b></span>
    </a>`;
  const icTabla = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>';
  const icCartas = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="11" height="15" rx="2"/><path d="M14 7.5l4.5 1.2a2 2 0 0 1 1.4 2.5l-2.6 9.6"/><path d="M8.5 10v5M6 12.5h5"/></svg>';
  const cuerpo = `
  <section class="g-hero">
    <h1>${t.h1}</h1>
    <p class="g-lead">${t.intro}</p>
  </section>
  <div class="g-tiles">
    ${tarjeta("estrategia", ESTRATEGIA[lang], icTabla)}
    ${tarjeta("conteo", CONTEO[lang], icCartas)}
  </div>`;
  return pagina({
    lang,
    clave: "guias",
    titulo: t.titulo,
    descripcion: t.descripcion,
    cuerpo,
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: t.h1,
        description: t.descripcion,
        inLanguage: lang,
        url: SITIO + RUTAS[lang].guias,
      },
    ],
  });
}

function escribir(ruta, html) {
  const f = path.join(ROOT, ruta, "index.html");
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
  console.log(path.relative(ROOT, f));
}
for (const lang of ["es", "en"]) {
  escribir(RUTAS[lang].guias, indice(lang));
  escribir(RUTAS[lang].estrategia, estrategia(lang));
  escribir(RUTAS[lang].conteo, conteo(lang));
}

// ---- sitemap.xml y robots.txt ----
const hoy = new Date().toISOString().slice(0, 10);
const urls = [
  { es: "/", en: "/" },
  { es: RUTAS.es.guias, en: RUTAS.en.guias },
  { es: RUTAS.es.estrategia, en: RUTAS.en.estrategia },
  { es: RUTAS.es.conteo, en: RUTAS.en.conteo },
];
const entradas = [];
for (const u of urls)
  for (const lang of u.es === u.en ? ["es"] : ["es", "en"])
    entradas.push(`  <url>
    <loc>${SITIO + u[lang]}</loc>
    <lastmod>${hoy}</lastmod>${u.es === u.en ? "" : `
    <xhtml:link rel="alternate" hreflang="es" href="${SITIO + u.es}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITIO + u.en}"/>`}
  </url>`);
for (const p of ["/privacidad.html", "/terminos.html"]) entradas.push(`  <url>\n    <loc>${SITIO + p}</loc>\n  </url>`);
fs.writeFileSync(
  path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entradas.join("\n")}\n</urlset>\n`,
);
fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITIO}/sitemap.xml\n`);
console.log("sitemap.xml · robots.txt");
