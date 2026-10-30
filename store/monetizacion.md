# Cómo gana plata Edge 21 (sin molestar)

La idea: que lo gratis alcance para aprender de verdad, y que Premium sea para quien quiere ir en serio. Los anuncios se ven poco, solo en pausas naturales, nunca en medio de algo.

## Resumen

| | Qué | Cuándo |
| --- | --- | --- |
| **Gratis** | Lecciones, ruta de conteo, Entrenar, ejercicios, desafíos y simulador | Siempre |
| **Anuncio de pantalla completa** | Al volver al menú después de terminar 2 cosas | Como mucho 1 cada 5 min y 6 por día. Ninguno el primer día |
| **Anuncio con premio** (opcional) | Segunda oportunidad del desafío diario. Probar una función Premium 1 hora | Cuando la persona lo elige |
| **Premium mensual** | US$2,99 por mes | Cancelás cuando quieras |
| **Premium anual** | US$19,99 por año (US$1,67 por mes), **7 días gratis** | El plan que la app muestra primero |
| **Premium para siempre** | US$39,99, un solo pago | Para quien no quiere suscripciones |

Todo esto ya está programado. Falta crear los productos en Play Console (ver `PLAY_STORE.md`, paso 6) y los bloques de AdMob (paso 3).

## Precios

**Comparación:** la app en la que nos inspiramos cobra unos US$50 por año (con 7 días gratis en App Store). Nosotros cobramos menos de la mitad y además damos opción mensual y de pago único.

| Plan | Precio | Te queda (después del 15 % de Google) |
| --- | --- | --- |
| Mensual | US$2,99 | ≈ US$2,54 por mes |
| Anual | US$19,99 | ≈ US$16,99 por año |
| Para siempre | US$39,99 | ≈ US$33,99 una vez |

Por qué estos números:

- **El anual ahorra 44 % frente al mensual.** Así la mayoría elige el anual, que es el que más plata deja y el que menos gente cancela.
- **La prueba gratis es solo en el anual.** Es el empujón para elegirlo. Google solo se la ofrece a quien nunca tuvo la suscripción, y la app lo detecta sola.
- **El pago único cuesta como 2 años.** Para quien odia las suscripciones, sin que convenga más que el anual a quien lo usa un año.
- **US$2,99 por mes** está por debajo de lo que cobran las apps de este tipo (US$4 a US$10 por mes). Para una app nueva sin reseñas, conviene arrancar accesible. Subir el precio después es fácil. Bajarlo da mala imagen.

**Precios por país:** Play convierte solo cada precio a la moneda local. Revisalo en Latinoamérica: si el número convertido queda alto para el bolsillo de allá, bajalo un 30 a 40 % en *Monetizar → Productos → (el producto) → Precios → Editar por país*. En Estados Unidos y Europa dejalo como está.

**Ofertas más adelante:** Play permite crear ofertas sin tocar la app, por ejemplo "primer mes a US$0,99" o un descuento de Black Friday en el anual. La app muestra sola la mejor oferta disponible para cada persona.

## Anuncios

### Lo que ya hace la app

- **Pantalla completa (intersticial):** solo al volver al menú, y solo si terminaste 2 cosas desde el último (lecciones, tandas, ejercicios, partidas). Como mucho uno cada 5 minutos y 6 por día. **Ninguno el primer día**: la primera impresión es la que decide si la gente se queda y qué reseña deja.
- **Con premio (bonificado), siempre opcional:**
  - *Segunda oportunidad:* si fallaste el desafío diario, mirás un anuncio y tenés otro intento que cuenta, con otras cartas. Si ibas con racha, la salvás.
  - *Probar Premium 1 hora:* al tocar algo de Premium (modo casino, simulador de banca, etc.), podés mirar un anuncio y usarlo una hora. Es la mejor publicidad de Premium: la persona lo prueba y ve qué se pierde.
  - Si no hay anuncio disponible (sin conexión, por ejemplo), el premio se da igual. Nunca castigamos a nadie porque no cargó un anuncio.
- **Con Premium o en la prueba gratis:** ningún anuncio.
- **Nunca:** banners pegados abajo, anuncios en medio de una lección o una práctica, anuncios al abrir la app, ni botones de cerrar escondidos.

### En números

Con alguien que usa la app unos 20 minutos por día:

- unos 2 o 3 anuncios de pantalla completa, más los de premio que elija;
- eso son 30 a 45 segundos de anuncios en 20 minutos de uso.

Es bastante menos que la mayoría de los juegos gratis.

### Cuándo prenderlos

- **Prueba cerrada (los 14 días con 12 testers):** anuncios de prueba de Google, los que dicen "Test Ad". Así los testers ven cómo queda. No generan plata y no hay riesgo de que te suspendan AdMob por clics de amigos.
- **Lanzamiento en producción:** anuncios reales desde el primer día, con las reglas de arriba. Antes, cargá las 3 variables de AdMob en GitHub.
- **No toques tus propios anuncios reales**, ni le pidas a nadie que los toque. AdMob lo detecta y suspende la cuenta. Para probar, usá un celular registrado como *dispositivo de prueba* en AdMob.

Si después de un mes las reseñas se quejan de anuncios, se sube la pausa a 7 minutos o se baja el tope a 4 por día. Son dos números en `src/platform.js` (`AD_GAP_MS` y `ADS_PER_DAY`).

## Cuánto se puede ganar

No hay forma de saberlo antes de lanzar. Esta es una referencia para no ilusionarse de más ni de menos.

| Personas que la usan cada día | Anuncios por mes | Premium por mes | Total por mes |
| --- | --- | --- | --- |
| 100 | US$5 a US$20 | US$10 a US$40 | **US$15 a US$60** |
| 1.000 | US$60 a US$200 | US$100 a US$400 | **US$160 a US$600** |
| 10.000 | US$600 a US$2.000 | US$1.000 a US$4.000 | **US$1.600 a US$6.000** |

Supuestos:

- **Anuncios:** lo que pagan por cada 1.000 anuncios (eCPM) va de US$1 a US$4 en Latinoamérica y de US$8 a US$15 en Estados Unidos.
- **Premium:** entre el 1 % y el 3 % de los usuarios del mes paga.

Lo que más mueve estos números son las **descargas**, y ahí entran los videos y las redes (ver `store/redes/README.md`).

## Calendario hasta el lanzamiento (≈ 1 mes)

| Cuándo | Qué |
| --- | --- |
| Día 1 (al cumplir 18) | Cuenta de Play Console (US$25), cuenta de AdMob, perfil de pagos |
| Día 1 a 3 | Prueba interna. Crear la suscripción, el pago único y los bloques de AdMob. Probar compras con *Pruebas de licencias* |
| Día 3 | Abrir la prueba cerrada y mandar el mensaje a los testers (`store/testers.md`) |
| Día 3 a 17 | 14 días de prueba. Mientras, arrancar TikTok e Instagram con 3 videos por semana |
| Día 17 | Pedir acceso a producción |
| Día 20 a 25 | Sale en Play. Cambiar `PUBLISHED = true` en `sitio/index.html`. Vincular AdMob con Play |
| Después | Mirar reseñas y números cada semana. Ajustar precios por país y anuncios si hace falta |
