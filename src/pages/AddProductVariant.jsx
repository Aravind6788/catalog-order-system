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
import { getOptimizedImageUrl } from "../utils/cloudinary";
import ImageCropperModal from "./ImageCropperModal";

const AddProductVariant = () => {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost/GreenLand/api";
  const API_BASE = API_BASE_URL;
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
  const [originalAttributes, setOriginalAttributes] = useState([]); // Track original attributes for comparison

  // ---- Image editor state ----
  // Multiple files picked at once are edited one at a time via this queue.
  const [pendingImageQueue, setPendingImageQueue] = useState([]);
  const [cropper, setCropper] = useState({
    isOpen: false,
    imageSrc: "",
    mode: null, // "new" | "edit-new" | "edit-existing"
    targetIndex: null,
    fileName: "image.jpg",
    mimeType: "image/jpeg",
  });
  const [savingImageEdit, setSavingImageEdit] = useState(false);
  // Live preview image (derived from uploadedImages / imageFiles, kept in
  // state so we can safely revoke object URLs when they're no longer used)
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

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
      option[filterKey].toLowerCase().includes(searchTerm.toLowerCase()),
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
              })),
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
          // Fetch variant details including images
          // Fetch existing variant images and attributes
          const response = await fetch(`${API_BASE}/variants/${editData.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();

          if (data.variant && data.variant.images) {
            // Images now come with proper IDs from the backend
            setUploadedImages(
              data.variant.images.map((img) => ({
                id: img.id,
                url: img.image_url,
                is_primary: img.is_primary,
              })),
            );
          }

          // Load existing variant attributes
          const attrResponse = await fetch(
            `${API_BASE}/variants/${editData.id}/attributes`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const attrData = await attrResponse.json();

          if (attrData.attributes) {
            const loadedAttributes = attrData.attributes.map((attr) => ({
              attributeId: attr.attribute_id,
              attributeName: attr.attribute_name,
              valueId: attr.value_id,
              valueName: attr.value_name,
            }));

            setSelectedAttributes(loadedAttributes);
            setOriginalAttributes(JSON.parse(JSON.stringify(loadedAttributes))); // Deep copy for comparison

            // Pre-load attribute values for loaded attributes
            const uniqueAttributeIds = [
              ...new Set(loadedAttributes.map((attr) => attr.attributeId)),
            ];
            for (const attributeId of uniqueAttributeIds) {
              await fetchAttributeValues(attributeId);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading edit data:", error);
      showMessage("Failed to load data for editing", "error");
    }
  };

  // Helper function to compare attribute arrays
  const attributesChanged = () => {
    if (selectedAttributes.length !== originalAttributes.length) {
      return true;
    }

    return selectedAttributes.some((attr) => {
      const original = originalAttributes.find(
        (orig) => orig.attributeId === attr.attributeId,
      );
      return !original || original.valueId !== attr.valueId;
    });
  };

  // Update variant attributes
  const updateVariantAttributes = async (variantId) => {
    if (!attributesChanged()) {
      console.log("No attribute changes detected, skipping attribute update");
      return;
    }

    try {
      const token = localStorage && localStorage.getItem("token");

      // Remove all existing attributes first
      const existingAttrResponse = await fetch(
        `${API_BASE}/variants/${variantId}/attributes`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const existingAttrData = await existingAttrResponse.json();

      // Delete existing attributes one by one
      if (
        existingAttrData.attributes &&
        existingAttrData.attributes.length > 0
      ) {
        for (const attr of existingAttrData.attributes) {
          await fetch(
            `${API_BASE}/variants/${variantId}/attributes/${attr.value_id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
        }
      }

      // Add new attributes
      for (const attribute of selectedAttributes) {
        if (attribute.valueId) {
          const response = await fetch(
            `${API_BASE}/variants/${variantId}/attributes`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                attribute_value_id: attribute.valueId,
              }),
            },
          );

          if (!response.ok) {
            console.error(
              `Failed to assign attribute ${attribute.attributeName}`,
            );
          }
        }
      }

      console.log("Variant attributes updated successfully");
    } catch (error) {
      console.error("Error updating variant attributes:", error);
      throw error; // Re-throw to handle in main submission
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
        },
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
          : attr,
      ),
    );
  };

  // Remove attribute from selection
  const removeAttribute = (attributeId) => {
    setSelectedAttributes((prev) =>
      prev.filter((attr) => attr.attributeId !== attributeId),
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
      if (!state?.preSelectedProduct && !editMode) {
        setProductId("");
      }
    }
  }, [categoryId, formType, editMode]);

  // ---- Live preview image ----
  // Recomputed only when the image lists actually change (not on every
  // keystroke elsewhere in the form), and cleans up any object URL it creates.
  useEffect(() => {
    const primaryUploaded = uploadedImages.find((img) => img.is_primary);
    let url = null;
    let objectUrlToRevoke = null;

    if (primaryUploaded) {
      url = getOptimizedImageUrl(primaryUploaded.url, {
        width: 500,
        height: 500,
        crop: "fill",
      });
    } else if (uploadedImages.length > 0) {
      url = getOptimizedImageUrl(uploadedImages[0].url, {
        width: 500,
        height: 500,
        crop: "fill",
      });
    } else if (imageFiles.length > 0) {
      url = URL.createObjectURL(imageFiles[0]);
      objectUrlToRevoke = url;
    }

    setPreviewImageUrl(url);

    return () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
    };
  }, [uploadedImages, imageFiles]);

  // Look up a (possibly nested) category's display name for the preview panel
  const getCategoryName = (id) => {
    if (!id) return "";
    const findName = (cats) => {
      for (const cat of cats || []) {
        if (String(cat.id) === String(id)) return cat.name;
        if (cat.children) {
          const found = findName(cat.children);
          if (found) return found;
        }
      }
      return "";
    };
    return findName(categories);
  };

  // ---- Image selection & editing ----

  const openCropperFor = (
    imageSrc,
    mode,
    targetIndex,
    fileNameArg,
    mimeTypeArg,
  ) => {
    setCropper({
      isOpen: true,
      imageSrc,
      mode,
      targetIndex,
      fileName: fileNameArg || "image.jpg",
      mimeType: mimeTypeArg || "image/jpeg",
    });
  };

  const closeCropper = () => {
    setCropper((prev) => ({ ...prev, isOpen: false }));
    // If several files were selected at once, move on to editing the next one
    setPendingImageQueue((prevQueue) => {
      if (prevQueue.length > 0) {
        const [next, ...rest] = prevQueue;
        openCropperFor(next.url, "new", null, next.file.name, next.file.type);
        return rest;
      }
      return prevQueue;
    });
  };

  // Handle multiple image selection — each valid file is queued and opened
  // in the editor one at a time instead of being added straight away.
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
    }

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    const queue = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPendingImageQueue(queue.slice(1));
    openCropperFor(
      queue[0].url,
      "new",
      null,
      queue[0].file.name,
      queue[0].file.type,
    );

    // Reset the input so selecting the same file again still fires onChange
    e.target.value = "";
  };

  const handleCropApply = async (blob) => {
    const { mode, targetIndex, fileName, mimeType } = cropper;

    if (mode === "new") {
      const croppedFile = new File([blob], fileName, {
        type: mimeType || blob.type,
      });
      setImageFiles((prev) => [...prev, croppedFile]);
      closeCropper();
      return;
    }

    if (mode === "edit-new") {
      const croppedFile = new File([blob], fileName, {
        type: mimeType || blob.type,
      });
      setImageFiles((prev) =>
        prev.map((f, i) => (i === targetIndex ? croppedFile : f)),
      );
      closeCropper();
      return;
    }

    if (mode === "edit-existing") {
      await replaceExistingImage(targetIndex, blob, fileName, mimeType);
      closeCropper();
    }
  };

  // Re-edit an image that's already saved on the server (edit mode only):
  // upload the newly cropped version first, then remove the old one so the
  // image is never left missing if the upload fails partway through.
  const replaceExistingImage = async (index, blob, fileName, mimeType) => {
    const oldImage = uploadedImages[index];
    if (!oldImage) return;

    setSavingImageEdit(true);
    try {
      const token = localStorage && localStorage.getItem("token");

      const data = new FormData();
      data.append("file", new File([blob], fileName, { type: mimeType }));
      data.append("upload_preset", "newtest");
      data.append("cloud_name", "dxrdpvn3u");

      const cloudRes = await fetch(
        "https://api.cloudinary.com/v1_1/dxrdpvn3u/image/upload",
        { method: "POST", body: data },
      );
      const cloudData = await cloudRes.json();

      if (!cloudData.secure_url) {
        const reason = cloudData?.error?.message || "Unknown error";
        throw new Error(`Failed to upload edited image: ${reason}`);
      }

      const addEndpoint =
        formType === "variant"
          ? `${API_BASE}/variants/${editingId}/images`
          : `${API_BASE}/products/${editingId}/images`;

      const addResponse = await fetch(addEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: cloudData.secure_url,
          is_primary: !!oldImage.is_primary,
        }),
      });

      if (!addResponse.ok) {
        throw new Error("Failed to save the edited image");
      }

      // NOTE: adjust `newImageId` to whatever field your API actually
      // returns for the newly created image row (id / image_id / etc).
      const addResult = await addResponse.json().catch(() => ({}));
      const newImageId = addResult.id || addResult.image_id || null;

      // Only remove the old image once the new one is confirmed saved
      if (oldImage.id) {
        const deleteEndpoint =
          formType === "variant"
            ? `${API_BASE}/variant-images/${oldImage.id}`
            : `${API_BASE}/product-images/${oldImage.id}`;

        await fetch(deleteEndpoint, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) =>
          console.error("Old image could not be removed:", err),
        );
      }

      setUploadedImages((prev) =>
        prev.map((img, i) =>
          i === index
            ? {
                id: newImageId,
                url: cloudData.secure_url,
                is_primary: img.is_primary,
              }
            : img,
        ),
      );

      showMessage("Image updated successfully!", "success");
    } catch (error) {
      console.error("Failed to update image:", error);
      showMessage("Failed to update image. Please try again.", "error");
    } finally {
      setSavingImageEdit(false);
    }
  };

  // Remove image from selection
  const removeImage = (index) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  // Remove uploaded image
  const removeUploadedImage = async (index, imageId) => {
    try {
      const token = localStorage && localStorage.getItem("token");

      // Only make server request for actual database IDs
      if (imageId) {
        const endpoint =
          formType === "variant"
            ? `${API_BASE}/variant-images/${imageId}`
            : `${API_BASE}/product-images/${imageId}`;

        const response = await fetch(endpoint, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          showMessage("Failed to remove image from server", "error");
          return;
        }
      }

      // Remove from local state
      setUploadedImages(uploadedImages.filter((_, i) => i !== index));
      showMessage("Image removed successfully", "success");
    } catch (err) {
      console.error("Failed to remove image", err);
      showMessage("Failed to remove image", "error");
    }
  };

  // Set primary image
  const setPrimaryImage = async (imageId) => {
    try {
      const token = localStorage && localStorage.getItem("token");

      // Make server request with actual image ID
      if (imageId) {
        const endpoint =
          formType === "variant"
            ? `${API_BASE}/variant-images/${imageId}/primary`
            : `${API_BASE}/product-images/${imageId}/primary`;

        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          showMessage("Failed to update primary image on server", "error");
          return;
        }
      }

      // Update local state
      setUploadedImages(
        uploadedImages.map((img) => ({
          ...img,
          is_primary: img.id === imageId ? 1 : 0,
        })),
      );
      showMessage("Primary image updated", "success");
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
        { method: "POST", body: data },
      );
      const cloudData = await cloudRes.json();

      if (!cloudData.secure_url) {
        console.error("Cloudinary rejected upload:", cloudData);
        const reason = cloudData?.error?.message || "Unknown error";
        throw new Error(`Failed to upload image ${file.name}: ${reason}`);
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
            },
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
            },
          );

          if (!variantResponse.ok) {
            throw new Error("Failed to update variant");
          }

          // Update variant attributes
          await updateVariantAttributes(editingId);

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
            },
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
                    err,
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
        `Failed to ${editMode ? "update" : "create"} ${formType}: ${
          err.message
        }`,
        "error",
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
    setOriginalAttributes([]);

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

          .form-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 320px;
            gap: 24px;
            max-width: 1200px;
            margin: 0 auto;
            align-items: start;
          }

          .form-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
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

          .edit-btn {
            background: #8b5cf6;
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

          .attributes-changed-indicator {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 12px;
            font-size: 14px;
            color: #92400e;
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

          /* Live preview panel */
          .preview-panel-sticky {
            position: sticky;
            top: 20px;
          }

          .preview-label {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #94a3b8;
            margin: 0 0 10px 4px;
          }

          .preview-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }

          .preview-image-wrap {
            position: relative;
            width: 100%;
            aspect-ratio: 1 / 1;
            background: #f1f5f9;
          }

          .preview-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .preview-image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #cbd5e1;
            font-size: 13px;
          }

          .preview-status-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            text-transform: capitalize;
            background: #10b981;
            color: white;
          }

          .preview-status-badge.inactive {
            background: #94a3b8;
          }

          .preview-body {
            padding: 16px;
          }

          .preview-name {
            margin: 0 0 4px;
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            word-break: break-word;
          }

          .preview-category {
            margin: 0 0 8px;
            font-size: 12px;
            color: #6b7280;
          }

          .preview-code {
            margin: 0 0 6px;
            font-size: 12px;
            font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
            color: #64748b;
          }

          .preview-price {
            margin: 0 0 10px;
            font-size: 18px;
            font-weight: 700;
            color: #2d8659;
          }

          .preview-description {
            margin: 0 0 10px;
            font-size: 13px;
            color: #6b7280;
            line-height: 1.5;
          }

          .preview-attributes {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .preview-attr-tag {
            background: #e8f5e8;
            color: #2d8659;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid #c3e6cb;
          }

          .preview-hint {
            margin: 10px 4px 0;
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.5;
          }

          .image-saving-note {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #92400e;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 8px 12px;
            margin-top: 10px;
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

          @media (max-width: 1024px) {
            .form-layout {
              grid-template-columns: 1fr;
            }

            .preview-panel-sticky {
              position: static;
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

        <div className="form-layout">
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
                {formType === "variant" && !editMode && (
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

                    {/* Show indicator if attributes have changed in edit mode */}
                    {editMode && attributesChanged() && (
                      <div className="attributes-changed-indicator">
                        <AlertCircle
                          size={16}
                          style={{ display: "inline", marginRight: "8px" }}
                        />
                        Attributes have been modified and will be updated
                      </div>
                    )}

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
                                  valueName,
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
                                        selected.attributeId === attr.id,
                                    ),
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
                      style={{
                        margin: 0,
                        color: "#6b7280",
                        marginBottom: "8px",
                      }}
                    >
                      Click to select images
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
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        margin: "8px 0 0 0",
                      }}
                    >
                      Each image opens in the editor first — zoom, pan, or
                      rotate it before it's added
                      {editMode ? ", and you can re-edit any image below" : ""}.
                    </p>
                  </div>
                </div>

                {savingImageEdit && (
                  <div className="image-saving-note">
                    <div
                      className="loading-spinner"
                      style={{ width: 16, height: 16, margin: 0 }}
                    />
                    Saving your edited image...
                  </div>
                )}

                {/* Current Images (Edit mode) */}
                {uploadedImages.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">
                      {editMode ? "Current Images" : "Existing Images"}
                    </label>
                    <div className="image-grid">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="image-item">
                          <img
                            src={getOptimizedImageUrl(image.url, {
                              width: 240,
                              height: 240,
                              crop: "fill",
                            })}
                            alt={`Current ${index + 1}`}
                            className="image-preview"
                          />
                          <div className="image-actions">
                            <button
                              type="button"
                              onClick={() =>
                                openCropperFor(
                                  image.url,
                                  "edit-existing",
                                  index,
                                  `image-${image.id || index}.jpg`,
                                  "image/jpeg",
                                )
                              }
                              className="image-btn edit-btn"
                              title="Edit image"
                              disabled={savingImageEdit}
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeUploadedImage(index, image.id)
                              }
                              className="image-btn remove-btn"
                              title="Remove image"
                              disabled={savingImageEdit}
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
                              onClick={() =>
                                openCropperFor(
                                  URL.createObjectURL(file),
                                  "edit-new",
                                  index,
                                  file.name,
                                  file.type,
                                )
                              }
                              className="image-btn edit-btn"
                              title="Edit image"
                            >
                              <Edit size={12} />
                            </button>
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
                <div
                  style={{ display: "flex", gap: "12px", marginTop: "32px" }}
                >
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
                            height: "16px",
                            margin: 0,
                            marginRight: "8px",
                            width: "16px",
                          }}
                        ></div>
                        {editMode ? "Updating" : "Creating"}...
                      </>
                    ) : (
                      <>
                        {editMode ? "Update" : "Submit"} {formType}
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

          {/* Live Preview Panel */}
          <div className="preview-panel-sticky">
            <p className="preview-label">Live Preview</p>
            <div className="preview-card">
              <div className="preview-image-wrap">
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt="Preview"
                    className="preview-image"
                  />
                ) : (
                  <div className="preview-image-placeholder">
                    <Upload size={28} />
                    <span>No image yet</span>
                  </div>
                )}
                <span className={`preview-status-badge ${status}`}>
                  {status}
                </span>
              </div>
              <div className="preview-body">
                <h4 className="preview-name">
                  {name || `Untitled ${formType}`}
                </h4>
                {categoryId && (
                  <p className="preview-category">
                    {getCategoryName(categoryId) || "—"}
                  </p>
                )}
                <p className="preview-code">
                  {formType === "product"
                    ? sku || "Auto-generated SKU"
                    : code || "Auto-generated code"}
                </p>
                {formType === "variant" && (
                  <p className="preview-price">
                    ₹{price ? parseFloat(price).toFixed(2) : "0.00"}
                  </p>
                )}
                {description && (
                  <p className="preview-description">{description}</p>
                )}
                {formType === "variant" && selectedAttributes.length > 0 && (
                  <div className="preview-attributes">
                    {selectedAttributes.map(
                      (attr) =>
                        attr.valueName && (
                          <span
                            key={attr.attributeId}
                            className="preview-attr-tag"
                          >
                            {attr.attributeName}: {attr.valueName}
                          </span>
                        ),
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="preview-hint">
              Updates as you type — nothing here is saved until you submit the
              form.
            </p>
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

        {/* Image Editor */}
        <ImageCropperModal
          isOpen={cropper.isOpen}
          imageSrc={cropper.imageSrc}
          fileName={cropper.fileName}
          mimeType={cropper.mimeType}
          onClose={closeCropper}
          onApply={handleCropApply}
        />
      </div>
    </>
  );
};

export default AddProductVariant;
