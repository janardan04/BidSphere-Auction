import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import '../styles/view-product.css';

const ViewProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            const productRef = ref(database, 'auctions');
            try {
                const snapshot = await get(productRef);
                if (snapshot.exists()) {
                    const productsData = snapshot.val();
                    console.log('Fetched products in ViewProducts:', productsData);
                    const currentTime = new Date().getTime();
                    const productList = [];

                    Object.keys(productsData).forEach((productId) => {
                        const product = productsData[productId];
                        const startTime = product.startTime || 0;
                        const endTime = product.endTime || 0;
                        const status =
                            currentTime < startTime
                                ? 'Upcoming'
                                : currentTime >= startTime && currentTime < endTime
                                ? 'Active'
                                : 'Ended';

                        productList.push({
                            id: productId,
                            ...product,
                            status,
                            // Use timestamp or created date for sorting
                            timestamp: product.timestamp || product.createdAt || startTime || 0
                        });
                    });

                    // Sort products by timestamp (newest first) - will be re-sorted by filter
                    productList.sort((a, b) => b.timestamp - a.timestamp);
                    
                    setProducts(productList);
                } else {
                    setProducts([]);
                }
            } catch (err) {
                setError('Failed to load products: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Handler for button clicks - replaces Link navigation
    const handleProductClick = (productId) => {
        navigate(`/place-bid/${productId}`);
    };

    // Filter and sort products
    const filteredProducts = products.filter(product => {
        // Apply search filter
        const matchesSearch = product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Apply status filter
        const matchesStatus = statusFilter === 'All' || product.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === 'newest') {
            return b.timestamp - a.timestamp;
        } else if (sortBy === 'oldest') {
            return a.timestamp - b.timestamp;
        } else if (sortBy === 'priceAsc') {
            return a.currentPrice - b.currentPrice;
        } else if (sortBy === 'priceDesc') {
            return b.currentPrice - a.currentPrice;
        }
        return 0;
    });

    if (loading) {
        return (
            <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="view-products-page" style={{ paddingTop: '15px' }}>
            <div className="container">
                <h2 className="text-center mb-4" style={{ paddingTop: '15px'}}>Available Auctions</h2>
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {/* New Filter Bar */}
                <div className="filters-bar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search auctions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    <select 
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ended">Ended</option>
                    </select>
                    
                    <select 
                        className="filter-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="priceAsc">Price: Low to High</option>
                        <option value="priceDesc">Price: High to Low</option>
                    </select>
                </div>

                {sortedProducts.length > 0 ? (
                    <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
                        {sortedProducts.map((product) => {
                            const imageSources = product.images && product.images.length > 0 
                                ? product.images 
                                : product.image 
                                ? [product.image] 
                                : [];
                            return (
                                <div key={product.id} className="col">
                                    <div className="card small-auction-card">
                                        <div className="card-img-container">
                                            <img
                                                src={
                                                    imageSources.length > 0
                                                        ? imageSources[0]
                                                        : 'https://via.placeholder.com/300'
                                                }
                                                className="card-img-top img-fluid"
                                                alt={product.productName}
                                                onError={(e) => {
                                                    console.error('ViewProducts image failed to load:', imageSources.length > 0 ? imageSources[0] : 'No image');
                                                    e.target.src = 'https://via.placeholder.com/300';
                                                }}
                                            />
                                        </div>
                                        <div className="card-body compact-card-body">
                                            <h6 className="card-title product-title">{product.productName}</h6>
                                            <p className="card-text product-description">{product.description}</p>
                                            <p className="card-text mb-1">
                                                <strong>Bid:</strong> <span className="price-display">₹{product.currentPrice}</span>
                                            </p>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span
                                                    className={`badge bg-${
                                                        product.status === 'Active'
                                                            ? 'success'
                                                            : product.status === 'Ended'
                                                            ? 'danger'
                                                            : 'secondary'
                                                    }`}
                                                >
                                                    {product.status}
                                                </span>
                                                <button
                                                    onClick={() => handleProductClick(product.id)}
                                                    className={`btn btn-sm ${product.status === 'Ended' ? 'ended-button' : 'bid-button'}`}
                                                >
                                                    {product.status === 'Active' ? 'Place Bid' : 'View'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center">No products available.</p>
                )}
            </div>
        </div>
    );
};

export default ViewProducts;