// Traducción en la compilación: busca los textos de la app (strings, plantillas y texto JSX)
// y los envuelve en __t()/__tf() solo si están en el diccionario. El código fuente queda en español.
import * as acorn from "acorn";
import jsx from "acorn-jsx";

const Parser = acorn.Parser.extend(jsx());
// Atributos JSX que nunca son texto visible.
const SKIP_ATTR = new Set([
  "className",
  "key",
  "id",
  "type",
  "name",
  "href",
  "src",
  "viewBox",
  "d",
  "fill",
  "stroke",
  "role",
  "inputMode",
  "autoComplete",
  "lang",
  "rel",
  "target",
  "htmlFor",
  "transform",
  "points",
  "strokeLinecap",
  "strokeLinejoin",
  "textAnchor",
  "fontFamily",
  "fontWeight",
  "dominantBaseline",
]);
// Llamadas cuyo argumento es una clave, no texto.
const SKIP_CALLS =
  /^(localStorage\.\w+|sessionStorage\.\w+|.*addEventListener|.*removeEventListener|document\.\w+|.*querySelector(All)?|.*classList\.\w+|.*setProperty|.*getPropertyValue|.*setAttribute|.*getAttribute|.*removeAttribute|require|matchMedia|.*matchMedia|console\.\w+|.*\.startsWith|.*\.endsWith|.*\.includes|.*\.indexOf|.*\.split|.*\.replace|.*\.replaceAll|.*\.padStart|.*\.join|Icon|icon|useNav|nav\.\w+|toLocaleString|.*\.toLocaleString|.*\.toLocaleDateString|Intl\.\w+|new Intl\.\w+|.*\.reg\w*|.*\.when|.*\.get|.*\.has|.*\.set)$/;

export function parse(code) {
  return Parser.parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    allowHashBang: true,
  });
}

function calleeName(n) {
  if (!n) return "";
  if (n.type === "Identifier") return n.name;
  if (n.type === "MemberExpression")
    return calleeName(n.object) + "." + (n.computed ? "[]" : n.property.name);
  if (n.type === "ThisExpression") return "this";
  if (n.type === "CallExpression") return calleeName(n.callee) + "()";
  return "?";
}

// Recorre el árbol con el padre de cada nodo.
function walk(node, fn, parent = null, key = null) {
  if (!node || typeof node.type !== "string") return;
  fn(node, parent, key);
  for (const k of Object.keys(node)) {
    if (k === "loc" || k === "start" || k === "end") continue;
    const v = node[k];
    if (Array.isArray(v)) for (const c of v) walk(c, fn, node, k);
    else if (v && typeof v.type === "string") walk(v, fn, node, k);
  }
}

// Texto JSX como lo ve React (mismo algoritmo que Babel).
export function jsxText(raw) {
  const lines = raw.split(/\r\n|\n|\r/);
  let last = 0;
  for (let i = 0; i < lines.length; i++) if (/[^ \t]/.test(lines[i])) last = i;
  let out = "";
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i].replace(/\t/g, " ");
    if (i !== 0) l = l.replace(/^[ ]+/, "");
    if (i !== lines.length - 1) l = l.replace(/[ ]+$/, "");
    if (l) {
      if (i !== last) l += " ";
      out += l;
    }
  }
  return out;
}

const CARD_CODE = /^[2-9TJQKA][shdc]\??$/;
const COMPARE = new Set(["===", "!==", "==", "!=", "in"]);
// Un contexto donde el string es una clave/valor de lógica, no texto visible.
function isKeyContext(parent, key, node) {
  if (!parent) return false;
  if (
    parent.type === "ImportDeclaration" ||
    parent.type === "ExportNamedDeclaration" ||
    parent.type === "ExportAllDeclaration" ||
    parent.type === "ImportExpression"
  )
    return true;
  if (
    (parent.type === "Property" ||
      parent.type === "MethodDefinition" ||
      parent.type === "PropertyDefinition") &&
    key === "key"
  )
    return true;
  if (parent.type === "MemberExpression" && key === "property") return true;
  if (parent.type === "BinaryExpression" && COMPARE.has(parent.operator))
    return true;
  if (parent.type === "SwitchCase" && key === "test") return true;
  if (parent.type === "JSXAttribute")
    return (
      SKIP_ATTR.has(parent.name.name) ||
      /^(on|data-|aria-hidden)/.test(parent.name.name)
    );
  if (parent.type === "CallExpression" && key === "arguments")
    return SKIP_CALLS.test(calleeName(parent.callee));
  if (parent.type === "NewExpression" && key === "arguments")
    return calleeName(parent.callee) !== "Error";
  if (parent.type === "TaggedTemplateExpression") return true;
  // Códigos de carta en una lista de cartas: "As" es el as de picas, no la palabra "As".
  if (
    parent.type === "ArrayExpression" &&
    CARD_CODE.test(node.value) &&
    parent.elements.some(
      (e) => e && e !== node && e.type === "Literal" && CARD_CODE.test(e.value),
    )
  )
    return true;
  return false;
}

// Devuelve los textos candidatos de un archivo: {key, kind, start, end, node, keyCtx}.
export function collect(code) {
  const ast = parse(code);
  const items = [];
  walk(ast, (node, parent, key) => {
    if (node.type === "Literal" && typeof node.value === "string") {
      if (parent && parent.type === "JSXAttribute") {
        items.push({
          key: node.value,
          kind: "attr",
          node,
          keyCtx: isKeyContext(parent, key, node),
        });
      } else
        items.push({
          key: node.value,
          kind: "str",
          node,
          keyCtx: isKeyContext(parent, key, node),
        });
    } else if (
      node.type === "TemplateLiteral" &&
      !(parent && parent.type === "TaggedTemplateExpression")
    ) {
      if (node.expressions.length === 0)
        items.push({
          key: node.quasis[0].value.cooked,
          kind: "str",
          node,
          keyCtx: isKeyContext(parent, key, node),
        });
      else {
        let k = "";
        node.quasis.forEach((q, i) => {
          k += q.value.cooked;
          if (i < node.expressions.length) k += `{${i}}`;
        });
        items.push({
          key: k,
          kind: "tpl",
          node,
          keyCtx: isKeyContext(parent, key, node),
        });
      }
    } else if (node.type === "JSXText") {
      const t = jsxText(node.value);
      if (t.trim())
        items.push({
          key: t.trim(),
          kind: "jsx",
          node,
          text: t,
          keyCtx: false,
        });
    }
  });
  return items;
}

// Aplica las traducciones: envuelve solo lo que está en el diccionario (y no es contexto de clave).
export function transform(code, dict) {
  const items = collect(code).filter(
    (it) => !it.keyCtx && Object.prototype.hasOwnProperty.call(dict, it.key),
  );
  if (!items.length) return null;
  const reps = items.map((it) => ({
    start: it.node.start,
    end: it.node.end,
    it,
  }));
  reps.sort((a, b) => a.start - b.start || b.end - a.end);
  function render(start, end) {
    let out = "";
    let cur = start;
    for (const r of reps) {
      if (r.start < cur || r.end > end || r.start < start) continue;
      out += code.slice(cur, r.start) + build(r);
      cur = r.end;
    }
    return out + code.slice(cur, end);
  }
  function build(r) {
    const { it } = r;
    const k = JSON.stringify(it.key);
    if (it.kind === "str") return `__t(${k})`;
    if (it.kind === "attr") return `{__t(${k})}`;
    if (it.kind === "tpl")
      return `__tf(${k}, [${it.node.expressions.map((e) => render(e.start, e.end)).join(", ")}])`;
    // JSX: conserva los espacios de los costados.
    const lead = it.text.match(/^\s*/)[0];
    const trail = it.text.match(/\s*$/)[0];
    return `{${lead ? JSON.stringify(lead) + " + " : ""}__t(${k})${trail ? " + " + JSON.stringify(trail) : ""}}`;
  }
  return render(0, code.length);
}
