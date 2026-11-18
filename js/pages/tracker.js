import { montarLayout, esc, toast, mensaje } from "../ui.js";
import { DIFICULTADES } from "../data.js";
import {
  estadoInicial, agregarTarea, completarTarea, descompletarTarea, eliminarTarea,
  progresoEscala, rachaVisible, marcarUsoIA
} from "../gamificacion.js";
import { onSesion, listarRetos } from "../firebase.js";
import { cargarEstado, guardarEstado } from "../store.js";
import { generarPlan, hayIA } from "../ia.js";

montarLayout("tracker.html");

let estado = estadoInicial();
let planActual = [];
const $ = id => document.getElementById(id);

async function guardar() {
  try { await guardarEstado(estado); }
  catch (e) { console.error(e); toast("No se pudo guardar en la nube. Tu cambio sigue en este dispositivo."); }
}

function pintar() {
  const p = progresoEscala(estado.xp);
  $("st-escala").textContent = `${p.actual.emoji} ${p.actual.nombre}`;
  $("st-barra").style.width = p.pct + "%";
  $("st-faltan").textContent = p.siguiente ? `Faltan ${p.faltan} XP para «${p.siguiente.nombre}»` : "¡Escala máxima alcanzada!";
  $("st-xp").textContent = estado.xp;
  $("st-racha").textContent = rachaVisible(estado) + " 🔥";
  $("st-hechas").textContent = estado.completadas;

  const ul = $("lista-tareas");
  if (!estado.tareas.length) {
    ul.innerHTML = `<li class="empty">Aún no tienes tareas. Agrega una arriba o pídele un plan a la IA ✈️</li>`;
    return;
  }
  const orden = [...estado.tareas].sort((a, b) => Number(a.hecha) - Number(b.hecha));
  ul.innerHTML = orden.map(t => {
    const d = DIFICULTADES[t.dificultad] || DIFICULTADES.facil;
    return `<li class="task ${t.hecha ? "done" : ""}" data-id="${esc(t.id)}">
      <input type="checkbox" ${t.hecha ? "checked" : ""} aria-label="Marcar «${esc(t.titulo)}» como hecha">
      <span class="t">${esc(t.titulo)}</span>
      <span class="meta">${t.hecha ? "+" + t.xpGanado : d.xp} XP</span>
      <button class="icon-btn" data-borrar aria-label="Eliminar «${esc(t.titulo)}»">✕</button>
    </li>`;
  }).join("");
}

function avisos(res) {
  if (res.xpGanado) toast(`+${res.xpGanado} XP`);
  res.insignias.forEach(b => toast(`${b.emoji} Insignia desbloqueada: ${b.nombre}`));
  if (res.subioEscala) toast(`${res.subioEscala.emoji} ¡Subiste a la escala «${res.subioEscala.nombre}»!`);
}

$("lista-tareas").addEventListener("change", async e => {
  const li = e.target.closest(".task");
  if (!li || e.target.type !== "checkbox") return;
  const id = li.dataset.id;
  if (e.target.checked) {
    const res = completarTarea(estado, id);
    estado = res.estado; avisos(res);
  } else {
    estado = descompletarTarea(estado, id);
  }
  pintar(); await guardar();
});

$("lista-tareas").addEventListener("click", async e => {
  if (!e.target.closest("[data-borrar]")) return;
  const id = e.target.closest(".task").dataset.id;
  estado = eliminarTarea(estado, id);
  pintar(); await guardar();
});

$("form-tarea").addEventListener("submit", async e => {
  e.preventDefault();
  const titulo = $("t-titulo").value;
  if (!titulo.trim()) return;
  estado = agregarTarea(estado, titulo, $("t-dif").value).estado;
  $("t-titulo").value = "";
  pintar(); await guardar();
});

// ---- IA ----
function pintarPlan() {
  const cont = $("ia-plan");
  if (!planActual.length) { cont.classList.add("hidden"); return; }
  cont.classList.remove("hidden");
  cont.innerHTML = planActual.map(t => `<div class="plan-item"><span style="flex:1">${esc(t.titulo)}</span><span class="meta mono" style="font-size:.75rem">${t.minutos} min · ${DIFICULTADES[t.dificultad].nombre}</span></div>`).join("") +
    `<div style="margin-top:12px"><button class="btn" id="ia-agregar">Agregar todo a mis tareas</button></div>`;
  $("ia-agregar").addEventListener("click", async () => {
    for (const t of [...planActual].reverse()) estado = agregarTarea(estado, t.titulo, t.dificultad, { minutos: t.minutos }).estado;
    planActual = []; pintarPlan(); pintar();
    $("ia-msg").classList.add("hidden");
    await guardar();
    toast("Plan agregado a tus tareas");
  });
}

$("form-ia").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = $("ia-btn"), msg = $("ia-msg");
  btn.disabled = true; btn.textContent = "Pensando…";
  mensaje(msg, "info", "Armando tu plan…");
  try {
    const r = await generarPlan($("ia-meta").value, Number($("ia-dias").value));
    planActual = r.tareas;
    mensaje(msg, "info", r.demo
      ? "Modo demostración: este plan sale de plantillas, no de IA real. Conecta tu Worker en js/config.js para activar la IA."
      : "Plan generado por IA. Revísalo y agrégalo a tus tareas.");
    pintarPlan();
    const u = marcarUsoIA(estado);
    estado = u.estado;
    u.insignias.forEach(b => toast(`${b.emoji} Insignia desbloqueada: ${b.nombre}`));
    pintar(); await guardar();
  } catch (err) {
    planActual = []; pintarPlan();
    mensaje(msg, "err", err.message);
  } finally { btn.disabled = false; btn.textContent = "Generar plan"; }
});

// ---- retos por URL (NFC con enlace) ----
async function procesarRetoURL(idReto) {
  const retos = await listarRetos();
  const r = retos.find(x => x.id === idReto);
  if (!r) { toast("Ese reto ya no existe."); return; }
  estado = agregarTarea(estado, r.titulo, r.dificultad, { retoId: r.id }).estado;
  pintar(); await guardar();
  toast(`Reto «${r.titulo}» agregado. ¡A estudiar!`);
}

// ---- Web NFC (extra, solo Chrome en Android) ----
if ("NDEFReader" in window) {
  const b = $("btn-nfc");
  b.hidden = false;
  b.addEventListener("click", async () => {
    try {
      const lector = new window.NDEFReader();
      await lector.scan();
      toast("Acerca la etiqueta NFC al teléfono…");
      lector.onreading = ev => {
        for (const rec of ev.message.records) {
          if (rec.recordType !== "url" && rec.recordType !== "text") continue;
          const txt = new TextDecoder(rec.encoding || "utf-8").decode(rec.data);
          try {
            const id = new URL(txt, location.href).searchParams.get("reto");
            if (id) return void procesarRetoURL(id);
          } catch { /* texto no es URL */ }
        }
        toast("La etiqueta no trae un reto de Layover.");
      };
    } catch (err) {
      toast(err.name === "NotAllowedError" ? "Permiso NFC denegado." : "No se pudo activar el NFC.");
    }
  });
}

// ---- inicio ----
let primera = true;
onSesion(async u => {
  $("estado-sesion").innerHTML = u
    ? `Hola, ${esc(u.nombre)}. Tu progreso se guarda en tu cuenta.`
    : `Estás como invitada: tu progreso se guarda en este navegador. <a href="login.html">Inicia sesión</a> para llevarlo contigo.`;
  try { estado = await cargarEstado(); } catch (e) { console.error(e); toast("No se pudo cargar tu progreso."); }
  pintar();
  if (primera) {
    primera = false;
    const idReto = new URLSearchParams(location.search).get("reto");
    if (idReto) { history.replaceState(null, "", "tracker.html"); procesarRetoURL(idReto); }
  }
});
