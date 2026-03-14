// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, userRole, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect to appropriate login page based on required role
        if (requiredRole === 'seller') {
            return <Navigate to="/seller-login" replace />;
        }
        if (requiredRole === 'admin') {
            return <Navigate to="/admin-login" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    // If a specific role is required, check it
    if (requiredRole && userRole !== requiredRole) {
        // Redirect to home if role doesn't match
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
