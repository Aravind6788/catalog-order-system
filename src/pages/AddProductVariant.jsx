import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Upload,
  X,
  Check,
  AlertCircle,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Star,
  Tag,
} from "lucide-react";

const AddProductVariant = () => {
  const API_BASE = "http://localhost/GreenLand/api";
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location || {};

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Determine initial form type and edit mode from navigation state
  const [formType, setFormType] = useState(state?.formType || "product");
  const [editMode, setEditMode] = useState(state?.editMode || false);
  const [editingId, setEditingId] = useState(state?.editData?.id || null);

  // Common fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Product specific fields
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [existingSkus, setExistingSkus] = useState([]);

  // Variant specific fields
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState([]);
  const [existingVariantCodes, setExistingVariantCodes] = useState([]);

  // Attribute management
  const [attributes, setAttributes] = useState([]);
  const [attributeValues, setAttributeValues] = useState({});
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [showAttributeSelector, setShowAttributeSelector] = useState(false);

  // Searchable dropdown component
  const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder,
    filterKey,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredOptions = options.filter((option) =>
      option[filterKey].toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find((option) => option.id == value);

    return (
      <div className="searchable-select">
        <div
          className="searchable-select-trigger"
          onClick={() => setIsOpen(!isOpen)}
        >
          <input
            type="text"
            className="form-input"
            placeholder={
              selectedOption ? selectedOption[filterKey] : placeholder
            }
            value={
              isOpen
                ? searchTerm
                : selectedOption
                ? selectedOption[filterKey]
                : ""
            }
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            readOnly={!isOpen}
          />
          <ChevronDown
            size={16}
            className={`searchable-select-icon ${isOpen ? "open" : ""}`}
          />
        </div>

        {isOpen && (
          <div className="searchable-select-dropdown">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className="searchable-select-option"
                  onClick={() => {
                    onChange(option.id, option[filterKey]);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {option[filterKey]}
                </div>
              ))
            ) : (
              <div className="searchable-select-option disabled">
                No options found
              </div>
            )}
          </div>
        )}

        {isOpen && (
          <div
            className="searchable-select-overlay"
            onClick={() => {
              setIsOpen(false);
              setSearchTerm("");
            }}
          />
        )}
      </div>
    );
  };

  // Modal component
  const Modal = ({ isOpen, onClose, title, message, type = "info" }) => {
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
                <AlertCircle
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

  const showMessage = (message, type = "info") => {
    setModalMessage(message);
    if (type === "success") {
      setShowSuccessModal(true);
    } else if (type === "error") {
      setShowErrorModal(true);
    }
  };

  // Initialize form based on navigation state
  useEffect(() => {
    if (state) {
      // Handle pre-selection from "Add Variant" button
      if (
        state.formType === "variant" &&
        state.preSelectedCategory &&
        state.preSelectedProduct
      ) {
        setCategoryId(state.preSelectedCategory.toString());
        setProductId(state.preSelectedProduct.toString());
      }

      // Handle edit mode
      if (state.editMode && state.editData) {
        loadEditData(state.editData);
      }
    }
  }, [state]);

  // Load data for editing
  const loadEditData = async (editData) => {
    try {
      setName(editData.name || "");
      setDescription(editData.description || "");
      setStatus(editData.status || "active");
      setCategoryId(editData.category_id?.toString() || "");

      if (formType === "product") {
        setSku(editData.sku_prefix || "");

        // Fetch existing product images
        const token = localStorage && localStorage.getItem("token");
        if (token) {
          const response = await fetch(`${API_BASE}/products/${editData.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();

          if (data.images) {
            setUploadedImages(
              data.images.map((img) => ({
                id: img.id,
                url: img.image_url,
                is_primary: img.is_primary,
              }))
            );
          }
        }
      } else if (formType === "variant") {
        setCode(editData.code || "");
        setPrice(editData.price?.toString() || "");
        setQuantity(editData.quantity?.toString() || "0");
        setProductId(editData.product_id?.toString() || "");

        // Fetch existing variant images and attributes
        const token = localStorage && localStorage.getItem("token");
        if (token) {
          const response = await fetch(`${API_BASE}/variants/${editData.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();

          if (data.variant) {
            // Handle variant images if they exist in the response
          }

          // Load existing variant attributes
          const attrResponse = await fetch(
            `${API_BASE}/variants/${editData.id}/attributes`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const attrData = await attrResponse.json();

          if (attrData.attributes) {
            setSelectedAttributes(
              attrData.attributes.map((attr) => ({
                attributeId: attr.attribute_id,
                attributeName: attr.attribute_name,
                valueId: attr.value_id,
                valueName: attr.value_name,
              }))
            );
          }
        }
      }
    } catch (error) {
      console.error("Error loading edit data:", error);
      showMessage("Failed to load data for editing", "error");
    }
  };

  // Fetch existing variant codes
  const fetchVariantCodes = async () => {
    try {
      const token = localStorage && localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/variants/codes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      setExistingVariantCodes(data.codes || []);
    } catch (err) {
      console.error("Failed to fetch variant codes", err);
    }
  };

  // Fetch all attributes
  const fetchAttributes = async () => {
    try {
      const token = localStorage && localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/attributes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAttributes(data || []);
    } catch (err) {
      console.error("Failed to fetch attributes", err);
    }
  };

  // Fetch attribute values for a specific attribute
  const fetchAttributeValues = async (attributeId) => {
    if (attributeValues[attributeId]) return; // Already loaded

    try {
      const token = localStorage && localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE}/attributes/${attributeId}/values`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      setAttributeValues((prev) => ({
        ...prev,
        [attributeId]: data || [],
      }));
    } catch (err) {
      console.error("Failed to fetch attribute values", err);
    }
  };

  // Add attribute to selection
  const addAttribute = (attributeId, attributeName) => {
    if (selectedAttributes.find((attr) => attr.attributeId === attributeId)) {
      showMessage("Attribute already added", "error");
      return;
    }

    setSelectedAttributes((prev) => [
      ...prev,
      {
        attributeId: parseInt(attributeId),
        attributeName,
        valueId: "",
        valueName: "",
      },
    ]);

    // Fetch values for this attribute
    fetchAttributeValues(attributeId);
    setShowAttributeSelector(false);
  };

  // Update attribute value selection
  const updateAttributeValue = (attributeId, valueId, valueName) => {
    setSelectedAttributes((prev) =>
      prev.map((attr) =>
        attr.attributeId === attributeId
          ? { ...attr, valueId: parseInt(valueId), valueName }
          : attr
      )
    );
  };

  // Remove attribute from selection
  const removeAttribute = (attributeId) => {
    setSelectedAttributes((prev) =>
      prev.filter((attr) => attr.attributeId !== attributeId)
    );
  };

  // Fetch SKUs for product form
  const fetchSkus = async () => {
    try {
      const token = localStorage && localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/products/skus`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      setExistingSkus(data.skus || []);
    } catch (err) {
      console.error("Failed to fetch SKUs", err);
    }
  };

  // Fetch products by category for variant form
  const fetchProductsByCategory = async (catId) => {
    if (!catId) {
      setProducts([]);
      return;
    }

    try {
      const token = localStorage && localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/categories/${catId}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to fetch products", err);
      setProducts([]);
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage && localStorage.getItem("token");
        if (!token) {
          showMessage("Authentication token missing", "error");
          return;
        }

        const response = await fetch(`${API_BASE}/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        setCategories(data);

        // Build categoryId → code map
        const map = {};
        const flatten = (cats) => {
          cats.forEach((cat) => {
            map[cat.id] = cat.code;
            if (cat.children) flatten(cat.children);
          });
        };
        flatten(data);
        setCategoryMap(map);

        fetchSkus();
        fetchVariantCodes();
        fetchAttributes();
      } catch (err) {
        console.error(err);
        showMessage("Failed to fetch categories", "error");
      }
    };

    fetchCategories();
  }, []);

  // Auto-generate variant code (only in create mode)
  useEffect(() => {
    if (editMode || formType !== "variant" || !name || !productId) {
      if (!editMode) setCode("");
      return;
    }

    const selectedProduct = products.find((p) => p.id == productId);
    if (!selectedProduct || !selectedProduct.sku_prefix) return;

    const productCode = selectedProduct.sku_prefix;
    const variantNamePrefix = name.slice(0, 2).toUpperCase();
    let baseCode = productCode + variantNamePrefix;
    let newCode = baseCode;
    let counter = 1;

    while (existingVariantCodes.includes(newCode)) {
      newCode = `${baseCode}${counter++}`;
    }

    setCode(newCode);
  }, [name, productId, products, existingVariantCodes, formType, editMode]);

  // Auto-generate SKU for products (only in create mode)
  useEffect(() => {
    if (editMode || formType !== "product" || !name || !categoryId) {
      if (!editMode) setSku("");
      return;
    }

    const catCode = categoryMap[categoryId];
    if (!catCode) return;

    let baseSku = (catCode + name.slice(0, 2)).toUpperCase();
    let newSku = baseSku;
    let counter = 1;

    while (existingSkus.includes(newSku)) {
      newSku = `${baseSku}${counter++}`;
    }

    setSku(newSku);
  }, [name, categoryId, categoryMap, existingSkus, formType, editMode]);

  // Handle category change for variant form
  useEffect(() => {
    if (formType === "variant" && categoryId) {
      fetchProductsByCategory(categoryId);
      if (!state?.preSelectedProduct) {
        setProductId("");
      }
    }
  }, [categoryId, formType]);

  // Handle multiple image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    let errorMessages = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        errorMessages.push(`${file.name} is not a valid image file`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        errorMessages.push(`${file.name} is too large (max 10MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (errorMessages.length > 0) {
      showMessage(errorMessages.join(", "), "error");
      return;
    }

    setImageFiles([...imageFiles, ...validFiles]);
  };

  // Remove image from selection
  const removeImage = (index) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  // Remove uploaded image
  const removeUploadedImage = async (index, imageId) => {
    try {
      const token = localStorage && localStorage.getItem("token");
      const endpoint =
        formType === "variant"
          ? `${API_BASE}/variant-images/${imageId}`
          : `${API_BASE}/product-images/${imageId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUploadedImages(uploadedImages.filter((_, i) => i !== index));
        showMessage("Image removed successfully", "success");
      } else {
        showMessage("Failed to remove image", "error");
      }
    } catch (err) {
      console.error("Failed to remove image", err);
      showMessage("Failed to remove image", "error");
    }
  };

  // Set primary image
  const setPrimaryImage = async (imageId) => {
    try {
      const token = localStorage && localStorage.getItem("token");
      const endpoint =
        formType === "variant"
          ? `${API_BASE}/variant-images/${imageId}/primary`
          : `${API_BASE}/product-images/${imageId}/primary`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        // Update local state
        setUploadedImages(
          uploadedImages.map((img) => ({
            ...img,
            is_primary: img.id === imageId ? 1 : 0,
          }))
        );
        showMessage("Primary image updated", "success");
      } else {
        showMessage("Failed to update primary image", "error");
      }
    } catch (err) {
      console.error("Failed to set primary image", err);
      showMessage("Failed to set primary image", "error");
    }
  };

  // Upload images to Cloudinary
  const uploadImages = async () => {
    const uploadedUrls = [];

    for (const file of imageFiles) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "newtest");
      data.append("cloud_name", "dxrdpvn3u");

      const cloudRes = await fetch(
        "https://api.cloudinary.com/v1_1/dxrdpvn3u/image/upload",
        { method: "POST", body: data }
      );
      const cloudData = await cloudRes.json();

      if (!cloudData.secure_url) {
        throw new Error(`Failed to upload image: ${file.name}`);
      }

      uploadedUrls.push(cloudData.secure_url);
    }

    return uploadedUrls;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      showMessage("Name is required", "error");
      return;
    }
    if (formType === "product" && !editMode && !sku.trim()) {
      showMessage("SKU is required", "error");
      return;
    }
    if (formType === "variant" && !editMode && !code.trim()) {
      showMessage("Variant code generation failed", "error");
      return;
    }
    if (formType === "variant" && !price) {
      showMessage("Price is required", "error");
      return;
    }
    if (formType === "variant" && !productId) {
      showMessage("Please select a product", "error");
      return;
    }

    // Only require images for new items, not edits
    if (!editMode && imageFiles.length === 0 && uploadedImages.length === 0) {
      showMessage("Please select at least one image", "error");
      return;
    }

    try {
      setUploading(true);
      const token = localStorage && localStorage.getItem("token");

      let entityId = editingId;

      if (editMode) {
        // Update existing product or variant
        if (formType === "product") {
          const productData = {
            name: name.trim(),
            description: description.trim(),
            category_id: categoryId || null,
            status,
          };

          const productResponse = await fetch(
            `${API_BASE}/products/${editingId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(productData),
            }
          );

          if (!productResponse.ok) {
            throw new Error("Failed to update product");
          }

          showMessage("Product updated successfully!", "success");
        } else {
          // Update variant
          const variantData = {
            name: name.trim(),
            code: code.trim(),
            description: description.trim(),
            price: parseFloat(price),
            status,
          };

          const variantResponse = await fetch(
            `${API_BASE}/variants/${editingId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(variantData),
            }
          );

          if (!variantResponse.ok) {
            throw new Error("Failed to update variant");
          }

          // Update variant attributes if modified
          // Note: This would need additional logic to compare existing vs new attributes
          // For now, we'll just show success message
          showMessage("Variant updated successfully!", "success");
        }
      } else {
        // Create new product or variant
        if (formType === "product") {
          const productData = {
            name: name.trim(),
            sku_prefix: sku.trim(),
            description: description.trim(),
            category_id: categoryId || null,
            status,
          };

          const productResponse = await fetch(`${API_BASE}/products`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(productData),
          });

          if (!productResponse.ok) {
            throw new Error("Failed to create product");
          }

          const productResult = await productResponse.json();
          entityId = productResult.id;

          showMessage("Product created successfully!", "success");
          fetchSkus();
        } else {
          const variantData = {
            name: name.trim(),
            code: code.trim(),
            description: description.trim(),
            price: parseFloat(price),
            quantity: parseInt(quantity),
          };

          const variantResponse = await fetch(
            `${API_BASE}/products/${productId}/variants`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(variantData),
            }
          );

          if (!variantResponse.ok) {
            throw new Error("Failed to create variant");
          }

          const variantResult = await variantResponse.json();
          entityId = variantResult.variant_id;

          // Assign attributes to the variant
          if (selectedAttributes.length > 0) {
            for (const attribute of selectedAttributes) {
              if (attribute.valueId) {
                try {
                  await fetch(`${API_BASE}/variants/${entityId}/attributes`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      attribute_value_id: attribute.valueId,
                    }),
                  });
                } catch (err) {
                  console.error(
                    `Failed to assign attribute ${attribute.attributeName}`,
                    err
                  );
                }
              }
            }
          }

          showMessage("Variant created successfully!", "success");
        }
      }

      // Upload new images if any
      if (imageFiles.length > 0) {
        const uploadedUrls = await uploadImages();

        for (let i = 0; i < uploadedUrls.length; i++) {
          const endpoint =
            formType === "variant"
              ? `${API_BASE}/variants/${entityId}/images`
              : `${API_BASE}/products/${entityId}/images`;

          const imageResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image_url: uploadedUrls[i],
              is_primary: uploadedImages.length === 0 && i === 0, // First image is primary only if no existing images
            }),
          });

          if (!imageResponse.ok) {
            console.error(`Failed to add image ${i + 1}`);
          }
        }
      }

      // Reset form only if not editing
      if (!editMode) {
        resetForm();
      }

      // Navigate back to products page after successful operation
      setTimeout(() => {
        navigate("/products");
      }, 1000);
    } catch (err) {
      console.error(err);
      showMessage(
        `Failed to ${editMode ? "update" : "create"} ${formType}`,
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSku("");
    setCode("");
    setPrice("");
    setQuantity("0");
    setCategoryId("");
    setProductId("");
    setImageFiles([]);
    setUploadedImages([]);
    setStatus("active");
    setSelectedAttributes([]);

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const handleFormTypeChange = (type) => {
    setFormType(type);
    if (!editMode) {
      resetForm();
    }
  };

  return (
    <>
      <style>
        {`
          .categories-page {
            padding: 24px;
            background: #f8fafc;
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }

          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .page-title {
            font-size: 28px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }

          .form-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            max-width: 800px;
            margin: 0 auto;
          }

          .form-header {
            padding: 24px;
            border-bottom: 1px solid #e2e8f0;
            background: #f8fafc;
          }

          .form-body {
            padding: 24px;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #374151;
            font-size: 14px;
          }

          .form-input {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
            box-sizing: border-box;
          }

          .form-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-input:read-only {
            background: #f9fafb;
            color: #6b7280;
          }

          .code-input {
            background: #f9fafb;
            color: #6b7280;
            font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
          }

          .btn-primary {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            transition: background 0.2s;
          }

          .btn-primary:hover:not(:disabled) {
            background: #2563eb;
          }

          .btn-primary:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }

          .btn-secondary {
            background: #f1f5f9;
            color: #475569;
            border: 1px solid #d1d5db;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .btn-secondary:hover {
            background: #e2e8f0;
          }

          .btn-danger {
            background: #ef4444;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;
          }

          .btn-danger:hover:not(:disabled) {
            background: #dc2626;
          }

          .btn-danger:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }

          .form-toggle {
            display: flex;
            gap: 10px;
            margin-bottom: 24px;
          }

          .toggle-btn {
            padding: 12px 24px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: #f8f9fa;
            color: #374151;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          }

          .toggle-btn.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
          }

          .toggle-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
            margin-top: 12px;
          }

          .image-item {
            position: relative;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            overflow: hidden;
            background: #f8f9fa;
          }

          .image-preview {
            width: 100%;
            height: 120px;
            object-fit: cover;
          }

          .image-actions {
            position: absolute;
            top: 4px;
            right: 4px;
            display: flex;
            gap: 4px;
          }

          .image-btn {
            width: 24px;
            height: 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }

          .remove-btn {
            background: #ef4444;
            color: white;
          }

          .primary-btn {
            background: #10b981;
            color: white;
          }

          .set-primary-btn {
            background: #3b82f6;
            color: white;
          }

          .image-info {
            padding: 8px;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }

          .primary-badge {
            position: absolute;
            bottom: 4px;
            left: 4px;
            background: #10b981;
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 500;
          }

          .file-upload-area {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            transition: border-color 0.2s;
            cursor: pointer;
          }

          .file-upload-area:hover {
            border-color: #3b82f6;
          }

          .file-upload-area.dragover {
            border-color: #3b82f6;
            background: #f0f9ff;
          }

          /* Attribute Styles */
          .attributes-section {
            margin-top: 24px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f8fafc;
          }

          .attributes-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .attribute-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            margin-bottom: 8px;
          }

          .attribute-label {
            font-weight: 500;
            color: #374151;
            min-width: 120px;
          }

          .attribute-remove {
            background: #ef4444;
            color: white;
            border: none;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
          }

          /* Searchable Select Styles */
          .searchable-select {
            position: relative;
            width: 100%;
          }

          .searchable-select-trigger {
            position: relative;
            display: flex;
            align-items: center;
          }

          .searchable-select-icon {
            position: absolute;
            right: 12px;
            color: #6b7280;
            transition: transform 0.2s;
          }

          .searchable-select-icon.open {
            transform: rotate(180deg);
          }

          .searchable-select-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            max-height: 200px;
            overflow-y: auto;
            z-index: 10;
          }

          .searchable-select-option {
            padding: 12px;
            cursor: pointer;
            border-bottom: 1px solid #f3f4f6;
            transition: background 0.2s;
          }

          .searchable-select-option:hover {
            background: #f9fafb;
          }

          .searchable-select-option.disabled {
            color: #9ca3af;
            cursor: not-allowed;
          }

          .searchable-select-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 5;
          }

          /* Modal Styles */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.2s ease-out;
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            animation: slideIn 0.3s ease-out;
          }

          .modal-small {
            max-width: 400px;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid #e2e8f0;
          }

          .modal-header h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #64748b;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: background 0.2s;
          }

          .modal-close:hover {
            background: #f1f5f9;
          }

          .modal-body {
            padding: 24px;
          }

          .modal-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            padding: 20px 24px;
            border-top: 1px solid #e2e8f0;
            background: #f9fafb;
          }

          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (max-width: 768px) {
            .categories-page { padding: 16px; }
            .form-toggle { flex-direction: column; }
            .page-header { flex-direction: column; gap: 16px; align-items: stretch; }
            .modal-content { width: 95%; margin: 20px; }
            .image-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
          }
        `}
      </style>

      <div className="categories-page">
        <div className="page-header">
          <h1 className="page-title">
            {editMode ? `Edit ${formType}` : `Add ${formType}`}
          </h1>
          <button
            className="btn-secondary"
            onClick={() => navigate("/products")}
          >
            <ArrowLeft size={16} />
            Back to Products
          </button>
        </div>

        <div className="form-container">
          <div className="form-header">
            {/* Form Type Toggle - Disable in edit mode */}
            <div className="form-toggle">
              <button
                type="button"
                onClick={() => handleFormTypeChange("product")}
                disabled={editMode}
                className={`toggle-btn ${
                  formType === "product" ? "active" : ""
                }`}
              >
                {editMode ? "Edit Product" : "Add Product"}
              </button>
              <button
                type="button"
                onClick={() => handleFormTypeChange("variant")}
                disabled={editMode}
                className={`toggle-btn ${
                  formType === "variant" ? "active" : ""
                }`}
              >
                {editMode ? "Edit Variant" : "Add Variant"}
              </button>
            </div>
          </div>

          <div className="form-body">
            {uploading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>{`${editMode ? "Updating" : "Creating"} ${formType}...`}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Name Field */}
              <div className="form-group">
                <label className="form-label">
                  {formType === "product" ? "Product" : "Variant"} Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Enter ${
                    formType === "product" ? "product" : "variant"
                  } name`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* SKU/Code Field */}
              <div className="form-group">
                <label className="form-label">
                  {formType === "product" ? "SKU" : "Variant Code"}
                </label>
                <input
                  type="text"
                  className={`form-input ${!editMode ? "code-input" : ""}`}
                  placeholder={
                    formType === "product"
                      ? "Auto-generated SKU"
                      : "Auto-generated code"
                  }
                  value={formType === "product" ? sku : code}
                  onChange={(e) =>
                    formType === "product"
                      ? setSku(e.target.value)
                      : setCode(e.target.value)
                  }
                  readOnly
                />
              </div>

              {/* Price Field (Variant only) */}
              {formType === "variant" && (
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Quantity Field (Variant only) */}
              {formType === "variant" && (
                <div className="form-group">
                  <label className="form-label">Initial Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              )}

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  placeholder="Enter description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                />
              </div>

              {/* Category Dropdown */}
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <React.Fragment key={cat.id}>
                      <option value={cat.id}>{cat.name}</option>
                      {cat.children &&
                        cat.children.map((child) => (
                          <option key={child.id} value={child.id}>
                            └ {child.name}
                          </option>
                        ))}
                    </React.Fragment>
                  ))}
                </select>
              </div>

              {/* Product Dropdown (Variant only) */}
              {formType === "variant" && (
                <div className="form-group">
                  <label className="form-label">Product</label>
                  <select
                    className="form-input"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                    disabled={editMode}
                    style={{ backgroundColor: editMode ? "#f8f9fa" : "#fff" }}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (SKU: {product.sku_prefix})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Attributes Section (Variant only) */}
              {formType === "variant" && (
                <div className="attributes-section">
                  <div className="attributes-header">
                    <label className="form-label" style={{ margin: 0 }}>
                      <Tag
                        size={16}
                        style={{ marginRight: "8px", display: "inline" }}
                      />
                      Variant Attributes
                    </label>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setShowAttributeSelector(true)}
                      style={{ padding: "8px 16px", fontSize: "14px" }}
                    >
                      <Plus size={14} />
                      Add Attribute
                    </button>
                  </div>

                  {selectedAttributes.length > 0 ? (
                    selectedAttributes.map((attr) => (
                      <div key={attr.attributeId} className="attribute-item">
                        <div className="attribute-label">
                          {attr.attributeName}:
                        </div>
                        <div style={{ flex: 1 }}>
                          <SearchableSelect
                            options={attributeValues[attr.attributeId] || []}
                            value={attr.valueId}
                            onChange={(valueId, valueName) =>
                              updateAttributeValue(
                                attr.attributeId,
                                valueId,
                                valueName
                              )
                            }
                            placeholder="Select value..."
                            filterKey="value"
                          />
                        </div>
                        <button
                          type="button"
                          className="attribute-remove"
                          onClick={() => removeAttribute(attr.attributeId)}
                          title="Remove attribute"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p
                      style={{
                        color: "#6b7280",
                        fontStyle: "italic",
                        margin: "16px 0",
                      }}
                    >
                      No attributes added. Click "Add Attribute" to assign
                      attributes to this variant.
                    </p>
                  )}

                  {/* Attribute Selector Modal */}
                  {showAttributeSelector && (
                    <div className="modal-overlay">
                      <div className="modal-content modal-small">
                        <div className="modal-header">
                          <h2>Select Attribute</h2>
                          <button
                            className="modal-close"
                            onClick={() => setShowAttributeSelector(false)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="modal-body">
                          <div className="form-group">
                            <label className="form-label">
                              Available Attributes
                            </label>
                            <SearchableSelect
                              options={attributes.filter(
                                (attr) =>
                                  !selectedAttributes.find(
                                    (selected) =>
                                      selected.attributeId === attr.id
                                  )
                              )}
                              value=""
                              onChange={(attributeId, attributeName) => {
                                addAttribute(attributeId, attributeName);
                              }}
                              placeholder="Search and select attribute..."
                              filterKey="name"
                            />
                          </div>
                        </div>
                        <div className="modal-actions">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setShowAttributeSelector(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label className="form-label">Images</label>
                <div className="file-upload-area">
                  <Upload
                    size={32}
                    style={{ color: "#9ca3af", marginBottom: "8px" }}
                  />
                  <p
                    style={{ margin: 0, color: "#6b7280", marginBottom: "8px" }}
                  >
                    Click to select images or drag and drop
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="btn-primary"
                    style={{ cursor: "pointer" }}
                  >
                    <Plus size={16} />
                    Select Images
                  </label>
                  {editMode && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        margin: "8px 0 0 0",
                      }}
                    >
                      Add new images or manage existing ones below
                    </p>
                  )}
                </div>
              </div>

              {/* Current Images (Edit mode) */}
              {uploadedImages.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Current Images</label>
                  <div className="image-grid">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="image-item">
                        <img
                          src={image.url}
                          alt={`Current ${index + 1}`}
                          className="image-preview"
                        />
                        <div className="image-actions">
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(index, image.id)}
                            className="image-btn remove-btn"
                            title="Remove image"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        {image.is_primary ? (
                          <div className="primary-badge">
                            <Star size={10} />
                            Primary
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(image.id)}
                            className="image-btn set-primary-btn"
                            style={{
                              position: "absolute",
                              bottom: "4px",
                              left: "4px",
                              fontSize: "9px",
                              padding: "2px 6px",
                            }}
                            title="Set as primary"
                          >
                            Set Primary
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Preview */}
              {imageFiles.length > 0 && (
                <div className="form-group">
                  <label className="form-label">New Images to Upload</label>
                  <div className="image-grid">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="image-item">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="image-preview"
                        />
                        <div className="image-actions">
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="image-btn remove-btn"
                            title="Remove image"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div className="image-info">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB)
                          {uploadedImages.length === 0 && index === 0 && (
                            <div
                              style={{
                                color: "#10b981",
                                fontWeight: "bold",
                                marginTop: "4px",
                              }}
                            >
                              Will be Primary
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={uploading}
                  
                >
                  {uploading ? (
                    <>
                      <div
                        className="loading-spinner"
                        style={{
                          width: "16px",
                          height: "16px",
                          margin: 0,
                          marginRight: "8px",
                          width:"100%",
                          justifyContent:"center",
                        }}
                      ></div>
                      {editMode ? "Updating" : "Creating"}...
                    </>
                  ) : (
                    <>
                      {editMode ? <Edit size={16} /> : <Plus size={16} />}
                      {editMode ? "Update" : "Add"} {formType}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Success Modal */}
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Success"
          message={modalMessage}
          type="success"
        />

        {/* Error Modal */}
        <Modal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Error"
          message={modalMessage}
          type="error"
        />
      </div>
    </>
  );
};

export default AddProductVariant;
