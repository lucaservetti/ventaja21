# Publicar Edge 21 en Google Play

Guía paso a paso. Lo técnico ya está hecho en el repositorio: el proyecto Android (`android/`), los anuncios, la compra de Premium y la compilación en GitHub Actions. Lo que queda son cuentas y formularios que solo podés completar vos.

**Costo:** US$25, una sola vez, por la cuenta de desarrollador de Google Play. Todo lo demás es gratis.

---

## Paso 1 · Cuenta de desarrollador de Google Play

1. Entrá a <https://play.google.com/console/signup> con tu cuenta de Google.
2. Elegí **cuenta personal**, pagá los US$25 y verificá tu identidad (te van a pedir documento y teléfono). La verificación puede tardar unos días.
3. **Importante para cuentas personales nuevas:** antes de publicar para todo el mundo, Google exige una **prueba cerrada con al menos 12 personas durante 14 días seguidos** (paso 7). Conviene ir juntando esos 12 mails desde ya: amigos y familia sirven. Revisá en Play Console los números vigentes, porque Google los cambia cada tanto.

## Paso 2 · Clave de firma (una sola vez)

Play necesita que el archivo de la app (.aab) venga firmado con tu clave de subida.

**Opción A (la más fácil):** pedime que la genere. Te mando el archivo `.jks` y las contraseñas, vos los guardás en un lugar seguro (por ejemplo, Google Drive) y cargás los cuatro secretos del punto siguiente.

**Opción B (en tu computadora, con Java instalado):**
```
keytool -genkeypair -v -keystore upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
base64 -w0 upload.jks > upload.txt      # en Mac: base64 -i upload.jks -o upload.txt
```

Después, en GitHub: **Settings → Secrets and variables → Actions → New repository secret**, cargá:

| Secreto | Qué va |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | El contenido de `upload.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | La contraseña del archivo |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | La contraseña de la clave (con keytool suele ser la misma) |

> Play firma la versión final con su propia clave (**Firma de apps de Play**, viene activada). Si algún día perdés la clave de subida, se puede pedir un cambio desde Play Console.

## Paso 3 · AdMob (los anuncios)

1. Entrá a <https://admob.google.com> con la misma cuenta de Google y creá la cuenta. Cargá el perfil de pagos y los datos de impuestos: es donde te pagan.
2. **Apps → Agregar app → Android → "¿Está publicada?": No.** Nombre: Edge 21.
3. Dentro de la app, **Bloques de anuncios → Agregar → Intersticial**. Nombre: "Entre actividades".
4. Copiá los dos IDs:
   - el **ID de la app**, con este formato: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`;
   - el **ID del bloque intersticial**, con este formato: `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`.
5. En GitHub: **Settings → Secrets and variables → Actions → pestaña Variables → New repository variable**:
   - `ADMOB_APP_ID` = el ID de la app;
   - `ADMOB_INTERSTITIAL_ID` = el ID del bloque.
6. En AdMob: **Privacidad y mensajes → GDPR → Crear mensaje**, y publicalo. Así a los usuarios de Europa les aparece el formulario de consentimiento que la app ya sabe mostrar.
7. Cuando la app esté publicada, volvé a AdMob y **vinculala con Google Play** (Configuración de la app → Tiendas de aplicaciones).

> Mientras no cargues esas variables, la app muestra **anuncios de prueba de Google** (dicen "Test Ad"). No generan plata, pero sirven para probar. **No publiques en producción sin cargar las variables.**

**Cómo funcionan los anuncios en la app:** un anuncio de pantalla completa de vez en cuando, solo al volver a una pestaña después de terminar algo (una lección, una tanda o un ejercicio). Nunca en los primeros 3 minutos, nunca más de uno cada 4 minutos y nunca en medio de una práctica. Quien compra Premium no ve ninguno.

## Paso 4 · Armar el archivo de la app (.aab)

1. En GitHub, pestaña **Actions → Android → Run workflow → Run workflow**.
2. Esperá unos 5 minutos hasta que se ponga en verde.
3. Entrá a esa ejecución y, abajo de todo, en **Artifacts**, bajá `ventaja21-N`. Es un .zip que adentro tiene el `.aab`.

Cada vez que corre se usa un número de versión nuevo (el número de ejecución), así Play no lo rechaza por repetido.

## Paso 5 · Crear la app en Play Console

**Crear app**:
- Nombre: *Edge 21: blackjack y conteo*.
- Idioma: Español (Latinoamérica).
- Tipo: Juego (o App, si preferís la categoría Educación).
- Gratis.
- Aceptá las declaraciones.

Después completá el panel **"Configura tu app"**. Lo que va en cada formulario:

| Formulario | Qué responder |
| --- | --- |
| Política de privacidad | `https://lucaservetti.github.io/ventaja21/privacidad.html`. Antes, cambiá `CORREO_DE_CONTACTO` en `privacidad.html` por tu mail (o pedímelo). |
| Acceso a la app | Toda la funcionalidad está disponible sin acceso especial (no hay inicio de sesión). |
| Anuncios | **Sí, contiene anuncios.** |
| Clasificación del contenido | Completá el cuestionario. Respondé **Sí a "juegos de azar simulados"** y **No a apuestas con dinero real**. Va a salir una clasificación para adolescentes o mayores. |
| Público objetivo | **18 años o más.** Evita las reglas para apps de chicos, que no aplican acá. |
| Seguridad de los datos | Recopila: **Identificadores del dispositivo u otros** (ID de publicidad), **Actividad en la app** (interacción con anuncios) y **Diagnóstico**. Todos los recopila y comparte el SDK de AdMob, para **publicidad y análisis**. Los datos están encriptados en tránsito: **Sí**. Recopilación opcional: **No**. Pedido de eliminación: no aplica, porque no hay cuentas y el progreso queda en el teléfono. |
| Apps gubernamentales, financieras y de salud | No. |

**Ficha de Play Store**: copiá los textos de `store/ficha.md` y subí:
- el ícono: `store/icono-512.png`;
- el gráfico destacado: `store/grafico-destacado.png`;
- las capturas de teléfono: `store/capturas/01.png` a `07.png`.

La app también está en inglés (sale en inglés en los celulares que no están en español). Para que la ficha también aparezca en inglés: **Ficha de Play Store → Administrar traducciones → Agregar traducciones → Inglés (Estados Unidos)** y pegá los textos de `store/ficha-en.md`, y subí `store/grafico-destacado-en.png` y las capturas de `store/capturas-en/`.

## Paso 6 · Prueba interna y el producto Premium

1. **Pruebas → Prueba interna → Crear versión** y subí el `.aab` del paso 4. Agregá tu mail como tester y abrí el enlace para instalarla en un Android.
2. Con esa primera versión subida, ya se puede crear el producto (Google lo pide así). Andá a **Monetizar → Productos → Productos integrados en la aplicación → Crear producto**:
   - **ID del producto: `premium`.** Tiene que ser exactamente ese, porque la app lo busca con ese nombre.
   - Nombre: *Edge 21 Premium*. Descripción: *Sin anuncios y con todo lo avanzado, para siempre.*
   - Precio: por ejemplo US$4,99. Play lo convierte solo a pesos y a las demás monedas, y vos podés ajustarlo por país.
   - **Activar.**
3. Para cobrar, Play te va a pedir completar el **perfil de pagos** (cuenta bancaria). Hacelo.
4. Para probar la compra sin pagar: **Configuración → Pruebas de licencias** y agregá tu mail. Las compras de prueba no cobran.

## Paso 7 · Prueba cerrada (12 personas, 14 días)

1. **Pruebas → Prueba cerrada → Crear pista**, subí el mismo `.aab` y agregá a los 12 testers (por mail o con un Grupo de Google).
2. Mandales el enlace de participación. Tienen que **instalarla y quedarse en la prueba los 14 días**, y conviene que la abran de vez en cuando.
3. Pasados los 14 días, Play Console habilita **"Solicitar acceso a producción"**. Respondé el cuestionario sobre cómo fue la prueba.

## Paso 8 · Producción

1. **Producción → Crear versión**, subí el `.aab` más nuevo y elegí países (o todos).
2. Enviá a revisión. Puede tardar de unas horas a varios días.
3. Cuando salga, completá el punto 7 del paso 3 (vincular AdMob con Play).

## Actualizar la app más adelante

1. Hacé los cambios (o pedímelos). Se sube la versión en `package.json`.
2. **Actions → Android → Run workflow** y bajá el `.aab` nuevo.
3. Play Console → la pista que corresponda → **Crear versión** → subilo.

## Recomendado (no obligatorio)

- **Página web:** ya está en `https://lucaservetti.github.io/ventaja21/sitio/` (carpeta `sitio/`). Ponela como "sitio web" en la ficha de Play. Cuando la app esté publicada, cambiá `PUBLISHED = false` a `true` en `sitio/index.html` y el botón pasa a llevar a Google Play.
- **app-ads.txt:** AdMob lo recomienda para cobrar el máximo por los anuncios. Tiene que estar en la raíz del dominio del sitio, o sea `https://lucaservetti.github.io/app-ads.txt`, y para eso hace falta un repositorio llamado `lucaservetti.github.io` con ese archivo (y un `index.html` que redirija a `/ventaja21/sitio/`). AdMob te da el texto exacto en *Apps → app-ads.txt*. Pedímelo y lo armo.
- **La versión web** (GitHub Pages) sigue gratis y sin anuncios. Si querés que la gente use la de Play, podés poner ahí un aviso con el enlace a la tienda.
- **iPhone (App Store):** el mismo proyecto de Capacitor se puede llevar a iOS más adelante. Hace falta una Mac (o un servicio de compilación en la nube) y la cuenta de Apple, que cuesta US$99 por año.

## Qué hay en el código

| Archivo | Qué hace |
| --- | --- |
| `capacitor.config.json` | Nombre, paquete (`com.lucaservetti.ventaja21`) y barras del sistema |
| `android/` | Proyecto Android generado por Capacitor (íconos, pantalla de inicio, firma y AdMob en `app/build.gradle`) |
| `src/platform.js` | Anuncios (consentimiento + intersticial de vez en cuando) y compra de Premium |
| `src/screens/Premium.jsx` | Pantalla de Premium (comprar, restaurar, privacidad de los anuncios) |
| `.github/workflows/android.yml` | Arma el `.aab` en GitHub Actions |
| `privacidad.html` | Política de privacidad (se publica en GitHub Pages) |
| `store/` | Textos de la ficha, ícono, gráfico destacado y capturas |

Para ver en la computadora cómo se ve la app en "modo Android" (con lo de Premium bloqueado), abrí la consola del navegador en la web y escribí `localStorage.setItem("v21.sim", "1")`, y recargá. Para volver: `localStorage.removeItem("v21.sim")`.
