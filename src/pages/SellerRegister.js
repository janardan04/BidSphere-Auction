// src/pages/SellerRegister.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../firebase/firebaseConfig';
import '../styles/seller-reg.css';

const SellerRegister = () => {
    const [formData, setFormData] = useState({
        businessName: '',
        sellerName: '',
        sellerEmail: '',
        phone: '',
        sellerPass1: '',
        address: '',
        sellerCity: '',
        termsCheck: false,
    });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (formData.businessName.trim().length < 3) {
            newErrors.businessName = 'Business name must be at least 3 characters.';
        }

        if (formData.sellerName.trim().length < 5) {
            newErrors.sellerName = 'Name must be at least 5 characters.';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.sellerEmail.trim())) {
            newErrors.sellerEmail = 'Invalid email.';
        }

        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(formData.phone.trim())) {
            newErrors.phone = 'Phone number must be 10 digits.';
        }

        if (formData.sellerPass1.trim().length < 6) {
            newErrors.sellerPass1 = 'Password must be at least 6 characters.';
        }

        if (formData.address.trim().length < 10) {
            newErrors.address = 'Please enter a valid address (min 10 characters).';
        }

        if (!formData.sellerCity) {
            newErrors.sellerCity = 'Select a city.';
        }

        if (!formData.termsCheck) {
            newErrors.termsCheck = 'You must agree to the Terms and Conditions.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = (e) => {
        e.preventDefault();
        setFormError('');
        setErrors({});

        if (!validateForm()) return;

        const { businessName, sellerName, sellerEmail, phone, sellerPass1, address, sellerCity } = formData;

        createUserWithEmailAndPassword(auth, sellerEmail, sellerPass1)
            .then((userCredential) => {
                const user = userCredential.user;
                return Promise.all([
                    updateProfile(user, { displayName: businessName }),
                    set(ref(database, 'sellers/' + user.uid), {
                        businessName,
                        sellerName,
                        email: sellerEmail,
                        phone,
                        address,
                        city: sellerCity,
                        role: 'seller',
                        approved: false,
                        dateJoined: new Date().toISOString(),
                    }),
                ]);
            })
            .then(() => {
                console.log('Seller registered successfully');
                navigate('/seller-login');
            })
            .catch((error) => {
                setFormError(error.message);
            });
    };

    return (
        <main className="my-5">
            <div className="">
                <div className="seller-reg-card">
                    <div className="seller-header animate__animated animate__fadeInDown">
                        <div className="seller-badge">
                            <i className="fas fa-store me-2"></i>Sellers Portal
                        </div>
                        <h2>
                            <i className="fas fa-user-tie me-2"></i>Become a Seller
                        </h2>
                        <p className="text-muted">List your products on BidSphere</p>
                    </div>

                    {formError && (
                        <div
                            id="errorMessage"
                            className="alert alert-danger alert-dismissible fade show animate__animated animate__slideInLeft"
                            role="alert"
                        >
                            <i className="fas fa-exclamation-circle me-2"></i>
                            <span id="errorText">{formError}</span>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="alert"
                                aria-label="Close"
                                onClick={() => setFormError('')}
                            ></button>
                        </div>
                    )}

                    <form id="sellerRegisterForm" onSubmit={handleRegister} className="needs-validation" noValidate>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-floating mb-3">
                                    <input
                                        type="text"
                                        name="businessName"
                                        className="form-control"
                                        id="businessName"
                                        placeholder="Enter your business name"
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        required
                                    />
                                    <label htmlFor="businessName">
                                        <i className="fas fa-store me-2"></i>Business Name
                                    </label>
                                    {errors.businessName && (
                                        <div id="businessNameError" className="text-danger">
                                            {errors.businessName}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-floating mb-3">
                                    <input
                                        type="text"
                                        name="sellerName"
                                        className="form-control"
                                        id="sellerName"
                                        placeholder="Enter your full name"
                                        value={formData.sellerName}
                                        onChange={handleChange}
                                        required
                                    />
                                    <label htmlFor="sellerName">
                                        <i className="fas fa-user me-2"></i>Your Full Name
                                    </label>
                                    {errors.sellerName && (
                                        <div id="sellerNameError" className="text-danger">
                                            {errors.sellerName}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-floating mb-3">
                                    <input
                                        type="email"
                                        name="sellerEmail"
                                        className="form-control"
                                        id="sellerEmail"
                                        placeholder="Enter your email"
                                        value={formData.sellerEmail}
                                        onChange={handleChange}
                                        required
                                    />
                                    <label htmlFor="sellerEmail">
                                        <i className="fas fa-envelope me-2"></i>Email Address
                                    </label>
                                    {errors.sellerEmail && (
                                        <div id="sellerEmailError" className="text-danger">
                                            {errors.sellerEmail}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-floating mb-3">
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-control"
                                        id="phone"
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                    <label htmlFor="phone">
                                        <i className="fas fa-phone me-2"></i>Phone Number
                                    </label>
                                    {errors.phone && (
                                        <div id="phoneError" className="text-danger">
                                            {errors.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-floating mb-3">
                            <input
                                type="password"
                                name="sellerPass1"
                                className="form-control"
                                id="sellerPass1"
                                placeholder="Create password"
                                value={formData.sellerPass1}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="sellerPass1">
                                <i className="fas fa-lock me-2"></i>Password
                            </label>
                            {errors.sellerPass1 && (
                                <div id="sellerPasswordError" className="text-danger">
                                    {errors.sellerPass1}
                                </div>
                            )}
                        </div>

                        <div className="form-floating mb-3">
                            <textarea
                                className="form-control"
                                name="address"
                                id="address"
                                style={{ height: '100px' }}
                                placeholder="Enter your address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                            ></textarea>
                            <label htmlFor="address">
                                <i className="fas fa-map-marker-alt me-2"></i>Full Address
                            </label>
                            {errors.address && (
                                <div id="addressError" className="text-danger">
                                    {errors.address}
                                </div>
                            )}
                        </div>

                        <div className="form-floating mb-4">
                            <select
                                name="sellerCity"
                                className="form-select"
                                id="sellerCity"
                                value={formData.sellerCity}
                                onChange={handleChange}
                                required
                            >
                                <option value="" disabled>
                                    Select City
                                </option>
                                <option>Pune</option>
                                <option>Mumbai</option>
                                <option>Bangalore</option>
                                <option>Chennai</option>
                                <option>Delhi</option>
                                <option>Hyderabad</option>
                                <option>Kolkata</option>
                                <option>Ahmedabad</option>
                                <option>Jaipur</option>
                                <option>Lucknow</option>
                                <option>Other</option>
                            </select>
                            <label htmlFor="sellerCity">
                                <i className="fas fa-city me-2"></i>City
                            </label>
                            {errors.sellerCity && (
                                <div id="sellerCityError" className="text-danger">
                                    {errors.sellerCity}
                                </div>
                            )}
                        </div>

                        <div className="mb-4 form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="termsCheck"
                                name="termsCheck"
                                checked={formData.termsCheck}
                                onChange={handleChange}
                                required
                            />
                            <label className="form-check-label" htmlFor="termsCheck">
                                I agree to the{' '}
                                <a href="#" data-bs-toggle="modal" data-bs-target="#termsModal">
                                    Terms and Conditions
                                </a>{' '}
                                for sellers
                            </label>
                            {errors.termsCheck && (
                                <div className="text-danger">{errors.termsCheck}</div>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary w-100">
                            Register as Seller
                        </button>

                        <div className="text-center mt-3">
                            <p>
                                Already registered as a seller?{' '}
                                <Link to="/seller-login">Login here</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Terms and Conditions Modal */}
            <div
                className="modal fade"
                id="termsModal"
                tabIndex="-1"
                aria-labelledby="termsModalLabel"
                aria-hidden="true"
            >
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="termsModalLabel">
                                Seller Terms and Conditions
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            ></button>
                        </div>
                        <div className="modal-body">
                            <h6>1. Seller Registration</h6>
                            <p>
                                By registering as a seller on BidSphere, you agree to provide accurate
                                and complete information. You are responsible for maintaining the
                                confidentiality of your account information.
                            </p>

                            <h6>2. Product Listings</h6>
                            <p>
                                All products listed must be accurately described with clear images.
                                Prohibited items include illegal goods, counterfeit products, and
                                dangerous substances.
                            </p>

                            <h6>3. Payment and Fees</h6>
                            <p>
                                BidSphere charges a commission on successful sales. Payment
                                processing fees may apply. Sellers receive payment after the auction
                                is completed and the buyer has received the item.
                            </p>

                            <h6>4. Shipping and Fulfillment</h6>
                            <p>
                                Sellers are responsible for shipping items promptly after payment is
                                received. Appropriate packaging and insurance are the seller's
                                responsibility.
                            </p>

                            <h6>5. Returns and Refunds</h6>
                            <p>
                                Sellers must honor the return policy stated in their listings. If an
                                item is significantly different from its description, refunds may be
                                required.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                data-bs-dismiss="modal"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default SellerRegister;