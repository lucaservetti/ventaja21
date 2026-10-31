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
3. Dentro de la app, creá dos **bloques de anuncios**:
   - **Intersticial**, con el nombre "Entre actividades";
   - **Bonificado** (*rewarded*), con el nombre "Segunda oportunidad". Premio: 1, "intento".
4. Copiá los tres IDs:
   - el **ID de la app**, con este formato: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`;
   - el **ID del bloque intersticial** y el **del bonificado**, con este formato: `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`.
5. En GitHub: **Settings → Secrets and variables → Actions → pestaña Variables → New repository variable**:
   - `ADMOB_APP_ID` = el ID de la app;
   - `ADMOB_INTERSTITIAL_ID` = el ID del bloque intersticial;
   - `ADMOB_REWARDED_ID` = el ID del bloque bonificado.
6. En AdMob: **Privacidad y mensajes → GDPR → Crear mensaje**, y publicalo. Así a los usuarios de Europa les aparece el formulario de consentimiento que la app ya sabe mostrar.
7. Cuando la app esté publicada, volvé a AdMob y **vinculala con Google Play** (Configuración de la app → Tiendas de aplicaciones).

> Mientras no cargues esas variables, la app muestra **anuncios de prueba de Google** (dicen "Test Ad"). No generan plata, pero sirven para probar. **No publiques en producción sin cargar las variables.**

**Cómo funcionan los anuncios en la app:** el detalle está en `store/monetizacion.md`. En resumen:

- un anuncio de pantalla completa solo al volver al menú después de terminar 2 cosas;
- como mucho uno cada 5 minutos y 6 por día;
- ninguno el primer día ni en medio de una práctica;
- el anuncio con premio es siempre opcional: segunda oportunidad del desafío diario;
- con Premium o durante la prueba gratis, ninguno.

## Paso 4 · Armar el archivo de la app (.aab)

1. En GitHub, pestaña **Actions → Android → Run workflow → Run workflow**.
2. Esperá unos 5 minutos hasta que se ponga en verde.
3. Entrá a esa ejecución y, abajo de todo, en **Artifacts**, bajá `ventaja21-N`. Es un .zip que adentro tiene el `.aab`.

Cada vez que corre se usa un número de versión nuevo (el número de ejecución), así Play no lo rechaza por repetido.

## Antes de los 18: probar la app en tu celular (APK)

Cada vez que corre **Actions → Android**, además del `.aab` sale `edge21-apk-N`: una APK para instalar a mano.

1. Bajá `edge21-apk-N` desde **Artifacts** en el celular (o pasala de la compu) y descomprimila.
2. Abrí el `.apk`. Android pregunta si dejás instalar apps de esa fuente: **Permitir** (solo para esa app, por ejemplo Archivos o Chrome).
3. Probala como cualquier persona: lecciones, la mesa, el botón "atrás", girar la pantalla, la letra grande del celular, sin internet.

Lo que todavía no anda en la APK, y es normal: los pagos (hace falta Play), la cuenta de Google (hace falta registrar la app en Firebase) y los anuncios de verdad (salen los de prueba de Google).

Cuando la instales desde Play más adelante, primero **desinstalá la APK**: Play firma la app con otra clave y no deja instalar encima.

## Paso 5 · Crear la app en Play Console

**Crear app**:
- Nombre: *Edge 21: blackjack y conteo*.
- Idioma: Español (Latinoamérica).
- Tipo: **App**, categoría **Educación** (recomendado: ahí la encuentra quien busca aprender; en Juegos → Cartas compite con cientos de casinos de fichas).
- Gratis.
- Aceptá las declaraciones.

Después completá el panel **"Configura tu app"**. Lo que va en cada formulario:

| Formulario | Qué responder |
| --- | --- |
| Política de privacidad | `https://edge21.app/privacidad.html` (el contacto es `soporte@edge21.app`). Los términos de uso están en `https://edge21.app/terminos.html`. |
| Acceso a la app | Toda la funcionalidad está disponible sin acceso especial. El inicio de sesión con Google es opcional (solo para guardar en la nube, el ranking y los premios). |
| Anuncios | **Sí, contiene anuncios.** |
| Clasificación del contenido | Completá el cuestionario. Respondé **Sí a "juegos de azar simulados"** y **No a apuestas con dinero real**. Va a salir una clasificación para adolescentes o mayores. |
| Público objetivo | **18 años o más.** Evita las reglas para apps de chicos, que no aplican acá. |
| Seguridad de los datos | Recopila: **Identificadores del dispositivo u otros** (ID de publicidad), **Actividad en la app** (interacción con anuncios) y **Diagnóstico**. Todos los recopila y comparte el SDK de AdMob, para **publicidad y análisis**. Los datos están encriptados en tránsito: **Sí**. Recopilación opcional: **No**. Pedido de eliminación: no aplica para lo de AdMob. **Si activaste la cuenta de Google** (ver `CUENTA_GOOGLE.md`), sumá: **Información personal → Nombre, Dirección de correo electrónico e ID de usuario**, para *funcionalidad de la app* y *administración de la cuenta*, recopilados por vos (no compartidos), **opcionales**; **Actividad en la app → Otro contenido generado por el usuario** (el progreso y el apodo del ranking), para *funcionalidad de la app*; y **Diagnóstico → Registros de fallas**, para *análisis*. En **Eliminación de datos**: los usuarios pueden pedirla desde la app (*Ajustes → Tu cuenta → Borrar mi cuenta*) y por mail, y el enlace web es `https://edge21.app/borrar-cuenta.html`. Si están los premios, sumá en **Actividad en la app → Otras acciones** (premios ganados), para *funcionalidad de la app*. |
| Apps gubernamentales, financieras y de salud | No. |

**Ficha de Play Store**: copiá los textos de `store/ficha.md` y subí:
- el ícono: `store/icono-512.png`;
- el gráfico destacado: `store/grafico-destacado.png`;
- las capturas de teléfono: `store/capturas/01.png` a `08.png`, en ese orden.

**Video (opcional, pero suma descargas):** Play pide un enlace de YouTube. Subí `store/video/edge21-video-es.mp4` a tu canal de YouTube (puede ser "No listado"), copiá el enlace y pegalo en **Ficha de Play Store → Video de YouTube**. Para la ficha en inglés usá `store/video/edge21-video-en.mp4`. Los mismos videos sirven para Instagram o TikTok.

La app también está en inglés (sale en inglés en los celulares que no están en español). Para que la ficha también aparezca en inglés: **Ficha de Play Store → Administrar traducciones → Agregar traducciones → Inglés (Estados Unidos)** y pegá los textos de `store/ficha-en.md`, y subí `store/grafico-destacado-en.png` y las capturas de `store/capturas-en/`.

## Paso 6 · Prueba interna y el producto Premium

1. **Pruebas → Prueba interna → Crear versión** y subí el `.aab` del paso 4. Agregá tu mail como tester y abrí el enlace para instalarla en un Android.
2. Con esa primera versión subida, ya se pueden crear los productos (Google lo pide así). Los nombres tienen que ser **exactamente** estos, porque la app los busca así:
   - **Suscripción.** Andá a **Monetizar → Productos → Suscripciones → Crear suscripción**.
     - ID del producto: **`edge21_premium`**. Nombre: *Edge 21 Premium*.
     - Adentro, creá dos **planes básicos**, los dos *de renovación automática*:
       - ID **`mensual`**, período mensual, US$2,99;
       - ID **`anual`**, período anual, US$19,99.
     - En el plan `anual`, **Agregar oferta**:
       - ID **`prueba-5-dias`**;
       - elegibilidad: *adquisición de clientes nuevos*, **"nunca tuvo ninguna suscripción en esta app"**. Así Google da la prueba **una sola vez por cuenta de Google**: si alguien ya la usó o ya pagó, no se la vuelve a ofrecer, y la app tampoco muestra "5 días gratis" (lo lee de Google Play);
       - una fase: **prueba gratuita de 5 días**.
     - **Activá** los dos planes y la oferta.
   - **Pago único.** Andá a **Monetizar → Productos → Productos integrados en la aplicación → Crear producto**.
     - ID del producto: **`premium`**.
     - Nombre: *Edge 21 Premium para siempre*. Descripción: *Sin anuncios y con todo lo avanzado, para siempre.*
     - Precio: US$49,99.
     - **Activar.**
   - Play convierte los precios solo a pesos y a las demás monedas, y los podés ajustar por país. Ver la sección de precios en `store/monetizacion.md`.
3. Para cobrar, Play te va a pedir completar el **perfil de pagos** (cuenta bancaria). Hacelo.
4. Para probar la compra sin pagar: **Configuración → Pruebas de licencias** y agregá tu mail. Las compras de prueba no cobran, y en las suscripciones de prueba un mes dura 5 minutos y un año 30 minutos, así ves la renovación enseguida.
5. Anotate en el programa de **comisión del 15 %**. En Play Console aparece como el nivel de tarifa de servicio del 15 %; si no lo encontrás, buscalo en la ayuda. Así Google se queda con el 15 % de los pagos únicos en vez del 30 %, hasta el primer millón de dólares por año. Las suscripciones ya pagan 15 % desde el primer día.

## Paso 7 · Prueba cerrada (12 personas, 14 días)

En `store/testers.md` están los mensajes listos para mandar (en español y en inglés), cómo armar el grupo de Google y una tabla para llevar la cuenta.

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

- **Precios y anuncios:** el plan completo, con números y el calendario hasta el lanzamiento, está en `store/monetizacion.md`.
- **TikTok e Instagram:** cómo crear las cuentas, la bio, la foto y qué publicar están en `store/redes/README.md`.

- **Página web:** está en `https://edge21.app` (el archivo `index.html` de la raíz), y la app web en `https://edge21.app/app/`. Ponela como "sitio web" en la ficha de Play. Cuando la app esté publicada, cambiá `PUBLISHED = false` a `true` en `index.html` y el botón pasa a llevar a Google Play.
- **app-ads.txt:** AdMob lo recomienda para cobrar el máximo por los anuncios. Va en la raíz del dominio: `https://edge21.app/app-ads.txt` (un archivo `app-ads.txt` en la raíz del repositorio). AdMob te da el texto exacto en *Apps → app-ads.txt*. En AdMob y en Play, el sitio web del desarrollador tiene que ser `https://edge21.app`. Pedímelo y lo armo.
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
