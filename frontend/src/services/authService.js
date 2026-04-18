// ─── Firebase Authentication Service ─────────────────────────────────────────
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../config/firebase";

// Register new user with email + password
export async function registerWithEmail(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  // Create profile document in Firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    onboarded: false,
    createdAt: serverTimestamp(),
  });
  return { uid: cred.user.uid, name, email, onboarded: false };
}

// Login with email + password
export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) {
    // New user (shouldn't happen but safety net)
    return { uid: cred.user.uid, name: cred.user.displayName || email, email, onboarded: false };
  }
  return { uid: cred.user.uid, ...snap.data() };
}

// Google Sign-In popup
export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const ref  = doc(db, "users", cred.user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // First-time Google login — create profile
    const profile = {
      name: cred.user.displayName || "User",
      email: cred.user.email,
      onboarded: false,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return { uid: cred.user.uid, ...profile };
  }
  return { uid: cred.user.uid, ...snap.data() };
}

// Sign out
export async function logoutUser() {
  await signOut(auth);
}

// Get user profile from Firestore
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

// Update user profile in Firestore
export async function updateUserProfile(uid, updates) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  const snap = await getDoc(ref);
  return { uid, ...snap.data() };
}
