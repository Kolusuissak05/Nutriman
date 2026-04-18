// ─── AppContext.jsx — uses Firebase Auth + Firestore ─────────────────────────
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import {
  registerWithEmail, loginWithEmail, loginWithGoogle, logoutUser,
  getUserProfile, updateUserProfile,
} from "../services/authService";
import {
  getTodayLogs, addFoodLog, deleteFoodLog,
  getWeeklyTotals, getUserOrders, createOrder, updateOrderStatus,
} from "../services/dbService";
import {
  calcBMR, calcTDEE, calcTarget, calculateMacros,
  getProteinMultiplier, getCalorieTarget,
} from "../utils/nutritionCalculator";

const AppContext = createContext();

// ── IST time helpers ──────────────────────────────────────────────────────────
export function getIST() {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
}
export function getISTHour() { return getIST().getHours(); }

const WEEK_DAYS = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("en-IN", { weekday: "short" }));
  }
  return days;
};

export function AppProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [logs,         setLogs]         = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [cart,         setCart]         = useState([]);
  const [weekData,     setWeekData]     = useState(Array(7).fill(0));
  const [weekDays]                      = useState(WEEK_DAYS());
  const [activeOrder,  setActiveOrder]  = useState(null);
  const [dislikedRecs, setDislikedRecs] = useState(new Set());

  // ── Per-log nutrition ───────────────────────────────────────────────────────
  function calForLog(l) { return Math.round((l.food.cal / l.food.minGrams) * l.grams); }
  function proForLog(l) { return +((l.food.pro / l.food.minGrams) * l.grams).toFixed(1); }
  function carForLog(l) { return +((l.food.car / l.food.minGrams) * l.grams).toFixed(1); }
  function fatForLog(l) { return +((l.food.fat / l.food.minGrams) * l.grams).toFixed(1); }

  // ── Listen to Firebase Auth state ───────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            profile.target = profile.target || calcTarget(profile);
            setUser(profile);
            loadUserData(firebaseUser.uid);
          }
        } catch (e) {
          console.error("Profile load error:", e);
        }
      } else {
        setUser(null);
        setLogs([]);
        setOrders([]);
        setWeekData(Array(7).fill(0));
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  async function loadUserData(uid) {
    try {
      const [todayLogs, orderList, weekTotals] = await Promise.all([
        getTodayLogs(uid),
        getUserOrders(uid),
        getWeeklyTotals(uid),
      ]);
      setLogs(todayLogs);
      setOrders(orderList);
      setWeekData(weekTotals);
    } catch (e) {
      console.error("Data load error:", e);
    }
  }

  // ── Auth actions ─────────────────────────────────────────────────────────────
  async function register(name, email, password) {
    setLoading(true);
    try {
      const u = await registerWithEmail(name, email, password);
      setUser(u);
      return { user: u };
    } catch (e) {
      return { error: e.message.replace("Firebase: ", "").replace(/\(auth.*\)/, "").trim() };
    } finally {
      setLoading(false);
    }
  }

  async function loginAPI(email, password) {
    setLoading(true);
    try {
      const u = await loginWithEmail(email, password);
      u.target = u.target || calcTarget(u);
      setUser(u);
      loadUserData(u.uid);
      return { user: u };
    } catch (e) {
      const msg = e.message;
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        return { error: "Incorrect email or password. Please try again." };
      }
      return { error: msg.replace("Firebase: ", "").replace(/\(auth.*\)/, "").trim() };
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
    setLoading(true);
    try {
      const u = await loginWithGoogle();
      u.target = u.target || calcTarget(u);
      setUser(u);
      loadUserData(u.uid);
      return { user: u };
    } catch (e) {
      if (e.code === "auth/popup-closed-by-user") return { error: null };
      return { error: e.message.replace("Firebase: ", "").replace(/\(auth.*\)/, "").trim() };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    logoutUser();
    setUser(null);
    setLogs([]);
    setOrders([]);
    setCart([]);
    setWeekData(Array(7).fill(0));
  }

  async function updateUser(updates) {
    if (!user) return;
    const merged = { ...user, ...updates };
    const newUser = {
      ...merged,
      target: calcTarget(merged),
    };
    try {
      await updateUserProfile(user.uid, newUser);
    } catch (e) {
      console.error("Update profile error:", e);
    }
    setUser(newUser);
  }

  // ── Meal time ────────────────────────────────────────────────────────────────
  function getMealTime() {
    const h = getISTHour();
    if (h >= 6  && h < 11) return "Breakfast";
    if (h >= 11 && h < 15) return "Lunch";
    if (h >= 15 && h < 18) return "Snack";
    return "Dinner";
  }

  // ── Food log ─────────────────────────────────────────────────────────────────
  async function addLog(food, grams) {
    if (!user) return;
    const ist     = getIST();
    const timeStr = ist.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });
    const mt      = getMealTime();

    const tempId    = "tmp_" + Date.now();
    const tempEntry = { id: tempId, food, grams, time: timeStr, mealTime: mt };
    setLogs(prev => [...prev, tempEntry]);

    try {
      const saved = await addFoodLog(user.uid, food, grams, mt, timeStr);
      setLogs(prev => prev.map(l => l.id === tempId ? saved : l));
      setWeekData(prev => {
        const w = [...prev];
        w[6] = Math.round((w[6] || 0) + calForLog(tempEntry));
        return w;
      });
    } catch (e) {
      console.error("Add log error:", e);
      setLogs(prev => prev.filter(l => l.id !== tempId));
    }
  }

  async function removeLog(id) {
    setLogs(prev => prev.filter(l => l.id !== id));
    try {
      await deleteFoodLog(id);
      const totals = await getWeeklyTotals(user.uid);
      setWeekData(totals);
    } catch (e) {
      console.error("Delete log error:", e);
    }
  }

  // ── Cart ──────────────────────────────────────────────────────────────────────
  function addToCart(food, grams, restaurantId) {
    setCart(prev => {
      const ex = prev.find(c => c.food.id === food.id && c.restaurantId === restaurantId);
      if (ex) return prev.map(c =>
        c.food.id === food.id && c.restaurantId === restaurantId
          ? { ...c, grams: c.grams + grams } : c
      );
      return [...prev, { id: Date.now(), food, grams, restaurantId }];
    });
  }
  function removeFromCart(id)         { setCart(prev => prev.filter(c => c.id !== id)); }
  function updateCartGrams(id, grams) { setCart(prev => prev.map(c => c.id === id ? {...c, grams} : c)); }
  function clearCart()                { setCart([]); }

  // ── Place order ───────────────────────────────────────────────────────────────
  async function placeOrder(restaurant) {
    if (!user) return null;
    const items = cart.filter(c => c.restaurantId === restaurant.id);
    const total = items.reduce((s,c) => s + Math.round((c.food.price/c.food.minGrams)*c.grams), 0);
    let order;
    try {
      order = await createOrder(user.uid, restaurant, items, total);
    } catch (e) {
      order = { id:"ORD"+Date.now(), uid:user.uid, restaurant, items, total, status:"confirmed", placedAt: new Date().toISOString() };
    }
    for (const c of items) { await addLog(c.food, c.grams); }
    setOrders(prev => [order, ...prev]);
    setCart(prev => prev.filter(c => c.restaurantId !== restaurant.id));
    setActiveOrder(order);

    const stages = [
      { status:"preparing",        delay: 8000  },
      { status:"out_for_delivery", delay: 20000 },
      { status:"delivered",        delay: 40000 },
    ];
    stages.forEach(({ status, delay }) => {
      setTimeout(async () => {
        const updated = { ...order, status };
        setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
        setActiveOrder(prev => prev?.id === order.id ? updated : prev);
        if (status === "delivered") {
          setTimeout(() => setActiveOrder(prev => prev?.id === order.id ? null : prev), 5000);
        }
        try { await updateOrderStatus(order.id, status); } catch(e) {}
      }, delay);
    });

    return order;
  }

  // ── Derived state ─────────────────────────────────────────────────────────────
  const totals = {
    cal: Math.round(logs.reduce((s,l) => s + calForLog(l), 0)),
    pro: Math.round(logs.reduce((s,l) => s + proForLog(l), 0)),
    car: Math.round(logs.reduce((s,l) => s + carForLog(l), 0)),
    fat: Math.round(logs.reduce((s,l) => s + fatForLog(l), 0)),
  };

  const target      = user?.target || 2000;
  const remaining   = Math.max(0, target - totals.cal);
  const mealsLogged = new Set(logs.map(l => l.mealTime)).size;
  const mealsLeft   = Math.max(0, (user?.mealsPerDay || 3) - mealsLogged);
  const cartCount   = cart.length;
  const cartTotal   = cart.reduce((s,c) => s + Math.round((c.food.price/c.food.minGrams)*c.grams), 0);
  const cartCal     = cart.reduce((s,c) => s + Math.round((c.food.cal/c.food.minGrams)*c.grams), 0);

  // ── Computed macros for current user ─────────────────────────────────────────
  const userMacros = user ? calculateMacros(user, calcTDEE(user)) : { calories:2000, protein:120, fat:55, carbs:225 };

  return (
    <AppContext.Provider value={{
      user, authLoading, loading,
      register, loginAPI, googleLogin, logout, updateUser,
      logs, addLog, removeLog, calForLog, proForLog, carForLog, fatForLog,
      totals, target, remaining, mealsLogged, mealsLeft,
      cart, addToCart, removeFromCart, updateCartGrams, clearCart,
      cartCount, cartTotal, cartCal,
      orders, placeOrder, activeOrder, setActiveOrder,
      weekData, weekDays,
      calcTarget, calcTDEE, calcBMR,
      calculateMacros, getProteinMultiplier, getCalorieTarget,
      userMacros,
      getMealTime, getIST, getISTHour,
      dislikedRecs, setDislikedRecs,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);