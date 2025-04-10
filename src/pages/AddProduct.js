import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set } from 'firebase/database';
import { auth, database } from '../firebase/firebaseConfig';
import '../styles/add-product.css';

const AddProduct = () => {
    const [formData, setFormData] = useState({
        productName: '',
        description: '',
        startingPrice: '',
        startTime: '',
        endTime: '',
        images: [], // Array to store image files
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewImages, setPreviewImages] = useState([]);
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
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            setError('You can upload a maximum of 5 images.');
            return;
        }
        
        setFormData((prev) => ({
            ...prev,
            images: files,
        }));
        
        // Create preview URLs for the images
        const previews = files.map(file => URL.createObjectURL(file));
        setPreviewImages(previews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const { productName, description, startingPrice, startTime, endTime, images } = formData;

        // Validation
        if (!productName || !description || !startingPrice || !startTime || !endTime || images.length === 0) {
            setError('Please fill in all fields and upload at least one image.');
            setLoading(false);
            return;
        }

        const startDateTime = new Date(startTime).getTime();
        const endDateTime = new Date(endTime).getTime();
        const currentTime = new Date().getTime();

        if (startDateTime < currentTime) {
            setError('Start time must be in the future.');
            setLoading(false);
            return;
        }

        if (endDateTime <= startDateTime) {
            setError('End time must be after start time.');
            setLoading(false);
            return;
        }

        try {
            // Convert images to base64 strings
            const imagePromises = images.map((image) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(image);
                });
            });

            const imageBase64Strings = await Promise.all(imagePromises);

            // Save product to Firebase Database
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
                images: imageBase64Strings, // Store base64 strings in the images array
                isActive: false,
                paymentStatus: 'pending',
                timestamp: Date.now(),
            });

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
                                className="form-control"
                                id="productName"
                                name="productName"
                                value={formData.productName}
                                onChange={handleChange}
                                placeholder="Enter product name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="description">Description</label>
                            <textarea
                                className="form-control"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your product"
                                rows="4"
                                required
                            ></textarea>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="startingPrice">Starting Price (₹)</label>
                            <input
                                type="number"
                                className="form-control"
                                id="startingPrice"
                                name="startingPrice"
                                value={formData.startingPrice}
                                onChange={handleChange}
                                min="1"
                                placeholder="Enter starting price"
                                required
                            />
                        </div>
                        <div className="datetime-group">
                            <div className="form-group">
                                <label className="form-label" htmlFor="startTime">Start Time</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    id="startTime"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="endTime">End Time</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    id="endTime"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="images">Product Images (up to 5)</label>
                            <input
                                type="file"
                                className="form-control"
                                id="images"
                                name="images"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                required
                            />
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
