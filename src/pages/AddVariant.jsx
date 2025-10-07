// src/pages/AddVariant.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/GreenLand/api";
const API_BASE = API_BASE_URL;

const AddVariant = () => {
  const { id } = useParams(); // product id
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [attributeValues, setAttributeValues] = useState({});
  const [variantData, setVariantData] = useState({
    name: "",
    code: "",
    price: "",
    quantity: "",
    attributes: {}, // { attribute_id: value_id }
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // fetch product + attributes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await axios.get(`${API_BASE}/products/${id}`);
        setProduct(prodRes.data.product);

        const attrRes = await axios.get(`${API_BASE}/attributes`);
        setAttributes(attrRes.data);

        // preload attribute values
        const valuesMap = {};
        for (const attr of attrRes.data) {
          const valRes = await axios.get(
            `${API_BASE}/attributes/${attr.id}/values`
          );
          valuesMap[attr.id] = valRes.data;
        }
        setAttributeValues(valuesMap);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    fetchData();
  }, [id]);

  // handle form input
  const handleChange = (e) => {
    setVariantData({ ...variantData, [e.target.name]: e.target.value });
  };

  const handleAttributeChange = (attrId, valueId) => {
    setVariantData({
      ...variantData,
      attributes: { ...variantData.attributes, [attrId]: valueId },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPreviewMode(true);
  };

  const handleConfirm = async () => {
    try {
      await axios.post(`${API_BASE}/products/${id}/variants`, variantData);
      setShowPopup(true);
    } catch (err) {
      console.error("Error creating variant:", err);
    }
  };

  const handleAddAnother = () => {
    setVariantData({
      name: "",
      code: "",
      price: "",
      quantity: "",
      attributes: {},
    });
    setPreviewMode(false);
    setShowPopup(false);
  };

  const handleGoBack = () => {
    setShowPopup(false);
    navigate("/products");
  };

  if (!product) return <p>Loading product...</p>;

  return (
    <div className="add-variant-page">
      <h2>Add Variant for {product.name}</h2>

      {/* Product Details (read-only) */}
      <div className="product-details">
        <p>
          <strong>Category:</strong> {product.category_name}
        </p>
        <p>
          <strong>Description:</strong> {product.description}
        </p>
        <p>
          <strong>SKU Prefix:</strong> {product.sku_prefix}
        </p>
      </div>

      {/* Variant Form */}
      {!previewMode ? (
        <form onSubmit={handleSubmit} className="variant-form">
          <input
            type="text"
            name="name"
            placeholder="Variant Name"
            value={variantData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="code"
            placeholder="Variant Code"
            value={variantData.code}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={variantData.price}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={variantData.quantity}
            onChange={handleChange}
            required
          />

          {/* Attribute selectors */}
          {attributes.map((attr) => (
            <div key={attr.id} className="attribute-select">
              <label>{attr.name}</label>
              <select
                value={variantData.attributes[attr.id] || ""}
                onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
              >
                <option value="">Select {attr.name}</option>
                {attributeValues[attr.id]?.map((val) => (
                  <option key={val.id} value={val.id}>
                    {val.value}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <button type="submit">Preview Variant</button>
        </form>
      ) : (
        <div className="variant-preview">
          <h3>Variant Preview</h3>
          <p>
            <strong>Name:</strong> {variantData.name}
          </p>
          <p>
            <strong>Code:</strong> {variantData.code}
          </p>
          <p>
            <strong>Price:</strong> {variantData.price}
          </p>
          <p>
            <strong>Quantity:</strong> {variantData.quantity}
          </p>

          <ul>
            {Object.entries(variantData.attributes).map(([attrId, valId]) => {
              const attr = attributes.find((a) => a.id == attrId);
              const val = attributeValues[attrId]?.find((v) => v.id == valId);
              return (
                <li key={attrId}>
                  {attr?.name}: {val?.value}
                </li>
              );
            })}
          </ul>

          <button onClick={() => setPreviewMode(false)}>Edit</button>
          <button onClick={handleConfirm}>Confirm</button>
        </div>
      )}

      {/* Popup after confirm */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <p>Variant added successfully!</p>
            <button onClick={handleAddAnother}>Add Another Variant</button>
            <button onClick={handleGoBack}>Back to Products</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVariant;
