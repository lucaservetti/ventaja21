# TikTok: versión cuidada

TikTok es mucho más estricto que Instagram con todo lo que parezca apuestas: revisa la descripción, los hashtags y **también el texto que aparece dentro de las imágenes y los videos**. Por eso en TikTok la cuenta se presenta como **matemática, probabilidad y memoria con cartas**, y nunca como "casino".

## Archivos para TikTok

| Publicación | Archivos |
| --- | --- |
| Carruseles | Las carpetas `tiktok/` de cada carrusel: ya vienen sin "casino", "apostar" ni "plata" |
| Video "Desafío de memoria" | `store/video/redes/edge21-count-es-tiktok.mp4` |
| Video "¿Qué harías vos?" | `store/video/redes/edge21-quiz-es-tiktok.mp4` |
| "Un casino en tu bolsillo" | **No va a TikTok**: muestra fichas y montos |

Los videos `-tiktok` tienen títulos de desafío y abajo dicen "Edge 21 · contenido educativo", sin el link.

## Reglas para TikTok

- **Palabras que no van** (ni en la descripción, ni en hashtags, ni en el texto del video): casino, apuesta, apostar, plata, dinero, ganar plata, blackjack (como hashtag), gambling, bet.
- **Palabras que sí:** cartas, matemática, probabilidad, lógica, memoria, desafío, estrategia, aprender.
- **El link va solo en la bio**, no en cada descripción, por lo menos las primeras semanas.
- **Hashtags** (3 a 5): #matematicas #probabilidad #desafiomental #juegosdecartas #aprendeentiktok
- **Una línea fija al final de cada descripción:** `📚 Contenido educativo, no se usa dinero.`
- **Música:** de la Biblioteca de música comercial.

## Bio de TikTok

```
Matemática y probabilidad con cartas 🃏 Desafíos de lógica y memoria. Contenido educativo 👇
```

## Qué hacer con el video marcado

1. **Apelalo** (el texto está más abajo) y **no lo vuelvas a subir** mientras tanto. Subir otra vez algo que TikTok sacó cuenta como otra infracción.
2. Si la apelación sale bien, queda publicado y listo.
3. Si sale mal, esperá unos días y después subí la versión para TikTok (`edge21-quiz-es-tiktok.mp4`), con la descripción de abajo.

**Texto para apelar:**
```
Este video es educativo: muestra una decisión de lógica y probabilidad en un juego de cartas. No promociona apuestas, no muestra dinero, no enlaza a ningún sitio de apuestas, y la app que menciono es gratuita, para aprender, y no permite usar dinero real. Es contenido de matemática y toma de decisiones.
```

## Orden para TikTok (uno cada 1 o 2 días)

### 1 · Contar cartas en 3 pasos (carrusel, fotos de `3-contar-cartas/tiktok/`)
- **Título:** `El truco matemático de las cartas 🧠`
- **Descripción:**
```
Con un solo número en la cabeza sabés qué cartas quedan en el mazo. Así funciona, en 3 pasos 👆 Guardalo para practicar 📌
📚 Contenido educativo, no se usa dinero.
#matematicas #probabilidad #desafiomental #juegosdecartas #aprendeentiktok
```

### 2 · Desafío de memoria (video `edge21-count-es-tiktok.mp4`)
```
Desafío de memoria 🧠 Cada carta suma +1, 0 o −1. ¿Llegaste al final con la cuenta bien? Comentá tu número 👇
📚 Contenido educativo, no se usa dinero.
#desafiomental #matematicas #memoria #juegosdecartas #aprendeentiktok
```

### 3 · 4 mitos (carrusel, fotos de `5-mitos/tiktok/`)
- **Título:** `4 mitos sobre contar cartas ❌`
- **Descripción:**
```
¿Cuántos te creías? 👇 Es probabilidad, no suerte.
📚 Contenido educativo, no se usa dinero.
#matematicas #probabilidad #mitos #juegosdecartas #aprendeentiktok
```

### 4 · ¿Qué harías vos? (video `edge21-quiz-es-tiktok.mp4`, solo si la apelación no salió)
```
Desafío de lógica 🤔 Tenés 12 y la otra persona muestra un 5: ¿pedís otra carta o te plantás? Comentá antes de que termine la cuenta 👇
📚 Contenido educativo, no se usa dinero.
#desafiomental #logica #probabilidad #juegosdecartas #aprendeentiktok
```

### 5 · La app (carrusel, fotos de `1-presentacion/tiktok/`). Si ya subiste la presentación, saltealo.
- **Título:** `Hice una app para entrenar la mente con cartas 🧠`
- **Descripción:**
```
Lecciones cortas, un desafío por día y práctica de memoria. Es gratis: link en el perfil.
📚 Contenido educativo, no se usa dinero.
#matematicas #app #desafiomental #juegosdecartas #aprendeentiktok
```

**Si alguien pregunta "¿esto es para apostar?",** contestá siempre lo mismo: "No, es para aprender la matemática de las cartas. En la app no se usa dinero de ningún tipo." Ese comentario también lo lee TikTok.

## Para rehacer los archivos

- Videos: `TIKTOK=1 node tools/video/fondos.cjs es && TIKTOK=1 node tools/video/armar.cjs es`
- Imágenes: `node tools/redes/publicaciones.mjs` (las de TikTok salen solas en cada carpeta `tiktok/`)
