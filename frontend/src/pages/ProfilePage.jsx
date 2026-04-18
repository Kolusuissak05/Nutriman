import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { calcTDEE, calcTarget, calculateMacros, getExperienceLabel } from "../utils/nutritionCalculator";

export default function ProfilePage({ toast }) {
  const { user, updateUser, logout } = useApp();
  const [form, setForm] = useState({ ...user });

  useEffect(() => { if (user) setForm({ ...user }); }, [user]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const tmpTDEE   = form.age && form.height && form.weight ? calcTDEE(form) : 0;
  const tmpTarget = tmpTDEE ? calcTarget(form) : 0;
  const tmpMacros = tmpTDEE ? calculateMacros(form, tmpTDEE) : null;
  const bmi       = form.weight && form.height ? (form.weight / ((form.height/100)**2)).toFixed(1) : "–";

  async function save() {
    await updateUser({
      ...form,
      age:        +form.age,
      weight:     +form.weight,
      height:     +form.height,
      mealsPerDay:+form.mealsPerDay,
      experience: form.experience || "beginner",
    });
    toast("✅ Profile saved!");
  }

  if (!user) return null;

  const goalLabels = { fat_loss:"🔥 Fat Loss", maintain:"⚖️ Maintenance", muscle_gain:"💪 Muscle Gain" };
  const initials   = user.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() || "U";

  const calorieExplain = () => {
    if (!tmpTDEE) return "";
    const exp = form.experience || "beginner";
    if (form.goal === "fat_loss") {
      const deficit = exp === "beginner" ? 200 : exp === "intermediate" ? 300 : 400;
      return `TDEE ${tmpTDEE.toLocaleString()} − ${deficit}`;
    }
    if (form.goal === "muscle_gain") {
      const surplus = exp === "beginner" ? 100 : exp === "intermediate" ? 200 : 300;
      return `TDEE ${tmpTDEE.toLocaleString()} + ${surplus}`;
    }
    return `Exactly your TDEE ${tmpTDEE.toLocaleString()}`;
  };

  return (
    <div className="page" style={{maxWidth:"700px"}}>
      <div className="page-header"><h2 className="page-title">Profile</h2></div>

      {/* Profile card */}
      <div className="card" style={{textAlign:"center",marginBottom:"1.2rem"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"50%",background:"var(--gl)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"DM Serif Display,serif",fontSize:"1.8rem",color:"var(--gd)",margin:"0 auto .9rem"}}>{initials}</div>
        <div style={{fontFamily:"DM Serif Display,serif",fontSize:"1.5rem",marginBottom:".3rem"}}>{user.name}</div>
        <div style={{fontSize:"13px",color:"var(--muted)",marginBottom:".5rem"}}>
          Daily Target: <span style={{color:"var(--g)",fontWeight:600}}>{user.target?.toLocaleString()} kcal</span>
        </div>
        <div style={{display:"flex",gap:"8px",justifyContent:"center",flexWrap:"wrap",marginBottom:".8rem"}}>
          <span className="badge badge-green">{goalLabels[user.goal] || "–"}</span>
          <span className="badge badge-purple" style={{fontSize:"11px"}}>
            🏅 {getExperienceLabel(user.experience || "beginner")}
          </span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"9px",marginTop:".8rem"}}>
          {[["Weight",user.weight+" kg"],["BMI",bmi],["Meals/day",user.mealsPerDay]].map(([l,v])=>(
            <div key={l} style={{background:"var(--bg)",borderRadius:"9px",padding:"10px",textAlign:"center"}}>
              <div style={{fontFamily:"DM Serif Display,serif",fontSize:"1.2rem",color:"var(--gd)"}}>{v}</div>
              <div style={{fontSize:"10px",color:"var(--muted)",marginTop:"1px"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <div style={{fontSize:"14px",fontWeight:600,marginBottom:"1.2rem"}}>Edit Profile</div>

        <div className="grid-2" style={{marginBottom:"10px"}}>
          <div className="fg"><label>Full Name</label><input value={form.name||""} onChange={e=>set("name",e.target.value)}/></div>
          <div className="fg"><label>Age</label><input type="number" value={form.age||""} onChange={e=>set("age",e.target.value)}/></div>
        </div>
        <div className="grid-2" style={{marginBottom:"10px"}}>
          <div className="fg"><label>Weight (kg)</label><input type="number" value={form.weight||""} onChange={e=>set("weight",e.target.value)}/></div>
          <div className="fg"><label>Height (cm)</label><input type="number" value={form.height||""} onChange={e=>set("height",e.target.value)}/></div>
        </div>
        <div className="grid-2" style={{marginBottom:"10px"}}>
          <div className="fg"><label>Gender</label>
            <select value={form.gender||"male"} onChange={e=>set("gender",e.target.value)}>
              <option value="male">Male</option><option value="female">Female</option>
            </select>
          </div>
          <div className="fg"><label>Activity Level</label>
            <select value={form.activity||"light"} onChange={e=>set("activity",e.target.value)}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly Active</option>
              <option value="moderate">Moderately Active</option>
              <option value="active">Very Active</option>
            </select>
          </div>
        </div>
        <div className="grid-2" style={{marginBottom:"10px"}}>
          <div className="fg"><label>Goal</label>
            <select value={form.goal||"maintain"} onChange={e=>set("goal",e.target.value)}>
              <option value="fat_loss">Fat Loss</option>
              <option value="maintain">Maintenance</option>
              <option value="muscle_gain">Muscle Gain</option>
            </select>
          </div>
          <div className="fg"><label>Experience Level</label>
            <select value={form.experience||"beginner"} onChange={e=>set("experience",e.target.value)}>
              <option value="beginner">Beginner (&lt;1 year)</option>
              <option value="intermediate">Intermediate (1–3 years)</option>
              <option value="advanced">Advanced (3+ years)</option>
            </select>
          </div>
        </div>
        <div className="grid-2" style={{marginBottom:"10px"}}>
          <div className="fg"><label>Meals per Day</label>
            <select value={form.mealsPerDay||3} onChange={e=>set("mealsPerDay",+e.target.value)}>
              {[2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="fg"><label>Diet Preference</label>
            <select value={form.diet||"none"} onChange={e=>set("diet",e.target.value)}>
              <option value="none">No Preference</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="highprotein">High Protein</option>
            </select>
          </div>
        </div>

        {/* Live preview */}
        {tmpTarget > 0 && (
          <>
            <div style={{background:"var(--gl)",borderRadius:"11px",padding:"1rem",textAlign:"center",marginBottom:"1rem"}}>
              <div style={{fontSize:"12px",color:"var(--gd)",marginBottom:".25rem"}}>Calculated Daily Target</div>
              <div style={{fontFamily:"DM Serif Display,serif",fontSize:"2.2rem",color:"var(--gd)"}}>{tmpTarget.toLocaleString()} kcal</div>
              <div style={{fontSize:"12px",color:"var(--g)",marginTop:".25rem"}}>{calorieExplain()}</div>
            </div>

            {tmpMacros && (
              <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:"11px",padding:"1rem",marginBottom:"1rem"}}>
                <div style={{fontSize:"11px",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:".7rem"}}>
                  Macro Targets · {getExperienceLabel(form.experience||"beginner")}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",textAlign:"center"}}>
                  {[["Protein",tmpMacros.protein+"g","var(--g)"],
                    ["Carbs",  tmpMacros.carbs+"g",  "var(--am)"],
                    ["Fats",   tmpMacros.fat+"g",     "var(--co)"]].map(([lbl,val,col])=>(
                    <div key={lbl} style={{background:"var(--card)",borderRadius:"8px",padding:"8px"}}>
                      <div style={{fontSize:"1rem",fontWeight:700,color:col}}>{val}</div>
                      <div style={{fontSize:"10px",color:"var(--muted)",marginTop:"2px"}}>{lbl}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:"11px",color:"var(--muted)",textAlign:"center",marginTop:".5rem"}}>
                  Protein: {form.experience==="beginner"?"1.5":form.experience==="intermediate"?"1.8":"2.1"}g/kg × {form.weight}kg
                </div>
              </div>
            )}
          </>
        )}

        <button className="btn-primary btn-full" onClick={save}>Save Changes</button>
        <button className="btn-outline btn-full" style={{marginTop:".6rem",borderColor:"var(--co)",color:"var(--co)"}} onClick={logout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}