import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "../styles/header.css";

const Header = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [isNavCollapsed, setIsNavCollapsed] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        signOut(auth)
            .then(() => {
                navigate("/");
                closeNavbar();
            })
            .catch((error) => {
                console.error("Logout error:", error);
            });
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
                                <li className="nav-item">
                                    <button 
                                        className="nav-link nav-button" 
                                        onClick={() => navigateTo("/profile")}
                                    >
                                        Profile
                                    </button>
                                </li>
                                {user.email === "janardhanborse2003@gmail.com" && (
                                    <li className="nav-item">
                                        <button 
                                            className="nav-link nav-button" 
                                            onClick={() => navigateTo("/admin-dashboard")}
                                        >
                                            Admin Dashboard
                                        </button>
                                    </li>
                                )}
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