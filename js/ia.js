// Generador de plan de estudio.
// Con AI_ENDPOINT configurado llama a tu Cloudflare Worker (la llave de la IA vive allí, no aquí).
// Sin endpoint usa un generador de demostración basado en reglas (no es IA real) y lo avisa.
import { AI_ENDPOINT } from "./config.js";

export const hayIA = !!AI_ENDPOINT;

const DIFS = ["facil", "media", "dificil"];
const difPorMinutos = m => (m <= 30 ? "facil" : m <= 60 ? "media" : "dificil");

function limpiar(tareas) {
  return tareas
    .filter(t => t && typeof t.titulo === "string" && t.titulo.trim())
    .slice(0, 14)
    .map(t => {
      const minutos = Math.min(240, Math.max(5, Math.round(Number(t.minutos) || 30)));
      const dificultad = DIFS.includes(t.dificultad) ? t.dificultad : difPorMinutos(minutos);
      return { titulo: t.titulo.trim().slice(0, 110), minutos, dificultad };
    });
}

export function planDemo(meta, dias) {
  const tema = meta.trim();
  const out = [{ titulo: `Mapa del tema: lista qué entra en «${tema}»`, minutos: 25, dificultad: "facil" }];
  for (let d = 1; d <= dias; d++) {
    if (d < dias || dias === 1) {
      out.push({ titulo: `Día ${d}: estudia y resume el bloque ${d} de «${tema}»`, minutos: 45, dificultad: "media" });
      out.push({ titulo: `Día ${d}: crea 5 preguntas de práctica y respóndelas`, minutos: 20, dificultad: "facil" });
    }
  }
  out.push({ titulo: `Simulacro de «${tema}» en tiempo real`, minutos: 60, dificultad: "dificil" });
  out.push({ titulo: "Repaso final de errores y descanso", minutos: 25, dificultad: "facil" });
  return limpiar(out);
}

export async function generarPlan(meta, dias) {
  meta = meta.trim();
  if (!meta) throw new Error("Escribe tu meta o examen.");
  if (!AI_ENDPOINT) return { tareas: planDemo(meta, dias), demo: true };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meta, dias }),
      signal: ctrl.signal
    });
    if (!r.ok) throw new Error("El servicio de IA respondió con error (" + r.status + ").");
    const data = await r.json();
    const tareas = limpiar(Array.isArray(data.tareas) ? data.tareas : []);
    if (!tareas.length) throw new Error("La IA no devolvió un plan válido. Intenta con otra descripción.");
    return { tareas, demo: false };
  } catch (e) {
    if (e.name === "AbortError") throw new Error("La IA tardó demasiado. Intenta de nuevo.");
    if (e instanceof TypeError) throw new Error("No se pudo conectar con la IA. Revisa tu conexión.");
    throw e;
  } finally { clearTimeout(timer); }
}
