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
