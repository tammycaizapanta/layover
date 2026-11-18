// Datos base del juego: escalas (niveles), retos de ejemplo y dificultades.

export const DIFICULTADES = {
  facil:   { nombre: "Fácil",   xp: 10 },
  media:   { nombre: "Media",   xp: 20 },
  dificil: { nombre: "Difícil", xp: 40 }
};

export const ESCALAS = [
  { n: 1, nombre: "Check-in",            min: 0,    emoji: "🎫", desc: "Tu viaje empieza aquí." },
  { n: 2, nombre: "Despegue",            min: 100,  emoji: "🛫", desc: "Ya tomaste ritmo." },
  { n: 3, nombre: "Altura de crucero",   min: 250,  emoji: "☁️", desc: "La constancia ya es hábito." },
  { n: 4, nombre: "Escala internacional",min: 500,  emoji: "🌍", desc: "Estudias como una profesional." },
  { n: 5, nombre: "Primera clase",       min: 900,  emoji: "🥂", desc: "Pocas personas llegan aquí." },
  { n: 6, nombre: "Destino final",       min: 1500, emoji: "🏁", desc: "Lo lograste. Elige tu próximo viaje." }
];

// Retos de ejemplo. Si Firestore está activo, la administradora los gestiona desde el panel admin.
export const RETOS_BASE = [
  { id: "r-pomodoro", emoji: "🍅", titulo: "Un pomodoro de enfoque",  descripcion: "25 minutos de estudio sin celular y 5 de descanso.", dificultad: "facil" },
  { id: "r-repaso",   emoji: "🔁", titulo: "Repaso del día",          descripcion: "Relee tus apuntes del día y escribe 3 ideas clave.", dificultad: "facil" },
  { id: "r-resumen",  emoji: "📝", titulo: "Resumen de una página",   descripcion: "Resume un tema completo en una sola hoja.",         dificultad: "media" },
  { id: "r-flash",    emoji: "🗂️", titulo: "10 tarjetas de memoria",  descripcion: "Crea 10 flashcards y pruébate sin mirar.",          dificultad: "media" },
  { id: "r-simulacro",emoji: "🧪", titulo: "Simulacro de examen",     descripcion: "Resuelve un examen anterior en tiempo real.",       dificultad: "dificil" },
  { id: "r-explica",  emoji: "🎤", titulo: "Explícalo en voz alta",   descripcion: "Explica un tema a alguien (o a la pared) sin notas.",dificultad: "dificil" }
];
