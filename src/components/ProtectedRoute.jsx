// src/components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token } = useContext(AuthContext) || {};

  if (!token || !user) {
    console.log("ProtectedRoute: No token or user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  const roleMap = {
    1: "ADMIN",
    2: "ORDER_MANAGER",
    3: "CATALOG_MANAGER",
  };
  const userRole = roleMap[user.role_id] || "UNKNOWN";

  if (!allowedRoles.includes(userRole)) {
    console.log(
      `ProtectedRoute: User role ${userRole} (role_id: ${user.role_id}) not in allowedRoles`,
      allowedRoles
    );
    console.log("ProtectedRoute: No token or user, redirecting to login");
    console.log(
      `ProtectedRoute: User role ${userRole} (role_id: ${user.role_id}) not in allowedRoles`,
      allowedRoles
    );
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
