import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Plus, Edit2, Trash2, User, Filter } from "lucide-react";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'add', 'edit', 'delete'
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: 2,
  });

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost/GreenLand/api/users");
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open modal for adding new user
  const openAddModal = () => {
    setFormData({ name: "", email: "", password: "", role_id: 2 });
    setCurrentUser(null);
    setModalType("add");
    setShowModal(true);
  };

  // Open modal for editing user
  const openEditModal = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role_id: user.role_id,
    });
    setCurrentUser(user);
    setModalType("edit");
    setShowModal(true);
  };

  // Open modal for deleting user
  const openDeleteModal = (user) => {
    setCurrentUser(user);
    setModalType("delete");
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setCurrentUser(null);
    setFormData({ name: "", email: "", password: "", role_id: 2 });
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalType === "add") {
        await axios.post("http://localhost/GreenLand/api/users", formData);
      } else if (modalType === "edit") {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't send empty password
        }
        await axios.put(
          `http://localhost/GreenLand/api/users/${currentUser.id}`,
          updateData
        );
      }

      fetchUsers(); // Refresh the list
      closeModal();
    } catch (error) {
      console.error("Error saving user:", error);
      alert(error.response?.data?.error || "An error occurred");
    }
  };
  // Handle delete
  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost/GreenLand/api/users/${currentUser.id}`
      );
      fetchUsers(); // Refresh the list
      closeModal();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };
  const getRoleText = (roleId) => {
    switch (roleId) {
      case 1:
        return "Admin";
      case 2:
        return "Catalog Manager";
      case 3:
        return "Order Manager";
      default:
        return "Unknown";
    }
  };

  // Get unique roles for filter
  const uniqueRoles = [...new Set(users.map((user) => user.role_id))];

  // Filter users based on search term and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "all" || user.role_id === parseInt(roleFilter);
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <h1 className="page-title">
          <User
            size={32}
            style={{ marginRight: "12px", verticalAlign: "middle" }}
          />
          Users Management
        </h1>
      </div>

      <div className="categories-controls">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="control-buttons">
          <div style={{ position: "relative", minWidth: "140px" }}>
            <Filter
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
                pointerEvents: "none",
              }}
            />
            <select
              className="form-input"
              style={{ paddingLeft: "40px", fontSize: "14px", height: "44px" }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map((roleId) => (
                <option key={roleId} value={roleId}>
                  {getRoleText(roleId)}
                </option>
              ))}
            </select>
          </div>

          <button className="btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      <div className="categories-container">
        <div className="categories-table">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="category-row">
                <div className="category-content level-0">
                  <div className="category-main">
                    <div className="category-icon">
                      <User size={20} />
                    </div>
                    <div className="category-details">
                      <h3 className="category-name">{user.name}</h3>
                      <div className="category-meta">
                        <span>{user.email}</span>
                        <span>•</span>
                        <span className="category-code">
                          {getRoleText(user.role_id)}
                        </span>
                        <span>•</span>
                        <span className="subcategory-count">ID: {user.id}</span>
                      </div>
                    </div>
                    <div className="category-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => openEditModal(user)}
                        title="Edit user"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => openDeleteModal(user)}
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <User
                size={48}
                style={{ color: "#cbd5e1", marginBottom: "16px" }}
              />
              <p>No users found</p>
              <p className="text-muted">
                {searchTerm || roleFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first user"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className={`modal-content ${
              modalType === "delete" ? "modal-small" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {modalType === "add" && "Add New User"}
                {modalType === "edit" && "Edit User"}
                {modalType === "delete" && "Delete User"}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            {modalType === "delete" ? (
              <div className="modal-body">
                <p>
                  Are you sure you want to delete user{" "}
                  <strong>{currentUser?.name}</strong>?
                </p>
                <p className="warning-text">This action cannot be undone.</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button className="btn-danger" onClick={handleDelete}>
                    Delete User
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="modal-form">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-input"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      Password{" "}
                      {modalType === "edit" && "(leave blank to keep current)"}
                      {modalType === "add" && " *"}
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="form-input"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={modalType === "add"}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="role_id" className="form-label">
                      Role
                    </label>
                    <select
                      id="role_id"
                      name="role_id"
                      className="form-input"
                      value={formData.role_id}
                      onChange={handleInputChange}
                    >
                      <option value={1}>Admin</option>
                      <option value={2}>Catalog Manager</option>
                      <option value={3}>Order Manager</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {modalType === "add" ? "Create User" : "Update User"}
                  </button>
                </div>
              </form>
            )}
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
          display: flex;
          align-items: center;
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
          gap: 12px;
          align-items: center;
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
          transition: background 0.2s;
        }

        .category-row:last-child {
          border-bottom: none;
        }

        .category-row:hover {
          background: rgba(59, 130, 246, 0.02);
        }

        .category-content {
          padding: 16px 20px;
        }

        .category-content.level-0 {
          padding-left: 20px;
        }

        .category-main {
          display: flex;
          align-items: center;
          gap: 12px;
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
          font-weight: 500;
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

        .action-btn:active {
          transform: scale(0.95);
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
          font-size: 14px;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-primary:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #d1d5db;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          font-weight: 500;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        .btn-secondary:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
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
          font-size: 14px;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .btn-danger:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-danger:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
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

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 20px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f9fafb;
        }

        .warning-text {
          color: #d97706;
          font-weight: 500;
          margin: 8px 0;
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
        }
      `}</style>
    </div>
  );
};

export default Users;
