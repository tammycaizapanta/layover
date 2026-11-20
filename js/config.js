// 1) Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyCFpFjal2cT-W5Kk4V2T7QX-ePDBcuUlsc",
  authDomain: "layover-8d4ff.firebaseapp.com",
  projectId: "layover-8d4ff",
  storageBucket: "layover-8d4ff.firebasestorage.app",
  messagingSenderId: "730322505594",
  appId: "1:730322505594:web:aeaf5b78a6ed8d3ea490c3"
};

// 2) Correo de la administradora (el único que entra al panel admin).
//    Debe ser el MISMO que pongas en firestore.rules.
export const ADMIN_EMAIL = "tammycaizapanta95@gmail.com";

// 3) URL de tu Cloudflare Worker (proxy de la IA). Déjalo vacío para usar el generador de demostración.
export const AI_ENDPOINT = "";

// Cambia el nombre de la app cuando quieras.
export const APP_NAME = "Layover";

export const firebaseListo = !firebaseConfig.apiKey.startsWith("TU_");