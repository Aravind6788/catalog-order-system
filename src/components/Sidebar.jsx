// src/components/Sidebar.jsx
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";
import {
  LayoutDashboard,
  Folder,
  Package,
  ShoppingCart,
  Users,
  FileText,
  LogOut,
  Leaf,
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  // Map role_id to role name, consistent with ProtectedRoute
  const roleMap = {
    1: "ADMIN",
    2: "ORDER_MANAGER",
    3: "CATALOG_MANAGER",
  };
  const role = user?.role_id ? roleMap[user.role_id] || "ADMIN" : "ADMIN";

  const menus = {
    ADMIN: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/categories", label: "Categories", icon: Folder },
      { path: "/attributes", label: "Attributes", icon: Folder },
      { path: "/products", label: "Products", icon: Package },
      { path: "/orders", label: "Orders", icon: ShoppingCart },
      { path: "/users", label: "Users", icon: Users },
      { path: "/audit-logs", label: "Audit Logs", icon: FileText },
    ],
    ORDER_MANAGER: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/orders", label: "Orders", icon: ShoppingCart },
      { path: "/customers", label: "Customers", icon: Users },
      { path: "/products", label: "Products", icon: Package },
      { path: "/inventory", label: "Inventory", icon: FileText },
    ],
    CATALOG_MANAGER: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/categories", label: "Categories", icon: Folder },
      { path: "/products", label: "Products", icon: Package },
      { path: "/inventory", label: "Inventory", icon: FileText },
    ],
  };

  return (
    <aside className="sidebar">
      {/* Logo / Branding */}
      <div className="sidebar-header">
        <Leaf className="logo-icon" size={24} />
        <div>
          <h1 className="brand-name">Green Formula</h1>
          <p className="brand-subtitle">Landscapers</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="nav flex-column">
        {menus[role]?.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive ? "active" : ""}`}
            >
              <Icon className="icon" size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <button onClick={logout} className="btn btn-logout mt-auto">
        <LogOut size={16} className="icon" />
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
