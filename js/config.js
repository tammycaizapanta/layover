// =====================================================
//  CONFIGURACIÓN DE LAYOVER  (lo único que editas)
//  Guía paso a paso: GUIA.md (pasos 2, 3 y 4)
// =====================================================

// 1) Firebase: pega aquí lo que te da la consola (Configuración del proyecto → Tus apps → Web).
//    Mientras diga "TU_API_KEY", la app funciona en MODO LOCAL (datos solo en tu navegador).
export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000"
};

// 2) Correo de la administradora (el único que entra al panel admin).
//    Debe ser el MISMO que pongas en firestore.rules.
export const ADMIN_EMAIL = "tu-correo@gmail.com";

// 3) URL de tu Cloudflare Worker (proxy de la IA). Déjalo vacío para usar el generador de demostración.
//    Ejemplo: "https://layover-ia.tu-usuario.workers.dev"
export const AI_ENDPOINT = "";

// Cambia el nombre de la app cuando quieras.
export const APP_NAME = "Layover";

export const firebaseListo = !firebaseConfig.apiKey.startsWith("TU_");
