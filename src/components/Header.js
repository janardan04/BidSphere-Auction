import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { listenForUserNotifications, markAllNotificationsRead, markAllSellerNotificationsRead, deleteIndividualNotification, clearAllNotifications } from "../utils/notificationService";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "../styles/header.css";

const Header = () => {
    const { user, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const [isNavCollapsed, setIsNavCollapsed] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef(null);

    // Listen for real-time notifications
    useEffect(() => {
        let unsubscribeUser = () => {};
        let unsubscribeSeller = () => {};

        if (user) {
            // Listen for regular user notifications
            unsubscribeUser = listenForUserNotifications(user.uid, (userNotifs) => {
                setNotifications((prev) => {
                    // Merge and sort
                    const merged = [...userNotifs, ...prev.filter(n => n.isSellerNotif)];
                    return merged.sort((a, b) => b.timestamp - a.timestamp);
                });
            });

            // If seller, also listen for seller notifications
            if (userRole === 'seller' && user.email) {
                const notificationsRef = ref(database, "notifications");
                unsubscribeSeller = onValue(notificationsRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const notificationsData = snapshot.val();
                        const sellerNotifications = Object.entries(notificationsData)
                            .filter(([_, notification]) => notification.sellerEmail === user.email)
                            .map(([id, notification]) => ({
                                id,
                                message: notification.message,
                                title: notification.title || 'Notification',
                                timestamp: notification.timestamp,
                                read: notification.read,
                                isSellerNotif: true
                            }));
                            
                        setNotifications((prev) => {
                            // Merge and sort
                            const merged = [...prev.filter(n => !n.isSellerNotif), ...sellerNotifications];
                            return merged.sort((a, b) => b.timestamp - a.timestamp);
                        });
                    } else {
                        // If the entire seller notification node is completely empty / deleted, clear them out
                        setNotifications((prev) => prev.filter(n => !n.isSellerNotif));
                    }
                });
            }
        } else {
            setNotifications([]);
        }

        return () => {
            unsubscribeUser();
            unsubscribeSeller();
        };
    }, [user, userRole]);

    // Handle clicks outside the notification bell
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
            if (userRole === 'seller' && user.email) {
                await markAllSellerNotificationsRead(user.email);
            }
        }
    };

    const handleClearAll = async () => {
        if (user) {
            const isSeller = userRole === 'seller';
            await clearAllNotifications(user.uid, user.email, isSeller);
            setShowNotifications(false); // Close dropdown after clearing
        }
    };

    const handleDeleteNotification = async (e, notifId, isSellerNotif) => {
        e.stopPropagation(); // Prevent dropdown from closing if clicking on the panel
        if (user) {
            await deleteIndividualNotification(user.uid, notifId, isSellerNotif);
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
                                <li className="nav-item position-relative" ref={notificationsRef}>
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
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-link text-primary me-2 p-0"
                                                            onClick={handleMarkAllRead}
                                                            title="Mark all read"
                                                        >
                                                            <i className="fas fa-check-double me-1"></i> Read All
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-link text-danger p-0"
                                                            onClick={handleClearAll}
                                                            title="Clear all notifications"
                                                        >
                                                            <i className="fas fa-trash-alt me-1"></i> Clear All
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            <div className="notification-list">
                                                {notifications.length > 0 ? (
                                                    notifications.slice(0, 10).map((notif) => (
                                                        <div
                                                            key={notif.id}
                                                            className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                                        >
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div className="notification-title fw-bold mb-1">{notif.title}</div>
                                                                <button 
                                                                    className="btn btn-sm btn-link text-muted p-0 ms-2" 
                                                                    onClick={(e) => handleDeleteNotification(e, notif.id, notif.isSellerNotif)}
                                                                    title="Delete notification"
                                                                >
                                                                    <i className="fas fa-times"></i>
                                                                </button>
                                                            </div>
                                                            <div className="notification-message text-muted small mb-1">{notif.message}</div>
                                                            <div className="notification-time text-xs text-muted">
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
