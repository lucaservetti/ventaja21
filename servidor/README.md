# Servidor de Edge 21 (premios)

Un servidor chico en Cloudflare Workers, gratis. Es el único que puede dar días de Premium de regalo, así nadie se los da solo tocando la app.

**Qué hace.** La app le pregunta "¿qué premios gané?" (`POST https://api.edge21.app/premios`, con la sesión de Google). El servidor:

1. comprueba en Firestore qué cumpliste;
2. da los días que correspondan, escribiendo `premium/{uid}`;
3. guarda lo que ya diste en `premios/{uid}`, para no darlo dos veces.

| Premio | Días | Cómo se comprueba |
| --- | --- | --- |
| Racha de 7 días | 2 | 7 días seguidos con puntaje del desafío diario en el ranking. Cada puntaje tiene que haberse guardado ese mismo día |
| Racha de 30 días | 7 | Lo mismo, 30 días |
| Podio semanal | 2 por semana | Entre los 3 primeros de una semana con 10 jugadores o más, y con un puntaje semanal que no pase de la suma de sus puntajes diarios de esa semana (así no sirve inventarlo). Se pueden reclamar las últimas 4 semanas |
| Terminar las lecciones | 3 | Las 36 lecciones terminadas en el progreso guardado en la cuenta |

- **Tope:** como mucho 14 días de regalo cada 30 días por cuenta. Lo que se pasa del tope queda esperando.
- **Premium para siempre:** si alguien ya lo tiene (puesto a mano), no se toca.
- **Las reglas viven en dos archivos:** la lógica, en `servidor/index.js`; los números, en `src/premios.js` (la app los usa para mostrar los premios).

## Publicarlo (una sola vez, 10 minutos)

Hacen falta 3 secretos en GitHub. Después se publica solo cada vez que cambia algo en `servidor/`.

### 1. Clave de Firebase (para que el servidor pueda escribir Premium)

1. Firebase → **⚙ Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**. Se baja un archivo `.json`.
2. Abrilo con el Bloc de notas y copiá **todo** el contenido.
3. GitHub → el repositorio → **Settings → Secrets and variables → Actions → New repository secret**.
   - Nombre: `FIREBASE_SA`
   - Valor: lo que copiaste.
4. **Borrá el archivo `.json`** de la compu. Esa clave es la llave de toda la base de datos: no se la pases a nadie (tampoco a mí) y no la subas a ningún lado.

### 2. Permiso de Cloudflare (para que GitHub publique el servidor)

1. Cloudflare → arriba a la derecha, tu perfil → **My Profile → API Tokens → Create Token**.
2. Elegí la plantilla **Edit Cloudflare Workers**.
   - En *Account Resources*: tu cuenta.
   - En *Zone Resources*: `edge21.app`.
3. **Continue to summary → Create Token** y copiá el token.
4. En GitHub, otro secreto:
   - Nombre: `CLOUDFLARE_API_TOKEN`
   - Valor: el token.
5. Cloudflare → **Workers & Pages**: a la derecha está el **Account ID**. Copialo.
6. Otro secreto en GitHub:
   - Nombre: `CLOUDFLARE_ACCOUNT_ID`
   - Valor: ese número.

### 3. Publicar

GitHub → **Actions → Servidor → Run workflow**. En un minuto queda andando en `https://api.edge21.app` (Cloudflare crea el subdominio solo).

Para probar que anda: <https://api.edge21.app/premios> en el navegador tiene que decir `{"error":"no existe"}`. Es lo esperado: solo responde a la app.

## Cuánto cuesta

Nada. El plan gratis de Workers permite 100.000 pedidos por día. La app pregunta por los premios:

- al abrir la pantalla de Premios;
- una vez por día al terminar el desafío diario;
- al terminar todas las lecciones.

Cada pregunta lee unos 50 documentos de Firestore. El plan gratis de Firestore da 50.000 lecturas por día, o sea, alcanza para unas 1.000 preguntas por día. Si la app crece mucho, se pasa Firebase al plan Blaze (se paga solo lo que se usa, centavos).

## Pruebas

`tests/servidor.mjs` prueba todo contra los emuladores de Firebase:

- que no se puede hacer trampa con puntajes viejos;
- que cada premio se da una vez;
- el tope;
- dos pedidos al mismo tiempo;
- las firmas de las sesiones.

En GitHub corre solo en cada cambio. A mano:

```
npx firebase-tools emulators:exec --project demo-edge21 --only auth,firestore "node tests/servidor.mjs"
```
