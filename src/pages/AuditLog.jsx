import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import {
  Search,
  Eye,
  Download,
  Calendar,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  BarChart3,
  FileText,
  Trash2,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = "http://localhost/GreenLand/api";

const AuditLog = () => {
  const [activeTab, setActiveTab] = useState("logs");
  const [searchTerm, setSearchTerm] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/audit-logs`);
      setAuditLogs(response.data.audit_logs || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/audit-logs/statistics`);
      setStatistics(response.data.statistics || {});
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Filter logs by date range
  const filterByDateRange = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      fetchAuditLogs();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/audit-logs/date-range`, {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      });
      setAuditLogs(response.data.audit_logs || []);
    } catch (error) {
      console.error("Error filtering by date range:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs by action type
  const filterByAction = async (action) => {
    if (action === "all") {
      fetchAuditLogs();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/audit-logs/action/${action}`);
      setAuditLogs(response.data.audit_logs || []);
    } catch (error) {
      console.error("Error filtering by action:", error);
    } finally {
      setLoading(false);
    }
  };

  // Clear old logs
  const clearOldLogs = async () => {
    if (!window.confirm("Are you sure you want to delete logs older than 90 days?")) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/audit-logs/cleanup`);
      alert("Old logs deleted successfully");
      fetchAuditLogs();
      fetchStatistics();
    } catch (error) {
      console.error("Error clearing old logs:", error);
      alert("Failed to clear old logs");
    }
  };

  // Export logs to Excel
  const exportToExcel = () => {
    const exportData = filteredLogs.map((log) => ({
      ID: log.id,
      User: log.user_name || "System",
      Email: log.user_email || "N/A",
      Role: log.role_name || "N/A",
      Action: log.action,
      Date: new Date(log.created_at).toLocaleDateString(),
      Time: new Date(log.created_at).toLocaleTimeString(),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
    XLSX.writeFile(wb, `audit-logs-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Get action type icon and color
  const getActionTypeInfo = (action) => {
    if (action.toLowerCase().includes("login")) {
      return { icon: CheckCircle, color: "#10b981", type: "Login" };
    } else if (action.toLowerCase().includes("logout")) {
      return { icon: XCircle, color: "#6b7280", type: "Logout" };
    } else if (action.toLowerCase().includes("failed") || action.toLowerCase().includes("error")) {
      return { icon: AlertCircle, color: "#ef4444", type: "Error" };
    } else if (action.toLowerCase().includes("create") || action.toLowerCase().includes("add")) {
      return { icon: CheckCircle, color: "#3b82f6", type: "Create" };
    } else if (action.toLowerCase().includes("update") || action.toLowerCase().includes("edit")) {
      return { icon: Activity, color: "#f59e0b", type: "Update" };
    } else if (action.toLowerCase().includes("delete")) {
      return { icon: Trash2, color: "#ef4444", type: "Delete" };
    } else {
      return { icon: Activity, color: "#6b7280", type: "Other" };
    }
  };

  // Filter logs based on search and filter type
  const filteredLogs = auditLogs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(searchLower) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchLower)) ||
      (log.user_email && log.user_email.toLowerCase().includes(searchLower));

    if (filterType === "all") return matchesSearch;
    
    const actionInfo = getActionTypeInfo(log.action);
    return matchesSearch && actionInfo.type.toLowerCase() === filterType.toLowerCase();
  });

  useEffect(() => {
    fetchAuditLogs();
    fetchStatistics();
  }, []);

  useEffect(() => {
    filterByAction(filterType);
  }, [filterType]);

  // Log Detail Modal Component
  const LogDetailModal = ({ isOpen, onClose, log }) => {
    if (!isOpen || !log) return null;

    const actionInfo = getActionTypeInfo(log.action);
    const IconComponent = actionInfo.icon;

    return (
      <div className="modal-overlay">
        <div className="modal-content modal-large">
          <div className="modal-header">
            <h2>Audit Log Details</h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div style={{ display: "grid", gap: "24px" }}>
              <div className="audit-detail-card">
                <h3>Action Information</h3>
                <div className="audit-detail-grid">
                  {/* <div>
                    <label className="form-label">Action Type</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <IconComponent size={20} style={{ color: actionInfo.color }} />
                      <span style={{ fontWeight: "600" }}>{actionInfo.type}</span>
                    </div>
                  </div> */}
                  <div>
                    <label className="form-label">Log ID</label>
                    <p style={{ margin: 0, color: "#374151" }}>{log.id}</p>
                  </div>
                  <div>
                    <label className="form-label">Date & Time</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="audit-detail-card">
                <h3>User Information</h3>
                <div className="audit-detail-grid">
                  <div>
                    <label className="form-label">User Name</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {log.user_name || "System/Unknown"}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {log.user_email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">Role</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {log.role_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">User ID</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {log.user_id || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="audit-detail-card">
                <h3>Action Details</h3>
                <div>
                  <label className="form-label">Full Action Description</label>
                  <div className="action-description">
                    {log.action}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
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

          .audit-controls {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }

          .search-container {
            position: relative;
            flex: 1;
            min-width: 300px;
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

          .filter-select {
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: white;
            font-size: 14px;
            cursor: pointer;
            min-width: 150px;
          }

          .date-inputs {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .date-input {
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: white;
            font-size: 14px;
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
            white-space: nowrap;
          }

          .btn-primary:hover:not(:disabled) {
            background: #2563eb;
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
            white-space: nowrap;
          }

          .btn-secondary:hover {
            background: #e2e8f0;
          }

          .btn-danger {
            background: #ef4444;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
          }

          .btn-danger:hover {
            background: #dc2626;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
          }

          .stat-card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }

          .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .stat-title {
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
            margin: 0;
          }

          .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
          }

          .tabs-container {
            margin-bottom: 24px;
          }

          .tabs-nav {
            display: flex;
            border-bottom: 1px solid #e2e8f0;
            background: white;
            border-radius: 8px 8px 0 0;
            overflow: hidden;
          }

          .tab-button {
            padding: 16px 24px;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #64748b;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 2px solid transparent;
          }

          .tab-button:hover {
            color: #3b82f6;
            background: #f8fafc;
          }

          .tab-button.active {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
            background: white;
          }

          .tab-content {
            background: white;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e2e8f0;
            border-top: none;
            min-height: 400px;
          }

          .table-container {
            overflow-x: auto;
          }

          .data-table {
            width: 100%;
            border-collapse: collapse;
          }

          .data-table th,
          .data-table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }

          .data-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            position: sticky;
            top: 0;
          }

          .data-table td {
            color: #374151;
            font-size: 14px;
          }

          .data-table tbody tr:hover {
            background: #f8fafc;
          }

          .action-type {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
          }

          .action-description {
            font-size: 13px;
            color: #64748b;
            max-width: 400px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .action-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          .view-btn {
            background: #6b7280;
            color: white;
          }

          .view-btn:hover {
            background: #4b5563;
          }

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 64px 24px;
            color: #64748b;
            text-align: center;
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

          .audit-detail-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }

          .audit-detail-card h3 {
            margin: 0 0 16px 0;
            color: #1e293b;
            font-size: 16px;
          }

          .audit-detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }

          .form-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
          }

          .action-description {
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #d1d5db;
            font-family: monospace;
            font-size: 13px;
            color: #374151;
            white-space: pre-wrap;
            word-break: break-word;
          }

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
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            animation: slideIn 0.3s ease-out;
          }

          .modal-small {
            max-width: 400px;
          }

          .modal-large {
            max-width: 900px;
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
            .page-header { flex-direction: column; gap: 16px; align-items: stretch; }
            .audit-controls { flex-direction: column; }
            .date-inputs { flex-direction: column; width: 100%; }
            .date-input { width: 100%; }
            .stats-grid { grid-template-columns: 1fr; }
            .modal-content { width: 95%; margin: 20px; }
            .audit-detail-grid { grid-template-columns: 1fr; }
            .table-container { font-size: 12px; }
            .data-table th, .data-table td { padding: 8px 12px; }
          }
        `}
      </style>

      <div className="products-layout">
        <Sidebar />
        <div className="categories-page">
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Audit Log Management</h1>
            <div style={{ display: "flex", gap: "12px" }}>
              {/* <button className="btn-secondary" onClick={exportToExcel}>
                <Download size={16} />
                Export Excel
              </button> */}
              {/* <button className="btn-danger" onClick={clearOldLogs}>
                <Trash2 size={16} />
                Clear Old Logs
              </button>
              <button className="btn-primary" onClick={() => { fetchAuditLogs(); fetchStatistics(); }}>
                <RefreshCw size={16} />
                Refresh
              </button> */}
            </div>
          </div>

          {/* Statistics */}
          {activeTab === "dashboard" && statistics && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Total Logs</h3>
                  <FileText size={24} style={{ color: "#3b82f6" }} />
                </div>
                <p className="stat-value">{statistics.total_logs || 0}</p>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Today's Activity</h3>
                  <Activity size={24} style={{ color: "#10b981" }} />
                </div>
                <p className="stat-value">{statistics.logs_today || 0}</p>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">This Week</h3>
                  <Calendar size={24} style={{ color: "#f59e0b" }} />
                </div>
                <p className="stat-value">{statistics.logs_this_week || 0}</p>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Active Users</h3>
                  <User size={24} style={{ color: "#8b5cf6" }} />
                </div>
                <p className="stat-value">{statistics.active_users?.length || 0}</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="audit-controls">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search logs by action, user, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            {/* <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="error">Errors</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select> */}

            <div className="date-inputs">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="date-input"
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="date-input"
              />
              <button className="btn-primary" onClick={filterByDateRange}>
                <Filter size={16} />
                Filter
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <div className="tabs-nav">
              {/* <button
                className={`tab-button ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <BarChart3 size={16} />
                Dashboard
              </button> */}
              <button
                className={`tab-button ${activeTab === "logs" ? "active" : ""}`}
                onClick={() => setActiveTab("logs")}
              >
                <FileText size={16} />
                Audit Logs
              </button>
            </div>

            <div className="tab-content">
              {activeTab === "dashboard" && statistics && (
                <div style={{ padding: "24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "32px" }}>
                    {/* Most Active Users */}
                    <div>
                      <h3 style={{ marginBottom: "16px", color: "#1e293b" }}>Most Active Users (This Week)</h3>
                      <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "16px" }}>
                        {statistics.active_users?.length > 0 ? (
                          statistics.active_users.map((user, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 0",
                                borderBottom: index < statistics.active_users.length - 1 ? "1px solid #e2e8f0" : "none",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: "600" }}>{user.name || "Unknown"}</div>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>{user.email}</div>
                              </div>
                              <span style={{ fontWeight: "600", color: "#3b82f6" }}>
                                {user.action_count} actions
                              </span>
                            </div>
                          ))
                        ) : (
                          <p style={{ color: "#64748b", textAlign: "center", margin: "16px 0" }}>
                            No activity this week
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Types */}
                    <div>
                      <h3 style={{ marginBottom: "16px", color: "#1e293b" }}>Action Types (This Week)</h3>
                      <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "16px" }}>
                        {statistics.action_types?.length > 0 ? (
                          statistics.action_types.map((action, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 0",
                                borderBottom: index < statistics.action_types.length - 1 ? "1px solid #e2e8f0" : "none",
                              }}
                            >
                              <div style={{ fontWeight: "600" }}>{action.action_type}</div>
                              <span style={{ fontWeight: "600", color: "#10b981" }}>
                                {action.count}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p style={{ color: "#64748b", textAlign: "center", margin: "16px 0" }}>
                            No actions this week
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <>
                  {loading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Loading audit logs...</p>
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="empty-state">
                      <FileText size={64} style={{ color: "#cbd5e1", marginBottom: "16px" }} />
                      <h3 style={{ color: "#475569", margin: "0 0 8px 0" }}>No audit logs found</h3>
                      <p style={{ color: "#64748b", margin: 0 }}>
                        {searchTerm || filterType !== "all" || dateRange.startDate
                          ? "Try adjusting your filters"
                          : "No audit logs available"}
                      </p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            {/* <th>Type</th> */}
                            <th>User</th>
                            <th>Action</th>
                            <th>Date & Time</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLogs.map((log) => {
                            const actionInfo = getActionTypeInfo(log.action);
                            const IconComponent = actionInfo.icon;
                            
                            return (
                              <tr key={log.id}>
                                <td style={{ fontWeight: "600" }}>{log.id}</td>
                                {/* <td>
                                  <div className="action-type">
                                    <IconComponent size={16} style={{ color: actionInfo.color }} />
                                    {actionInfo.type}
                                  </div>
                                </td> */}
                                <td>
                                  <div>
                                    <div style={{ fontWeight: "500" }}>
                                      {log.user_name || "System"}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                                      {log.user_email || "N/A"}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="action-description" title={log.action}>
                                    {log.action}
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <div style={{ fontWeight: "500" }}>
                                      {new Date(log.created_at).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                                      {new Date(log.created_at).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <button
                                    className="action-btn view-btn"
                                    onClick={() => {
                                      setSelectedLog(log);
                                      setShowDetailModal(true);
                                    }}
                                    title="View Details"
                                  >
                                    <Eye size={12} />
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Log Detail Modal */}
        <LogDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          log={selectedLog}
        />
      </div>
    </>
  );
};

export default AuditLog;