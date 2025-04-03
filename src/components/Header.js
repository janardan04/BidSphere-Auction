import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "../styles/header.css";

const Header = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

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
            })
            .catch((error) => {
                console.error("Logout error:", error);
            });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const searchQuery = e.target.querySelector(".search-input").value;
        console.log("Search query:", searchQuery);
        navigate(`/auctions?search=${searchQuery}`);
    };

    const navigateTo = (path) => {
        navigate(path);
    };

    return (
        <header>
            <nav className="custom-header navbar navbar-expand-lg">
                <button 
                    className="navbar-brand nav-button" 
                    onClick={() => navigateTo("/")}
                >
                    BidSphere
                </button>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
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
                        <span className="navbar-text ms-3">
                            <b>{user.displayName || user.email}</b>
                        </span>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;