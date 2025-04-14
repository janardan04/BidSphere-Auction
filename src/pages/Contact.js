// src/pages/Contact.js
import React from 'react';

const Contact = () => {
    return (
        <div className="container my-5"  >
            <h1 className="text-center mb-4">Contact Us</h1>
            <p className="lead text-center">
                Have questions or need assistance with BidSphere? Feel free to reach out to us! Our team is here to help you with any inquiries about our online auction platform.
            </p>
            <div className="row justify-content-center mt-5">
                <div className="col-md-8">
                    <h2 className="text-center text-primary">Get in Touch</h2>
                    <ul className="list-group list-group-flush mb-4">
                        <li className="list-group-item">
                            <strong>Email:</strong> support@bidsphere.com
                        </li>
                        <li className="list-group-item">
                            <strong>Phone:</strong> +91-7038544159
                        </li>
                        <li className="list-group-item">
                            <strong>Address:</strong> 123 Auction Lane, Bid City, BC 45678
                        </li>
                    </ul>

                    <h2 className="text-center text-primary">Our Team</h2>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <div className="card h-100">
                                <div className="card-body">
                                    <h5 className="card-title">Janardan Borse</h5>
                                    <p className="card-text"><strong>Co-Founder</strong></p>
                                    <p className="card-text">
                                        Email:{' '}
                                        <a href="mailto:bidsphere@gmail.com">
                                            bidsphere@gmail.com
                                        </a>
                                    </p>
                                    <p className="card-text">Mobile: 7038544159</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-3">
                            <div className="card h-100">
                                <div className="card-body">
                                    <h5 className="card-title">Vivek Bhandare</h5>
                                    <p className="card-text"><strong>Co-Founder</strong></p>
                                    <p className="card-text">
                                        Email:{' '}
                                        <a href="mailto:vivek@bidsphere.com">
                                            vivek@bidsphere.com
                                        </a>
                                    </p>
                                    <p className="card-text">Mobile: [Contact Vivek for details]</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Contact;
