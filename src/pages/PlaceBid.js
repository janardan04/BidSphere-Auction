import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
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
    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [priceChanged, setPriceChanged] = useState(false);
    const prevPrice = useRef(null); // Use ref to track previous price
    const navigate = useNavigate();

    useEffect(() => {
        const productRef = ref(database, `auctions/${id}`);
        const unsubscribeProduct = onValue(
            productRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const productData = snapshot.val();
                    const currentPrice = productData.currentPrice;
                    if (prevPrice.current !== null && prevPrice.current !== currentPrice) {
                        setPriceChanged(true);
                        setTimeout(() => setPriceChanged(false), 800);
                    }
                    prevPrice.current = currentPrice; // Update previous price
                    setProduct({ id, ...productData });
                } else {
                    setError('Product not found.');
                }
                setLoading(false);
            },
            (err) => {
                setError('Failed to load product: ' + err.message);
                setLoading(false);
            }
        );

        const auctionsRef = ref(database, 'auctions');
        const unsubscribeAuctions = onValue(
            auctionsRef,
            (snapshot) => {
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
                                liveAuctionsList.push({ id: auctionId, ...auction });
                            }
                        }
                    });
                    setLiveAuctions(liveAuctionsList);
                }
            },
            (err) => {
                console.error('Error fetching live auctions:', err);
            }
        );

        return () => {
            unsubscribeProduct();
            unsubscribeAuctions();
        };
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

        if (!product) return;

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
            setBidAmount('');
        } catch (err) {
            setError('Failed to place bid: ' + err.message);
        }
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedImage('');
    };

    if (loading) {
        return (
            <div className="spinner-container">
                <div className=" spinner"></div>
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

    const imageSources = product?.images?.length > 0 
        ? product.images 
        : product?.image 
        ? [product.image] 
        : [];

    return (
        <div className="place-bid-page">
            <div className="container py-4">
                <div className="row">
                    <div className="col-md-6">
                        {imageSources.length > 0 ? (
                            imageSources.length === 1 ? (
                                <img
                                    src={imageSources[0] || "/placeholder.svg"}
                                    alt="Product"
                                    className="product-image"
                                    onClick={() => handleImageClick(imageSources[0])}
                                    onError={(e) => (e.target.src = 'https://via.placeholder.com/400')}
                                />
                            ) : (
                                <Carousel className="carousel">
                                    {imageSources.map((imageUrl, index) => (
                                        <Carousel.Item key={index}>
                                            <img
                                                className="d-block w-100"
                                                src={imageUrl || "/placeholder.svg"}
                                                alt={`Product ${index + 1}`}
                                                onClick={() => handleImageClick(imageUrl)}
                                                onError={(e) => (e.target.src = 'https://via.placeholder.com/400')}
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
                                    className="product-image"
                                />
                            </div>
                        )}
                    </div>
                    <div className="col-md-6">
                        <div className="product-details">
                            <h1>{product?.productName || 'Loading...'}</h1>
                            <p className="text-gray-600">{product?.description || 'No description available'}</p>
                            
                            <div className="product-info-grid">
                                <div className="info-box">
                                    <p className="info-label">Starting Price</p>
                                    <p className="info-value">₹{product?.startingPrice || 'N/A'}</p>
                                </div>
                                <div className="info-box highlight">
                                    <p className="info-label">Current Bid</p>
                                    <p className={`info-value ${priceChanged ? 'price-changed' : ''}`}>
                                        ₹{product?.currentPrice || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="product-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Highest Bidder:</span>
                                    <span>{product?.highestBidder || 'No bids yet'}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Start Time:</span>
                                    <span>{product?.startTime ? new Date(product.startTime).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">End Time:</span>
                                    <span>{product?.endTime ? new Date(product.endTime).toLocaleString() : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="bid-form-card mt-4">
                                <form onSubmit={handlePlaceBid} className="space-y-4">
                                    <div className="form-group">
                                        <label htmlFor="bidAmount" className="form-label">Your Bid (₹)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="bidAmount"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            min={(product?.currentPrice || 0) + 1}
                                            required
                                        />
                                    </div>
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    {success && <div className="alert alert-success">{success}</div>}
                                    <button type="submit" className="btn btn-primary w-100">Place Bid</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <h3 className="section-title">Other Live Auctions</h3>
                    {liveAuctions.length > 0 ? (
                        <div className="auctions-grid">
                            {liveAuctions.map((auction) => {
                                const auctionImageSources = auction.images?.length > 0 
                                    ? auction.images 
                                    : auction.image 
                                    ? [auction.image] 
                                    : [];
                                return (
                                    <div key={auction.id} className="card">
                                        <div className="card-img-container">
                                            <img
                                                src={auctionImageSources.length > 0 ? auctionImageSources[0] : 'https://via.placeholder.com/300'}
                                                className="card-img-top"
                                                alt={auction.productName}
                                                onClick={() => handleImageClick(auctionImageSources[0])}
                                                onError={(e) => (e.target.src = 'https://via.placeholder.com/300')}
                                            />
                                        </div>
                                        <div className="card-body">
                                            <h5 className="card-title">{auction.productName}</h5>
                                            <div className="meta-item mb-2">
                                                <span className="meta-label">Current Bid:</span>
                                                <span className="font-bold">₹{auction.currentPrice}</span>
                                            </div>
                                            <div className="meta-item mb-3">
                                                <span className="meta-label">Ends:</span>
                                                <span className="text-sm">{new Date(auction.endTime).toLocaleString()}</span>
                                            </div>
                                            <Link to={`/place-bid/${auction.id}`} className="btn btn-primary w-100">
                                                Place Bid
                                            </Link>
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

            {showModal && (
                <div className="image-modal active" onClick={closeModal}>
                    <button className="close-btn" onClick={closeModal}>×</button>
                    <img src={selectedImage || "/placeholder.svg"} alt="Full view" />
                </div>
            )}
        </div>
    );
};

export default PlaceBid;