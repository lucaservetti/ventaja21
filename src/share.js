// Compartir resultados: arma una imagen con el resultado (estilo tarjeta) y la comparte.
// En Android usa el menú de compartir del sistema; en la web, el del navegador, o descarga la imagen.
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { LOGO_21, LOGO_SPADE } from "./ui/common.jsx";

const SITE = "https://edge21.app/";
const W = 1080;
const H = 1350;
const GOLD = "#e9b949";
const INK = "#1d1405";

// La ficha del logo, dibujada en el canvas con los mismos trazados que en la app.
function drawChip(ctx, cx, cy, size) {
  const k = size / 412;
  ctx.save();
  ctx.translate(cx - 256 * k, cy - 256 * k);
  ctx.scale(k, k);
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(256, 256, 206, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 44;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const half = i % 2 ? 0.07 : 0.18;
    ctx.beginPath();
    ctx.arc(256, 256, 184, a - half, a + half);
    ctx.stroke();
  }
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(256, 256, 142, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.translate(256, 256);
  ctx.scale(1.75, 1.75);
  ctx.fillStyle = INK;
  ctx.fill(new Path2D(LOGO_SPADE));
  ctx.restore();
  ctx.fillStyle = GOLD;
  ctx.fill(new Path2D(LOGO_21));
  ctx.restore();
}

// card: { eyebrow, big, sub, lines: [] }
async function drawCard({ eyebrow, big, sub, lines = [] }) {
  try {
    await Promise.all([
      document.fonts.load('800 150px "DM Sans"'),
      document.fonts.load('500 44px "DM Sans"'),
    ]);
  } catch {
    // Sin fuentes cargadas se usa la del sistema.
  }
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(W * 0.5, H * 0.1, 50, W * 0.5, H * 0.3, H);
  g.addColorStop(0, "#17603f");
  g.addColorStop(0.55, "#0a2c1c");
  g.addColorStop(1, "#04100a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(233,185,73,.3)";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.roundRect(36, 36, W - 72, H - 72, 48);
  ctx.stroke();
  ctx.setLineDash([]);
  drawChip(ctx, W / 2, 250, 250);
  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.font = '700 40px "DM Sans", sans-serif';
  ctx.letterSpacing = "6px";
  ctx.fillText(String(eyebrow).toUpperCase(), W / 2, 480);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "#f3efe2";
  let size = 150;
  ctx.font = `800 ${size}px "DM Sans", sans-serif`;
  while (ctx.measureText(big).width > W - 140 && size > 60) {
    size -= 6;
    ctx.font = `800 ${size}px "DM Sans", sans-serif`;
  }
  ctx.fillText(big, W / 2, 640);
  ctx.fillStyle = "#b4c5ba";
  ctx.font = '500 46px "DM Sans", sans-serif';
  if (sub) ctx.fillText(sub, W / 2, 730);
  ctx.font = '500 40px "DM Sans", sans-serif';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 830 + i * 62));
  ctx.fillStyle = "#f3efe2";
  ctx.font = '800 52px "DM Sans", sans-serif';
  ctx.fillText("Edge 21", W / 2, H - 150);
  ctx.fillStyle = "#8aa093";
  ctx.font = '500 32px "DM Sans", sans-serif';
  ctx.fillText(SITE.replace("https://", ""), W / 2, H - 98);
  return c;
}

// Devuelve "shared" (se abrió el menú de compartir) o "saved" (se descargó la imagen y se copió el texto).
async function shareResult({ title, text, card }) {
  const msg = `${text} ${SITE}`;
  const canvas = await drawCard(card);
  try {
    if (Capacitor.isNativePlatform()) {
      const data = canvas.toDataURL("image/png").split(",")[1];
      const path = "edge21-resultado.png";
      await Filesystem.writeFile({ path, data, directory: Directory.Cache });
      const { uri } = await Filesystem.getUri({
        path,
        directory: Directory.Cache,
      });
      await Share.share({ title, text: msg, files: [uri] });
      return "shared";
    }
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    const file = new File([blob], "edge21-resultado.png", {
      type: "image/png",
    });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, text: msg, files: [file] });
      return "shared";
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    try {
      await navigator.clipboard.writeText(msg);
    } catch {
      // Sin portapapeles: alcanza con la imagen.
    }
    return "saved";
  } catch (e) {
    if (e && e.name === "AbortError") return "cancel";
    return "error";
  }
}

// Compartir solo texto (en Android con el menú del sistema).
async function shareText(text, title = "Edge 21") {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text });
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ title, text });
      return "shared";
    }
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch (e) {
    return e && e.name === "AbortError" ? "cancel" : "error";
  }
}

export { shareResult, shareText };
