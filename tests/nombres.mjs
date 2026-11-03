// Prueba del filtro de nombres del ranking (src/nombres-filtro.js). Uso: node tests/nombres.mjs
import { ofensivo } from "../src/nombres-filtro.js";
const malos = ["puto", "P.U.T.O", "pvt0", "hijo de puta", "boludo99", "F u c k", "fuuuuck", "n1gga", "culo", "Culo grande", "sexo", "mierda", "HDP", "pelotudo", "shit happens", "Hitler"];
const buenos = ["Luca S.", "Ana P.", "Martina", "Calculo", "Ridículo", "Sexto sentido", "Dickens", "Forrest", "Cono Sur fan", "Jugador", "Bruno D.", "Peacock", "Contador21", "María José", "Ñandú"];
let f = 0;
for (const m of malos) if (!ofensivo(m)) f++, console.log("✗ debería filtrar:", m);
for (const b of buenos) if (ofensivo(b)) f++, console.log("✗ no debería filtrar:", b);
console.log(f ? `${f} falla(s)` : `filtro de nombres: ${malos.length} ofensivos frenados, ${buenos.length} normales pasan`);
process.exit(f ? 1 : 0);
