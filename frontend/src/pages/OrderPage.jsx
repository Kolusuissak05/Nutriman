import { useState } from "react";
import { useApp } from "../context/AppContext";
import { FOODS, RESTAURANTS } from "../data/foods";

function CartSidebar({ open, onClose, nav, toast }) {
  const { cart, removeFromCart, updateCartGrams, cartTotal, cartCal, placeOrder, remaining } = useApp();

  if (!open) return null;

  const grouped = {};
  cart.forEach(c => {
    if (!grouped[c.restaurantId]) grouped[c.restaurantId] = [];
    grouped[c.restaurantId].push(c);
  });

  return (
    <div className="cart-sidebar open">
      <div className="cart-head">
        <h3 style={{ fontFamily:"DM Sans,sans-serif", fontSize:"15px", fontWeight:600 }}>🛒 Your Cart ({cart.length})</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="cart-body">
        {cart.length === 0 ? (
          <div style={{ textAlign:"center", padding:"3rem", color:"var(--sub)", fontSize:"13px" }}>Your cart is empty.<br/>Browse restaurants to add items!</div>
        ) : (
          <>
            {cartCal > remaining && (
              <div style={{ background:"var(--cl)", borderRadius:"9px", padding:"9px 12px", fontSize:"12px", color:"var(--cd)", marginBottom:"1rem" }}>
                ⚠️ Cart calories ({cartCal} kcal) exceed your remaining budget ({remaining} kcal)
              </div>
            )}
            {Object.entries(grouped).map(([rid, items]) => {
              const rest = RESTAURANTS.find(r => r.id === +rid);
              return (
                <div key={rid} style={{ marginBottom:"1rem" }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".04em", marginBottom:".5rem" }}>{rest?.name}</div>
                  {items.map(c => {
                    const calHere = Math.round((c.food.cal / c.food.minGrams) * c.grams);
                    const priceHere = Math.round((c.food.price / c.food.minGrams) * c.grams);
                    return (
                      <div className="cart-item" key={c.id}>
                        <div className="cart-item-info">
                          <div className="cart-item-name">{c.food.name}</div>
                          <div className="cart-item-meta">{calHere} kcal · ₹{priceHere}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"5px" }}>
                            <span style={{ fontSize:"11px", color:"var(--muted)" }}>Grams:</span>
                            <div className="iunit-wrap" style={{ width:"85px" }}>
                              <input type="number" value={c.grams} min={c.food.minGrams} step={c.food.minGrams}
                                onChange={e => updateCartGrams(c.id, Math.max(c.food.minGrams, +e.target.value))}
                                style={{ width:"52px" }}/>
                              <span>g</span>
                            </div>
                          </div>
                        </div>
                        <button className="del-btn" onClick={() => removeFromCart(c.id)}>×</button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>
      {cart.length > 0 && (
        <div className="cart-footer">
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:".5rem" }}>
            <span style={{ fontSize:"13px", color:"var(--muted)" }}>Total Calories</span>
            <span style={{ fontSize:"13px", fontWeight:600, color:"var(--g)" }}>{cartCal} kcal</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1rem" }}>
            <span style={{ fontSize:"14px", fontWeight:600 }}>Total Amount</span>
            <span style={{ fontSize:"14px", fontWeight:700, color:"var(--am)" }}>₹{cartTotal}</span>
          </div>
          {Object.keys(grouped).map(rid => {
            const rest = RESTAURANTS.find(r => r.id === +rid);
            const restItems = grouped[rid];
            const restTotal = restItems.reduce((s,c) => s + Math.round((c.food.price/c.food.minGrams)*c.grams), 0);
            return (
              <button key={rid} className="btn-primary btn-full" style={{ marginBottom:".5rem" }}
                onClick={() => {
                  if (restTotal < rest.minOrder) { toast(`Minimum order ₹${rest.minOrder} for ${rest.name}`, "error"); return; }
                  placeOrder(rest);
                  onClose();
                  nav("tracking");
                  toast(`🛵 Order placed at ${rest.name}!`);
                }}>
                Place Order – {rest.name} (₹{restTotal})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrderPage({ nav, toast }) {
  const { addToCart, cart, remaining, user } = useApp();
  const [query, setQuery] = useState("");
  const [selectedRest, setSelectedRest] = useState(null);
  const [foodSearch, setFoodSearch] = useState("");
  const [foodCat, setFoodCat] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [grams, setGrams] = useState({});

  const cartCount = cart.length;

  // Filter restaurants by query (name or food item)
  const filteredRests = RESTAURANTS.filter(r => {
    if (!query) return true;
    const q = query.toLowerCase();
    if (r.name.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q))) return true;
    const foods = r.foodIds.map(id => FOODS.find(f => f.id === id)).filter(Boolean);
    return foods.some(f => f.name.toLowerCase().includes(q));
  });

  // If a restaurant is selected, show its menu
  const menuFoods = selectedRest
    ? selectedRest.foodIds
        .map(id => FOODS.find(f => f.id === id))
        .filter(Boolean)
        .filter(f => {
          const mq = !foodSearch || f.name.toLowerCase().includes(foodSearch.toLowerCase());
          const mc = foodCat === "All" || f.category === foodCat;
          return mq && mc;
        })
    : [];

  // Food search across ALL restaurants
  const allFoodResults = query && !filteredRests.find(r => r.name.toLowerCase().includes(query.toLowerCase()))
    ? FOODS.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).map(f => ({
        food: f,
        restaurants: RESTAURANTS.filter(r => r.foodIds.includes(f.id)),
      }))
    : [];

  function getG(food) { return grams[food.id] ?? food.minGrams; }
  function setG(foodId, v) { const food = FOODS.find(f=>f.id===foodId); setGrams(p => ({ ...p, [foodId]: Math.max(food.minGrams, +v||food.minGrams) })); }

  function addFood(food, restId) {
    const g = getG(food);
    addToCart(food, g, restId);
    toast(`✓ ${food.name} (${g}g) added to cart!`);
  }

  const restColors = ["#E1F5EE","#FAEEDA","#FAECE7","#E1F5EE","#FAEEDA","#FAECE7","#E1F5EE","#FAEEDA","#FAECE7","#FAECE7"];

  return (
    <div className="page" style={{ paddingRight: cartOpen ? "376px" : "2rem", transition:"padding .3s" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Order Food 🛵</h2>
          <div className="page-sub">Browse restaurants or search any dish</div>
        </div>
        <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
          <div style={{ background:"var(--gl)", borderRadius:"9px", padding:"8px 14px", fontSize:"13px", color:"var(--gd)", fontWeight:500 }}>
            Budget: {remaining.toLocaleString()} kcal remaining
          </div>
          <button className="btn-primary" onClick={() => setCartOpen(p=>!p)}>
            🛒 Cart {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="search-bar" style={{ marginBottom:"1.2rem", maxWidth:"600px" }}>
        <span className="s-icon">🔍</span>
        <input value={query} onChange={e => { setQuery(e.target.value); setSelectedRest(null); }}
          placeholder="Search restaurants or food items (e.g. Biryani, Idli, Green Bowl)…" />
        {query && <button style={{background:"none",border:"none",color:"var(--muted)",fontSize:"16px",cursor:"pointer"}} onClick={()=>setQuery("")}>×</button>}
      </div>

      {/* Food search results — show restaurants that have the searched food */}
      {query && allFoodResults.length > 0 && (
        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ fontSize:"13px", fontWeight:600, color:"var(--muted)", marginBottom:".7rem" }}>Foods matching "{query}"</div>
          {allFoodResults.slice(0,6).map(({ food, restaurants }) => (
            <div key={food.id} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"12px", padding:"1rem", marginBottom:".7rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:".6rem" }}>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:600 }}>{food.name}</div>
                  <div style={{ fontSize:"11px", color:"var(--muted)" }}>{food.category} · {food.serving}</div>
                  <div style={{ display:"flex", gap:"5px", marginTop:"4px" }}>
                    <span className="macro-tag macro-p">P:{food.pro}g</span>
                    <span className="macro-tag macro-c">C:{food.car}g</span>
                    <span className="macro-tag macro-f">F:{food.fat}g</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"14px", fontWeight:700, color:"var(--g)" }}>{food.cal} kcal</div>
                  <div style={{ fontSize:"12px", color:"var(--muted)" }}>₹{food.price}</div>
                </div>
              </div>
              <div style={{ fontSize:"12px", color:"var(--muted)", marginBottom:".5rem" }}>Available at:</div>
              <div style={{ display:"flex", gap:"7px", flexWrap:"wrap" }}>
                {restaurants.map(r => (
                  <button key={r.id} className="chip" style={{ fontSize:"12px" }}
                    onClick={() => { setSelectedRest(r); setQuery(""); setFoodSearch(food.name); }}>
                    {r.emoji} {r.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected restaurant menu */}
      {selectedRest ? (
        <div>
          <button className="btn-outline" style={{ marginBottom:"1rem", padding:"6px 14px", fontSize:"13px" }} onClick={() => { setSelectedRest(null); setFoodSearch(""); }}>
            ← All Restaurants
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.2rem" }}>
            <div style={{ fontSize:"2.5rem" }}>{selectedRest.emoji}</div>
            <div>
              <h2 style={{ fontFamily:"DM Serif Display,serif", fontSize:"1.6rem" }}>{selectedRest.name}</h2>
              <div style={{ fontSize:"13px", color:"var(--muted)" }}>{selectedRest.tags.join(" · ")} · ⭐ {selectedRest.rating} · {selectedRest.time} · Min ₹{selectedRest.minOrder}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:"10px", marginBottom:"1rem" }}>
            <div className="search-bar" style={{ flex:1 }}>
              <span className="s-icon">🔍</span>
              <input value={foodSearch} onChange={e=>setFoodSearch(e.target.value)} placeholder="Search menu…"/>
            </div>
            <div className="chips-row" style={{ margin:0 }}>
              {["All","Diet Breakfast","Diet Lunch","Diet Dinner","Sandwich","Bowl","Wrap","Main Dish","Breakfast","Snack","Staple","Lentil Dish"].map(c => (
                <button key={c} className={`chip${foodCat===c?" active":""}`} onClick={()=>setFoodCat(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"9px" }}>
            {menuFoods.map(f => {
              const g = getG(f);
              const cal = Math.round((f.cal/f.minGrams)*g);
              const price = Math.round((f.price/f.minGrams)*g);
              const overBudget = f.cal > remaining;
              return (
                <div key={f.id} style={{ background:"var(--card)", border:`1.5px solid ${overBudget?"var(--co)":"var(--border)"}`, borderRadius:"13px", padding:"1rem 1.2rem", display:"flex", alignItems:"center", gap:"12px", opacity: overBudget ? .6 : 1 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"14px", fontWeight:600, marginBottom:"2px" }}>{f.name} {overBudget && <span style={{fontSize:"11px",color:"var(--co)"}}>⚠ exceeds budget</span>}</div>
                    <div style={{ fontSize:"11px", color:"var(--muted)", marginBottom:"4px" }}>{f.serving} · {f.diet==="Non-Vegetarian"?"🍗 Non-Veg":"🌿 Veg"}</div>
                    <div style={{ display:"flex", gap:"5px" }}>
                      <span className="macro-tag macro-p">P:{Math.round(f.pro/f.minGrams*g)}g</span>
                      <span className="macro-tag macro-c">C:{Math.round(f.car/f.minGrams*g)}g</span>
                      <span className="macro-tag macro-f">F:{Math.round(f.fat/f.minGrams*g)}g</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:"14px", fontWeight:700, color:"var(--g)" }}>{cal} kcal</div>
                      <div style={{ fontSize:"13px", fontWeight:600, color:"var(--am)" }}>₹{price}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
                      <div className="iunit-wrap" style={{ width:"95px" }}>
                        <input type="number" value={g} min={f.minGrams} step={f.minGrams} onChange={e=>setG(f.id,e.target.value)} style={{ width:"55px" }}/>
                        <span>g</span>
                      </div>
                      <div style={{ fontSize:"9px", color:"var(--sub)" }}>min {f.minGrams}g</div>
                    </div>
                    <button className="btn-primary" style={{ padding:"8px 16px" }} onClick={() => addFood(f, selectedRest.id)}>Add</button>
                  </div>
                </div>
              );
            })}
            {menuFoods.length === 0 && <div style={{ textAlign:"center", padding:"2rem", color:"var(--sub)", fontSize:"13px" }}>No items match your search</div>}
          </div>
        </div>
      ) : (
        /* Restaurant grid */
        <div>
          <div style={{ fontSize:"14px", fontWeight:600, marginBottom:"1rem", color:"var(--muted)" }}>
            {query ? `${filteredRests.length} restaurants matching "${query}"` : "All Restaurants"}
          </div>
          <div className="grid-3">
            {filteredRests.map((r, i) => (
              <div key={r.id} className="rest-card" onClick={() => setSelectedRest(r)}>
                <div className="rest-img" style={{ background: restColors[i % restColors.length] }}>{r.emoji}</div>
                <div className="rest-body">
                  <div className="rest-name">{r.name}</div>
                  <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", margin:".3rem 0 .5rem" }}>
                    {r.tags.map(t => <span key={t} className="badge badge-green" style={{ fontSize:"10px" }}>{t}</span>)}
                  </div>
                  <div className="rest-meta">
                    <span>⭐ {r.rating} · {r.time}</span>
                    <span style={{ background:"var(--gl)", color:"var(--gd)", fontSize:"11px", fontWeight:600, padding:"3px 8px", borderRadius:"5px" }}>Min ₹{r.minOrder}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredRests.length === 0 && (
            <div style={{ textAlign:"center", padding:"3rem", color:"var(--sub)", fontSize:"14px" }}>No restaurants found for "{query}"</div>
          )}
        </div>
      )}

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} nav={nav} toast={toast} />
    </div>
  );
}
