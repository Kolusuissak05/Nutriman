// TrackingPage.jsx
import { useApp } from "../context/AppContext";

const STATUS_STEPS = [
  { key: "confirmed",        label: "Confirmed",      icon: "✓" },
  { key: "preparing",        label: "Preparing",      icon: "👨‍🍳" },
  { key: "out_for_delivery", label: "On the way",     icon: "🛵" },
  { key: "delivered",        label: "Delivered",      icon: "🎉" },
];

export function TrackingPage({ nav }) {
  const { orders, activeOrder } = useApp();
  const order = activeOrder || orders[0];

  if (!order) return (
    <div className="page">
      <div className="page-header"><h2 className="page-title">Order Tracking</h2></div>
      <div style={{ textAlign:"center", padding:"4rem", color:"var(--sub)", fontSize:"14px" }}>
        <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>📭</div>
        No active orders.<br />
        <button className="btn-primary" style={{ marginTop:"1rem" }} onClick={() => nav("order")}>Order Food</button>
      </div>
    </div>
  );

  const stepIdx = STATUS_STEPS.findIndex(s => s.key === order.status);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Order Tracking</h2>
          <div className="page-sub">Order {order.id}</div>
        </div>
        <button className="btn-outline" onClick={() => nav("history")}>View History</button>
      </div>

      {/* Status card */}
      <div className="card" style={{ marginBottom:"1.2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
          <div>
            <div style={{ fontSize:"1.3rem", fontFamily:"DM Serif Display,serif", marginBottom:".3rem" }}>{order.restaurant.emoji} {order.restaurant.name}</div>
            <div style={{ fontSize:"13px", color:"var(--muted)" }}>Placed {new Date(order.placedAt).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })} · ₹{order.total}</div>
          </div>
          <span className={`badge ${order.status==="delivered"?"badge-green":order.status==="out_for_delivery"?"badge-amber":"badge-purple"}`} style={{ fontSize:"12px" }}>
            {STATUS_STEPS.find(s=>s.key===order.status)?.label}
          </span>
        </div>

        <div className="track-status">
          {STATUS_STEPS.map((s, i) => (
            <div key={s.key} className={`track-step${i<=stepIdx?" done":""}${i===stepIdx?" active":""}`}>
              <div className="track-dot">{i <= stepIdx ? s.icon : i + 1}</div>
              <div className="track-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {order.status !== "delivered" && (
          <div style={{ background:"var(--gl)", borderRadius:"10px", padding:"12px 16px", marginTop:"1.2rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"13px", color:"var(--gd)", fontWeight:500 }}>
              {order.status === "confirmed" ? "⏳ Your order is being confirmed…" :
               order.status === "preparing" ? "👨‍🍳 Chef is preparing your food…" :
               "🛵 On the way! Almost there…"}
            </span>
            <span style={{ fontSize:"13px", fontWeight:600, color:"var(--gd)" }}>ETA ~{order.eta} min</span>
          </div>
        )}
      </div>

      {/* Order items */}
      <div className="card">
        <div className="card-title">Order Items</div>
        {order.items.map(c => {
          const cal = Math.round((c.food.cal / c.food.minGrams) * c.grams);
          const price = Math.round((c.food.price / c.food.minGrams) * c.grams);
          return (
            <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize:"13px", fontWeight:600 }}>{c.food.name} ({c.grams}g)</div>
                <div style={{ fontSize:"11px", color:"var(--muted)" }}>
                  <span className="macro-tag macro-p" style={{ marginRight:"4px" }}>P:{Math.round(c.food.pro/c.food.minGrams*c.grams)}g</span>
                  <span className="macro-tag macro-c" style={{ marginRight:"4px" }}>C:{Math.round(c.food.car/c.food.minGrams*c.grams)}g</span>
                  <span className="macro-tag macro-f">F:{Math.round(c.food.fat/c.food.minGrams*c.grams)}g</span>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"13px", fontWeight:600, color:"var(--g)" }}>{cal} kcal</div>
                <div style={{ fontSize:"12px", color:"var(--muted)" }}>₹{price}</div>
              </div>
            </div>
          );
        })}
        <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", fontWeight:600 }}>
          <span>Total</span>
          <span style={{ color:"var(--am)" }}>₹{order.total}</span>
        </div>
      </div>
    </div>
  );
}

export default TrackingPage;

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────

export function HistoryPage({ nav }) {
  const { orders } = useApp();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Order History 📋</h2>
          <div className="page-sub">{orders.length} orders placed</div>
        </div>
        <button className="btn-primary" onClick={() => nav("order")}>Order Again</button>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign:"center", padding:"4rem", color:"var(--sub)", fontSize:"14px" }}>
          <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>📭</div>
          No orders yet.<br />
          <button className="btn-primary" style={{ marginTop:"1rem" }} onClick={() => nav("order")}>Place Your First Order</button>
        </div>
      ) : (
        orders.map(order => {
          const totalCal = order.items.reduce((s,c) => s + Math.round((c.food.cal/c.food.minGrams)*c.grams), 0);
          const totalPro = order.items.reduce((s,c) => s + Math.round((c.food.pro/c.food.minGrams)*c.grams), 0);
          return (
            <div className="order-history-item" key={order.id}>
              <div className="order-hist-head">
                <div>
                  <div style={{ fontSize:"1.1rem", fontFamily:"DM Serif Display,serif", marginBottom:".2rem" }}>{order.restaurant.emoji} {order.restaurant.name}</div>
                  <div className="order-id">{order.id} · {new Date(order.placedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })} {new Date(order.placedAt).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}</div>
                </div>
                <span className={`badge ${order.status==="delivered"?"badge-green":order.status==="out_for_delivery"?"badge-amber":"badge-purple"}`}>{order.status.replace(/_/g," ")}</span>
              </div>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:".8rem" }}>
                {order.items.map(c => (
                  <span key={c.id} className="badge badge-gray">{c.food.name} ({c.grams}g)</span>
                ))}
              </div>
              <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                {[["Total",`₹${order.total}`,"var(--am)"],["Calories",`${totalCal} kcal`,"var(--g)"],["Protein",`${totalPro}g`,"var(--g)"],["Items",order.items.length,"var(--pu)"]].map(([l,v,c]) => (
                  <div key={l} style={{ background:"var(--bg)", borderRadius:"8px", padding:"8px 12px", minWidth:"80px" }}>
                    <div style={{ fontSize:"11px", color:"var(--muted)" }}>{l}</div>
                    <div style={{ fontSize:"14px", fontWeight:700, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
