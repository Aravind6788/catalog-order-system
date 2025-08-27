// src/components/Layout.jsx
import React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar with fixed width */}
      <div style={{ width: "250px", flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Main content takes remaining space */}
      <main style={{ flex: 1, padding: "1rem", overflowX: "hidden" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
