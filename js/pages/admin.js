import { montarLayout, esc, mensaje, toast } from "../ui.js";
import { DIFICULTADES } from "../data.js";
import {
  onSesion, listarMensajes, borrarMensaje, listarUsuarios,
  listarRetos, guardarReto, borrarReto, cargarRetosEjemplo
} from "../firebase.js";

montarLayout("admin.html");
const $ = id => document.getElementById(id);
const fecha = ms => (ms ? new Date(ms).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" }) : "—");

let retos = [];

// ---- pestañas ----
const tabs = [...document.querySelectorAll(".tab")];
tabs.forEach(t => t.addEventListener("click", () => {
  tabs.forEach(x => x.setAttribute("aria-selected", String(x === t)));
  ["mensajes", "usuarios", "retos"].forEach(p => $("ap-" + p).classList.toggle("hidden", p !== t.dataset.panel));
}));

async function cargarMensajes() {
  const m = await listarMensajes();
  $("n-msg").textContent = m.length;
  $("tb-mensajes").innerHTML = m.length ? m.map(x => `<tr>
    <td>${fecha(x.fecha)}</td><td><strong>${esc(x.nombre)}</strong><br><a href="mailto:${esc(x.email)}">${esc(x.email)}</a></td>
    <td style="overflow-wrap:anywhere">${esc(x.mensaje)}</td>
    <td><button class="btn danger sm" data-msg="${esc(x.id)}">Borrar</button></td></tr>`).join("")
    : `<tr><td colspan="4" class="empty" style="border:0">Todavía no hay mensajes.</td></tr>`;
}

async function cargarUsuarios() {
  const u = await listarUsuarios();
  $("n-usr").textContent = u.length;
  $("tb-usuarios").innerHTML = u.length ? u.map(x => `<tr>
    <td>${esc(x.nombre)}</td><td>${esc(x.email)}</td><td>${x.xp}</td><td>${fecha(x.creado)}</td></tr>`).join("")
    : `<tr><td colspan="4" class="empty" style="border:0">Aún no hay usuarios registrados.</td></tr>`;
}

async function cargarRetos() {
  retos = await listarRetos();
  $("n-ret").textContent = retos.length;
  $("tb-retos").innerHTML = retos.map(r => `<tr>
    <td>${esc(r.emoji || "")} <strong>${esc(r.titulo)}</strong><br><span style="color:var(--ink-soft)">${esc(r.descripcion)}</span></td>
    <td>${(DIFICULTADES[r.dificultad] || DIFICULTADES.facil).nombre}</td>
    <td style="white-space:nowrap"><button class="btn ghost sm" data-edit="${esc(r.id)}">Editar</button> <button class="btn danger sm" data-del="${esc(r.id)}">Borrar</button></td></tr>`).join("");
}

function limpiarForm() {
  $("r-id").value = ""; $("r-emoji").value = "🎯"; $("r-titulo").value = ""; $("r-desc").value = ""; $("r-dif").value = "facil";
  $("reto-titulo-form").textContent = "Nuevo reto";
}

$("tb-mensajes").addEventListener("click", async e => {
  const b = e.target.closest("[data-msg]");
  if (!b || !confirm("¿Borrar este mensaje?")) return;
  try { await borrarMensaje(b.dataset.msg); await cargarMensajes(); toast("Mensaje borrado"); }
  catch (err) { console.error(err); toast("No se pudo borrar."); }
});

$("tb-retos").addEventListener("click", async e => {
  const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
  if (ed) {
    const r = retos.find(x => x.id === ed.dataset.edit);
    if (!r) return;
    $("r-id").value = r.id; $("r-emoji").value = r.emoji || "🎯"; $("r-titulo").value = r.titulo;
    $("r-desc").value = r.descripcion; $("r-dif").value = r.dificultad;
    $("reto-titulo-form").textContent = "Editar reto";
    $("r-titulo").focus();
  }
  if (del && confirm("¿Borrar este reto?")) {
    try { await borrarReto(del.dataset.del); await cargarRetos(); toast("Reto borrado"); }
    catch (err) { console.error(err); toast("No se pudo borrar."); }
  }
});

$("form-reto").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = $("r-msg");
  const reto = { id: $("r-id").value || null, emoji: $("r-emoji").value, titulo: $("r-titulo").value, descripcion: $("r-desc").value, dificultad: $("r-dif").value };
  if (!reto.titulo.trim() || !reto.descripcion.trim()) return mensaje(msg, "err", "Completa título y descripción.");
  try { await guardarReto(reto); limpiarForm(); msg.classList.add("hidden"); await cargarRetos(); toast("Reto guardado"); }
  catch (err) { console.error(err); mensaje(msg, "err", "No se pudo guardar. ¿Tu correo coincide con el de las reglas de Firestore?"); }
});
$("r-cancelar").addEventListener("click", limpiarForm);

$("btn-ejemplo").addEventListener("click", async () => {
  try { await cargarRetosEjemplo(); await cargarRetos(); toast("Retos de ejemplo cargados"); }
  catch (err) { console.error(err); toast("No se pudo cargar."); }
});

onSesion(async u => {
  const bloqueo = $("admin-bloqueo"), panel = $("admin-panel");
  if (!u) {
    panel.classList.add("hidden"); bloqueo.classList.remove("hidden");
    bloqueo.innerHTML = `<h2>Zona privada</h2><p style="color:var(--ink-soft)">Inicia sesión con la cuenta de administración para entrar.</p><a class="btn" href="login.html">Iniciar sesión</a>`;
    return;
  }
  if (!u.esAdmin) {
    panel.classList.add("hidden"); bloqueo.classList.remove("hidden");
    bloqueo.innerHTML = `<h2>Sin permiso</h2><p style="color:var(--ink-soft)">Esta cuenta no es de administración.</p><a class="btn ghost" href="tracker.html">Volver a mi viaje</a>`;
    return;
  }
  bloqueo.classList.add("hidden"); panel.classList.remove("hidden");
  $("admin-hola").textContent = `Sesión: ${u.email}`;
  try { await Promise.all([cargarMensajes(), cargarUsuarios(), cargarRetos()]); }
  catch (err) { console.error(err); toast("No se pudieron leer los datos. Revisa las reglas de Firestore."); }
});
