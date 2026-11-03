// Filtro de nombres ofensivos (sin dependencias, para poder probarlo solo: tests/nombres.mjs).
// Raíces de insultos y palabras ofensivas comunes (español e inglés). Se buscan dentro del nombre
// ya normalizado (sin tildes, sin espacios ni símbolos y con 0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, v→u).
const MALAS = [
  "puta",
  "puto",
  "pelotud",
  "boludo",
  "concha",
  "conchud",
  "pija",
  "verga",
  "chupala",
  "chupame",
  "culiad",
  "culo",
  "mierda",
  "forro",
  "trolo",
  "maricon",
  "putaso",
  "garcha",
  "cagon",
  "hdp",
  "hijodeputa",
  "malparid",
  "gonorrea",
  "pendej",
  "cabron",
  "chinga",
  "mamaguev",
  "polla",
  "zorra",
  "negrodemierda",
  "sudaca",
  "nazi",
  "hitler",
  "violad",
  "pedofil",
  "porno",
  "sexo",
  "tetas",
  "pene",
  "vagina",
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "whore",
  "slut",
  "nigg",
  "nigga",
  "fag",
  "retard",
  "rape",
  "porn",
  "sex",
  "kkk",
  "asshole",
];
const LEET = {
  0: "o",
  1: "i",
  3: "e",
  4: "a",
  5: "s",
  7: "t",
  "@": "a",
  $: "s",
  v: "u",
};
function normal(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[013457@$v]/g, (c) => LEET[c])
    .replace(/[^a-zñ]/g, "")
    .replace(/(.)\1+/g, "$1");
}
const MALAS_N = MALAS.map((m) => normal(m));
// "culo" dentro de "calculo" o "sex" dentro de "sexto" no cuentan: esas raíces cortas tienen
// que estar solas o al principio del nombre.
const CORTAS = new Set(
  [
    "culo",
    "pene",
    "sexo",
    "sex",
    "fag",
    "dick",
    "cock",
    "porn",
    "nazi",
    "kkk",
    "hdp",
    "pija",
    "forro",
  ].map(normal),
);
const LIMPIAS = [
  "calculo",
  "ridiculo",
  "vehiculo",
  "articulo",
  "sexto",
  "sexta",
  "essex",
  "middlesex",
  "dickens",
  "hitchcock",
  "peacock",
  "cockpit",
  "forrest",
];

function ofensivo(nombre) {
  const n = normal(nombre);
  if (!n) return false;
  if (LIMPIAS.some((l) => n.includes(l))) return false;
  const palabras = String(nombre)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9ñ@$]+/)
    .map(normal);
  return MALAS_N.some((m) =>
    CORTAS.has(m)
      ? palabras.some((p) => p === m || p.startsWith(m)) || n.startsWith(m)
      : n.includes(m),
  );
}

export { ofensivo };
