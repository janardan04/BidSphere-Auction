// src/utils/validation.js
// Shared validation utilities for all forms

export const validateEmail = (email) => {
    if (!email || !email.trim()) {
        return 'Email is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return 'Please enter a valid email address.';
    }
    return '';
};

export const validatePassword = (password) => {
    if (!password) {
        return 'Password is required.';
    }
    if (password.length < 6) {
        return 'Password must be at least 6 characters.';
    }
    return '';
};

export const validatePasswordStrength = (password) => {
    if (!password) {
        return { error: 'Password is required.', strength: 0, label: '' };
    }
    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters.', strength: 1, label: 'Too Short' };
    }

    let strength = 1;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return { error: '', strength, label: labels[strength] || 'Very Strong' };
};

export const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return `${fieldName} is required.`;
    }
    return '';
};

export const validateMinLength = (value, minLength, fieldName) => {
    if (!value || value.trim().length < minLength) {
        return `${fieldName} must be at least ${minLength} characters.`;
    }
    return '';
};

export const validatePhone = (phone) => {
    if (!phone || !phone.trim()) {
        return 'Phone number is required.';
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.trim())) {
        return 'Phone number must be exactly 10 digits.';
    }
    return '';
};

export const validatePrice = (price) => {
    if (!price && price !== 0) {
        return 'Price is required.';
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
        return 'Price must be a positive number.';
    }
    return '';
};

export const validateBidAmount = (bid, currentPrice) => {
    if (!bid && bid !== 0) {
        return 'Bid amount is required.';
    }
    const bidValue = parseFloat(bid);
    if (isNaN(bidValue)) {
        return 'Please enter a valid number.';
    }
    if (bidValue <= currentPrice) {
        return `Your bid must be higher than the current price (₹${currentPrice}).`;
    }
    // Minimum increment: ₹1 or 1% of current price, whichever is greater
    const minIncrement = Math.max(1, currentPrice * 0.01);
    if (bidValue < currentPrice + minIncrement) {
        return `Minimum bid increment is ₹${minIncrement.toFixed(2)}.`;
    }
    return '';
};

export const validateImageFiles = (files, maxCount = 5, maxSizeMB = 2) => {
    if (!files || files.length === 0) {
        return 'Please upload at least one image.';
    }
    if (files.length > maxCount) {
        return `You can upload a maximum of ${maxCount} images.`;
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    for (let i = 0; i < files.length; i++) {
        if (files[i].size > maxSizeBytes) {
            return `Image "${files[i].name}" exceeds ${maxSizeMB}MB. Please use smaller images.`;
        }
    }
    return '';
};

/**
 * Map Firebase Auth error codes to user-friendly messages.
 * Firebase v11 changed some codes (e.g., auth/invalid-credential).
 */
export const getFirebaseAuthErrorMessage = (errorCode) => {
    switch (errorCode) {
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-email':
            return 'Invalid email format.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/too-many-requests':
            return 'Too many failed login attempts. Please try again later.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/weak-password':
            return 'Password is too weak. Please choose a stronger password.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        default:
            return 'An error occurred. Please try again.';
    }
};
