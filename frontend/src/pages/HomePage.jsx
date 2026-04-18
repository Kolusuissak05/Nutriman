import { useApp } from "../context/AppContext";

export default function HomePage({ nav }) {
  const { user, totals, target, remaining, mealsLeft, orders } = useApp();
  const pct    = Math.min(100, Math.round((totals.cal / target) * 100));
  const circ   = 251;
  const offset = circ - (circ * pct / 100);
  const activeOrder = orders.find(o => o.status !== "delivered");

  return (
    <div>
      {/* ── HERO ── */}
      <div className="hero">
        <div>
          <div className="hero-badge">🥗 Smart Indian Nutrition</div>
          <h1>Eat smarter,<br />reach your <em>goals faster</em></h1>
          <p>
            Track calories with 98 real Indian foods, order from 10+ restaurants,
            and get AI meal recommendations — all built around your body and goals.
          </p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => nav("dashboard")}>📊 Open Dashboard</button>
            <button className="btn-outline" onClick={() => nav("order")}>🛵 Order Food</button>
          </div>
        </div>

        {/* Live mini-dashboard card */}
        <div className="hero-card">
          <div style={{fontSize:"12px",fontWeight:600,color:"var(--muted)",marginBottom:"1rem",textTransform:"uppercase",letterSpacing:".05em"}}>
            Today's Summary
          </div>
          <div style={{textAlign:"center",marginBottom:"1.2rem"}}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="40" fill="none" stroke="#E1F5EE" strokeWidth="10"/>
              <circle cx="65" cy="65" r="40" fill="none" stroke="#1D9E75" strokeWidth="10"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                transform="rotate(-90 65 65)" style={{transition:"stroke-dashoffset .5s"}}/>
              <text x="65" y="61" textAnchor="middle" fontFamily="DM Serif Display,serif" fontSize="18" fill="#085041">{totals.cal}</text>
              <text x="65" y="75" textAnchor="middle" fontFamily="DM Sans,sans-serif"      fontSize="10" fill="#888780">kcal eaten</text>
            </svg>
            <div style={{fontSize:"12px",color:"var(--muted)",marginTop:".3rem"}}>
              {remaining.toLocaleString()} kcal remaining
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"1rem"}}>
            {[
              ["Target",    target.toLocaleString(), "kcal/day",    "var(--am)"],
              ["Protein",   totals.pro+"g",          "eaten today", "var(--g)" ],
              ["Meals Left",mealsLeft,                "to log",      "var(--pu)"],
            ].map(([l,v,s,c]) => (
              <div key={l} style={{background:"var(--bg)",borderRadius:"9px",padding:"9px",textAlign:"center"}}>
                <div style={{fontFamily:"DM Serif Display,serif",fontSize:"1.2rem",color:c}}>{v}</div>
                <div style={{fontSize:"10px",color:"var(--muted)"}}>{l}</div>
                <div style={{fontSize:"10px",color:"var(--sub)"}}>{s}</div>
              </div>
            ))}
          </div>

          {/* Active order tracker */}
          {activeOrder && (
            <div style={{background:"var(--al)",borderRadius:"10px",padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:"12px",fontWeight:600,color:"var(--ad)"}}>
                  {activeOrder.status === "confirmed"        ? "⏳ Order confirmed" :
                   activeOrder.status === "preparing"        ? "👨‍🍳 Being prepared" :
                   activeOrder.status === "out_for_delivery" ? "🛵 On the way!"    : "✅ Delivered"}
                </div>
                <div style={{fontSize:"11px",color:"var(--muted)",marginTop:"2px"}}>{activeOrder.restaurant?.name}</div>
              </div>
              <button className="btn-primary" style={{padding:"5px 12px",fontSize:"11px"}} onClick={()=>nav("tracking")}>
                Track
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="features">
        <div style={{textAlign:"center",marginBottom:".5rem"}}>
          <span className="badge badge-green" style={{fontSize:"12px"}}>Features</span>
        </div>
        <h2 style={{textAlign:"center",fontSize:"2rem",marginBottom:".5rem"}}>Everything in one place</h2>
        <p style={{textAlign:"center",color:"var(--muted)",marginBottom:"2rem",fontSize:"14px",maxWidth:"500px",margin:"0 auto 2rem"}}>
          From calorie tracking to food delivery — all personalized to your body and goals.
        </p>
        <div className="feat-grid">
          {[
            ["🧮","var(--gl)","BMR & TDEE Engine",    "Precise calorie targets from your weight, height, age, and activity level."],
            ["📊","var(--al)","Daily & Weekly Charts", "Visual calorie timeline and 7-day progress bar chart vs your target."],
            ["🤖","var(--pl)","AI Recommendations",   "5 smart Indian food suggestions refreshed by meal time, macros and your goal."],
            ["🛵","var(--gl)","Order & Track",         "Order from 10+ restaurants. Track delivery from confirmed → delivered live."],
            ["📋","var(--cl)","Order History",         "Full history of every order with per-item nutrition and cost breakdown."],
            ["⚡","var(--al)","Auto-Log Calories",     "Food you order is instantly logged to your daily tracker. Zero manual work."],
          ].map(([ico,bg,title,desc]) => (
            <div className="feat-card" key={title}>
              <div className="feat-icon" style={{background:bg}}>{ico}</div>
              <h3 style={{fontFamily:"DM Sans,sans-serif",fontSize:"14px",fontWeight:600,marginBottom:".4rem"}}>{title}</h3>
              <p style={{fontSize:"12px",color:"var(--muted)",lineHeight:1.6}}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div style={{padding:"2rem",maxWidth:"1200px",margin:"0 auto"}}>
        <h2 style={{fontSize:"1.5rem",marginBottom:"1.2rem"}}>Quick Actions</h2>
        <div className="grid-4">
          {[
            ["📊","Dashboard","View today's calories, ring & charts",       "dashboard","var(--gl)","var(--gd)"],
            ["🛵","Order Food","Browse restaurants & place an order",        "order",    "var(--al)","var(--ad)"],
            ["📋","History",   "See all your past orders",                   "history",  "var(--pl)","var(--pd)"],
            ["👤","Profile",   "Update your body stats & calorie target",    "profile",  "var(--cl)","var(--cd)"],
          ].map(([ico,title,desc,page,bg,col]) => (
            <div key={title}
              onClick={()=>nav(page)}
              style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"1.2rem",cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="var(--sh2)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
              <div style={{width:"42px",height:"42px",borderRadius:"10px",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",marginBottom:".9rem"}}>{ico}</div>
              <div style={{fontSize:"14px",fontWeight:600,marginBottom:".3rem",color:col}}>{title}</div>
              <div style={{fontSize:"12px",color:"var(--muted)",lineHeight:1.5}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
