// Verificación de compras de Google Play en el servidor (sin red: se simula la respuesta de Google).
import { compraDePlay, verificarPlay } from "../servidor/index.js";

let fallas = 0;
function ok(cond, msg) {
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) fallas++;
}
const NOW = Date.parse("2026-11-20T12:00:00Z");
const req = (body) => new Request("https://api.edge21.app/play/verificar", { method: "POST", headers: { Origin: "https://localhost" }, body: JSON.stringify(body) });
// Una clave de prueba de verdad (el servidor firma el pedido de acceso a Google con ella).
const par = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const pkcs8 = Buffer.from(await crypto.subtle.exportKey("pkcs8", par.privateKey)).toString("base64");
const env = { FIREBASE_SA: JSON.stringify({ client_email: "x@y", private_key: `-----BEGIN PRIVATE KEY-----\n${pkcs8}\n-----END PRIVATE KEY-----` }) };
const compra = (productId, token = "tok") => ({
  id: productId,
  type: "paid subscription",
  transaction: { type: "android-playstore", purchaseToken: token, receipt: JSON.stringify({ packageName: "com.lucaservetti.ventaja21", productId, purchaseToken: token }), signature: "s" },
});
const realFetch = globalThis.fetch;
async function con(google, body) {
  // google: { status, data } que devuelve la API de Play, o "caida" si no responde.
  globalThis.fetch = async (u) => {
    if (String(u).includes("oauth2")) return new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }));
    if (google === "caida") throw new Error("sin red");
    return new Response(google.data ? JSON.stringify(google.data) : "{}", { status: google.status });
  };
  try {
    const r = await verificarPlay(req(body), env, NOW);
    return await r.json();
  } finally {
    globalThis.fetch = realFetch;
  }
}

// Estados de suscripción y de pago único.
const sub = (estado, vence) => ({ subscriptionState: estado, lineItems: [{ expiryTime: vence }] });
ok(!compraDePlay("sub", "edge21_premium", sub("SUBSCRIPTION_STATE_ACTIVE", "2026-12-20T00:00:00Z"), NOW).isExpired, "suscripción activa: vale");
ok(!compraDePlay("sub", "edge21_premium", sub("SUBSCRIPTION_STATE_CANCELED", "2026-12-01T00:00:00Z"), NOW).isExpired, "cancelada pero sin vencer: vale hasta que vence");
ok(compraDePlay("sub", "edge21_premium", sub("SUBSCRIPTION_STATE_EXPIRED", "2026-11-01T00:00:00Z"), NOW).isExpired, "vencida: no vale");
ok(compraDePlay("sub", "edge21_premium", sub("SUBSCRIPTION_STATE_ON_HOLD", "2026-11-10T00:00:00Z"), NOW).isExpired, "en espera por falta de pago: no vale");
ok(compraDePlay("sub", "edge21_premium", sub("SUBSCRIPTION_STATE_PENDING", "2026-12-20T00:00:00Z"), NOW) === null, "pendiente: todavía no");
ok(compraDePlay("unico", "premium", { purchaseState: 0, purchaseTimeMillis: "1" }, NOW).isExpired === false, "pago único comprado: vale");
ok(compraDePlay("unico", "premium", { purchaseState: 1 }, NOW) === null, "pago único cancelado: no vale");

// El pedido completo.
let r = await con({ status: 200, data: sub("SUBSCRIPTION_STATE_ACTIVE", "2026-12-20T00:00:00Z") }, compra("edge21_premium"));
ok(r.ok && !r.data.warning && r.data.collection[0].id === "edge21_premium" && !r.data.collection[0].isExpired && r.data.collection[0].expiryDate === Date.parse("2026-12-20T00:00:00Z"), "Google la confirma: Premium hasta que vence");
r = await con({ status: 200, data: sub("SUBSCRIPTION_STATE_EXPIRED", "2026-11-01T00:00:00Z") }, compra("edge21_premium"));
ok(r.ok && r.data.collection[0].isExpired, "Google dice que venció: sin Premium");
r = await con({ status: 404 }, compra("edge21_premium"));
ok(!r.ok && r.code === 6777017, "Google no la conoce: se rechaza");
r = await con({ status: 403 }, compra("premium"));
ok(r.ok && r.data.warning, "sin permiso en Play Console todavía: se acepta (con aviso)");
r = await con("caida", compra("premium"));
ok(r.ok && r.data.warning, "Google no responde: se acepta (con aviso)");
r = await con({ status: 200, data: { purchaseState: 0 } }, compra("otra_cosa"));
ok(!r.ok, "producto que no es de Edge 21: se rechaza");
r = await con({ status: 200, data: { purchaseState: 0 } }, { transaction: { type: "android-playstore" } });
ok(!r.ok, "sin token: se rechaza");
const ajena = compra("premium");
ajena.transaction.receipt = JSON.stringify({ packageName: "com.otra.app", productId: "premium" });
r = await con({ status: 200, data: { purchaseState: 0 } }, ajena);
ok(!r.ok, "compra de otra app: se rechaza");

if (fallas) {
  console.log(`play: ${fallas} fallaron`);
  process.exit(1);
}
console.log("play: todo bien");
