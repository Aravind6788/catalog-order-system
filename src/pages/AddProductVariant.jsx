import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AddProductVariant = () => {
const API_BASE = "http://localhost/GreenLand/api";
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location || {};

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
  const [message, setMessage] = useState("");

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

        // Fetch existing variant images
        const token = localStorage && localStorage.getItem("token");
        if (token) {
          const response = await fetch(`${API_BASE}/variants/${editData.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();

          if (data.variant) {
            // Handle variant images if they exist in the response
            // You may need to adjust this based on your API structure
          }
        }
      }
    } catch (error) {
      console.error("Error loading edit data:", error);
      setMessage("Failed to load data for editing");
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
        if (!token) return setMessage("Authentication token missing");

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
      } catch (err) {
        console.error(err);
        setMessage("Failed to fetch categories");
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
      setMessage(errorMessages.join(", "));
      return;
    }

    setImageFiles([...imageFiles, ...validFiles]);
    setMessage("");
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
        setMessage("Image removed successfully");
      } else {
        setMessage("Failed to remove image");
      }
    } catch (err) {
      console.error("Failed to remove image", err);
      setMessage("Failed to remove image");
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
        setMessage("Primary image updated");
      } else {
        setMessage("Failed to update primary image");
      }
    } catch (err) {
      console.error("Failed to set primary image", err);
      setMessage("Failed to set primary image");
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
    setMessage("");

    if (!name.trim()) return setMessage("Name is required");
    if (formType === "product" && !editMode && !sku.trim())
      return setMessage("SKU is required");
    if (formType === "variant" && !editMode && !code.trim())
      return setMessage("Variant code generation failed");
    if (formType === "variant" && !price)
      return setMessage("Price is required");
    if (formType === "variant" && !productId)
      return setMessage("Please select a product");

    // Only require images for new items, not edits
    if (!editMode && imageFiles.length === 0 && uploadedImages.length === 0)
      return setMessage("Please select at least one image");

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

          setMessage("Product updated successfully!");
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

          setMessage("Variant updated successfully!");
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

          setMessage("Product created successfully!");
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

          setMessage("Variant created successfully!");
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
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage(`Failed to ${editMode ? "update" : "create"} ${formType}`);
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

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const handleFormTypeChange = (type) => {
    setFormType(type);
    if (!editMode) {
      resetForm();
    }
    setMessage("");
  };

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage && localStorage.getItem("token");
        if (!token) return setMessage("Authentication token missing");

        const response = await fetch(`${API_BASE}/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        setCategories(data);

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
      } catch (err) {
        console.error(err);
        setMessage("Failed to fetch categories");
      }
    };

    fetchCategories();
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <h1>{editMode ? `Edit ${formType}` : `Add ${formType}`}</h1>
        <button
          onClick={() => navigate("/products")}
          style={{
            padding: "8px 16px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Back to Products
        </button>
      </div>

      {/* Form Type Toggle - Disable in edit mode */}
      <div style={{ marginBottom: "30px", display: "flex", gap: "10px" }}>
        <button
          type="button"
          onClick={() => handleFormTypeChange("product")}
          disabled={editMode}
          style={{
            padding: "10px 20px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            backgroundColor: formType === "product" ? "#007bff" : "#f8f9fa",
            color: formType === "product" ? "white" : "#333",
            cursor: editMode ? "not-allowed" : "pointer",
            opacity: editMode ? 0.6 : 1,
          }}
        >
          {editMode ? "Edit Product" : "Add Product"}
        </button>
        <button
          type="button"
          onClick={() => handleFormTypeChange("variant")}
          disabled={editMode}
          style={{
            padding: "10px 20px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            backgroundColor: formType === "variant" ? "#007bff" : "#f8f9fa",
            color: formType === "variant" ? "white" : "#333",
            cursor: editMode ? "not-allowed" : "pointer",
            opacity: editMode ? 0.6 : 1,
          }}
        >
          {editMode ? "Edit Variant" : "Add Variant"}
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "5px",
            backgroundColor: message.includes("successfully")
              ? "#d4edda"
              : "#f8d7da",
            color: message.includes("successfully") ? "#155724" : "#721c24",
            border: `1px solid ${
              message.includes("successfully") ? "#c3e6cb" : "#f5c6cb"
            }`,
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {/* Name Field */}
        <input
          type="text"
          placeholder={`${formType === "product" ? "Product" : "Variant"} Name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        {/* SKU/Code Field */}
        {formType === "product" ? (
          <input
            type="text"
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            readOnly={!editMode}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: editMode ? "#fff" : "#f8f9fa",
            }}
          />
        ) : (
          <input
            type="text"
            placeholder="Variant Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            readOnly={!editMode}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: editMode ? "#fff" : "#f8f9fa",
            }}
          />
        )}

        {/* Price Field (Variant only) */}
        {formType === "variant" && (
          <input
            type="number"
            step="0.01"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          />
        )}

        {/* Quantity Field (Variant only) */}
        {formType === "variant" && (
          <input
            type="number"
            placeholder="Initial Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          />
        )}

        {/* Description */}
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="4"
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        {/* Category Dropdown */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
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

        {/* Product Dropdown (Variant only) */}
        {formType === "variant" && (
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            disabled={editMode} // Disable product change in edit mode
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: editMode ? "#f8f9fa" : "#fff",
            }}
          >
            <option value="">Select Product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} (SKU: {product.sku_prefix})
              </option>
            ))}
          </select>
        )}

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Image Upload */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Images (Multiple selection supported)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          />
          {editMode && (
            <small
              style={{ color: "#666", display: "block", marginTop: "5px" }}
            >
              Add new images or manage existing ones below
            </small>
          )}
        </div>

        {/* Uploaded Images (Existing images in edit mode) */}
        {uploadedImages.length > 0 && (
          <div>
            <h4>Current Images:</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {uploadedImages.map((image, index) => (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    padding: "5px",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <img
                    src={image.url}
                    alt={`Image ${index + 1}`}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "5px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(index, image.id)}
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      background: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    ×
                  </button>
                  {image.is_primary ? (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "5px",
                        left: "5px",
                        background: "green",
                        color: "white",
                        fontSize: "10px",
                        padding: "2px 4px",
                        borderRadius: "3px",
                      }}
                    >
                      Primary
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(image.id)}
                      style={{
                        position: "absolute",
                        bottom: "5px",
                        left: "5px",
                        background: "#007bff",
                        color: "white",
                        fontSize: "9px",
                        padding: "2px 4px",
                        borderRadius: "3px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Set Primary
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Images Preview */}
        {imageFiles.length > 0 && (
          <div>
            <h4>New Images to Upload:</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {imageFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    padding: "5px",
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "5px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      background: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    ×
                  </button>
                  <div
                    style={{
                      fontSize: "12px",
                      textAlign: "center",
                      marginTop: "5px",
                    }}
                  >
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    {uploadedImages.length === 0 && index === 0 && (
                      <div style={{ color: "green", fontWeight: "bold" }}>
                        Will be Primary
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            style={{
              padding: "12px",
              backgroundColor: uploading
                ? "#ccc"
                : editMode
                ? "#ffc107"
                : "#28a745",
              color: uploading ? "#666" : editMode ? "#000" : "white",
              border: "none",
              borderRadius: "5px",
              cursor: uploading ? "not-allowed" : "pointer",
              fontSize: "16px",
              flex: 1,
            }}
          >
            {uploading
              ? `${editMode ? "Updating" : "Creating"} ${formType}...`
              : `${editMode ? "Update" : "Add"} ${formType}`}
          </button>

          <button
            type="button"
            onClick={() => navigate("/products")}
            style={{
              padding: "12px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductVariant;
