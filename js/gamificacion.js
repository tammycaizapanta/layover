// Lógica pura del juego (sin DOM, sin red). Se puede probar con Node.
import { DIFICULTADES, ESCALAS } from "./data.js";

export const BADGES = [
  { id: "primer-paso",  emoji: "👣", nombre: "Primer paso",     desc: "Completa tu primera tarea.",          check: s => s.completadas >= 1 },
  { id: "cinco",        emoji: "🖐️", nombre: "Mano llena",      desc: "Completa 5 tareas.",                  check: s => s.completadas >= 5 },
  { id: "veinticinco",  emoji: "🏅", nombre: "Imparable",       desc: "Completa 25 tareas.",                 check: s => s.completadas >= 25 },
  { id: "racha-3",      emoji: "🔥", nombre: "Racha de 3",      desc: "Estudia 3 días seguidos.",            check: s => s.rachaMax >= 3 },
  { id: "racha-7",      emoji: "⚡", nombre: "Semana perfecta", desc: "Estudia 7 días seguidos.",            check: s => s.rachaMax >= 7 },
  { id: "dificil",      emoji: "💪", nombre: "Sin miedo",       desc: "Completa una tarea difícil.",         check: s => s.dificiles >= 1 },
  { id: "xp-250",       emoji: "⭐", nombre: "250 XP",          desc: "Llega a 250 XP.",                     check: s => s.xp >= 250 },
  { id: "ia",           emoji: "🤖", nombre: "Copiloto",        desc: "Genera un plan con IA.",              check: s => s.usoIA === true }
];

export function estadoInicial() {
  return { tareas: [], xp: 0, completadas: 0, dificiles: 0, racha: 0, rachaMax: 0, ultimoDia: null, insignias: [], usoIA: false };
}

export function normalizar(s) {
  const base = estadoInicial();
  const out = Object.assign(base, s || {});
  if (!Array.isArray(out.tareas)) out.tareas = [];
  if (!Array.isArray(out.insignias)) out.insignias = [];
  return out;
}

export function hoy(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function ayer(d = new Date()) {
  const x = new Date(d);
  x.setDate(x.getDate() - 1);
  return hoy(x);
}

export function escalaPara(xp) {
  let actual = ESCALAS[0];
  for (const e of ESCALAS) if (xp >= e.min) actual = e;
  return actual;
}

export function progresoEscala(xp) {
  const actual = escalaPara(xp);
  const idx = ESCALAS.indexOf(actual);
  const sig = ESCALAS[idx + 1];
  if (!sig) return { actual, siguiente: null, pct: 100, faltan: 0 };
  const pct = Math.round(((xp - actual.min) / (sig.min - actual.min)) * 100);
  return { actual, siguiente: sig, pct, faltan: sig.min - xp };
}

export function nuevaTarea(titulo, dificultad = "facil", extra = {}) {
  const dif = DIFICULTADES[dificultad] ? dificultad : "facil";
  return {
    id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    titulo: String(titulo).trim().slice(0, 120),
    dificultad: dif,
    hecha: false,
    xpGanado: 0,
    creada: Date.now(),
    ...extra
  };
}

export function agregarTarea(estado, titulo, dificultad, extra) {
  const t = String(titulo || "").trim();
  if (!t) return { estado, tarea: null };
  const tarea = nuevaTarea(t, dificultad, extra);
  const s = normalizar(estado);
  return { estado: { ...s, tareas: [tarea, ...s.tareas] }, tarea };
}

function desbloquear(s) {
  const nuevas = [];
  for (const b of BADGES) {
    if (!s.insignias.includes(b.id) && b.check(s)) {
      s.insignias = [...s.insignias, b.id];
      nuevas.push(b);
    }
  }
  return nuevas;
}

// Marca una tarea como hecha. Devuelve { estado, xpGanado, subioEscala, insignias }.
export function completarTarea(estado, id, ahora = new Date()) {
  const s = normalizar(estado);
  const tarea = s.tareas.find(t => t.id === id);
  if (!tarea || tarea.hecha) return { estado: s, xpGanado: 0, subioEscala: null, insignias: [] };

  const escalaAntes = escalaPara(s.xp);
  const dia = hoy(ahora);

  let racha = s.racha;
  if (s.ultimoDia !== dia) racha = s.ultimoDia === ayer(ahora) ? s.racha + 1 : 1;

  const base = DIFICULTADES[tarea.dificultad].xp;
  const bono = racha >= 3 ? 5 : 0;
  const ganado = base + bono;

  const nuevo = {
    ...s,
    tareas: s.tareas.map(t => (t.id === id ? { ...t, hecha: true, xpGanado: ganado, hechaEn: ahora.getTime() } : t)),
    xp: s.xp + ganado,
    completadas: s.completadas + 1,
    dificiles: s.dificiles + (tarea.dificultad === "dificil" ? 1 : 0),
    racha,
    rachaMax: Math.max(s.rachaMax, racha),
    ultimoDia: dia
  };
  const insignias = desbloquear(nuevo);
  const escalaDespues = escalaPara(nuevo.xp);
  return {
    estado: nuevo,
    xpGanado: ganado,
    subioEscala: escalaDespues.n > escalaAntes.n ? escalaDespues : null,
    insignias
  };
}

// Desmarca una tarea: devuelve el XP que había dado. (Las insignias ya ganadas se conservan.)
export function descompletarTarea(estado, id) {
  const s = normalizar(estado);
  const tarea = s.tareas.find(t => t.id === id);
  if (!tarea || !tarea.hecha) return s;
  return {
    ...s,
    tareas: s.tareas.map(t => (t.id === id ? { ...t, hecha: false, xpGanado: 0, hechaEn: undefined } : t)),
    xp: Math.max(0, s.xp - (tarea.xpGanado || 0)),
    completadas: Math.max(0, s.completadas - 1),
    dificiles: Math.max(0, s.dificiles - (tarea.dificultad === "dificil" ? 1 : 0))
  };
}

export function eliminarTarea(estado, id) {
  const s = normalizar(estado);
  const tarea = s.tareas.find(t => t.id === id);
  if (!tarea) return s;
  const base = tarea.hecha ? descompletarTarea(s, id) : s;
  return { ...base, tareas: base.tareas.filter(t => t.id !== id) };
}

// Si la racha quedó "vieja" (no estudió ayer ni hoy), se muestra como 0.
export function rachaVisible(estado, ahora = new Date()) {
  const s = normalizar(estado);
  if (s.ultimoDia === hoy(ahora) || s.ultimoDia === ayer(ahora)) return s.racha;
  return 0;
}

export function marcarUsoIA(estado) {
  const s = normalizar(estado);
  const nuevo = { ...s, usoIA: true };
  const insignias = desbloquear(nuevo);
  return { estado: nuevo, insignias };
}

// Une el progreso local con el de la nube al iniciar sesión: se queda con el que tenga más XP.
export function fusionar(local, nube) {
  const a = normalizar(local);
  const b = normalizar(nube);
  if (!b.tareas.length && b.xp === 0) return a;
  if (!a.tareas.length && a.xp === 0) return b;
  return a.xp > b.xp ? a : b;
}
