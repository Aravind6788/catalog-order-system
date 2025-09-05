import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import "./Products.css";
import axios from "axios";
import {
  Search,
  Eye,
  Pencil,
  Trash,
  Bell,
  Plus,
  X,
  AlertTriangle,
  Check,
  Package,
  Grid,
  List,
  Filter,
  ChevronLeft,
  ChevronRight,
  Star,
  Tag,
  ShoppingCart,
  DollarSign,
  Box,
} from "lucide-react";

const API_BASE = "http://localhost/GreenLand/api";

const Products = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showVariantDeleteModal, setShowVariantDeleteModal] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // View options
  const [viewMode, setViewMode] = useState("grid");

  // Confirmation Modal Component
  const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
      
      <div className="modal-overlay">
        <div className="modal-content modal-small">
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <AlertTriangle
                style={{ color: "#f59e0b", width: "24px", height: "24px" }}
              />
              <p style={{ margin: 0, color: "#374151" }}>{message}</p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-danger" onClick={onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Success/Error Modal Component
  const NotificationModal = ({
    isOpen,
    onClose,
    title,
    message,
    type = "info",
  }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content modal-small">
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {type === "success" && (
                <Check
                  style={{ color: "#10b981", width: "24px", height: "24px" }}
                />
              )}
              {type === "error" && (
                <AlertTriangle
                  style={{ color: "#ef4444", width: "24px", height: "24px" }}
                />
              )}
              <p style={{ margin: 0, color: "#374151" }}>{message}</p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Product Detail Modal Component with Variant Management
  const ProductDetailModal = ({ isOpen, onClose, product }) => {
    const [currentVariant, setCurrentVariant] = useState(null);
    const [variantAttributes, setVariantAttributes] = useState([]);
    const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);

    useEffect(() => {
      if (product?.variants && product.variants.length > 0) {
        // Set first variant as default
        const defaultVariant = product.variants[0];
        setCurrentVariant(defaultVariant);
        loadVariantAttributes(defaultVariant.id);
      }
    }, [product]);

    const loadVariantAttributes = async (variantId) => {
      try {
        setIsLoadingAttributes(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          `${API_BASE}/variants/${variantId}/attributes/grouped`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVariantAttributes(response.data.attributes || []);
      } catch (error) {
        console.error("Error loading variant attributes:", error);
        setVariantAttributes([]);
      } finally {
        setIsLoadingAttributes(false);
      }
    };

    const handleVariantSelect = (variant) => {
      setCurrentVariant(variant);
      loadVariantAttributes(variant.id);
    };

    const handleEditVariant = (variant) => {
      navigate("/add-product-variant", {
        state: {
          editMode: true,
          formType: "variant",
          editData: {
            ...variant,
            product_id: product.product.id,
            category_id: product.product.category_id,
          },
        },
      });
      onClose();
    };

    const handleDeleteVariant = (variant) => {
      setVariantToDelete(variant);
      setShowVariantDeleteModal(true);
      onClose();
    };

    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(price);
    };

    const getStockStatus = (quantity) => {
      if (quantity === 0) return { text: "Out of Stock", color: "#ef4444" };
      if (quantity < 10) return { text: "Low Stock", color: "#f59e0b" };
      return { text: "In Stock", color: "#10b981" };
    };

    if (!isOpen || !product) return null;

    const stockStatus = currentVariant
      ? getStockStatus(currentVariant.quantity || 0)
      : null;

    return (
      <div className="modal-overlay">
        <div className="modal-content modal-large">
          <div className="modal-header">
            <h2>
              <Package size={24} />
              Product Details
            </h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            {/* Product Basic Info */}
            <div className="product-detail-header">
              <div className="product-main-image">
                {product.product.primary_image ? (
                  <img
                    src={product.product.primary_image}
                    alt={product.product.name}
                    className="detail-image"
                  />
                ) : (
                  <div className="detail-image-placeholder">
                    <Package size={64} />
                  </div>
                )}
              </div>
              <div className="product-basic-info">
                <h3 className="product-detail-title">{product.product.name}</h3>
                <div className="product-meta">
                  <span className="category-badge">
                    {product.product.category_name}
                  </span>
                  <span className="sku-badge">
                    SKU: {product.product.sku_prefix}
                  </span>
                  <span
                    className={`status-badge status-${product.product.status}`}
                  >
                    {product.product.status}
                  </span>
                </div>
                {product.product.description && (
                  <div className="product-description">
                    {product.product.description}
                  </div>
                )}
              </div>
            </div>

            {/* Variants Section */}
            {product.variants && product.variants.length > 0 && (
              <div className="variants-section" style={{backgroundColor:"white"}}>
                <div className="section-header">
                  <h4>
                    <Box size={20} />
                    Variants ({product.variants.length})
                  </h4>
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => {
                      navigate("/add-product-variant", {
                        state: {
                          formType: "variant",
                          preSelectedCategory: product.product.category_id,
                          preSelectedProduct: product.product.id,
                          categoryName: product.product.category_name,
                          productName: product.product.name,
                        },
                      });
                      onClose();
                    }}
                  >
                    <Plus size={14} />
                    Add Variant
                  </button>
                </div>

                <div className="variants-layout">
                  {/* Variant List */}
                  <div className="variant-list">
                    {product.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`variant-item ${
                          currentVariant?.id === variant.id ? "active" : ""
                        }`}
                        onClick={() => handleVariantSelect(variant)}
                      >
                        <div className="variant-info">
                          <h5 className="variant-name">{variant.name}</h5>
                          <div className="variant-meta">
                            <span className="variant-code">{variant.code}</span>
                            <span className="variant-price">
                              {formatPrice(variant.price)}
                            </span>
                          </div>
                          <div className="variant-quantity">
                            <span
                              style={{
                                color: getStockStatus(variant.quantity || 0)
                                  .color,
                              }}
                            >
                              {getStockStatus(variant.quantity || 0).text}:{" "}
                              {variant.quantity || 0}
                            </span>
                          </div>
                        </div>
                        <div className="variant-actions">
                          <button
                            className="action-btn edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditVariant(variant);
                            }}
                            title="Edit variant"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVariant(variant);
                            }}
                            title="Delete variant"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Variant Detail Panel */}
                  {currentVariant && (
                    <div className="variant-detail-panel">
                      <div className="variant-detail-header">
                        <h5>{currentVariant.name}</h5>
                        <div className="variant-price-large">
                          {formatPrice(currentVariant.price)}
                        </div>
                      </div>

                      <div className="variant-stats">
                        <div className="stat-item">
                          <Box size={16} />
                          <div>
                            <span className="stat-label">Stock</span>
                            <span
                              className="stat-value"
                              style={{ color: stockStatus?.color }}
                            >
                              {currentVariant.quantity || 0}
                            </span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <Tag size={16} />
                          <div>
                            <span className="stat-label">Code</span>
                            <span className="stat-value">
                              {currentVariant.code}
                            </span>
                          </div>
                        </div>
                      </div>

                      {currentVariant.description && (
                        <div className="variant-description">
                          <h6>Description</h6>
                          <p>{currentVariant.description}</p>
                        </div>
                      )}

                      {/* Variant Attributes */}
                      {isLoadingAttributes ? (
                        <div className="loading-variant-detail">
                          <div className="loading-spinner"></div>
                          <p>Loading attributes...</p>
                        </div>
                      ) : variantAttributes.length > 0 ? (
                        <div className="variant-attributes">
                          <h6>Attributes</h6>
                          <div className="attributes-grid">
                            {variantAttributes.map((attr) => (
                              <div
                                key={attr.attribute_id}
                                className="attribute-group"
                              >
                                <span className="attribute-name">
                                  {attr.attribute_name}:
                                </span>
                                <div className="attribute-values">
                                  {attr.values.map((value) => (
                                    <span
                                      key={value.value_id}
                                      className="attribute-value"
                                    >
                                      {value.value_name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="empty-variant-detail">
                          <Tag size={48} />
                          <p>No attributes assigned to this variant</p>
                        </div>
                      )}

                      <div className="variant-actions-panel">
                        <button
                          className="btn-primary"
                          onClick={() => handleEditVariant(currentVariant)}
                        >
                          <Pencil size={14} />
                          Edit Variant
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeleteVariant(currentVariant)}
                        >
                          <Trash size={14} />
                          Delete Variant
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State for No Variants */}
            {(!product.variants || product.variants.length === 0) && (
              <div className="variants-section">
                <div className="section-header">
                  <h4>
                    <Box size={20} />
                    Variants (0)
                  </h4>
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => {
                      navigate("/add-product-variant", {
                        state: {
                          formType: "variant",
                          preSelectedCategory: product.product.category_id,
                          preSelectedProduct: product.product.id,
                          categoryName: product.product.category_name,
                          productName: product.product.name,
                        },
                      });
                      onClose();
                    }}
                  >
                    <Plus size={14} />
                    Add First Variant
                  </button>
                </div>
                <div className="empty-variant-detail">
                  <Package size={64} style={{ opacity: 0.3 }} />
                  <h3>No Variants Available</h3>
                  <p>
                    This product doesn't have any variants yet. Create the first
                    variant to start selling this product.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

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
      setModalMessage("Failed to load products");
      setShowErrorModal(true);
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
      setModalMessage("Failed to load product details");
      setShowErrorModal(true);
    }
  };

  // Delete product
  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/products/${productToDelete.id}`);
      setProducts(products.filter((p) => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
      setModalMessage("Product deleted successfully");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error deleting product:", error);
      setShowDeleteModal(false);
      setModalMessage("Failed to delete product");
      setShowErrorModal(true);
    }
  };

  // Delete variant
  const confirmVariantDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/variants/${variantToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowVariantDeleteModal(false);
      setVariantToDelete(null);
      setModalMessage("Variant deleted successfully");
      setShowSuccessModal(true);

      // Refresh products to update variant count
      fetchProducts();
    } catch (error) {
      console.error("Error deleting variant:", error);
      setShowVariantDeleteModal(false);
      setModalMessage("Failed to delete variant");
      setShowErrorModal(true);
    }
  };

  // Handle Add New Variant
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

  // Handle Edit
  const handleEdit = (product) => {
    navigate("/add-product-variant", {
      state: {
        editMode: true,
        formType: "product",
        editData: product,
      },
    });
  };

  // Create new product
  const handleCreate = () => {
    navigate("/add-product-variant", {
      state: {
        formType: "product",
      },
    });
  };

  return (
    <>
     
      <div className="products-layout">
        <Sidebar />
        <div className="categories-page">
          {/* Header */}
          <div className="page-header">
            <div className="header-left">
              <h1 className="page-title">Products</h1>
            </div>
            <div className="categories-controls">
              <div className="control-buttons">
                <button className="btn-primary" onClick={handleCreate}>
                  <Plus size={16} />
                  Add New
                </button>
                {/* <div className="notification-wrapper">
                  <Bell size={20} />
                  <span className="notification-badge">3</span>
                </div>
                <div className="user-avatar">
                  <img src="/avatar.png" alt="User" />
                </div> */}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-bar">
            <Filter size={16} style={{ color: "#64748b" }} />
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

            <div className="view-toggle">
              <button
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <Grid size={16} />
              </button>
              <button
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Products Display */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Package
                size={64}
                style={{ color: "#cbd5e1", marginBottom: "16px" }}
              />
              <h3 style={{ color: "#475569", margin: "0 0 8px 0" }}>
                No products found
              </h3>
              <p style={{ color: "#64748b", margin: 0 }}>
                {searchTerm || selectedCategory !== "All Categories"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first product"}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid" ? "products-grid" : "products-list"
              }
            >
              {filteredProducts.map((product) =>
                viewMode === "grid" ? (
                  <div key={product.id} className="product-card">
                    <div className="product-image-container">
                      {product.primary_image ? (
                        <img
                          src={product.primary_image}
                          alt={product.name}
                          className="product-image"
                        />
                      ) : (
                        <div className="product-icon">
                          <Package size={32} style={{ color: "#94a3b8" }} />
                        </div>
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
                        className="action-btn view-btn"
                        onClick={() => handleView(product)}
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        className="action-btn variant-btn"
                        onClick={() => handleAddVariant(product)}
                      >
                        <Plus size={14} />
                        Add Variant
                      </button>
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={product.id} className="product-list-item">
                    <div className="product-image-container">
                      {product.primary_image ? (
                        <img
                          src={product.primary_image}
                          alt={product.name}
                          className="product-image"
                        />
                      ) : (
                        <div className="product-icon">
                          <Package size={24} style={{ color: "#94a3b8" }} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="product-header">
                        <h3 className="product-title">{product.name}</h3>
                        <span className="product-sku">
                          {product.sku_prefix}
                        </span>
                      </div>
                      <p className="product-category">
                        {product.category_name}
                      </p>
                      <p
                        className="product-description"
                        style={{ marginBottom: 0 }}
                      >
                        {product.description}
                      </p>
                    </div>
                    <div className="product-actions">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleView(product)}
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        className="action-btn variant-btn"
                        onClick={() => handleAddVariant(product)}
                      >
                        <Plus size={14} />
                        Add Variant
                      </button>
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Modals */}
          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
            title="Delete Product"
            message={`Are you sure you want to delete ${productToDelete?.name}? This action cannot be undone.`}
          />

          <ConfirmModal
            isOpen={showVariantDeleteModal}
            onClose={() => setShowVariantDeleteModal(false)}
            onConfirm={confirmVariantDelete}
            title="Delete Variant"
            message={`Are you sure you want to delete the variant "${variantToDelete?.name}"? This action cannot be undone.`}
          />

          <NotificationModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title="Success"
            message={modalMessage}
            type="success"
          />

          <NotificationModal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            title="Error"
            message={modalMessage}
            type="error"
          />

          <ProductDetailModal
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            product={selectedProduct}
          />
        </div>
      </div>
    </>
  );
};

export default Products;
