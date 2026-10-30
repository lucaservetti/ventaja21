# Cuenta de Google, ranking y reporte de errores (Firebase)

La app ya tiene todo programado y probado. Lo único que falta es crear un proyecto gratis de Firebase y pasarme 3 datos.

Mientras `firebase.config.json` esté vacío, la cuenta, el ranking y el reporte de errores quedan apagados y la app funciona igual que siempre.

**Lo que hace:**

- **Cuenta opcional con Google:**
  - guarda el progreso en la nube;
  - si borrás la app o cambiás de celular, entrás y vuelve;
  - si hay progreso distinto en el celular y en la cuenta, pregunta con cuál quedarse.
- **Ranking del desafío diario:** los mejores de hoy y de la semana, con el nombre o apodo que elija cada uno. Lo puede ver cualquiera; para aparecer hay que entrar.
- **Reporte de errores:** si la app falla en el celular de alguien, el error llega a Firestore, en la colección `errores`, con la versión, el idioma y si fue en Android o en la web.
- **Borrar la cuenta:** desde la app (*Ajustes → Tu cuenta*). Google Play lo exige a toda app que permite crear cuentas.

**Cuánto cuesta:** nada. El plan gratis de Firebase (Spark) alcanza para miles de usuarios por día.

## Paso 1 · Crear el proyecto (5 min)

1. Entrá a <https://console.firebase.google.com> con tu cuenta de Google → **Crear un proyecto** → nombre `edge21`. Google Analytics: no hace falta.
2. **Compilación → Authentication → Comenzar → Google → Habilitar.** Elegí tu mail como correo de asistencia y guardá.
   - Abrí otra vez **Google** y desplegá **Configuración del SDK web**: ahí está el **ID de cliente web**. Termina en `.apps.googleusercontent.com`. **Ese es el dato 3.**
3. **Compilación → Firestore Database → Crear base de datos**:
   - ubicación `southamerica-east1` (São Paulo, la más cerca de Uruguay);
   - **modo de producción**.
4. En Firestore → pestaña **Reglas**: borrá lo que hay, pegá el contenido de `firestore.rules` (está en la carpeta del proyecto) y tocá **Publicar**.
5. **⚙ → Configuración del proyecto → General → Tus apps → ícono web `</>`.**
   - Nombre: `Edge 21 web`. No marques Hosting.
   - Copiá `apiKey` (**dato 1**) y `projectId` (**dato 2**).
   - Esa clave no es secreta: Firebase está hecho para que vaya dentro de la app. Lo que protege los datos son las reglas del paso 4.

## Paso 2 · Que funcione en la web

1. Andá a <https://console.cloud.google.com> (mismo proyecto, arriba a la izquierda) → **APIs y servicios → Credenciales**.
2. Abrí el **cliente web** creado por Firebase (*Web client (auto created by Google Service)*).
3. En **Orígenes autorizados de JavaScript** agregá:
   - `https://edge21.app`
   - `http://localhost`
4. Guardá.

## Paso 3 · Que funcione en Android

Google necesita la "huella" (SHA-1) de las claves con las que se firma la app. Son dos:

- la tuya, la de subida, que está en `clave-android/`;
- la que usa Google Play para firmar.

1. En Firebase: **⚙ → Configuración del proyecto → General → Agregar app → Android**.
   - Paquete: `com.lucaservetti.ventaja21`.
   - SHA-1 de tu clave de subida: `3A:E9:06:D4:9D:C2:A0:43:9D:30:DD:14:B9:A0:8B:A7:96:04:7D:D2`.
   - No hace falta bajar `google-services.json`.
2. Cuando tengas Play Console: **Prueba y lanzamiento → Configuración → Integridad de la app → Firma de apps** → copiá el **SHA-1 del certificado de firma de apps**. Agregalo en la misma app Android de Firebase (**Agregar huella digital**).
3. **Pantalla de consentimiento** (Google Cloud → APIs y servicios → Pantalla de consentimiento de OAuth):
   - nombre `Edge 21`;
   - tu mail;
   - política de privacidad `https://edge21.app/privacidad.html`.

   Con eso alcanza: para pedir solo nombre y mail no hace falta que Google revise la app.

## Paso 4 · Que los datos viejos se borren solos

En Google Cloud → **Firestore → Time-to-live (TTL) → Crear política**. Creá dos:

- grupo de colecciones `scores`, campo `expireAt`: los puntajes del ranking se borran a los 60 días;
- grupo de colecciones `errores`, campo `expireAt`: los errores se borran a los 90 días.

## Paso 5 · Pasame los 3 datos

Mandame el **apiKey**, el **projectId** y el **ID de cliente web**. Los pongo en `firebase.config.json`, armo la app y la publico. También se pueden cargar como variables en GitHub (`FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID` y `GOOGLE_WEB_CLIENT_ID`).

## Ver los errores que llegan

Firebase → **Firestore Database → Datos → errores**. Cada documento tiene:

- `msg`: el error;
- `stack`: dónde pasó en el código;
- `version`, `plataforma` e `idioma`;
- `t`: la fecha, en milisegundos.

Pasámelos y los arreglo.

Los cierres de la app nativa de Android (no los de la pantalla) aparecen solos en Play Console → **Calidad → Android vitals**.

## Cómo se prueba sin el proyecto real

`tests/e2e/nube.mjs` prueba todo contra los emuladores oficiales de Firebase, con las mismas reglas:

- entrar;
- guardar y recuperar en otro celular;
- elegir entre dos progresos;
- el ranking;
- los errores;
- borrar la cuenta.

En GitHub corre solo en cada cambio.
