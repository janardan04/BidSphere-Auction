// src/pages/PlaceBid.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { auth, database } from '../firebase/firebaseConfig';
import { Carousel } from 'react-bootstrap';
import '../styles/place-bid.css';

const PlaceBid = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [liveAuctions, setLiveAuctions] = useState([]);
    const [bidAmount, setBidAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            const productRef = ref(database, `auctions/${id}`);
            try {
                const snapshot = await get(productRef);
                if (snapshot.exists()) {
                    const productData = snapshot.val();
                    console.log('Fetched product data:', productData);
                    setProduct({ id, ...productData });
                } else {
                    setError('Product not found.');
                }
            } catch (err) {
                setError('Failed to load product: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchLiveAuctions = async () => {
            const auctionsRef = ref(database, 'auctions');
            try {
                const snapshot = await get(auctionsRef);
                if (snapshot.exists()) {
                    const auctionsData = snapshot.val();
                    const currentTime = new Date().getTime();
                    const liveAuctionsList = [];

                    Object.keys(auctionsData).forEach((auctionId) => {
                        if (auctionId !== id) {
                            const auction = auctionsData[auctionId];
                            const startTime = auction.startTime || 0;
                            const endTime = auction.endTime || 0;
                            if (currentTime >= startTime && currentTime < endTime) {
                                liveAuctionsList.push({
                                    id: auctionId,
                                    ...auction,
                                });
                            }
                        }
                    });

                    setLiveAuctions(liveAuctionsList);
                }
            } catch (err) {
                console.error('Error fetching live auctions:', err);
            }
        };

        fetchProduct();
        fetchLiveAuctions();
    }, [id]);

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!auth.currentUser) {
            setError('Please log in to place a bid.');
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        const currentTime = new Date().getTime();
        if (currentTime < product.startTime) {
            setError('This auction has not yet started.');
            return;
        }
        if (currentTime >= product.endTime) {
            setError('This auction has ended.');
            return;
        }

        const bidValue = parseFloat(bidAmount);
        if (isNaN(bidValue) || bidValue <= product.currentPrice) {
            setError('Your bid must be higher than the current price.');
            return;
        }

        try {
            const productRef = ref(database, `auctions/${id}`);
            await update(productRef, {
                currentPrice: bidValue,
                highestBidder: auth.currentUser.email,
            });

            setSuccess('Bid placed successfully!');
            setProduct((prev) => ({
                ...prev,
                currentPrice: bidValue,
                highestBidder: auth.currentUser.email,
            }));
            setBidAmount('');
        } catch (err) {
            setError('Failed to place bid: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error && !product) {
        return (
            <div className="container my-5">
                <div className="alert alert-danger">{error}</div>
            </div>
        );
    }

    // Determine image source: base64 string (old format) or array of URLs (new format)
    const imageSources = product.images && product.images.length > 0 
        ? product.images 
        : product.image 
        ? [product.image] 
        : [];

    return (
        <div className="place-bid-page" style={{ paddingTop: '80px' }}>
            <div className="container">
                <div className="row">
                    <div className="col-md-6">
                        {imageSources.length > 0 ? (
                            imageSources.length === 1 ? (
                                <img
                                    src={imageSources[0]}
                                    alt="Product"
                                    className="img-fluid"
                                    style={{ height: '400px', objectFit: 'cover' }}
                                    onError={(e) => {
                                        console.error('Image failed to load:', imageSources[0]);
                                        e.target.src = 'https://via.placeholder.com/400';
                                    }}
                                />
                            ) : (
                                <Carousel>
                                    {imageSources.map((imageUrl, index) => (
                                        <Carousel.Item key={index}>
                                            <img
                                                className="d-block w-100"
                                                src={imageUrl}
                                                alt={`Product ${index + 1}`}
                                                style={{ height: '400px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    console.error('Image failed to load:', imageUrl);
                                                    e.target.src = 'https://via.placeholder.com/400';
                                                }}
                                            />
                                        </Carousel.Item>
                                    ))}
                                </Carousel>
                            )
                        ) : (
                            <div>
                                <p>No images available for this product.</p>
                                <img
                                    src="https://via.placeholder.com/400"
                                    alt="Product"
                                    className="img-fluid"
                                    style={{ height: '400px', objectFit: 'cover' }}
                                />
                            </div>
                        )}
                    </div>
                    <div className="col-md-6">
                        <h2>{product.productName}</h2>
                        <p>{product.description}</p>
                        <p>
                            <strong>Starting Price:</strong> ₹{product.startingPrice}
                        </p>
                        <p>
                            <strong>Current Bid:</strong> ₹{product.currentPrice}
                        </p>
                        <p>
                            <strong>Highest Bidder:</strong> {product.highestBidder || 'No bids yet'}
                        </p>
                        <p>
                            <strong>Start Time:</strong> {new Date(product.startTime).toLocaleString()}
                        </p>
                        <p>
                            <strong>End Time:</strong> {new Date(product.endTime).toLocaleString()}
                        </p>

                        <form onSubmit={handlePlaceBid} className="mt-4">
                            <div className="mb-3">
                                <label htmlFor="bidAmount" className="form-label">
                                    Your Bid (₹)
                                </label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="bidAmount"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    min={product.currentPrice + 1}
                                    required
                                />
                            </div>
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
                            <button type="submit" className="btn btn-primary w-100">
                                Place Bid
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-5">
                    <h3>Other Live Auctions</h3>
                    {liveAuctions.length > 0 ? (
                        <div className="row">
                            {liveAuctions.map((auction) => {
                                const auctionImageSources = auction.images && auction.images.length > 0 
                                    ? auction.images 
                                    : auction.image 
                                    ? [auction.image] 
                                    : [];
                                return (
                                    <div key={auction.id} className="col-md-4 mb-4">
                                        <div className="card h-100">
                                            <img
                                                src={
                                                    auctionImageSources.length > 0
                                                        ? auctionImageSources[0]
                                                        : 'https://via.placeholder.com/300'
                                                }
                                                className="card-img-top"
                                                alt={auction.productName}
                                                style={{ height: '200px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    console.error('Live auction image failed to load:', auctionImageSources.length > 0 ? auctionImageSources[0] : 'No image');
                                                    e.target.src = 'https://via.placeholder.com/300';
                                                }}
                                            />
                                            <div className="card-body">
                                                <h5 className="card-title">{auction.productName}</h5>
                                                <p className="card-text">
                                                    <strong>Current Bid:</strong> ₹{auction.currentPrice}
                                                </p>
                                                <p className="card-text">
                                                    <strong>Ends:</strong> {new Date(auction.endTime).toLocaleString()}
                                                </p>
                                                <Link
                                                    to={`/place-bid/${auction.id}`}
                                                    className="btn btn-primary w-100"
                                                >
                                                    Place Bid
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p>No other live auctions available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaceBid;