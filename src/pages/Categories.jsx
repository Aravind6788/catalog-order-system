import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  File,
} from "lucide-react";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/GreenLand/api";
const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    parent_id: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setFormError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Flatten category tree for dropdown and search
  const flattenCategories = (cats, prefix = "") =>
    cats.flatMap((cat) => [
      {
        id: cat.id,
        name: prefix + cat.name,
        code: cat.code,
        originalName: cat.name,
      },
      ...(cat.children ? flattenCategories(cat.children, prefix + "-- ") : []),
    ]);

  // Generate unique category code
  const generateCategoryCode = (name, parentId, categories) => {
    const allCats = flattenCategories(categories).map((c) => ({
      id: c.id,
      name: c.originalName || c.name.replace(/--\s*/g, ""),
      code: c.code.toUpperCase(),
    }));

    const parentName = parentId
      ? allCats.find((c) => c.id === parseInt(parentId))?.name || ""
      : "";

    const baseCode =
      (parentName.substring(0, 2) + name.substring(0, 3))
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase() || "CAT";

    let newCode = baseCode;
    let counter = 1;
    const allCodes = allCats.map((c) => c.code);

    while (allCodes.includes(newCode)) {
      newCode = baseCode + counter;
      counter++;
    }

    return newCode;
  };

  // Auto-generate code when name or parent changes
  useEffect(() => {
    if (!formData.name.trim()) {
      setFormData((prev) => ({ ...prev, code: "" }));
      return;
    }
    const newCode = generateCategoryCode(
      formData.name.trim(),
      formData.parent_id,
      categories
    );
    setFormData((prev) => ({ ...prev, code: newCode }));
  }, [formData.name, formData.parent_id, categories]);

  // Search functionality
  const filterCategories = (cats, term) => {
    if (!term) return cats;

    return cats.filter((cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(term.toLowerCase()) ||
        cat.code.toLowerCase().includes(term.toLowerCase());

      if (matchesSearch) return true;

      if (cat.children) {
        const filteredChildren = filterCategories(cat.children, term);
        if (filteredChildren.length > 0) {
          cat.children = filteredChildren;
          return true;
        }
      }

      return false;
    });
  };

  const filteredCategories = filterCategories(
    JSON.parse(JSON.stringify(categories)),
    searchTerm
  );

  // Expand/Collapse functionality
  const toggleExpanded = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const expandAll = () => {
    const getAllIds = (cats) => {
      let ids = [];
      cats.forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          ids.push(cat.id);
          ids = [...ids, ...getAllIds(cat.children)];
        }
      });
      return ids;
    };
    setExpandedCategories(new Set(getAllIds(categories)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Modal functions
  const openCreateModal = () => {
    setModalMode("create");
    setFormData({ name: "", code: "", parent_id: "" });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setModalMode("edit");
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      parent_id: category.parent_id || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowDeleteModal(false);
    setSelectedCategory(null);
    setFormData({ name: "", code: "", parent_id: "" });
    setFormError("");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        parent_id: formData.parent_id || null,
      };

      if (modalMode === "create") {
        await axios.post(`${API_BASE_URL}/categories`, payload);
      } else {
        await axios.put(
          `${API_BASE_URL}/categories/${selectedCategory.id}`,
          payload
        );
      }

      await fetchCategories(); // Refresh the categories list
      closeModal();
    } catch (err) {
      setFormError(
        err.response?.data?.error || `Failed to ${modalMode} category`
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setFormLoading(true);
      await axios.delete(`${API_BASE_URL}/categories/${selectedCategory.id}`);
      await fetchCategories(); // Refresh the categories list
      closeModal();
    } catch (error) {
      setFormError(error.response?.data?.error || "Failed to delete category");
    } finally {
      setFormLoading(false);
    }
  };

  // Count subcategories
  const countSubcategories = (category) => {
    if (!category.children) return 0;
    return (
      category.children.length +
      category.children.reduce(
        (acc, child) => acc + countSubcategories(child),
        0
      )
    );
  };

  // Render category recursively
  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const subcategoryCount = countSubcategories(category);

    return (
      <div key={category.id} className="category-row">
        <div className={`category-content level-${level}`}>
          <div className="category-main">
            <div className="category-toggle">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(category.id)}
                  className="toggle-btn"
                >
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
              ) : (
                <div className="toggle-placeholder" />
              )}
              <div className="category-icon">
                {hasChildren ? <FolderOpen size={20} /> : <File size={20} />}
              </div>
            </div>

            <div className="category-details">
              <h3 className="category-name">{category.name}</h3>
              <div className="category-meta">
                <span className="category-code">Code: {category.code}</span>
                {subcategoryCount > 0 && (
                  <span className="subcategory-count">
                    • {subcategoryCount} subcategorie
                    {subcategoryCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="category-actions">
              <button
                onClick={() => openEditModal(category)}
                className="action-btn edit-btn"
                title="Edit Category"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => openDeleteModal(category)}
                className="action-btn delete-btn"
                title="Delete Category"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Nested children */}
          {hasChildren && isExpanded && (
            <div className="subcategories">
              {category.children.map((child) =>
                renderCategory(child, level + 1)
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="categories-page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Categories Management</h1>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* Controls */}
      <div className="categories-controls">
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="control-buttons">
          <button onClick={expandAll} className="btn-secondary">
            Expand All
          </button>
          <button onClick={collapseAll} className="btn-secondary">
            Collapse All
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="categories-container">
        {filteredCategories.length > 0 ? (
          <div className="categories-table">
            {filteredCategories.map((category) => renderCategory(category))}
          </div>
        ) : (
          <div className="empty-state">
            <File size={48} />
            <p>No categories found</p>
            {searchTerm && (
              <p className="text-muted">Try adjusting your search terms</p>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === "create"
                  ? "Create New Category"
                  : "Edit Category"}
              </h2>
              <button onClick={closeModal} className="modal-close">
                ×
              </button>
            </div>

            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="form-input"
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Category Code (auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  className="form-input code-input"
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parent Category</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      parent_id: e.target.value,
                    }))
                  }
                  className="form-input"
                >
                  <option value="">-- Root Category --</option>
                  {flattenCategories(categories)
                    .filter(
                      (cat) =>
                        modalMode === "create" ||
                        cat.id !== selectedCategory?.id
                    )
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {formError && <div className="error-message">{formError}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-primary"
                  disabled={formLoading || !formData.name.trim()}
                >
                  {formLoading
                    ? "Saving..."
                    : modalMode === "create"
                    ? "Create"
                    : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button onClick={closeModal} className="modal-close">
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>"{selectedCategory?.name}"</strong>?
              </p>
              {selectedCategory && countSubcategories(selectedCategory) > 0 && (
                <p className="warning-text">
                  This category has {countSubcategories(selectedCategory)}{" "}
                  subcategorie(s). Deleting it may affect the hierarchy.
                </p>
              )}
              <p className="text-muted">This action cannot be undone.</p>
            </div>

            {formError && <div className="error-message">{formError}</div>}

            <div className="modal-actions">
              <button onClick={closeModal} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
                disabled={formLoading}
              >
                {formLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .categories-page {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
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

        .categories-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .search-container {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          box-sizing: border-box;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .control-buttons {
          display: flex;
          gap: 8px;
        }

        .categories-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .categories-table {
          min-height: 400px;
        }

        .category-row {
          border-bottom: 1px solid #f1f5f9;
        }

        .category-row:last-child {
          border-bottom: none;
        }

        .category-content {
          padding: 12px 16px;
        }

        .category-content.level-0 {
          padding-left: 16px;
        }

        .category-content.level-1 {
          padding-left: 48px;
          background: #fafbfc;
        }

        .category-content.level-2 {
          padding-left: 80px;
          background: #f1f5f9;
        }

        .category-content.level-3 {
          padding-left: 112px;
          background: #e2e8f0;
        }

        .category-main {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 44px;
        }

        .toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .toggle-btn:hover {
          background: #f1f5f9;
        }

        .toggle-placeholder {
          width: 24px;
        }

        .category-icon {
          color: #3b82f6;
          display: flex;
          align-items: center;
        }

        .category-details {
          flex: 1;
        }

        .category-name {
          font-size: 16px;
          font-weight: 500;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .category-meta {
          display: flex;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
          align-items: center;
        }

        .category-code {
          font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }

        .subcategory-count {
          color: #64748b;
        }

        .category-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .edit-btn {
          color: #3b82f6;
        }

        .edit-btn:hover {
          background: #dbeafe;
        }

        .delete-btn {
          color: #ef4444;
        }

        .delete-btn:hover {
          background: #fee2e2;
        }

        .subcategories {
          margin-top: 8px;
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
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
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

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 24px;
          color: #64748b;
        }

        .text-muted {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 8px;
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
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
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

        .modal-form,
        .modal-body {
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

        .code-input {
          background: #f9fafb;
          color: #6b7280;
          font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 20px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f9fafb;
        }

        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          border: 1px solid #fecaca;
          font-size: 14px;
        }

        .warning-text {
          color: #d97706;
          font-weight: 500;
          margin: 8px 0;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
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
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

        /* Responsive */
        @media (max-width: 768px) {
          .categories-page {
            padding: 16px;
          }

          .categories-controls {
            flex-direction: column;
            gap: 12px;
          }

          .search-container {
            max-width: none;
          }

          .control-buttons {
            width: 100%;
            justify-content: space-between;
          }

          .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .category-main {
            flex-wrap: wrap;
          }

          .category-actions {
            order: 3;
            width: 100%;
            justify-content: flex-end;
            margin-top: 8px;
          }

          .modal-content {
            width: 95%;
            margin: 20px;
          }

          .category-content.level-1 {
            padding-left: 32px;
          }

          .category-content.level-2 {
            padding-left: 48px;
          }

          .category-content.level-3 {
            padding-left: 64px;
          }
        }

        /* Hover effects */
        .category-row:hover {
          background: rgba(59, 130, 246, 0.02);
        }

        .toggle-btn:active {
          transform: scale(0.95);
        }

        .action-btn:active {
          transform: scale(0.95);
        }

        /* Focus styles for accessibility */
        .toggle-btn:focus,
        .action-btn:focus,
        .btn-primary:focus,
        .btn-secondary:focus,
        .btn-danger:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default Categories;
