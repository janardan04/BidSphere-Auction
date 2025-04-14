import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get, remove, onValue } from "firebase/database";
import { auth, database } from "../firebase/firebaseConfig";
import "../styles/seller-dashboard.css";

const SellerDashboard = () => {
  const [sellerName, setSellerName] = useState("Loading...");
  const [sellerEmail, setSellerEmail] = useState(null);
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const email = user.email;
        setSellerName(user.displayName || email);
        setSellerEmail(email);

        const sellerRef = ref(database, "sellers/" + user.uid);
        get(sellerRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              fetchSellerProducts(email);
              fetchNotifications(email);
            } else {
              setError("This account is not registered as a seller.");
              setLoading(false);
              auth.signOut();
              navigate("/seller-login");
            }
          })
          .catch((error) => {
            console.error("Error checking seller status:", error);
            setError("Error verifying seller status: " + error.message);
            setLoading(false);
          });
      } else {
        navigate("/seller-login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const getAuctionStatus = (startTime, endTime) => {
    const currentTime = new Date().getTime();
    if (currentTime < startTime) return "Upcoming";
    if (currentTime >= startTime && currentTime < endTime) return "Active";
    return "Ended";
  };

  const fetchSellerProducts = (sellerEmail) => {
    if (!sellerEmail) {
      setError("Seller email is not available. Please log in again.");
      setLoading(false);
      return;
    }

    const productRef = ref(database, "auctions");
    const paymentsRef = ref(database, "payments");

    Promise.all([get(productRef), get(paymentsRef)])
      .then(([productsSnapshot, paymentsSnapshot]) => {
        if (productsSnapshot.exists()) {
          const productsData = productsSnapshot.val();
          const paymentsData = paymentsSnapshot.exists() ? paymentsSnapshot.val() : {};

          const sellerProducts = [];
          Object.keys(productsData).forEach((productId) => {
            const product = productsData[productId];
            if (product.seller && product.seller.toLowerCase() === sellerEmail.toLowerCase()) {
              const status =
                product.startTime && product.endTime
                  ? getAuctionStatus(product.startTime, product.endTime)
                  : "Unknown";

              let imageUrl = "https://via.placeholder.com/50";
              if (product.imageUrl) {
                imageUrl = product.imageUrl;
              } else if (product.images && product.images.length > 0) {
                imageUrl = product.images[0];
              } else if (product.image) {
                imageUrl = product.image;
              }

              let paymentStatus = "Pending";
              if (paymentsData) {
                const payment = Object.values(paymentsData).find(
                  (p) => p.auctionId === productId
                );
                paymentStatus = payment ? payment.paymentStatus : "Pending";
              }

              sellerProducts.push({
                id: productId,
                productName: product.productName || "Unknown Product",
                startingPrice: product.startingPrice || 0,
                currentPrice: product.currentPrice || product.startingPrice || 0,
                startTime: product.startTime || 0,
                endTime: product.endTime || 0,
                highestBidder: product.highestBidder || "No bids yet",
                status: status,
                imageUrl: imageUrl,
                description: product.description || "",
                paymentStatus: paymentStatus,
              });
            }
          });

          setProducts(sellerProducts);
        } else {
          setProducts([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching products or payments:", error);
        setError("Failed to load products: " + error.message);
        setLoading(false);
      });
  };

  const fetchNotifications = (sellerEmail) => {
    const notificationsRef = ref(database, "notifications");
    onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const notificationsData = snapshot.val();
        const sellerNotifications = Object.entries(notificationsData)
          .filter(([_, notification]) => notification.sellerEmail === sellerEmail)
          .map(([id, notification]) => ({
            id,
            message: notification.message,
            timestamp: notification.timestamp,
            read: notification.read,
          }));
        setNotifications(sellerNotifications);
      } else {
        setNotifications([]);
      }
    });
  };

  const deleteProduct = (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    const productRef = ref(database, `auctions/${productId}`);
    remove(productRef)
      .then(() => {
        console.log("Product deleted successfully");
        setProducts((prev) => prev.filter((product) => product.id !== productId));
      })
      .catch((error) => {
        console.error("Error deleting product:", error);
        alert("Failed to delete product: " + error.message);
      });
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Logout error:", error);
        alert("Failed to log out: " + error.message);
      });
  };

  const filteredProducts =
    filterStatus === "all"
      ? products
      : products.filter((product) => product.status.toLowerCase() === filterStatus.toLowerCase());

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === "Active").length,
    ended: products.filter((p) => p.status === "Ended").length,
    upcoming: products.filter((p) => p.status === "Upcoming").length,
  };

  return (
    <div className="seller-dashboard" style={{ paddingTop: "80px" }}>
      {/* Removed the container div that was here */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="animate__animated animate__fadeInDown">Seller Dashboard</h1>
            <p className="lead animate__animated animate__fadeIn animate__delay-1s">
              Welcome <strong className="text-uppercase text-success"><b>{sellerName}</b></strong>
            </p>
          </div>
          <div className="animate__animated animate__fadeInRight">
            <Link to="/add-product" className="btn btn-custom animate__animated animate__pulse animate__delay-2s">
              <i className="bi bi-plus-circle"></i> Add New Product
            </Link>
            <p> </p>
            <button id="logoutButton" className="btn btn-light shadow-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main animate__animated animate__fadeInUp animate__delay-1s">
        {/* Notifications Section */}
        {notifications.length > 0 && (
          <div className="notifications mb-4">
            <h3>Notifications</h3>
            <ul className="list-group">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`list-group-item ${notification.read ? '' : 'list-group-item-warning'}`}
                >
                  {notification.message} - {new Date(notification.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Products</div>
          </div>
          <div className="stat-card active-card">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Auctions</div>
          </div>
          <div className="stat-card upcoming-card">
            <div className="stat-value">{stats.upcoming}</div>
            <div className="stat-label">Upcoming</div>
          </div>
          <div className="stat-card ended-card">
            <div className="stat-value">{stats.ended}</div>
            <div className="stat-label">Ended</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="action-bar">
          <div className="filter-controls">
            <div className="btn-group">
              <button
                className={`btn ${filterStatus === "all" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setFilterStatus("all")}
              >
                All
              </button>
              <button
                className={`btn ${filterStatus === "active" ? "btn-success" : "btn-outline-success"}`}
                onClick={() => setFilterStatus("active")}
              >
                Active
              </button>
              <button
                className={`btn ${filterStatus === "upcoming" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => setFilterStatus("upcoming")}
              >
                Coming
              </button>
              <button
                className={`btn ${filterStatus === "ended" ? "btn-danger" : "btn-outline-danger"}`}
                onClick={() => setFilterStatus("ended")}
              >
                Ended
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="table-responsive">
          <table className="product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Start Price</th>
                <th>Current Bid</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="productHistory">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} data-product-id={product.id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-thumb">
                          <img
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.productName}
                            onError={(e) => {
                              console.error("Image failed to load:", product.imageUrl);
                              e.target.src = "https://via.placeholder.com/50";
                            }}
                          />
                        </div>
                        <div className="product-info">
                          <div className="product-name">{product.productName}</div>
                          {product.description && (
                            <div className="product-desc">{product.description.substring(0, 40)}...</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>₹{product.startingPrice}</td>
                    <td>₹{product.currentPrice}</td>
                    <td>{new Date(product.startTime).toLocaleString()}</td>
                    <td>{new Date(product.endTime).toLocaleString()}</td>
                    <td>
                      {product.highestBidder !== "No bids yet" && (
                        <div className="bidder-info">{product.highestBidder}</div>
                      )}
                      <span
                        className={`badge bg-${
                          product.status === "Active"
                            ? "success"
                            : product.status === "Ended"
                            ? "danger"
                            : "secondary"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge bg-${
                          product.paymentStatus === "Completed" ? "success" : "warning"
                        }`}
                      >
                        {product.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-danger btn-sm delete-btn"
                          onClick={() => deleteProduct(product.id)}
                        >
                          Delete
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center empty-state">
                    <i className="bi bi-inbox large-icon"></i>
                    <p>No products found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;