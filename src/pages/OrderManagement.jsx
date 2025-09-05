import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import {
  Search,
  Eye,
  Download,
  Bell,
  Plus,
  X,
  AlertTriangle,
  Check,
  Package,
  User,
  Clock,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ShoppingCart,
  FileText,
  Users,
  History,
  FileSpreadsheet,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const API_BASE = "http://localhost/GreenLand/api";

const OrderManagement = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Success/Error Modal Component
  const NotificationModal = ({
    isOpen,
    onClose,
    title,
    message,
    type = "info",
  }) => {
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
                <AlertTriangle
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

  // Handle PDF download - fetch complete order data first
  const handleDownloadPDF = async (order) => {
    try {
      console.log("Fetching complete order data for PDF:", order.id);
      const res = await axios.get(`${API_BASE}/orders/${order.id}`);
      const fullOrder = res.data.order;
      console.log("Full order data:", fullOrder);

      if (!fullOrder.items || fullOrder.items.length === 0) {
        setModalMessage("No items found in order");
        setShowErrorModal(true);
        return;
      }

      generateAndDownloadPDF(fullOrder);
    } catch (error) {
      console.error("Error fetching order for PDF:", error);
      setModalMessage("Failed to fetch order details for PDF download");
      setShowErrorModal(true);
    }
  };

  // Handle CSV download - fetch complete order data first
  const handleDownloadCSV = async (order) => {
    try {
      console.log("Fetching complete order data for CSV:", order.id);
      const res = await axios.get(`${API_BASE}/orders/${order.id}`);
      const fullOrder = res.data.order;
      console.log("Full order data:", fullOrder);

      if (!fullOrder.items || fullOrder.items.length === 0) {
        setModalMessage("No items found in order");
        setShowErrorModal(true);
        return;
      }

      generateAndDownloadCSV(fullOrder);
    } catch (error) {
      console.error("Error fetching order for CSV:", error);
      setModalMessage("Failed to fetch order details for CSV download");
      setShowErrorModal(true);
    }
  };

  // Handle Excel download - fetch complete order data first
  const handleDownloadExcel = async (order) => {
    try {
      console.log("Fetching complete order data for Excel:", order.id);
      const res = await axios.get(`${API_BASE}/orders/${order.id}`);
      const fullOrder = res.data.order;
      console.log("Full order data:", fullOrder);

      if (!fullOrder.items || fullOrder.items.length === 0) {
        setModalMessage("No items found in order");
        setShowErrorModal(true);
        return;
      }

      generateAndDownloadExcel(fullOrder);
    } catch (error) {
      console.error("Error fetching order for Excel:", error);
      setModalMessage("Failed to fetch order details for Excel download");
      setShowErrorModal(true);
    }
  };

  // Frontend PDF generation (professional invoice style)
  const generateAndDownloadPDF = (order) => {
    console.log("Starting PDF generation with validated data...");

    try {
      // Double check data validation
      if (
        !order ||
        !order.items ||
        !Array.isArray(order.items) ||
        order.items.length === 0
      ) {
        throw new Error("Order validation failed: No items found");
      }

      const doc = new jsPDF();

      // Company Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("GreenLand", 20, 20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Your Company Address", 20, 28);
      doc.text("City, State, ZIP", 20, 34);
      doc.text("Phone: (123) 456-7890 | Email: info@greenland.com", 20, 40);

      // Invoice Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`Invoice #${order.order_number}`, 140, 20);

      // Invoice Details
      doc.setFontSize(10);
      doc.text(
        `Date: ${new Date(order.created_at).toLocaleDateString()}`,
        140,
        30
      );
      doc.text(`Status: ${order.status.toUpperCase()}`, 140, 36);

      // Bill To
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", 20, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(order.customer_name || "N/A", 20, 68);
      doc.text(order.customer_email || "N/A", 20, 74);
      doc.text(order.customer_phone || "N/A", 20, 80);

      // Items Table
      const tableData = order.items.map((item) => [
        item.product_name || "Unknown Product",
        item.variant_name || "N/A",
        item.variant_code || "N/A",
        item.quantity || 0,
        `$${parseFloat(item.price || 0).toFixed(2)}`,
        `$${(
          parseFloat(item.price || 0) * parseInt(item.quantity || 0)
        ).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 90,
        head: [["Product", "Variant", "Code", "Quantity", "Price", "Total"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        bodyStyles: { textColor: [52, 73, 94] },
        alternateRowStyles: { fillColor: [242, 242, 242] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9, cellPadding: 4 },
      });

      // Total
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total: $${parseFloat(order.total_amount || 0).toFixed(2)}`,
        150,
        finalY
      );

      // Notes
      if (order.note) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("Notes:", 20, finalY + 20);
        doc.text(order.note, 20, finalY + 26);
      }

      // Footer
      doc.setFontSize(8);
      doc.text("Thank you for your business!", 105, 280, { align: "center" });

      // Save
      const filename = `${order.customer_name || "customer"}-${
        order.order_number
      }-${order.customer_phone || "nophone"}.pdf`;
      doc.save(filename);

      setModalMessage(`PDF downloaded successfully: ${filename}`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("PDF generation error:", error);
      setModalMessage(`Failed to generate PDF: ${error.message}`);
      setShowErrorModal(true);
    }
  };

  // Frontend CSV generation
  const generateAndDownloadCSV = (order) => {
    console.log("Starting CSV generation with validated data...");

    try {
      // Double check data validation
      if (
        !order ||
        !order.items ||
        !Array.isArray(order.items) ||
        order.items.length === 0
      ) {
        throw new Error("Order validation failed: No items found");
      }

      let csvContent = "data:text/csv;charset=utf-8,";

      // Order Info
      csvContent += "Order Information\n";
      csvContent += `Order Number,${order.order_number}\n`;
      csvContent += `Date,${new Date(order.created_at).toLocaleDateString()}\n`;
      csvContent += `Status,${order.status}\n`;
      csvContent += `Customer Name,${order.customer_name || "N/A"}\n`;
      csvContent += `Customer Email,${order.customer_email || "N/A"}\n`;
      csvContent += `Customer Phone,${order.customer_phone || "N/A"}\n`;
      csvContent += "\n";

      // Items
      csvContent += "Product,Variant,Code,Quantity,Price,Total\n";
      order.items.forEach((item) => {
        const total =
          parseFloat(item.price || 0) * parseInt(item.quantity || 0);
        csvContent += `${item.product_name || "Unknown"},${
          item.variant_name || "N/A"
        },${item.variant_code || "N/A"},${item.quantity || 0},$${parseFloat(
          item.price || 0
        ).toFixed(2)},$${total.toFixed(2)}\n`;
      });

      // Total
      csvContent += "\n";
      csvContent += `Total,,$${parseFloat(order.total_amount || 0).toFixed(
        2
      )}\n`;

      // Notes
      if (order.note) {
        csvContent += "\nNotes\n";
        csvContent += `${order.note}\n`;
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const filename = `${order.customer_name || "customer"}-${
        order.order_number
      }-${order.customer_phone || "nophone"}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setModalMessage(`CSV downloaded successfully: ${filename}`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("CSV generation error:", error);
      setModalMessage(`Failed to generate CSV: ${error.message}`);
      setShowErrorModal(true);
    }
  };

  // Frontend Excel generation using SheetJS
  const generateAndDownloadExcel = (order) => {
    console.log("Starting Excel generation with validated data...");

    try {
      // Double check data validation
      if (
        !order ||
        !order.items ||
        !Array.isArray(order.items) ||
        order.items.length === 0
      ) {
        throw new Error("Order validation failed: No items found");
      }

      const wb = XLSX.utils.book_new();

      // Order Info Sheet
      const orderInfo = [
        ["Order Information"],
        ["Order Number", order.order_number],
        ["Date", new Date(order.created_at).toLocaleDateString()],
        ["Status", order.status],
        ["Customer Name", order.customer_name || "N/A"],
        ["Customer Email", order.customer_email || "N/A"],
        ["Customer Phone", order.customer_phone || "N/A"],
        [],
        ["Notes", order.note || "N/A"],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(orderInfo);
      XLSX.utils.book_append_sheet(wb, ws1, "Order Info");

      // Items Sheet
      const itemsData = [
        ["Product", "Variant", "Code", "Quantity", "Price", "Total"],
      ];
      order.items.forEach((item) => {
        const total =
          parseFloat(item.price || 0) * parseInt(item.quantity || 0);
        itemsData.push([
          item.product_name || "Unknown",
          item.variant_name || "N/A",
          item.variant_code || "N/A",
          item.quantity || 0,
          parseFloat(item.price || 0),
          total,
        ]);
      });
      itemsData.push([]);
      itemsData.push([
        "Total",
        "",
        "",
        "",
        "",
        parseFloat(order.total_amount || 0),
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet(itemsData);

      // Style the total row (basic styling)
      const totalRow = itemsData.length - 1;
      ws2["F" + totalRow] = {
        v: parseFloat(order.total_amount || 0),
        t: "n",
        z: "$#,##0.00",
        s: { font: { bold: true } },
      };

      XLSX.utils.book_append_sheet(wb, ws2, "Items");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `${order.customer_name || "customer"}-${
        order.order_number
      }-${order.customer_phone || "nophone"}.xlsx`;
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setModalMessage(`Excel downloaded successfully: ${filename}`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Excel generation error:", error);
      setModalMessage(`Failed to generate Excel: ${error.message}`);
      setShowErrorModal(true);
    }
  };

  // Order Detail Modal Component
  const OrderDetailModal = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    const downloadPDF = () => {
      generateAndDownloadPDF(order);
    };

    const downloadCSV = () => {
      generateAndDownloadCSV(order);
    };

    const downloadExcel = () => {
      generateAndDownloadExcel(order);
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content modal-large">
          <div className="modal-header">
            <h2>Order Details - {order.order_number}</h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div style={{ display: "grid", gap: "24px" }}>
              {/* Customer Information */}
              <div>
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    color: "#1e293b",
                    fontSize: "18px",
                  }}
                >
                  Customer Information
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    padding: "16px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <label className="form-label">Name</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {order.customer_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {order.customer_email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {order.customer_phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div>
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    color: "#1e293b",
                    fontSize: "18px",
                  }}
                >
                  Order Information
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "16px",
                    padding: "16px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <label className="form-label">Status</label>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <label className="form-label">Created</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">Items</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {order.item_count} items
                    </p>
                  </div>
                  <div>
                    <label className="form-label">Total</label>
                    <p
                      style={{ margin: 0, color: "#374151", fontWeight: "600" }}
                    >
                      ${parseFloat(order.total_amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div>
                  <h3
                    style={{
                      margin: "0 0 12px 0",
                      color: "#1e293b",
                      fontSize: "18px",
                    }}
                  >
                    Order Items
                  </h3>
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        padding: "12px 16px",
                        borderBottom: "1px solid #e2e8f0",
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr",
                        gap: "16px",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      <span>Product</span>
                      <span>Quantity</span>
                      <span>Price</span>
                      <span>Total</span>
                    </div>
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "12px 16px",
                          borderBottom:
                            index < order.items.length - 1
                              ? "1px solid #e2e8f0"
                              : "none",
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1fr",
                          gap: "16px",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <p style={{ margin: "0 0 4px 0", fontWeight: "500" }}>
                            {item.product_name || "Unknown Product"}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              color: "#64748b",
                            }}
                          >
                            {item.variant_name} • {item.variant_code}
                          </p>
                        </div>
                        <span>{item.quantity}</span>
                        <span>${parseFloat(item.price).toFixed(2)}</span>
                        <span style={{ fontWeight: "600" }}>
                          $
                          {(
                            parseFloat(item.price) * parseInt(item.quantity)
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {order.note && (
                <div>
                  <h3
                    style={{
                      margin: "0 0 12px 0",
                      color: "#1e293b",
                      fontSize: "18px",
                    }}
                  >
                    Notes
                  </h3>
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#374151",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {order.note}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={downloadCSV}>
              <FileSpreadsheet size={16} />
              Download CSV
            </button>
            <button className="btn-secondary" onClick={downloadPDF}>
              <Download size={16} />
              Download PDF
            </button>
            <button className="btn-secondary" onClick={downloadExcel}>
              <FileSpreadsheet size={16} />
              Download Excel
            </button>
            <button className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Customer Detail Modal Component
  const CustomerDetailModal = ({ isOpen, onClose, customer, orders }) => {
    if (!isOpen || !customer) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content modal-large">
          <div className="modal-header">
            <h2>
              Customer Details -{" "}
              {customer.name || customer.email || customer.phone}
            </h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div style={{ display: "grid", gap: "24px" }}>
              {/* Customer Information */}
              <div>
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    color: "#1e293b",
                    fontSize: "18px",
                  }}
                >
                  Customer Information
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    padding: "16px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <label className="form-label">Name</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {customer.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {customer.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {customer.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">Total Orders</label>
                    <p
                      style={{ margin: 0, color: "#374151", fontWeight: "600" }}
                    >
                      {orders.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Orders */}
              <div>
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    color: "#1e293b",
                    fontSize: "18px",
                  }}
                >
                  Order History
                </h3>
                {orders.length > 0 ? (
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        padding: "12px 16px",
                        borderBottom: "1px solid #e2e8f0",
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                        gap: "16px",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      <span>Order Number</span>
                      <span>Date</span>
                      <span>Status</span>
                      <span>Items</span>
                      <span>Total</span>
                    </div>
                    {orders.map((order, index) => (
                      <div
                        key={order.id}
                        style={{
                          padding: "12px 16px",
                          borderBottom:
                            index < orders.length - 1
                              ? "1px solid #e2e8f0"
                              : "none",
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                          gap: "16px",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: "500" }}>
                          {order.order_number}
                        </span>
                        <span>
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status}
                        </span>
                        <span>{order.item_count}</span>
                        <span style={{ fontWeight: "600" }}>
                          ${parseFloat(order.total_amount || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    <ShoppingCart size={48} style={{ marginBottom: "16px" }} />
                    <p>No orders found for this customer</p>
                  </div>
                )}
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

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === "orders") {
        const res = await axios.get(`${API_BASE}/orders?status=pending`);
        setOrders(res.data.orders || []);
      } else if (activeTab === "customers") {
        // Fetch customers - you'll need to create this endpoint
        const res = await axios.get(`${API_BASE}/customers`);
        setCustomers(res.data.customers || []);
      } else if (activeTab === "history") {
        const res = await axios.get(`${API_BASE}/orders`);
        setOrderHistory(res.data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setModalMessage("Failed to load data");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // View order details
  const handleViewOrder = async (order) => {
    try {
      const res = await axios.get(`${API_BASE}/orders/${order.id}`);
      setSelectedOrder(res.data.order);
      setShowOrderModal(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setModalMessage("Failed to load order details");
      setShowErrorModal(true);
    }
  };

  // View customer details
  const handleViewCustomer = async (customer) => {
    try {
      const res = await axios.get(
        `${API_BASE}/orders/customer?email=${customer.email}&phone=${customer.phone}`
      );
      setCustomerOrders(res.data.orders || []);
      setSelectedCustomer(customer);
      setShowCustomerModal(true);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      setModalMessage("Failed to load customer details");
      setShowErrorModal(true);
    }
  };

  // Accept order (create customer if needed)
  const handleAcceptOrder = async (order) => {
    try {
      await axios.put(`${API_BASE}/orders/${order.id}/status`, {
        status: "confirmed",
        note: "Order accepted and customer created",
      });

      setModalMessage("Order accepted successfully");
      setShowSuccessModal(true);
      fetchData();
    } catch (error) {
      console.error("Error accepting order:", error);
      setModalMessage("Failed to accept order");
      setShowErrorModal(true);
    }
  };

  // Filter data based on search term
  const getFilteredData = () => {
    let data = [];
    if (activeTab === "orders") data = orders;
    else if (activeTab === "customers") data = customers;
    else if (activeTab === "history") data = orderHistory;

    return data.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      if (activeTab === "customers") {
        return (
          (item.name && item.name.toLowerCase().includes(searchLower)) ||
          (item.email && item.email.toLowerCase().includes(searchLower)) ||
          (item.phone && item.phone.toLowerCase().includes(searchLower))
        );
      } else {
        return (
          (item.order_number &&
            item.order_number.toLowerCase().includes(searchLower)) ||
          (item.customer_name &&
            item.customer_name.toLowerCase().includes(searchLower)) ||
          (item.customer_email &&
            item.customer_email.toLowerCase().includes(searchLower)) ||
          (item.customer_phone &&
            item.customer_phone.toLowerCase().includes(searchLower))
        );
      }
    });
  };

  const filteredData = getFilteredData();

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
            align-items: center;
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

          .btn-success {
            background: #10b981;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;
          }

          .btn-success:hover:not(:disabled) {
            background: #059669;
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
          }

          .btn-danger:hover:not(:disabled) {
            background: #dc2626;
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
          }

          .data-table td {
            color: #374151;
            font-size: 14px;
          }

          .data-table tbody tr:hover {
            background: #f8fafc;
          }

          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-transform: capitalize;
          }

          .status-pending {
            background: #fef3c7;
            color: #d97706;
          }

          .status-confirmed {
            background: #d1fae5;
            color: #059669;
          }

          .status-cancelled {
            background: #fecaca;
            color: #dc2626;
          }

          .status-fulfilled {
            background: #dbeafe;
            color: #2563eb;
          }

          .status-quoted {
            background: #e0e7ff;
            color: #6366f1;
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
            margin-right: 4px;
          }

          .view-btn {
            background: #6b7280;
            color: white;
          }

          .view-btn:hover {
            background: #4b5563;
          }

          .accept-btn {
            background: #10b981;
            color: white;
          }

          .accept-btn:hover {
            background: #059669;
          }

          .download-btn {
            background: #3b82f6;
            color: white;
          }

          .download-btn:hover {
            background: #2563eb;
          }

          .csv-btn {
            background: #059669;
            color: white;
          }

          .csv-btn:hover {
            background: #047857;
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

          .form-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
          }

          .notification-wrapper {
            position: relative;
            padding: 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
          }

          .notification-wrapper:hover {
            background: #f1f5f9;
          }

          .notification-badge {
            position: absolute;
            top: 4px;
            right: 4px;
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
          }

          .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            overflow: hidden;
            border: 2px solid #e2e8f0;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
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
            max-width: 800px;
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
            .categories-controls { flex-direction: column; gap: 12px; }
            .search-container { max-width: none; }
            .control-buttons { width: 100%; justify-content: space-between; }
            .modal-content { width: 95%; margin: 20px; }
            .tabs-nav { flex-direction: column; }
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
            <div className="header-left">
              <h1 className="page-title">Order Management</h1>
            </div>
            <div className="categories-controls">
              <div className="control-buttons">
                {/* <div className="notification-wrapper">
                  <Bell size={20} />
                  <span className="notification-badge">3</span>
                </div>
                <div className="user-avatar">
                  <User size={20} color="#64748b" />
                </div> */}
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: "24px" }}>
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <div className="tabs-nav">
              <button
                className={`tab-button ${
                  activeTab === "orders" ? "active" : ""
                }`}
                onClick={() => setActiveTab("orders")}
              >
                <ShoppingCart size={16} />
                Current Orders
              </button>
              <button
                className={`tab-button ${
                  activeTab === "customers" ? "active" : ""
                }`}
                onClick={() => setActiveTab("customers")}
              >
                <Users size={16} />
                Customers
              </button>
              <button
                className={`tab-button ${
                  activeTab === "history" ? "active" : ""
                }`}
                onClick={() => setActiveTab("history")}
              >
                <History size={16} />
                Order History
              </button>
            </div>

            <div className="tab-content">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading {activeTab}...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="empty-state">
                  {activeTab === "orders" && (
                    <ShoppingCart
                      size={64}
                      style={{ color: "#cbd5e1", marginBottom: "16px" }}
                    />
                  )}
                  {activeTab === "customers" && (
                    <Users
                      size={64}
                      style={{ color: "#cbd5e1", marginBottom: "16px" }}
                    />
                  )}
                  {activeTab === "history" && (
                    <History
                      size={64}
                      style={{ color: "#cbd5e1", marginBottom: "16px" }}
                    />
                  )}
                  <h3 style={{ color: "#475569", margin: "0 0 8px 0" }}>
                    No {activeTab} found
                  </h3>
                  <p style={{ color: "#64748b", margin: 0 }}>
                    {searchTerm
                      ? "Try adjusting your search"
                      : `No ${activeTab} available`}
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  {/* Orders Table */}
                  {(activeTab === "orders" || activeTab === "history") && (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((order) => (
                          <tr key={order.id}>
                            <td style={{ fontWeight: "600" }}>
                              {order.order_number}
                            </td>
                            <td>
                              <div>
                                <div style={{ fontWeight: "500" }}>
                                  {order.customer_name || "N/A"}
                                </div>
                                <div
                                  style={{ fontSize: "12px", color: "#64748b" }}
                                >
                                  {order.customer_email ||
                                    order.customer_phone ||
                                    "No contact"}
                                </div>
                              </div>
                            </td>
                            <td>
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              <span
                                className={`status-badge status-${order.status}`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td>{order.item_count}</td>
                            <td style={{ fontWeight: "600" }}>
                              ${parseFloat(order.total_amount || 0).toFixed(2)}
                            </td>
                            <td>
                              <button
                                className="action-btn view-btn"
                                onClick={() => handleViewOrder(order)}
                                title="View Details"
                              >
                                <Eye size={12} />
                              </button>
                              {activeTab === "orders" &&
                                order.status === "pending" && (
                                  <button
                                    className="action-btn accept-btn"
                                    onClick={() => handleAcceptOrder(order)}
                                    title="Accept Order"
                                  >
                                    <Check size={12} />
                                  </button>
                                )}
                              <button
                                className="action-btn download-btn"
                                onClick={() => handleDownloadPDF(order)}
                                title="Download PDF"
                              >
                                <Download size={12} />
                              </button>
                              <button
                                className="action-btn csv-btn"
                                onClick={() => handleDownloadCSV(order)}
                                title="Download CSV"
                              >
                                <FileSpreadsheet size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Customers Table */}
                  {activeTab === "customers" && (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Contact</th>
                          <th>Current Orders</th>
                          <th>Last Order</th>
                          <th>Total Spent</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((customer) => (
                          <tr key={customer.id}>
                            <td style={{ fontWeight: "600" }}>
                              {customer.name || "N/A"}
                            </td>
                            <td>
                              <div>
                                {customer.email && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    <Mail
                                      size={12}
                                      style={{ color: "#64748b" }}
                                    />
                                    <span style={{ fontSize: "12px" }}>
                                      {customer.email}
                                    </span>
                                  </div>
                                )}
                                {customer.phone && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <Phone
                                      size={12}
                                      style={{ color: "#64748b" }}
                                    />
                                    <span style={{ fontSize: "12px" }}>
                                      {customer.phone}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{orders.length || 0}</td>
                            <td>
                              {customer.last_order_date
                                ? new Date(
                                    customer.last_order_date
                                  ).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td style={{ fontWeight: "600" }}>
                              $
                              {parseFloat(customer.total_spent || 0).toFixed(2)}
                            </td>
                            <td>
                              <button
                                className="action-btn view-btn"
                                onClick={() => handleViewCustomer(customer)}
                                title="View Customer Details"
                              >
                                <Eye size={12} />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Detail Modal */}
        <OrderDetailModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          order={selectedOrder}
        />

        {/* Customer Detail Modal */}
        <CustomerDetailModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          customer={selectedCustomer}
          orders={customerOrders}
        />

        {/* Success Modal */}
        <NotificationModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Success"
          message={modalMessage}
          type="success"
        />

        {/* Error Modal */}
        <NotificationModal
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

export default OrderManagement;
