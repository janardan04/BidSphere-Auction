"use client";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Form,
  Modal,
  Nav,
  Badge,
  Spinner,
  Dropdown,
} from "react-bootstrap";
import {
  PeopleFill,
  Shop,
  TagFill,
  Search,
  PlusCircle,
  Trash,
  Pencil,
  BoxArrowRight,
  ArrowClockwise,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import { useAdminDashboard } from "../utils/useAdminDashboard";
import "../styles/admin-dashboard.css";

const AdminDashboard = () => {
  const {
    error,
    loading,
    showModal,
    newItem,
    searchTerm,
    activeTab,
    stats,
    setSearchTerm,
    setActiveTab,
    fetchData,
    handleEditItem,
    handleDelete,
    handleAdd,
    handleModalSubmit,
    handleLogout,
    setNewItem,
    setShowModal,
    getFilteredData,
  } = useAdminDashboard();

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="main-content">
        <div className="top-bar">
          <div className="nav-search-container">
            <Nav className="me-3">
              <Nav.Link
                className={activeTab === "users" ? "active" : ""}
                onClick={() => setActiveTab("users")}
              >
                <PeopleFill className="nav-icon" /> Users
              </Nav.Link>
              <Nav.Link
                className={activeTab === "sellers" ? "active" : ""}
                onClick={() => setActiveTab("sellers")}
              >
                <Shop className="nav-icon" /> Sellers
              </Nav.Link>
              <Nav.Link
                className={activeTab === "auctions" ? "active" : ""}
                onClick={() => setActiveTab("auctions")}
              >
                <TagFill className="nav-icon" /> Auctions
              </Nav.Link>
            </Nav>
            <div className="search-container">
              <div className="search-box">
                <Search className="search-icon" />
                <Form.Control
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          <div className="admin-profile">
            <span className="admin-name">Admin</span>
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="link"
                id="dropdown-basic"
                className="avatar-dropdown"
              >
                <div className="avatar">Jay</div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-menu-animated">
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <BoxArrowRight className="dropdown-icon" /> Logout
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
            <Col lg={3} md={6} sm={6}>
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
            <Col lg={3} md={6} sm={6}>
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
            <Col lg={3} md={6} sm={6}>
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
            <Col lg={3} md={6} sm={6}>
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
                  {activeTab === "users"
                    ? "User Management"
                    : activeTab === "sellers"
                    ? "Seller Management"
                    : "Auction Management"}
                </h3>
                <div className="header-actions">
                  <Button
                    variant="outline-primary"
                    onClick={fetchData}
                    disabled={loading}
                  >
                    <ArrowClockwise className={loading ? "spin" : ""} />
                  </Button>
                  <Button variant="primary" onClick={() => handleAdd(activeTab)}>
                    <PlusCircle className="button-icon" /> <span>Add New</span>
                  </Button>
                </div>
              </div>
            </Card.Header>

            <Card.Body className="data-table-container">
              {loading ? (
                <div className="text-center py-5 loading-container">
                  <Spinner
                    animation="border"
                    variant="primary"
                    className="custom-spinner"
                  />
                  <p className="mt-2">Loading data...</p>
                </div>
              ) : (
                <div className="grid-view">
                  <Row>
                    {activeTab === "users" &&
                      getFilteredData("users").map((user) => (
                        <Col
                          lg={4}
                          md={6}
                          sm={12}
                          key={user.id}
                          className="grid-item-col"
                        >
                          <Card className="grid-item">
                            <Card.Body>
                              <div className="grid-item-header">
                                <div className="avatar">
                                  {user.name ? user.name[0] : "U"}
                                </div>
                                <div className="item-actions">
                                  <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() => handleEditItem("users", user.id)}
                                  >
                                    <Pencil />
                                  </Button>
                                  <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() => handleDelete("users", user.id)}
                                  >
                                    <Trash />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid-item-content">
                                <h4>{user.name}</h4>
                                <p>{user.email}</p>
                                <p className="text-muted">ID: {user.id}</p>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    {activeTab === "sellers" &&
                      getFilteredData("sellers").map((seller) => (
                        <Col
                          lg={4}
                          md={6}
                          sm={12}
                          key={seller.id}
                          className="grid-item-col"
                        >
                          <Card className="grid-item">
                            <Card.Body>
                              <div className="grid-item-header">
                                <div className="avatar seller-avatar">
                                  {seller.businessName
                                    ? seller.businessName[0]
                                    : "S"}
                                </div>
                                <div className="item-actions">
                                  <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() =>
                                      handleEditItem("sellers", seller.id)
                                    }
                                  >
                                    <Pencil />
                                  </Button>
                                  <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() =>
                                      handleDelete("sellers", seller.id)
                                    }
                                  >
                                    <Trash />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid-item-content">
                                <h4>
                                  {seller.businessName || "No Business Name"}
                                </h4>
                                <p>{seller.email}</p>
                                <p className="text-muted">ID: {seller.id}</p>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    {activeTab === "auctions" &&
                      getFilteredData("auctions").map((auction) => (
                        <Col
                          lg={4}
                          md={6}
                          sm={12}
                          key={auction.id}
                          className="grid-item-col"
                        >
                          <Card className="grid-item">
                            <Card.Body>
                              <div className="grid-item-header">
                                <Badge
                                  bg={auction.isActive ? "success" : "danger"}
                                >
                                  {auction.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <div className="item-actions">
                                  <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() =>
                                      handleEditItem("auctions", auction.id)
                                    }
                                  >
                                    <Pencil />
                                  </Button>
                                  <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() =>
                                      handleDelete("auctions", auction.id)
                                    }
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
            </Card.Body>
          </Card>
        </div>
      </div>

      <Modal
        show={showModal.show}
        onHide={() =>
          setShowModal({ type: "", show: false, mode: "add", itemId: null })
        }
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
                  onChange={(e) =>
                    setNewItem({ ...newItem, email: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Display Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newItem.name || ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
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
                  onChange={(e) =>
                    setNewItem({ ...newItem, email: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Business Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newItem.businessName || ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, businessName: e.target.value })
                  }
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
                  onChange={(e) =>
                    setNewItem({ ...newItem, productName: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Seller Email</Form.Label>
                <Form.Control
                  type="email"
                  value={newItem.seller || ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, seller: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Current Price (₹)</Form.Label>
                <Form.Control
                  type="number"
                  value={newItem.currentPrice || ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, currentPrice: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={newItem.endTimeForInput || newItem.endTime || ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, endTimeForInput: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Payment Status</Form.Label>
                <Form.Select
                  value={newItem.paymentStatus || "Pending"}
                  onChange={(e) =>
                    setNewItem({ ...newItem, paymentStatus: e.target.value })
                  }
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
                  onChange={(e) =>
                    setNewItem({ ...newItem, isActive: e.target.checked })
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() =>
              setShowModal({ type: "", show: false, mode: "add", itemId: null })
            }
          >
            Close
          </Button>
          <Button variant="primary" onClick={handleModalSubmit}>
            {showModal.mode === "add" ? "Add" : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;