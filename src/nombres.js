// Nombres que ven los demás (ranking y desafíos de amigos): Google Play pide filtrar lo ofensivo y
// poder reportarlo. Se revisa al elegir el nombre y otra vez al mostrarlo (por si alguien lo
// guardó por otro lado); los nombres reportados u ocultos se ven como "Jugador".
import { getState, setSettings } from "./state.js";

import { ofensivo } from "./nombres-filtro.js";

// Para mostrar el nombre de otra persona.
function nombreVisible(nombre, id) {
  const ocultos = getState().settings.ocultos || [];
  if (!nombre || ofensivo(nombre) || (id && ocultos.includes(id)))
    return "Jugador";
  return nombre;
}
function ocultarJugador(id) {
  const ocultos = getState().settings.ocultos || [];
  if (!ocultos.includes(id))
    setSettings({ ocultos: [...ocultos, id].slice(-200) });
}

export { nombreVisible, ocultarJugador, ofensivo };
