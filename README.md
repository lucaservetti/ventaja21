# Edge 21

Web app (PWA) en español para aprender a contar cartas en blackjack: lecciones, entrenador de estrategia, ejercicios de conteo y simulador.

## Publicar en GitHub Pages

1. Subí estos archivos a la raíz de un repositorio (por ejemplo `ventaja21`).
2. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch**, elegí la rama `main` y la carpeta `/ (root)`.
3. Abrí `https://TU-USUARIO.github.io/ventaja21/` en el celular.
4. iPhone: Safari → Compartir → **Agregar a inicio**. Android: Chrome → ⋮ → **Instalar app**.

Después de abrirla una vez con internet, funciona sin conexión.

## App de Android (Google Play)

La misma app se arma para Android con Capacitor, con anuncios y una compra de Premium. Todos los pasos para publicarla están en [PLAY_STORE.md](PLAY_STORE.md).

## Código

La app publicada es un solo archivo, `index.html`, que se genera a partir del código en `src/`. No hay que editar `index.html` a mano.

```
npm install
npm run build
```

`npm run build` vuelve a generar `index.html` y `sw.js` (con un nombre de caché nuevo, así los celulares que ya la tienen instalada bajan la versión nueva). Después de compilar, subí los dos archivos junto con el código.

Cómo está organizado `src/`:

| Carpeta | Qué hay |
| --- | --- |
| `main.jsx` | Arranque, pestañas y navegación entre pantallas |
| `state.js` | Progreso guardado en el celular (localStorage), reglas de mesa y respaldo |
| `engine/` | Lógica del juego: cartas, estrategia básica, desviaciones, sistemas de conteo, probabilidades, mesa del simulador |
| `lessons/` | Contenido de las lecciones y el reproductor de lecciones (mesa narrada, preguntas, ejercicios) |
| `screens/` | Pantallas: Conteo (con el desafío diario y la velocidad de conteo), Entrenar (con las tarjetas de la tabla y la ruta de desviaciones), Jugar (y el modo casino real con su examen), Aprender, Progreso (con tu semana, logros, el simulador de banca y el diario de casino real), ejercicios, guía y ajustes |
| `ui/` | Componentes compartidos: cartas, botones, hojas, tabla de estrategia e íconos |
| `styles.css` | Todos los estilos |
| `tests/` | Pruebas del simulador y de la tabla de estrategia |

La versión que se muestra en Ajustes sale de `version` en `package.json`.

## Pruebas

```
npm test
```

- ESLint revisa que no haya nombres sin definir en `src/` (por ejemplo, un hook de React sin importar). Se corre solo con `npm run lint`.
- `tests/simulador.mjs` juega miles de manos con decisiones al azar (crupier que se planta o pide con 17 blando, 2 y 6 mazos, con y sin mezcladora continua) y revisa en cada una que los pagos, la banca, el juego del crupier y el conteo den bien.
- `tests/estrategia.mjs` compara cada casilla de la tabla de estrategia contra el valor esperado que calcula la app. Las únicas diferencias que acepta son dos dobles blandos (A,2 contra 5 y A,4 contra 4) que son correctos con 6 mazos.
