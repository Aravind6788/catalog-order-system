// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/GreenLand/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("Login API Response Status:", response.status);
      const data = await response.json();
      console.log("Login API Response Body:", data);

      if (!response.ok) {
        console.error(
          "Login failed with status:",
          response.status,
          "Response:",
          data
        );
        return false;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        localStorage.setItem("token", data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  };

  const getUser = async () => {
    if (!token) {
      console.log("No token available for getUser");
      setLoading(false);
      return null;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("GetUser API Response Status:", response.status);
      const data = await response.json();
      console.log("GetUser API Response Body:", data);

      if (response.ok) {
        setUser(data.user);
        setLoading(false);
        return data.user;
      }
      console.error(
        "GetUser failed with status:",
        response.status,
        "Response:",
        data
      );
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      setLoading(false);
      return null;
    } catch (error) {
      console.error("Get user error:", error);
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    if (token) {
      getUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        refreshToken,
        getUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
