import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  Settings,
  Circle,
} from "lucide-react";

const Attributes = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [showEditAttributeModal, setShowEditAttributeModal] = useState(false);
  const [showEditValueModal, setShowEditValueModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Alert modal states
  const [alertConfig, setAlertConfig] = useState({
    type: "error", // 'error', 'success', 'warning'
    title: "",
    message: "",
    onConfirm: null,
  });

  // Current editing/adding
  const [currentAttributeId, setCurrentAttributeId] = useState(null);
  const [currentValueId, setCurrentValueId] = useState(null);
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editAttributeName, setEditAttributeName] = useState("");
  const [editValue, setEditValue] = useState("");
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/GreenLand/api";
  // Axios instance
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // Show alert modal
  const showAlert = (type, title, message, onConfirm = null) => {
    setAlertConfig({ type, title, message, onConfirm });
    setShowAlertModal(true);
  };

  // Fetch all attributes
  const fetchAttributes = async () => {
    try {
      const response = await axiosInstance.get("/attributes");
      const attributesWithValues = await Promise.all(
        response.data.map(async (attr) => {
          try {
            const valuesRes = await axiosInstance.get(
              `/attributes/${attr.id}/values`
            );
            return { ...attr, values: valuesRes.data };
          } catch (error) {
            console.error(
              `Error fetching values for attribute ${attr.id}:`,
              error
            );
            return { ...attr, values: [] };
          }
        })
      );
      setAttributes(attributesWithValues);
    } catch (error) {
      console.error("Error fetching attributes:", error);
      showAlert(
        "error",
        "Error",
        "Failed to fetch attributes. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  // Filter attributes based on search term
  const filteredAttributes = attributes.filter((attr) => {
    const attributeMatch = attr.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const valueMatch = attr.values.some((val) =>
      val.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return attributeMatch || valueMatch;
  });

  // Add attribute
  const handleAddAttribute = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/attributes", {
        name: newAttributeName,
      });
      const newAttr = {
        id: response.data.id,
        name: newAttributeName,
        values: [],
      };
      setAttributes([...attributes, newAttr]);
      setShowAttributeModal(false);
      setNewAttributeName("");
      showAlert("success", "Success", "Attribute added successfully!");
    } catch (error) {
      console.error("Error adding attribute:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to add attribute. Please try again.";
      showAlert("error", "Error", errorMessage);
    }
  };

  // Edit attribute
  const handleEditAttribute = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/attributes/${currentAttributeId}`, {
        name: editAttributeName,
      });
      setAttributes((prev) =>
        prev.map((attr) =>
          attr.id === currentAttributeId
            ? { ...attr, name: editAttributeName }
            : attr
        )
      );
      setShowEditAttributeModal(false);
      setEditAttributeName("");
      setCurrentAttributeId(null);
      showAlert("success", "Success", "Attribute updated successfully!");
    } catch (error) {
      console.error("Error editing attribute:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to edit attribute. Please try again.";
      showAlert("error", "Error", errorMessage);
    }
  };

  // Add value
  const handleAddValue = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post(
        `/attributes/${currentAttributeId}/values`,
        { value: newValue }
      );
      setAttributes((prev) =>
        prev.map((attr) =>
          attr.id === currentAttributeId
            ? {
                ...attr,
                values: [
                  ...attr.values,
                  { id: response.data.id, value: newValue },
                ],
              }
            : attr
        )
      );
      setShowValueModal(false);
      setNewValue("");
      showAlert("success", "Success", "Value added successfully!");
    } catch (error) {
      console.error("Error adding value:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to add value. Please try again.";
      showAlert("error", "Error", errorMessage);
    }
  };

  // Edit value
  const handleEditValue = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/attribute-values/${currentValueId}`, {
        attribute_id: currentAttributeId, // required by API
        value: editValue,
      });
      setAttributes((prev) =>
        prev.map((attr) =>
          attr.id === currentAttributeId
            ? {
                ...attr,
                values: attr.values.map((val) =>
                  val.id === currentValueId ? { ...val, value: editValue } : val
                ),
              }
            : attr
        )
      );
      setShowEditValueModal(false);
      setEditValue("");
      setCurrentValueId(null);
      setCurrentAttributeId(null);
      showAlert("success", "Success", "Value updated successfully!");
    } catch (error) {
      console.error("Error editing value:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to edit value. Please try again.";
      showAlert("error", "Error", errorMessage);
    }
  };

  // Delete attribute
  const handleDeleteAttribute = async (id) => {
    showAlert(
      "warning",
      "Confirm Delete",
      "Are you sure you want to delete this attribute? This action cannot be undone and will also delete all associated values.",
      async () => {
        try {
          await axiosInstance.delete(`/attributes/${id}`);
          setAttributes((prev) => prev.filter((attr) => attr.id !== id));
          showAlert("success", "Success", "Attribute deleted successfully!");
        } catch (error) {
          console.error("Error deleting attribute:", error);
          const errorMessage =
            error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to delete attribute. Please try again.";
          showAlert("error", "Error", errorMessage);
        }
      }
    );
  };

  // Delete value
  const handleDeleteValue = async (id, attrId) => {
    showAlert(
      "warning",
      "Confirm Delete",
      "Are you sure you want to delete this value? This action cannot be undone.",
      async () => {
        try {
          await axiosInstance.delete(`/attribute-values/${id}`);
          setAttributes((prev) =>
            prev.map((attr) =>
              attr.id === attrId
                ? {
                    ...attr,
                    values: attr.values.filter((val) => val.id !== id),
                  }
                : attr
            )
          );
          showAlert("success", "Success", "Value deleted successfully!");
        } catch (error) {
          console.error("Error deleting value:", error);
          const errorMessage =
            error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to delete value. Please try again.";
          showAlert("error", "Error", errorMessage);
        }
      }
    );
  };

  // Render attribute with improved styling
  const renderAttribute = (attribute) => {
    // Check if this attribute matches search
    const attributeMatches = attribute.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchingValues = attribute.values.filter((val) =>
      val.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If search term exists and no matches, don't render
    if (searchTerm && !attributeMatches && matchingValues.length === 0) {
      return null;
    }

    const valuesToShow =
      searchTerm && !attributeMatches ? matchingValues : attribute.values;

    return (
      <div key={attribute.id} className="attribute-row">
        <div className="attribute-content">
          <div className="attribute-main">
            <div className="attribute-icon">
              <Settings size={20} />
            </div>
            <div className="attribute-details">
              <h3 className="attribute-name">
                {highlightText(attribute.name, searchTerm)}
              </h3>
              <div className="attribute-meta">
                <span className="value-count">
                  {attribute.values.length} value
                  {attribute.values.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="attribute-actions">
              <button
                className="action-btn edit-btn"
                onClick={() => {
                  setCurrentAttributeId(attribute.id);
                  setEditAttributeName(attribute.name);
                  setShowEditAttributeModal(true);
                }}
                title="Edit attribute"
              >
                <Edit2 size={16} />
              </button>
              <button
                className="action-btn delete-btn"
                onClick={() => handleDeleteAttribute(attribute.id)}
                title="Delete attribute"
              >
                <Trash2 size={16} />
              </button>
              <button
                className="btn-primary btn-sm"
                onClick={() => {
                  setCurrentAttributeId(attribute.id);
                  setShowValueModal(true);
                }}
              >
                <Plus size={16} />
                Add Value
              </button>
            </div>
          </div>

          {/* Values */}
          {valuesToShow.length > 0 && (
            <div className="values-container">
              <div className="values-grid">
                {valuesToShow.map((val) => (
                  <div key={val.id} className="value-card">
                    <div className="value-content">
                      <Circle size={12} className="value-icon" />
                      <span className="value-text">
                        {highlightText(val.value, searchTerm)}
                      </span>
                    </div>
                    <div className="value-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => {
                          setCurrentAttributeId(attribute.id);
                          setCurrentValueId(val.id);
                          setEditValue(val.value);
                          setShowEditValueModal(true);
                        }}
                        title="Edit value"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteValue(val.id, attribute.id)}
                        title="Delete value"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Highlight search text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading attributes...</p>
      </div>
    );
  }

  return (
    <div className="attributes-page">
      <div className="page-header">
        <h1 className="page-title">Attributes Management</h1>
        <button
          className="btn-primary"
          onClick={() => setShowAttributeModal(true)}
        >
          <Plus size={20} />
          Add New Attribute
        </button>
      </div>

      <div className="page-controls">
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            placeholder="Search attributes and values..."
          />
        </div>
      </div>

      <div className="content-container">
        <div className="attributes-list">
          {filteredAttributes.length > 0 ? (
            filteredAttributes.map((attr) => renderAttribute(attr))
          ) : (
            <div className="empty-state">
              <Settings size={48} className="empty-icon" />
              <h3 className="empty-title">
                {searchTerm
                  ? "No matching attributes found"
                  : "No attributes yet"}
              </h3>
              <p className="empty-description">
                {searchTerm
                  ? "Try adjusting your search terms or clear the search to see all attributes."
                  : "Create your first attribute to get started with product specifications."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAlertModal && (
        <div className="modal-overlay" onClick={() => setShowAlertModal(false)}>
          <div
            className="modal-content modal-alert"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="alert-header">
                {alertConfig.type === "error" && (
                  <AlertCircle className="alert-icon alert-error" size={24} />
                )}
                {alertConfig.type === "success" && (
                  <CheckCircle className="alert-icon alert-success" size={24} />
                )}
                {alertConfig.type === "warning" && (
                  <AlertCircle className="alert-icon alert-warning" size={24} />
                )}
                <h2 className="modal-title">{alertConfig.title}</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowAlertModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="alert-message">{alertConfig.message}</p>
            </div>
            <div className="modal-actions">
              {alertConfig.onConfirm ? (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowAlertModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => {
                      alertConfig.onConfirm();
                      setShowAlertModal(false);
                    }}
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => setShowAlertModal(false)}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAttributeModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAttributeModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Attribute</h2>
              <button
                className="modal-close"
                onClick={() => setShowAttributeModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddAttribute}>
              <div className="modal-form">
                <div className="form-group">
                  <label className="form-label">Attribute Name</label>
                  <input
                    type="text"
                    value={newAttributeName}
                    onChange={(e) => setNewAttributeName(e.target.value)}
                    className="form-input"
                    placeholder="Enter attribute name"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAttributeModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Attribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showValueModal && (
        <div className="modal-overlay" onClick={() => setShowValueModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Value</h2>
              <button
                className="modal-close"
                onClick={() => setShowValueModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddValue}>
              <div className="modal-form">
                <div className="form-group">
                  <label className="form-label">Value</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="form-input"
                    placeholder="Enter value"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowValueModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Value
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditAttributeModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowEditAttributeModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Attribute</h2>
              <button
                className="modal-close"
                onClick={() => setShowEditAttributeModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditAttribute}>
              <div className="modal-form">
                <div className="form-group">
                  <label className="form-label">Attribute Name</label>
                  <input
                    type="text"
                    value={editAttributeName}
                    onChange={(e) => setEditAttributeName(e.target.value)}
                    className="form-input"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditAttributeModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditValueModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowEditValueModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Value</h2>
              <button
                className="modal-close"
                onClick={() => setShowEditValueModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditValue}>
              <div className="modal-form">
                <div className="form-group">
                  <label className="form-label">Value</label>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="form-input"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditValueModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Base styles */
        .attributes-page {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }

        /* Header */
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

        /* Controls */
        .page-controls {
          margin-bottom: 24px;
        }

        .search-container {
          position: relative;
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
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-highlight {
          background: #fef3c7;
          padding: 1px 2px;
          border-radius: 2px;
          font-weight: 500;
        }

        /* Content container */
        .content-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .attributes-list {
          min-height: 400px;
        }

        /* Attribute rows */
        .attribute-row {
          border-bottom: 1px solid #f1f5f9;
          transition: background-color 0.2s ease;
        }

        .attribute-row:last-child {
          border-bottom: none;
        }

        .attribute-row:hover {
          background: rgba(59, 130, 246, 0.02);
        }

        .attribute-content {
          padding: 20px 24px;
        }

        .attribute-main {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .attribute-icon {
          flex-shrink: 0;
          color: #3b82f6;
          padding: 8px;
          background: #eff6ff;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .attribute-details {
          flex: 1;
          min-width: 0;
        }

        .attribute-name {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .attribute-meta {
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #64748b;
        }

        .value-count {
          font-weight: 500;
        }

        .attribute-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
        }

        /* Values */
        .values-container {
          margin-top: 20px;
          padding-left: 56px;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .value-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .value-card:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .value-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .value-icon {
          color: #64748b;
          flex-shrink: 0;
        }

        .value-text {
          font-weight: 500;
          color: #374151;
          word-break: break-word;
          line-height: 1.4;
        }

        .value-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }

        /* Buttons */
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
          font-size: 14px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-primary.btn-sm {
          padding: 8px 12px;
          font-size: 13px;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #475569;
          border: 1px solid #d1d5db;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          border-color: #9ca3af;
          transform: translateY(-1px);
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
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
          transition: all 0.2s ease;
        }

        .edit-btn {
          color: #3b82f6;
        }

        .edit-btn:hover {
          background: #dbeafe;
          transform: scale(1.05);
        }

        .delete-btn {
          color: #ef4444;
        }

        .delete-btn:hover {
          background: #fee2e2;
          transform: scale(1.05);
        }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          text-align: center;
        }

        .empty-icon {
          color: #cbd5e1;
          margin-bottom: 16px;
        }

        .empty-title {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }

        .empty-description {
          color: #94a3b8;
          font-size: 16px;
          margin: 0;
          max-width: 400px;
        }

        /* Loading state */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        .loading-text {
          color: #64748b;
          font-size: 16px;
          margin: 0;
        }

        /* Modal styles */
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
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideIn 0.3s ease-out;
        }

        .modal-alert {
          max-width: 400px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .alert-icon {
          flex-shrink: 0;
        }

        .alert-error {
          color: #ef4444;
        }

        .alert-success {
          color: #10b981;
        }

        .alert-warning {
          color: #f59e0b;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #f1f5f9;
          color: #374151;
          transform: scale(1.05);
        }

        .modal-form,
        .modal-body {
          padding: 24px 28px;
        }

        .alert-message {
          color: #374151;
          margin: 0;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          box-sizing: border-box;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          transform: translateY(-1px);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 20px 28px 24px;
          border-top: 1px solid #f1f5f9;
          background: #fafbfc;
        }

        /* Animations */
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

        /* Focus styles */
        .action-btn:focus,
        .btn-primary:focus,
        .btn-secondary:focus,
        .btn-danger:focus,
        .modal-close:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .attributes-page {
            padding: 16px;
          }

          .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
            text-align: center;
          }

          .page-controls {
            margin-bottom: 16px;
          }

          .search-container {
            max-width: none;
          }

          .attribute-main {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .attribute-actions {
            justify-content: center;
            flex-wrap: wrap;
          }

          .values-container {
            padding-left: 0;
            margin-top: 16px;
          }

          .values-grid {
            grid-template-columns: 1fr;
          }

          .value-card {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .value-actions {
            justify-content: center;
          }

          .modal-content {
            width: 95%;
            margin: 20px;
          }

          .modal-header,
          .modal-form,
          .modal-body,
          .modal-actions {
            padding-left: 20px;
            padding-right: 20px;
          }

          .empty-state {
            padding: 60px 16px;
          }

          .loading-container {
            padding: 60px 16px;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 24px;
          }

          .attribute-name {
            font-size: 16px;
          }

          .values-grid {
            gap: 8px;
          }

          .value-card {
            padding: 12px;
          }

          .modal-content {
            width: 100%;
            margin: 10px;
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default Attributes;
