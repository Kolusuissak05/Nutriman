import { useApp } from "../context/AppContext";

export default function NavBar({ page, nav }) {
  const { user, cartCount } = useApp();
  if (!user) return null;

  const initials = user.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";

  const links = [
    { key: "home",      label: "Home",      icon: "🏠" },
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "order",     label: "Order Food",icon: "🛵" },
    { key: "history",   label: "History",   icon: "📋" },
  ];

  return (
    <nav className="navbar">
      <div className="nav-logo" onClick={() => nav("home")} style={{ cursor: "pointer" }}>
        <div className="nav-logo-dot" />
        NutriFlow
      </div>
      <div className="nav-links">
        {links.map(l => (
          <button key={l.key} className={`nav-btn${page === l.key ? " active" : ""}`} onClick={() => nav(l.key)}>
            <span className="nav-icon">{l.icon}</span>{l.label}
          </button>
        ))}
      </div>
      <div className="nav-right">
        <button className="nav-cart-btn" onClick={() => nav("order")}>
          🛒 Cart {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
        </button>
        <div className="nav-avatar" onClick={() => nav("profile")} title="Profile">{initials}</div>
      </div>
    </nav>
  );
}
