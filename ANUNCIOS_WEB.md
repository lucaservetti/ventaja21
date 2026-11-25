# Anuncios en la web (Google AdSense)

La web (edge21.app/app, en el iPhone y la computadora) puede mostrar anuncios de Google con las mismas reglas que la app de Android:

- **Entre actividades:** al volver de la segunda actividad terminada, como mucho uno cada 5 minutos y 4 por día. Nunca en medio de una mano o de una lección, y ninguno en los primeros 3 días.
- **Con premio, opcional:** la "Segunda oportunidad" del desafío diario. Si el anuncio no carga, el premio se da igual. Si lo cierras antes de que termine, no hay premio.
- **Con Premium, ninguno:** ni siquiera se carga el código de Google.

Mientras `anuncios.config.json` no tenga el cliente de AdSense, la web no muestra anuncios ni carga nada de Google.

## 1. Crear la cuenta de AdSense (lo haces tú)

1. Entra a **adsense.google.com** con tu cuenta de Google. Usa la misma con la que vas a cobrar.
2. Sitio: `edge21.app`. País: Uruguay. Acepta las condiciones.
3. Te da tu **ID de editor**, que empieza con `ca-pub-` y sigue con números. No es secreto: va en la web. **Pásamelo.**

Para crear la cuenta no te piden comprobante de domicilio. La dirección se verifica después: cuando juntas US$10, Google te manda una carta con un PIN a tu casa. Para cobrar (desde US$100), pueden pedirte la cédula.

## 2. Activarlo en la app (lo hago yo)

Pongo tu ID en `anuncios.config.json` y publico. Con eso:

- la app carga el código de AdSense (fuera de Premium);
- se crea `edge21.app/ads.txt`, que le dice a Google que esa cuenta puede vender anuncios en el sitio;
- la política de seguridad de la web deja pasar a Google.

## 3. Verificar el sitio y pedir la revisión (lo haces tú, después del paso 2)

1. En AdSense, **Sitios → edge21.app**. Elige verificar con **ads.txt** y toca **Verificar**.
2. Toca **Solicitar revisión**. Google tarda entre unos días y un par de semanas.
3. Pide acceso a los **anuncios para juegos web (H5 Games Ads)**: la app usa esa forma de mostrar anuncios entre actividades y con premio. Busca "H5 Games Ads" en la ayuda de AdSense. Ahí está el formulario para pedirlo, con tu ID de editor y `edge21.app/app`. Sin ese acceso puede que no se muestre ningún anuncio, pero la app funciona igual.

## 4. Ajustes importantes en AdSense

- **Control de bloqueo → Categorías sensibles:** bloquea **Juegos de azar y apuestas**, igual que en AdMob, para que no aparezcan casinos de verdad.
- **Privacidad y mensajes:** crea y publica el mensaje de **RGPD (Europa)** y el de **Regulaciones de estados de EE. UU.** Así Google pide permiso donde la ley lo exige. El botón "Privacidad de los anuncios" de la pantalla de Premium vuelve a abrir ese mensaje.

## Un riesgo

Google es estricto con todo lo que se parece a apuestas. Edge 21 es educativo y sin dinero real (está en la portada, en las guías y en los términos), así que debería pasar. Aun así, pueden rechazar el sitio o mostrar menos anuncios. Si pasa, hay redes de anuncios menos exigentes que se pueden probar.

## Probar

- `"prueba": true` en `anuncios.config.json` muestra anuncios de prueba de Google (útil apenas cargues el ID, antes de que aprueben el sitio).
- Prueba automática con un AdSense de mentira (también corre en GitHub):
  `ADSENSE_CLIENTE=ca-pub-0000000000000000 npm run build && node tests/e2e/anuncios.mjs`. Después, `npm run build` sin la variable.
