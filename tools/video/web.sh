#!/bin/bash
# Videos de muestra de la web (store/video/redes/edge21-<escena>-<idioma>-web.mp4): Full HD a 30 FPS,
# bien comprimidos para que carguen rápido en el celular.
# En español usan los textos neutros (la web habla de tú), así que antes hace falta:
#   NEUTRO=1 node tools/video/fondos.cjs es && NEUTRO=1 node tools/video/armar.cjs es vertical
# Uso (desde la carpeta del proyecto): bash tools/video/web.sh
set -e
cd "$(dirname "$0")/../.."
for k in quiz count table; do
  for L in es en; do
    if [ "$L" = es ]; then src="tools/video/salida/edge21-$k-es-neutro.mp4"; else src="store/video/redes/edge21-$k-en.mp4"; fi
    out="store/video/redes/edge21-$k-$L-web.mp4"
    ffmpeg -v error -y -i "$src" -an -vf "fps=30" -c:v libx264 -preset slower -crf 25 -profile:v high \
      -pix_fmt yuv420p -movflags +faststart "$out"
    echo "$out $(du -k "$out" | cut -f1) KB"
  done
done
