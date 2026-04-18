import { useState } from "react";
import { useApp } from "../context/AppContext";
import { calcTDEE, calcTarget, calculateMacros, getExperienceLabel, getExperienceDescription } from "../utils/nutritionCalculator";

const TOTAL_STEPS = 8;

export default function OnboardingPage({ nav, toast }) {
  const { user, updateUser } = useApp();
  const [step, setStep] = useState(0);
  const [ob, setOb] = useState({
    goal: "", gender: "", age: "", height: "", weight: "",
    goalWeight: "", activity: "", mealsPerDay: 0, diet: "",
    experience: "",
  });

  const set = (k, v) => setOb(p => ({ ...p, [k]: v }));

  const merged = { ...user, ...ob, age: +ob.age, height: +ob.height, weight: +ob.weight };
  const tdee   = (ob.age && ob.height && ob.weight && ob.gender && ob.activity) ? calcTDEE(merged) : 0;
  const target = (tdee && ob.experience) ? calcTarget(merged) : tdee ? calcTarget({ ...merged, experience: "beginner" }) : 0;
  const macros = (tdee && ob.experience) ? calculateMacros(merged, tdee) : null;

  async function finish() {
    const finalData = {
      ...ob,
      age:        +ob.age,
      height:     +ob.height,
      weight:     +ob.weight,
      goalWeight: +ob.goalWeight,
      mealsPerDay: ob.mealsPerDay,
      experience: ob.experience || "beginner",
      onboarded:  true,
    };
    await updateUser(finalData);
    toast("You're all set! Welcome to NutriFlow 🎉");
    nav("home");
  }

  const goalLabels = { fat_loss: "Fat Loss", maintain: "Maintenance", muscle_gain: "Muscle Gain" };
  const actLabels  = { sedentary: "Sedentary", light: "Lightly Active", moderate: "Moderately Active", active: "Very Active" };

  const calorieExplain = () => {
    if (!ob.goal || !ob.experience) return "";
    if (ob.goal === "fat_loss") {
      if (ob.experience === "beginner")     return `TDEE ${tdee.toLocaleString()} − 200 (gentle beginner deficit)`;
      if (ob.experience === "intermediate") return `TDEE ${tdee.toLocaleString()} − 300`;
      if (ob.experience === "advanced")     return `TDEE ${tdee.toLocaleString()} − 400`;
    }
    if (ob.goal === "muscle_gain") {
      if (ob.experience === "beginner")     return `TDEE ${tdee.toLocaleString()} + 100 (small beginner surplus)`;
      if (ob.experience === "intermediate") return `TDEE ${tdee.toLocaleString()} + 200`;
      if (ob.experience === "advanced")     return `TDEE ${tdee.toLocaleString()} + 300`;
    }
    return `Exactly your TDEE ${tdee.toLocaleString()}`;
  };

  const steps = [
    // 0 — Goal
    <div key="0">
      <div className="ob-step-icon">🎯</div>
      <h2 className="ob-title">What's your goal?</h2>
      <p className="ob-sub">Your calorie plan will be built around this.</p>
      <div className="ob-grid c3">
        {[["fat_loss","🔥","Fat Loss","Healthy calorie deficit"],
          ["maintain","⚖️","Maintenance","Stay at current weight"],
          ["muscle_gain","💪","Muscle Gain","Build with a surplus"]].map(([v,ico,lbl,desc]) => (
          <div key={v} className={`ob-btn${ob.goal===v?" selected":""}`} onClick={() => set("goal", v)}>
            <span className="ob-icon">{ico}</span>
            <span className="ob-label">{lbl}</span>
            <span className="ob-desc">{desc}</span>
          </div>
        ))}
      </div>
      <div className="ob-nav">
        <button className="btn-primary" style={{flex:1}} onClick={() => setStep(1)} disabled={!ob.goal}>Continue →</button>
      </div>
    </div>,

    // 1 — Gender
    <div key="1">
      <div className="ob-step-icon">🧬</div>
      <h2 className="ob-title">Your gender</h2>
      <p className="ob-sub">Used to accurately calculate your BMR.</p>
      <div className="ob-grid c2">
        {[["male","👨","Male"],["female","👩","Female"]].map(([v,ico,lbl]) => (
          <div key={v} className={`ob-btn${ob.gender===v?" selected":""}`} onClick={() => set("gender", v)}>
            <span className="ob-icon">{ico}</span><span className="ob-label">{lbl}</span>
          </div>
        ))}
      </div>
      <div className="ob-nav">
        <button className="btn-outline" onClick={() => setStep(0)}>← Back</button>
        <button className="btn-primary" style={{flex:2}} onClick={() => setStep(2)} disabled={!ob.gender}>Continue →</button>
      </div>
    </div>,

    // 2 — Measurements
    <div key="2">
      <div className="ob-step-icon">📏</div>
      <h2 className="ob-title">Body measurements</h2>
      <p className="ob-sub">We use these to calculate your exact daily calorie needs.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"11px",marginBottom:".9rem"}}>
        <div className="fg"><label>Age</label>
          <div className="iunit-wrap"><input type="number" value={ob.age} onChange={e=>set("age",e.target.value)} placeholder="25" min="13" max="80"/><span>yrs</span></div>
        </div>
        <div className="fg"><label>Height</label>
          <div className="iunit-wrap"><input type="number" value={ob.height} onChange={e=>set("height",e.target.value)} placeholder="170" min="130" max="220"/><span>cm</span></div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:ob.goal==="fat_loss"?"1fr 1fr":"1fr",gap:"11px"}}>
        <div className="fg"><label>Current Weight</label>
          <div className="iunit-wrap"><input type="number" value={ob.weight} onChange={e=>set("weight",e.target.value)} placeholder="70" min="30" max="250"/><span>kg</span></div>
        </div>
        {ob.goal === "fat_loss" && (
          <div className="fg"><label>Goal Weight</label>
            <div className="iunit-wrap"><input type="number" value={ob.goalWeight} onChange={e=>set("goalWeight",e.target.value)} placeholder="60" min="30" max="250"/><span>kg</span></div>
          </div>
        )}
      </div>
      {ob.goal === "fat_loss" && ob.weight && ob.goalWeight && +ob.goalWeight < +ob.weight && (
        <div style={{background:"var(--gl)",borderRadius:"9px",padding:"9px 12px",fontSize:"12px",color:"var(--gd)",marginTop:".6rem"}}>
          💡 At ~0.5 kg/week, reach your goal in <strong>{Math.round((+ob.weight - +ob.goalWeight)/0.5)} weeks</strong>.
        </div>
      )}
      <div className="ob-nav">
        <button className="btn-outline" onClick={() => setStep(1)}>← Back</button>
        <button className="btn-primary" style={{flex:2}} onClick={() => setStep(3)}
          disabled={!ob.age||!ob.height||!ob.weight||(ob.goal==="fat_loss"&&(!ob.goalWeight||+ob.goalWeight>=+ob.weight))}>
          Continue →
        </button>
      </div>
    </div>,

    // 3 — Activity
    <div key="3">
      <div className="ob-step-icon">🏃</div>
      <h2 className="ob-title">Weekly activity level</h2>
      <p className="ob-sub">Be honest — this determines your TDEE.</p>
      <div className="ob-grid">
        {[["sedentary","🛋️","Sedentary","Little/no exercise, desk job"],
          ["light","🚶","Lightly Active","Exercise 1–3 days/week"],
          ["moderate","🏋️","Moderately Active","Exercise 3–5 days/week"],
          ["active","🔥","Very Active","Hard exercise 6–7 days/week"]].map(([v,ico,lbl,desc]) => (
          <div key={v} className={`ob-btn ob-row-btn${ob.activity===v?" selected":""}`} onClick={() => set("activity", v)}>
            <span style={{fontSize:"20px"}}>{ico}</span>
            <div><span className="ob-label">{lbl}</span><span className="ob-desc">{desc}</span></div>
          </div>
        ))}
      </div>
      <div className="ob-nav">
        <button className="btn-outline" onClick={() => setStep(2)}>← Back</button>
        <button className="btn-primary" style={{flex:2}} onClick={() => setStep(4)} disabled={!ob.activity}>Continue →</button>
      </div>
    </div>,

    // 4 — Experience Level (NEW STEP)
    <div key="4">
      <div className="ob-step-icon">🏅</div>
      <h2 className="ob-title">Your experience level</h2>
      <p className="ob-sub">This sets realistic protein and calorie targets for your level.</p>
      <div className="ob-grid">
        {[["beginner","🌱","Beginner","Less than 1 year of consistent training","1.5g protein/kg"],
          ["intermediate","⚡","Intermediate","1–3 years of consistent training","1.8g protein/kg"],
          ["advanced","🔥","Advanced","3+ years of consistent training","2.1g protein/kg"]].map(([v,ico,lbl,desc,pro]) => (
          <div key={v} className={`ob-btn ob-row-btn${ob.experience===v?" selected":""}`} onClick={() => set("experience", v)}>
            <span style={{fontSize:"20px"}}>{ico}</span>
            <div style={{flex:1}}>
              <span className="ob-label">{lbl}</span>
              <span className="ob-desc">{desc}</span>
            </div>
            <span style={{fontSize:"10px",fontWeight:600,color:"var(--g)",background:"var(--gl)",padding:"2px 7px",borderRadius:"5px",flexShrink:0}}>{pro}</span>
          </div>
        ))}
      </div>
      {ob.experience && tdee > 0 && (
        <div style={{background:"var(--al)",borderRadius:"9px",padding:"9px 12px",fontSize:"12px",color:"var(--ad)",marginTop:".6rem"}}>
          💡 Based on your level: <strong>{ob.experience === "beginner" ? "1.5" : ob.experience === "intermediate" ? "1.8" : "2.1"}g protein/kg</strong>
          {ob.weight ? ` = ${Math.round(+ob.weight * (ob.experience === "beginner" ? 1.5 : ob.experience === "intermediate" ? 1.8 : 2.1))}g protein/day` : ""}
        </div>
      )}
      <div className="ob-nav">
        <button className="btn-outline" onClick={() => setStep(3)}>← Back</button>
        <button className="btn-primary" style={{flex:2}} onClick={() => setStep(5)} disabled={!ob.experience}>Continue →</button>
      </div>
    </div>,

    // 5 — Meals
    <div key="5">
      <div className="ob-step-icon">🍽️</div>
      <h2 className="ob-title">Meals per day</h2>
      <p className="ob-sub">We'll split your calorie budget across your meals.</p>
      <div className="meals-grid">
        {[2,3,4,5].map(n => (
          <div key={n} className={`meal-num-btn${ob.mealsPerDay===n?" selected":""}`} onClick={() => set("mealsPerDay", n)}>
            <span className="mn">{n}</span><span className="ml">meals</span>
          </div>
        ))}
      </div>
      {ob.mealsPerDay > 0 && target > 0 && (
        <div style={{background:"var(--al)",borderRadius:"9px",padding:"9px 12px",fontSize:"12px",color:"var(--ad)",marginTop:".9rem"}}>
          That's roughly <strong>{Math.round(target/ob.mealsPerDay).toLocaleString()} kcal</strong> per meal.
        </div>
      )}
      <div className="ob-nav">
        <button className="btn-outline" onClick={() => setStep(4)}>← Back</button>
        <button className="btn-primary" style={{flex:2}} onClick={() => setStep(6)} disabled={!ob.mealsPerDay}>Continue →</button>
      </div>
    </div>,

    // 6 — Diet
    <div key="6">
      <div className="ob-step-icon">🌱</div>
      <h2 className="ob-title">Dietary preference</h2>
      <p className="ob-sub">We'll filter recommendations to match your diet.</p>
      <div className="ob-grid c2">
        {[["none","🍗","No preference","Show everything"],
          ["vegetarian","🥦","Vegetarian","No meat"],
          ["vegan","🌿","Vegan","Plant-based"],
          ["highprotein","💪","High Protein","Performance focus"]].map(([v,ico,lbl,desc]) => (
          <div key={v} className={`ob-btn${ob.diet===v?" selected":""}`} onClick={() => set("diet", v)}>
            <span className="ob-icon">{ico}</span>
            <span className="ob-label">{lbl}</span>
            <span className="ob-desc">{desc}</span>
          </div>
        ))}
      </div>
      <div className="ob-nav">
        <button className="btn-outline" onClick={() => setStep(5)}>← Back</button>
        <button className="btn-primary" style={{flex:2}} onClick={() => setStep(7)} disabled={!ob.diet}>Continue →</button>
      </div>
    </div>,

    // 7 — Summary
    <div key="7">
      <div className="ob-step-icon">✅</div>
      <h2 className="ob-title">You're all set!</h2>
      <p className="ob-sub">Your personalized nutrition plan is ready.</p>
      <div className="sum-grid">
        {[["Goal",           goalLabels[ob.goal]||"–"],
          ["Experience",     getExperienceLabel(ob.experience)],
          ["Gender",         (ob.gender||"").charAt(0).toUpperCase()+(ob.gender||"").slice(1)],
          ["Age",            ob.age+" yrs"],
          ["Weight",         ob.weight+" kg"],
          ["Height",         ob.height+" cm"],
          ["Activity",       actLabels[ob.activity]||"–"],
          ["Meals/day",      ob.mealsPerDay],
          ["TDEE",           tdee.toLocaleString()+" kcal"],
          ...(ob.goal==="fat_loss"&&ob.goalWeight?[["Goal Weight",ob.goalWeight+" kg"]]:[])
        ].map(([l,v])=>(
          <div className="sum-item" key={l}><div className="sum-lbl">{l}</div><div className="sum-val">{v}</div></div>
        ))}
      </div>

      {/* Calorie target */}
      <div style={{background:"var(--gl)",borderRadius:"13px",padding:"1.1rem",textAlign:"center",marginBottom:"1rem"}}>
        <div style={{fontSize:"12px",color:"var(--gd)",fontWeight:500,marginBottom:".25rem"}}>Your Daily Calorie Target</div>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"2.4rem",color:"var(--gd)"}}>{target.toLocaleString()} kcal</div>
        <div style={{fontSize:"12px",color:"var(--g)",marginTop:".25rem"}}>{calorieExplain()}</div>
      </div>

      {/* Macro breakdown */}
      {macros && (
        <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:"13px",padding:"1rem",marginBottom:"1rem"}}>
          <div style={{fontSize:"12px",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".8rem"}}>
            Daily Macro Targets
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",textAlign:"center"}}>
            {[["Protein",macros.protein+"g","var(--g)"],
              ["Carbs",  macros.carbs+"g",  "var(--am)"],
              ["Fats",   macros.fat+"g",    "var(--co)"]].map(([lbl,val,col])=>(
              <div key={lbl} style={{background:"var(--card)",borderRadius:"9px",padding:"10px"}}>
                <div style={{fontSize:"1.1rem",fontWeight:700,color:col}}>{val}</div>
                <div style={{fontSize:"10px",color:"var(--muted)",marginTop:"2px"}}>{lbl}/day</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:"11px",color:"var(--muted)",textAlign:"center",marginTop:".6rem"}}>
            Based on {getExperienceLabel(ob.experience)} level · {ob.experience === "beginner" ? "1.5" : ob.experience === "intermediate" ? "1.8" : "2.1"}g protein/kg
          </div>
        </div>
      )}

      <div className="ob-nav">
        <button className="btn-outline" onClick={() => setStep(6)}>← Back</button>
        <button className="btn-primary" style={{flex:2}} onClick={finish}>Launch Dashboard 🚀</button>
      </div>
    </div>,
  ];

  return (
    <div className="ob-wrap">
      <div className="ob-prog">
        {Array.from({length: TOTAL_STEPS}).map((_,i) => (
          <div key={i} className={`ob-prog-step${i<step?" done":i===step?" active":""}`} />
        ))}
      </div>
      <div className="ob-card">{steps[step]}</div>
    </div>
  );
}