# Ventaja 21

Web app (PWA) en español para aprender a contar cartas en blackjack: lecciones, entrenador de estrategia, ejercicios de conteo y simulador.

## Publicar en GitHub Pages

1. Subí estos archivos a la raíz de un repositorio (por ejemplo `ventaja21`).
2. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch**, elegí la rama `main` y la carpeta `/ (root)`.
3. Abrí `https://TU-USUARIO.github.io/ventaja21/` en el celular.
4. iPhone: Safari → Compartir → **Agregar a inicio**. Android: Chrome → ⋮ → **Instalar app**.

Después de abrirla una vez con internet, funciona sin conexión.

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
| `screens/` | Pantallas: Conteo, Entrenar, Jugar, Aprender, Progreso, ejercicios, guía y ajustes |
| `ui/` | Componentes compartidos: cartas, botones, hojas, tabla de estrategia e íconos |
| `styles.css` | Todos los estilos |

La versión que se muestra en Ajustes sale de `version` en `package.json`.
