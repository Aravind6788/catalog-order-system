// src/pages/Dashboard.jsx
import React, { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { Package, ShoppingCart, Folder, DollarSign } from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const stats = {
    totalProducts: 156,
    totalOrders: 89,
    totalCategories: 12,
    totalRevenue: 24580.5,
  };

  const recentOrders = [
    {
      name: "John Smith",
      date: "2025-08-09",
      amount: 189.99,
      status: "pending",
    },
    {
      name: "Sarah Johnson",
      date: "2025-08-08",
      amount: 345.5,
      status: "quoted",
    },
    {
      name: "Mike Davis",
      date: "2025-08-08",
      amount: 125,
      status: "completed",
    },
    {
      name: "Lisa Brown",
      date: "2025-08-07",
      amount: 450.25,
      status: "pending",
    },
  ];

  const topProducts = [
    { name: "Blue Spruce - Large", sales: 45, revenue: 6749.55 },
    { name: "Japanese Maple - Medium", sales: 32, revenue: 2559.68 },
    { name: "Professional Pruning Shears", sales: 28, revenue: 979.72 },
    { name: "Organic Plant Food", sales: 67, revenue: 1674.33 },
  ];

  const getStatusColor = (status) => `status-${status.toLowerCase()}`;

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="dashboard-card">
            <div className="card-icon bg-blue">
              <Package size={22} />
            </div>
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
            <span className="trend text-success">+12%</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="dashboard-card">
            <div className="card-icon bg-green">
              <ShoppingCart size={22} />
            </div>
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
            <span className="trend text-success">+8%</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="dashboard-card">
            <div className="card-icon bg-purple">
              <Folder size={22} />
            </div>
            <h3>{stats.totalCategories}</h3>
            <p>Categories</p>
            <span className="trend text-success">+5%</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="dashboard-card">
            <div className="card-icon bg-orange">
              <DollarSign size={22} />
            </div>
            <h3>${stats.totalRevenue}</h3>
            <p>Total Revenue</p>
            <span className="trend text-success">+15%</span>
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="row">
        <div className="col-md-6">
          <div className="recent-orders">
            <h2 className="mb-3">Recent Orders</h2>
            <ul>
              {recentOrders.map((order, index) => (
                <li key={index}>
                  <div>
                    <p className="mb-1">{order.name}</p>
                    <p className="text-muted">{order.date}</p>
                  </div>
                  <div>
                    <p>${order.amount}</p>
                    <p className={getStatusColor(order.status)}>
                      {order.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="top-products">
            <h2 className="mb-3">Top Products</h2>
            <ul>
              {topProducts.map((product, index) => (
                <li key={index}>
                  <div>
                    <p className="mb-1">{product.name}</p>
                    <p className="text-muted">{product.sales} sales</p>
                  </div>
                  <p>${product.revenue}</p>
                </li>
              ))}
            </ul>
            <a href="/products" className="view-all">
              View all products
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
