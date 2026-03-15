import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ref, get, remove, onValue } from "firebase/database";
import { database } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import "../styles/seller-dashboard.css";

const SellerDashboard = () => {
  const { user, userRole, logout } = useAuth();
  const [sellerName, setSellerName] = useState("Loading...");
  const [sellerEmail, setSellerEmail] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/seller-login");
      return;
    }

    setSellerEmail(user.email);

    // Fetch the latest seller details from the database
    const fetchSellerDetails = async () => {
      try {
        const sellersRef = ref(database, "sellers");
        const snapshot = await get(sellersRef);
        if (snapshot.exists()) {
          const sellersData = snapshot.val();
          const sellerEntries = Object.values(sellersData);
          const currentSeller = sellerEntries.find(
            (s) => s.email && s.email.toLowerCase() === user.email.toLowerCase()
          );
          
          if (currentSeller && currentSeller.businessName) {
            setSellerName(currentSeller.businessName);
          } else if (currentSeller && currentSeller.sellerName) {
            setSellerName(currentSeller.sellerName);
          } else {
            setSellerName(user.displayName || user.email);
          }
        } else {
          setSellerName(user.displayName || user.email);
        }
      } catch (err) {
        console.error("Error fetching seller details:", err);
        setSellerName(user.displayName || user.email);
      }
    };

    fetchSellerDetails();

    if (userRole === 'seller') {
      fetchSellerProducts(user.email);
    } else {
      setError("This account is not registered as a seller.");
      setLoading(false);
    }
  }, [user, userRole, navigate]);

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out: " + error.message);
    }
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
    revenue: products.reduce((acc, p) => {
      // Only count revenue for products that have bids (meaning someone will pay)
      if (p.highestBidder !== "No bids yet" && p.currentPrice) {
        return acc + Number(p.currentPrice);
      }
      return acc;
    }, 0),
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

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <i className="bi bi-box stat-icon"></i>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Products</div>
          </div>
          <div className="stat-card active-card">
            <i className="bi bi-lightning stat-icon"></i>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Auctions</div>
          </div>
          <div className="stat-card upcoming-card">
            <i className="bi bi-calendar-event stat-icon"></i>
            <div className="stat-value">{stats.upcoming}</div>
            <div className="stat-label">Upcoming</div>
          </div>
          <div className="stat-card ended-card">
            <i className="bi bi-clock-history stat-icon"></i>
            <div className="stat-value">{stats.ended}</div>
            <div className="stat-label">Ended</div>
          </div>
          <div className="stat-card revenue-card">
            <i className="bi bi-cash-coin stat-icon"></i>
            <div className="stat-value">₹{stats.revenue.toLocaleString()}</div>
            <div className="stat-label">Est. Revenue</div>
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

        {/* Grid Layout replacing legacy Table */}
        <div className="premium-table-container">
          <table className="premium-seller-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Starting Price</th>
                <th>Current Bid</th>
                <th>Timeline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="animate__animated animate__fadeIn">
                    <td>
                      <div className="product-cell">
                        <div className="product-thumb">
                          <img
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.productName}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/60x60?text=No+Image";
                            }}
                          />
                        </div>
                        <div className="product-info">
                          <div className="product-name">{product.productName}</div>
                          {product.highestBidder !== "No bids yet" && (
                            <div className="product-desc">
                              <i className="fas fa-trophy text-warning me-1"></i>
                              Winner: {product.highestBidder.split('@')[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="price-text">₹{product.startingPrice}</td>
                    <td className="current-price-text">₹{product.currentPrice}</td>
                    <td>
                      <div className="d-flex flex-column gap-1" style={{fontSize: '0.85rem'}}>
                        <span className="text-muted"><i className="far fa-calendar-alt me-1"></i> {new Date(product.startTime).toLocaleDateString()}</span>
                        <span className="text-muted"><i className="far fa-clock me-1"></i> {new Date(product.endTime).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-2 align-items-start">
                        <span className={`badge bg-${product.status === "Active" ? "success" : product.status === "Ended" ? "danger" : "secondary"}`}>
                          {product.status}
                        </span>
                        <span className={`badge bg-${product.paymentStatus === 'Completed' ? 'success' : 'warning'}`}>
                          {product.paymentStatus === 'Completed' ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link to={`/place-bid/${product.id}`} className="btn btn-outline-primary btn-sm rounded-pill px-3">
                          <i className="fas fa-eye me-1"></i> View
                        </Link>
                        <button className="btn btn-danger btn-sm rounded-pill px-3" onClick={() => deleteProduct(product.id)}>
                          <i className="fas fa-trash me-1"></i> Drop
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center empty-state">
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