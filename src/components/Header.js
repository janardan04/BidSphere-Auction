import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listenForUserNotifications, markAllNotificationsRead } from "../utils/notificationService";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "../styles/header.css";

const Header = () => {
    const { user, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const [isNavCollapsed, setIsNavCollapsed] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Listen for real-time notifications
    useEffect(() => {
        if (user) {
            const unsubscribe = listenForUserNotifications(user.uid, (notifs) => {
                setNotifications(notifs);
            });
            return () => unsubscribe();
        } else {
            setNotifications([]);
        }
    }, [user]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/");
            closeNavbar();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const navigateTo = (path) => {
        navigate(path);
        closeNavbar();
    };

    const closeNavbar = () => {
        if (window.innerWidth < 992) {
            setIsNavCollapsed(true);
        }
    };

    const handleMarkAllRead = async () => {
        if (user) {
            await markAllNotificationsRead(user.uid);
        }
    };

    return (
        <header>
            <nav className="custom-header navbar navbar-expand-lg">
                <button 
                    className="navbar-brand nav-button" 
                    onClick={() => navigateTo("/")}
                >
                    <span className="fw-bold text-primary">BidSphere</span>
                </button>
                <button
                    className="navbar-toggler"
                    type="button"
                    onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                    aria-controls="navbarNav"
                    aria-expanded={!isNavCollapsed}
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navbarNav">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <button 
                                className="nav-link active nav-button" 
                                onClick={() => navigateTo("/")}
                            >
                                Home
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className="nav-link nav-button" 
                                onClick={() => navigateTo("/about-us")}
                            >
                                About
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className="nav-link nav-button" 
                                onClick={() => navigateTo("/contact")}
                            >
                                Contact
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className="nav-link nav-button" 
                                onClick={() => navigateTo("/auctions")}
                            >
                                Auctions
                            </button>
                        </li>
                        {!user && (
                            <>
                                <li className="nav-item">
                                    <button 
                                        className="nav-link nav-button" 
                                        onClick={() => navigateTo("/login")}
                                    >
                                        User Login
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className="nav-link nav-button" 
                                        onClick={() => navigateTo("/seller-login")}
                                    >
                                        Seller Login
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className="nav-link nav-button" 
                                        onClick={() => navigateTo("/admin-login")}
                                    >
                                        Admin Login
                                    </button>
                                </li>
                            </>
                        )}
                        {user && (
                            <>
                                {/* Profile link for all logged-in users */}
                                <li className="nav-item">
                                    <button 
                                        className="nav-link nav-button" 
                                        onClick={() => navigateTo("/profile")}
                                    >
                                        Profile
                                    </button>
                                </li>
                                {userRole === 'seller' && (
                                    <li className="nav-item">
                                        <button 
                                            className="nav-link nav-button" 
                                            onClick={() => navigateTo("/seller-dashboard")}
                                        >
                                            Seller Dashboard
                                        </button>
                                    </li>
                                )}
                                {userRole === 'admin' && (
                                    <li className="nav-item">
                                        <button 
                                            className="nav-link nav-button" 
                                            onClick={() => navigateTo("/admin-dashboard")}
                                        >
                                            Admin Dashboard
                                        </button>
                                    </li>
                                )}
                                {/* Notification bell */}
                                <li className="nav-item position-relative">
                                    <button
                                        className="nav-link nav-button"
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        title="Notifications"
                                    >
                                        <i className="fas fa-bell"></i>
                                        {unreadCount > 0 && (
                                            <span className="badge bg-danger rounded-pill notification-badge">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    {showNotifications && (
                                        <div className="notification-dropdown">
                                            <div className="notification-header">
                                                <h6 className="mb-0">Notifications</h6>
                                                {unreadCount > 0 && (
                                                    <button
                                                        className="btn btn-sm btn-link"
                                                        onClick={handleMarkAllRead}
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="notification-list">
                                                {notifications.length > 0 ? (
                                                    notifications.slice(0, 10).map((notif) => (
                                                        <div
                                                            key={notif.id}
                                                            className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                                        >
                                                            <div className="notification-title">{notif.title}</div>
                                                            <div className="notification-message">{notif.message}</div>
                                                            <div className="notification-time">
                                                                {new Date(notif.timestamp).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="notification-empty">
                                                        <i className="fas fa-bell-slash"></i>
                                                        <p>No notifications yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className="nav-link nav-button logout-button" 
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>         
                    {user && (
                        <span className="navbar-text ms-3 user-display">
                            <b>{user.displayName || user.email}</b>
                        </span>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
