// src/pages/Products.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import { Search, Eye, Pencil, Trash, Bell, Plus } from "lucide-react";
import "./Products.css";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editProduct, setEditProduct] = useState({});

  // Define the plant categories
  const plantCategories = ["Palm Tree List", "Hibiscus", "Fruit Plants","Indoor Plants","Timber Trees"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await import("../data/sample-products.json");
        const sheets = data.default.sheets;
        let allProducts = [];
        setCategories(plantCategories);

        for (const sheet of sheets) {
          const categoryData = await import(`../data/${sheet.file}`);
          categoryData.default.forEach((row, index) => {
            const product = {
              id: `${sheet.title}-${index + 1}`,
              sno: row["S.No"] || "N/A",
              name: row["Description"] || "Unknown",
              variants: row["Cover Size"] || "No variants",
              wholesale: row["Whole Sale Rate"] ? `$${row["Whole Sale Rate"]}` : null,
              retail: row["Retail Price"] ? `$${row["Retail Price"]}` : null,
              category: sheet.title,
              imageUrl: row["Image URL"] || null,
            };
            allProducts.push(product);
          });
        }
        setProducts(allProducts);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // View Product
  const handleView = (product) => {
    setSelectedProduct(product);
  };

  // Delete Product
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((product) => product.id !== id));
    }
  };

  // Edit Product
  const handleEdit = (product) => {
    setIsEditing(true);
    setEditProduct({ ...product });
  };

  // Save Edited Product
  const handleSaveEdit = () => {
    setProducts(
      products.map((product) =>
        product.id === editProduct.id ? { ...editProduct } : product
      )
    );
    setIsEditing(false);
    setEditProduct({});
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditProduct({});
  };

  // Create Product
  const handleCreate = () => {
    const newProduct = {
      id: `${selectedCategory}-${products.length + 1}`,
      sno: products.length + 1,
      name: "New Product",
      variants: "10*10",
      wholesale: "$100",
      retail: "$150",
      category: selectedCategory,
      imageUrl: "https://via.placeholder.com/60?text=New+Product",
    };
    setProducts([...products, newProduct]);
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "ORDER_MANAGER", "CATALOG_MANAGER"]}>
      <div className="products-layout">
        <Sidebar />
        <div className="products-main">
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

          <div className="filter-bar">
            <div className="search-products">
              <Search className="search-icon-inline" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
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

          <div className="products-grid">
            {loading ? (
              <p>Loading products from JSON...</p>
            ) : filteredProducts.length === 0 ? (
              <p>No products found.</p>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image-container">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="product-image"
                        style={{ width: "60px", height: "60px" }}
                        // onError={(e) => {
                        //   e.target.src = "https://via.placeholder.com/60?text=Error";
                        // }}
                      />
                    ) : (
                      <div
                        className="product-icon"
                        style={{ width: "60px", height: "60px", backgroundColor: "#ccc" }}
                      >
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="product-header">
                    <h3 className="product-title">{product.name}</h3>
                    <span className="product-sku">{product.id.split("-")[1]}</span>
                  </div>
                  <p className="product-category">{product.category}</p>
                  <p className="product-description">
                    S.No: {product.sno}, Cover Size: {product.variants}
                  </p>
                  <div className="product-price-range">
                    Wholesale: {product.wholesale || "N/A"}, Retail:{" "}
                    {product.retail || "N/A"}
                  </div>
                  <div className="product-variants-section">
                    <span className="variants-label">{product.variants}</span>
                  </div>
                  <div className="product-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleView(product)}
                    >
                      <Eye size={14} /> View
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
                <h2>Product Details</h2>
                <p>
                  <strong>S.No:</strong> {selectedProduct.sno}
                </p>
                <p>
                  <strong>Name:</strong> {selectedProduct.name}
                </p>
                <p>
                  <strong>Category:</strong> {selectedProduct.category}
                </p>
                <p>
                  <strong>Cover Size:</strong> {selectedProduct.variants}
                </p>
                <p>
                  <strong>Wholesale:</strong> {selectedProduct.wholesale || "N/A"}
                </p>
                <p>
                  <strong>Retail:</strong> {selectedProduct.retail || "N/A"}
                </p>
                <button onClick={() => setSelectedProduct(null)}>Close</button>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {isEditing && (
            <div className="modal" onClick={() => handleCancelEdit()}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Product</h2>
                <input
                  type="text"
                  value={editProduct.name || ""}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, name: e.target.value })
                  }
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={editProduct.variants || ""}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, variants: e.target.value })
                  }
                  placeholder="Cover Size"
                />
                <input
                  type="text"
                  value={editProduct.wholesale?.replace("$", "") || ""}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      wholesale: `$${e.target.value.replace(/[^0-9]/g, "") || ""}`,
                    })
                  }
                  placeholder="Wholesale"
                />
                <input
                  type="text"
                  value={editProduct.retail?.replace("$", "") || ""}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      retail: `$${e.target.value.replace(/[^0-9]/g, "") || ""}`,
                    })
                  }
                  placeholder="Retail"
                />
                <button onClick={handleSaveEdit}>Save</button>
                <button onClick={handleCancelEdit}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Products;