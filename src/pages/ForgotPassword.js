// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { validateEmail } from '../utils/validation';
import '../styles/forgot-password.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate email
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess('Password reset email sent! Please check your inbox (and spam folder).');
            setEmail('');
        } catch (err) {
            switch (err.code) {
                case 'auth/user-not-found':
                    setError('No account found with this email address.');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many attempts. Please try again later.');
                    break;
                default:
                    setError('Failed to send reset email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <main className="my-5">
                <div className="forgot-password-container">
                    <div className="forgot-password-card">
                        <div className="forgot-password-header animate__animated animate__fadeInDown">
                            <div className="icon-circle">
                                <i className="fas fa-lock"></i>
                            </div>
                            <h2>Forgot Password?</h2>
                            <p className="text-muted">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>

                        {error && (
                            <div
                                className="alert alert-danger alert-dismissible fade show animate__animated animate__slideInLeft"
                                role="alert"
                            >
                                <i className="fas fa-exclamation-circle me-2"></i>
                                <span>{error}</span>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setError('')}
                                    aria-label="Close"
                                ></button>
                            </div>
                        )}

                        {success && (
                            <div
                                className="alert alert-success alert-dismissible fade show animate__animated animate__slideInLeft"
                                role="alert"
                            >
                                <i className="fas fa-check-circle me-2"></i>
                                <span>{success}</span>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSuccess('')}
                                    aria-label="Close"
                                ></button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div
                                className="form-floating mb-4 animate__animated animate__fadeIn"
                                style={{ animationDelay: '0.2s' }}
                            >
                                <input
                                    type="email"
                                    className="form-control"
                                    id="resetEmail"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <label htmlFor="resetEmail">
                                    <i className="fas fa-envelope me-2"></i>Email address
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-reset w-100 mb-4 animate__animated animate__bounceIn"
                                style={{ animationDelay: '0.4s' }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane me-2"></i>Send Reset Link
                                    </>
                                )}
                            </button>

                            <div
                                className="text-center animate__animated animate__fadeIn"
                                style={{ animationDelay: '0.6s' }}
                            >
                                <p>
                                    Remember your password?{' '}
                                    <Link to="/login" className="back-link">
                                        Back to Login
                                    </Link>
                                </p>
                                <p className="mt-2">
                                    <Link to="/seller-login" className="text-muted">
                                        <i className="fas fa-store me-1"></i>Seller Login
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

export default ForgotPassword;
