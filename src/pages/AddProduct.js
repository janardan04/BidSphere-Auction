import React, { useState, useEffect } from 'react'; // Import React and hooks for state and side effects
import { useNavigate } from 'react-router-dom'; // Import navigation hook for redirecting
import { ref, set } from 'firebase/database'; // Import Firebase database functions for saving data
import { auth, database } from '../firebase/firebaseConfig'; // Import Firebase auth and database configuration
import '../styles/add-product.css'; // Import CSS for styling the component

// AddProduct component: Allows sellers to create a new auction listing
const AddProduct = () => {
    // State to manage form inputs, initialized with empty/default values
    const [formData, setFormData] = useState({
        productName: '', // Stores the product name entered by the user
        description: '', // Stores the product description
        startingPrice: '', // Stores the starting bid price
        startTime: '', // Stores the auction start date and time
        endTime: '', // Stores the auction end date and time
        images: [], // Stores selected image files for upload
    });

    // State for UI feedback and control
    const [error, setError] = useState(''); // Stores error messages to display to the user
    const [success, setSuccess] = useState(''); // Stores success messages for feedback
    const [loading, setLoading] = useState(false); // Tracks form submission status (e.g., for spinner)
    const [previewImages, setPreviewImages] = useState([]); // Stores URLs for previewing selected images
    const navigate = useNavigate(); // Hook to programmatically navigate to other routes

    // useEffect: Runs on component mount to ensure the user is authenticated
    useEffect(() => {
        if (!auth.currentUser) {
            navigate('/seller-login'); // Redirect to login page if no user is logged in
        }
    }, [navigate]); // Dependency array includes navigate to ensure stable reference

    // handleChange: Updates formData state when text inputs change
    const handleChange = (e) => {
        const { name, value } = e.target; // Extract input name and value from event
        setFormData((prev) => ({
            ...prev,
            [name]: value, // Dynamically update the corresponding form field
        }));
    };

    // handleImageChange: Handles image file selection and preview generation
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files); // Convert FileList to array for processing
        if (files.length > 5) {
            setError('You can upload a maximum of 5 images.'); // Enforce max image limit
            return;
        }

        // Update formData with selected image files
        setFormData((prev) => ({
            ...prev,
            images: files,
        }));

        // Generate temporary URLs for image previews
        const previews = files.map(file => URL.createObjectURL(file));
        setPreviewImages(previews); // Store preview URLs in state
    };

    // handleSubmit: Processes form submission to save auction data to Firebase
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        setError(''); // Clear any previous error messages
        setSuccess(''); // Clear any previous success messages
        setLoading(true); // Set loading state to show spinner

        // Destructure formData for easier access
        const { productName, description, startingPrice, startTime, endTime, images } = formData;

        // Validate form inputs to ensure all required fields are filled
        if (!productName || !description || !startingPrice || !startTime || !endTime || images.length === 0) {
            setError('Please fill in all fields and upload at least one image.');
            setLoading(false); // Reset loading state
            return;
        }

        // Convert date strings to timestamps for comparison
        const startDateTime = new Date(startTime).getTime(); // Start time in milliseconds
        const endDateTime = new Date(endTime).getTime(); // End time in milliseconds
        const currentTime = new Date().getTime(); // Current time in milliseconds

        // Validate that start time is in the future
        if (startDateTime < currentTime) {
            setError('Start time must be in the future.');
            setLoading(false);
            return;
        }

        // Validate that end time is after start time
        if (endDateTime <= startDateTime) {
            setError('End time must be after start time.');
            setLoading(false);
            return;
        }

        try {
            // Convert selected images to base64 strings for storage
            const imagePromises = images.map((image) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader(); // Create FileReader to read image
                    reader.onload = () => resolve(reader.result); // Resolve with base64 string
                    reader.onerror = (error) => reject(error); // Reject if reading fails
                    reader.readAsDataURL(image); // Read image as data URL (base64)
                });
            });

            // Wait for all images to be converted to base64
            const imageBase64Strings = await Promise.all(imagePromises);

            // Generate a unique ID for the auction using current timestamp
            const productId = Date.now().toString();
            // Create a Firebase database reference for the new auction
            const productRef = ref(database, `auctions/${productId}`);
            // Save auction data to Firebase Realtime Database
            await set(productRef, {
                productName, // Product name
                description, // Product description
                startingPrice: parseFloat(startingPrice), // Convert price to number
                currentPrice: parseFloat(startingPrice), // Initialize current price as starting price
                startTime: startDateTime, // Store start time as timestamp
                endTime: endDateTime, // Store end time as timestamp
                seller: auth.currentUser.email, // Store seller's email for reference
                images: imageBase64Strings, // Store array of base64 image strings
                isActive: false, // Set auction as inactive initially
                paymentStatus: 'pending', // Set initial payment status
                timestamp: Date.now(), // Record creation time
            });

            // Display success message to user
            setSuccess('Product added successfully!');
            // Reset form fields to initial state
            setFormData({
                productName: '',
                description: '',
                startingPrice: '',
                startTime: '',
                endTime: '',
                images: [],
            });
            setPreviewImages([]); // Clear image previews
            // Redirect to seller dashboard after 1.5 seconds
            setTimeout(() => navigate('/seller-dashboard'), 1500);
        } catch (err) {
            // Log error for debugging purposes
            console.error('Error adding product:', err);
            // Display error message to user
            setError('Failed to add product: ' + err.message);
        } finally {
            // Reset loading state regardless of success or failure
            setLoading(false);
        }
    };

    // Render the component UI
    return (
        <div className="auction-page"> {/* Main container for the page */}
            <div className="auction-container"> {/* Inner container for layout */}
                <div className="auction-header">
                    <h2>Add New Auction</h2> {/* Page title */}
                </div>
                <div className="auction-form">
                    {/* Display error message if present */}
                    {error && (
                        <div className="alert-box error">
                            <i className="bi bi-exclamation-triangle"></i> {error}
                        </div>
                    )}
                    {/* Display success message if present */}
                    {success && (
                        <div className="alert-box success">
                            <i className="bi bi-check-circle"></i> {success}
                        </div>
                    )}
                    {/* Form for entering auction details */}
                    <form onSubmit={handleSubmit}>
                        {/* Product Name Input */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="productName">Product Name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="productName"
                                name="productName"
                                value={formData.productName} // Controlled input
                                onChange={handleChange} // Update state on change
                                placeholder="Enter product name"
                                required // Browser validation
                            />
                        </div>
                        {/* Description Input */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="description">Description</label>
                            <textarea
                                className="form-control"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your product"
                                rows="4" // Set textarea height
                                required
                            ></textarea>
                        </div>
                        {/* Starting Price Input */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="startingPrice">Starting Price (₹)</label>
                            <input
                                type="number"
                                className="form-control"
                                id="startingPrice"
                                name="startingPrice"
                                value={formData.startingPrice}
                                onChange={handleChange}
                                min="1" // Prevent negative or zero prices
                                placeholder="Enter starting price"
                                required
                            />
                        </div>
                        {/* Start and End Time Inputs */}
                        <div className="datetime-group"> {/* Group for styling date inputs */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="startTime">Start Time</label>
                                <input
                                    type="datetime-local" // Browser date-time picker
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
                        {/* Image Upload Input */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="images">Product Images (up to 5)</label>
                            <input
                                type="file"
                                className="form-control"
                                id="images"
                                name="images"
                                accept="image/*" // Restrict to image files
                                multiple // Allow multiple file selection
                                onChange={handleImageChange} // Handle file selection
                                required
                            />
                            {/* Display previews of selected images */}
                            {previewImages.length > 0 && (
                                <div className="image-preview-container">
                                    {previewImages.map((url, index) => (
                                        <div key={index} className="image-preview">
                                            <img
                                                src={url || "/placeholder.svg"} // Fallback if URL fails
                                                alt={`Preview ${index + 1}`} // Accessible alt text
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Submit Button */}
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span> {/* Loading spinner */}
                                    Processing... {/* Text during submission */}
                                </>
                            ) : (
                                'Add Auction' // Default button text
                            )}
                        </button>
                    </form>
                    {/* Link to return to seller dashboard */}
                    <a href="/seller-dashboard" className="back-link">
                        <i className="bi bi-arrow-left"></i> Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
};

// Export the component for use in other parts of the app
export default AddProduct;