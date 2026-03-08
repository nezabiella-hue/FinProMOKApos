import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart2,
  BookOpen,
  Package,
  Tv2,
  Users,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  ShoppingCart,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",      icon: LayoutDashboard, path: "/dashboard"      },
  { label: "Reports",        icon: BarChart2,        path: "/reports"        },
  { label: "Inventory",      icon: Package,          path: "/inventory"      },
  { label: "Production",     icon: ChefHat,          path: "/production"     },
  { label: "Purchase Order", icon: ShoppingCart,     path: "/purchase-order" },
  { label: "Library",        icon: BookOpen                                   },
  { label: "Online Channels",icon: Tv2                                        },
  { label: "Customers",      icon: Users                                      },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        {collapsed ? <span className="sidebar-logo-icon">m</span> : "moka"}
      </div>

      {/* Branch selector — hidden when collapsed */}
      {!collapsed && (
        <div className="sidebar-branch">
          <span>Jawa Barat I – Moka Demo</span>
          <span className="sidebar-branch-arrow">▾</span>
        </div>
      )}

      {/* Nav items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`sidebar-item ${location.pathname === item.path ? "sidebar-item--active" : ""}`}
              onClick={() => item.path && navigate(item.path)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="sidebar-icon" />
              {!collapsed && (
                <span className="sidebar-label">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed((prev) => !prev)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </div>
  );
}
