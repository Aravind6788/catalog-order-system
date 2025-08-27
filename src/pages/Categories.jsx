// src/pages/Categories.jsx
import React from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import "./Categories.css";

const Categories = () => {
  // Static placeholder data
  const categories = [
    { id: 1, name: "Trees" },
    { id: 2, name: "Shrubs" },
    { id: 3, name: "Tools" },
  ];

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "CATALOG_MANAGER"]}>
      <div className="d-flex">
        <Sidebar />
        <div
          className="flex-1 p-4 bg-dark text-white"
          style={{ marginLeft: "250px" }}
        >
          <h1 className="mb-4">Categories</h1>
          <div className="row">
            {categories.map((category) => (
              <div key={category.id} className="col-md-4">
                <div className="category-card">
                  <h2>{category.name}</h2>
                  <p>No description available</p>
                  <div className="category-actions mt-3">
                    <button className="btn btn-primary btn-sm">View</button>
                    <button className="btn btn-success btn-sm">Edit</button>
                    <button className="btn btn-danger btn-sm">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-success mt-3">+ Add New</button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Categories;
