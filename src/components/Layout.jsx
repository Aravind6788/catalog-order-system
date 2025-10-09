// src/components/Layout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(true);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);

      // Auto-close sidebar on mobile by default
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    // Initial check
    handleResize();

    // Add listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar with dynamic width - only affects layout on desktop */}
      {!isMobile && (
        <div
          style={{
            width: isSidebarOpen ? "240px" : "70px",
            flexShrink: 0,
            transition: "width 0.3s ease",
          }}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main content takes remaining space */}
      <main
        style={{
          flex: 1,
          padding: window.innerWidth <= 480 ? "0.5rem" : "1rem",
          width: "100%",
          position: "relative",
        }}
      >
        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="main-hamburger-btn"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          style={{
            position: "fixed",
            top: "1rem",
            left: "1rem",
            zIndex: 50,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s ease",
          }}
        >
          <Menu size={20} color="#475569" />
        </button>

        {/* Content with top margin to avoid hamburger overlap */}
        <div style={{ marginTop: "3rem" }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        .main-hamburger-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: scale(1.05);
        }

        .main-hamburger-btn:active {
          transform: scale(0.95);
        }

        .main-hamburger-btn:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        @media (max-width: 480px) {
          .main-hamburger-btn {
            top: 0.5rem !important;
            left: 0.5rem !important;
            padding: 8px !important;
          }
        }

        @media (max-width: 360px) {
          .main-hamburger-btn {
            padding: 6px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
