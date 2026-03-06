import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart2,
  BookOpen,
  Salad,
  Package,
  Tv2,
  Users,
  ChevronRight,
  ChevronLeft,
  ChefHat,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Reports", icon: BarChart2 },
  { label: "Library", icon: BookOpen },
  {
    label: "Ingredient",
    icon: Salad,
    expandable: true,
    children: [
      { label: "Inventory", path: "/inventory", icon: Package },
      { label: "Production", path: "/production", icon: ChefHat },
    ],
  },
  { label: "Online Channels", icon: Tv2 },
  { label: "Customers", icon: Users },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [ingredientOpen, setIngredientOpen] = useState(false);
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

          if (item.expandable) {
            return (
              <div key={item.label}>
                <button
                  className={`sidebar-item ${ingredientOpen ? "sidebar-item--active" : ""}`}
                  onClick={() => {
                    if (collapsed) setCollapsed(false);
                    setIngredientOpen((prev) => !prev);
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} className="sidebar-icon" />
                  {!collapsed && (
                    <>
                      <span className="sidebar-label">{item.label}</span>
                      <ChevronRight
                        size={14}
                        className={`sidebar-chevron ${ingredientOpen ? "sidebar-chevron--open" : ""}`}
                      />
                    </>
                  )}
                </button>

                {ingredientOpen && !collapsed && (
                  <div className="sidebar-children">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <button
                          key={child.label}
                          className={`sidebar-child ${location.pathname === child.path ? "sidebar-child--active" : ""}`}
                          onClick={() => navigate(child.path)}
                        >
                          <ChildIcon size={15} className="sidebar-icon" />
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
