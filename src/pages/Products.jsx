import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/GreenLand/api";

const API_BASE = API_BASE_URL;

const Products = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // You can make this configurable if needed

  // Single modal state
  const [modalConfig, setModalConfig] = useState(null);

  // Separate notification state with proper structure
  const [notification, setNotification] = useState({
    show: false,
    type: "success", // 'success' or 'error'
    message: "",
    title: "",
  });

  // View options
  const [viewMode, setViewMode] = useState("grid");

  // Image states - consolidated
  const [imageData, setImageData] = useState({
    productImages: {},
    variantImages: {},
  });

  // Refs to prevent stale closures
  const notificationTimeoutRef = useRef(null);

  // Optimized notification handlers with proper cleanup
  const showNotification = useCallback((type, title, message) => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setNotification({
      show: true,
      type,
      title,
      message,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, show: false }));

    // Clear timeout ref
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Optimized image loading functions with stable references
  const loadProductImages = useCallback(async (productId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];

      const response = await axios.get(`${API_BASE}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let images = [];
      if (response.data.images && Array.isArray(response.data.images)) {
        images = response.data.images.map((img) => img.image_url || img);
      } else if (response.data.product?.images) {
        images = response.data.product.images
          .split(",")
          .filter((img) => img.trim());
      } else if (
        response.data.images &&
        typeof response.data.images === "string"
      ) {
        images = response.data.images.split(",").filter((img) => img.trim());
      }

      return images;
    } catch (error) {
      console.error(`Error loading images for product ${productId}:`, error);
      return [];
    }
  }, []);

  // Optimized batch image loading with stable reference
  const loadAllImages = useCallback(
    async (products) => {
      try {
        // Use Promise.all to load all product images concurrently
        const imagePromises = products.map(async (product) => {
          const images = await loadProductImages(product.id);
          return { productId: product.id, images };
        });

        const imageResults = await Promise.all(imagePromises);

        // Batch update the state once with all images
        const productImageMap = {};
        imageResults.forEach(({ productId, images }) => {
          if (images.length > 0) {
            productImageMap[productId] = images;
          }
        });

        setImageData((prev) => ({
          ...prev,
          productImages: productImageMap,
        }));
      } catch (error) {
        console.error("Error loading images:", error);
      }
    },
    [loadProductImages]
  );
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ Fetch all products by setting a high limit
      const res = await axios.get(`${API_BASE}/products`, {
        params: {
          page: 1,
          limit: 1000, // adjust this based on your backend's max limit
        },
      });

      const { products } = res.data;

      const uniqueCategories = [
        ...new Set(products.map((p) => p.category_name)),
      ];

      setProducts(products);
      setCategories(uniqueCategories);

      // Load images after products are set
      await loadAllImages(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      showNotification("error", "Error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [loadAllImages, showNotification]);

  // Stable API functions - memoized with useCallback and dependencies
  const confirmActivate = useCallback(
    async (product) => {
      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `${API_BASE}/products/${product.id}/activate`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        await fetchProducts();
        showNotification(
          "success",
          "Success",
          "Product activated successfully"
        );
        // Refetch products to get updated data
      } catch (error) {
        console.error("Error activating product:", error);
        showNotification("error", "Error", "Failed to activate product");
      }
    },
    [showNotification, fetchProducts]
  ); // Only depend on showNotification

  const confirmDeactivate = useCallback(
    async (product) => {
      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `${API_BASE}/products/${product.id}/deactivate`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        await fetchProducts();
        showNotification(
          "success",
          "Success",
          "Product deactivated successfully"
        );
      } catch (error) {
        console.error("Error deactivating product:", error);
        showNotification("error", "Error", "Failed to deactivate product");
      }
    },
    [showNotification, fetchProducts]
  );

  const confirmDelete = useCallback(
    async (product) => {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_BASE}/products/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Update products state directly without refetch for better UX
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        showNotification("success", "Success", "Product permanently deleted");
      } catch (error) {
        console.error("Error deleting product:", error);
        showNotification("error", "Error", "Failed to delete product");
      }
    },
    [showNotification, fetchProducts]
  );

  const confirmVariantActivate = useCallback(
    async (variant) => {
      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `${API_BASE}/variants/${variant.id}/activate`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        await fetchProducts();
        showNotification(
          "success",
          "Success",
          "Variant activated successfully"
        );
      } catch (error) {
        console.error("Error activating variant:", error);
        showNotification("error", "Error", "Failed to activate variant");
      }
    },
    [showNotification, fetchProducts]
  );

  const confirmVariantDelete = useCallback(
    async (variant) => {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_BASE}/variants/${variant.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchProducts();
        showNotification(
          "success",
          "Success",
          "Variant deactivated successfully"
        );
      } catch (error) {
        console.error("Error deactivating variant:", error);
        showNotification("error", "Error", "Failed to deactivate variant");
      }
    },
    [showNotification, fetchProducts]
  );

  // Memoized modal configurations with stable dependencies
  const modalConfigs = useMemo(
    () => ({
      activateProduct: (data) => ({
        title: "Activate Product",
        message: `Are you sure you want to activate "${data?.name}"? It will be available for sale again.`,
        confirmText: "Activate",
        confirmClass: "btn-success",
        icon: Power,
        iconColor: "#10b981",
        onConfirm: () => confirmActivate(data),
      }),
      deactivateProduct: (data) => ({
        title: "Deactivate Product",
        message: `Are you sure you want to deactivate "${data?.name}"? It will be hidden from active listings and all its variants will also be deactivated.`,
        confirmText: "Deactivate",
        confirmClass: "btn-warning",
        icon: PowerOff,
        iconColor: "#f59e0b",
        onConfirm: () => confirmDeactivate(data),
      }),
      deleteProduct: (data) => ({
        title: "Permanently Delete Product",
        message: `Are you sure you want to permanently delete "${data?.name}"? This action cannot be undone and will remove all data including order history.`,
        confirmText: "Delete Permanently",
        confirmClass: "btn-danger",
        icon: AlertTriangle,
        iconColor: "#f59e0b",
        onConfirm: () => confirmDelete(data),
      }),
      activateVariant: (data) => ({
        title: "Activate Variant",
        message: `Are you sure you want to activate the variant "${data?.name}"? It will be available for sale again.`,
        confirmText: "Activate",
        confirmClass: "btn-success",
        icon: Power,
        iconColor: "#10b981",
        onConfirm: () => confirmVariantActivate(data),
      }),
      deactivateVariant: (data) => ({
        title: "Deactivate Variant",
        message: `Are you sure you want to deactivate the variant "${data?.name}"? It will be hidden from active listings but order history will be preserved.`,
        confirmText: "Deactivate",
        confirmClass: "btn-warning",
        icon: PowerOff,
        iconColor: "#f59e0b",
        onConfirm: () => confirmVariantDelete(data),
      }),
    }),
    [
      confirmActivate,
      confirmDeactivate,
      confirmDelete,
      confirmVariantActivate,
      confirmVariantDelete,
    ]
  );

  const openModal = useCallback(
    (type, data) => {
      const config = modalConfigs[type]?.(data);
      if (config) {
        setModalConfig(config);
      }
    },
    [modalConfigs]
  );

  const closeModal = useCallback(() => setModalConfig(null), []);

  const handleConfirm = useCallback(() => {
    if (modalConfig?.onConfirm) {
      modalConfig.onConfirm();
    }
    closeModal();
  }, [modalConfig, closeModal]);

  // Memoized Image Gallery Modal Component with stable props
  const ImageGalleryModal = React.memo(({ isOpen, images, onClose, title }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
      if (isOpen) {
        setCurrentImageIndex(0);
      }
    }, [isOpen, images]);

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
  });

  // Memoized Reusable ConfirmModal component with stable props
  const ConfirmModal = React.memo(
    ({
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  backgroundColor: "white",
                }}
              >
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
    }
  );

  // Optimized NotificationModal with proper memoization
  const NotificationModal = React.memo(({ notification, onClose }) => {
    if (!notification.show) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content modal-small">
          <div className="modal-header">
            <h2>{notification.title}</h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: "white",
              }}
            >
              {notification.type === "success" && (
                <Check
                  style={{ color: "#10b981", width: "24px", height: "24px" }}
                />
              )}
              {notification.type === "error" && (
                <AlertTriangle
                  style={{ color: "#ef4444", width: "24px", height: "24px" }}
                />
              )}
              <p style={{ margin: 0, color: "#374151" }}>
                {notification.message}
              </p>
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
  });

  // Enhanced Product Detail Modal Component with Images - MEMOIZED with proper dependencies
  const ProductDetailModal = React.memo(({ isOpen, onClose, product }) => {
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
        e.stopPropagation();
      }
      openModal("activateVariant", variant);
    };

    const handleEditVariant = (variant, e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
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
        e.stopPropagation();
      }
      openModal("deactivateVariant", variant);
      onClose();
    };

    const openProductImageGallery = () => {
      const images = imageData.productImages[product.product.id] || [];
      if (images.length > 0) {
        setGalleryImages(images);
        setGalleryTitle(`${product.product.name} - Product Images`);
        setShowImageGallery(true);
      }
    };

    const openVariantImageGallery = (variant) => {
      const images = imageData.variantImages[variant.id] || [];
      if (images.length > 0) {
        setGalleryImages(images);
        setGalleryTitle(`${variant.name} - Variant Images`);
        setShowImageGallery(true);
      }
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

    const productImageList = imageData.productImages[product.product.id] || [];

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
                          imageData.variantImages[variant.id] || [];
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
                                    handleActivateVariant(variant, e);
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
                                    handleDeleteVariant(variant, e);
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
                        {imageData.variantImages[currentVariant.id] &&
                          imageData.variantImages[currentVariant.id].length >
                            0 && (
                            <div className="variant-images-section">
                              <h6>Variant Images</h6>
                              <div className="variant-images-preview">
                                {imageData.variantImages[currentVariant.id]
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
                                {imageData.variantImages[currentVariant.id]
                                  .length > 4 && (
                                  <div
                                    className="variant-image-more"
                                    onClick={() =>
                                      openVariantImageGallery(currentVariant)
                                    }
                                  >
                                    +
                                    {imageData.variantImages[currentVariant.id]
                                      .length - 4}
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
                                {
                                  imageData.variantImages[currentVariant.id]
                                    .length
                                }
                                )
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
  });

  const loadVariantImages = useCallback(async (variantId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];

      const response = await axios.get(`${API_BASE}/variants/${variantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const images = response.data.variant?.images || [];
      return images;
    } catch (error) {
      console.error(`Error loading images for variant ${variantId}:`, error);
      return [];
    }
  }, []);

  // Optimized batch image loading with stable reference
  // const loadAllImages = useCallback(
  //   async (products) => {
  //     try {
  //       // Use Promise.all to load all product images concurrently
  //       const imagePromises = products.map(async (product) => {
  //         const images = await loadProductImages(product.id);
  //         return { productId: product.id, images };
  //       });

  //       const imageResults = await Promise.all(imagePromises);

  //       // Batch update the state once with all images
  //       const productImageMap = {};
  //       imageResults.forEach(({ productId, images }) => {
  //         if (images.length > 0) {
  //           productImageMap[productId] = images;
  //         }
  //       });

  //       setImageData((prev) => ({
  //         ...prev,
  //         productImages: productImageMap,
  //       }));
  //     } catch (error) {
  //       console.error("Error loading images:", error);
  //     }
  //   },
  //   [loadProductImages]
  // );
  // Stable fetchProducts function with proper dependency management
  // Memoize filtered products to prevent recalculation on every render
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
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
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  // Add pagination logic
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / itemsPerPage);
  }, [filteredProducts.length, itemsPerPage]);

  // Fetch all products on mount
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchProducts();
  }, [fetchProducts]);
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus]);
  // Memoize filtered products to prevent recalculation on every render
  // const filteredProducts = useMemo(() => {
  //   return products.filter((product) => {
  //     const matchesSearch = product.name
  //       .toLowerCase()
  //       .includes(searchTerm.toLowerCase());
  //     const matchesCategory =
  //       selectedCategory === "All Categories" ||
  //       product.category_name === selectedCategory;
  //     const matchesStatus =
  //       selectedStatus === "All Status" ||
  //       product.status === selectedStatus.toLowerCase();
  //     return matchesSearch && matchesCategory && matchesStatus;
  //   });
  // }, [products, searchTerm, selectedCategory, selectedStatus]);

  // Optimized view product details with batched updates
  const handleView = useCallback(
    async (product) => {
      try {
        const res = await axios.get(`${API_BASE}/products/${product.id}`);

        // Load variant images if variants exist
        let variantImageUpdates = {};
        if (res.data.variants && res.data.variants.length > 0) {
          const variantImagePromises = res.data.variants.map(
            async (variant) => {
              const images = await loadVariantImages(variant.id);
              return { variantId: variant.id, images };
            }
          );

          const variantImageResults = await Promise.all(variantImagePromises);
          variantImageResults.forEach(({ variantId, images }) => {
            if (images.length > 0) {
              variantImageUpdates[variantId] = images;
            }
          });
        }

        // Batch state updates using React 18's automatic batching
        setSelectedProduct(res.data);
        if (Object.keys(variantImageUpdates).length > 0) {
          setImageData((prev) => ({
            ...prev,
            variantImages: { ...prev.variantImages, ...variantImageUpdates },
          }));
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        showNotification("error", "Error", "Failed to load product details");
      }
    },
    [loadVariantImages, showNotification]
  );

  // Memoized action handlers with stable references
  const handleActivate = useCallback(
    (product) => {
      openModal("activateProduct", product);
    },
    [openModal]
  );

  const handleDeactivate = useCallback(
    (product) => {
      openModal("deactivateProduct", product);
    },
    [openModal]
  );

  const handleDelete = useCallback(
    (product) => {
      openModal("deleteProduct", product);
    },
    [openModal]
  );

  // Memoized navigation handlers with stable references
  const handleAddVariant = useCallback(
    (product) => {
      navigate("/add-product-variant", {
        state: {
          formType: "variant",
          preSelectedCategory: product.category_id,
          preSelectedProduct: product.id,
          categoryName: product.category_name,
          productName: product.name,
        },
      });
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (product) => {
      navigate("/add-product-variant", {
        state: {
          editMode: true,
          formType: "product",
          editData: product,
        },
      });
    },
    [navigate]
  );

  const handleCreate = useCallback(() => {
    navigate("/add-product-variant", {
      state: {
        formType: "product",
      },
    });
  }, [navigate]);
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    // Scroll to top of products list
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [totalPages]);
  // Stable modal close handlers
  const closeProductModal = useCallback(() => setSelectedProduct(null), []);

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
              {paginatedProducts.map((product) => {
                const productImageList =
                  imageData.productImages[product.id] || [];

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
          {/* Pagination Controls */}
          {!loading && filteredProducts.length > 0 && totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}{" "}
                of {filteredProducts.length} products
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            className={`pagination-page ${
                              currentPage === page ? "active" : ""
                            }`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="pagination-ellipsis">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
                <button
                  className="pagination-btn"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
          {/* Single Reusable Confirm Modal */}
          {modalConfig && (
            <ConfirmModal
              isOpen={true}
              onClose={closeModal}
              onConfirm={handleConfirm}
              title={modalConfig.title}
              message={modalConfig.message}
              confirmText={modalConfig.confirmText}
              confirmClass={modalConfig.confirmClass}
              icon={modalConfig.icon}
              iconColor={modalConfig.iconColor}
            />
          )}

          {/* Single Notification Modal */}
          <NotificationModal
            key="notification"
            notification={notification}
            onClose={hideNotification}
          />

          {/* Product Detail Modal */}
          <ProductDetailModal
            isOpen={!!selectedProduct}
            onClose={closeProductModal}
            product={selectedProduct}
          />
        </div>
      </div>
    </>
  );
};

export default Products;
