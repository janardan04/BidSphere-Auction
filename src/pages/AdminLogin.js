// src/pages/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../firebase/firebaseConfig';
import { validateEmail, validatePassword, getFirebaseAuthErrorMessage } from '../utils/validation';
import { Modal, Button } from 'react-bootstrap';
import '../styles/admin-login.css';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    // Forgot Password Modal
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    const validateForm = () => {
        const errors = {
            email: validateEmail(email),
            password: validatePassword(password),
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
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user is an admin in the database
            const adminRef = ref(database, `admins/${user.uid}`);
            const adminSnap = await get(adminRef);

            if (adminSnap.exists()) {
                setSuccess('Admin login successful!');
                setTimeout(() => navigate('/admin-dashboard'), 1000);
            } else {
                setError('This account does not have admin privileges.');
                await auth.signOut();
            }
        } catch (err) {
            setError(getFirebaseAuthErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setResetError('');
        setResetMessage('');

        const emailError = validateEmail(resetEmail);
        if (emailError) {
            setResetError(emailError);
            return;
        }

        setResetLoading(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetMessage('Password reset email sent! Check your inbox.');
        } catch (err) {
            setResetError(getFirebaseAuthErrorMessage(err.code));
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div>
            <main className="my-5">
                <div className="admin-login-container">
                    <div className="admin-login-card">
                        <div className="admin-login-header animate__animated animate__fadeInDown">
                            <div className="admin-badge">
                                <i className="fas fa-shield-alt me-2"></i>Admin Portal
                            </div>
                            <h2>
                                <i className="fas fa-user-shield me-2"></i>Admin Login
                            </h2>
                            <p className="text-muted">Access the admin dashboard</p>
                        </div>

                        {error && (
                            <div className="alert alert-danger alert-dismissible fade show animate__animated animate__slideInLeft" role="alert">
                                <i className="fas fa-exclamation-circle me-2"></i>
                                <span>{error}</span>
                                <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success alert-dismissible fade show animate__animated animate__slideInLeft" role="alert">
                                <i className="fas fa-check-circle me-2"></i>
                                <span>{success}</span>
                                <button type="button" className="btn-close" onClick={() => setSuccess('')} aria-label="Close"></button>
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="form-floating mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.2s' }}>
                                <input
                                    type="email"
                                    className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                    id="adminEmail"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setFieldErrors((prev) => ({ ...prev, email: '' }));
                                    }}
                                    required
                                />
                                <label htmlFor="adminEmail">
                                    <i className="fas fa-envelope me-2"></i>Admin Email
                                </label>
                                {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                            </div>

                            <div className="form-floating mb-4 animate__animated animate__fadeIn" style={{ animationDelay: '0.4s' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                                    id="adminPassword"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setFieldErrors((prev) => ({ ...prev, password: '' }));
                                    }}
                                    required
                                />
                                <label htmlFor="adminPassword">
                                    <i className="fas fa-lock me-2"></i>Password
                                </label>
                                <div
                                    className="password-toggle-icon position-absolute end-0 top-50 translate-middle-y me-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ cursor: 'pointer', zIndex: 5 }}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} text-muted`}></i>
                                </div>
                                {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
                            </div>

                            <div className="d-flex justify-content-end mb-4">
                                <button
                                    type="button"
                                    className="btn-link"
                                    onClick={() => setShowForgotModal(true)}
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-admin-signin w-100 mb-4 animate__animated animate__bounceIn"
                                style={{ animationDelay: '0.6s' }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-sign-in-alt me-2"></i>Admin Sign In
                                    </>
                                )}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="text-muted">
                                    <i className="fas fa-user me-1"></i>Regular User Login
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* Forgot Password Modal */}
            <Modal show={showForgotModal} onHide={() => setShowForgotModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fas fa-key me-2"></i>Reset Admin Password
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted mb-3">
                        Enter your admin email to receive a password reset link.
                    </p>
                    {resetError && (
                        <div className="alert alert-danger">
                            <i className="fas fa-exclamation-circle me-2"></i>{resetError}
                        </div>
                    )}
                    {resetMessage && (
                        <div className="alert alert-success">
                            <i className="fas fa-check-circle me-2"></i>{resetMessage}
                        </div>
                    )}
                    <div className="form-floating mb-3">
                        <input
                            type="email"
                            className="form-control"
                            id="resetEmail"
                            placeholder="name@example.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                        />
                        <label htmlFor="resetEmail">
                            <i className="fas fa-envelope me-2"></i>Admin Email
                        </label>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowForgotModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleForgotPassword}
                        disabled={resetLoading}
                    >
                        {resetLoading ? (
                            <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>
                        ) : (
                            <><i className="fas fa-paper-plane me-2"></i>Send Reset Link</>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminLogin;  