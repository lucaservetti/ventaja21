# Seguridad de Edge 21

## Lo que ya está hecho en el código

- **Premium no se puede escribir desde la app:** lo anotan solo el servidor o un pago verificado. Las reglas de Firestore lo bloquean.
- **Pagos web (Paddle):**
  - cada aviso de pago se verifica con la firma de Paddle, y se rechazan los de más de 5 minutos;
  - un reembolso total o un contracargo desactiva el Premium de ese pago.
- **Compras de Google Play:**
  - el servidor le pregunta a Google por cada compra;
  - con `PLAY_ESTRICTO = "1"` en `servidor/wrangler.toml` también se rechazan las que Google no deja verificar. Activalo cuando funcione el permiso de Play Console (ver `PLAY_STORE.md`, paso 6).
- **Premios (días de Premium):**
  - los da el servidor, nunca la app;
  - una sola vez cada uno;
  - tope de 14 días por mes (sin contar bienvenida ni amigos);
  - los puntajes inventados para la racha o el podio no cuentan.
- **Ranking:** cada uno escribe solo su puntaje, con límites. Un usuario técnico podría inflar su puntaje del día. Como mucho se lleva el podio, que tiene tope, y el podio está en pausa (`PODIO = "0"`). Si el ranking crece, se puede pasar el desafío a que lo mida el servidor.
- **Servidor:** límite de pedidos por cuenta y por conexión, tamaños máximos y sesiones de Google verificadas con la firma de Google.
- **GitHub Actions:**
  - las pruebas y el servidor corren con permisos de solo lectura;
  - las claves (firma de Android, Firebase, Paddle y Cloudflare) están como secretos, nunca en el código;
  - revisé el historial del repositorio y no hay claves filtradas.

## Lo que tenés que activar vos (una sola vez)

Hacelo en este orden. Son unos 20 minutos en total.

1. **Verificación en dos pasos en las dos cuentas de Google** (edge21app@gmail.com y tu Gmail personal): myaccount.google.com → Seguridad → Verificación en 2 pasos. Mejor con la app Google Authenticator o una llave de acceso (passkey) que con SMS. Esas cuentas manejan Play Console, AdMob, Firebase y el correo de soporte: son las más importantes.
2. **GitHub:** Settings → Password and authentication → Two-factor authentication. Guardá los códigos de recuperación en un lugar seguro, fuera de la compu.
3. **Paddle:** My account → activar 2FA. Ahí entra la plata de la web.
4. **Cloudflare:** My Profile → Authentication → activar 2FA. Ahí están el servidor y el dominio edge21.app.
5. **Proteger la rama `main` en GitHub:** Settings → Branches → Add branch ruleset → `main` → marcar "Require a pull request before merging" y "Block force pushes". Así nadie (ni por error) borra o reescribe lo publicado.
6. **Alertas de GitHub:** Settings → Code security → activar "Dependabot alerts" y "Secret scanning". Te avisa por mail si una librería tiene un problema o si alguna clave se sube por error.
7. **La clave de firma de Android** (`upload.jks` y su contraseña): guardala en dos lugares, por ejemplo un pendrive y un gestor de contraseñas. Si la perdés, Google te la puede reemplazar, pero lleva días.

## Señales de alerta

- Un mail de "Google", "Paddle" o "Play Console" pidiendo tu contraseña o un código: **no lo contestes**. Entrá siempre escribiendo la dirección vos mismo.
- Alguien que te escribe por Instagram o TikTok ofreciendo "verificar tu cuenta" o "subir tus seguidores": es estafa.
- Nunca compartas el archivo de la cuenta de servicio de Firebase ni el secreto de Paddle (`pdl_ntfset_…`), ni siquiera conmigo: van solo en los secretos de GitHub.
