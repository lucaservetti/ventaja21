# Pendiente (para la próxima sesión)

1. **Premio por conectarse con Google:** 3 días de Premium, una vez por cuenta, sin contar para el tope mensual.
   - `src/premios.js`: agregar `{ id: "bienvenida", dias: 3, meta: 1 }` primero en `PREMIOS`, y que `diasRecientes` no cuente `bienvenida`.
   - `servidor/index.js`: en `premios()`, `merece.push({ id: "bienvenida", dias: 3 })` siempre (tener cuenta ya la cumple), y en la lista `progreso = 1`.
   - `tests/servidor.mjs`: ajustar los días esperados (racha7 da 2 + 3 la primera vez; el caso del tope da 14 + 3).
   - `src/screens/Premios.jsx`: agregar a `INFO` (ícono `user`, "Bienvenida", "Por entrar con tu cuenta de Google").
   - `src/screens/Account.jsx`: "Entrá y te regalamos 3 días de Premium".
   - Web: pregunta frecuente "¿Puedo tener Premium gratis?".
   - Riesgo aceptado: crear muchas cuentas de Google para sumar 3 días cada una.
2. **Revisión de clavos sueltos de la web:** Premium ya está cerrado en la web: solo vale el que confirma el servidor, y no se puede activar a mano ni con un respaldo. Falta revisar links, textos que todavía hablan de Google Play y cómo se ve en el celular.
3. **Plan para crecer en redes:** `store/redes/CRECER.md`.
4. **Mail:** "Enviar como soporte@edge21.app" desde Gmail (pasos C y D). Google no dejó crear la contraseña de aplicación; probar en unos días desde el celular.
5. **Entrar con Google en la APK de prueba:**
   - El error "You CANNOT use scopes…" ya está arreglado (en la rama, sin publicar todavía).
   - Para que funcione el inicio de sesión hace falta:
     1. Cargar en GitHub los 4 secretos de la clave de firma (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`), así todas las APK salen firmadas con la misma clave. La clave está en `clave-android/`, en el scratchpad de la sesión.
     2. Sacar el SHA-1 de esa clave.
     3. Crear en Google Cloud (proyecto edge21-fb71e) un cliente OAuth **Android**, con el paquete `com.lucaservetti.ventaja21` y ese SHA-1.
   - Cuando la app esté en Play, se agrega también el SHA-1 de la firma de Play (Play Console → Integridad de la app).
