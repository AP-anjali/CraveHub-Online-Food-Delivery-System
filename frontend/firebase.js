import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cravehub-7b81b.firebaseapp.com",
  projectId: "cravehub-7b81b",
  storageBucket: "cravehub-7b81b.firebasestorage.app",
  messagingSenderId: "392915885474",
  appId: "1:392915885474:web:410f1c33e52ce3f3b4a6fb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {app, auth};