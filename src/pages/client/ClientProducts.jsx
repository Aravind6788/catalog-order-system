import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import axios from "axios";
import { debounce } from "lodash";
import {
  Search,
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  ShoppingCart,
  Package,
  SlidersHorizontal,
  X,
  Check,
  User,
  Phone,
  Mail,
  History,
  Trash2,
} from "lucide-react";
import GFLLogo from "../../img/GFL_Logo.png";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/GreenLand/api";

const API_BASE = API_BASE_URL;

// Cookie utilities (unchanged)
const CookieManager = {
  getCookie: (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  },
  setCookie: (name, value, days = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  },
  generateSessionId: () => {
    return (
      "session_" +
      Math.random().toString(36).substr(2, 9) +
      Date.now().toString(36)
    );
  },
  getClientIP: async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Error getting IP:", error);
      return "unknown";
    }
  },
};

// Stable style objects outside component
const containerStyle = {
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, sans-serif',
  backgroundColor: "#f8f9fa",
  minHeight: "100vh",
};
// const modalStyle = {
//   position: "fixed",
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   backgroundColor: "rgba(0,0,0,0.5)",
//   zIndex: 1050,
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   padding: "1rem",
//   overflowY: "auto",
// };



const navbarStyle = {
  backgroundColor: "white",
  borderBottom: "2px solid #f0f8f3",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  padding: "1rem 0",
};

const brandStyle = {
  color: "#2d8659",
  fontWeight: "700",
  fontSize: "1.5rem",
  textDecoration: "none",
  marginRight: "2rem",
};

const buttonStyle = {
  backgroundColor: "#2d8659",
  borderColor: "#2d8659",
  color: "white",
  borderRadius: "8px",
  transition: "all 0.2s ease",
  border: "1px solid #2d8659",
  padding: "0.5rem 1rem",
  cursor: "pointer",
};

const sidebarStyle = {
  backgroundColor: "white",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  padding: "20px",
  position: "sticky",
  top: "20px",
  height: "fit-content",
};

const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  zIndex: 1050,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  overflowY: "auto",
};

const cardStyle = {
  cursor: "pointer",
  height: "100%",
  transition: "all 0.2s ease",
  border: "none",
  borderRadius: "12px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  backgroundColor: "white",
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  border: "1px solid #e9ecef",
  borderRadius: "8px",
  fontSize: "0.9rem",
  outline: "none",
  transition: "border-color 0.2s ease",
};

const selectStyle = {
  width: "100%",
  padding: "0.75rem",
  border: "1px solid #e9ecef",
  borderRadius: "6px",
  fontSize: "0.9rem",
  outline: "none",
  backgroundColor: "white",
  cursor: "pointer",
};

const ModernNavbar = React.memo(
  ({
    searchTerm,
    handleSearchChange,
    cart,
    previousOrders,
    setShowOrderHistory,
    setShowCheckout,
  }) => (
    <nav style={navbarStyle}>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <a href="#" style={brandStyle}>
          <img src={GFLLogo} alt="Green Formula Logo" className="brand-logo" />
        </a>

        {/* Search - Full width on mobile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flex: 1,
            justifyContent: "center",
            maxWidth: "500px",
            width: "100%",
            order: 3, // Moves to next line on mobile
          }}
          className="search-wrapper"
        >
          <div
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                style={{
                  ...inputStyle,
                  flex: 1,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2d8659")}
                onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
              />
              <button
                type="button"
                style={{
                  ...buttonStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  whiteSpace: "nowrap",
                }}
                className="search-btn"
              >
                <Search size={16} />
                <span className="btn-text">Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions - Stacks vertically on small screens */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {previousOrders.length > 0 && (
            <button
              style={{
                ...buttonStyle,
                backgroundColor: "transparent",
                color: "#2d8659",
                border: "1px solid #2d8659",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem",
                justifyContent:"center"
              }}
              onClick={() => setShowOrderHistory(true)}
              className="nav-btn"
            >
              <History size={16} />
              <span className="btn-text">Orders ({previousOrders.length})</span>
            </button>
          )}

          <button
            style={{
              ...buttonStyle,
              backgroundColor: "transparent",
              color: "#2d8659",
              border: "1px solid #2d8659",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem",
              justifyContent:"center"
            }}
            onClick={() => setShowCheckout(true)}
            className="nav-btn"
          >
            <ShoppingCart size={16} />
            <span className="btn-text">
              Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
);
// Enhanced Previous Orders Modal Component - Add this outside your main component
const PreviousOrdersModal = React.memo(
  ({ previousOrders, setShowOrderHistory }) => {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Fetch detailed order information
    const fetchOrderDetails = async (orderId) => {
      setLoadingDetails(true);
      try {
        const response = await axios.get(`${API_BASE}/orders/${orderId}`);
        if (response.data.success) {
          setOrderDetails(response.data.order);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        alert("Failed to load order details");
      } finally {
        setLoadingDetails(false);
      }
    };

    const handleViewDetails = (order) => {
      setSelectedOrder(order);
      fetchOrderDetails(order.id);
    };

    const handleCloseDetails = () => {
      setSelectedOrder(null);
      setOrderDetails(null);
    };

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case "completed":
        case "fulfilled":
          return "#28a745";
        case "pending":
          return "#ffc107";
        case "quoted":
          return "#17a2b8";
        case "confirmed":
          return "#007bff";
        case "cancelled":
          return "#dc3545";
        default:
          return "#6c757d";
      }
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <div style={modalStyle} onClick={() => setShowOrderHistory(false)}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            maxWidth: selectedOrder ? "1100px" : "900px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: selectedOrder ? "row" : "column",
          }}
          className="order-history-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Panel - Order List */}
          <div
            style={{
              width: selectedOrder ? "50%" : "100%",
              borderRight: selectedOrder ? "1px solid #e9ecef" : "none",
              display: "flex",
              flexDirection: "column",
            }}
            className="order-list-panel"
          >
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid #e9ecef",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h5
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <History size={20} />
                Order History ({previousOrders.length})
              </h5>
              {!selectedOrder && (
                <button
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "#6c757d",
                  }}
                  onClick={() => setShowOrderHistory(false)}
                >
                  <X size={24} />
                </button>
              )}
            </div>

            <div style={{ padding: "1.5rem", overflow: "auto", flex: 1 }}>
              {previousOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <Package
                    size={48}
                    style={{ color: "#cbd5e1", marginBottom: "1rem" }}
                  />
                  <p style={{ color: "#6c757d" }}>No previous orders found</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    height: "550px",
                  }}
                >
                  {previousOrders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        border:
                          selectedOrder?.id === order.id
                            ? "2px solid #2d8659"
                            : "1px solid #e9ecef",
                        borderRadius: "8px",
                        padding: "1rem",
                        backgroundColor:
                          selectedOrder?.id === order.id ? "#f8f9fa" : "white",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.75rem",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        <div>
                          <h6
                            style={{
                              margin: 0,
                              fontSize: "1rem",
                              fontWeight: "600",
                            }}
                          >
                            Order #{order.order_number || order.id}
                          </h6>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.8rem",
                              color: "#6c757d",
                            }}
                          >
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              backgroundColor: getStatusColor(order.status),
                              color: "white",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "15px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              textTransform: "capitalize",
                            }}
                          >
                            {order.status || "pending"}
                          </span>
                          <p
                            style={{
                              margin: "0.3rem 0 0 0",
                              fontSize: "1rem",
                              fontWeight: "600",
                              color: "#2d8659",
                            }}
                          >
                            ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Quick Order Summary */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.85rem",
                            color: "#6c757d",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <Package size={14} />
                          {order.item_count || 0} item
                          {(order.item_count || 0) !== 1 ? "s" : ""}
                          {order.customer_name && (
                            <>
                              <span style={{ margin: "0 0.25rem" }}>•</span>
                              <User size={14} />
                              {order.customer_name}
                            </>
                          )}
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        style={{
                          ...buttonStyle,
                          width: "100%",
                          fontSize: "0.85rem",
                          padding: "0.5rem 1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          backgroundColor:
                            selectedOrder?.id === order.id
                              ? "#2d8659"
                              : "transparent",
                          color:
                            selectedOrder?.id === order.id
                              ? "white"
                              : "#2d8659",
                          border: "1px solid #2d8659",
                        }}
                        onClick={() => handleViewDetails(order)}
                      >
                        {selectedOrder?.id === order.id ? (
                          <>
                            <Check size={16} />
                            Selected
                          </>
                        ) : (
                          <>
                            <Search size={16} />
                            View Details
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Order Details */}
          {selectedOrder && (
            <div
              style={{ width: "100%", display: "flex", flexDirection: "column" }}
              className="selectedOrderDetail"
            >
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: "1px solid #e9ecef",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h5 style={{ margin: 0 }}>Order Details</h5>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    style={{
                      ...buttonStyle,
                      backgroundColor: "transparent",
                      color: "#6c757d",
                      border: "1px solid #e9ecef",
                      padding: "0.5rem",
                    }}
                    onClick={handleCloseDetails}
                    title="Close Details"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "1.5rem",
                      cursor: "pointer",
                      color: "#6c757d",
                    }}
                    onClick={() => setShowOrderHistory(false)}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div style={{ padding: "1.5rem", overflow: "auto", flex: 1 }}>
                {loadingDetails ? (
                  <div style={{ textAlign: "center", padding: "2rem" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        border: "3px solid #e9ecef",
                        borderTop: "3px solid #2d8659",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 1rem",
                      }}
                    />
                    <p>Loading order details...</p>
                  </div>
                ) : orderDetails ? (
                  <div>
                    {/* Order Header */}
                    <div
                      style={{
                        backgroundColor: "#f8f9fa",
                        padding: "1.5rem",
                        borderRadius: "8px",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <h4 style={{ margin: "0 0 1rem 0", color: "#2c3e50" }}>
                        Order #{orderDetails.order_number || orderDetails.id}
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <p
                            style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}
                          >
                            <strong>Date:</strong>{" "}
                            {formatDate(orderDetails.created_at)}
                          </p>
                          <p
                            style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}
                          >
                            <strong>Status:</strong>{" "}
                            <span
                              style={{
                                backgroundColor: getStatusColor(
                                  orderDetails.status
                                ),
                                color: "white",
                                padding: "0.2rem 0.6rem",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                                textTransform: "capitalize",
                                marginLeft: "0.5rem",
                              }}
                            >
                              {orderDetails.status || "pending"}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p
                            style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}
                          >
                            <strong>Items:</strong>{" "}
                            {orderDetails.item_count || 0}
                          </p>
                          <p
                            style={{
                              margin: "0.25rem 0",
                              fontSize: "1.1rem",
                              fontWeight: "600",
                              color: "#2d8659",
                            }}
                          >
                            <strong>
                              Total: ₹
                              {parseFloat(
                                orderDetails.total_amount || 0
                              ).toFixed(2)}
                            </strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div
                      style={{
                        backgroundColor: "white",
                        border: "1px solid #e9ecef",
                        borderRadius: "8px",
                        padding: "1.5rem",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <h6 style={{ margin: "0 0 1rem 0", color: "#2c3e50" }}>
                        Customer Information
                      </h6>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {orderDetails.customer_name && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.9rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <User size={16} style={{ color: "#6c757d" }} />
                            <strong>Name:</strong> {orderDetails.customer_name}
                          </p>
                        )}
                        {orderDetails.customer_email && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.9rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <Mail size={16} style={{ color: "#6c757d" }} />
                            <strong>Email:</strong>{" "}
                            {orderDetails.customer_email}
                          </p>
                        )}
                        {orderDetails.customer_phone && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.9rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <Phone size={16} style={{ color: "#6c757d" }} />
                            <strong>Phone:</strong>{" "}
                            {orderDetails.customer_phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div
                      style={{
                        backgroundColor: "white",
                        border: "1px solid #e9ecef",
                        borderRadius: "8px",
                        padding: "1.5rem",
                      }}
                    >
                      <h6 style={{ margin: "0 0 1rem 0", color: "#2c3e50" }}>
                        Order Items ({orderDetails.items?.length || 0})
                      </h6>
                      {orderDetails.items && orderDetails.items.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                          }}
                        >
                          {orderDetails.items.map((item, index) => {
                            const itemTotal =
                              parseFloat(item.price) * parseInt(item.quantity);
                            return (
                              <div
                                key={`${orderDetails.id}-item-${index}`}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "1rem",
                                  backgroundColor: "#f8f9fa",
                                  borderRadius: "6px",
                                  border: "1px solid #e9ecef",
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <h6
                                    style={{
                                      margin: "0 0 0.25rem 0",
                                      fontSize: "0.9rem",
                                    }}
                                  >
                                    {item.product_name || "Unknown Product"}
                                  </h6>
                                  {item.variant_name &&
                                    item.variant_name !== "Default" && (
                                      <p
                                        style={{
                                          margin: "0 0 0.25rem 0",
                                          fontSize: "0.8rem",
                                          color: "#6c757d",
                                        }}
                                      >
                                        Variant: {item.variant_name}
                                        {item.variant_code &&
                                          ` (${item.variant_code})`}
                                      </p>
                                    )}
                                  {item.description && (
                                    <p
                                      style={{
                                        margin: "0",
                                        fontSize: "0.8rem",
                                        color: "#6c757d",
                                      }}
                                    >
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <div
                                  style={{
                                    textAlign: "right",
                                    minWidth: "120px",
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: "0",
                                      fontSize: "0.85rem",
                                      color: "#6c757d",
                                    }}
                                  >
                                    Qty: {item.quantity}
                                  </p>
                                  <p
                                    style={{
                                      margin: "0",
                                      fontSize: "0.85rem",
                                      color: "#6c757d",
                                    }}
                                  >
                                    Unit: ₹{parseFloat(item.price).toFixed(2)}
                                  </p>
                                  <p
                                    style={{
                                      margin: "0.25rem 0 0 0",
                                      fontSize: "0.9rem",
                                      fontWeight: "600",
                                      color: "#2d8659",
                                    }}
                                  >
                                    ₹{itemTotal.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}

                          {/* Order Total */}
                          <div
                            style={{
                              borderTop: "2px solid #e9ecef",
                              paddingTop: "1rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <h5 style={{ margin: 0, color: "#2c3e50" }}>
                              Order Total:
                            </h5>
                            <h4 style={{ margin: 0, color: "#2d8659" }}>
                              ₹
                              {parseFloat(
                                orderDetails.total_amount || 0
                              ).toFixed(2)}
                            </h4>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: "#6c757d", fontStyle: "italic" }}>
                          No items found
                        </p>
                      )}
                    </div>

                    {/* Order Notes */}
                    {orderDetails.note && (
                      <div
                        style={{
                          backgroundColor: "#fff3cd",
                          border: "1px solid #ffeaa7",
                          borderRadius: "8px",
                          padding: "1rem",
                          marginTop: "1.5rem",
                        }}
                      >
                        <h6
                          style={{ margin: "0 0 0.5rem 0", color: "#856404" }}
                        >
                          Order Notes:
                        </h6>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.85rem",
                            color: "#856404",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {orderDetails.note}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem" }}>
                    <p style={{ color: "#0e2539ff" }}>
                      Failed to load order details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
const ModernFilterSidebar = React.memo(
  ({
    categories,
    selectedCategory,
    handleCategoryChange,
    priceRange,
    setPriceRange,
    setSelectedCategory,
    showFilters,
    setShowFilters,
  }) => {
    return (
      <>
        {/* Mobile overlay */}
        {showFilters && (
          <div
            style={
              {
                // position: "fixed",
                // top: 0,
                // left: 0,
                // right: 0,
                // bottom: 0,
                // // backgroundColor: "rgba(0,0,0,0.5)",
                // zIndex: 999,
              }
            }
            // className="mobile-overlay"
            onClick={() => setShowFilters(false)}
          />
        )}
        <div
          style={{
            ...sidebarStyle,
            position: "relative",
            zIndex: 1000,
          }}
          className={`filter-sidebar ${showFilters ? "active" : ""}`}
        >
          {/* Close button for mobile */}
          <button
            style={{
              display: "none",
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
              zIndex: 10,
            }}
            className="filter-close-btn"
            onClick={() => setShowFilters(false)}
          >
            <X size={24} />
          </button>

          <h5
            style={{
              marginBottom: "1.5rem",
              color: "#2c3e50",
              fontWeight: "600",
            }}
          >
            Filters
          </h5>

          {/* Categories */}
          <div
            style={{
              marginBottom: "24px",
              paddingBottom: "20px",
              borderBottom: "1px solid #e9ecef",
            }}
          >
            <h6
              style={{
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#2c3e50",
              }}
            >
              Categories ({categories.length})
            </h6>
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              style={selectStyle}
              onFocus={(e) => (e.target.style.borderColor = "#2d8659")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            >
              <option value="">All Categories</option>
              {categories.length === 0 ? (
                <option disabled>Loading categories...</option>
              ) : (
                categories.map((category) => {
                  const categoryId = category.id || category.category_id;
                  const categoryName =
                    category.name || category.category_name || category.title;
                  const productCount = category.product_count || category.count;

                  return (
                    <option key={`category-${categoryId}`} value={categoryId}>
                      {categoryName}
                      {productCount && ` (${productCount})`}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Price Range */}
          <div
            style={{
              marginBottom: "24px",
              paddingBottom: "20px",
              borderBottom: "1px solid #e9ecef",
            }}
          >
            <h6
              style={{
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#2c3e50",
              }}
            >
              Price Range
            </h6>
            <div style={{ margin: "15px 0" }}>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: "0.5rem",
                    display: "block",
                    color: "black",
                  }}
                >
                  Min Price: ₹{priceRange.min}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange((prev) => ({
                      ...prev,
                      min: parseInt(e.target.value),
                    }))
                  }
                  style={{
                    width: "100%",
                    height: "6px",
                    borderRadius: "3px",
                    background: "#e9ecef",
                    outline: "none",
                    accentColor: "#2d8659",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: "0.5rem",
                    display: "block",
                    color: "black",
                  }}
                >
                  Max Price: ₹{priceRange.max}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange((prev) => ({
                      ...prev,
                      max: parseInt(e.target.value),
                    }))
                  }
                  style={{
                    width: "100%",
                    height: "6px",
                    borderRadius: "3px",
                    background: "#e9ecef",
                    outline: "none",
                    accentColor: "#2d8659",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <button
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "transparent",
              border: "1px solid #2d8659",
              color: "#2d8659",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onClick={() => {
              setSelectedCategory("");
              setPriceRange({ min: 0, max: 100000 });
            }}
          >
            Clear All Filters
          </button>
        </div>
      </>
    );
  }
);
// REPLACE the existing ProductCard component with this simplified version
const ProductCard = React.memo(({ product, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);

  // Get unique attributes from all variants for general product display
  const getAllAttributes = () => {
    const attributeMap = new Map();
    product.variants.forEach((variant) => {
      variant.attributes?.forEach((attr) => {
        const key = `${attr.attribute_name}-${attr.value_name}`;
        if (!attributeMap.has(key)) {
          attributeMap.set(key, {
            attribute_name: attr.attribute_name,
            value_name: attr.value_name,
            attribute_id: attr.attribute_id,
            value_id: attr.value_id,
          });
        }
      });
    });
    return Array.from(attributeMap.values());
  };

  const allAttributes = getAllAttributes();

  return (
    <div
      style={{
        ...cardStyle,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Product Image */}
      <div style={{ position: "relative" }}>
        <img
          src={
            product.variants &&
            product.variants.length > 0 &&
            product.variants[0].primary_image
              ? product.variants[0].primary_image
              : `https://via.placeholder.com/300x200/2d8659/ffffff?text=${encodeURIComponent(
                  product.name
                )}`
          }
          alt={product.name}
          style={{
            height: "288px",
            objectFit: "cover",
            borderRadius: "12px 12px 0 0",
            width: "100%",
          }}
        />
      </div>

      {/* Product Info */}
      <div
        style={{
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        {/* Product Name */}
        <h6
          style={{
            marginBottom: "0.5rem",
            fontWeight: "600",
            fontSize: "1rem",
          }}
        >
          {product.name}
        </h6>

        {/* Category */}
        {product.category_name && (
          <p
            style={{
              color: "#6c757d",
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            {product.category_name}
          </p>
        )}

        {/* Available Options as Hashtags */}
        {allAttributes.length > 0 && (
          <div style={{ marginBottom: "0.75rem" }}>
            <label
              style={{
                fontSize: "0.8rem",
                fontWeight: "600",
                display: "block",
                marginBottom: "0.3rem",
                color: "#6c757d",
              }}
            >
              Available Options:
            </label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.25rem",
                maxHeight: expanded ? "none" : "50px",
                overflow: "hidden",
              }}
            >
              {allAttributes.map((attr, index) => (
                <span
                  key={`${attr.attribute_id}-${attr.value_id}-${index}`}
                  style={{
                    backgroundColor: "#e8f5e8",
                    color: "#2d8659",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    border: "1px solid #c3e6cb",
                    whiteSpace: "nowrap",
                  }}
                  title={`${attr.attribute_name}: ${attr.value_name}`}
                >
                  #{attr.value_name}
                </span>
              ))}
            </div>
            {allAttributes.length > 5 && (
              <button
                style={{
                  marginTop: "0.25rem",
                  background: "none",
                  border: "none",
                  color: "#2d8659",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  padding: 0,
                }}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show Less" : `+${allAttributes.length - 5} more`}
              </button>
            )}
          </div>
        )}

        {/* Description */}
        <div
          style={{
            flexGrow: 1,
            marginBottom: "1rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <label
            style={{
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "block",
              marginBottom: "0.3rem",
            }}
          >
            Description:
          </label>

          <div
            style={{
              fontSize: "0.9rem",
              color: "#6c757d",
              lineHeight: "1.3",
              maxHeight: expanded ? "none" : "60px",
              overflowY: expanded ? "auto" : "hidden",
            }}
          >
            {product.description ||
              product.short_description ||
              product.details ||
              "No description available"}
          </div>

          {(product.description ||
            product.short_description ||
            product.details) && (
            <button
              style={{
                marginTop: "0.3rem",
                background: "none",
                border: "none",
                color: "#2d8659",
                fontSize: "0.8rem",
                cursor: "pointer",
                padding: 0,
                alignSelf: "flex-start",
              }}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show Less" : "Show More"}
            </button>
          )}
        </div>

        {/* View Details Button */}
        <button
          style={{
            ...buttonStyle,
            width: "100%",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            marginTop: "auto",
          }}
          onClick={() => onViewDetails(product)}
        >
          <ShoppingCart size={16} />
          Add to cart
        </button>
      </div>
    </div>
  );
});
const ProductDetailModal = React.memo(
  ({ product, isOpen, onClose, addToCart, imageData }) => {
    const [selectedVariant, setSelectedVariant] = useState(
      product?.variants && product.variants.length > 0
        ? product.variants[0]
        : null
    );
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [allImages, setAllImages] = useState([]);

    const debouncedAddToCart = useMemo(
      () =>
        debounce((product, variant, qty) => {
          addToCart(product, variant, qty);
          setIsAdding(false);
        }, 300),
      [addToCart]
    );

    useEffect(() => {
      return () => {
        debouncedAddToCart.cancel();
      };
    }, [debouncedAddToCart]);

    useEffect(() => {
      if (product?.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
        updateAllImages(product.variants[0]);
      }
      setQuantity(1);
      setSelectedImageIndex(0);
    }, [product]);

    // Update images when variant changes
    useEffect(() => {
      if (selectedVariant) {
        updateAllImages(selectedVariant);
        setSelectedImageIndex(0);
      }
    }, [selectedVariant]);
  const updateAllImages = (variant) => {
    console.log("=== IMAGE DEBUG ===");
    console.log("Selected Product:", product);
    console.log("Selected Variant:", variant);
    console.log("Primary Image:", variant?.primary_image);
    console.log("Secondary Images:", variant?.secondary_images);
    console.log("ImageData State:", imageData);

    const images = [];

    if (variant?.primary_image) {
      images.push(variant.primary_image);
    }

    // FIRST: Try to get from imageData state (loaded from API)
    const storedImages = imageData?.variantImages?.[variant?.id];
    if (storedImages && storedImages.length > 0) {
      // Filter out primary image to avoid duplicates
      const secondaryOnly = storedImages.filter(
        (img) => img !== variant?.primary_image
      );
      images.push(...secondaryOnly);
      console.log("Using stored images from imageData:", storedImages);
    }
    // SECOND: Fall back to variant.secondary_images
    else if (
      Array.isArray(variant?.secondary_images) &&
      variant.secondary_images.length > 0
    ) {
      images.push(...variant.secondary_images);
      console.log(
        "Using secondary_images from variant:",
        variant.secondary_images
      );
    } else if (variant?.secondary_image) {
      images.push(variant.secondary_image);
      console.log("Using single secondary_image:", variant.secondary_image);
    }

    if (images.length === 0) {
      images.push(
        `https://via.placeholder.com/500x400/2d8659/ffffff?text=${encodeURIComponent(
          product.name
        )}`
      );
    }

    console.log("Final All Images Array:", images);
    setAllImages(images);
  };

    const handleAddToCart = useCallback(() => {
      if (isAdding) return;
      if (!product || product.variants.length === 0) {
        alert(
          "This product requires a custom quote. Please contact us for pricing."
        );
        return;
      }
      if (!selectedVariant) return;

      setIsAdding(true);
      debouncedAddToCart(product, selectedVariant, quantity);

      setTimeout(() => {
        setIsAdding(false);
      }, 1000);
    }, [product, selectedVariant, quantity, isAdding, debouncedAddToCart]);

    if (!isOpen || !product) return null;

    return (
      <>
        <div style={modalStyle} onClick={onClose}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "1200px",
              width: "100%",
              maxHeight: "100vh",
              display: "flex",
              flexDirection: window.innerWidth <= 768 ? "column" : "row",
            }}
            className="product-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Panel - Images */}
            <div
              style={{
                width: "50%",
                padding: "1.5rem",
                borderRight: "1px solid #e9ecef",
              }}
              className="product-detail-images"
            >
              {/* Main Image with Preview Button */}
              <div style={{ marginBottom: "1rem", position: "relative" }}>
                <img
                  src={allImages[selectedImageIndex]}
                  alt={`${product.name} - View ${selectedImageIndex + 1}`}
                  style={{
                    width: "100%",
                    height: "615px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #e9ecef",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowImagePreview(true)}
                />
                {/* View Full Screen Button - Always show for better UX */}
                <button
                  style={{
                    position: "absolute",
                    bottom: "1rem",
                    right: "1rem",
                    backgroundColor: "rgba(45,134,89,0.95)",
                    borderColor: "#2d8659",
                    color: "white",
                    borderRadius: "8px",
                    transition: "all 0.2s ease",
                    border: "1px solid #2d8659",
                    padding: "0.75rem 1.25rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                    backdropFilter: "blur(4px)",
                    zIndex: 10,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowImagePreview(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#2d8659";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(45,134,89,0.95)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <Search size={18} />
                  {allImages.length > 1
                    ? `View All (${allImages.length})`
                    : "View Full Screen"}
                </button>
              </div>

              {/* Image Thumbnails */}
              {allImages.length > 1 && (
                <div
                  style={{ display: "flex", gap: "0.5rem", overflow: "auto" }}
                >
                  {allImages.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        border:
                          selectedImageIndex === index
                            ? "2px solid #2d8659"
                            : "1px solid #e9ecef",
                        cursor: "pointer",
                        flexShrink: 0,
                        opacity: selectedImageIndex === index ? 1 : 0.7,
                        transition: "all 0.2s",
                      }}
                      onClick={() => setSelectedImageIndex(index)}
                      onMouseEnter={(e) => (e.target.style.opacity = 1)}
                      onMouseLeave={(e) =>
                        (e.target.style.opacity =
                          selectedImageIndex === index ? 1 : 0.7)
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel - Details */}
            <div
              style={{ width: "50%", display: "flex", flexDirection: "column" }}
              className="RPDetails"
            >
              {/* Header */}
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: "1px solid #e9ecef",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h4 style={{ margin: 0, color: "#2c3e50" }}>{product.name}</h4>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "#6c757d",
                  }}
                  onClick={onClose}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: "1.5rem", overflow: "auto", flex: 1 }}>
                {/* Category */}
                {product.category_name && (
                  <p
                    style={{
                      color: "#6c757d",
                      fontSize: "0.9rem",
                      marginBottom: "1rem",
                    }}
                  >
                    Category: {product.category_name}
                  </p>
                )}

                {/* Description */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h6 style={{ marginBottom: "0.5rem", color: "#2c3e50" }}>
                    Description
                  </h6>
                  <p style={{ color: "#6c757d", lineHeight: "1.5", margin: 0 }}>
                    {product.description ||
                      product.short_description ||
                      product.details ||
                      "No description available"}
                  </p>
                </div>

                {/* Variant Selection */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h6 style={{ marginBottom: "0.5rem", color: "#2c3e50" }}>
                    Select Variant ({product.variants.length} available)
                  </h6>
                  {product.variants.length === 0 ? (
                    <p style={{ color: "#dc3545", fontStyle: "italic" }}>
                      No variants available - Contact us for custom quote
                    </p>
                  ) : (
                    <select
                      style={{
                        ...selectStyle,
                        borderColor: "#2d8659",
                      }}
                      value={selectedVariant?.id || ""}
                      onChange={(e) => {
                        const variant = product.variants.find(
                          (v) => v.id === parseInt(e.target.value)
                        );
                        setSelectedVariant(variant);
                      }}
                    >
                      {product.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.name} - ₹
                          {parseFloat(variant.price).toFixed(2)}
                          {variant.quantity && ` (Stock: ${variant.quantity})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Selected Variant Details */}
                {selectedVariant && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h6 style={{ marginBottom: "0.5rem", color: "#2c3e50" }}>
                      Selected Variant Details
                    </h6>
                    <div
                      style={{
                        backgroundColor: "#f8f9fa",
                        padding: "1rem",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "0.5rem",
                          marginBottom: "1rem",
                        }}
                      >
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>
                          <strong>Name:</strong> {selectedVariant.name}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>
                          <strong>Code:</strong> {selectedVariant.code}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>
                          <strong>Price:</strong>{" "}
                          <span style={{ color: "#2d8659", fontWeight: "600" }}>
                            ₹{parseFloat(selectedVariant.price).toFixed(2)}
                          </span>
                        </p>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>
                          <strong>Stock:</strong>{" "}
                          {selectedVariant.quantity || "N/A"}
                        </p>
                      </div>

                      {/* Variant Attributes */}
                      {selectedVariant.attributes &&
                        selectedVariant.attributes.length > 0 && (
                          <div>
                            <h6
                              style={{
                                margin: "0 0 0.5rem 0",
                                fontSize: "0.85rem",
                                color: "#2c3e50",
                              }}
                            >
                              Attributes:
                            </h6>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.25rem",
                              }}
                            >
                              {selectedVariant.attributes.map((attr, index) => (
                                <span
                                  key={`modal-${selectedVariant.id}-${attr.attribute_id}-${attr.value_id}-${index}`}
                                  style={{
                                    backgroundColor: "#2d8659",
                                    color: "white",
                                    padding: "0.2rem 0.5rem",
                                    borderRadius: "12px",
                                    fontSize: "0.75rem",
                                    fontWeight: "500",
                                  }}
                                  title={`${attr.attribute_name}: ${attr.value_name}`}
                                >
                                  {attr.attribute_name}: {attr.value_name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Variant Description */}
                      {selectedVariant.description && (
                        <div style={{ marginTop: "1rem" }}>
                          <h6
                            style={{
                              margin: "0 0 0.5rem 0",
                              fontSize: "0.85rem",
                              color: "#2c3e50",
                            }}
                          >
                            Variant Description:
                          </h6>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.85rem",
                              color: "#6c757d",
                            }}
                          >
                            {selectedVariant.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Add to Cart */}
              {product.variants.length > 0 &&
                selectedVariant &&
                parseInt(selectedVariant.quantity) > 0 && (
                  <div
                    style={{
                      padding: "1.5rem",
                      borderTop: "1px solid #e9ecef",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            display: "block",
                            marginBottom: "0.3rem",
                          }}
                        >
                          Quantity:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={parseInt(selectedVariant.quantity)}
                          value={quantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string while typing
                            if (value === "") {
                              setQuantity("");
                            } else {
                              const numValue = parseInt(value);
                              // Only set if it's a valid number >= 1
                              if (!isNaN(numValue) && numValue >= 1) {
                                setQuantity(numValue);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            // When user leaves the field, ensure it has a valid value
                            const value = e.target.value;
                            if (
                              value === "" ||
                              isNaN(parseInt(value)) ||
                              parseInt(value) < 1
                            ) {
                              setQuantity(1);
                            }
                          }}
                          style={{
                            width: "80px",
                            padding: "0.5rem",
                            border: "1px solid #2d8659",
                            borderRadius: "6px",
                            fontSize: "0.9rem",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            display: "block",
                            marginBottom: "0.3rem",
                          }}
                        >
                          Total:
                        </label>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "1.2rem",
                            fontWeight: "600",
                            color: "#2d8659",
                          }}
                        >
                          ₹
                          {(
                            parseFloat(selectedVariant.price) * quantity
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <button
                      style={{
                        ...buttonStyle,
                        width: "100%",
                        padding: "1rem",
                        fontSize: "1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        opacity: isAdding ? 0.6 : 1,
                        cursor: isAdding ? "not-allowed" : "pointer",
                        backgroundColor: isAdding ? "#28a745" : "#2d8659",
                      }}
                      onClick={handleAddToCart}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <>
                          <Check size={16} />
                          Added to Cart!
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={16} />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Image Preview Modal */}
        <ImagePreviewModal
          images={allImages}
          isOpen={showImagePreview}
          onClose={() => setShowImagePreview(false)}
          initialIndex={selectedImageIndex}
        />
      </>
    );
  }
);
// Pagination component - MOVED OUTSIDE
const Pagination = React.memo(({ currentPage, totalPages, setCurrentPage }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.5rem",
        marginTop: "2rem",
        padding: "1rem",
      }}
    >
      <button
        style={{
          ...buttonStyle,
          backgroundColor: currentPage === 1 ? "#e9ecef" : "#2d8659",
          color: currentPage === 1 ? "#6c757d" : "white",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      <div style={{ display: "flex", gap: "0.25rem" }}>
        {getPageNumbers().map((page) => (
          <button
            key={page}
            style={{
              ...buttonStyle,
              backgroundColor: page === currentPage ? "#2d8659" : "transparent",
              color: page === currentPage ? "white" : "#2d8659",
              border: "1px solid #2d8659",
              minWidth: "40px",
              height: "40px",
            }}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        style={{
          ...buttonStyle,
          backgroundColor: currentPage === totalPages ? "#e9ecef" : "#2d8659",
          color: currentPage === totalPages ? "#6c757d" : "white",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
});

// Cart Modal Component - MOVED OUTSIDE
const CartModal = React.memo(
  ({
    cart,
    setShowCheckout,
    updateCartQuantity,
    removeFromCart,
    customerData,
    handleCustomerDataChange,
    submitOrder,
    orderLoading,
  }) => {
    const cartItems = useMemo(() => {
      return cart.map((item, index) => (
        <div
          key={`${item.productId}-${item.variantId}-${index}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1rem",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
            marginBottom: "0.5rem",
          }}
        >
          <img
            src={item.image}
            alt={item.productName}
            style={{
              width: "60px",
              height: "60px",
              objectFit: "cover",
              borderRadius: "6px",
            }}
          />
          <div style={{ flex: 1 }}>
            <h6 style={{ margin: 0, fontSize: "0.9rem" }}>
              {item.productName}
            </h6>
            <p style={{ margin: 0, color: "#6c757d", fontSize: "0.8rem" }}>
              {item.variantName} • SKU: {item.sku}
            </p>
            <p style={{ margin: 0, fontWeight: "600", color: "#2d8659" }}>
              ₹{parseFloat(item.price).toFixed(2)}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) =>
                updateCartQuantity(index, parseInt(e.target.value) || 1)
              }
              style={{
                width: "60px",
                padding: "0.25rem",
                border: "1px solid #e9ecef",
                borderRadius: "4px",
                textAlign: "center",
              }}
            />
            <button
              onClick={() => removeFromCart(index)}
              style={{
                background: "none",
                border: "none",
                color: "#dc3545",
                cursor: "pointer",
                padding: "0.25rem",
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ));
    }, [cart, updateCartQuantity, removeFromCart]);

    return (
      <div style={modalStyle} onClick={() => setShowCheckout(false)}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            maxWidth: "800px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "1.5rem",
              borderBottom: "1px solid #e9ecef",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h5 style={{ margin: 0 }}>Shopping Cart</h5>
            <button
              style={{
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#6c757d",
              }}
              onClick={() => setShowCheckout(false)}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ padding: "1.5rem" }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <ShoppingCart
                  size={48}
                  style={{ color: "#cbd5e1", marginBottom: "1rem" }}
                />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "2rem" }}>{cartItems}</div>

                <div
                  style={{
                    borderTop: "1px solid #e9ecef",
                    paddingTop: "1rem",
                    marginBottom: "2rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "1.2rem",
                      fontWeight: "600",
                    }}
                  >
                    <span>Total:</span>
                    <span style={{ color: "#2d8659" }}>
                      ₹
                      {cart
                        .reduce(
                          (sum, item) =>
                            sum + parseFloat(item.price) * item.quantity,
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    padding: "1.5rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <h6 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
                    Customer Information
                  </h6>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                        }}
                      >
                        <User
                          size={16}
                          style={{ display: "inline", marginRight: "0.5rem" }}
                        />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={customerData.name}
                        onChange={(e) =>
                          handleCustomerDataChange("name", e.target.value)
                        }
                        placeholder="Enter your full name"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #e9ecef",
                          borderRadius: "6px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                        }}
                      >
                        <Mail
                          size={16}
                          style={{ display: "inline", marginRight: "0.5rem" }}
                        />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={customerData.email}
                        onChange={(e) =>
                          handleCustomerDataChange("email", e.target.value)
                        }
                        placeholder="Enter your email address"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #e9ecef",
                          borderRadius: "6px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                        }}
                      >
                        <Phone
                          size={16}
                          style={{ display: "inline", marginRight: "0.5rem" }}
                        />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={customerData.phone}
                        onChange={(e) =>
                          handleCustomerDataChange("phone", e.target.value)
                        }
                        placeholder="Enter your phone number"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #e9ecef",
                          borderRadius: "6px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  style={{
                    ...buttonStyle,
                    width: "100%",
                    padding: "1rem",
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    opacity: orderLoading ? 0.6 : 1,
                  }}
                  onClick={submitOrder}
                  disabled={
                    orderLoading || (!customerData.email && !customerData.phone)
                  }
                >
                  {orderLoading ? (
                    <>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid transparent",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Submit Order Request
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);
// Fixed Image Preview Modal Component
const ImagePreviewModal = ({ images, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, images, onClose]);

  if (!isOpen || !images || images.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div 
      style={{
        ...modalStyle,
        backgroundColor: "rgba(0,0,0,0.9)",
        zIndex: 2000,
      }} 
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "90vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          style={{
            position: "absolute",
            top: "-40px",
            right: "0",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "white",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onClick={onClose}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
        >
          <X size={24} />
        </button>

        {/* Image Counter */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            color: "white",
            fontSize: "1rem",
            fontWeight: "500",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: "0.5rem 1rem",
            borderRadius: "20px",
          }}
        >
          {currentIndex + 1} / {images.length}
        </div>

        {/* Main Image */}
        <img
          src={images[currentIndex]}
          alt={`Preview ${currentIndex + 1}`}
          style={{
            maxWidth: "100%",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: "8px",
          }}
        />

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(45,134,89,0.9)",
                border: "none",
                color: "white",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onClick={handlePrevious}
              onMouseEnter={(e) => e.currentTarget.style.background = "#2d8659"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(45,134,89,0.9)"}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(45,134,89,0.9)",
                border: "none",
                color: "white",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onClick={handleNext}
              onMouseEnter={(e) => e.currentTarget.style.background = "#2d8659"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(45,134,89,0.9)"}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: "8px",
              maxWidth: "90vw",
            }}
          >
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Thumbnail ${index + 1}`}
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  border: currentIndex === index ? "3px solid #2d8659" : "2px solid transparent",
                  cursor: "pointer",
                  flexShrink: 0,
                  opacity: currentIndex === index ? 1 : 0.6,
                  transition: "all 0.2s",
                }}
                onClick={() => setCurrentIndex(index)}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = currentIndex === index ? 1 : 0.6}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
// MAIN COMPONENT - ClientProducts
const ClientProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  // Product Detail Modal States - ADD THESE
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsPerPage] = useState(12);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [selectedStatus, setSelectedStatus] = useState("");

  // Cart and Session Management
  const [cart, setCart] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [clientIP, setClientIP] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [previousOrders, setPreviousOrders] = useState([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  // Image data state for variants
  const [imageData, setImageData] = useState({
    productImages: {},
    variantImages: {},
  });

  // Wishlist
  const [wishlist, setWishlist] = useState(new Set());
  // Load variant images
  const loadVariantImages = useCallback(async (variantId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_BASE}/variants/${variantId}`, {
        headers
      });

      const images = response.data.variant?.images || [];
      return images;
    } catch (error) {
      console.error(`Error loading images for variant ${variantId}:`, error);
      return [];
    }
  }, []);

  // Batch load all variant images
  const loadAllVariantImages = useCallback(
    async (products) => {
      try {
        const variantImagePromises = [];
        
        products.forEach((product) => {
          if (product.variants && product.variants.length > 0) {
            product.variants.forEach((variant) => {
              variantImagePromises.push(
                loadVariantImages(variant.id).then((images) => ({
                  variantId: variant.id,
                  images,
                }))
              );
            });
          }
        });

        const variantImageResults = await Promise.all(variantImagePromises);

        // Batch update state with all variant images
        const variantImageMap = {};
        variantImageResults.forEach(({ variantId, images }) => {
          if (images.length > 0) {
            variantImageMap[variantId] = images;
          }
        });

        setImageData((prev) => ({
          ...prev,
          variantImages: variantImageMap,
        }));
      } catch (error) {
        console.error("Error loading variant images:", error);
      }
    },
    [loadVariantImages]
  );
  const fetchProducts = useCallback(
    async (page = 1, search = "", category = "", status = "") => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: productsPerPage.toString(),
        });

        if (search) params.append("search", search);
        if (category) params.append("category", category);
        if (status) params.append("status", status);

        const res = await axios.get(`${API_BASE}/products?${params}`);
        const {
          products: productsData,
          total,
          page: currentPageRes,
        } = res.data;

        // Fetch variants (and images + attributes) for each product
        const productsWithVariants = await Promise.all(
          productsData.map(async (product) => {
            try {
              const variantsRes = await axios.get(
                `${API_BASE}/products/${product.id}/variants`
              );
              const variants = variantsRes.data.variants || [];

              // Skip products with no variants
              if (variants.length === 0) return null;

              // Fetch attributes for each variant
              const variantsWithAttributes = await Promise.all(
                variants.map(async (variant) => {
                  try {
                    const attributesRes = await axios.get(
                      `${API_BASE}/variants/${variant.id}/attributes`
                    );

                    // 🔹 Ensure secondary_images always exists as an array
                    const secondaryImages = Array.isArray(
                      variant.secondary_images
                    )
                      ? variant.secondary_images
                      : variant.secondary_images
                      ? [variant.secondary_images]
                      : [];

                    return {
                      ...variant,
                      attributes: attributesRes.data.attributes || [],
                      secondary_images: secondaryImages,
                    };
                  } catch (error) {
                    console.error(
                      `Error fetching attributes for variant ${variant.id}:`,
                      error
                    );
                    return {
                      ...variant,
                      attributes: [],
                      secondary_images: variant.secondary_images || [],
                    };
                  }
                })
              );

              return { ...product, variants: variantsWithAttributes };
            } catch (error) {
              console.error(
                `Error fetching variants for product ${product.id}:`,
                error
              );
              return null;
            }
          })
        );

        // Filter out null entries
        const filteredProducts = productsWithVariants.filter(
          (product) => product !== null
        );

        setProducts(filteredProducts);

        // Load variant images after setting products
        await loadAllVariantImages(filteredProducts);
        // Pagination metadata
        setTotalProducts(total || filteredProducts.length);
        setTotalPages(
          Math.ceil((total || filteredProducts.length) / productsPerPage)
        );
        setCurrentPage(currentPageRes || page);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [productsPerPage, loadAllVariantImages]
  );

  // Stable debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((searchValue, category, status, fetchFn) => {
        setCurrentPage(1);
        fetchFn(1, searchValue, category, status);
      }, 300),
    []
  );

  // Stable debounced customer save
  const debouncedCustomerSave = useMemo(
    () =>
      debounce((newCustomerData, currentCart, sessionId, clientIP) => {
        const customerJson = encodeURIComponent(
          JSON.stringify(newCustomerData)
        );
        CookieManager.setCookie("greenland_customer", customerJson);
        if (sessionId) {
          saveCartToServerSync(
            currentCart,
            newCustomerData,
            sessionId,
            clientIP
          );
        }
      }, 500),
    []
  );

  // Synchronous cart save helper
  const saveCartToServerSync = async (
    cartData,
    customerInfo,
    sessionId,
    clientIP
  ) => {
    try {
      const payload = {
        session_id: sessionId,
        cart: cartData,
        ip_address: clientIP,
        customer: customerInfo,
        timestamp: new Date().toISOString(),
      };

      await axios.post(`${API_BASE}/cart/save`, payload);

      if (cartData.length > 0) {
        const cartJson = encodeURIComponent(JSON.stringify(cartData));
        CookieManager.setCookie("greenland_cart", cartJson);
      }
    } catch (error) {
      console.error("Error saving cart to server:", error);
      if (cartData.length > 0) {
        const cartJson = encodeURIComponent(JSON.stringify(cartData));
        CookieManager.setCookie("greenland_cart", cartJson);
      }
    }
  };
  // Handle product detail modal - ADD THESE
  const handleViewDetails = useCallback((product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  }, []);

  const handleCloseProductDetail = useCallback(() => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  }, []);
  // Stable event handlers
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      debouncedSearch(value, selectedCategory, selectedStatus, fetchProducts);
    },
    [debouncedSearch, selectedCategory, selectedStatus, fetchProducts]
  );

  const handleCategoryChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSelectedCategory(value);
      setCurrentPage(1);
      fetchProducts(1, searchTerm, value, selectedStatus);
    },
    [fetchProducts, searchTerm, selectedStatus]
  );

  const handleCustomerDataChange = useCallback(
    (field, value) => {
      setCustomerData((prev) => {
        const newCustomerData = { ...prev, [field]: value };
        debouncedCustomerSave(newCustomerData, cart, sessionId, clientIP);
        return newCustomerData;
      });
    },
    [debouncedCustomerSave, cart, sessionId, clientIP]
  );

  // Save cart to server and cookies
  const saveCartToServer = useCallback(
    async (cartData, customerInfo = null) => {
      if (!sessionId) return;

      try {
        const payload = {
          session_id: sessionId,
          cart: cartData,
          ip_address: clientIP,
          customer: customerInfo || customerData,
          timestamp: new Date().toISOString(),
        };

        await axios.post(`${API_BASE}/cart/save`, payload);

        if (cartData.length > 0) {
          const cartJson = encodeURIComponent(JSON.stringify(cartData));
          CookieManager.setCookie("greenland_cart", cartJson);
        }
      } catch (error) {
        console.error("Error saving cart to server:", error);
        if (cartData.length > 0) {
          const cartJson = encodeURIComponent(JSON.stringify(cartData));
          CookieManager.setCookie("greenland_cart", cartJson);
        }
      }
    },
    [sessionId, clientIP, customerData]
  );

  // Load previous orders
  const loadPreviousOrders = useCallback(async (email, phone) => {
    if (!email && !phone) return;

    try {
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (phone) params.append("phone", phone);

      const response = await axios.get(`${API_BASE}/orders/customer?${params}`);
      setPreviousOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error loading previous orders:", error);
      setPreviousOrders([]);
    }
  }, []);
  // Initialize session and load cart from cookies
  const initializeSession = useCallback(async () => {
    let existingSessionId = CookieManager.getCookie("greenland_session");

    if (!existingSessionId) {
      existingSessionId = CookieManager.generateSessionId();
      CookieManager.setCookie("greenland_session", existingSessionId);
    }

    setSessionId(existingSessionId);

    const ip = await CookieManager.getClientIP();
    setClientIP(ip);

    // Load saved customer data from cookies
    const savedCustomer = CookieManager.getCookie("greenland_customer");
    if (savedCustomer) {
      try {
        const customerData = JSON.parse(decodeURIComponent(savedCustomer));
        setCustomerData(customerData);

        // Load previous orders if email is available
        if (customerData.email) {
          loadPreviousOrders(customerData.email, customerData.phone || "");
        }
      } catch (error) {
        console.error("Error parsing customer cookie:", error);
      }
    } else {
      // Fallback: check for separate email cookie
      const savedEmail = CookieManager.getCookie("greenland_customer_email");
      if (savedEmail) {
        loadPreviousOrders(savedEmail, "");
      }
    }

    try {
      const response = await axios.get(`${API_BASE}/cart/${existingSessionId}`);
      if (response.data.cart) {
        setCart(response.data.cart);
      }
      if (response.data.customer) {
        setCustomerData((prevData) => ({
          ...prevData,
          ...response.data.customer,
        }));
      }
    } catch (error) {
      console.error("Error loading cart from server:", error);
      const savedCart = CookieManager.getCookie("greenland_cart");
      if (savedCart) {
        try {
          const cartData = JSON.parse(decodeURIComponent(savedCart));
          setCart(cartData);
        } catch (error) {
          console.error("Error parsing cart cookie:", error);
        }
      }
    }
  }, [loadPreviousOrders]);
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      console.log("Raw categories response:", res.data);

      // Since your backend returns a tree structure directly, we need to flatten it
      const flattenCategories = (categories, level = 0) => {
        let flattened = [];
        categories.forEach((category) => {
          // Add prefix for subcategories to show hierarchy
          const displayName =
            level > 0
              ? `${"└─".repeat(level)} ${category.name}`
              : category.name;

          flattened.push({
            id: category.id,
            name: displayName,
            original_name: category.name,
            code: category.code,
            parent_id: category.parent_id,
            level: level,
          });

          // If this category has children, recursively add them
          if (category.children && category.children.length > 0) {
            flattened = flattened.concat(
              flattenCategories(category.children, level + 1)
            );
          }
        });
        return flattened;
      };

      const flattenedCategories = flattenCategories(res.data);
      console.log("Flattened categories:", flattenedCategories);
      setCategories(flattenedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  }, []);

  // Initialize on component mount
  useEffect(() => {
    initializeSession();
    fetchCategories();
    // fetchProducts(1);
  }, [initializeSession, fetchCategories, fetchProducts]);

  // Page change effect
  useEffect(() => {
    fetchProducts(currentPage, searchTerm, selectedCategory, selectedStatus);
  }, [
    currentPage,
    fetchProducts,
    searchTerm,
    selectedCategory,
    selectedStatus,
  ]);

  // Debounced cart save
  useEffect(() => {
    if (cart.length === 0) return;

    const timeoutId = setTimeout(() => {
      saveCartToServer(cart);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [cart, saveCartToServer]);

  // Cleanup debounced functions on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      debouncedCustomerSave.cancel();
    };
  }, [debouncedSearch, debouncedCustomerSave]);
  // Load previous orders on component mount if email is saved in cookies
  useEffect(() => {
    const savedEmail = CookieManager.getCookie("greenland_customer_email");
    if (savedEmail) {
      loadPreviousOrders(savedEmail, "");
    }
  }, [loadPreviousOrders]);
  // Sort and filter products
  const sortedAndFilteredProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const aFirstVariant =
          a.variants && a.variants.length > 0 ? a.variants[0] : null;
        const bFirstVariant =
          b.variants && b.variants.length > 0 ? b.variants[0] : null;

        switch (sortBy) {
          case "price-low":
            const aPrice = aFirstVariant
              ? parseFloat(aFirstVariant.price) || 0
              : 0;
            const bPrice = bFirstVariant
              ? parseFloat(bFirstVariant.price) || 0
              : 0;
            return aPrice - bPrice;
          case "price-high":
            const aPrice2 = aFirstVariant
              ? parseFloat(aFirstVariant.price) || 0
              : 0;
            const bPrice2 = bFirstVariant
              ? parseFloat(bFirstVariant.price) || 0
              : 0;
            return bPrice2 - aPrice2;
          case "name":
            return a.name.localeCompare(b.name);
          case "newest":
          default:
            return new Date(b.created_at) - new Date(a.created_at);
        }
      })
      .filter((product) => {
        if (product.variants && product.variants.length > 0) {
          const firstVariant = product.variants[0];
          const price = parseFloat(firstVariant.price) || 0;
          const minPrice = parseFloat(priceRange.min) || 0;
          const maxPrice = parseFloat(priceRange.max) || Infinity;
          return price >= minPrice && price <= maxPrice;
        }
        return true;
      });
  }, [products, sortBy, priceRange]);

  // Add to cart function
  // REPLACE your existing addToCart function with this improved version:

  const addToCart = useCallback((product, selectedVariant, quantity) => {
    console.log("=== ADD TO CART DEBUG ===");
    console.log("Product:", product);
    console.log("Selected Variant:", selectedVariant);
    console.log("Quantity:", quantity);

    const cartItem = {
      variantId: selectedVariant?.id || null,
      productId: product.id,
      productName: product.name,
      variantName: selectedVariant?.name || "Default",
      variantCode: selectedVariant?.code || "DEFAULT", // Add variant code separately
      price: selectedVariant?.price || 0,
      quantity: quantity,
      image:
        selectedVariant?.primary_image ||
        `https://via.placeholder.com/300x200/2d8659/ffffff?text=${encodeURIComponent(
          product.name
        )}`,
      sku: `${product.sku_prefix || "PROD"}-${
        selectedVariant?.code || "DEFAULT"
      }`,
    };

    console.log("Cart Item being added:", cartItem);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.variantId === cartItem.variantId &&
          item.productId === cartItem.productId
      );

      if (existingIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += quantity;
        console.log("Updated existing cart item:", newCart[existingIndex]);
        return newCart;
      } else {
        console.log("Added new cart item:", cartItem);
        return [...prevCart, cartItem];
      }
    });
  }, []);

  // Remove from cart
  const removeFromCart = useCallback((index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  }, []);

  // Update cart quantity
  const updateCartQuantity = useCallback(
    (index, newQuantity) => {
      if (newQuantity <= 0) {
        removeFromCart(index);
        return;
      }

      setCart((prevCart) => {
        const newCart = [...prevCart];
        newCart[index].quantity = newQuantity;
        return newCart;
      });
    },
    [removeFromCart]
  );

  // Load previous orders when cart modal is opened
  // Load previous orders when customer data changes
  useEffect(() => {
    if (customerData.email || customerData.phone) {
      loadPreviousOrders(customerData.email, customerData.phone);
    }
  }, [customerData.email, customerData.phone, loadPreviousOrders]);
  // Submit order

  // 3. REPLACE YOUR EXISTING submitOrder FUNCTION WITH THIS ONE
  // REPLACE your existing submitOrder function with this fixed version:
  // REPLACE your existing submitOrder function with this fixed version:

  const submitOrder = async () => {
    if (cart.length === 0) return;
    if (!customerData.email && !customerData.phone) {
      alert("Please provide either email or phone number");
      return;
    }

    setOrderLoading(true);
    try {
      // Transform cart items to match backend expectations
      const transformedItems = cart.map((item) => ({
        variant_id: item.variantId,
        product_name: item.productName,
        variant_name: item.variantName,
        variant_code:
          item.variantCode ||
          (item.sku ? item.sku.split("-").pop() : "DEFAULT"), // Use variantCode if available
        quantity: item.quantity,
        price: item.price,
      }));

      console.log("=== CART DEBUG - SUBMIT ORDER ===");
      console.log("Original cart:", cart);
      console.log("Transformed items:", transformedItems);
      console.log("Customer data:", customerData);

      const orderData = {
        customer: customerData,
        items: transformedItems, // Use transformed items instead of raw cart
        session_id: sessionId,
        ip_address: clientIP,
        total_amount: cart.reduce(
          (sum, item) => sum + parseFloat(item.price) * item.quantity,
          0
        ),
      };

      console.log("Final order data being sent:", orderData);

      const response = await axios.post(`${API_BASE}/orders`, orderData);

      console.log("Order response:", response.data);

      if (response.data.success) {
        // Save customer data to cookies after successful order
        const customerJson = encodeURIComponent(JSON.stringify(customerData));
        CookieManager.setCookie("greenland_customer", customerJson);

        // If email is provided, save it separately for easier access
        if (customerData.email) {
          CookieManager.setCookie(
            "greenland_customer_email",
            customerData.email
          );
        }

        // Clear cart and close checkout modal
        setCart([]);
        setShowCheckout(false);
        CookieManager.setCookie("greenland_cart", "", -1);
        loadPreviousOrders(customerData.email, customerData.phone);

        // Show order confirmation modal instead of alert
        setOrderNumber(response.data.order_number);
        setShowOrderConfirmation(true);
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      console.error("Error response:", error.response?.data);
      alert("Error submitting order. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };
  // 2. ADD THIS NEW COMPONENT OUTSIDE YOUR MAIN COMPONENT (alongside other modal components)
  const OrderConfirmationModal = React.memo(
    ({ isOpen, orderNumber, onClose }) => {
      if (!isOpen) return null;

      return (
        <div style={modalStyle} onClick={onClose}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "100%",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                color: "white",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <Check size={32} />
              </div>
              <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>
                Order Placed Successfully!
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Order #{orderNumber}</p>
            </div>

            {/* Content */}
            <div style={{ padding: "2rem" }}>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "1.5rem",
                  color: "#2c3e50",
                }}
              >
                <p style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                  Thank you for your order! We'll reach out to you with the
                  quote shortly.
                </p>
                <p style={{ marginBottom: "0", color: "#6c757d" }}>
                  For further queries, please contact us at:
                </p>
              </div>

              {/* Contact Information */}
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "#2d8659",
                  }}
                >
                  <Phone size={20} />
                  8940160721
                </div>
              </div>

              {/* Close Button */}
              <button
                style={{
                  ...buttonStyle,
                  width: "100%",
                  padding: "1rem",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
                onClick={onClose}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      );
    }
  );

  return (
    <div style={containerStyle}>
      {showOrderHistory && (
        <PreviousOrdersModal
          previousOrders={previousOrders}
          setShowOrderHistory={setShowOrderHistory}
        />
      )}
      {showOrderConfirmation && (
        <OrderConfirmationModal
          isOpen={showOrderConfirmation}
          orderNumber={orderNumber}
          onClose={() => setShowOrderConfirmation(false)}
        />
      )}
      {showProductDetail && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={showProductDetail}
          onClose={handleCloseProductDetail}
          addToCart={addToCart}
          imageData={imageData}
        />
      )}
      <ModernNavbar
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        cart={cart}
        previousOrders={previousOrders}
        setShowOrderHistory={setShowOrderHistory}
        setShowCheckout={setShowCheckout}
      />
      <div
        style={{
          backgroundImage: "linear-gradient(135deg, #2d8659 0%, #4a9b6e 100%)",
          color: "white",
          padding: "60px 0",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "90%", margin: "0 auto", padding: "0 1rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              marginBottom: "1rem",
            }}
          >
            Products
          </h1>
          <p style={{ fontSize: "1.1rem", marginBottom: "0" }}>
            {loading ? "Loading..." : `${totalProducts} products found`}
          </p>
        </div>
      </div>
      <div style={{ maxWidth: "90%", margin: "0 auto", padding: "2rem 1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <button
            style={{
              ...buttonStyle,
              backgroundColor: showFilters ? "#2d8659" : "transparent",
              color: showFilters ? "white" : "#2d8659",
              border: "1px solid #2d8659",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                outline: "none",
              }}
            >
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select> */}

            <div
              style={{
                display: "flex",
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                dispaly:"none"
              }}
            >
              <button
                style={{
                  padding: "0.5rem",
                  border: "none",
                  backgroundColor: viewMode === "grid" ? "#2d8659" : "white",
                  color: viewMode === "grid" ? "white" : "#6c757d",
                  borderRadius: "8px 0 0 8px",
                  cursor: "pointer",
                }}
                onClick={() => setViewMode("grid")}
              >
                <Grid size={16} />
              </button>
              {/* <button
                style={{
                  padding: "0.5rem",
                  border: "none",
                  backgroundColor: viewMode === "list" ? "#2d8659" : "white",
                  color: viewMode === "list" ? "white" : "#6c757d",
                  borderRadius: "0 8px 8px 0",
                  cursor: "pointer",
                }}
                onClick={() => setViewMode("list")}
              >
                <List size={16} />
              </button> */}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {showFilters && (
            <div
              style={{
                width: window.innerWidth <= 768 ? "100%" : "300px",
                flexShrink: 0,
              }}
            >
              <ModernFilterSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                handleCategoryChange={handleCategoryChange}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                setSelectedCategory={setSelectedCategory}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
              />
            </div>
          )}

          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #e9ecef",
                    borderTop: "3px solid #2d8659",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 1rem",
                  }}
                />
                <p>Loading products...</p>
              </div>
            ) : sortedAndFilteredProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <Package
                  size={64}
                  style={{ color: "#cbd5e1", marginBottom: "1rem" }}
                />
                <h3>No products found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      viewMode === "grid"
                        ? "repeat(auto-fill, minmax(min(280px, 100%), 1fr))"
                        : "1fr",
                    gap: "1.5rem",
                  }}
                >
                  {sortedAndFilteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
      {showCheckout && (
        <CartModal
          cart={cart}
          setShowCheckout={setShowCheckout}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
          customerData={customerData}
          handleCustomerDataChange={handleCustomerDataChange}
          submitOrder={submitOrder}
          orderLoading={orderLoading}
        />
      )}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Large Desktop - 1440px and above */
        @media (min-width: 1440px) {
          .filter-sidebar {
            width: 320px !important;
          }
        }

        /* Desktop - 1200px to 1439px */
        @media (max-width: 1439px) and (min-width: 1200px) {
          .filter-sidebar {
            width: 280px !important;
          }
        }

        /* Laptop - 1024px to 1199px */
        @media (max-width: 1199px) and (min-width: 1024px) {
          .filter-sidebar {
            width: 250px !important;
            padding: 18px !important;
          }

          [style*="maxWidth: '1200px'"] {
            max-width: 95% !important;
          }
        }

        /* Tablet Landscape - 900px to 1023px */
        @media (max-width: 1023px) and (min-width: 900px) {
          .filter-sidebar {
            width: 220px !important;
            padding: 16px !important;
          }

          .product-detail-modal {
            max-width: 95vw !important;
          }

          .order-history-modal {
            max-width: 95vw !important;
          }
        }

        /* Tablet Portrait - 768px to 899px */
        @media (max-width: 899px) and (min-width: 768px) {
          .RPDetails {
            width: 100% !important;
          }

          .search-wrapper {
            max-width: 400px !important;
          }

          .nav-btn .btn-text {
            font-size: 0.85rem;
          }

          .filter-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 65% !important;
            max-width: 300px !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 1000 !important;
            overflow-y: auto;
            height: 100vh;
            margin: 0 !important;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3) !important;
          }

          .filter-sidebar.active {
            transform: translateX(0) !important;
          }

          .filter-close-btn {
            display: block !important;
          }

          .product-detail-modal {
            flex-direction: column !important;
            max-width: 90vw !important;
          }

          .product-detail-images {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e9ecef !important;
          }

          [style*="gridTemplateColumns"] {
            grid-template-columns: repeat(
              auto-fill,
              minmax(240px, 1fr)
            ) !important;
          }
        }

        /* Mobile Landscape - 640px to 767px */
        @media (max-width: 767px) and (min-width: 640px) {
          .RPDetails {
            width: 100% !important;
          }

          .search-wrapper {
            order: 3 !important;
            width: 100% !important;
            max-width: 100% !important;
            flex-basis: 100% !important;
          }

          .nav-btn .btn-text {
            display: inline;
            font-size: 0.8rem;
          }

          .filter-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 75% !important;
            max-width: 320px !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 1000 !important;
            overflow-y: auto;
            height: 100vh;
            margin: 0 !important;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3) !important;
          }

          .filter-sidebar.active {
            transform: translateX(0) !important;
          }

          .filter-close-btn {
            display: block !important;
          }

          .product-detail-modal {
            flex-direction: column !important;
            max-width: 95vw !important;
            margin: 0.75rem !important;
          }

          .product-detail-images {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e9ecef !important;
            padding: 1rem !important;
          }

          .product-detail-images > div:first-child img {
            height: auto !important;
            max-height: 375px !important;
          }

          [style*="gridTemplateColumns"] {
            grid-template-columns: repeat(
              auto-fill,
              minmax(220px, 1fr)
            ) !important;
          }

          button {
            min-height: 42px;
          }

          input,
          select,
          textarea {
            min-height: 42px;
            font-size: 15px !important;
          }
        }

        /* Mobile Portrait - 480px to 639px */
        @media (max-width: 639px) and (min-width: 480px) {
          .RPDetails {
            width: 100% !important;
          }

          .search-wrapper {
            order: 3 !important;
            width: 100% !important;
            max-width: 100% !important;
            flex-basis: 100% !important;
          }

          .nav-btn .btn-text {
            display: none;
          }

          .search-btn .btn-text {
            display: inline;
          }

          .filter-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 80% !important;
            max-width: 300px !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 1000 !important;
            overflow-y: auto;
            height: 100vh;
            margin: 0 !important;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3) !important;
          }

          .filter-sidebar.active {
            transform: translateX(0) !important;
          }

          .filter-close-btn {
            display: block !important;
          }

          .product-detail-modal {
            flex-direction: column !important;
            max-height: 95vh !important;
            border-radius: 8px !important;
            margin: 0.5rem !important;
          }

          .product-detail-images {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e9ecef !important;
            max-height: 45vh !important;
            padding: 0.875rem !important;
          }

          .product-detail-images > div:first-child img {
            height: auto !important;
            max-height: 375px !important;
          }

          .order-history-modal {
            flex-direction: column !important;
            max-width: 95vw !important;
            max-height: 95vh !important;
            margin: 0.75rem !important;
          }

          .order-list-panel {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e9ecef !important;
          }

          .order-list-panel > div:last-child {
            max-height: 280px !important;
            overflow-y: auto !important;
          }

          [style*="gridTemplateColumns"] {
            grid-template-columns: repeat(
              auto-fill,
              minmax(200px, 1fr)
            ) !important;
          }

          button {
            min-height: 44px;
            touch-action: manipulation;
          }

          input,
          select,
          textarea {
            min-height: 44px;
            font-size: 16px !important;
            touch-action: manipulation;
          }

          h1 {
            font-size: 2rem !important;
          }

          h4 {
            font-size: 1.3rem !important;
          }

          h6 {
            font-size: 0.95rem !important;
          }
        }

        /* Small Mobile - 400px to 479px */
        @media (max-width: 479px) and (min-width: 400px) {
          .RPDetails {
            width: 100% !important;
          }

          .search-wrapper {
            order: 3 !important;
            width: 100% !important;
            max-width: 100% !important;
            flex-basis: 100% !important;
          }

          .nav-btn .btn-text,
          .search-btn .btn-text {
            display: none;
          }

          .filter-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 85% !important;
            max-width: 280px !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 1000 !important;
            overflow-y: auto;
            height: 100vh;
            margin: 0 !important;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3) !important;
            padding: 16px !important;
          }

          .filter-sidebar.active {
            transform: translateX(0) !important;
          }

          .filter-close-btn {
            display: block !important;
          }

          .product-detail-modal {
            flex-direction: column !important;
            max-height: 117vh !important;
            border-radius: 6px !important;
            /* margin: 0.25rem !important; */
            margin-top: 192px;
          }

          .product-detail-images {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e9ecef !important;
            max-height: 51vh !important;
            padding: 0.75rem !important;
            min-height:500px !important;
          }

          .product-detail-images > div:first-child img {
            height: auto !important;
            max-height: 375px !important;
          }

          .order-history-modal {
            flex-direction: column !important;
            max-width: 96vw !important;
            max-height: 96vh !important;
            margin: 0.5rem !important;
          }

          .order-list-panel {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e9ecef !important;
          }

          .order-list-panel > div:last-child {
            max-height: 240px !important;
            overflow-y: auto !important;
          }

          [style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }

          button {
            min-height: 44px;
            touch-action: manipulation;
            font-size: 0.875rem !important;
          }

          input,
          select,
          textarea {
            min-height: 44px;
            font-size: 16px !important;
            touch-action: manipulation;
            padding: 0.625rem 0.875rem !important;
          }

          h1 {
            font-size: 1.75rem !important;
          }

          h4 {
            font-size: 1.15rem !important;
          }

          h5 {
            font-size: 1rem !important;
          }

          h6 {
            font-size: 0.875rem !important;
          }

          p {
            font-size: 0.875rem !important;
          }

          .brand-logo {
            max-width: 120px !important;
          }
        }

        /* Extra Small Mobile - 360px to 399px */
        @media (max-width: 399px) {
          .RPDetails {
            width: 100% !important;
          }

          .search-wrapper {
            order: 3 !important;
            width: 100% !important;
            max-width: 100% !important;
            flex-basis: 100% !important;
          }

          .nav-btn .btn-text,
          .search-btn .btn-text {
            display: none;
          }

          .filter-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 90% !important;
            max-width: 260px !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 1000 !important;
            overflow-y: auto;
            height: 100vh;
            margin: 0 !important;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3) !important;
            padding: 14px !important;
          }

          .filter-sidebar.active {
            transform: translateX(0) !important;
          }

          .filter-close-btn {
            display: block !important;
          }

          .product-detail-modal {
            flex-direction: column !important;
            max-height: 98vh !important;
            border-radius: 4px !important;
            margin: 0.25rem !important;
            max-width: calc(100vw - 0.5rem) !important;
          }

          .product-detail-images {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e9ecef !important;
            max-height: 38vh !important;
            padding: 0.625rem !important;
          }

          .product-detail-images > div:first-child img {
            height: auto !important;
            max-height: 375px !important;
          }

          .order-history-modal {
            flex-direction: column !important;
            max-width: calc(100vw - 0.5rem) !important;
            max-height: 97vh !important;
            margin: 0.25rem !important;
          }

          .order-list-panel {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e9ecef !important;
          }

          .order-list-panel > div:last-child {
            max-height: 220px !important;
            overflow-y: auto !important;
          }

          [style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }

          button {
            min-height: 44px;
            touch-action: manipulation;
            font-size: 0.8125rem !important;
            padding: 0.5rem 0.75rem !important;
          }

          input,
          select,
          textarea {
            min-height: 44px;
            font-size: 16px !important;
            touch-action: manipulation;
            padding: 0.5rem 0.75rem !important;
          }

          h1 {
            font-size: 1.5rem !important;
            padding: 0 0.5rem !important;
          }

          h4 {
            font-size: 1.05rem !important;
          }

          h5 {
            font-size: 0.95rem !important;
          }

          h6 {
            font-size: 0.825rem !important;
          }

          p {
            font-size: 0.8125rem !important;
          }

          .brand-logo {
            max-width: 100px !important;
          }

          [style*="padding: '1.5rem'"] {
            padding: 1rem !important;
          }

          [style*="padding: '2rem'"] {
            padding: 1.25rem !important;
          }

          [style*="gap: '1rem'"] {
            gap: 0.75rem !important;
          }

          [style*="gap: '1.5rem'"] {
            gap: 1rem !important;
          }

          [style*="maxWidth: '90%'"] {
            max-width: 95% !important;
          }
        }

        /* Prevent zoom on input focus (iOS) */
        @media (max-width: 768px) {
          input[type="text"],
          input[type="email"],
          input[type="tel"],
          input[type="number"],
          select,
          textarea {
            font-size: 16px !important;
          }
        }

        /* Ensure touch targets are adequate on all mobile devices */
        @media (max-width: 767px) {
          button,
          a,
          input[type="button"],
          input[type="submit"] {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Horizontal scroll prevention */
        @media (max-width: 767px) {
          body {
            overflow-x: hidden !important;
          }

          * {
            max-width: 100%;
          }
        }
      `}</style>{" "}
    </div>
  );
};

export default ClientProducts;
