import { montarLayout, esc, toast } from "../ui.js";
import { ESCALAS, DIFICULTADES } from "../data.js";
import { BADGES, estadoInicial, agregarTarea } from "../gamificacion.js";
import { listarRetos } from "../firebase.js";
import { cargarEstado, guardarEstado } from "../store.js";

montarLayout("catalogo.html");

// ---- pestañas ----
const tabs = [...document.querySelectorAll(".tab")];
function mostrar(nombre) {
  tabs.forEach(t => t.setAttribute("aria-selected", String(t.dataset.panel === nombre)));
  ["retos", "insignias", "escalas"].forEach(p => document.getElementById("panel-" + p).classList.toggle("hidden", p !== nombre));
}
tabs.forEach(t => t.addEventListener("click", () => mostrar(t.dataset.panel)));
tabs.forEach((t, i) => t.addEventListener("keydown", e => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
  n.focus(); n.click();
}));

let estado = estadoInicial();
let retos = [];

function pintarRetos() {
  const cont = document.getElementById("lista-retos");
  if (!retos.length) { cont.innerHTML = `<p class="empty">Aún no hay retos publicados.</p>`; return; }
  cont.innerHTML = retos.map(r => {
    const d = DIFICULTADES[r.dificultad] || DIFICULTADES.facil;
    return `<article class="card badge-card" data-aos="fade-up">
      <span class="emoji" aria-hidden="true">${esc(r.emoji || "🎯")}</span>
      <h3>${esc(r.titulo)}</h3>
      <p>${esc(r.descripcion)}</p>
      <span class="pill">${d.nombre} · ${d.xp} XP</span>
      <div style="margin-top:14px"><button class="btn sm" data-reto="${esc(r.id)}">Agregar a mi viaje</button></div>
    </article>`;
  }).join("");
}

function pintarInsignias() {
  document.getElementById("lista-insignias").innerHTML = BADGES.map(b => {
    const ok = estado.insignias.includes(b.id);
    return `<article class="card badge-card ${ok ? "" : "locked"}">
      <span class="emoji" aria-hidden="true">${ok ? b.emoji : "🔒"}</span>
      <h3>${esc(b.nombre)}</h3><p>${esc(b.desc)}</p>
      <span class="pill ${ok ? "ok" : ""}">${ok ? "Desbloqueada" : "Bloqueada"}</span>
    </article>`;
  }).join("");
}

function pintarEscalas() {
  document.getElementById("lista-escalas").innerHTML = ESCALAS.map(e => {
    const ok = estado.xp >= e.min;
    return `<article class="card badge-card ${ok ? "" : "locked"}">
      <span class="emoji" aria-hidden="true">${e.emoji}</span>
      <h3>${e.n}. ${esc(e.nombre)}</h3><p>${esc(e.desc)}</p>
      <span class="pill ${ok ? "ok" : ""}">${e.min} XP${ok ? " · alcanzada" : ""}</span>
    </article>`;
  }).join("");
}

document.getElementById("lista-retos").addEventListener("click", async e => {
  const b = e.target.closest("[data-reto]");
  if (!b) return;
  const r = retos.find(x => x.id === b.dataset.reto);
  if (!r) return;
  b.disabled = true;
  try {
    estado = await cargarEstado();
    const res = agregarTarea(estado, r.titulo, r.dificultad, { retoId: r.id });
    estado = res.estado;
    await guardarEstado(estado);
    toast(`«${r.titulo}» agregado a tu viaje`);
  } catch (err) {
    console.error(err);
    toast("No se pudo guardar. Intenta de nuevo.");
  } finally { b.disabled = false; }
});

(async () => {
  try {
    const [r, e] = await Promise.all([listarRetos(), cargarEstado().catch(() => estadoInicial())]);
    retos = r; estado = e;
  } catch (err) { console.error(err); }
  pintarRetos(); pintarInsignias(); pintarEscalas();
  if (window.AOS) window.AOS.init({ duration: 500, once: true, disable: () => matchMedia("(prefers-reduced-motion: reduce)").matches });
})();
