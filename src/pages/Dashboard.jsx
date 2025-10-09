import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../components/Sidebar";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import {
  Package,
  ShoppingCart,
  Folder,
  Users,
  Bell,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/GreenLand/api";
const API_BASE = API_BASE_URL;
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log(
        "Fetching dashboard data from:",
        `${API_BASE}/dashboard/overview`
      );
      const response = await axios.get(`${API_BASE}/dashboard/overview`);
      console.log("Dashboard response:", response.data);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      console.error("Error details:", error.response?.data || error.message);
      console.error("Status:", error.response?.status);
      console.error("URL:", error.config?.url);

      // Try fallback with mock data
      setDashboardData({
        stats: {
          totalProducts: 156,
          totalOrders: 89,
          totalCategories: 12,
          totalCustomers: 45,
        },
        recentOrders: [
          {
            name: "John Smith",
            date: "2025-09-04",
            amount: 189.99,
            status: "pending",
          },
          {
            name: "Sarah Johnson",
            date: "2025-09-03",
            amount: 345.5,
            status: "quoted",
          },
          {
            name: "Mike Davis",
            date: "2025-09-03",
            amount: 125,
            status: "completed",
          },
          {
            name: "Lisa Brown",
            date: "2025-09-02",
            amount: 450.25,
            status: "pending",
          },
        ],
        topProducts: [
          { name: "Blue Spruce - Large", sales: 45, revenue: 6749.55 },
          { name: "Japanese Maple - Medium", sales: 32, revenue: 2559.68 },
          { name: "Professional Pruning Shears", sales: 28, revenue: 979.72 },
          { name: "Organic Plant Food", sales: 67, revenue: 1674.33 },
        ],
      });
      setError(
        `API Error: ${
          error.response?.status || "Connection failed"
        } - Using mock data`
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => `status-${status.toLowerCase()}`;

  if (loading) {
    return (
      <>
        <style>
          {`
            .dashboard-layout {
              display: flex;
              min-height: 100vh;
            }

            .dashboard-page {
              flex: 1;
              padding: 24px;
              background: #f8fafc;
              min-height: 100vh;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div className="dashboard-layout">
          {/* <Sidebar /> */}
          <div className="dashboard-page">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading dashboard...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>
          {`
            .dashboard-layout {
              display: flex;
              min-height: 100vh;
            }

            .dashboard-page {
              flex: 1;
              padding: 24px;
              background: #f8fafc;
              min-height: 100vh;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            .error-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 64px;
              color: #ef4444;
              text-align: center;
            }
          `}
        </style>
        <div className="dashboard-layout">
          {/* <Sidebar /> */}
          <div className="dashboard-page">
            <div className="error-container">
              <AlertCircle size={48} style={{ marginBottom: "16px" }} />
              <p>{error}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { stats, recentOrders, topProducts } = dashboardData;

  return (
    <>
      <style>
        {`
          .dashboard-layout {
            display: flex;
            min-height: 100vh;
          }

          .dashboard-page {
            flex: 1;
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

          .header-controls {
            display: flex;
            gap: 16px;
            align-items: center;
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
          }

          .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
          }

          .dashboard-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
            transition: all 0.2s;
            position: relative;
            overflow: hidden;
          }

          .dashboard-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }

          .card-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
          }

          .bg-blue { background: #dbeafe; }
          .bg-green { background: #dcfce7; }
          .bg-purple { background: #f3e8ff; }
          .bg-orange { background: #fed7aa; }

          .dashboard-card h3 {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 4px 0;
          }

          .dashboard-card p {
            color: #64748b;
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 500;
          }

          .trend {
            font-size: 12px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          .text-success {
            color: #059669;
            background: #dcfce7;
          }

          .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }

          .content-section {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }

          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .recent-orders ul,
          .top-products ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .recent-orders li,
          .top-products li {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid #f1f5f9;
          }

          .recent-orders li:last-child,
          .top-products li:last-child {
            border-bottom: none;
          }

          .order-info,
          .product-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .order-info p,
          .product-info p {
            margin: 0;
            font-size: 14px;
          }

          .order-info p:first-child,
          .product-info p:first-child {
            font-weight: 600;
            color: #1e293b;
          }

          .text-muted {
            color: #64748b !important;
          }

          .order-meta,
          .product-meta {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
          }

          .order-meta p,
          .product-meta p {
            margin: 0;
            font-size: 14px;
          }

          .order-meta p:first-child,
          .product-meta p:first-child {
            font-weight: 600;
            color: #1e293b;
          }

          .status-pending {
            color: #f59e0b;
            background: #fef3c7;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }

          .status-quoted {
            color: #3b82f6;
            background: #dbeafe;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }

          .status-completed {
            color: #059669;
            background: #dcfce7;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }

          .view-all {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #3b82f6;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            margin-top: 16px;
            padding: 8px 12px;
            border-radius: 6px;
            transition: background 0.2s;
          }

          .view-all:hover {
            background: #f1f5f9;
            text-decoration: none;
          }

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 32px;
            color: #64748b;
            text-align: center;
          }

          @media (max-width: 768px) {
            .dashboard-page { 
              padding: 16px; 
            }
            
            .page-header { 
              flex-direction: column; 
              gap: 16px; 
              align-items: stretch; 
            }
            
            .stats-grid { 
              grid-template-columns: 1fr; 
            }
            
            .content-grid { 
              grid-template-columns: 1fr; 
            }
          }

          @media (max-width: 1024px) {
            .content-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="dashboard-layout">
        {/* <Sidebar /> */}
        <div className="dashboard-page">
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Dashboard</h1>
            {/* <div className="header-controls">
              <div className="notification-wrapper">
                <Bell size={20} />
                <span className="notification-badge">3</span>
              </div>
              <div className="user-avatar">
                <img src="/avatar.png" alt="User" />
              </div>
            </div> */}
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="dashboard-card">
              <div className="card-icon bg-blue">
                <Package size={22} color="#3b82f6" />
              </div>
              <h3>{stats.totalProducts}</h3>
              <p>Total Products</p>
              {/* <span className="trend text-success">
                <TrendingUp size={12} />
                +12%
              </span> */}
            </div>

            <div className="dashboard-card">
              <div className="card-icon bg-green">
                <ShoppingCart size={22} color="#059669" />
              </div>
              <h3>{stats.totalOrders}</h3>
              <p>Total Orders</p>
              {/* <span className="trend text-success">
                <TrendingUp size={12} />
                +8%
              </span> */}
            </div>

            <div className="dashboard-card">
              <div className="card-icon bg-purple">
                <Folder size={22} color="#7c3aed" />
              </div>
              <h3>{stats.totalCategories}</h3>
              <p>Categories</p>
              {/* <span className="trend text-success">
                <TrendingUp size={12} />
                +5%
              </span> */}
            </div>

            <div className="dashboard-card">
              <div className="card-icon bg-orange">
                <Users size={22} color="#ea580c" />
              </div>
              <h3>{stats.totalCustomers}</h3>
              <p>Total Customers</p>
              {/* <span className="trend text-success">
                <TrendingUp size={12} />
                +15%
              </span> */}
            </div>
          </div>

          {/* Recent Orders & Top Products */}
          <div className="content-grid">
            <div className="content-section recent-orders">
              <h2 className="section-title">
                {/* <Calendar size={20} /> */}
                Recent Orders
              </h2>
              {recentOrders && recentOrders.length > 0 ? (
                <ul>
                  {recentOrders.map((order, index) => (
                    <li key={order.id || index}>
                      <div className="order-info">
                        <p>{order.name}</p>
                        <p className="text-muted">{order.date}</p>
                      </div>
                      <div className="order-meta">
                        {/* <p>${order.amount}</p> */}
                        <span className={getStatusColor(order.status)}>
                          {order.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <ShoppingCart
                    size={32}
                    style={{ color: "#cbd5e1", marginBottom: "8px" }}
                  />
                  <p>No recent orders</p>
                </div>
              )}
            </div>

            <div className="content-section top-products">
              <h2 className="section-title">
                {/* <DollarSign size={20} /> */}
                Top Products
              </h2>
              {topProducts && topProducts.length > 0 ? (
                <>
                  <ul>
                    {topProducts.map((product, index) => (
                      <li key={index}>
                        <div className="product-info">
                          <p>{product.name}</p>
                          <p className="text-muted">{product.sales} sales</p>
                        </div>
                        <div className="product-meta">
                          <p>₹{product.revenue}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <a href="/products" className="view-all">
                    View all products
                  </a>
                </>
              ) : (
                <div className="empty-state">
                  <Package
                    size={32}
                    style={{ color: "#cbd5e1", marginBottom: "8px" }}
                  />
                  <p>No product sales data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
