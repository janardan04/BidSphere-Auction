// src/pages/AboutUs.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/about.css';

const AboutUs = () => {
    const currentYear = new Date().getFullYear();

    return (
        <div>
            <div className="container">
                <h1>About Us</h1>
                <p>
                    Welcome to our Online Auction System! We are a dedicated team working to provide a seamless, secure, and user-friendly platform for buying and selling items through online auctions. Our mission is to connect buyers and sellers from around the world, ensuring a fair and enjoyable experience for everyone involved.
                </p>
                <p>
                    This project is built with passion and innovation, leveraging modern technologies to create an efficient auction system. Whether you're here to bid on your favorite items or list something for sale, we’ve got you covered!
                </p>

                <div className="team">
                    <h2>Our Team</h2>
                    <div className="team-member">Janardan Borse</div>
                    <div className="team-member">Vivek Bhandare</div>
                </div>
            </div>

            <footer>
                © {currentYear} BidSphere. All rights reserved.
            </footer>
        </div>
    );
};

export default AboutUs;