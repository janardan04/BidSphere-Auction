// src/pages/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import '../styles/login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                setSuccess('Login successful!');
                setTimeout(() => {
                    navigate('/auctions'); // Redirect to view-products equivalent
                }, 1000);
            })
            .catch((error) => {
                setError(error.message);
            });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div>
            <main className="my-5">
                <div className="login-container">
                    <div className="login-card">
                        <div className="login-header animate__animated animate__fadeInDown">
                            <h2>
                                <i className="fas fa-user-circle me-2"></i>Welcome Back
                            </h2>
                            <p className="text-muted">Sign in to your BidSphere account</p>
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

                        <form id="loginForm" onSubmit={handleSubmit}>
                            <div
                                className="form-floating mb-3 animate__animated animate__fadeIn"
                                style={{ animationDelay: '0.2s' }}
                            >
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    name="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <label htmlFor="email">
                                    <i className="fas fa-envelope me-2"></i>Email address
                                </label>
                            </div>

                            <div
                                className="form-floating mb-4 animate__animated animate__fadeIn position-relative"
                                style={{ animationDelay: '0.4s' }}
                            >
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control password-toggle"
                                    id="password"
                                    name="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <label htmlFor="password">
                                    <i className="fas fa-lock me-2"></i>Password
                                </label>
                                <div
                                    className="password-toggle-icon position-absolute end-0 top-50 translate-middle-y me-3"
                                    onClick={togglePasswordVisibility}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <i
                                        className={`fas ${
                                            showPassword ? 'fa-eye' : 'fa-eye-slash'
                                        } text-muted`}
                                    ></i>
                                </div>
                            </div>

                            <div
                                className="d-flex justify-content-between align-items-center mb-4 animate__animated animate__fadeIn"
                                style={{ animationDelay: '0.6s' }}
                            >
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="remember"
                                        name="remember"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="remember">
                                        Remember me
                                    </label>
                                </div>
                                <Link to="/forgot-password" className="btn-link">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-signin w-100 mb-4 animate__animated animate__bounceIn"
                                style={{ animationDelay: '0.8s' }}
                            >
                                <i className="fas fa-sign-in-alt me-2"></i>Sign In
                            </button>

                            <div
                                className="text-center animate__animated animate__fadeIn"
                                style={{ animationDelay: '1s' }}
                            >
                                <p>
                                    Don't have an account?{' '}
                                    <Link to="/register" className="register-link">
                                        Register now
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Login;