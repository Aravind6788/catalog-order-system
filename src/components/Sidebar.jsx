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
  MessageSquarePlus,
} from "lucide-react";
import "./Sidebar.css";
import GFLLogo from "../img/GFL_Logo.png";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const roleMap = {
    1: "ADMIN",
    2: "CATALOG_MANAGER",
    3: "ORDER_MANAGER",
  };
  const role = user?.role_id ? roleMap[user.role_id] || "ADMIN" : "ADMIN";

  const menus = {
    ADMIN: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/categories", label: "Categories", icon: Folder },
      { path: "/attributes", label: "Attributes", icon: MessageSquarePlus },
      { path: "/products", label: "Products", icon: Package },
      { path: "/orders", label: "Orders", icon: ShoppingCart },
      { path: "/users", label: "Users", icon: Users },
      { path: "/audit-logs", label: "Audit Logs", icon: FileText },
    ],
    ORDER_MANAGER: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/products", label: "Products", icon: Package },
      { path: "/orders", label: "Orders", icon: ShoppingCart },
    ],
    CATALOG_MANAGER: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/categories", label: "Categories", icon: Folder },
      { path: "/products", label: "Products", icon: Package },
      { path: "/attributes", label: "Attributes", icon: Folder },
    ],
  };

  return (
    <>
      <aside
        className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}
      >
        {/* Header with Logo only */}
        <div className="sidebar-header">
          <div className="brand-info">
            <img
              src={GFLLogo}
              alt="Green Formula Logo"
              className="brand-logo"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="nav">
          {menus[role]?.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? "active" : ""}`}
                title={!isOpen ? item.label : ""}
              >
                <Icon className="icon" size={18} />
                {isOpen && <span className="nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="btn-logout"
          title={!isOpen ? "Logout" : ""}
        >
          <LogOut size={16} className="icon" />
          {isOpen && <span>Logout</span>}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default Sidebar;
