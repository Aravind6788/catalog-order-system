// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, user: null, role: null });

  useEffect(() => {
    // Simulate a logged-in user with a role (e.g., ADMIN for testing)
    const simulatedToken = "simulated-jwt-token";
    const simulatedUser = { name: "Admin User", role: "ADMIN" };
    if (simulatedToken) {
      setAuth({ token: simulatedToken, user: simulatedUser, role: "ADMIN" });
    }
  }, []);

  const login = (email, password) => {
    // Simulate login
    setAuth({
      token: "simulated-jwt-token",
      user: { name: email, role: "ADMIN" },
      role: "ADMIN",
    });
    return true;
  };

  const logout = () => {
    setAuth({ token: null, user: null, role: null });
  };

  const refreshToken = () => {
    // No-op for now
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
