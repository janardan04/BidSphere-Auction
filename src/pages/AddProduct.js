import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set } from 'firebase/database';
import { auth, database } from '../firebase/firebaseConfig';
import { validateRequired, validateMinLength, validatePrice, validateImageFiles } from '../utils/validation';
import { notifyNewProduct } from '../utils/notificationService';
import '../styles/add-product.css';

const AddProduct = () => {
    const [formData, setFormData] = useState({
        productName: '',
        description: '',
        startingPrice: '',
        startTime: '',
        endTime: '',
        images: [],
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewImages, setPreviewImages] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth.currentUser) {
            navigate('/seller-login');
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear field error on change
        setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        const imgError = validateImageFiles(files, 5, 2);
        if (imgError) {
            setFieldErrors((prev) => ({ ...prev, images: imgError }));
            return;
        }

        setFieldErrors((prev) => ({ ...prev, images: '' }));
        setFormData((prev) => ({
            ...prev,
            images: files,
        }));

        const previews = files.map(file => URL.createObjectURL(file));
        setPreviewImages(previews);
    };

    const validateForm = () => {
        const errors = {};

        const nameErr = validateMinLength(formData.productName, 3, 'Product name');
        if (nameErr) errors.productName = nameErr;

        const descErr = validateMinLength(formData.description, 10, 'Description');
        if (descErr) errors.description = descErr;

        const priceErr = validatePrice(formData.startingPrice);
        if (priceErr) errors.startingPrice = priceErr;

        const startErr = validateRequired(formData.startTime, 'Start time');
        if (startErr) errors.startTime = startErr;

        const endErr = validateRequired(formData.endTime, 'End time');
        if (endErr) errors.endTime = endErr;

        if (formData.images.length === 0) {
            errors.images = 'Please upload at least one image.';
        }

        // Time validations
        if (formData.startTime && formData.endTime) {
            const startDateTime = new Date(formData.startTime).getTime();
            const endDateTime = new Date(formData.endTime).getTime();
            const currentTime = Date.now();

            if (startDateTime < currentTime) {
                errors.startTime = 'Start time must be in the future.';
            }
            if (endDateTime <= startDateTime) {
                errors.endTime = 'End time must be after start time.';
            }
            // Minimum 1 hour auction duration
            if (endDateTime - startDateTime < 3600000) {
                errors.endTime = 'Auction duration must be at least 1 hour.';
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) return;

        setLoading(true);

        const { productName, description, startingPrice, startTime, endTime, images } = formData;
        const startDateTime = new Date(startTime).getTime();
        const endDateTime = new Date(endTime).getTime();

        try {
            // Convert images to base64
            const imagePromises = images.map((image) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(image);
                });
            });

            const imageBase64Strings = await Promise.all(imagePromises);

            const productId = Date.now().toString();
            const productRef = ref(database, `auctions/${productId}`);
            await set(productRef, {
                productName,
                description,
                startingPrice: parseFloat(startingPrice),
                currentPrice: parseFloat(startingPrice),
                startTime: startDateTime,
                endTime: endDateTime,
                seller: auth.currentUser.email,
                sellerId: auth.currentUser.uid,
                images: imageBase64Strings,
                paymentStatus: 'pending',
                timestamp: Date.now(),
            });

            // Send notification to all registered users
            await notifyNewProduct(productName, auth.currentUser.email);

            setSuccess('Product added successfully!');
            setFormData({
                productName: '',
                description: '',
                startingPrice: '',
                startTime: '',
                endTime: '',
                images: [],
            });
            setPreviewImages([]);
            setTimeout(() => navigate('/seller-dashboard'), 1500);
        } catch (err) {
            console.error('Error adding product:', err);
            setError('Failed to add product: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auction-page">
            <div className="auction-container">
                <div className="auction-header">
                    <h2>Add New Auction</h2>
                </div>
                <div className="auction-form">
                    {error && (
                        <div className="alert-box error">
                            <i className="bi bi-exclamation-triangle"></i> {error}
                        </div>
                    )}
                    {success && (
                        <div className="alert-box success">
                            <i className="bi bi-check-circle"></i> {success}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="productName">Product Name</label>
                            <input
                                type="text"
                                className={`form-control ${fieldErrors.productName ? 'is-invalid' : ''}`}
                                id="productName"
                                name="productName"
                                value={formData.productName}
                                onChange={handleChange}
                                placeholder="Enter product name (min 3 characters)"
                                required
                            />
                            {fieldErrors.productName && (
                                <div className="invalid-feedback">{fieldErrors.productName}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="description">Description</label>
                            <textarea
                                className={`form-control ${fieldErrors.description ? 'is-invalid' : ''}`}
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your product (min 10 characters)"
                                rows="4"
                                required
                            ></textarea>
                            {fieldErrors.description && (
                                <div className="invalid-feedback">{fieldErrors.description}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="startingPrice">Starting Price (₹)</label>
                            <input
                                type="number"
                                className={`form-control ${fieldErrors.startingPrice ? 'is-invalid' : ''}`}
                                id="startingPrice"
                                name="startingPrice"
                                value={formData.startingPrice}
                                onChange={handleChange}
                                min="1"
                                placeholder="Enter starting price"
                                required
                            />
                            {fieldErrors.startingPrice && (
                                <div className="invalid-feedback">{fieldErrors.startingPrice}</div>
                            )}
                        </div>
                        <div className="datetime-group">
                            <div className="form-group">
                                <label className="form-label" htmlFor="startTime">Start Time</label>
                                <input
                                    type="datetime-local"
                                    className={`form-control ${fieldErrors.startTime ? 'is-invalid' : ''}`}
                                    id="startTime"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                />
                                {fieldErrors.startTime && (
                                    <div className="invalid-feedback">{fieldErrors.startTime}</div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="endTime">End Time</label>
                                <input
                                    type="datetime-local"
                                    className={`form-control ${fieldErrors.endTime ? 'is-invalid' : ''}`}
                                    id="endTime"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                />
                                {fieldErrors.endTime && (
                                    <div className="invalid-feedback">{fieldErrors.endTime}</div>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="images">Product Images (up to 5, max 2MB each)</label>
                            <input
                                type="file"
                                className={`form-control ${fieldErrors.images ? 'is-invalid' : ''}`}
                                id="images"
                                name="images"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                required
                            />
                            {fieldErrors.images && (
                                <div className="invalid-feedback">{fieldErrors.images}</div>
                            )}
                            {previewImages.length > 0 && (
                                <div className="image-preview-container">
                                    {previewImages.map((url, index) => (
                                        <div key={index} className="image-preview">
                                            <img
                                                src={url || "/placeholder.svg"}
                                                alt={`Preview ${index + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Processing...
                                </>
                            ) : (
                                'Add Auction'
                            )}
                        </button>
                    </form>
                    <a href="/seller-dashboard" className="back-link">
                        <i className="bi bi-arrow-left"></i> Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;