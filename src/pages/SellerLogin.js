// src/pages/SellerLogin.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../firebase/firebaseConfig';
import { validateEmail, validatePassword, getFirebaseAuthErrorMessage } from '../utils/validation';
import '../styles/sellerlogin.css';

const SellerLogin = () => {
    const [formData, setFormData] = useState({
        sellerEmail: '',
        sellerPassword: '',
        sellerRemember: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear field error on change
        if (name === 'sellerEmail') setFieldErrors((prev) => ({ ...prev, email: '' }));
        if (name === 'sellerPassword') setFieldErrors((prev) => ({ ...prev, password: '' }));
    };

    const validateForm = () => {
        const errors = {
            email: validateEmail(formData.sellerEmail),
            password: validatePassword(formData.sellerPassword),
        };
        setFieldErrors(errors);
        return !errors.email && !errors.password;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) return;

        setLoading(true);
        const { sellerEmail, sellerPassword } = formData;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, sellerEmail, sellerPassword);
            const user = userCredential.user;
            const sellerRef = ref(database, `sellers/${user.uid}`);
            const snapshot = await get(sellerRef);

            if (snapshot.exists()) {
                setSuccess('Login successful!');
                setTimeout(() => {
                    navigate('/seller-dashboard');
                }, 1500);
            } else {
                // Check if they are a regular user
                const userRef = ref(database, `users/${user.uid}`);
                const userSnap = await get(userRef);

                if (userSnap.exists()) {
                    setError('This account is registered as a user. Please use the User Login page.');
                } else {
                    setError('This account is not registered as a seller.');
                }
                await auth.signOut();
            }
        } catch (err) {
            setError(getFirebaseAuthErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <main className="my-5">
            <div className="seller-login-container">
                <div className="seller-login-card">
                    <div className="seller-login-header animate__animated animate__fadeInDown">
                        <div className="seller-badge">
                            <i className="fas fa-store me-2"></i>Sellers Portal
                        </div>
                        <h2>
                            <i className="fas fa-user-tie me-2"></i>Seller Login
                        </h2>
                        <p className="text-muted">Access your seller account</p>
                    </div>

                    {error && (
                        <div
                            id="errorMessage"
                            className="alert alert-danger alert-dismissible fade show animate__animated animate__slideInLeft"
                            role="alert"
                        >
                            <i className="fas fa-exclamation-circle me-2"></i>
                            <span id="errorText">{error}</span>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="alert"
                                aria-label="Close"
                                onClick={() => setError('')}
                            ></button>
                        </div>
                    )}

                    {success && (
                        <div
                            id="successMessage"
                            className="alert alert-success alert-dismissible fade show animate__animated animate__slideInLeft"
                            role="alert"
                        >
                            <i className="fas fa-check-circle me-2"></i>
                            <span id="successText">{success}</span>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="alert"
                                aria-label="Close"
                                onClick={() => setSuccess('')}
                            ></button>
                        </div>
                    )}

                    <form id="sellerLoginForm" onSubmit={handleLogin}>
                        <div
                            className="form-floating mb-3 animate__animated animate__fadeIn"
                            style={{ animationDelay: '0.2s' }}
                        >
                            <input
                                type="email"
                                className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                id="sellerEmail"
                                name="sellerEmail"
                                placeholder="name@example.com"
                                value={formData.sellerEmail}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="sellerEmail">
                                <i className="fas fa-envelope me-2"></i>Email address
                            </label>
                            {fieldErrors.email && (
                                <div className="invalid-feedback">{fieldErrors.email}</div>
                            )}
                        </div>

                        <div
                            className="form-floating mb-4 animate__animated animate__fadeIn"
                            style={{ animationDelay: '0.4s' }}
                        >
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`form-control password-toggle ${fieldErrors.password ? 'is-invalid' : ''}`}
                                id="sellerPassword"
                                name="sellerPassword"
                                placeholder="Password"
                                value={formData.sellerPassword}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="sellerPassword">
                                <i className="fas fa-lock me-2"></i>Password
                            </label>
                            <div
                                className="password-toggle-icon position-absolute end-0 top-50 translate-middle-y me-3"
                                onClick={togglePasswordVisibility}
                                style={{ cursor: 'pointer', zIndex: 5 }}
                            >
                                <i
                                    className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} text-muted`}
                                ></i>
                            </div>
                            {fieldErrors.password && (
                                <div className="invalid-feedback">{fieldErrors.password}</div>
                            )}
                        </div>

                        <div
                            className="d-flex justify-content-between align-items-center mb-4 animate__animated animate__fadeIn"
                            style={{ animationDelay: '0.6s' }}
                        >
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="sellerRemember"
                                    name="sellerRemember"
                                    checked={formData.sellerRemember}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor="sellerRemember">
                                    Remember me
                                </label>
                            </div>
                            <Link to="/forgot-password" className="btn-link">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-seller-signin w-100 mb-4 animate__animated animate__bounceIn"
                            style={{ animationDelay: '0.8s' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt me-2"></i>Seller Sign In
                                </>
                            )}
                        </button>

                        <div
                            className="text-center animate__animated animate__fadeIn"
                            style={{ animationDelay: '1s' }}
                        >
                            <p>
                                Not registered as a seller?{' '}
                                <Link to="/seller-register" className="register-link">
                                    Register now
                                </Link>
                            </p>
                            <p className="mt-3">
                                <Link to="/login" className="text-muted">
                                    <i className="fas fa-user me-1"></i>Regular User Login
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default SellerLogin;