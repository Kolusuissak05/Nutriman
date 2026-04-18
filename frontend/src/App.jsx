import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import OrderPage from "./pages/OrderPage";
import { TrackingPage, HistoryPage } from "./pages/TrackingPage";
import ProfilePage from "./pages/ProfilePage";
import NavBar from "./components/NavBar";
import Toast from "./components/Toast";
import "./App.css";

function AppInner() {
  const { user, authLoading } = useApp();
  const [page,  setPage]  = useState("home");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };
  const nav = (p) => setPage(p);

  // Show loading spinner while Firebase checks session
  if (authLoading) {
    return (
      <div style={{
        minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", background:"var(--bg)",
        fontFamily:"'DM Sans',sans-serif", gap:"1rem",
      }}>
        <div style={{
          width:"48px", height:"48px", borderRadius:"50%",
          border:"3px solid var(--border)", borderTopColor:"var(--g)",
          animation:"spin .8s linear infinite",
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontSize:"14px", color:"var(--muted)" }}>Loading NutriFlow…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage nav={nav} toast={showToast} />
        {toast && <Toast {...toast} />}
      </>
    );
  }

  if (!user.onboarded) {
    return (
      <>
        <OnboardingPage nav={nav} toast={showToast} />
        {toast && <Toast {...toast} />}
      </>
    );
  }

  const pages = {
    home:      HomePage,
    dashboard: DashboardPage,
    order:     OrderPage,
    tracking:  TrackingPage,
    history:   HistoryPage,
    profile:   ProfilePage,
  };
  const Page = pages[page] || HomePage;

  return (
    <div className="app-root">
      <NavBar page={page} nav={nav} toast={showToast} />
      <main className="app-main">
        <Page nav={nav} toast={showToast} />
      </main>
      {toast && <Toast {...toast} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
