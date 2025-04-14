// src/pages/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../firebase/firebaseConfig';
import '../styles/register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        userName: '',
        userEmail: '',
        pass1: '',
        gender: '',
        city: '',
    });
    const [errors, setErrors] = useState({
        userName: '',
        userEmail: '',
        pass1: '',
        gender: '',
        city: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: '' }); // Clear error for the field being edited
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = { userName: '', userEmail: '', pass1: '', gender: '', city: '' };

        if (formData.userName.trim().length < 5) {
            newErrors.userName = 'Name must be at least 5 characters.';
            isValid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.userEmail.trim())) {
            newErrors.userEmail = 'Invalid email.';
            isValid = false;
        }

        if (formData.pass1.trim().length < 6) {
            newErrors.pass1 = 'Password must be at least 6 characters.';
            isValid = false;
        }

        if (!formData.gender) {
            newErrors.gender = 'Select your gender.';
            isValid = false;
        }

        if (!formData.city) {
            newErrors.city = 'Select a city.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        const { userEmail: email, pass1: password, userName, gender, city } = formData;

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                return Promise.all([
                    updateProfile(user, { displayName: userName }),
                    set(ref(database, 'users/' + user.uid), {
                        name: userName,
                        email: email,
                        gender: gender,
                        city: city,
                        role: 'user',
                    }),
                ]);
            })
            .then(() => {
                console.log('User registered successfully');
                navigate('/auctions'); // Redirect to view-products equivalent
            })
            .catch((error) => {
                setError(error.message);
            });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="reg-page">
            <main className="my-5">
                {/* Removed reg-container div */}
                <div className="reg-card">
                    <div className="reg-header animate__animated animate__fadeInDown">
                        <h2>
                            <i className="fas fa-user-plus me-2"></i>Create Account
                        </h2>
                        <p className="text-muted">Join BidSphere today</p>
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

                    <form
                        id="registerForm"
                        onSubmit={handleSubmit}
                        className="needs-validation"
                        noValidate
                    >
                        <div className="form-floating mb-3">
                            <input
                                type="text"
                                name="userName"
                                className="form-control"
                                id="userName"
                                placeholder="Enter your full name"
                                value={formData.userName}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="userName">
                                <i className="fas fa-user me-2"></i>Full Name
                            </label>
                            <div id="nameError" className="text-danger">
                                {errors.userName}
                            </div>
                        </div>

                        <div className="form-floating mb-3">
                            <input
                                type="email"
                                name="userEmail"
                                className="form-control"
                                id="userEmail"
                                placeholder="Enter your email"
                                value={formData.userEmail}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="userEmail">
                                <i className="fas fa-envelope me-2"></i>Email Address
                            </label>
                            <div id="emailError" className="text-danger">
                                {errors.userEmail}
                            </div>
                        </div>

                        <div className="form-floating mb-3 position-relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="pass1"
                                className="form-control"
                                id="pass1"
                                placeholder="Create password"
                                value={formData.pass1}
                                onChange={handleChange}
                                required
                            />
                            <label htmlFor="pass1">
                                <i className="fas fa-lock me-2"></i>Password
                            </label>
                            <span
                                className="password-toggle-icon position-absolute top-50 end-0 translate-middle-y me-3"
                                onClick={togglePasswordVisibility}
                            >
                                <i
                                    className={`fas ${
                                        showPassword ? 'fa-eye' : 'fa-eye-slash'
                                    }`}
                                ></i>
                            </span>
                            <div id="passwordError" className="text-danger">
                                {errors.pass1}
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Gender</label>
                            <div className="d-flex gap-4">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="gender"
                                        id="male"
                                        value="male"
                                        checked={formData.gender === 'male'}
                                        onChange={handleChange}
                                        required
                                    />
                                    <label className="form-check-label" htmlFor="male">
                                        Male
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="gender"
                                        id="female"
                                        value="female"
                                        checked={formData.gender === 'female'}
                                        onChange={handleChange}
                                    />
                                    <label className="form-check-label" htmlFor="female">
                                        Female
                                    </label>
                                </div>
                            </div>
                            <div id="genderError" className="text-danger">
                                {errors.gender}
                            </div>
                        </div>

                        <div className="form-floating mb-4">
                            <select
                                name="city"
                                className="form-select"
                                id="city"
                                value={formData.city}
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
                                <option>Other</option>
                            </select>
                            <label htmlFor="city">
                                <i className="fas fa-city me-2"></i>City
                            </label>
                            <div id="cityError" className="text-danger">
                                {errors.city}
                            </div>
                        </div>

                        <button
                            id="registerBtn"
                            type="submit"
                            className="btn btn-primary w-100"
                        >
                            <i className="fas fa-user-plus me-1"></i> Register Now
                        </button>

                        <div className="text-center mt-3">
                            <p>
                                Already have an account?{' '}
                                <Link to="/login">Login here</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Register;