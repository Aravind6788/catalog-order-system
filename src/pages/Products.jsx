// src/pages/Products.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import { Search, Eye, Pencil, Trash, Bell, Plus } from "lucide-react";
import "./Products.css";

const API_BASE = "http://localhost/GreenLand/api";
const Products = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch all products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/products`);
      const { products } = res.data;

      setProducts(products);
      const uniqueCategories = [
        ...new Set(products.map((p) => p.category_name)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Categories" ||
      product.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // View product details
  const handleView = async (product) => {
    try {
      const res = await axios.get(`${API_BASE}/products/${product.id}`);
      setSelectedProduct(res.data);
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${API_BASE}/products/${id}`);
        setProducts(products.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  // Handle Add New Variant - Navigate to add product page with variant toggle and pre-filled data
  const handleAddVariant = (product) => {
    navigate("/add-product-variant", {
      state: {
        formType: "variant",
        preSelectedCategory: product.category_id,
        preSelectedProduct: product.id,
        categoryName: product.category_name,
        productName: product.name,
      },
    });
  };

  // Handle Edit - Navigate to add product page with edit mode and pre-filled data
  const handleEdit = (product) => {
    navigate("/add-product-variant", {
      state: {
        editMode: true,
        formType: "product",
        editData: product,
      },
    });
  };

  // Create new product - Navigate to add product page
  const handleCreate = () => {
    navigate("/add-product-variant", {
      state: {
        formType: "product",
      },
    });
  };

  return (
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
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="add-new-btn" onClick={handleCreate}>
              <Plus size={14} /> Add New
            </button>
            <div className="notification-wrapper">
              <Bell className="bell-icon" size={20} />
              <span className="notification-badge">3</span>
            </div>
            <div className="user-avatar">
              <img src="/avatar.png" alt="User" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-dropdown"
          >
            <option value="All Categories">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {loading ? (
            <p>Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p>No products found.</p>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image-container">
                  {product.primary_image ? (
                    <img
                      src={product.primary_image}
                      alt={product.name}
                      className="product-image"
                    />
                  ) : (
                    <div className="product-icon">No Image</div>
                  )}
                </div>
                <div className="product-header">
                  <h3 className="product-title">{product.name}</h3>
                  <span className="product-sku">{product.sku_prefix}</span>
                </div>
                <p className="product-category">{product.category_name}</p>
                <p className="product-description">{product.description}</p>
                <div className="product-actions">
                  <button
                    className="action-btn variant-btn"
                    onClick={() => handleAddVariant(product)}
                  >
                    <Plus size={14} /> Add Variant
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* View Modal */}
        {selectedProduct && (
          <div className="modal" onClick={() => setSelectedProduct(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{selectedProduct.product.name}</h2>
              <p>
                <strong>Category:</strong>{" "}
                {selectedProduct.product.category_name}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {selectedProduct.product.description}
              </p>
              <button onClick={() => setSelectedProduct(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
