import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Categories.css";

const AddCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/GreenLand/api";
  // ✅ Fetch categories for parent dropdown
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/categories`)
      .then((res) => {
        setCategories(res.data);
      })
      .catch(() => setError("Failed to load categories"));
  }, []);

  // ✅ Flatten category tree for dropdown
  const flattenCategories = (cats, prefix = "") => {
    return cats.flatMap((cat) => [
      { id: cat.id, name: prefix + cat.name, code: cat.code },
      ...(cat.children ? flattenCategories(cat.children, prefix + "-- ") : []),
    ]);
  };

  // ✅ Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Check unique code
    const allCats = flattenCategories(categories);
    if (allCats.some((cat) => cat.code.toUpperCase() === code.toUpperCase())) {
      setError("Category code must be unique!");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/categories`,
        {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          parent_id: parentId || null,
        }
      );

      setSuccess(response.data.message);
      setName("");
      setCode("");
      setParentId("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create category");
    }
  };

  return (
    <div className="categories-page">
      <h1 className="page-title">Add New Category</h1>

      <form className="category-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category Name</label>
          <input
            type="text"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter category name"
          />
        </div>

        <div className="form-group">
          <label>Category Code</label>
          <input
            type="text"
            className="input-field"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="Enter unique code (e.g. FERT)"
          />
        </div>

        <div className="form-group">
          <label>Parent Category (optional)</label>
          <select
            className="input-field"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">-- None --</option>
            {flattenCategories(categories).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}

        <button type="submit" className="btn-add">
          + Create Category
        </button>
      </form>
    </div>
  );
};

export default AddCategory;
