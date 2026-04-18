// ─── Firestore Database Service ───────────────────────────────────────────────
import {
  collection, doc, addDoc, getDocs, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, setDoc, getDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ── FOOD LOGS ─────────────────────────────────────────────────────────────────

// Get today's food logs for a user
export async function getTodayLogs(uid) {
  const today = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "foodLogs"),
    where("uid", "==", uid),
    where("logDate", "==", today),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Add a food log entry
export async function addFoodLog(uid, food, grams, mealTime, timeStr) {
  const today = new Date().toISOString().split("T")[0];
  const entry = {
    uid,
    food,       // full food object
    grams,
    mealTime,
    time: timeStr,
    logDate: today,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, "foodLogs"), entry);
  return { id: ref.id, ...entry };
}

// Delete a food log entry
export async function deleteFoodLog(logId) {
  await deleteDoc(doc(db, "foodLogs", logId));
}

// Get last 7 days totals for weekly chart
export async function getWeeklyTotals(uid) {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const q = query(
      collection(db, "foodLogs"),
      where("uid", "==", uid),
      where("logDate", "==", dateStr)
    );
    const snap = await getDocs(q);
    const total = snap.docs.reduce((s, doc) => {
      const l = doc.data();
      return s + Math.round((l.food.cal / l.food.minGrams) * l.grams);
    }, 0);
    result.push(total);
  }
  return result;
}

// ── ORDERS ────────────────────────────────────────────────────────────────────

// Get all orders for a user (newest first)
export async function getUserOrders(uid) {
  const q = query(
    collection(db, "orders"),
    where("uid", "==", uid),
    orderBy("placedAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Create a new order
export async function createOrder(uid, restaurant, items, total) {
  const orderId = "ORD" + Date.now();
  const order = {
    uid,
    restaurant,
    items,
    total,
    status: "confirmed",
    placedAt: serverTimestamp(),
  };
  await setDoc(doc(db, "orders", orderId), order);
  return { id: orderId, ...order };
}

// Update order status
export async function updateOrderStatus(orderId, status) {
  await setDoc(doc(db, "orders", orderId), { status }, { merge: true });
}

// Get single order
export async function getOrder(orderId) {
  const snap = await getDoc(doc(db, "orders", orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
