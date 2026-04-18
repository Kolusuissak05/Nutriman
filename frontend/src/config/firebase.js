
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ⬇️  PASTE YOUR FIREBASE CONFIG HERE  ⬇️
const firebaseConfig = {
  apiKey: "AIzaSyC_othdf-wXRZpE2QxHJ3zcAHU1usxe9pA",
  authDomain: "nutriflow-web.firebaseapp.com",
  projectId: "nutriflow-web",
  storageBucket: "nutriflow-web.firebasestorage.app",
  messagingSenderId: "319924906415",
  appId: "1:319924906415:web:43bf6755ade138d280675a"
};

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
