// Capa de datos: usa Firebase (Auth + Firestore) si está configurado en config.js.
// Si no, usa un MODO LOCAL (localStorage) para que puedas desarrollar y probar sin internet.
import { firebaseConfig, firebaseListo, ADMIN_EMAIL } from "./config.js";
import { RETOS_BASE } from "./data.js";
import { normalizar, estadoInicial } from "./gamificacion.js";

export const modo = firebaseListo ? "nube" : "local";

const FB = "https://www.gstatic.com/firebasejs/10.14.1/";
let fb = null;          // módulos de Firebase (solo modo nube)
let auth = null, db = null;
let usuarioActual = null;
const oyentes = [];
let listo = null;

// ---------- utilidades locales ----------
const lj = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const sj = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin espacio / bloqueado */ } };

async function hash(txt) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch { return btoa(txt); }
}

function armarUsuario(uid, email, nombre) {
  return { uid, email, nombre: nombre || email.split("@")[0], esAdmin: email.toLowerCase() === ADMIN_EMAIL.toLowerCase() };
}

function avisar() { oyentes.forEach(cb => { try { cb(usuarioActual); } catch (e) { console.error(e); } }); }

// ---------- inicio ----------
export function iniciar() {
  if (listo) return listo;
  listo = (async () => {
    if (modo === "local") {
      const s = lj("layover_sesion", null);
      usuarioActual = s ? armarUsuario(s.uid, s.email, s.nombre) : null;
      return;
    }
    const [app, au, st] = await Promise.all([
      import(FB + "firebase-app.js"),
      import(FB + "firebase-auth.js"),
      import(FB + "firebase-firestore.js")
    ]);
    fb = { ...app, ...au, ...st };
    const a = fb.initializeApp(firebaseConfig);
    auth = fb.getAuth(a);
    db = fb.getFirestore(a);
    await new Promise(res => {
      let primera = true;
      fb.onAuthStateChanged(auth, u => {
        usuarioActual = u ? armarUsuario(u.uid, u.email, u.displayName) : null;
        if (primera) { primera = false; res(); } else avisar();
      });
    });
  })();
  return listo;
}

export function onSesion(cb) {
  oyentes.push(cb);
  iniciar().then(() => cb(usuarioActual));
}

export function usuario() { return usuarioActual; }

// ---------- autenticación ----------
const MENSAJES_AUTH = {
  "auth/invalid-email": "El correo no es válido.",
  "auth/email-already-in-use": "Ese correo ya tiene una cuenta. Prueba iniciar sesión.",
  "auth/weak-password": "La contraseña es muy corta (mínimo 6 caracteres).",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
  "auth/network-request-failed": "No hay conexión a internet."
};
const errAuth = e => new Error(MENSAJES_AUTH[e.code] || "No se pudo completar la acción. Intenta de nuevo.");

export async function registrar(nombre, email, clave) {
  await iniciar();
  email = email.trim().toLowerCase();
  nombre = nombre.trim();
  if (clave.length < 6) throw new Error("La contraseña debe tener mínimo 6 caracteres.");
  if (modo === "local") {
    const us = lj("layover_usuarios", {});
    if (us[email]) throw new Error("Ese correo ya tiene una cuenta. Prueba iniciar sesión.");
    us[email] = { nombre, clave: await hash(clave), creado: Date.now() };
    sj("layover_usuarios", us);
    sj("layover_sesion", { uid: email, email, nombre });
    usuarioActual = armarUsuario(email, email, nombre);
    avisar();
    return usuarioActual;
  }
  try {
    const cred = await fb.createUserWithEmailAndPassword(auth, email, clave);
    await fb.updateProfile(cred.user, { displayName: nombre });
    await fb.setDoc(fb.doc(db, "usuarios", cred.user.uid), {
      nombre, email, xp: 0, creado: fb.serverTimestamp(), actualizado: fb.serverTimestamp(),
      progreso: estadoInicial()
    });
    usuarioActual = armarUsuario(cred.user.uid, email, nombre);
    avisar();
    return usuarioActual;
  } catch (e) { throw errAuth(e); }
}

export async function entrar(email, clave) {
  await iniciar();
  email = email.trim().toLowerCase();
  if (modo === "local") {
    const u = lj("layover_usuarios", {})[email];
    if (!u || u.clave !== (await hash(clave))) throw new Error("Correo o contraseña incorrectos.");
    sj("layover_sesion", { uid: email, email, nombre: u.nombre });
    usuarioActual = armarUsuario(email, email, u.nombre);
    avisar();
    return usuarioActual;
  }
  try {
    const cred = await fb.signInWithEmailAndPassword(auth, email, clave);
    usuarioActual = armarUsuario(cred.user.uid, cred.user.email, cred.user.displayName);
    avisar();
    return usuarioActual;
  } catch (e) { throw errAuth(e); }
}

export async function salir() {
  await iniciar();
  if (modo === "local") { localStorage.removeItem("layover_sesion"); usuarioActual = null; avisar(); return; }
  await fb.signOut(auth);
}

// ---------- progreso del tracker ----------
const claveLocal = u => "layover_progreso_" + (u ? u.email : "invitado");

export function cargarLocal(u) { return normalizar(lj(claveLocal(u), null)); }
export function guardarLocal(u, estado) { sj(claveLocal(u), estado); }

export async function cargarNube(u) {
  await iniciar();
  if (modo === "local" || !u) return cargarLocal(u);
  const snap = await fb.getDoc(fb.doc(db, "usuarios", u.uid));
  return normalizar(snap.exists() ? snap.data().progreso : null);
}

export async function guardarNube(u, estado) {
  guardarLocal(u, estado);
  if (modo === "local" || !u) return;
  await fb.setDoc(fb.doc(db, "usuarios", u.uid), {
    nombre: u.nombre, email: u.email, xp: estado.xp, actualizado: fb.serverTimestamp(), progreso: estado
  }, { merge: true });
}

// ---------- contacto ----------
export async function enviarMensaje({ nombre, email, mensaje }) {
  await iniciar();
  const datos = { nombre: nombre.trim().slice(0, 80), email: email.trim().slice(0, 120), mensaje: mensaje.trim().slice(0, 1000) };
  if (modo === "local") {
    const arr = lj("layover_mensajes", []);
    arr.unshift({ id: "m" + Date.now(), ...datos, fecha: Date.now() });
    sj("layover_mensajes", arr);
    return;
  }
  await fb.addDoc(fb.collection(db, "mensajes"), { ...datos, fecha: fb.serverTimestamp() });
}

const aMs = f => (f && f.toMillis ? f.toMillis() : typeof f === "number" ? f : null);

export async function listarMensajes() {
  await iniciar();
  if (modo === "local") return lj("layover_mensajes", []);
  const q = fb.query(fb.collection(db, "mensajes"), fb.orderBy("fecha", "desc"));
  const s = await fb.getDocs(q);
  return s.docs.map(d => ({ id: d.id, ...d.data(), fecha: aMs(d.data().fecha) }));
}

export async function borrarMensaje(id) {
  await iniciar();
  if (modo === "local") { sj("layover_mensajes", lj("layover_mensajes", []).filter(m => m.id !== id)); return; }
  await fb.deleteDoc(fb.doc(db, "mensajes", id));
}

// ---------- usuarios (solo admin) ----------
export async function listarUsuarios() {
  await iniciar();
  if (modo === "local") {
    const us = lj("layover_usuarios", {});
    return Object.keys(us).map(email => ({
      id: email, nombre: us[email].nombre, email, creado: us[email].creado,
      xp: cargarLocal({ email }).xp
    }));
  }
  const s = await fb.getDocs(fb.collection(db, "usuarios"));
  return s.docs.map(d => { const x = d.data(); return { id: d.id, nombre: x.nombre, email: x.email, xp: x.xp || 0, creado: aMs(x.creado) }; })
    .sort((a, b) => b.xp - a.xp);
}

// ---------- retos del catálogo ----------
export async function listarRetos() {
  await iniciar();
  if (modo === "local") return lj("layover_retos", null) || RETOS_BASE;
  try {
    const s = await fb.getDocs(fb.collection(db, "retos"));
    if (s.empty) return RETOS_BASE;
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("No se pudieron leer los retos, uso los de ejemplo.", e);
    return RETOS_BASE;
  }
}

export async function guardarReto(reto) {
  await iniciar();
  const datos = {
    emoji: (reto.emoji || "🎯").slice(0, 4),
    titulo: reto.titulo.trim().slice(0, 80),
    descripcion: reto.descripcion.trim().slice(0, 300),
    dificultad: reto.dificultad
  };
  if (modo === "local") {
    const arr = lj("layover_retos", null) || RETOS_BASE.slice();
    const i = arr.findIndex(r => r.id === reto.id);
    if (i >= 0) arr[i] = { id: reto.id, ...datos };
    else arr.push({ id: "r" + Date.now().toString(36), ...datos });
    sj("layover_retos", arr);
    return;
  }
  if (reto.id) await fb.setDoc(fb.doc(db, "retos", reto.id), datos);
  else await fb.addDoc(fb.collection(db, "retos"), datos);
}

export async function borrarReto(id) {
  await iniciar();
  if (modo === "local") { sj("layover_retos", (lj("layover_retos", null) || RETOS_BASE).filter(r => r.id !== id)); return; }
  await fb.deleteDoc(fb.doc(db, "retos", id));
}

// Copia los retos de ejemplo a la base de datos (para poder editarlos desde el admin).
export async function cargarRetosEjemplo() {
  await iniciar();
  if (modo === "local") { sj("layover_retos", RETOS_BASE.slice()); return; }
  for (const r of RETOS_BASE) {
    const { id, ...datos } = r;
    await fb.setDoc(fb.doc(db, "retos", id), datos);
  }
}
