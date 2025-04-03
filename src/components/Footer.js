// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
// import '../styles/footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer>
            <style>
                {`
                /* Main footer styling */
                footer {
                    position: relative;
                    z-index: 10;
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    color: #495057;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    border-top: 3px solid #87ceeb;
                    padding: 15px 0; /* Slightly increased padding for better spacing */
                    box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1);
                }

                .footer-top {
                    background: linear-gradient(to right, #87ceeb, #5dade2);
                    text-align: center;
                    padding: 10px 0;
                    transition: all 0.3s ease;
                }

                .footer-top:hover {
                    background: linear-gradient(to right, #5dade2, #3498db);
                    transform: scale(1.02); /* Slight zoom effect */
                }

                .footer-top a {
                    color: white;
                    font-weight: bold;
                    text-decoration: none;
                    display: inline-block;
                    padding: 8px 15px;
                    border-radius: 25px;
                    background-color: rgba(255, 255, 255, 0.2);
                    transition: all 0.3s ease, transform 0.3s ease;
                }

                .footer-top a:hover {
                    background-color: rgba(255, 255, 255, 0.3);
                    transform: translateY(-5px) scale(1.1); /* Lift and zoom effect */
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                }

                .footer-top a::after {
                    content: "↑";
                    margin-left: 8px;
                    font-size: 1.2em;
                    transition: transform 0.3s ease;
                    display: inline-block;
                }

                .footer-top a:hover::after {
                    transform: translateY(-5px) rotate(360deg); /* Rotate animation */
                }

                .footer-content {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    padding: 20px 5%;
                    background-color: rgba(255, 255, 255, 0.7);
                    border-radius: 10px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                }

                .footer-section {
                    flex: 1;
                    min-width: 200px;
                    margin: 10px;
                    transition: transform 0.3s ease;
                }

                .footer-section:hover {
                    transform: translateY(-5px); /* Lift effect on hover */
                }

                .footer-section h3 {
                    color: #0d6efd;
                    font-size: 1.3rem;
                    margin-bottom: 10px;
                    font-weight: 700;
                    position: relative;
                    padding-bottom: 5px;
                }

                .footer-section h3::after {
                    content: '';
                    position: center;
                    left: 0;
                    bottom: 0;
                    height: 3px;
                    width: 50px;
                    background: linear-gradient(to right, #87ceeb, #5dade2);
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }

                .footer-section:hover h3::after {
                    width: 70px;
                }

                .footer-section ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .footer-section ul li {
                    margin-bottom: 8px;
                    transition: transform 0.3s ease, color 0.3s ease;
                }

                .footer-section ul li:hover {
                    transform: translateX(5px); /* Slide effect on hover */
                    color: #0d6efd;
                }

                .footer-section ul li a {
                    color: #495057;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    display: inline-block;
                    position: relative;
                }

                .footer-section ul li a::after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 2px;
                    bottom: -2px;
                    left: 0;
                    background-color: #0d6efd;
                    transition: width 0.3s ease;
                }

                .footer-section ul li a:hover {
                    color: #0d6efd;
                }

                .footer-section ul li a:hover::after {
                    width: 100%;
                }

                .footer-bottom {
                    background-color: #e9ecef;
                    text-align: center;
                    padding: 10px 0;
                    font-size: 0.9rem;
                    border-top: 1px solid rgba(0, 0, 0, 0.1);
                }

                .footer-bottom p {
                    margin: 0;
                    color: #6c757d;
                }
                `}
            </style>
            <div className="footer-top">
                <a href="#">Back to Top</a>
            </div>

            <div className="footer-content">
                <div className="footer-section">
                    <h3>About Our Auction</h3>
                    <ul>
                        <li>
                            <a href="#">How It Works</a>
                        </li>
                        <li>
                            <Link to="/about-us">About Us</Link>
                        </li>
                        <li>
                            <a href="#">Success Stories</a>
                        </li>
                        <li>
                            <a href="#">Press & Media</a>
                        </li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h3>Buyer & Seller Guide</h3>
                    <ul>
                        <li>
                            <a href="#">How to Bid</a>
                        </li>
                        <li>
                            <Link to="/add-product">List an Item</Link>
                        </li>
                        <li>
                            <a href="#">Auction Rules</a>
                        </li>
                        <li>
                            <a href="#">Payment & Shipping</a>
                        </li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h3>Connect with Us</h3>
                    <ul>
                        <li>
                            <a href="#">
                                <i className="fab fa-facebook"></i> Facebook
                            </a>
                        </li>
                        <li>
                            <a href="#">
                                <i className="fab fa-twitter"></i> Twitter
                            </a>
                        </li>
                        <li>
                            <a href="#">
                                <i className="fab fa-instagram"></i> Instagram
                            </a>
                        </li>
                        <li>
                            <a href="#">
                                <i className="fab fa-linkedin"></i> LinkedIn
                            </a>
                        </li>
                    </ul>
                </div>

                
            </div>

            <div className="footer-bottom">
                <p>&copy; {currentYear} BidSphere | Your Trusted Bidding Platform</p>
            </div>
        </footer>
    );
};

export default Footer;