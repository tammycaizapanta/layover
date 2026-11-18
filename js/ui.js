// Elementos compartidos: cabecera, pie, tema claro/oscuro, avisos.
import { APP_NAME, firebaseListo } from "./config.js";
import { iniciar, onSesion, salir } from "./firebase.js";

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---- tema ----
function temaGuardado() { try { return localStorage.getItem("layover_tema"); } catch { return null; } }
export function aplicarTema(t) {
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("layover_tema", t); } catch { /* ignorar */ }
}
aplicarTema(temaGuardado() || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

// ---- avisos ----
export function toast(texto) {
  let z = document.querySelector(".toast-zone");
  if (!z) { z = document.createElement("div"); z.className = "toast-zone"; z.setAttribute("role", "status"); z.setAttribute("aria-live", "polite"); document.body.appendChild(z); }
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = texto;
  z.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

export function mensaje(el, tipo, texto) {
  el.className = "msg " + tipo;
  el.textContent = texto;
  el.classList.remove("hidden");
}

// ---- cabecera y pie ----
const PAGINAS = [
  ["index.html", "Inicio"],
  ["catalogo.html", "Catálogo"],
  ["tracker.html", "Mi viaje"],
  ["contacto.html", "Contacto"]
];

export function montarLayout(paginaActiva) {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  if (header) {
    const banner = firebaseListo ? "" :
      `<div class="setup-banner">Modo local: tus datos se guardan solo en este navegador. Conecta Firebase en <code>js/config.js</code> para activar la nube.</div>`;
    header.innerHTML = `${banner}
      <nav class="nav" aria-label="Principal">
        <a class="brand" href="index.html"><span class="stamp" aria-hidden="true">Ly</span>${esc(APP_NAME)}</a>
        <button class="menu-btn" id="menu-btn" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-links">☰</button>
        <div class="nav-links" id="nav-links">
          ${PAGINAS.map(([h, t]) => `<a href="${h}" ${h === paginaActiva ? 'class="active" aria-current="page"' : ""}>${t}</a>`).join("")}
          <a href="admin.html" id="nav-admin" class="hidden">Admin</a>
          <a href="login.html" id="nav-login">Entrar</a>
          <button class="link" id="nav-salir" hidden>Salir</button>
          <button class="theme-btn" id="tema-btn" aria-label="Cambiar tema claro/oscuro">◐</button>
        </div>
      </nav>`;
    const links = header.querySelector("#nav-links");
    const mb = header.querySelector("#menu-btn");
    mb.addEventListener("click", () => {
      const abierto = links.classList.toggle("open");
      mb.setAttribute("aria-expanded", String(abierto));
    });
    header.querySelector("#tema-btn").addEventListener("click", () => {
      aplicarTema(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    header.querySelector("#nav-salir").addEventListener("click", async () => { await salir(); location.href = "index.html"; });
    onSesion(u => {
      header.querySelector("#nav-login").classList.toggle("hidden", !!u);
      header.querySelector("#nav-salir").hidden = !u;
      header.querySelector("#nav-admin").classList.toggle("hidden", !(u && u.esAdmin));
    });
  }

  if (footer) {
    footer.innerHTML = `<div class="wrap">
      <div class="big">${esc(APP_NAME)} · una escala a la vez</div>
      <div>Proyecto final · Jóvenes creaTIvos 2026</div></div>`;
  }
  iniciar().catch(e => { console.error(e); toast("No se pudo conectar con la nube. Revisa tu configuración."); });
}
