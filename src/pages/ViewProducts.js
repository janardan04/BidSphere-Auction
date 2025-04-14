import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import '../styles/view-product.css';

const ViewProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [priceChanged, setPriceChanged] = useState({});
    const prevPrices = useRef({});
    const navigate = useNavigate();

    useEffect(() => {
        const productRef = ref(database, 'auctions');
        const unsubscribe = onValue(
            productRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const productsData = snapshot.val();
                    const currentTime = new Date().getTime();
                    const productList = [];
                    const newPriceChanged = {};

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

                        // Check if price has changed
                        const prevPrice = prevPrices.current[productId];
                        const currentPrice = product.currentPrice;
                        if (prevPrice !== undefined && prevPrice !== currentPrice) {
                            newPriceChanged[productId] = true;
                            setTimeout(() => {
                                setPriceChanged(prev => ({ ...prev, [productId]: false }));
                            }, 1000);
                        }
                        prevPrices.current[productId] = currentPrice;

                        productList.push({
                            id: productId,
                            ...product,
                            status,
                            timestamp: product.timestamp || product.createdAt || startTime || 0,
                        });
                    });

                    setPriceChanged(prev => ({ ...prev, ...newPriceChanged }));
                    productList.sort((a, b) => b.timestamp - a.timestamp);
                    setProducts(productList);
                } else {
                    console.warn('No products found in auctions');
                    setProducts([]);
                }
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching products:', err);
                setError('Failed to load products: ' + err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleProductClick = (productId) => {
        navigate(`/place-bid/${productId}`);
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            (product.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (product.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || product.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === 'newest') return b.timestamp - a.timestamp;
        if (sortBy === 'oldest') return a.timestamp - b.timestamp;
        if (sortBy === 'priceAsc') return (a.currentPrice || 0) - (b.currentPrice || 0);
        if (sortBy === 'priceDesc') return (b.currentPrice || 0) - (a.currentPrice || 0);
        return 0;
    });

    if (loading) {
        return (
            <div className="view-products-page d-flex justify-content-center align-items-center">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2" style={{ color: '#1e88e5' }}>Loading auctions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="view-products-page">
            <h2 className="text-center page-title">
                Available Auctions
            </h2>
            
            {error && (
                <div className="alert alert-danger mx-4" role="alert">
                    {error}
                </div>
            )}

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
                <div className="products-grid">
                    {sortedProducts.map((product) => {
                        const imageSources = product.images?.length > 0
                            ? product.images
                            : product.image
                            ? [product.image]
                            : [];
                        return (
                            <div key={product.id} className="small-auction-card">
                                <div className="card-img-container">
                                    <img
                                        src={
                                            imageSources.length > 0
                                                ? imageSources[0]
                                                : 'https://via.placeholder.com/300'
                                        }
                                        className="card-img-top"
                                        alt={product.productName || 'Product'}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300';
                                        }}
                                    />
                                </div>
                                <div className="compact-card-body">
                                    <h6 className="product-title">
                                        {product.productName || 'Unnamed Product'}
                                    </h6>
                                    <p className="product-description">
                                        {product.description || 'No description'}
                                    </p>
                                    <p className="mb-2">
                                        <strong>Current Bid:</strong>{' '}
                                        <span className={`price-display ${priceChanged[product.id] ? 'price-changed' : ''}`}>
                                            ₹{product.currentPrice || 'N/A'}
                                        </span>
                                    </p>
                                    <div className="d-flex justify-content-between align-items-center">
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
                                            className={product.status === 'Ended' ? 'ended-button' : 'bid-button'}
                                        >
                                            {product.status === 'Active' ? 'Place Bid' : 'View'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <i className="bi bi-inbox"></i>
                    </div>
                    <p className="empty-state-text">No auctions available.</p>
                </div>
            )}
        </div>
    );
};

export default ViewProducts;