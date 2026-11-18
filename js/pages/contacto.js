import { montarLayout, mensaje } from "../ui.js";
import { enviarMensaje, onSesion } from "../firebase.js";

montarLayout("contacto.html");

const f = document.getElementById("form-contacto");
const msg = document.getElementById("c-msg");
const btn = document.getElementById("c-btn");

onSesion(u => {
  if (u) {
    if (!f.querySelector("#c-nombre").value) f.querySelector("#c-nombre").value = u.nombre;
    if (!f.querySelector("#c-email").value) f.querySelector("#c-email").value = u.email;
  }
});

f.addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = document.getElementById("c-nombre").value, email = document.getElementById("c-email").value, texto = document.getElementById("c-mensaje").value;
  if (!nombre.trim() || !texto.trim()) return mensaje(msg, "err", "Completa tu nombre y el mensaje.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return mensaje(msg, "err", "Escribe un correo válido.");
  btn.disabled = true; btn.textContent = "Enviando…";
  try {
    await enviarMensaje({ nombre, email, mensaje: texto });
    document.getElementById("c-mensaje").value = "";
    mensaje(msg, "ok", "¡Mensaje enviado! Gracias por escribirnos.");
  } catch (err) {
    console.error(err);
    mensaje(msg, "err", "No se pudo enviar. Revisa tu conexión e intenta de nuevo.");
  } finally { btn.disabled = false; btn.textContent = "Enviar mensaje"; }
});
