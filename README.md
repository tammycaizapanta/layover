# Layover — organiza tu estudio como un viaje

App web para estudiantes: registran tareas, ganan XP, mantienen su racha, desbloquean insignias y suben de **escala**. Incluye un generador de planes de estudio con IA y retos que se pueden abrir con etiquetas NFC.

Proyecto final · Ruta básica · Jóvenes creaTIvos 2026.

**Sitio publicado:** `https://tammycaizapanta.github.io/layover/`  

## Funciones

| Entregable | Dónde está |
|---|---|
| Landing / inicio | `index.html` |
| Catálogo (retos, insignias, escalas) | `catalogo.html` |
| Contacto real (guarda en Firestore) | `contacto.html` |
| Login + panel admin | `login.html`, `admin.html` |
| IA aplicada (plan de estudio) | `tracker.html` + `js/ia.js` + `worker/worker.js` |
| Publicación | GitHub Pages, responsive |

Extras: NFC con URL (`tracker.html?reto=ID`) y lectura Web NFC en Android, modo oscuro, animaciones con AOS.

## Tecnologías

HTML, CSS y JavaScript (módulos ES) · Firebase Authentication y Firestore · Cloudflare Worker + Gemini API (proxy para no exponer la llave) · AOS · GitHub Pages.

## Estructura

```
index.html catalogo.html tracker.html contacto.html login.html admin.html
css/styles.css
js/config.js         ← único archivo que se edita para conectar servicios
js/gamificacion.js   ← lógica de XP, escalas, rachas e insignias (sin DOM)
js/firebase.js       ← login, Firestore y modo local de respaldo
js/store.js  js/ia.js  js/ui.js  js/data.js
js/pages/*.js        ← un script por página
worker/worker.js     ← proxy de la IA (Cloudflare)
firestore.rules      ← reglas de seguridad de la base de datos
```

## Cómo correrlo en tu computador

Los módulos ES necesitan un servidor local (no abras el .html con doble clic):

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

Sin configurar Firebase funciona en **modo local** (datos en tu navegador). Pasos para conectarlo y publicarlo: ver `GUIA.md`.
