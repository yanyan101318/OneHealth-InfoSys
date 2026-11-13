import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDyCp-JyiBK0WDUcc1w9CBL5MHSb7KdmNs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "philhealth-acf09.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "philhealth-acf09",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "philhealth-acf09.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "824871560305",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:824871560305:web:092c5d692e5db26cc7e7d0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-V9B0SWHCF9"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("Firebase initialized", app.name);
