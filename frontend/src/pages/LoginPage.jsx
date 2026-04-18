import { useState } from "react";
import { useApp } from "../context/AppContext";

const GoogleSVG = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage({ nav, toast }) {
  const { loginAPI, register, googleLogin: googleLoginFn, loading } = useApp();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errs, setErrs] = useState({});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function validate() {
    const e = {};
    if (mode === "signup" && !form.name.trim()) e.name = "Enter your name";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "Min 6 characters";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    if (mode === "login") {
      const { user, error } = await loginAPI(form.email, form.password);
      if (error) { toast(error, "error"); return; }
      toast("Welcome back, " + user.name.split(" ")[0] + "! 👋");
      nav(user.onboarded ? "home" : "onboard");
    } else {
      const { user, error } = await register(form.name, form.email, form.password);
      if (error) { toast(error, "error"); return; }
      toast("Account created! Let's set up your profile.");
      nav("onboard");
    }
  }

  async function googleLogin() {
    const { user, error } = await googleLoginFn();
    if (error) { toast(error, "error"); return; }
    if (!user) return; // user cancelled popup
    toast("Welcome, " + user.name.split(" ")[0] + "! 👋");
    nav(user.onboarded ? "home" : "onboard");
  }

  function handleKey(e) { if (e.key === "Enter") submit(); }

  const pills = [
    ["🧮", "BMR & TDEE Engine",     "Personalized calorie targets"],
    ["🤖", "AI Chatbot + Recs",     "Food, recipes & lifestyle advice"],
    ["🛵", "Order & Track",         "Real-time delivery tracking"],
    ["📊", "Charts & History",      "Weekly progress visualization"],
    ["🥗", "191 Indian Foods",      "Diet, wraps, bowls & more"],
    ["💬", "Recipe Assistant",      "Instant recipes from AI chatbot"],
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: "420px", flexShrink: 0,
        background: "linear-gradient(160deg, #085041 0%, #0d7a5f 60%, #1D9E75 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "3rem 2.5rem", position: "relative", overflow: "hidden",
      }}>
        {/* decorative circles */}
        <div style={{ position:"absolute", top:"-90px", right:"-90px", width:"300px", height:"300px", borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"-70px", left:"-70px", width:"260px", height:"260px", borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>

        {/* Logo */}
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.6rem", color:"#fff", display:"flex", alignItems:"center", gap:"10px", position:"relative", zIndex:1 }}>
          <div style={{ width:"12px", height:"12px", background:"#9FE1CB", borderRadius:"50%" }}/>
          NutriFlow
        </div>

        {/* Tagline */}
        <div style={{ position:"relative", zIndex:1 }}>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"2.2rem", color:"#fff", lineHeight:1.2, marginBottom:".8rem" }}>
            Eat smart,<br/><em style={{ fontStyle:"italic", color:"#9FE1CB" }}>reach goals.</em>
          </h2>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,.65)", lineHeight:1.75, marginBottom:"1.8rem" }}>
            Track calories, get AI-powered meal recommendations, order from 12+ restaurants, and hit your fitness targets — all in one app.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {pills.map(([icon, title, desc]) => (
              <div key={title} style={{ background:"rgba(255,255,255,.09)", borderRadius:"12px", padding:"11px 14px", display:"flex", alignItems:"center", gap:"12px", backdropFilter:"blur(4px)" }}>
                <div style={{ width:"36px", height:"36px", background:"rgba(255,255,255,.14)", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:600, color:"#fff", marginBottom:"2px" }}>{title}</div>
                  <div style={{ fontSize:"11px", color:"rgba(255,255,255,.65)" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize:"11px", color:"rgba(255,255,255,.4)", position:"relative", zIndex:1 }}>
          NutriFlow © 2025 · Made for India 🇮🇳
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"2.5rem", background:"#F7F9F7" }}>
        <div style={{ width:"100%", maxWidth:"400px" }}>

          {/* Tab switcher */}
          <div style={{ display:"flex", background:"#E8EDE8", borderRadius:"12px", padding:"4px", marginBottom:"2rem" }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex:1, padding:"10px", borderRadius:"9px", border:"none",
                background: mode===m ? "#fff" : "transparent",
                color: mode===m ? "#085041" : "#6B7B6E",
                fontFamily:"'DM Sans',sans-serif", fontSize:"14px", fontWeight:600,
                cursor:"pointer", transition:"all .2s",
                boxShadow: mode===m ? "0 1px 6px rgba(0,0,0,.1)" : "none",
              }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.8rem", marginBottom:".3rem" }}>
            {mode === "login" ? "Welcome back 👋" : "Create your account"}
          </h2>
          <p style={{ fontSize:"13px", color:"#6B7B6E", marginBottom:"1.6rem" }}>
            {mode === "login"
              ? "Enter your credentials to continue"
              : "Start your health journey today — free forever"}
          </p>

          {/* Name (signup only) */}
          {mode === "signup" && (
            <div className="fg">
              <label>Full Name</label>
              <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Alex Kumar" onKeyDown={handleKey}/>
              {errs.name && <span className="err show">{errs.name}</span>}
            </div>
          )}

          <div className="fg">
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@example.com" onKeyDown={handleKey}/>
            {errs.email && <span className="err show">{errs.email}</span>}
          </div>

          <div className="fg">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="••••••••" onKeyDown={handleKey}/>
            {errs.password && <span className="err show">{errs.password}</span>}
          </div>

          {mode === "login" && (
            <div style={{ textAlign:"right", marginTop:"-.4rem", marginBottom:".8rem" }}>
              <span style={{ fontSize:"12px", color:"#1D9E75", cursor:"pointer", fontWeight:500 }}>Forgot password?</span>
            </div>
          )}

          <button className="btn-primary btn-full" onClick={submit} disabled={loading} style={{ marginBottom:".8rem", padding:"13px" }}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <div className="divider">or continue with</div>

          <button className="google-btn" onClick={googleLogin} disabled={loading}>
            <GoogleSVG /> Continue with Google
          </button>

          {mode === "login" && (
            <div style={{ textAlign:"center", marginTop:"1.2rem", fontSize:"13px", color:"#6B7B6E" }}>
              Don't have an account?{" "}
              <span style={{ color:"#1D9E75", fontWeight:600, cursor:"pointer" }} onClick={()=>setMode("signup")}>Sign up free</span>
            </div>
          )}
          {mode === "signup" && (
            <div style={{ textAlign:"center", marginTop:"1.2rem", fontSize:"13px", color:"#6B7B6E" }}>
              Already have an account?{" "}
              <span style={{ color:"#1D9E75", fontWeight:600, cursor:"pointer" }} onClick={()=>setMode("login")}>Sign in</span>
            </div>
          )}

          <p style={{ textAlign:"center", fontSize:"11px", color:"#A8B8AC", marginTop:"1.5rem", lineHeight:1.6 }}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
