// Punto único para leer/guardar el progreso (invitado, cuenta local o nube).
import { usuario, cargarLocal, guardarLocal, cargarNube, guardarNube } from "./firebase.js";
import { fusionar, estadoInicial } from "./gamificacion.js";

const tieneDatos = s => s.tareas.length > 0 || s.xp > 0;

export async function cargarEstado() {
  const u = usuario();
  if (!u) return cargarLocal(null);
  const nube = await cargarNube(u);
  const invitado = cargarLocal(null);
  if (!tieneDatos(invitado)) return nube;
  const unido = fusionar(nube, invitado);   // se queda con el de más XP
  await guardarNube(u, unido);
  guardarLocal(null, estadoInicial());      // el progreso de invitado ya se pasó a la cuenta
  return unido;
}

export async function guardarEstado(estado) {
  const u = usuario();
  if (!u) { guardarLocal(null, estado); return; }
  await guardarNube(u, estado);
}
