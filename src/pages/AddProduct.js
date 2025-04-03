// src/pages/AddProduct.js
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
            setTimeout(() => navigate('/seller-dashboard'), 1500);
        } catch (err) {
            console.error('Error adding product:', err);
            setError('Failed to add product: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-product-page" style={{ paddingTop: '80px' }}>
            <div className="container">
                <h2 className="text-center mb-4">Add New Product</h2>
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="alert alert-success" role="alert">
                        {success}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="productName" className="form-label">Product Name</label>
                        <input
                            type="text"
                            className="form-control"
                            id="productName"
                            name="productName"
                            value={formData.productName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="description" className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="startingPrice" className="form-label">Starting Price (₹)</label>
                        <input
                            type="number"
                            className="form-control"
                            id="startingPrice"
                            name="startingPrice"
                            value={formData.startingPrice}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="startTime" className="form-label">Start Time</label>
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
                    <div className="mb-3">
                        <label htmlFor="endTime" className="form-label">End Time</label>
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
                    <div className="mb-3">
                        <label htmlFor="images" className="form-label">Product Images (up to 5)</label>
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
                        {formData.images.length > 0 && (
                            <div className="mt-2">
                                <p>Selected images: {formData.images.length}</p>
                                <div className="d-flex flex-wrap gap-2">
                                    {formData.images.map((image, index) => (
                                        <img
                                            key={index}
                                            src={URL.createObjectURL(image)}
                                            alt={`Preview ${index + 1}`}
                                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Adding Product...
                            </>
                        ) : (
                            'Add Product'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddProduct;