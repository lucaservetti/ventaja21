# Pendiente (para la próxima sesión)

1. **Entrar con Google en la APK de prueba:**
   - El error "You CANNOT use scopes…" ya está arreglado.
   - Para que funcione el inicio de sesión hace falta:
     1. Cargar en GitHub los 4 secretos de la clave de firma (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`), así todas las APK salen firmadas con la misma clave. La clave está en `clave-android/`, en el scratchpad de la sesión.
     2. Sacar el SHA-1 de esa clave.
     3. Crear en Google Cloud (proyecto edge21-fb71e) un cliente OAuth **Android**, con el paquete `com.lucaservetti.ventaja21` y ese SHA-1.
   - Cuando la app esté en Play, se agrega también el SHA-1 de la firma de Play (Play Console → Integridad de la app).
2. **Mail:** "Enviar como soporte@edge21.app" desde Gmail (pasos C y D). Google no dejó crear la contraseña de aplicación; probar en unos días desde el celular, después de agregarle un teléfono de recuperación a edge21app@gmail.com.

## Al lanzar en Google Play

- `servidor/wrangler.toml`: `BIENVENIDA = "1"`. Activa los 3 días de bienvenida, también para quienes ya entraron con Google.
- `src/platform.js`: decidir si la web sigue como prueba o se abre más (`WEB_DEMO_ON`).
- `index.html`: `PUBLISHED = true`.
- `tools/video/fondos.cjs`: `EN_PLAY = true` y rehacer los verticales.
- Mail de soporte: avisarles a los testers.

## Hecho
- Firebase (3 de noviembre): reglas nuevas publicadas y clave "Browser key" limitada a Identity Toolkit, Token Service y Cloud Firestore. Probado: inicio de sesión, ranking y bloqueo del resto de las APIs.
- Revisión de seguridad (3 de noviembre):
  - sin claves secretas en todo el historial;
  - reglas más estrictas, con 21 intentos de ataque probados (`tests/reglas.mjs`);
  - límites de uso en el servidor;
  - errores y reportes que pasan por el servidor;
  - política de seguridad en la web;
  - filtro y reporte de apodos (lo pide Google Play);
  - aviso de versión nueva en Android (`version.json`).

- Premio de bienvenida por entrar con Google: 3 días, en espera hasta el lanzamiento.
- La web como prueba: las secciones 1 y 2 de Aprender, los niveles 1 a 3 de Conteo, una tanda de Entrenar y 20 manos de la mesa por día, sin Premium. La pantalla "Seguí en la app" invita a entrar con Google, a seguir las redes y a ser tester.
- Plan para crecer en redes: `store/redes/CRECER.md`.
