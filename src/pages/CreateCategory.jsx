import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import "./CreateCategory.css";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/GreenLand/api";
const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Fetch categories for parent dropdown
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/categories`)
      .then((res) => setCategories(res.data))
      .catch(() => setError("Failed to load categories"));
  }, []);

  // Flatten category tree
  const flattenCategories = (cats, prefix = "") =>
    cats.flatMap((cat) => [
      { id: cat.id, name: prefix + cat.name, code: cat.code },
      ...(cat.children ? flattenCategories(cat.children, prefix + "-- ") : []),
    ]);

  // Function to generate unique category code
  const generateCategoryCode = (name, parentId, categories) => {
    const allCats = flattenCategories(categories).map((c) => ({
      id: c.id,
      name: c.name.replace(/--\s*/g, ""), // remove prefix
      code: c.code.toUpperCase(),
    }));

    const parentName = parentId
      ? allCats.find((c) => c.id === parseInt(parentId))?.name || ""
      : "";

    // Base code: first 2 letters of parent + first 3 letters of name
    const baseCode =
      (parentName.substring(0, 2) + name.substring(0, 3))
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase() || "CAT";

    let newCode = baseCode;
    let counter = 1;

    const allCodes = allCats.map((c) => c.code);

    // Add counter if code already exists
    while (allCodes.includes(newCode)) {
      newCode = baseCode + counter;
      counter++;
    }

    return newCode;
  };

  // Auto-generate code when name or parent changes
  useEffect(() => {
    if (!name.trim()) {
      setCode("");
      return;
    }
    setCode(generateCategoryCode(name.trim(), parentId, categories));
  }, [name, parentId, categories]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/categories`, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        parent_id: parentId || null,
      });

      navigate("/categories");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex">
      {/* <Sidebar /> */}
      <div
        className="flex-1 p-4 bg-dark text-white"
        style={{ marginLeft: "250px" }}
      >
        <h1 className="mb-4">Create Category</h1>
        <div className="create-category-form">
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-3">
              <label className="form-label">Category Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-control"
                required
              />
            </div>

            {/* Code (auto-generated, read-only) */}
            <div className="mb-3">
              <label className="form-label">Category Code (auto)</label>
              <input
                type="text"
                value={code}
                className="form-control"
                readOnly
              />
            </div>

            {/* Parent */}
            <div className="mb-3">
              <label className="form-label">Parent Category</label>
              <select
                className="form-control"
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

            {error && <p className="text-danger">{error}</p>}

            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/categories")}
              className="btn btn-secondary ms-2"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCategory;
