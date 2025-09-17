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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItems, setEditingItems] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  // const [orderVersions, setOrderVersions] = useState([]);
  // const [activeVersionTab, setActiveVersionTab] = useState("current");

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Filter states for customer table
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [customerNameFilter, setCustomerNameFilter] = useState("");
  // Add processing state to prevent multiple clicks
  const [processing, setProcessing] = useState(false);
  // Add Item Modal Component
  const AddItemModal = ({ isOpen, onClose, onAddItem }) => {
    if (!isOpen) return null;

    const handleCategoryChange = (categoryId) => {
      setSelectedCategory(categoryId);
      setSelectedProduct("");
      setSelectedVariant("");
      setProducts([]);
      setVariants([]);
      if (categoryId) {
        fetchProductsByCategory(categoryId);
      }
    };

    const handleProductChange = (productId) => {
      setSelectedProduct(productId);
      setSelectedVariant("");
      setVariants([]);
      if (productId) {
        fetchVariantsByProduct(productId);
      }
    };

    const handleAddItem = () => {
      if (!selectedVariant || !newItemQuantity) {
        setModalMessage("Please select a variant and specify quantity");
        setShowErrorModal(true);
        return;
      }

      const selectedVariantData = variants.find((v) => v.id == selectedVariant);
      if (!selectedVariantData) {
        setModalMessage("Selected variant not found");
        setShowErrorModal(true);
        return;
      }

      if (newItemQuantity > selectedVariantData.quantity) {
        setModalMessage(
          `Quantity exceeds available inventory (${selectedVariantData.quantity})`
        );
        setShowErrorModal(true);
        return;
      }

      const selectedProductData = products.find((p) => p.id == selectedProduct);

      const newItem = {
        variant_id: selectedVariant,
        product_name: selectedProductData?.name || "Unknown Product",
        variant_name: selectedVariantData.name,
        variant_code: selectedVariantData.code,
        quantity: newItemQuantity,
        price: selectedVariantData.price,
        available_quantity: selectedVariantData.quantity,
      };

      onAddItem(newItem);

      // Reset form
      setSelectedCategory("");
      setSelectedProduct("");
      setSelectedVariant("");
      setNewItemQuantity(1);
      setProducts([]);
      setVariants([]);
      onClose();
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add New Item</h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label className="form-label">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="search-input"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="search-input"
                  disabled={!selectedCategory}
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Variant</label>
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="search-input"
                  disabled={!selectedProduct}
                >
                  <option value="">Select Variant</option>
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name} ({variant.code}) - Available:{" "}
                      {variant.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  value={newItemQuantity}
                  onChange={(e) =>
                    setNewItemQuantity(
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  className="search-input"
                  min="1"
                  max={
                    variants.find((v) => v.id == selectedVariant)?.quantity || 1
                  }
                />
                {selectedVariant && (
                  <small style={{ color: "#64748b", fontSize: "12px" }}>
                    Available:{" "}
                    {variants.find((v) => v.id == selectedVariant)?.quantity ||
                      0}
                  </small>
                )}
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleAddItem}>
              Add Item
            </button>
          </div>
        </div>
      </div>
    );
  };
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

  // Handle Excel download - fetch complete order data first (keeping only Excel, removing CSV)
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
  }; // Frontend PDF generation with Nature Theme
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

      // Nature Color Palette
      const colors = {
        forestGreen: [34, 139, 34], // Primary green
        leafGreen: [107, 142, 35], // Secondary green
        earthBrown: [139, 69, 19], // Accent brown
        cream: [253, 245, 230], // Background cream
        darkGreen: [0, 100, 0], // Dark text green
        lightGreen: [144, 238, 144], // Light accent
        sage: [158, 171, 141], // Muted green
        bark: [101, 67, 33], // Dark brown
      };

      // Add subtle background texture
      doc.setFillColor(...colors.cream);
      doc.rect(0, 0, 210, 297, "F"); // A4 page background

      // Header with nature-inspired design
      doc.setFillColor(...colors.forestGreen);
      doc.roundedRect(10, 10, 190, 35, 3, 3, "F");

      // Add decorative leaf border elements
      doc.setFillColor(...colors.leafGreen);
      // Left leaf accent
      doc.circle(15, 27.5, 3, "F");
      doc.ellipse(18, 27.5, 4, 2, "F");
      // Right leaf accent
      doc.circle(195, 27.5, 3, "F");
      doc.ellipse(192, 27.5, 4, 2, "F");

      // Company Header with enhanced styling
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("GreenLand", 30, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Naturally Sustainable Solutions", 30, 32);
      doc.text("123 Forest Avenue, Green Valley, GV 12345", 30, 37);
      doc.text("(555) 123-LEAF |hello@greenland.eco", 30, 42);

      // Invoice Title with nature accent
      doc.setFillColor(...colors.earthBrown);
      doc.roundedRect(130, 55, 65, 20, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 145, 62);
      doc.setFontSize(12);
      doc.text(`#${order.order_number}`, 145, 70);

      // Invoice Details with styled box
      doc.setFillColor(...colors.sage);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(130, 78, 65, 25, 2, 2, "F");
      doc.setDrawColor(...colors.sage);
      doc.setLineWidth(0.5);
      doc.roundedRect(130, 78, 65, 25, 2, 2, "S");

      doc.setTextColor(...colors.darkGreen);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Date:", 135, 85);
      doc.text("Status:", 135, 92);

      doc.setFont("helvetica", "normal");
      doc.text(new Date(order.created_at).toLocaleDateString(), 155, 85);
      doc.text(order.status.toUpperCase(), 155, 92);

      // Bill To Section with leaf decoration
      doc.setFillColor(...colors.lightGreen);
      // doc.roundedRect(15, 110, 90, 35, 3, 3, 'F');

      // Leaf decoration
      doc.setFillColor(...colors.forestGreen);
      doc.circle(20, 115, 1.5, "F");
      doc.ellipse(22, 115, 2, 1, "F");

      doc.setTextColor(...colors.darkGreen);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To", 25, 118);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(order.customer_name || "Valued Customer", 20, 127);
      doc.setFontSize(9);
      doc.text(`${order.customer_email || "N/A"}`, 20, 134);
      doc.text(`${order.customer_phone || "N/A"}`, 20, 140);

      // Items Table with nature styling
      const tableData = order.items.map((item, index) => [
        ` ${item.product_name || "Unknown Product"}`,
        item.variant_name || "Standard",
        item.variant_code || "N/A",
        item.quantity || 0,
        `${parseFloat(item.price || 0).toFixed(2)}`,
        `${(parseFloat(item.price || 0) * parseInt(item.quantity || 0)).toFixed(
          2
        )}`,
      ]);

      autoTable(doc, {
        startY: 155,
        head: [["Product", "Variant", "Code", "Qty", "Price", "Total"]],
        body: tableData,
        theme: "plain",
        headStyles: {
          fillColor: colors.forestGreen,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 11,
          cellPadding: { top: 8, right: 5, bottom: 8, left: 5 },
        },
        bodyStyles: {
          textColor: colors.darkGreen,
          fontSize: 10,
          cellPadding: { top: 6, right: 5, bottom: 6, left: 5 },
        },
        alternateRowStyles: {
          fillColor: colors.cream,
        },
        styles: {
          fontSize: 10,
          cellPadding: 6,
          overflow: "linebreak",
          halign: "left",
          lineColor: colors.sage,
          lineWidth: 0.3,
        },
        columnStyles: {
          0: { cellWidth: 60 }, // Product name
          1: { cellWidth: 30 }, // Variant
          2: { cellWidth: 25, halign: "center" }, // Code
          3: { cellWidth: 20, halign: "center" }, // Quantity
          4: { cellWidth: 25, halign: "right" }, // Price
          5: { cellWidth: 30, halign: "right", fontStyle: "bold" }, // Total
        },
        margin: { left: 15, right: 15 },
      });

      // Total Section with enhanced styling
      let currentY = doc.lastAutoTable.finalY + 15;

      // Total box with nature styling
      doc.setFillColor(...colors.earthBrown);
      doc.roundedRect(120, currentY - 5, 75, 18, 3, 3, "F");

      // Decorative elements
      doc.setFillColor(...colors.leafGreen);
      doc.circle(125, currentY + 4, 2, "F");
      doc.ellipse(128, currentY + 4, 3, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(" TOTAL:", 135, currentY + 2);
      doc.setFontSize(18);
      doc.text(
        `$${parseFloat(order.total_amount || 0).toFixed(2)}`,
        135,
        currentY + 9
      );

      // Payment Status
      currentY += 25;
      doc.setFillColor(...colors.lightGreen);
      doc.roundedRect(15, currentY, 180, 12, 2, 2, "F");
      doc.setTextColor(...colors.darkGreen);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(" Payment Required: 100% Advance Payment", 20, currentY + 7);

      // Terms & Conditions with nature styling
      currentY += 25;

      // Check if we need a new page
      if (currentY > 220) {
        doc.addPage();
        doc.setFillColor(...colors.cream);
        doc.rect(0, 0, 210, 297, "F");
        currentY = 20;
      }

      // Terms header with leaf decoration
      doc.setFillColor(...colors.forestGreen);
      doc.roundedRect(15, currentY, 180, 15, 2, 2, "F");

      doc.setFillColor(...colors.leafGreen);
      doc.circle(22, currentY + 7.5, 2, "F");
      doc.ellipse(25, currentY + 7.5, 3, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(" Terms & Conditions", 30, currentY + 9);

      currentY += 20;
      doc.setTextColor(...colors.darkGreen);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      const terms = [
        "Payment: 100% advance payment required for sustainable processing",
        "Shipping: Eco-friendly packaging, charges apply based on location",
        "Delivery: Estimated timelines, weather delays possible",
        "Risk Transfer: Responsibility transfers upon eco-friendly dispatch",
        "Returns: Defective items only, supporting our green initiative",
      ];

      terms.forEach((term, index) => {
        // Alternate background for readability
        if (index % 2 === 0) {
          doc.setFillColor(...colors.cream);
          const termLines = doc.splitTextToSize(term, 165);
          doc.rect(15, currentY - 2, 180, termLines.length * 4 + 2, "F");
        }

        const termLines = doc.splitTextToSize(term, 165);
        doc.text(termLines, 20, currentY + 2);
        currentY += termLines.length * 4 + 6;

        // Check if we need a new page
        if (currentY > 270) {
          doc.addPage();
          doc.setFillColor(...colors.cream);
          doc.rect(0, 0, 210, 297, "F");
          currentY = 20;
        }
      });

      // Footer with nature theme
      currentY = Math.max(currentY, 270);
      doc.setFillColor(...colors.sage);
      doc.rect(0, currentY, 210, 27, "F");

      // Decorative footer elements
      doc.setFillColor(...colors.forestGreen);
      for (let i = 0; i < 8; i++) {
        const x = 25 + i * 20;
        doc.circle(x, currentY + 8, 1, "F");
        doc.ellipse(x + 2, currentY + 8, 2, 1, "F");
      }

      doc.setTextColor(...colors.darkGreen);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        " Thank you for choosing sustainable solutions! ",
        105,
        currentY + 12,
        { align: "center" }
      );

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Together we grow a greener future - GreenLand Eco Solutions",
        105,
        currentY + 20,
        { align: "center" }
      );

      // Save with nature-themed filename
      const filename = `GreenLand-Invoice-${order.order_number}-${
        order.customer_name?.replace(/\s+/g, "_") || "EcoCustomer"
      }.pdf`;
      doc.save(filename);

      setModalMessage(`PDF generated successfully: ${filename}`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("PDF generation error:", error);
      setModalMessage(`Failed to generate PDF: ${error.message}`);
      setShowErrorModal(true);
    }
  };
  // Export only the selected/filtered customer data
  const handleExportFilteredCustomers = async () => {
    try {
      setProcessing(true);
      const filteredCustomers = getFilteredCustomers();

      if (filteredCustomers.length === 0) {
        setModalMessage("No customers match the current filters");
        setShowErrorModal(true);
        setProcessing(false);
        return;
      }

      // Fetch detailed data for filtered customers
      const customersWithOrders = [];

      for (const customer of filteredCustomers) {
        try {
          const res = await axios.get(
            `${API_BASE}/orders/customer?email=${customer.email}&phone=${customer.phone}`
          );
          let customerOrders = res.data.orders || [];

          // Apply date filter to orders if specified
          if (dateFilter.start || dateFilter.end) {
            customerOrders = customerOrders.filter((order) => {
              const orderDate = new Date(order.created_at);
              const startDate = dateFilter.start
                ? new Date(dateFilter.start)
                : null;
              const endDate = dateFilter.end ? new Date(dateFilter.end) : null;

              if (startDate && orderDate < startDate) return false;
              if (endDate && orderDate > endDate) return false;
              return true;
            });
          }

          // Fetch complete order details for each order
          const ordersWithDetails = [];
          for (const order of customerOrders) {
            try {
              const orderRes = await axios.get(
                `${API_BASE}/orders/${order.id}`
              );
              ordersWithDetails.push(orderRes.data.order);
            } catch (error) {
              console.warn(`Could not fetch details for order ${order.id}`);
              ordersWithDetails.push(order);
            }
          }

          customersWithOrders.push({ ...customer, orders: ordersWithDetails });
        } catch (error) {
          console.warn(`Failed to fetch orders for ${customer.name}:`, error);
          customersWithOrders.push({ ...customer, orders: [] });
        }
      }

      generateCustomerDetailExcel(customersWithOrders);
      setProcessing(false);
    } catch (error) {
      console.error("Export error:", error);
      setModalMessage(`Failed to export data: ${error.message}`);
      setShowErrorModal(true);
      setProcessing(false);
    }
  };
  // Generate Excel with separate sheets for multiple customers
  const generateCustomerDetailExcel = (customersWithOrders) => {
    try {
      const wb = XLSX.utils.book_new();

      if (customersWithOrders.length === 1) {
        // Single customer - one sheet
        const customer = customersWithOrders[0];
        const sheetData = createCustomerSheetData(customer);
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws["!cols"] = [
          { width: 25 },
          { width: 20 },
          { width: 15 },
          { width: 12 },
          { width: 12 },
          { width: 12 },
        ];

        // Apply styling
        applySheetStyling(ws, sheetData);

        const sheetName = (customer.name || "Customer").substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      } else {
        // Multiple customers - separate sheets for each
        customersWithOrders.forEach((customer, index) => {
          const sheetData = createCustomerSheetData(customer);
          const ws = XLSX.utils.aoa_to_sheet(sheetData);
          ws["!cols"] = [
            { width: 25 },
            { width: 20 },
            { width: 15 },
            { width: 12 },
            { width: 12 },
            { width: 12 },
          ];

          // Apply styling
          applySheetStyling(ws, sheetData);

          // Create unique sheet name (Excel limit is 31 characters)
          let sheetName = customer.name || `Customer${index + 1}`;
          if (sheetName.length > 28) {
            sheetName = sheetName.substring(0, 28);
          }
          if (index > 0) {
            sheetName += `_${index + 1}`;
          }

          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        // Add summary sheet for multiple customers
        const summaryData = createSummarySheetData(customersWithOrders);
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        summaryWs["!cols"] = [
          { width: 25 },
          { width: 15 },
          { width: 30 },
          { width: 12 },
          { width: 15 },
          { width: 15 },
        ];

        // Insert summary sheet at the beginning
        XLSX.utils.book_append_sheet(wb, summaryWs, "Summary", 0);
      }

      // Create filename
      const customerName =
        customersWithOrders.length === 1
          ? (customersWithOrders[0].name || "Customer").replace(/\s+/g, "-")
          : `${customersWithOrders.length}-Customers`;
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${customerName}-Details-${dateStr}.xlsx`;

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setModalMessage(`Customer details downloaded: ${filename}`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Excel generation error:", error);
      setModalMessage(`Failed to generate Excel: ${error.message}`);
      setShowErrorModal(true);
    }
  };

  // Helper function to create sheet data for a single customer
  // Fetch categories for add item modal
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Fetch products by category
  const fetchProductsByCategory = async (categoryId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/categories/${categoryId}/products`
      );
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  // Fetch variants by product
  const fetchVariantsByProduct = async (productId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/products/${productId}/variants`
      );
      setVariants(response.data.variants || []);
    } catch (error) {
      console.error("Failed to fetch variants:", error);
    }
  };
  // Remove this entire function
  const fetchOrderVersions = async (orderId) => {
    try {
      console.log("Fetching versions for order:", orderId);
      const response = await axios.get(
        `${API_BASE}/orders/${orderId}/versions`
      );
      console.log("Order versions response:", response.data);
      setOrderVersions(response.data.versions || []);
    } catch (error) {
      console.error("Failed to fetch order versions:", error);
      setOrderVersions([]);
    }
  };
  const createCustomerSheetData = (customer) => {
    const sheetData = [];

    // Customer Header
    sheetData.push(["CUSTOMER INFORMATION"]);
    sheetData.push([]);
    sheetData.push(["Name:", customer.name || "N/A"]);
    sheetData.push(["Email:", customer.email || "N/A"]);
    sheetData.push(["Phone:", customer.phone || "N/A"]);
    sheetData.push(["Total Orders:", customer.orders.length]);
    sheetData.push([
      "Total Spent:",
      `₹${customer.orders
        .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
        .toFixed(2)}`,
    ]);
    sheetData.push([]);
    sheetData.push([]);

    // Orders for this customer
    customer.orders.forEach((order, orderIndex) => {
      sheetData.push([`ORDER ${orderIndex + 1} INFORMATION`]);
      sheetData.push([]);
      sheetData.push(["Order Number:", order.order_number]);
      sheetData.push(["Status:", order.status]);
      sheetData.push([
        "Created:",
        new Date(order.created_at).toLocaleDateString(),
      ]);
      sheetData.push(["Items:", order.item_count || 0]);
      sheetData.push([
        "Total:",
        `₹${parseFloat(order.total_amount || 0).toFixed(2)}`,
      ]);
      sheetData.push([]);

      // Order Items
      if (order.items && order.items.length > 0) {
        sheetData.push(["ORDER ITEMS"]);
        sheetData.push([
          "Product",
          "Variant",
          "Code",
          "Quantity",
          "Price",
          "Total",
        ]);

        order.items.forEach((item) => {
          sheetData.push([
            item.product_name || "Unknown Product",
            item.variant_name || "N/A",
            item.variant_code || "N/A",
            item.quantity || 0,
            `₹${parseFloat(item.price || 0).toFixed(2)}`,
            `₹${(
              parseFloat(item.price || 0) * parseInt(item.quantity || 0)
            ).toFixed(2)}`,
          ]);
        });
        sheetData.push([]);
      }

      // Notes
      if (order.note) {
        sheetData.push(["Notes:"]);
        sheetData.push([order.note]);
        sheetData.push([]);
      }

      // Separator between orders
      if (orderIndex < customer.orders.length - 1) {
        sheetData.push(["═══════════════════════════════════════════════════"]);
        sheetData.push([]);
      }
    });

    return sheetData;
  };

  // Helper function to create summary sheet for multiple customers
  const createSummarySheetData = (customersWithOrders) => {
    const summaryData = [
      ["CUSTOMER EXPORT SUMMARY"],
      ["Generated on:", new Date().toLocaleDateString()],
      ["Total Customers:", customersWithOrders.length],
      [],
      ["CUSTOMER OVERVIEW"],
      [
        "Customer Name",
        "Phone",
        "Email",
        "Total Orders",
        "Total Spent (₹)",
        "Last Order Date",
      ],
    ];

    let grandTotalOrders = 0;
    let grandTotalRevenue = 0;

    customersWithOrders.forEach((customer) => {
      const customerTotal = customer.orders.reduce(
        (sum, order) => sum + parseFloat(order.total_amount || 0),
        0
      );
      grandTotalOrders += customer.orders.length;
      grandTotalRevenue += customerTotal;

      const lastOrderDate =
        customer.orders.length > 0
          ? new Date(
              Math.max(...customer.orders.map((o) => new Date(o.created_at)))
            ).toLocaleDateString()
          : "No orders";

      summaryData.push([
        customer.name || "N/A",
        customer.phone || "N/A",
        customer.email || "N/A",
        customer.orders.length,
        customerTotal.toFixed(2),
        lastOrderDate,
      ]);
    });

    summaryData.push([]);
    summaryData.push([
      "GRAND TOTALS",
      "",
      "",
      grandTotalOrders,
      grandTotalRevenue.toFixed(2),
      "",
    ]);

    return summaryData;
  };

  // Helper function to apply styling to sheets
  const applySheetStyling = (ws, sheetData) => {
    const headerStyle = {
      font: { bold: true, size: 14 },
      fill: { fgColor: { rgb: "E3F2FD" } },
    };

    const subHeaderStyle = {
      font: { bold: true, size: 12 },
      fill: { fgColor: { rgb: "F5F5F5" } },
    };

    sheetData.forEach((row, rowIndex) => {
      if (row[0] === "CUSTOMER INFORMATION") {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        if (ws[cellRef]) ws[cellRef].s = headerStyle;
      }
      if (
        row[0] &&
        row[0].includes("ORDER") &&
        row[0].includes("INFORMATION")
      ) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        if (ws[cellRef]) ws[cellRef].s = subHeaderStyle;
      }
      if (row[0] === "ORDER ITEMS") {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        if (ws[cellRef]) ws[cellRef].s = subHeaderStyle;

        // Style the items header row
        for (let col = 0; col < 6; col++) {
          const itemHeaderRef = XLSX.utils.encode_cell({ r: rowIndex, c: col });
          if (ws[itemHeaderRef]) {
            ws[itemHeaderRef].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: "E8F5E8" } },
            };
          }
        }
      }
    });
  };
  // Generate comprehensive Excel for filtered customers
  const generateFilteredCustomerExcel = async (customersWithOrders) => {
    try {
      const wb = XLSX.utils.book_new();

      // For each customer, create detailed sheets
      for (let i = 0; i < customersWithOrders.length; i++) {
        const customer = customersWithOrders[i];
        const sheetData = [];

        // Customer Header Information
        sheetData.push(["CUSTOMER INFORMATION"]);
        sheetData.push([]);
        sheetData.push(["Name:", customer.name || "N/A"]);
        sheetData.push(["Email:", customer.email || "N/A"]);
        sheetData.push(["Phone:", customer.phone || "N/A"]);
        sheetData.push(["Total Orders:", customer.orders.length]);
        sheetData.push([
          "Total Spent:",
          `₹${customer.orders
            .reduce(
              (sum, order) => sum + parseFloat(order.total_amount || 0),
              0
            )
            .toFixed(2)}`,
        ]);
        sheetData.push([]);

        // Orders Details
        if (customer.orders.length > 0) {
          sheetData.push(["ORDER DETAILS"]);
          sheetData.push([]);

          for (const order of customer.orders) {
            // Fetch complete order details including items
            let fullOrder = order;
            try {
              const res = await axios.get(`${API_BASE}/orders/${order.id}`);
              fullOrder = res.data.order;
            } catch (error) {
              console.warn(
                `Could not fetch full details for order ${order.id}`
              );
            }

            // Order Information Section
            sheetData.push(["Order Information"]);
            sheetData.push(["Order Number:", fullOrder.order_number]);
            sheetData.push(["Status:", fullOrder.status]);
            sheetData.push([
              "Created:",
              new Date(fullOrder.created_at).toLocaleDateString(),
            ]);
            sheetData.push(["Items Count:", fullOrder.item_count || 0]);
            sheetData.push([
              "Total Amount:",
              `₹${parseFloat(fullOrder.total_amount || 0).toFixed(2)}`,
            ]);
            sheetData.push([]);

            // Order Items Section
            if (fullOrder.items && fullOrder.items.length > 0) {
              sheetData.push(["Order Items"]);
              sheetData.push([
                "Product",
                "Variant",
                "Code",
                "Quantity",
                "Price",
                "Total",
              ]);

              fullOrder.items.forEach((item) => {
                sheetData.push([
                  item.product_name || "Unknown Product",
                  item.variant_name || "N/A",
                  item.variant_code || "N/A",
                  item.quantity || 0,
                  `₹${parseFloat(item.price || 0).toFixed(2)}`,
                  `₹${(
                    parseFloat(item.price || 0) * parseInt(item.quantity || 0)
                  ).toFixed(2)}`,
                ]);
              });
              sheetData.push([]);
            }

            // Notes Section
            if (fullOrder.note) {
              sheetData.push(["Notes"]);
              sheetData.push([fullOrder.note]);
              sheetData.push([]);
            }

            sheetData.push(["─".repeat(50)]); // Separator between orders
            sheetData.push([]);
          }
        } else {
          sheetData.push(["No orders found for this customer"]);
        }

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        // Set column widths
        ws["!cols"] = [
          { width: 25 }, // First column (labels/products)
          { width: 20 }, // Second column (values/variants)
          { width: 15 }, // Third column (codes)
          { width: 12 }, // Fourth column (quantity)
          { width: 12 }, // Fifth column (price)
          { width: 12 }, // Sixth column (total)
        ];

        // Style headers
        const headerStyle = {
          font: { bold: true, size: 14 },
          fill: { fgColor: { rgb: "E3F2FD" } },
        };

        // Apply styling to key headers
        sheetData.forEach((row, rowIndex) => {
          if (
            row[0] === "CUSTOMER INFORMATION" ||
            row[0] === "ORDER DETAILS" ||
            row[0] === "Order Information" ||
            row[0] === "Order Items" ||
            row[0] === "Notes"
          ) {
            const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
            if (ws[cellRef]) {
              ws[cellRef].s = headerStyle;
            }
          }
        });

        // Create sheet name (limit to 31 characters for Excel)
        const sheetName =
          (customer.name || `Customer${i + 1}`).substring(0, 28) +
          (i > 0 ? ` ${i + 1}` : "");
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      // Summary Sheet
      const summaryData = [
        ["FILTERED CUSTOMER EXPORT SUMMARY"],
        ["Generated on:", new Date().toLocaleDateString()],
        ["Filters Applied:"],
        [
          "Date Range:",
          dateFilter.start || dateFilter.end
            ? `${dateFilter.start || "Any"} to ${dateFilter.end || "Any"}`
            : "None",
        ],
        ["Selected Customer:", customerNameFilter || "All customers"],
        ["Search Term:", searchTerm || "None"],
        ["Total Customers Exported:", customersWithOrders.length],
        [],
        ["CUSTOMER SUMMARY"],
        [
          "Customer Name",
          "Phone",
          "Email",
          "Total Orders",
          "Total Spent (₹)",
          "Last Order Date",
        ],
      ];

      let grandTotalOrders = 0;
      let grandTotalRevenue = 0;

      customersWithOrders.forEach((customer) => {
        const customerTotal = customer.orders.reduce(
          (sum, order) => sum + parseFloat(order.total_amount || 0),
          0
        );
        grandTotalOrders += customer.orders.length;
        grandTotalRevenue += customerTotal;

        const lastOrderDate =
          customer.orders.length > 0
            ? new Date(
                Math.max(...customer.orders.map((o) => new Date(o.created_at)))
              ).toLocaleDateString()
            : "No orders";

        summaryData.push([
          customer.name || "N/A",
          customer.phone || "N/A",
          customer.email || "N/A",
          customer.orders.length,
          customerTotal.toFixed(2),
          lastOrderDate,
        ]);
      });

      summaryData.push([]);
      summaryData.push([
        "GRAND TOTALS",
        "",
        "",
        grandTotalOrders,
        grandTotalRevenue.toFixed(2),
        "",
      ]);

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs["!cols"] = [
        { width: 25 },
        { width: 15 },
        { width: 30 },
        { width: 12 },
        { width: 15 },
        { width: 15 },
      ];

      // Insert summary sheet at the beginning
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary", 0);

      // Generate filename with filter info
      const filterSuffix = [
        dateFilter.start && `from-${dateFilter.start}`,
        dateFilter.end && `to-${dateFilter.end}`,
        customerNameFilter &&
          customerNameFilter.replace(/\s+/g, "-").substring(0, 20),
      ]
        .filter(Boolean)
        .join("_");

      const filename = `Customer-Details${
        filterSuffix ? "-" + filterSuffix : ""
      }-${new Date().toISOString().split("T")[0]}.xlsx`;

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setModalMessage(`Detailed customer report downloaded: ${filename}`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Excel generation error:", error);
      setModalMessage(`Failed to generate Excel: ${error.message}`);
      setShowErrorModal(true);
    }
  };
  const generateAndDownloadExcel = (order) => {
    console.log("Starting Excel generation with validated data...");

    try {
      if (
        !order ||
        !order.items ||
        !Array.isArray(order.items) ||
        order.items.length === 0
      ) {
        throw new Error("Order validation failed: No items found");
      }

      const wb = XLSX.utils.book_new();

      // Build sheet data
      const sheetData = [
        ["GreenLand Eco Solutions"], // Company name
        ["123 Forest Avenue, Green Valley, GV 12345"],
        ["Phone: (555) 123-LEAF | Email: hello@greenland.eco"],
        [""],
        ["INVOICE", "", "", "", "", `#${order.order_number}`],
        [""],
        ["Order Information", "", "", "", "", ""],
        [
          "Order Number:",
          order.order_number,
          "",
          "Date:",
          new Date(order.created_at).toLocaleDateString(),
        ],
        ["Status:", order.status, "", "Due:", "Upon Receipt"],
        [""],
        ["Bill To"],
        ["Customer:", order.customer_name || "N/A"],
        ["Email:", order.customer_email || "N/A"],
        ["Phone:", order.customer_phone || "N/A"],
        [""],
        [
          "Product Name",
          "Variant",
          "Code",
          "Quantity",
          "Price (₹)",
          "Total (₹)",
        ],
      ];

      // Add items
      order.items.forEach((item) => {
        const total =
          parseFloat(item.price || 0) * parseInt(item.quantity || 0);
        sheetData.push([
          item.product_name || "Unknown",
          item.variant_name || "N/A",
          item.variant_code || "N/A",
          item.quantity || 0,
          parseFloat(item.price || 0),
          total,
        ]);
      });

      // Grand Total
      sheetData.push([]);
      sheetData.push([
        "",
        "",
        "",
        "",
        "Grand Total:",
        parseFloat(order.total_amount || 0),
      ]);

      // Terms & Conditions
      sheetData.push([]);
      sheetData.push(["Terms & Conditions"]);
      sheetData.push(["1. Payment: 100% advance payment required."]);
      sheetData.push([
        "2. Shipping: Additional charges apply, post payment confirmation.",
      ]);
      sheetData.push([
        "3. Delivery: Timelines are estimates only; delays may occur.",
      ]);
      sheetData.push([
        "4. Risk: Responsibility transfers once goods are dispatched.",
      ]);
      sheetData.push([
        "5. Returns: Accepted only for defective/incorrect items.",
      ]);

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Set column widths
      ws["!cols"] = [
        { width: 40 },
        { width: 20 },
        { width: 15 },
        { width: 10 },
        { width: 15 },
        { width: 15 },
      ];

      // Merge company header
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // GreenLand
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Address
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Phone/Email
      ];

      // Style company name
      ws["A1"].s = {
        font: { bold: true, size: 18, color: { rgb: "006400" } },
        alignment: { horizontal: "center" },
      };

      // Style INVOICE row
      ws["A5"].s = {
        font: { bold: true, size: 16 },
        fill: { fgColor: { rgb: "E8F5E9" } },
      };
      ws["F5"].s = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: "right" },
      };

      // Style table headers
      const itemsHeaderRow =
        sheetData.findIndex((row) => row[0] === "Product Name") + 1;
      ["A", "B", "C", "D", "E", "F"].forEach((col) => {
        const ref = col + itemsHeaderRow;
        if (ws[ref]) {
          ws[ref].s = {
            font: { bold: true },
            alignment: { horizontal: "center" },
            fill: { fgColor: { rgb: "C8E6C9" } },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            },
          };
        }
      });

      // Style Grand Total
      const totalRowIndex =
        sheetData.findIndex((row) => row[4] === "Grand Total:") + 1;
      if (totalRowIndex > 0) {
        ws["E" + totalRowIndex].s = {
          font: { bold: true },
          alignment: { horizontal: "right" },
          fill: { fgColor: { rgb: "FFF3E0" } },
        };
        ws["F" + totalRowIndex].s = {
          font: { bold: true },
          alignment: { horizontal: "right" },
          fill: { fgColor: { rgb: "FFF3E0" } },
          numFmt: "₹#,##0.00",
        };
      }

      // Style Terms & Conditions header
      const termsRowIndex =
        sheetData.findIndex((row) => row[0] === "Terms & Conditions") + 1;
      if (termsRowIndex > 0) {
        ws["A" + termsRowIndex].s = {
          font: { bold: true, size: 12 },
          fill: { fgColor: { rgb: "F5F5F5" } },
        };
      }

      XLSX.utils.book_append_sheet(wb, ws, "Invoice");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `Invoice-${order.order_number}-${
        order.customer_name?.replace(/\s+/g, "_") || "Customer"
      }.xlsx`;
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
  }; // Order Detail Modal Component - COMPLETE REPLACEMENT
  // Fixed OrderDetailModal Component - Replace the existing one
  const OrderDetailModal = ({ isOpen, onClose, order }) => {
    // Local state for order versions to avoid infinite loops
    const [localOrderVersions, setLocalOrderVersions] = useState([]);
    const [localActiveVersionTab, setLocalActiveVersionTab] =
      useState("current");
    // Add this useEffect in your OrderDetailModal component
    useEffect(() => {
      if (isEditMode && editingItems.length > 0) {
        // Real-time total calculation as user edits
        console.log("Items updated in edit mode:", editingItems);
      }
    }, [editingItems, isEditMode]);
    if (!isOpen || !order) return null;
    const handleToggleEditMode = async () => {
      console.log("Toggle edit mode clicked, current state:", isEditMode);

      if (!isEditMode) {
        // Enter edit mode - initialize editing items with deep copy
        const itemsCopy = selectedOrder.items.map((item) => ({
          ...item,
          available_quantity: item.available_quantity || 999, // Fallback if not provided
        }));
        setEditingItems(itemsCopy);
        await fetchCategories();
        console.log("Entering edit mode, editing items set:", itemsCopy);
      } else {
        // Exit edit mode - reset states
        setEditingItems([]);
        setSelectedCategory("");
        setSelectedProduct("");
        setSelectedVariant("");
        setProducts([]);
        setVariants([]);
        console.log("Exiting edit mode");
      }
      setIsEditMode(!isEditMode);
    };

    // Update the total calculation in the OrderDetailModal
    const calculateCurrentTotal = () => {
      const items = isEditMode ? editingItems : order?.items || [];
      return items
        .reduce(
          (sum, item) =>
            sum + parseFloat(item.price || 0) * parseInt(item.quantity || 0),
          0
        )
        .toFixed(2);
    };

    const handleQuantityChange = (itemIndex, newQuantity) => {
      const updatedItems = [...editingItems];
      updatedItems[itemIndex].quantity = Math.max(
        0,
        parseInt(newQuantity) || 0
      );
      setEditingItems(updatedItems);
    };

    const handleRemoveItem = (itemIndex) => {
      const updatedItems = editingItems.filter(
        (_, index) => index !== itemIndex
      );
      setEditingItems(updatedItems);
    };

    const handleAddNewItem = (newItem) => {
      setEditingItems([...editingItems, newItem]);
    };
    const handleSaveChanges = async () => {
      const editReason = prompt(
        "Please provide a reason for editing this order:"
      );
      if (!editReason || editReason.trim() === "") return;

      try {
        setProcessing(true);

        // Get token from localStorage or wherever you store it
        const token =
          localStorage.getItem("authToken") || localStorage.getItem("token");

        const response = await axios.put(
          `${API_BASE}/orders/${selectedOrder.id}/update`,
          {
            items: editingItems,
            edit_reason: editReason,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          // Update the selected order with the new order data returned from server
          const newOrder = response.data.order;
          setSelectedOrder(newOrder);

          // Helper function to get base order number (without version suffix)
          const getBaseOrderNumber = (orderNumber) => {
            if (!orderNumber) return "";
            return orderNumber.split("-v")[0];
          };

          // Get the base order number for comparison
          const baseOrderNumber = getBaseOrderNumber(
            selectedOrder.order_number
          );

          // Update the orders list based on active tab
          if (activeTab === "orders") {
            setOrders((prev) =>
              prev.map((order) => {
                // Safety check for null/undefined order_number
                if (!order.order_number || !selectedOrder.order_number) {
                  return order;
                }

                // Check if this order matches the base order number
                const orderBaseNumber = getBaseOrderNumber(order.order_number);

                return orderBaseNumber === baseOrderNumber ? newOrder : order;
              })
            );
          } else if (activeTab === "history") {
            setOrderHistory((prev) =>
              prev.map((order) => {
                // Safety check for null/undefined order_number
                if (!order.order_number || !selectedOrder.order_number) {
                  return order;
                }

                // Check if this order matches the base order number
                const orderBaseNumber = getBaseOrderNumber(order.order_number);

                return orderBaseNumber === baseOrderNumber ? newOrder : order;
              })
            );
          }

          setModalMessage(
            "Order updated successfully. Previous version moved to history."
          );
          setShowSuccessModal(true);
          setIsEditMode(false);
          setEditingItems([]);

          // Refresh order versions to show the new history
          await fetchLocalOrderVersions(newOrder.id);
        } else {
          throw new Error(response.data.message || "Update failed");
        }
      } catch (error) {
        console.error("Order update error:", error);
        setModalMessage(
          "Failed to update order: " +
            (error.response?.data?.error || error.message)
        );
        setShowErrorModal(true);
      } finally {
        setProcessing(false);
      }
    };

    // Also update the fetchLocalOrderVersions function to be more robust
    const fetchLocalOrderVersions = async (orderId) => {
      try {
        console.log("Fetching versions for order:", orderId);
        const response = await axios.get(
          `${API_BASE}/orders/${orderId}/versions`
        );
        console.log("Order versions response:", response.data);

        // Sort versions by creation date, most recent first
        const versions = (response.data.versions || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setLocalOrderVersions(versions);
      } catch (error) {
        console.error("Failed to fetch order versions:", error);
        setLocalOrderVersions([]);
      }
    };

    // Update the OrderDetailModal useEffect to handle data refresh
    useEffect(() => {
      let mounted = true;

      const loadVersions = async () => {
        if (isOpen && order && order.id && mounted) {
          try {
            await fetchLocalOrderVersions(order.id);
            if (mounted) {
              setLocalActiveVersionTab("current");
            }
          } catch (error) {
            console.error("Error loading versions:", error);
          }
        }
      };

      // Only load versions when modal opens or order changes
      if (isOpen && order?.id) {
        loadVersions();
      }

      // Reset local state when modal closes
      if (!isOpen) {
        setLocalOrderVersions([]);
        setLocalActiveVersionTab("current");
        setIsEditMode(false);
        setEditingItems([]);
      }

      return () => {
        mounted = false;
      };
    }, [isOpen, order?.id]);
    // Add this function to refresh data after successful operations
    const refreshCurrentData = async () => {
      try {
        setLoading(true);
        await fetchData(); // This will refresh the current tab's data
      } catch (error) {
        console.error("Error refreshing data:", error);
      } finally {
        setLoading(false);
      }
    };
    const downloadPDF = () => {
      generateAndDownloadPDF(order);
    };

    const downloadExcel = () => {
      generateAndDownloadExcel(order);
    };

    const currentItems = isEditMode ? editingItems : order.items;

    return (
      <>
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>Order Details - {order.order_number}</h2>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {/* Edit Toggle Switch */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isEditMode}
                    onChange={handleToggleEditMode}
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      width: "44px",
                      height: "24px",
                      backgroundColor: isEditMode ? "#3b82f6" : "#d1d5db",
                      borderRadius: "12px",
                      position: "relative",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "white",
                        borderRadius: "50%",
                        position: "absolute",
                        top: "2px",
                        left: isEditMode ? "22px" : "2px",
                        transition: "all 0.2s",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    {isEditMode ? "Edit Mode" : "View Mode"}
                  </span>
                </label>
                <button className="modal-close" onClick={onClose}>
                  ×
                </button>
              </div>
            </div>

            <div className="modal-body">
              {/* Version Tabs */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}
                >
                  <button
                    className={`tab-button ${
                      localActiveVersionTab === "current" ? "active" : ""
                    }`}
                    onClick={() => setLocalActiveVersionTab("current")}
                    style={{
                      padding: "8px 16px",
                      border: "none",
                      background:
                        localActiveVersionTab === "current" ? "white" : "none",
                      borderBottom:
                        localActiveVersionTab === "current"
                          ? "2px solid #3b82f6"
                          : "none",
                      color:
                        localActiveVersionTab === "current"
                          ? "#3b82f6"
                          : "#64748b",
                    }}
                  >
                    Current Order
                  </button>
                  {localOrderVersions.length > 0 && (
                    <button
                      className={`tab-button ${
                        localActiveVersionTab === "history" ? "active" : ""
                      }`}
                      onClick={() => setLocalActiveVersionTab("history")}
                      style={{
                        padding: "8px 16px",
                        border: "none",
                        background:
                          localActiveVersionTab === "history"
                            ? "white"
                            : "none",
                        borderBottom:
                          localActiveVersionTab === "history"
                            ? "2px solid #3b82f6"
                            : "none",
                        color:
                          localActiveVersionTab === "history"
                            ? "#3b82f6"
                            : "#64748b",
                      }}
                    >
                      Order History ({localOrderVersions.length})
                    </button>
                  )}
                </div>
              </div>

              {localActiveVersionTab === "current" ? (
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
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
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
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(150px, 1fr))",
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
                          {currentItems?.length || 0} items
                        </p>
                      </div>
                      <div>
                        <label className="form-label">Total</label>
                        <p
                          style={{
                            margin: 0,
                            color: "#374151",
                            fontWeight: "600",
                          }}
                        >
                          ₹
                          {currentItems
                            ?.reduce(
                              (sum, item) =>
                                sum +
                                parseFloat(item.price || 0) *
                                  parseInt(item.quantity || 0),
                              0
                            )
                            .toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  {currentItems && currentItems.length > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            color: "#1e293b",
                            fontSize: "18px",
                          }}
                        >
                          Order Items
                        </h3>
                        {isEditMode && (
                          <button
                            className="btn-primary"
                            onClick={() => setShowAddItemModal(true)}
                            style={{ padding: "8px 16px", fontSize: "14px" }}
                          >
                            <Plus size={14} />
                            Add Item
                          </button>
                        )}
                      </div>
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
                            gridTemplateColumns: isEditMode
                              ? "2fr 1fr 1fr 1fr 80px"
                              : "2fr 1fr 1fr 1fr",
                            gap: "16px",
                            fontWeight: "600",
                            fontSize: "14px",
                          }}
                        >
                          <span>Product</span>
                          <span>Quantity</span>
                          <span>Price</span>
                          <span>Total</span>
                          {isEditMode && <span>Actions</span>}
                        </div>
                        {currentItems.map((item, index) => (
                          <div
                            key={index}
                            style={{
                              padding: "12px 16px",
                              borderBottom:
                                index < currentItems.length - 1
                                  ? "1px solid #e2e8f0"
                                  : "none",
                              display: "grid",
                              gridTemplateColumns: isEditMode
                                ? "2fr 1fr 1fr 1fr 80px"
                                : "2fr 1fr 1fr 1fr",
                              gap: "16px",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  margin: "0 0 4px 0",
                                  fontWeight: "500",
                                }}
                              >
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
                            <div>
                              {isEditMode ? (
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(index, e.target.value)
                                  }
                                  min="0"
                                  max={item.available_quantity || 999}
                                  style={{
                                    width: "60px",
                                    padding: "4px 8px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px",
                                  }}
                                />
                              ) : (
                                <span>{item.quantity}</span>
                              )}
                            </div>
                            <span>
                              ₹{parseFloat(item.price || 0).toFixed(2)}
                            </span>
                            <span style={{ fontWeight: "600" }}>
                              ₹
                              {(
                                parseFloat(item.price || 0) *
                                parseInt(item.quantity || 0)
                              ).toFixed(2)}
                            </span>
                            {isEditMode && (
                              <button
                                onClick={() => handleRemoveItem(index)}
                                style={{
                                  background: "#ef4444",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "4px 8px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                <X size={12} />
                              </button>
                            )}
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
              ) : (
                // Order History Tab
                <div>
                  <h3
                    style={{
                      margin: "0 0 16px 0",
                      color: "#1e293b",
                      fontSize: "18px",
                    }}
                  >
                    Order History
                  </h3>
                  {localOrderVersions.length > 0 ? (
                    localOrderVersions.map((version, index) => (
                      <div
                        key={version.id || index}
                        style={{
                          padding: "16px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <h4 style={{ margin: "0 0 4px 0" }}>
                              {version.order_number}
                            </h4>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                color: "#64748b",
                              }}
                            >
                              {new Date(version.created_at).toLocaleString()}
                            </p>
                            {version.edit_reason && (
                              <p
                                style={{
                                  margin: "4px 0 0 0",
                                  fontSize: "12px",
                                  color: "#64748b",
                                  fontStyle: "italic",
                                }}
                              >
                                Reason: {version.edit_reason}
                              </p>
                            )}
                          </div>
                          <button
                            className="btn-secondary"
                            onClick={() => handleViewOrder({ id: version.id })}
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                          >
                            <Eye size={12} />
                            View
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p
                      style={{
                        color: "#64748b",
                        textAlign: "center",
                        padding: "24px",
                      }}
                    >
                      No order history available
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              {isEditMode ? (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setIsEditMode(false);
                      setEditingItems([]);
                    }}
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSaveChanges}
                    disabled={processing}
                  >
                    {processing ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-secondary" onClick={downloadExcel}>
                    <FileSpreadsheet size={16} />
                    Download Excel
                  </button>
                  <button className="btn-secondary" onClick={downloadPDF}>
                    <Download size={16} />
                    Download PDF
                  </button>
                  <button className="btn-primary" onClick={onClose}>
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Add Item Modal */}
        <AddItemModal
          isOpen={showAddItemModal}
          onClose={() => setShowAddItemModal(false)}
          onAddItem={handleAddNewItem}
        />
      </>
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
                          ₹ {parseFloat(order.total_amount || 0).toFixed(2)}
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

 // Replace your existing fetchData function
const fetchData = async () => {
  try {
    setLoading(true);

    if (activeTab === "orders") {
      const res = await axios.get(`${API_BASE}/orders?status=pending`);
      setOrders(res.data.orders || []);
    } else if (activeTab === "customers") {
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
// Update the handleViewOrder function to fetch fresh data
const handleViewOrder = async (order) => {
  try {
    setLoading(true);
    const res = await axios.get(`${API_BASE}/orders/${order.id}`);
    setSelectedOrder(res.data.order);
    setShowOrderModal(true);
  } catch (error) {
    console.error("Error fetching order details:", error);
    setModalMessage("Failed to load order details");
    setShowErrorModal(true);
  } finally {
    setLoading(false);
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
  // Filter customers - show only selected customer or all
  const getFilteredCustomers = () => {
    if (activeTab !== "customers") return [];

    let filteredCustomers = customers.filter((customer) => {
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const nameMatch =
        !searchTerm ||
        (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
        (customer.email &&
          customer.email.toLowerCase().includes(searchLower)) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchLower));

      // Customer selection filter
      const customerMatch =
        !customerNameFilter || customer.id == customerNameFilter;

      return nameMatch && customerMatch;
    });

    return filteredCustomers;
  };
  // Update the original getFilteredData function to handle other tabs
  const getFilteredData = () => {
    if (activeTab === "customers") {
      return getFilteredCustomers();
    }

    let data = [];
    if (activeTab === "orders") data = orders;
    else if (activeTab === "history") data = orderHistory;

    return data.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
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
                              ₹{parseFloat(order.total_amount || 0).toFixed(2)}
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
                              {/* <button
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
                              </button> */}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {/* Customers Table */}
                  {activeTab === "customers" && (
                    <>
                      {/* Filter Controls */}
                      <div
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr auto",
                          gap: "16px",
                          alignItems: "end",
                        }}
                      >
                        <div>
                          <label
                            className="form-label"
                            style={{ display: "none" }}
                          >
                            Filter by Date Range
                          </label>
                          <div
                            style={{
                              gridTemplateColumns: "1fr 1fr",
                              gap: "8px",
                              display: "none",
                            }}
                          >
                            <input
                              type="date"
                              value={dateFilter.start}
                              onChange={(e) =>
                                setDateFilter({
                                  ...dateFilter,
                                  start: e.target.value,
                                })
                              }
                              className="search-input"
                              style={{ padding: "8px" }}
                              placeholder="Start date"
                            />
                            <input
                              type="date"
                              value={dateFilter.end}
                              onChange={(e) =>
                                setDateFilter({
                                  ...dateFilter,
                                  end: e.target.value,
                                })
                              }
                              className="search-input"
                              style={{ padding: "8px" }}
                              placeholder="End date"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label">Select Customer</label>
                          <select
                            value={customerNameFilter}
                            onChange={(e) =>
                              setCustomerNameFilter(e.target.value)
                            }
                            className="search-input"
                            style={{ padding: "8px" }}
                          >
                            <option value="">All Customers</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name || "No Name"} -{" "}
                                {customer.phone || customer.email}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          className="btn-primary"
                          onClick={() => handleExportFilteredCustomers()}
                          style={{ height: "44px" }}
                          disabled={processing}
                        >
                          <FileSpreadsheet size={16} />
                          {processing ? "Exporting..." : "Export Selected"}
                        </button>
                      </div>

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
                          {getFilteredCustomers().map((customer) => (
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
                              <td>{customer.filteredOrders?.length || 0}</td>
                              <td>
                                {customer.last_order_date
                                  ? new Date(
                                      customer.last_order_date
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td style={{ fontWeight: "600" }}>
                                ₹
                                {parseFloat(customer.total_spent || 0).toFixed(
                                  2
                                )}
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
                    </>
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
<NotificationModal
  isOpen={showSuccessModal}
  onClose={() => {
    setShowSuccessModal(false);
    // Refresh data after successful operations
    if (modalMessage.includes("updated successfully")) {
      fetchData();
    }
  }}
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
