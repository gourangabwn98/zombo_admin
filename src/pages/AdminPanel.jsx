import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  IndianRupee,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  ExternalLink,
  BellRing,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = "https://zombo.onrender.com";
const RINGTONE_URL = "/notification.mp3";

const AdminPanel = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = useCallback(async () => {
    // Define playRingtone inside to avoid dependency issues
    const playRingtone = () => {
      const audio = new Audio(RINGTONE_URL);
      audio.volume = 0.9;
      audio.play().catch((err) => {
        console.log("Audio play failed:", err);
      });
    };

    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/orders`),
        fetch(`${API_BASE_URL}/api/admin/stats`),
      ]);

      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();

      if (ordersData?.success && Array.isArray(ordersData.orders)) {
        const newOrders = ordersData.orders.reverse();
        setOrders(newOrders);

        // Play sound only when a genuinely new order appears
        if (newOrders.length > previousOrderCount && previousOrderCount > 0) {
          playRingtone();
        }
        setPreviousOrderCount(newOrders.length);
      }

      if (statsData?.success) {
        setStats({
          totalUsers: statsData.totalUsers || 0,
          totalOrders: statsData.totalOrders || 0,
          totalRevenue: statsData.totalRevenue || 0,
          todayRevenue: statsData.todayRevenue || 0,
        });
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [previousOrderCount]); // Only previousOrderCount is needed as dependency

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        alert("Status update failed");
      }
    } catch (err) {
      alert("Status update failed: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingContainer}>
          <RefreshCw
            size={48}
            style={{ animation: "spin 2s linear infinite", color: "#fff" }}
          />
          <h1 style={{ color: "#fff", marginTop: 20 }}>
            Loading Zombo Admin Panel...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerContainer}>
          <div style={headerContent}>
            <BellRing size={48} style={{ color: "#fbbf24" }} />
            <div>
              <h1 style={titleStyle}>Zombo Admin Panel</h1>
              <p style={subtitleStyle}>
                Real-time orders with ringtone alerts 🔔
              </p>
            </div>
          </div>
          <div style={lastUpdateStyle}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={statsGrid}>
          <Stat
            icon={<Users size={32} />}
            title="Total Users"
            value={stats.totalUsers}
            color="#8b5cf6"
          />
          <Stat
            icon={<ShoppingBag size={32} />}
            title="Total Orders"
            value={stats.totalOrders}
            color="#3b82f6"
          />
          <Stat
            icon={<IndianRupee size={32} />}
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            color="#10b981"
          />
          <Stat
            icon={<Clock size={32} />}
            title="Today's Revenue"
            value={`₹${stats.todayRevenue.toLocaleString()}`}
            color="#f59e0b"
          />
        </div>

        {/* Orders Section */}
        <div style={ordersSectionHeader}>
          <h2 style={sectionTitle}>
            <Truck size={28} style={{ marginRight: 10 }} />
            Live Orders ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div style={emptyState}>
            <ShoppingBag size={64} style={{ opacity: 0.3 }} />
            <h3 style={{ marginTop: 20 }}>No Orders Yet</h3>
            <p>Orders will appear here in real-time 🚀</p>
          </div>
        ) : (
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRow}>
                  <th style={tableHeader}>Order ID</th>
                  <th style={tableHeader}>Items</th>
                  <th style={tableHeader}>Amount</th>
                  <th style={tableHeader}>Address</th>
                  <th style={tableHeader}>Map</th>
                  <th style={tableHeader}>Status</th>
                  <th style={tableHeader}>Date & Time</th>
                  <th style={tableHeader}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  const address = order.address || "";
                  const addressLines = address.split("\n");
                  const isNewOrder = index === 0;

                  return (
                    <tr
                      key={order._id}
                      style={{
                        ...tableRow,
                        background: isNewOrder
                          ? "rgba(251, 191, 36, 0.1)"
                          : "#fff",
                      }}
                    >
                      <td style={tableCell}>
                        <span style={orderIdBadge}>
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                      </td>

                      <td style={tableCell}>
                        <div style={itemsList}>
                          {(order.items || []).map((item, i) => (
                            <div key={i} style={itemRow}>
                              <span style={itemName}>
                                {item?.name || "Item"}
                              </span>
                              <span style={itemQuantity}>
                                × {item?.quantity || 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td style={tableCell}>
                        <span style={amountText}>
                          ₹{order.totalAmount || 0}
                        </span>
                      </td>

                      <td style={tableCell}>
                        <div style={addressText}>
                          {addressLines[0] || "No address"}
                        </div>
                      </td>

                      <td style={tableCell}>
                        {address.includes("google.com/maps") ? (
                          <a
                            href={addressLines[addressLines.length - 1]}
                            target="_blank"
                            rel="noreferrer"
                            style={mapLink}
                          >
                            <ExternalLink size={16} />
                            <span>View Map</span>
                          </a>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>-</span>
                        )}
                      </td>

                      <td style={tableCell}>
                        <span
                          style={{
                            ...statusBadge,
                            background: getStatusColor(order.status),
                          }}
                        >
                          {order.status || "Accepted"}
                        </span>
                      </td>

                      <td style={tableCell}>
                        <div style={dateTimeText}>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString(
                                "en-IN",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                }
                              )
                            : "-"}
                        </div>
                      </td>

                      <td style={tableCell}>
                        {order.status !== "Delivered" ? (
                          <button
                            onClick={() => updateStatus(order._id, "Delivered")}
                            disabled={updatingId === order._id}
                            style={{
                              ...actionBtn,
                              opacity: updatingId === order._id ? 0.6 : 1,
                              cursor:
                                updatingId === order._id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            <CheckCircle size={16} />
                            <span>Mark Done</span>
                          </button>
                        ) : (
                          <span style={{ color: "#10b981", fontWeight: 600 }}>
                            ✓ Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ icon, title, value, color }) => (
  <div style={{ ...statCard, borderLeft: `4px solid ${color}` }}>
    <div style={{ color, marginBottom: 12 }}>{icon}</div>
    <h3 style={statTitle}>{title}</h3>
    <p style={statValue}>{value}</p>
  </div>
);

const getStatusColor = (status) => {
  if (status === "Delivered") return "#10b981";
  if (status === "Cancelled") return "#ef4444";
  if (status === "Out for Delivery") return "#fb923c";
  return "#6366f1";
};

/* ---------- STYLES ---------- */
const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  padding: "40px 20px",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const loadingContainer = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "70vh",
};

const containerStyle = { maxWidth: 1400, margin: "0 auto" };
const headerContainer = {
  marginBottom: 40,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 20,
};
const headerContent = { display: "flex", alignItems: "center", gap: 20 };
const titleStyle = { color: "#fff", fontSize: 42, margin: 0, fontWeight: 700 };
const subtitleStyle = { color: "#cbd5e1", margin: "8px 0 0 0", fontSize: 16 };
const lastUpdateStyle = {
  color: "#94a3b8",
  fontSize: 14,
  background: "rgba(255,255,255,0.1)",
  padding: "8px 16px",
  borderRadius: 8,
};
const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 24,
  marginBottom: 40,
};
const statCard = {
  background: "rgba(255,255,255,0.95)",
  padding: 28,
  borderRadius: 16,
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  transition: "transform 0.2s",
};
const statTitle = {
  color: "#64748b",
  fontSize: 14,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: 0,
};
const statValue = {
  fontSize: 32,
  fontWeight: 700,
  color: "#1e293b",
  margin: "8px 0 0 0",
};
const ordersSectionHeader = { marginBottom: 24 };
const sectionTitle = {
  color: "#fff",
  fontSize: 28,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  margin: 0,
};
const emptyState = {
  color: "#fff",
  textAlign: "center",
  padding: "100px 20px",
  background: "rgba(255,255,255,0.05)",
  borderRadius: 16,
};
const tableContainer = {
  background: "#fff",
  borderRadius: 16,
  overflowX: "auto",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
};
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
const tableHeaderRow = {
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
};
const tableHeader = {
  padding: "16px 12px",
  textAlign: "left",
  fontWeight: 600,
  color: "#475569",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};
const tableRow = {
  borderBottom: "1px solid #e2e8f0",
  transition: "background 0.2s",
};
const tableCell = {
  padding: "16px 12px",
  color: "#1e293b",
  verticalAlign: "middle",
};
const orderIdBadge = {
  background: "#e0e7ff",
  color: "#4338ca",
  padding: "4px 12px",
  borderRadius: 6,
  fontWeight: 600,
  fontSize: 13,
};
const itemsList = { display: "flex", flexDirection: "column", gap: 6 };
const itemRow = { display: "flex", justifyContent: "space-between", gap: 8 };
const itemName = { color: "#334155", fontWeight: 500 };
const itemQuantity = { color: "#64748b", fontWeight: 600 };
const amountText = { fontSize: 16, fontWeight: 700, color: "#059669" };
const addressText = { maxWidth: 200, color: "#475569", lineHeight: 1.4 };
const mapLink = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#3b82f6",
  textDecoration: "none",
  fontWeight: 500,
};
const dateTimeText = { color: "#64748b", fontSize: 13, whiteSpace: "nowrap" };
const statusBadge = {
  padding: "6px 14px",
  borderRadius: 20,
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  display: "inline-block",
};
const actionBtn = {
  border: "none",
  padding: "10px 16px",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
  background: "#10b981",
  fontWeight: 600,
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  gap: 6,
  transition: "all 0.2s",
  boxShadow: "0 2px 4px rgba(16,185,129,0.3)",
};

export default AdminPanel;
