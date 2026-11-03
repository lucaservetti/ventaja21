# Cobrar Premium en la web (iPhone y computadora)

En la web, Premium se cobra con **Paddle**. Paddle es el "revendedor" (Merchant of Record):

- cobra con tarjeta, Apple Pay, Google Pay y PayPal, en la moneda de cada país;
- emite las facturas y paga los impuestos de cada país;
- te deposita a vos, en dólares, en tu banco o en Payoneer.

Cobra alrededor de un 5% más 50 centavos por venta. Google Play se queda con un 15%, por eso en la web se puede cobrar un poco menos.

**El código ya está hecho.** Cuando el pago se completa, Paddle le avisa al servidor (`api.edge21.app/pagos/paddle`). El servidor anota Premium en la cuenta de Google de la persona, y así lo tiene en la web, en el iPhone, en la compu y en la app de Android. Mientras `pagos.config.json` no tenga los datos, la web muestra "Muy pronto: pagar desde la web".

> **Hace falta tener 18 años** para abrir la cuenta de Paddle, igual que para AdMob y Play Console. Se hace desde el 19 de noviembre.

## 1. Abrir la cuenta de Paddle

1. Entrá a **paddle.com** y tocá **Sign up**. Elegí que sos una persona (*individual / sole trader*), con tu nombre y tu país, Argentina.
2. Paddle revisa el sitio antes de aprobarte, y suele tardar unos días. Tiene que ver:
   - **qué vendés:** "Edge 21 Premium: suscripción de una app educativa para aprender estrategia de blackjack. **No hay apuestas ni plata real.**" Ponelo así, bien claro, para que no lo confundan con un casino;
   - los precios en la web (la sección Premium de edge21.app);
   - los **términos** (edge21.app/terminos.html) y la **privacidad** (edge21.app/privacidad.html), que ya mencionan a Paddle y la devolución dentro de los 14 días.
3. Cargá tus datos de cobro en **Payouts**, con tu banco o Payoneer.

## 2. Crear el producto y los precios

En **Catalog → Products → New product**, creá "Edge 21 Premium" con 3 precios:

| Plan | Tipo | Precio sugerido | Nota |
|---|---|---|---|
| Mensual | Recurrente, cada 1 mes | US$2,49 | Play: US$2,99 |
| Anual | Recurrente, cada 1 año, **prueba de 5 días** | US$16,99 | Play: US$19,99 |
| Para siempre | Pago único | US$39,99 | Play: US$49,99 |

Cada precio tiene un código que empieza con `pri_…`.

## 3. Las claves

1. **Developer tools → Authentication → Client-side tokens → New token.** Te da un código que empieza con `live_…` (o `test_…` en el sandbox). Es público: va en la web.
2. **Developer tools → Notifications → New destination:**
   - URL: `https://api.edge21.app/pagos/paddle`;
   - eventos: `transaction.completed`, `subscription.created`, `subscription.activated`, `subscription.updated`, `subscription.resumed` y `subscription.canceled`.

   Al guardar te muestra un **secreto** (`pdl_ntfset_…`). Ese es privado: **no lo pegues en el chat ni en el repositorio.**
3. **Checkout → Website approval:** agregá `edge21.app`.

## 4. Pasárselo a la app

1. **El secreto** va en GitHub → repositorio → Settings → Secrets and variables → Actions → **New repository secret**:
   - nombre: `PADDLE_WEBHOOK_SECRET`;
   - valor: el `pdl_ntfset_…`.

   El servidor lo carga solo la próxima vez que se publique.
2. **El token y los precios** me los pasás por el chat: no son secretos.
   - Yo los pongo en `pagos.config.json`: `token`, los 3 `pri_…` y `"entorno": "production"`.
   - En `servidor/wrangler.toml` pongo `PADDLE_PRECIO_SIEMPRE` con el `pri_…` del plan "Para siempre".
3. Se publica, y listo.

## 5. Probar antes de cobrar de verdad (recomendado)

Paddle tiene un **sandbox** (sandbox-vendors.paddle.com) donde se paga con tarjetas de prueba. El primer paso es configurar todo ahí, con `"entorno": "sandbox"`, y hacer una compra de prueba. Si aparece Premium en la cuenta, se cambia a las claves reales.

## Lo que hay que saber

- **En la app de Android no se ofrece la compra por la web.** Google Play no deja ofrecer pagos por fuera de la app ni poner enlaces para eso. Lo que sí está permitido es que quien pagó en la web use su Premium en Android. El código ya lo maneja: en Android solo aparece Google Play.
- **Reembolsos:** desde el panel de Paddle (Transactions → la venta → Refund). Si la persona tenía una suscripción, cancelala también. El Premium se saca a mano: Firebase → Firestore → `premium/{uid}` → borrá el documento.
- **Si alguien borra su cuenta y vuelve a entrar,** Firebase le da una cuenta nueva. Lo pagado queda en el documento viejo: `premium/{uid viejo}`, con `pago.cliente`. Se copia a mano al uid nuevo.
- **Cancelaciones:** Paddle le manda a cada comprador un mail con un enlace para administrar o cancelar la suscripción. Premium dura hasta el final de lo que pagó, más 3 días de margen.
