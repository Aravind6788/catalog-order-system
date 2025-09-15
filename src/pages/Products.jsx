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
  Image as ImageIcon,
  Upload,
  Power,
  PowerOff,
} from "lucide-react";

const API_BASE = "http://localhost/GreenLand/api";

const Products = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [productToActivate, setProductToActivate] = useState(null);
  const [showVariantDeleteModal, setShowVariantDeleteModal] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showVariantActivateModal, setShowVariantActivateModal] =
    useState(false);
  const [variantToActivate, setVariantToActivate] = useState(null);

  // View options
  const [viewMode, setViewMode] = useState("grid");

  // Image states
  const [productImages, setProductImages] = useState([]);
  const [variantImages, setVariantImages] = useState({});

  // Image Modal Component
  const ImageGalleryModal = ({ isOpen, images, onClose, title }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!isOpen || !images || images.length === 0) return null;

    const nextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
      setCurrentImageIndex(
        (prev) => (prev - 1 + images.length) % images.length
      );
    };

    return (
      <div className="modal-overlay image-gallery-overlay">
        <div className="image-gallery-modal">
          <div className="image-gallery-header">
            <h3>{title}</h3>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div className="image-gallery-content">
            <div className="image-gallery-main">
              <button
                className="gallery-nav gallery-nav-prev"
                onClick={prevImage}
                disabled={images.length <= 1}
              >
                <ChevronLeft size={24} />
              </button>
              <div className="gallery-main-image">
                <img
                  src={images[currentImageIndex]}
                  alt={`${title} ${currentImageIndex + 1}`}
                  className="gallery-image"
                />
              </div>
              <button
                className="gallery-nav gallery-nav-next"
                onClick={nextImage}
                disabled={images.length <= 1}
              >
                <ChevronRight size={24} />
              </button>
            </div>
            {images.length > 1 && (
              <div className="image-gallery-thumbnails">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`gallery-thumbnail ${
                      index === currentImageIndex ? "active" : ""
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
            <div className="gallery-counter">
              {currentImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the ConfirmModal component to handle different button types
  const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Delete",
    confirmClass = "btn-danger",
    icon = AlertTriangle,
    iconColor = "#f59e0b",
  }) => {
    if (!isOpen) return null;

    const IconComponent = icon;

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
              <IconComponent
                style={{ color: iconColor, width: "24px", height: "24px" }}
              />
              <p style={{ margin: 0, color: "#374151" }}>{message}</p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className={confirmClass} onClick={onConfirm}>
              {confirmText}
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

  // Enhanced Product Detail Modal Component with Images
  const ProductDetailModal = ({ isOpen, onClose, product }) => {
    const [currentVariant, setCurrentVariant] = useState(null);
    const [variantAttributes, setVariantAttributes] = useState([]);
    const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [galleryImages, setGalleryImages] = useState([]);
    const [galleryTitle, setGalleryTitle] = useState("");

    useEffect(() => {
      if (product?.variants && product.variants.length > 0) {
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
    const handleActivateVariant = (variant, e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
      }
      setVariantToActivate(variant);
      setShowVariantActivateModal(true);
    };

    const handleEditVariant = (variant, e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
      }
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
const handleDeleteVariant = (variant, e) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
  }
  setVariantToDelete(variant);
  setShowVariantDeleteModal(true);
  onClose();
};

    const openProductImageGallery = () => {
      const images = productImages[product.product.id] || [];
      if (images.length > 0) {
        setGalleryImages(images);
        setGalleryTitle(`${product.product.name} - Product Images`);
        setShowImageGallery(true);
      }
    };

    const openVariantImageGallery = (variant) => {
      const images = variantImages[variant.id] || [];
      if (images.length > 0) {
        setGalleryImages(images);
        setGalleryTitle(`${variant.name} - Variant Images`);
        setShowImageGallery(true);
      }
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

    const productImageList = productImages[product.product.id] || [];

    return (
      <>
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
                  {productImageList.length > 0 ? (
                    <div
                      className="image-container"
                      onClick={openProductImageGallery}
                    >
                      <img
                        src={productImageList[0]}
                        alt={product.product.name}
                        className="detail-image"
                      />
                      {productImageList.length > 1 && (
                        <div className="image-count-badge">
                          <ImageIcon size={12} />
                          {productImageList.length}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="detail-image-placeholder">
                      <Package size={64} />
                    </div>
                  )}
                </div>
                <div className="product-basic-info">
                  <h3 className="product-detail-title">
                    {product.product.name}
                  </h3>
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
                      <p>{product.product.description}</p>
                    </div>
                  )}

                  {/* Product Images Gallery Button */}
                  {productImageList.length > 0 && (
                    <div className="product-images-section">
                      <button
                        className="btn-secondary btn-sm"
                        onClick={openProductImageGallery}
                      >
                        <ImageIcon size={14} />
                        View All Product Images ({productImageList.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Variants Section */}
              {product.variants && product.variants.length > 0 && (
                <div className="variants-section">
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
                      {product.variants.map((variant) => {
                        const variantImageList =
                          variantImages[variant.id] || [];
                        return (
                          <div
                            key={variant.id}
                            className={`variant-item ${
                              currentVariant?.id === variant.id ? "active" : ""
                            }`}
                            onClick={() => handleVariantSelect(variant)}
                          >
                            {/* Variant Image Thumbnail */}
                            <div className="variant-image-section">
                              {variantImageList.length > 0 && (
                                <div className="variant-image-thumbnail">
                                  <img
                                    src={variantImageList[0]}
                                    alt={variant.name}
                                    className="variant-thumb"
                                  />
                                  {variantImageList.length > 1 && (
                                    <div className="variant-image-count">
                                      {variantImageList.length}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="variant-info">
                              <h5 className="variant-name">{variant.name}</h5>
                              <span
                                className={`variant-status-badge variant-status-${
                                  variant.status || "active"
                                }`}
                              >
                                {variant.status || "active"}
                              </span>
                              <div className="variant-meta">
                                <span className="variant-code">
                                  {variant.code}
                                </span>
                                <span className="variant-price">
                                  ₹{variant.price}
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
                              {variantImageList.length > 0 && (
                                <div className="variant-image-info">
                                  <ImageIcon size={12} />
                                  <span>
                                    {variantImageList.length} image
                                    {variantImageList.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              )}
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
                              {variant.status === "inactive" ? (
                                <button
                                  className="action-btn activate-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleActivateVariant(variant,e);
                                    onClose();
                                  }}
                                  title="Activate variant"
                                  style={{
                                    backgroundColor: "#10b981",
                                    color: "white",
                                  }}
                                >
                                  <Power size={12} />
                                </button>
                              ) : (
                                <button
                                  className="action-btn delete-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteVariant(variant,e);
                                  }}
                                  title="Deactivate variant"
                                >
                                  <PowerOff size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Variant Detail Panel */}
                    {currentVariant && (
                      <div className="variant-detail-panel">
                        <div className="variant-detail-header">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <h5 style={{ margin: 0 }}>{currentVariant.name}</h5>
                            <span
                              className={`variant-status-badge variant-status-${
                                currentVariant.status || "active"
                              }`}
                            >
                              {currentVariant.status || "active"}
                            </span>
                          </div>
                          <div className="variant-price-large">
                            ₹{currentVariant.price}
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
                        {/* Variant Images */}
                        {variantImages[currentVariant.id] &&
                          variantImages[currentVariant.id].length > 0 && (
                            <div className="variant-images-section">
                              <h6>Variant Images</h6>
                              <div className="variant-images-preview">
                                {variantImages[currentVariant.id]
                                  .slice(0, 4)
                                  .map((image, index) => (
                                    <div
                                      key={index}
                                      className="variant-image-preview"
                                      onClick={() =>
                                        openVariantImageGallery(currentVariant)
                                      }
                                    >
                                      <img
                                        src={image}
                                        alt={`${currentVariant.name} ${
                                          index + 1
                                        }`}
                                      />
                                    </div>
                                  ))}
                                {variantImages[currentVariant.id].length >
                                  4 && (
                                  <div
                                    className="variant-image-more"
                                    onClick={() =>
                                      openVariantImageGallery(currentVariant)
                                    }
                                  >
                                    +
                                    {variantImages[currentVariant.id].length -
                                      4}
                                  </div>
                                )}
                              </div>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() =>
                                  openVariantImageGallery(currentVariant)
                                }
                              >
                                <ImageIcon size={14} />
                                View All Variant Images (
                                {variantImages[currentVariant.id].length})
                              </button>
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
                          {currentVariant.status === "inactive" ? (
                            <button
                              className="btn-success"
                              onClick={() => {
                                handleActivateVariant(currentVariant);
                                onClose();
                              }}
                              style={{
                                backgroundColor: "#10b981",
                                borderColor: "#10b981",
                              }}
                            >
                              <Power size={14} />
                              Activate Variant
                            </button>
                          ) : (
                            <button
                              className="btn-danger"
                              onClick={() =>
                                handleDeleteVariant(currentVariant)
                              }
                            >
                              <PowerOff size={14} />
                              Deactivate Variant
                            </button>
                          )}
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
                      This product doesn't have any variants yet. Create the
                      first variant to start selling this product.
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

        <ImageGalleryModal
          isOpen={showImageGallery}
          images={galleryImages}
          title={galleryTitle}
          onClose={() => setShowImageGallery(false)}
        />
      </>
    );
  };

  // Load product images - FIXED VERSION
  const loadProductImages = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];

      const response = await axios.get(`${API_BASE}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle both array and object formats for images
      let images = [];
      if (response.data.images && Array.isArray(response.data.images)) {
        // If images is an array of objects with image_url
        images = response.data.images.map((img) => img.image_url || img);
      } else if (response.data.product?.images) {
        // If images is a comma-separated string
        images = response.data.product.images
          .split(",")
          .filter((img) => img.trim());
      } else if (
        response.data.images &&
        typeof response.data.images === "string"
      ) {
        // If images is a comma-separated string at root level
        images = response.data.images.split(",").filter((img) => img.trim());
      }

      return images;
    } catch (error) {
      console.error(`Error loading images for product ${productId}:`, error);
      return [];
    }
  };

  // Load variant images
  const loadVariantImages = async (variantId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];

      const response = await axios.get(`${API_BASE}/variants/${variantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Extract images from the variant response
      const images = response.data.variant?.images || [];
      return images;
    } catch (error) {
      console.error(`Error loading images for variant ${variantId}:`, error);
      return [];
    }
  };

  // Load all images for products and their variants
  const loadAllImages = async (products) => {
    const productImageMap = {};

    for (const product of products) {
      // Load product images
      const productImgs = await loadProductImages(product.id);
      if (productImgs.length > 0) {
        productImageMap[product.id] = productImgs;
      }
    }

    setProductImages(productImageMap);
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

      // Load images for all products
      await loadAllImages(products);
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
    const matchesStatus =
      selectedStatus === "All Status" ||
      product.status === selectedStatus.toLowerCase();
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // View product details
  const handleView = async (product) => {
    try {
      const res = await axios.get(`${API_BASE}/products/${product.id}`);
      setSelectedProduct(res.data);

      // Load variant images for this product's variants
      if (res.data.variants) {
        const variantImageMap = {};
        for (const variant of res.data.variants) {
          const variantImgs = await loadVariantImages(variant.id);
          if (variantImgs.length > 0) {
            variantImageMap[variant.id] = variantImgs;
          }
        }
        setVariantImages((prev) => ({ ...prev, ...variantImageMap }));
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      setModalMessage("Failed to load product details");
      setShowErrorModal(true);
    }
  };

  // Activate product
  const handleActivate = (product) => {
    setProductToActivate(product);
    setShowActivateModal(true);
  };

  // Deactivate product (instead of delete)
  const handleDeactivate = (product) => {
    setProductToDeactivate(product);
    setShowDeactivateModal(true);
  };

  // Keep hard delete for admin purposes (optional)
  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmActivate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/products/${productToActivate.id}/activate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShowActivateModal(false);
      setProductToActivate(null);
      setModalMessage("Product activated successfully");
      setShowSuccessModal(true);
      fetchProducts();
    } catch (error) {
      console.error("Error activating product:", error);
      setShowActivateModal(false);
      setModalMessage("Failed to activate product");
      setShowErrorModal(true);
    }
  };

  const confirmDeactivate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/products/${productToDeactivate.id}/deactivate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShowDeactivateModal(false);
      setProductToDeactivate(null);
      setModalMessage("Product deactivated successfully");
      setShowSuccessModal(true);
      fetchProducts();
    } catch (error) {
      console.error("Error deactivating product:", error);
      setShowDeactivateModal(false);
      setModalMessage("Failed to deactivate product");
      setShowErrorModal(true);
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/products/${productToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
      setModalMessage("Product permanently deleted");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error deleting product:", error);
      setShowDeleteModal(false);
      setModalMessage("Failed to delete product");
      setShowErrorModal(true);
    }
  };

  // Add the confirm activate function
  const confirmVariantActivate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/variants/${variantToActivate.id}/activate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowVariantActivateModal(false);
      setVariantToActivate(null);
      setModalMessage("Variant activated successfully");
      setShowSuccessModal(true);
      fetchProducts();
    } catch (error) {
      console.error("Error activating variant:", error);
      setShowVariantActivateModal(false);
      setModalMessage("Failed to activate variant");
      setShowErrorModal(true);
    }
  };

  const confirmVariantDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/variants/${variantToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowVariantDeleteModal(false);
      setVariantToDelete(null);
      setModalMessage("Variant deactivated successfully");
      setShowSuccessModal(true);
      fetchProducts();
    } catch (error) {
      console.error("Error deactivating variant:", error);
      setShowVariantDeleteModal(false);
      setModalMessage("Failed to deactivate variant");
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

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="status-dropdown"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="view-toggle">
              <button
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <Grid size={16} />
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
                {searchTerm ||
                selectedCategory !== "All Categories" ||
                selectedStatus !== "All Status"
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
              {filteredProducts.map((product) => {
                const productImageList = productImages[product.id] || [];

                return viewMode === "grid" ? (
                  <div key={product.id} className="product-card">
                    <div className="product-image-container">
                      {productImageList.length > 0 ? (
                        <div className="product-image-wrapper">
                          <img
                            src={productImageList[0]}
                            alt={product.name}
                            className="product-image"
                          />
                          {productImageList.length > 1 && (
                            <div className="product-image-count">
                              <ImageIcon size={12} />
                              {productImageList.length}
                            </div>
                          )}
                        </div>
                      ) : product.primary_image ? (
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
                      <span
                        className={`product-status status-${product.status}`}
                      >
                        {product.status}
                      </span>
                    </div>
                    <p className="product-category">{product.category_name}</p>
                    <p className="product-description">{product.description}</p>
                    {productImageList.length > 0 && (
                      <div className="product-image-info">
                        <ImageIcon size={14} />
                        <span>
                          {productImageList.length} image
                          {productImageList.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
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
                      {product.status === "inactive" ? (
                        <button
                          className="action-btn activate-btn"
                          onClick={() => handleActivate(product)}
                          style={{
                            backgroundColor: "#10b981",
                            color: "white",
                          }}
                        >
                          <Power size={14} />
                          Activate
                        </button>
                      ) : (
                        <button
                          className="action-btn deactivate-btn"
                          onClick={() => handleDeactivate(product)}
                          style={{
                            backgroundColor: "red",
                            color: "white",
                          }}
                        >
                          <PowerOff size={14} />
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={product.id} className="product-list-item">
                    <div className="product-image-container">
                      {productImageList.length > 0 ? (
                        <div className="product-image-wrapper">
                          <img
                            src={productImageList[0]}
                            alt={product.name}
                            className="product-image"
                          />
                          {productImageList.length > 1 && (
                            <div className="product-image-count">
                              <ImageIcon size={12} />
                              {productImageList.length}
                            </div>
                          )}
                        </div>
                      ) : product.primary_image ? (
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
                        <div className="product-meta-inline">
                          <span className="product-sku">
                            {product.sku_prefix}
                          </span>
                          <span
                            className={`product-status status-${product.status}`}
                          >
                            {product.status}
                          </span>
                        </div>
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
                      {productImageList.length > 0 && (
                        <div
                          className="product-image-info"
                          style={{ marginTop: "8px" }}
                        >
                          <ImageIcon size={14} />
                          <span>
                            {productImageList.length} image
                            {productImageList.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
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
                      {product.status === "inactive" ? (
                        <button
                          className="action-btn activate-btn"
                          onClick={() => handleActivate(product)}
                          style={{
                            backgroundColor: "#10b981",
                            color: "white",
                          }}
                        >
                          <Power size={14} />
                          Activate
                        </button>
                      ) : (
                        <button
                          className="action-btn deactivate-btn"
                          onClick={() => handleDeactivate(product)}
                          style={{
                            backgroundColor: "red",
                            color: "white",
                          }}
                        >
                          <PowerOff size={14} />
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modals */}
          <ConfirmModal
            isOpen={showActivateModal}
            onClose={() => setShowActivateModal(false)}
            onConfirm={confirmActivate}
            title="Activate Product"
            message={`Are you sure you want to activate "${productToActivate?.name}"? It will be available for sale again.`}
            confirmText="Activate"
            confirmClass="btn-success"
            icon={Power}
            iconColor="#10b981"
          />

          <ConfirmModal
            isOpen={showDeactivateModal}
            onClose={() => setShowDeactivateModal(false)}
            onConfirm={confirmDeactivate}
            title="Deactivate Product"
            message={`Are you sure you want to deactivate "${productToDeactivate?.name}"? It will be hidden from active listings and all its variants will also be deactivated.`}
            confirmText="Deactivate"
            confirmClass="btn-warning"
            icon={PowerOff}
            iconColor="#f59e0b"
          />

          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
            title="Permanently Delete Product"
            message={`Are you sure you want to permanently delete "${productToDelete?.name}"? This action cannot be undone and will remove all data including order history.`}
            confirmText="Delete Permanently"
            confirmClass="btn-danger"
          />

          <ConfirmModal
            isOpen={showVariantActivateModal}
            onClose={() => setShowVariantActivateModal(false)}
            onConfirm={confirmVariantActivate}
            title="Activate Variant"
            message={`Are you sure you want to activate the variant "${variantToActivate?.name}"? It will be available for sale again.`}
            confirmText="Activate"
            confirmClass="btn-success"
            icon={Power}
            iconColor="#10b981"
          />

          <ConfirmModal
            isOpen={showVariantDeleteModal}
            onClose={() => setShowVariantDeleteModal(false)}
            onConfirm={confirmVariantDelete}
            title="Deactivate Variant"
            message={`Are you sure you want to deactivate the variant "${variantToDelete?.name}"? It will be hidden from active listings but order history will be preserved.`}
            confirmText="Deactivate"
            confirmClass="btn-warning"
            icon={PowerOff}
            iconColor="#f59e0b"
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