// src/pages/Products.jsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import { Search, Package, Eye, Pencil, Trash, Bell } from "lucide-react";
import "./Products.css";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Updated product data
  const products = [
    {
      id: 1,
      name: "Test1",
      code: "BEFK",
      category: "Garden Tools",
      description: "No description available",
      variants: "No variants",
      price: null,
      image: Package,
    },
    {
      id: 2,
      name: "Japanese Maple",
      code: "JMP",
      category: "Deciduous Trees",
      description: "Stunning deciduous tree with vibrant fall colors",
      variants: "2 variants",
      price: "$79.99 - $129.99",
      image: Package,
    },
    {
      id: 3,
      name: "Organic Plant Food",
      code: "OPF",
      category: "Fertilizers",
      description: "All natural fertilizer for healthy plant growth",
      variants: "1 variant",
      price: "$24.99",
      image: Package,
    },
    {
      id: 4,
      name: "Blue Spruce",
      code: "BSP",
      category: "Evergreen Trees",
      description: "Beautiful evergreen tree perfect for landscaping",
      variants: "3 variants",
      price: "$45.99 - $149.99",
      image: Package,
    },
  ];

  return (
    <ProtectedRoute
      allowedRoles={["ADMIN", "ORDER_MANAGER", "CATALOG_MANAGER"]}
    >
      <div className="products-layout">
        <Sidebar />
        <div className="products-main">
          {/* Header */}
          <div className="products-header">
            <div className="header-left">
              <h1>Products</h1>
            </div>
            <div className="header-right">
              <div className="search-container">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search products, orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button className="add-new-btn">+ Add New</button>
              <div className="notification-wrapper">
                <Bell className="bell-icon" size={20} />
                <span className="notification-badge">3</span>
              </div>
              <div className="user-avatar">
                <img src="/avatar.png" alt="User" />
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="filter-bar">
            <div className="search-products">
              <Search className="search-icon-inline" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                className="search-products-input"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-dropdown"
            >
              <option>All Categories</option>
              <option>Garden Tools</option>
              <option>Deciduous Trees</option>
              <option>Fertilizers</option>
              <option>Evergreen Trees</option>
            </select>
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                {/* Product Image */}
                <div className="product-image-container">
                  <product.image className="product-icon" size={60} />
                </div>

                {/* Product Title and SKU */}
                <div className="product-header">
                  <h3 className="product-title">{product.name}</h3>
                  <span className="product-sku">{product.code}</span>
                </div>

                {/* Category */}
                <p className="product-category">{product.category}</p>

                {/* Description */}
                <p className="product-description">{product.description}</p>

                {/* Price Range */}
                {product.price && (
                  <div className="product-price-range">{product.price}</div>
                )}

                {/* Variants */}
                <div className="product-variants-section">
                  <span className="variants-label">{product.variants}</span>
                </div>

                {/* Action Buttons */}
                <div className="product-actions">
                  <button className="action-btn view-btn">
                    <Eye size={14} /> View
                  </button>
                  <button className="action-btn edit-btn">
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="action-btn delete-btn">
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Products;
