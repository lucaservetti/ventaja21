# Videos de Edge 21 a 60 FPS

Estos scripts graban la app **cuadro por cuadro**, con un reloj virtual: el tiempo de la app solo avanza 1/60 de segundo cuando ya se sacó la foto del cuadro anterior. Así cada animación sale perfecta, a 60 FPS exactos, aunque la compu sea lenta. Grabar la pantalla en vivo pierde cuadros.

Hace falta Node, Playwright con Chromium y ffmpeg.

## Rehacer todos los videos

Desde la carpeta del proyecto:

```bash
npm run build                          # la app que se graba es index.html
node tools/video/fondos.cjs es         # fondos, títulos, marco del celular y cuenta regresiva
node tools/video/grabar.cjs es         # graba todas las escenas (o: grabar.cjs es quiz count)
node tools/video/armar.cjs es          # arma los videos (o: armar.cjs es vertical | tienda)
```

Para inglés, lo mismo con `en`. Los cuadros quedan en `tools/video/salida/`, que no se sube al repo. Los videos terminados van a:

- `store/video/redes/edge21-<escena>-<idioma>.mp4`: verticales 1080x1920 para TikTok, Reels y Shorts;
- `store/video/edge21-video-<idioma>.mp4`: el de la tienda, 1920x1080.

## Hacer un video nuevo

1. Agregá una escena en `escenas.cjs`. Una escena es una lista de toques y esperas:
   - `v.wait(ms)` avanza el video;
   - `v.tap(...)` toca algo y muestra el círculo del dedo;
   - `v.tab("Entrenar", "Train")` cambia de pestaña;
   - `v.scroll(px)` baja la pantalla, suave.
2. Si la escena puede salir mal por el azar (por ejemplo, una jugada que no es la correcta), hacé que `run` devuelva `false` en ese caso y poné `probar: true`. El grabador ensaya semillas sin sacar fotos hasta encontrar una que salga bien, y recién ahí graba.
3. Con `estado` podés cambiar el progreso de la persona de prueba, que está en `estado.json` (por ejemplo, en qué pestaña arranca).
4. Agregá el título en `fondos.cjs`, en `T.v`, y la llamada `vertical("tu-escena")` en `armar.cjs`.

## Qué mueve el reloj virtual

`reloj.js` controla todo lo que tiene que ver con el tiempo:

- `setTimeout`, `setInterval`, `requestAnimationFrame`, `requestIdleCallback`;
- `Date` y `performance.now`;
- las animaciones y transiciones de CSS;
- el scroll suave.

El azar (`Math.random` y `crypto`) usa una semilla fija, así cada ensayo sale idéntico a la grabación.
