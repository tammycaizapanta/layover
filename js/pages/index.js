import { montarLayout, esc } from "../ui.js";
import { ESCALAS } from "../data.js";

montarLayout("index.html");

document.getElementById("escalas-lista").innerHTML = ESCALAS.map(e => `
  <div class="card" data-aos="fade-up">
    <span style="font-size:2rem" aria-hidden="true">${e.emoji}</span>
    <h3>${e.n}. ${esc(e.nombre)}</h3>
    <p>${esc(e.desc)}</p>
    <span class="pill">${e.min} XP</span>
  </div>`).join("");

if (window.AOS) window.AOS.init({ duration: 600, once: true, disable: () => matchMedia("(prefers-reduced-motion: reduce)").matches });
