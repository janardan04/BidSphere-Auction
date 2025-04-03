"use client"

import { useEffect, useState, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ref, get, set, remove } from "firebase/database"
import { database } from "../firebase/firebaseConfig"
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Table,
  Form,
  Modal,
  Nav,
  Badge,
  Spinner,
  Dropdown,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap"
import {
  PeopleFill,
  Shop,
  TagFill,
  Search,
  PlusCircle,
  Trash,
  Pencil,
  ThreeDotsVertical,
  BoxArrowRight,
  GearFill,
  ArrowClockwise,
  ExclamationTriangle,
  GraphUp,
  Bell,
  Calendar,
  Grid,
  List,
} from "react-bootstrap-icons"
import "../styles/admin-dashboard.css"

const AdminDashboard = () => {
  const [users, setUsers] = useState([])
  const [sellers, setSellers] = useState([])
  const [auctions, setAuctions] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState({ type: "", show: false, mode: "add", itemId: null })
  const [newItem, setNewItem] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("users")
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    activeAuctions: 0,
    pendingPayments: 0,
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState("table")
  const navigate = useNavigate()
  const location = useLocation()

  // Enhanced authentication check
  useEffect(() => {
    const { state } = location
    if (!state || !state.isAuthenticated || state.email !== "janardhanborse2003@gmail.com") {
      setError("You are not authorized to access this page.")
      navigate("/admin-login")
      return
    }
  }, [location, navigate])

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch Users
      const usersRef = ref(database, "users")
      const usersSnapshot = await get(usersRef)
      const usersData = usersSnapshot.val() || {}
      const formattedUsers = Object.entries(usersData).map(([id, data]) => ({ id, ...data }))
      setUsers(formattedUsers)

      // Fetch Sellers
      const sellersRef = ref(database, "sellers")
      const sellersSnapshot = await get(sellersRef)
      const sellersData = sellersSnapshot.val() || {}
      const formattedSellers = Object.entries(sellersData).map(([id, data]) => ({ id, ...data }))
      setSellers(formattedSellers)

      // Fetch Auctions
      const auctionsRef = ref(database, "auctions")
      const auctionsSnapshot = await get(auctionsRef)
      const auctionsData = auctionsSnapshot.val() || {}
      const formattedAuctions = Object.entries(auctionsData).map(([id, data]) => ({
        id,
        ...data,
        endTime: new Date(data.endTime).toLocaleString(),
        formattedPrice: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(data.currentPrice),
      }))
      setAuctions(formattedAuctions)

      // Set stats
      setStats({
        totalUsers: formattedUsers.length,
        totalSellers: formattedSellers.length,
        activeAuctions: formattedAuctions.filter((a) => a.isActive).length,
        pendingPayments: formattedAuctions.filter((a) => a.paymentStatus === "Pending").length,
      })

      setLoading(false)
    } catch (err) {
      setError("Failed to fetch data: " + err.message)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdate = async (type, id, updates) => {
    try {
      const path = type === "users" ? `users/${id}` : type === "sellers" ? `sellers/${id}` : `auctions/${id}`
      const itemRef = ref(database, path)

      let currentItem
      if (type === "users") {
        currentItem = users.find((u) => u.id === id)
      } else if (type === "sellers") {
        currentItem = sellers.find((s) => s.id === id)
      } else {
        currentItem = auctions.find((a) => a.id === id)
        if (updates.endTime && typeof updates.endTime === "string" && !updates.endTime.includes("/")) {
          updates.endTime = new Date(updates.endTime).getTime()
        }
      }

      await set(itemRef, { ...currentItem, ...updates })

      if (type === "users") {
        setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
      } else if (type === "sellers") {
        setSellers((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
      } else if (type === "auctions") {
        const updatedAuction = { ...currentItem, ...updates }
        if (updates.endTime) {
          updatedAuction.endTime = new Date(updates.endTime).toLocaleString()
        }
        if (updates.currentPrice) {
          updatedAuction.formattedPrice = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(updates.currentPrice)
        }
        setAuctions((prev) => prev.map((item) => (item.id === id ? updatedAuction : item)))
      }

      if (type === "auctions") {
        setStats((prev) => ({
          ...prev,
          activeAuctions: auctions.filter((a) => (a.id === id ? updates.isActive : a.isActive)).length,
          pendingPayments: auctions.filter((a) =>
            a.id === id ? updates.paymentStatus === "Pending" : a.paymentStatus === "Pending",
          ).length,
        }))
      }
    } catch (err) {
      setError("Failed to update: " + err.message)
    }
  }

  const handleDelete = async (type, id) => {
    if (window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      try {
        const path = type === "users" ? `users/${id}` : type === "sellers" ? `sellers/${id}` : `auctions/${id}`
        const itemRef = ref(database, path)
        await remove(itemRef)

        if (type === "users") {
          setUsers((prev) => prev.filter((item) => item.id !== id))
          setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }))
        } else if (type === "sellers") {
          const deletedSeller = sellers.find((s) => s.id === id)
          setSellers((prev) => prev.filter((item) => item.id !== id))
          setStats((prev) => ({ ...prev, totalSellers: prev.totalSellers - 1 }))

          const sellerAuctions = auctions.filter((a) => a.seller === deletedSeller.email)
          sellerAuctions.forEach(async (auction) => {
            const auctionRef = ref(database, `auctions/${auction.id}`)
            await remove(auctionRef)
          })

          setAuctions((prev) => prev.filter((auction) => auction.seller !== deletedSeller.email))
          setStats((prev) => ({
            ...prev,
            activeAuctions: prev.activeAuctions - sellerAuctions.filter((a) => a.isActive).length,
            pendingPayments: prev.pendingPayments - sellerAuctions.filter((a) => a.paymentStatus === "Pending").length,
          }))
        } else if (type === "auctions") {
          const deletedAuction = auctions.find((a) => a.id === id)
          setAuctions((prev) => prev.filter((item) => item.id !== id))
          setStats((prev) => ({
            ...prev,
            activeAuctions: deletedAuction.isActive ? prev.activeAuctions - 1 : prev.activeAuctions,
            pendingPayments:
              deletedAuction.paymentStatus === "Pending" ? prev.pendingPayments - 1 : prev.pendingPayments,
          }))
        }
      } catch (err) {
        setError("Failed to delete: " + err.message)
      }
    }
  }

  const handleEditItem = (type, id) => {
    let item
    if (type === "users") {
      item = users.find((u) => u.id === id)
    } else if (type === "sellers") {
      item = sellers.find((s) => s.id === id)
    } else {
      item = auctions.find((a) => a.id === id)
      if (item.endTime) {
        const date = new Date(item.endTime)
        item = {
          ...item,
          endTimeForInput: new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        }
      }
    }

    setNewItem(item)
    setShowModal({ type, show: true, mode: "edit", itemId: id })
  }

  const handleAdd = (type) => {
    setShowModal({ type, show: true, mode: "add", itemId: null })
    setNewItem(
      type === "users"
        ? { email: "", displayName: "" }
        : type === "sellers"
          ? { email: "", businessName: "" }
          : { productName: "", seller: "", currentPrice: "", endTime: "", paymentStatus: "Pending", isActive: false },
    )
  }

  const handleModalSubmit = async () => {
    try {
      const { type, mode, itemId } = showModal

      if (mode === "add") {
        const id = Date.now().toString()
        const path = `${type}/${id}`
        const itemRef = ref(database, path)

        let newData
        if (type === "auctions") {
          newData = {
            ...newItem,
            id,
            currentPrice: Number.parseFloat(newItem.currentPrice),
            endTime: new Date(newItem.endTime).getTime(),
            isActive: Boolean(newItem.isActive),
          }
        } else {
          newData = { ...newItem, id }
        }

        await set(itemRef, newData)

        if (type === "users") {
          setUsers((prev) => [...prev, newData])
          setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers + 1 }))
        } else if (type === "sellers") {
          setSellers((prev) => [...prev, newData])
          setStats((prev) => ({ ...prev, totalSellers: prev.totalSellers + 1 }))
        } else if (type === "auctions") {
          const displayAuction = {
            ...newData,
            endTime: new Date(newData.endTime).toLocaleString(),
            formattedPrice: new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(newData.currentPrice),
          }
          setAuctions((prev) => [...prev, displayAuction])
          setStats((prev) => ({
            ...prev,
            activeAuctions: newData.isActive ? prev.activeAuctions + 1 : prev.activeAuctions,
            pendingPayments: newData.paymentStatus === "Pending" ? prev.pendingPayments + 1 : prev.pendingPayments,
          }))
        }
      } else if (mode === "edit") {
        if (type === "auctions" && newItem.endTimeForInput) {
          await handleUpdate(type, itemId, {
            ...newItem,
            endTime: new Date(newItem.endTimeForInput).getTime(),
            currentPrice: Number.parseFloat(newItem.currentPrice),
            isActive: Boolean(newItem.isActive),
          })
        } else {
          await handleUpdate(type, itemId, newItem)
        }
      }

      setShowModal({ type: "", show: false, mode: "add", itemId: null })
      setNewItem({})
    } catch (err) {
      setError("Failed to save: " + err.message)
    }
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      navigate("/admin-login")
    }
  }

  const filteredData = (dataType) => {
    if (!searchTerm) return dataType === "users" ? users : dataType === "sellers" ? sellers : auctions

    const term = searchTerm.toLowerCase()

    if (dataType === "users") {
      return users.filter(
        (user) => user.email?.toLowerCase().includes(term) || user.displayName?.toLowerCase().includes(term),
      )
    } else if (dataType === "sellers") {
      return sellers.filter(
        (seller) => seller.email?.toLowerCase().includes(term) || seller.businessName?.toLowerCase().includes(term),
      )
    } else {
      return auctions.filter(
        (auction) =>
          auction.productName?.toLowerCase().includes(term) ||
          auction.seller?.toLowerCase().includes(term) ||
          auction.paymentStatus?.toLowerCase().includes(term),
      )
    }
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  if (error && !location.state?.isAuthenticated) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    )
  }

  return (
    <div className={`admin-dashboard ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>{sidebarCollapsed ? "BP" : "BidSphere Admin"}</h2>
          <Button variant="link" className="sidebar-toggle" onClick={toggleSidebar}>
            <ThreeDotsVertical />
          </Button>
        </div>
        <Nav className="flex-column sidebar-nav">
          <Nav.Link className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>
            <PeopleFill className="nav-icon" />
            <span className="nav-text">Users</span>
          </Nav.Link>
          <Nav.Link className={activeTab === "sellers" ? "active" : ""} onClick={() => setActiveTab("sellers")}>
            <Shop className="nav-icon" />
            <span className="nav-text">Sellers</span>
          </Nav.Link>
          <Nav.Link className={activeTab === "auctions" ? "active" : ""} onClick={() => setActiveTab("auctions")}>
            <TagFill className="nav-icon" />
            <span className="nav-text">Auctions</span>
          </Nav.Link>
          <Nav.Link className="nav-link-divider">
            <hr />
          </Nav.Link>
          <Nav.Link>
            <GraphUp className="nav-icon" />
            <span className="nav-text">Analytics</span>
          </Nav.Link>
          <Nav.Link>
            <Bell className="nav-icon" />
            <span className="nav-text">Notifications</span>
          </Nav.Link>
          <Nav.Link>
            <Calendar className="nav-icon" />
            <span className="nav-text">Calendar</span>
          </Nav.Link>
        </Nav>
        <div className="sidebar-footer">
          <Button variant="outline-light" onClick={handleLogout} className="logout-btn">
            <BoxArrowRight className="nav-icon" />
            <span className="nav-text">Logout</span>
          </Button>
        </div>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <div className="search-container">
            <div className="search-box">
              <Search className="search-icon" />
              <Form.Control
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="view-toggle">
            <Button
              variant={viewMode === "table" ? "primary" : "outline-primary"}
              className="view-toggle-btn"
              onClick={() => setViewMode("table")}
            >
              <List />
            </Button>
            <Button
              variant={viewMode === "grid" ? "primary" : "outline-primary"}
              className="view-toggle-btn"
              onClick={() => setViewMode("grid")}
            >
              <Grid />
            </Button>
          </div>

          <div className="admin-profile">
            <span className="admin-name">Admin</span>
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" id="dropdown-basic" className="avatar-dropdown">
                <div className="avatar">A</div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-menu-animated">
                <Dropdown.Item>
                  <GearFill className="dropdown-icon" />
                  Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <BoxArrowRight className="dropdown-icon" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="mt-3 alert-animated">
            {error}
          </Alert>
        )}

        <div className="dashboard-content">
          <Row className="stats-row">
            <Col lg={3} md={6} sm={6} className="stats-col">
              <Card className="stats-card users-card">
                <Card.Body>
                  <div className="stats-icon users-icon">
                    <PeopleFill />
                  </div>
                  <div className="stats-info">
                    <h3 className="counter">{stats.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} sm={6} className="stats-col">
              <Card className="stats-card sellers-card">
                <Card.Body>
                  <div className="stats-icon sellers-icon">
                    <Shop />
                  </div>
                  <div className="stats-info">
                    <h3 className="counter">{stats.totalSellers}</h3>
                    <p>Sellers</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} sm={6} className="stats-col">
              <Card className="stats-card auctions-card">
                <Card.Body>
                  <div className="stats-icon auctions-icon">
                    <TagFill />
                  </div>
                  <div className="stats-info">
                    <h3 className="counter">{stats.activeAuctions}</h3>
                    <p>Active Auctions</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} sm={6} className="stats-col">
              <Card className="stats-card pending-card">
                <Card.Body>
                  <div className="stats-icon pending-icon">
                    <ExclamationTriangle />
                  </div>
                  <div className="stats-info">
                    <h3 className="counter">{stats.pendingPayments}</h3>
                    <p>Pending Payments</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="data-card">
            <Card.Header className="data-card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h3>
                  {activeTab === "users" && "User Management"}
                  {activeTab === "sellers" && "Seller Management"}
                  {activeTab === "auctions" && "Auction Management"}
                </h3>
                <div className="header-actions">
                  <Button variant="outline-primary" className="refresh-btn" onClick={fetchData} disabled={loading}>
                    <ArrowClockwise className={loading ? "spin" : ""} />
                  </Button>
                  <Button variant="primary" className="add-btn" onClick={() => handleAdd(activeTab)}>
                    <PlusCircle className="button-icon" />
                    <span>Add New</span>
                  </Button>
                </div>
              </div>
            </Card.Header>

            <Card.Body className="data-table-container">
              {loading ? (
                <div className="text-center py-5 loading-container">
                  <Spinner animation="border" role="status" variant="primary" className="custom-spinner" />
                  <p className="mt-2">Loading data...</p>
                </div>
              ) : (
                <>
                  {viewMode === "table" ? (
                    <>
                      {activeTab === "users" && (
                        <Table responsive className="custom-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Email</th>
                              <th>Name</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredData("users").length > 0 ? (
                              filteredData("users").map((u) => (
                                <tr key={u.id} className="table-row-animated">
                                  <td className="id-cell">{u.id}</td>
                                  <td>{u.email}</td>
                                  <td>{u.displayName || "N/A"}</td>
                                  <td>
                                    <div className="action-buttons">
                                      <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
                                        <Button
                                          variant="light"
                                          size="sm"
                                          className="edit-btn"
                                          onClick={() => handleEditItem("users", u.id)}
                                        >
                                          <Pencil />
                                        </Button>
                                      </OverlayTrigger>
                                      <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                                        <Button
                                          variant="light"
                                          size="sm"
                                          className="delete-btn"
                                          onClick={() => handleDelete("users", u.id)}
                                        >
                                          <Trash />
                                        </Button>
                                      </OverlayTrigger>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="text-center">
                                  No users found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      )}

                      {activeTab === "sellers" && (
                        <Table responsive className="custom-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Email</th>
                              <th>Business Name</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredData("sellers").length > 0 ? (
                              filteredData("sellers").map((s) => (
                                <tr key={s.id} className="table-row-animated">
                                  <td className="id-cell">{s.id}</td>
                                  <td>{s.email}</td>
                                  <td>{s.businessName || "N/A"}</td>
                                  <td>
                                    <div className="action-buttons">
                                      <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
                                        <Button
                                          variant="light"
                                          size="sm"
                                          className="edit-btn"
                                          onClick={() => handleEditItem("sellers", s.id)}
                                        >
                                          <Pencil />
                                        </Button>
                                      </OverlayTrigger>
                                      <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                                        <Button
                                          variant="light"
                                          size="sm"
                                          className="delete-btn"
                                          onClick={() => handleDelete("sellers", s.id)}
                                        >
                                          <Trash />
                                        </Button>
                                      </OverlayTrigger>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="text-center">
                                  No sellers found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      )}

                      {activeTab === "auctions" && (
                        <Table responsive className="custom-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Product</th>
                              <th>Seller</th>
                              <th>Current Price</th>
                              <th>End Time</th>
                              <th>Status</th>
                              <th>Payment</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredData("auctions").length > 0 ? (
                              filteredData("auctions").map((a) => (
                                <tr key={a.id} className="table-row-animated">
                                  <td className="id-cell">{a.id}</td>
                                  <td>{a.productName}</td>
                                  <td>{a.seller}</td>
                                  <td>{a.formattedPrice}</td>
                                  <td>{a.endTime}</td>
                                  <td>
                                    <Badge bg={a.isActive ? "success" : "danger"} className="status-badge">
                                      {a.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge
                                      bg={
                                        a.paymentStatus === "Paid"
                                          ? "success"
                                          : a.paymentStatus === "Pending"
                                            ? "warning"
                                            : "danger"
                                      }
                                      className="status-badge"
                                    >
                                      {a.paymentStatus}
                                    </Badge>
                                  </td>
                                  <td>
                                    <div className="action-buttons">
                                      <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
                                        <Button
                                          variant="light"
                                          size="sm"
                                          className="edit-btn"
                                          onClick={() => handleEditItem("auctions", a.id)}
                                        >
                                          <Pencil />
                                        </Button>
                                      </OverlayTrigger>
                                      <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                                        <Button
                                          variant="light"
                                          size="sm"
                                          className="delete-btn"
                                          onClick={() => handleDelete("auctions", a.id)}
                                        >
                                          <Trash />
                                        </Button>
                                      </OverlayTrigger>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="8" className="text-center">
                                  No auctions found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      )}
                    </>
                  ) : (
                    <div className="grid-view">
                      <Row>
                        {activeTab === "users" &&
                          filteredData("users").map((user) => (
                            <Col lg={4} md={6} sm={12} key={user.id} className="grid-item-col">
                              <Card className="grid-item">
                                <Card.Body>
                                  <div className="grid-item-header">
                                    <div className="avatar">{user.displayName ? user.displayName[0] : "U"}</div>
                                    <div className="item-actions">
                                      <Button
                                        variant="light"
                                        size="sm"
                                        className="edit-btn"
                                        onClick={() => handleEditItem("users", user.id)}
                                      >
                                        <Pencil />
                                      </Button>
                                      <Button
                                        variant="light"
                                        size="sm"
                                        className="delete-btn"
                                        onClick={() => handleDelete("users", user.id)}
                                      >
                                        <Trash />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="grid-item-content">
                                    <h4>{user.displayName || "No Name"}</h4>
                                    <p>{user.email}</p>
                                    <p className="text-muted">ID: {user.id}</p>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}

                        {activeTab === "sellers" &&
                          filteredData("sellers").map((seller) => (
                            <Col lg={4} md={6} sm={12} key={seller.id} className="grid-item-col">
                              <Card className="grid-item">
                                <Card.Body>
                                  <div className="grid-item-header">
                                    <div className="avatar seller-avatar">
                                      {seller.businessName ? seller.businessName[0] : "S"}
                                    </div>
                                    <div className="item-actions">
                                      <Button
                                        variant="light"
                                        size="sm"
                                        className="edit-btn"
                                        onClick={() => handleEditItem("sellers", seller.id)}
                                      >
                                        <Pencil />
                                      </Button>
                                      <Button
                                        variant="light"
                                        size="sm"
                                        className="delete-btn"
                                        onClick={() => handleDelete("sellers", seller.id)}
                                      >
                                        <Trash />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="grid-item-content">
                                    <h4>{seller.businessName || "No Business Name"}</h4>
                                    <p>{seller.email}</p>
                                    <p className="text-muted">ID: {seller.id}</p>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}

                        {activeTab === "auctions" &&
                          filteredData("auctions").map((auction) => (
                            <Col lg={4} md={6} sm={12} key={auction.id} className="grid-item-col">
                              <Card className="grid-item">
                                <Card.Body>
                                  <div className="grid-item-header">
                                    <Badge bg={auction.isActive ? "success" : "danger"} className="status-badge">
                                      {auction.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    <div className="item-actions">
                                      <Button
                                        variant="light"
                                        size="sm"
                                        className="edit-btn"
                                        onClick={() => handleEditItem("auctions", auction.id)}
                                      >
                                        <Pencil />
                                      </Button>
                                      <Button
                                        variant="light"
                                        size="sm"
                                        className="delete-btn"
                                        onClick={() => handleDelete("auctions", auction.id)}
                                      >
                                        <Trash />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="grid-item-content">
                                    <h4>{auction.productName}</h4>
                                    <p>Seller: {auction.seller}</p>
                                    <p>Price: {auction.formattedPrice}</p>
                                    <p>Ends: {auction.endTime}</p>
                                    <Badge
                                      bg={
                                        auction.paymentStatus === "Paid"
                                          ? "success"
                                          : auction.paymentStatus === "Pending"
                                            ? "warning"
                                            : "danger"
                                      }
                                      className="payment-badge"
                                    >
                                      {auction.paymentStatus}
                                    </Badge>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                      </Row>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Modal for Add/Edit Operations */}
      <Modal
        show={showModal.show}
        onHide={() => setShowModal({ type: "", show: false, mode: "add", itemId: null })}
        className="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {showModal.mode === "add"
              ? `Add New ${showModal.type.slice(0, -1)}`
              : `Edit ${showModal.type.slice(0, -1)}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showModal.type === "users" && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={newItem.email || ""}
                  onChange={(e) => setNewItem({ ...newItem, email: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Display Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newItem.displayName || ""}
                  onChange={(e) => setNewItem({ ...newItem, displayName: e.target.value })}
                />
              </Form.Group>
            </Form>
          )}

          {showModal.type === "sellers" && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={newItem.email || ""}
                  onChange={(e) => setNewItem({ ...newItem, email: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Business Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newItem.businessName || ""}
                  onChange={(e) => setNewItem({ ...newItem, businessName: e.target.value })}
                  required
                />
              </Form.Group>
            </Form>
          )}

          {showModal.type === "auctions" && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Product Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newItem.productName || ""}
                  onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Seller Email</Form.Label>
                <Form.Control
                  type="email"
                  value={newItem.seller || ""}
                  onChange={(e) => setNewItem({ ...newItem, seller: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Current Price ($)</Form.Label>
                <Form.Control
                  type="number"
                  value={newItem.currentPrice || ""}
                  onChange={(e) => setNewItem({ ...newItem, currentPrice: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={newItem.endTimeForInput || newItem.endTime || ""}
                  onChange={(e) => setNewItem({ ...newItem, endTimeForInput: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Payment Status</Form.Label>
                <Form.Select
                  value={newItem.paymentStatus || "Pending"}
                  onChange={(e) => setNewItem({ ...newItem, paymentStatus: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Active"
                  checked={newItem.isActive || false}
                  onChange={(e) => setNewItem({ ...newItem, isActive: e.target.checked })}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal({ type: "", show: false, mode: "add", itemId: null })}
          >
            Close
          </Button>
          <Button variant="primary" onClick={handleModalSubmit}>
            {showModal.mode === "add" ? "Add" : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AdminDashboard

