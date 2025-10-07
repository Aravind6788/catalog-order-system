import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Auth Pages
import Login from "./pages/Login";

// Admin Dashboard Pages
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";

// Product Management Pages
import Products from "./pages/Products";
import AddProductVariant from "./pages/AddProductVariant";

// Category Management Pages
import Categories from "./pages/Categories";
import CreateCategory from "./pages/CreateCategory";

// Attribute Management Pages
import Attributes from "./pages/Attributes";

// Client-facing Pages
import ClientProducts from "./pages/client/ClientProducts";
import OrderManagement from "./pages/OrderManagement";
import AuditLog from "./pages/AuditLog";

function App() {
  return (
    <Router>
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ClientProducts />} />
        <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />

        {/* Client Catalog View (Admin Preview) */}
        <Route path="/catalogue" element={<ClientProducts />} />

        {/* ========== PROTECTED ADMIN ROUTES ========== */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "ORDER_MANAGER", "CATALOG_MANAGER"]}
            />
          }
        >
          <Route element={<Layout />}>
            {/* Dashboard & User Management */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />

            {/* Product Management */}
            <Route path="/products" element={<Products />} />
            <Route
              path="/add-product-variant"
              element={<AddProductVariant />}
            />

            {/* Category Management */}
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/new" element={<CreateCategory />} />

            {/* Attribute Management */}
            <Route path="/attributes" element={<Attributes />} />

            {/* Future Routes - Uncomment when ready */}
            <Route path="/audit-logs" element={<AuditLog />} />
            <Route path="/orders" element={<OrderManagement />} />
            {/* <Route path="/inventory" element={<Inventory />} /> */}
            {/* <Route path="/reports" element={<Reports />} /> */}
          </Route>
        </Route>

        {/* ========== FUTURE CLIENT ROUTES (No Auth Required) ========== */}
        {/* Uncomment when you create separate client-facing routes */}
        {/* 
        <Route path="/shop" element={<ClientProducts />} />
        <Route path="/shop/category/:id" element={<CategoryProducts />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        */}
      </Routes>
    </Router>
  );
}

export default App;
