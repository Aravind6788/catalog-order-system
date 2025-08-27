// src/pages/CreateCategory.jsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import { useNavigate } from "react-router-dom";
import "./CreateCategory.css";

const CreateCategory = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission (no backend call)
    console.log("Category created:", name);
    navigate("/categories");
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "CATALOG_MANAGER"]}>
      <div className="d-flex">
        <Sidebar />
        <div
          className="flex-1 p-4 bg-dark text-white"
          style={{ marginLeft: "250px" }}
        >
          <h1 className="mb-4">Create Category</h1>
          <div className="create-category-form">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
              <button type="submit" className="btn btn-success">
                Save
              </button>
              <button
                type="button"
                onClick={() => navigate("/categories")}
                className="btn btn-secondary ms-2"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CreateCategory;
