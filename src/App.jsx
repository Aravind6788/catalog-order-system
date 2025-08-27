// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import CreateCategory from "./pages/CreateCategory";
import Products from "./pages/Products";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout"; // custom layout with Sidebar

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "ORDER_MANAGER", "CATALOG_MANAGER"]}
            />
          }
        >
          {/* All protected pages share the same layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/new" element={<CreateCategory />} />
            <Route path="/products" element={<Products />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
