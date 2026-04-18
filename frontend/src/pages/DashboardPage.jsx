import { useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { FOODS } from "../data/foods";
import { calculateMacros, calcTDEE, getProteinMultiplier } from "../utils/nutritionCalculator";
import AIChatbot from "../components/AIChatbot";

function getIST() {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
}
function getISTHour() { return getIST().getHours(); }

function logName(l)  { return l?.food?.name  || l?.name  || "Unknown food"; }
function logCal(l)   { if (!l?.food) return l?.cal || 0; return Math.round((l.food.cal / l.food.minGrams) * l.grams); }
function logPro(l)   { if (!l?.food) return 0; return +((l.food.pro / l.food.minGrams) * l.grams).toFixed(1); }
function logCar(l)   { if (!l?.food) return 0; return +((l.food.car / l.food.minGrams) * l.grams).toFixed(1); }
function logFat(l)   { if (!l?.food) return 0; return +((l.food.fat / l.food.minGrams) * l.grams).toFixed(1); }

// ─── CALORIE RING ─────────────────────────────────────────────────────────────
function CalorieRing({ pct, cal }) {
  const circ   = 251;
  const offset = circ - (circ * Math.min(100, pct) / 100);
  const color  = pct > 100 ? "#D85A30" : pct > 80 ? "#EF9F27" : "#1D9E75";
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r="40" fill="none" stroke="#E1F5EE" strokeWidth="9"/>
      <circle cx="55" cy="55" r="40" fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 55 55)" style={{transition:"stroke-dashoffset .5s"}}/>
      <text x="55" y="51" textAnchor="middle" fontFamily="DM Serif Display,serif" fontSize="16" fill="#085041">{cal}</text>
      <text x="55" y="64" textAnchor="middle" fontFamily="DM Sans,sans-serif" fontSize="9" fill="#888780">kcal eaten</text>
    </svg>
  );
}

// ─── MACRO BARS ───────────────────────────────────────────────────────────────
function MacroBars({ pro, car, fat, userMacros }) {
  const bars = [
    ["Protein", pro, userMacros.protein, "var(--g)"],
    ["Carbs",   car, userMacros.carbs,   "var(--am)"],
    ["Fats",    fat, userMacros.fat,     "var(--co)"],
  ];
  return (
    <div style={{marginTop:".6rem"}}>
      {bars.map(([lbl,val,tgt,col]) => (
        <div key={lbl} style={{marginBottom:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
            <span style={{fontSize:"11px",fontWeight:600,color:col}}>{lbl}</span>
            <span style={{fontSize:"11px",color:"var(--muted)"}}>
              <strong style={{color:col}}>{val}g</strong>
              <span style={{color:"var(--sub)"}}> / {tgt}g</span>
              <span style={{color:val>=tgt?"var(--g)":"var(--sub)",marginLeft:"4px",fontSize:"10px"}}>
                {val>=tgt ? "✓" : `${Math.round(tgt-val)}g left`}
              </span>
            </span>
          </div>
          <div style={{height:"7px",background:"var(--border)",borderRadius:"4px",overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:"4px",background:col,width:Math.min(100,Math.round(val/Math.max(1,tgt)*100))+"%",transition:"width .5s ease"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BAR CHART ────────────────────────────────────────────────────────────────
function BarChart({ data, labels, target, height = 120 }) {
  const max = Math.max(...data, target * 1.1, 1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:"6px",height,position:"relative"}}>
      <div style={{position:"absolute",left:0,right:0,bottom:(target/max*height),borderTop:"2px dashed var(--am)",pointerEvents:"none",zIndex:1}}/>
      {data.map((v, i) => (
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
          <div style={{flex:1,width:"100%",display:"flex",alignItems:"flex-end"}}>
            <div style={{
              width:"100%",borderRadius:"5px 5px 0 0",
              background: i === data.length-1 ? "var(--g)" : "rgba(29,158,117,.35)",
              height: v > 0 ? Math.max(3, Math.round(v/max*height))+"px" : "2px",
              transition:"height .4s ease",
            }} title={`${labels[i]}: ${v} kcal`}/>
          </div>
          <span style={{fontSize:"9px",color:"var(--sub)",whiteSpace:"nowrap"}}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DONUT CHART ──────────────────────────────────────────────────────────────
function DonutChart({ pro, car, fat }) {
  const total = pro + car + fat || 1;
  const segs  = [{val:pro,color:"#1D9E75",lbl:"Protein"},{val:car,color:"#EF9F27",lbl:"Carbs"},{val:fat,color:"#D85A30",lbl:"Fats"}];
  let cum = -Math.PI/2;
  const r=38, cx=50, cy=50, inner=22;
  const paths = segs.map(s => {
    const a=(s.val/total)*2*Math.PI;
    const x1=cx+r*Math.cos(cum), y1=cy+r*Math.sin(cum);
    cum+=a;
    const x2=cx+r*Math.cos(cum), y2=cy+r*Math.sin(cum);
    const xi1=cx+inner*Math.cos(cum-a), yi1=cy+inner*Math.sin(cum-a);
    const xi2=cx+inner*Math.cos(cum),   yi2=cy+inner*Math.sin(cum);
    const lg=a>Math.PI?1:0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${lg} 0 ${xi1} ${yi1} Z`;
  });
  return (
    <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        {paths.map((d,i)=><path key={i} d={d} fill={segs[i].color}/>)}
        <text x="50" y="54" textAnchor="middle" fontFamily="DM Sans" fontSize="11" fill="var(--muted)">Macros</text>
      </svg>
      <div>
        {segs.map(s=>(
          <div key={s.lbl} style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"2px",background:s.color,flexShrink:0}}/>
            <span style={{fontSize:"11px",color:"var(--muted)"}}>{s.lbl}</span>
            <span style={{fontSize:"11px",fontWeight:600,marginLeft:"auto",paddingLeft:"12px"}}>{s.lbl==="Protein"?pro:s.lbl==="Carbs"?car:fat}g</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FOOD MODAL ───────────────────────────────────────────────────────────────
function FoodModal({ onClose, toast }) {
  const { addLog } = useApp();
  const [q,     setQ]     = useState("");
  const [cat,   setCat]   = useState("All");
  const [grams, setGrams] = useState({});

  const cats = ["All","Diet Foods","Breakfast","Main Dish","Snack","Sandwich","Bowl","Wrap","Beverage"];

  const filtered = FOODS.filter(f => {
    const mq   = !q || f.name.toLowerCase().includes(q.toLowerCase()) || f.category.toLowerCase().includes(q.toLowerCase());
    const isDiet = f.category === "Diet Breakfast" || f.category === "Diet Lunch" || f.category === "Diet Dinner";
    const mc   = cat === "All" ? true : cat === "Diet Foods" ? isDiet : f.category === cat;
    return mq && mc;
  });

  function getG(f)   { return grams[f.id] ?? f.minGrams; }
  function setG(f,v) { setGrams(p => ({...p, [f.id]: Math.max(f.minGrams, +v || f.minGrams)})); }

  function add(f) {
    const g = getG(f);
    addLog(f, g);
    toast(`✓ ${f.name} (${g}g) added!`);
    setGrams(p => ({...p, [f.id]: f.minGrams}));
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>Add Food to Log</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{padding:"1rem 1.2rem",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <div className="search-bar">
            <span className="s-icon">🔍</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search Indian foods…" autoFocus/>
          </div>
          <div className="chips-row" style={{marginTop:".7rem",marginBottom:0}}>
            {cats.map(c=><button key={c} className={`chip${cat===c?" active":""}`} onClick={()=>setCat(c)}>{c}</button>)}
          </div>
        </div>
        <div className="modal-body" style={{padding:".5rem .8rem"}}>
          {filtered.length === 0 && (
            <div style={{textAlign:"center",padding:"2rem",color:"var(--sub)",fontSize:"13px"}}>No foods found</div>
          )}
          {filtered.map(f => {
            const g   = getG(f);
            const cal = Math.round((f.cal/f.minGrams)*g);
            const pri = Math.round((f.price/f.minGrams)*g);
            return (
              <div key={f.id}
                style={{display:"flex",alignItems:"center",padding:"9px 10px",borderRadius:"9px",gap:"10px",transition:"background .12s"}}
                onMouseEnter={e=>e.currentTarget.style.background="var(--bg)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"13px",fontWeight:600,marginBottom:"2px"}}>{f.name}</div>
                  <div style={{fontSize:"11px",color:"var(--muted)"}}>{f.category} · {f.serving}</div>
                  <div style={{display:"flex",gap:"5px",marginTop:"3px"}}>
                    <span className="macro-tag macro-p">P:{Math.round(f.pro/f.minGrams*g)}g</span>
                    <span className="macro-tag macro-c">C:{Math.round(f.car/f.minGrams*g)}g</span>
                    <span className="macro-tag macro-f">F:{Math.round(f.fat/f.minGrams*g)}g</span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
                  <div style={{textAlign:"right",minWidth:"56px"}}>
                    <div style={{fontSize:"13px",fontWeight:700,color:"var(--g)"}}>{cal} kcal</div>
                    <div style={{fontSize:"11px",color:"var(--muted)"}}>₹{pri}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
                    <div className="iunit-wrap" style={{width:"96px"}}>
                      <input type="number" value={g} min={f.minGrams} step={f.minGrams}
                        onChange={e=>setG(f,e.target.value)} style={{width:"55px"}}/>
                      <span>g</span>
                    </div>
                    <div style={{fontSize:"9px",color:"var(--sub)"}}>min {f.minGrams}g</div>
                  </div>
                  <button className="btn-primary" style={{padding:"7px 13px",fontSize:"12px"}} onClick={()=>add(f)}>Add</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── AI RECS ──────────────────────────────────────────────────────────────────
function AIRecs({ nav, toast, onOpenChat }) {
  const { addLog, user, remaining, totals, target, mealsLeft, dislikedRecs, setDislikedRecs, userMacros } = useApp();
  const [pool, setPool] = useState([]);

  const generate = useCallback(() => {
    const h        = getISTHour();
    const mealTime = h < 11 ? "Breakfast" : h < 15 ? "Lunch" : h < 18 ? "Snack" : "Dinner";
    const perMeal  = Math.max(100, remaining / Math.max(1, mealsLeft));
    const needPro  = totals.pro < userMacros.protein * 0.6;

    const scored = FOODS
      .filter(f => {
        const dietOk = user?.diet === "vegetarian" ? f.diet === "Vegetarian"
                     : user?.diet === "vegan"       ? f.diet === "Vegetarian"
                     : true;
        return dietOk && f.cal <= perMeal * 1.5 && f.cal >= 40;
      })
      .map(f => {
        let score = Math.max(0, 100 - Math.abs(f.cal - perMeal) * 0.4);
        if (needPro) score += f.pro * 2.5;
        if (mealTime === "Breakfast" && ["Breakfast","Diet Breakfast"].includes(f.category)) score += 35;
        if (mealTime === "Lunch"     && ["Main Dish","Lentil Dish","Staple","Diet Lunch","Bowl"].includes(f.category)) score += 30;
        if (mealTime === "Dinner"    && ["Main Dish","Lentil Dish","Diet Dinner","Bowl","Wrap"].includes(f.category)) score += 30;
        if (mealTime === "Snack"     && ["Snack","Beverage","Sandwich","Wrap"].includes(f.category)) score += 30;
        if (user?.goal === "fat_loss"    && f.cal < 200) score += 20;
        if (user?.goal === "fat_loss"    && ["Diet Breakfast","Diet Lunch","Diet Dinner"].includes(f.category)) score += 25;
        if (user?.goal === "muscle_gain" && f.pro > 15)  score += 25;
        score += (f.id * 13 + Math.floor(Date.now() / 30000)) % 40;
        return {...f, score};
      })
      .sort((a,b) => b.score - a.score);

    setPool(scored);
    setDislikedRecs(new Set());
  }, [remaining, totals.pro, user, target, mealsLeft, userMacros, setDislikedRecs]);

  useState(() => { generate(); }, []);

  const visible = pool.filter((_,i) => !dislikedRecs.has(i)).slice(0, 5);

  function addRec(f) {
    addLog(f, f.minGrams);
    toast(`✓ ${f.name} logged! (${f.cal} kcal)`);
    setTimeout(generate, 300);
  }
  function dislike(idx) { setDislikedRecs(prev => new Set([...prev, idx])); }

  const h        = getISTHour();
  const mealTime = h < 11 ? "Breakfast" : h < 15 ? "Lunch" : h < 18 ? "Snack" : "Dinner";

  function reason(f) {
    if (user?.goal === "fat_loss"    && f.cal < 180) return "🔥 Great for fat loss";
    if (user?.goal === "muscle_gain" && f.pro > 15)  return "💪 High protein for muscle gain";
    if (f.cal <= remaining / Math.max(1, mealsLeft)) return "✓ Fits your calorie budget";
    if (f.category === mealTime)                      return `🌅 Perfect for ${mealTime.toLowerCase()}`;
    if (f.pro > 12)                                   return "💪 Good protein source";
    return "✓ Balanced option for today";
  }

  return (
    <div className="card" style={{marginBottom:"1.2rem"}}>
      <div className="card-title">
        <span>🤖 AI Recommendations <span className="badge badge-purple" style={{fontSize:"10px"}}>Smart</span></span>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"11px",color:"var(--muted)"}}>{mealTime} · {remaining.toLocaleString()} kcal left</span>
          <button className="btn-outline" style={{padding:"5px 12px",fontSize:"11px"}} onClick={generate}>↻ Refresh</button>
        </div>
      </div>
      {visible.length === 0 ? (
        <div style={{textAlign:"center",padding:"1.5rem",color:"var(--sub)",fontSize:"13px"}}>
          No suggestions right now — try refreshing!
        </div>
      ) : (
        <div className="grid-5">
          {visible.map((f) => {
            const idx = pool.indexOf(f);
            return (
              <div className="ai-card" key={f.id}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:".4rem"}}>
                  <span style={{fontSize:"10px",fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".04em"}}>{f.category}</span>
                  <span className="ai-cal-pill">{f.cal} kcal</span>
                </div>
                <div style={{fontSize:"13px",fontWeight:600,marginBottom:".2rem",lineHeight:1.3}}>{f.name}</div>
                <div style={{fontSize:"11px",color:"var(--muted)",marginBottom:".5rem"}}>{f.serving} · {f.diet==="Non-Vegetarian"?"🍗":"🌿"}</div>
                <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:".5rem"}}>
                  <span className="macro-tag macro-p">P {f.pro}g</span>
                  <span className="macro-tag macro-c">C {f.car}g</span>
                  <span className="macro-tag macro-f">F {f.fat}g</span>
                </div>
                <div style={{fontSize:"12px",fontWeight:600,color:"var(--am)",marginBottom:".6rem"}}>₹{f.price}</div>
                <div style={{display:"flex",gap:"5px",flexDirection:"column"}}>
                  <div style={{display:"flex",gap:"5px"}}>
                    <button style={{flex:1,background:"var(--g)",color:"#fff",border:"none",borderRadius:"7px",padding:"6px",fontSize:"11px",fontWeight:600,cursor:"pointer"}}
                      onClick={()=>addRec(f)}>+ Log</button>
                    <button style={{background:"var(--cl)",color:"var(--co)",border:"none",borderRadius:"7px",padding:"6px 9px",fontSize:"14px",cursor:"pointer"}}
                      onClick={()=>dislike(idx)} title="Not interested">✕</button>
                  </div>
                  <div style={{display:"flex",gap:"5px"}}>
                    <button style={{flex:1,background:"var(--al)",color:"var(--ad)",border:"none",borderRadius:"7px",padding:"6px",fontSize:"11px",fontWeight:600,cursor:"pointer"}}
                      onClick={()=>nav("order")}>🛵 Order</button>
                    <button style={{flex:1,background:"var(--pl)",color:"var(--pd)",border:"none",borderRadius:"7px",padding:"6px",fontSize:"11px",fontWeight:600,cursor:"pointer"}}
                      onClick={()=>onOpenChat && onOpenChat("Recipe for "+f.name)}>📖 Recipe</button>
                  </div>
                </div>
                <div className="ai-reason">{reason(f)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export default function DashboardPage({ nav, toast }) {
  const { user, logs, removeLog, totals, target, remaining, mealsLeft, weekData, weekDays, userMacros } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [chatOpen,  setChatOpen]  = useState(false);
  const [chatQuery, setChatQuery] = useState("");

  function openChat(query) { setChatQuery(query || ""); setChatOpen(true); }

  const pct = Math.min(100, Math.round((totals.cal / target) * 100));

  const hourBuckets = Array(8).fill(0);
  const hourLabels  = ["6AM","8AM","10AM","12PM","2PM","4PM","6PM","8PM"];
  logs.forEach(l => {
    const timeStr = l.time || "12:00 PM";
    let h = parseInt(timeStr.split(":")[0]);
    const isPM = timeStr.toLowerCase().includes("pm");
    const isAM = timeStr.toLowerCase().includes("am");
    if (isPM && h !== 12) h += 12;
    if (isAM && h === 12) h = 0;
    const b = Math.max(0, Math.min(7, Math.floor((h - 6) / 2)));
    hourBuckets[b] += logCal(l);
  });

  const h        = getISTHour();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">{greeting}, {user?.name?.split(" ")[0]} 👋</h2>
          <div className="page-sub">
            {getIST().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
          </div>
        </div>
        <button className="btn-primary" onClick={()=>setShowModal(true)}>+ Add Food</button>
      </div>

      {/* Stats row */}
      <div className="grid-5" style={{marginBottom:"1.2rem"}}>
        {[
          ["Consumed",  totals.cal.toLocaleString(),  "kcal today",  "c-g"],
          ["Remaining", remaining.toLocaleString(),   "kcal left",   ""],
          ["Target",    target.toLocaleString(),      "kcal/day",    "c-a"],
          ["Protein",
            `${totals.pro}g / ${userMacros.protein}g`,
            totals.pro >= userMacros.protein ? "✓ Target reached!" : `${Math.max(0, userMacros.protein - totals.pro)}g more to go`,
            "c-g"],
          ["Meals Left", mealsLeft, "to log today", "c-p"],
        ].map(([l,v,s,c])=>(
          <div className="stat-card" key={l}>
            <div className="stat-label">{l}</div>
            <div className={`stat-value ${c}`}>{v}</div>
            <div className="stat-sub">{s}</div>
          </div>
        ))}
      </div>

      {/* Macro targets card */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"1rem 1.3rem",marginBottom:"1.2rem"}}>
        <div style={{fontSize:"12px",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:".9rem"}}>
          Today's Macro Targets
          <span style={{fontSize:"11px",fontWeight:400,color:"var(--sub)",marginLeft:"6px",textTransform:"none"}}>
            based on your {user?.experience || "beginner"} level · {getProteinMultiplier(user?.experience)}g protein/kg
          </span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem"}}>
          {[
            {n:"Protein", eaten:totals.pro, need:userMacros.protein, col:"var(--g)"},
            {n:"Carbs",   eaten:totals.car, need:userMacros.carbs,   col:"var(--am)"},
            {n:"Fats",    eaten:totals.fat, need:userMacros.fat,     col:"var(--co)"},
          ].map(m => {
            const pct  = Math.min(100, Math.round(m.eaten / Math.max(1,m.need) * 100));
            const left = Math.max(0, m.need - m.eaten);
            return (
              <div key={m.n}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px",alignItems:"baseline"}}>
                  <span style={{fontSize:"12px",fontWeight:700,color:m.col}}>{m.n}</span>
                  <span style={{fontSize:"11px",color:"var(--muted)"}}>
                    <strong style={{color:m.col}}>{m.eaten}g</strong>
                    <span style={{color:"var(--sub)"}}> / {m.need}g</span>
                  </span>
                </div>
                <div style={{height:"8px",background:"var(--border)",borderRadius:"4px",overflow:"hidden",marginBottom:"4px"}}>
                  <div style={{height:"100%",borderRadius:"4px",background:m.col,width:pct+"%",transition:"width .5s ease"}}/>
                </div>
                <div style={{fontSize:"10px",color:left===0?"var(--g)":"var(--muted)",fontWeight:left===0?600:400}}>
                  {left===0 ? "✓ Target hit!" : `${left}g still needed`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meals-left banner */}
      <div style={{
        background: mealsLeft > 0 ? "var(--gl)" : "var(--al)",
        border:`1px solid ${mealsLeft>0?"var(--gm)":"#FAC775"}`,
        borderRadius:"10px", padding:"10px 16px", marginBottom:"1.2rem",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <span style={{fontSize:"13px",color:mealsLeft>0?"var(--gd)":"var(--ad)",fontWeight:500}}>
          {mealsLeft > 0
            ? `🍽️ ${mealsLeft} meal${mealsLeft>1?"s":""} left today · ~${Math.round(remaining/Math.max(1,mealsLeft)).toLocaleString()} kcal each`
            : `✅ All ${user?.mealsPerDay||3} meals logged for today!`}
        </span>
        <button className="btn-primary" style={{padding:"6px 14px",fontSize:"12px"}} onClick={()=>nav("order")}>
          Order Food 🛵
        </button>
      </div>

      {/* Log + Ring */}
      <div className="grid-2" style={{marginBottom:"1.2rem"}}>
        <div className="card">
          <div className="card-title">
            Today's Food Log
            <span style={{fontSize:"11px",color:"var(--muted)",fontWeight:400}}>{logs.length} item{logs.length!==1?"s":""} logged</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"7px",maxHeight:"300px",overflowY:"auto"}}>
            {logs.length === 0 ? (
              <div style={{textAlign:"center",padding:"2rem",color:"var(--sub)",fontSize:"13px"}}>
                No meals logged yet — click <strong>+ Add Food</strong> above!
              </div>
            ) : logs.map(l => (
              <div className="log-item" key={l.id}>
                <div style={{flex:1,minWidth:0}}>
                  <div className="log-name">
                    {logName(l)}
                    <span style={{fontSize:"11px",color:"var(--muted)",fontWeight:400}}> ({l.grams}g)</span>
                  </div>
                  <div className="log-meta">
                    {l.time}
                    {l.mealTime && (
                      <span className={`mt-badge mt-${l.mealTime[0]}`} style={{marginLeft:"5px"}}>{l.mealTime}</span>
                    )}
                  </div>
                  {l.food && (
                    <div style={{fontSize:"10px",color:"var(--muted)",marginTop:"2px"}}>
                      P:{Math.round(logPro(l))}g · C:{Math.round(logCar(l))}g · F:{Math.round(logFat(l))}g
                    </div>
                  )}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"8px",flexShrink:0}}>
                  <span className="log-cal">{logCal(l)} kcal</span>
                  <button className="del-btn" onClick={()=>removeLog(l.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Calorie Ring</div>
          <div style={{display:"flex",gap:"1rem",alignItems:"center"}}>
            <div className="ring-wrap">
              <CalorieRing pct={pct} cal={totals.cal}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",width:"100%"}}>
                <div style={{background:"var(--bg)",borderRadius:"8px",padding:"8px",textAlign:"center"}}>
                  <div style={{fontSize:"1rem",fontWeight:600,color:"var(--g)"}}>{pct}%</div>
                  <div style={{fontSize:"10px",color:"var(--muted)"}}>of goal</div>
                </div>
                <div style={{background:"var(--bg)",borderRadius:"8px",padding:"8px",textAlign:"center"}}>
                  <div style={{fontSize:"1rem",fontWeight:600}}>{remaining.toLocaleString()}</div>
                  <div style={{fontSize:"10px",color:"var(--muted)"}}>remaining</div>
                </div>
              </div>
            </div>
            <div style={{flex:1}}>
              <MacroBars pro={totals.pro} car={totals.car} fat={totals.fat} userMacros={userMacros}/>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{marginBottom:"1.2rem"}}>
        <div className="card">
          <div className="card-title">
            Today — Calorie Timeline
            <span style={{fontSize:"11px",color:"var(--muted)",fontWeight:400}}>by hour</span>
          </div>
          <BarChart data={hourBuckets.map(v=>Math.round(v))} labels={hourLabels}
            target={target/Math.max(1,user?.mealsPerDay||3)} height={120}/>
        </div>
        <div className="card">
          <div className="card-title">
            Macros Today
            <span style={{fontSize:"11px",color:"var(--muted)",fontWeight:400}}>Protein · Carbs · Fats</span>
          </div>
          <DonutChart pro={totals.pro} car={totals.car} fat={totals.fat}/>
          <MacroBars pro={totals.pro} car={totals.car} fat={totals.fat} userMacros={userMacros}/>
        </div>
      </div>

      {/* Weekly */}
      <div className="card" style={{marginBottom:"1.2rem"}}>
        <div className="card-title">
          Weekly Overview
          <span style={{fontSize:"11px",color:"var(--muted)",fontWeight:400}}>last 7 days vs target (dashed line)</span>
        </div>
        <BarChart data={weekData} labels={weekDays} target={target} height={130}/>
      </div>

      <AIRecs nav={nav} toast={toast} onOpenChat={openChat}/>

      {showModal && <FoodModal onClose={()=>setShowModal(false)} toast={toast}/>}

      <button
        onClick={()=>setChatOpen(p=>!p)}
        style={{
          position:"fixed", bottom:"24px", right:"24px",
          width:"56px", height:"56px", borderRadius:"50%",
          background:"linear-gradient(135deg,#085041,#1D9E75)",
          border:"none", color:"#fff", fontSize:"24px",
          cursor:"pointer", boxShadow:"0 4px 20px rgba(8,80,65,.35)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:999, transition:"transform .2s",
        }}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        title="AI Health Assistant"
      >
        {chatOpen ? "✕" : "🤖"}
      </button>

      {chatOpen && <AIChatbot onClose={()=>setChatOpen(false)} initialQuery={chatQuery}/>}
    </div>
  );
}