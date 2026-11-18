import { montarLayout, mensaje } from "../ui.js";
import { entrar, registrar, onSesion } from "../firebase.js";

montarLayout("login.html");

let modoRegistro = false;
const f = document.getElementById("form-auth");
const msg = document.getElementById("a-msg");
const btn = document.getElementById("a-btn");

function pintar() {
  document.getElementById("auth-titulo").textContent = modoRegistro ? "Crea tu cuenta" : "Inicia sesión";
  document.getElementById("campo-nombre").hidden = !modoRegistro;
  document.getElementById("a-nombre").required = modoRegistro;
  document.getElementById("a-clave").autocomplete = modoRegistro ? "new-password" : "current-password";
  btn.textContent = modoRegistro ? "Registrarme" : "Entrar";
  document.getElementById("a-alt").textContent = modoRegistro ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?";
  document.getElementById("a-cambiar").textContent = modoRegistro ? "Inicia sesión" : "Regístrate";
  msg.classList.add("hidden");
}
document.getElementById("a-cambiar").addEventListener("click", () => { modoRegistro = !modoRegistro; pintar(); });

let entrando = false;
onSesion(u => { if (u && !entrando) location.replace("tracker.html"); });

f.addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("a-email").value, clave = document.getElementById("a-clave").value, nombre = document.getElementById("a-nombre").value;
  if (modoRegistro && !nombre.trim()) return mensaje(msg, "err", "Escribe tu nombre.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return mensaje(msg, "err", "Escribe un correo válido.");
  btn.disabled = true; entrando = true;
  try {
    if (modoRegistro) await registrar(nombre, email, clave); else await entrar(email, clave);
    location.href = "tracker.html";
  } catch (err) {
    entrando = false;
    mensaje(msg, "err", err.message);
  } finally { btn.disabled = false; }
});
