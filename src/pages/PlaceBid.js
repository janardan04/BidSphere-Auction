import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ref, onValue, update, push, set, get } from 'firebase/database';
import { auth, database } from '../firebase/firebaseConfig';
import { Carousel } from 'react-bootstrap';
import { validateBidAmount } from '../utils/validation';
import { notifyNewBid } from '../utils/notificationService';
import '../styles/place-bid.css';

const PlaceBid = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [liveAuctions, setLiveAuctions] = useState([]);
    const [bidAmount, setBidAmount] = useState('');
    const [bidHistory, setBidHistory] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState('');
    const [priceChanged, setPriceChanged] = useState(false);
    const [fieldError, setFieldError] = useState('');
    const [showBidHistory, setShowBidHistory] = useState(false);
    const [userNamesMap, setUserNamesMap] = useState({});
    const prevPrice = useRef(null);
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
                    prevPrice.current = currentPrice;
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

        // Listen for bid history
        const bidsRef = ref(database, `auctions/${id}/bids`);
        const unsubscribeBids = onValue(bidsRef, (snapshot) => {
            if (snapshot.exists()) {
                const bidsData = snapshot.val();
                const bidsList = Object.entries(bidsData)
                    .map(([bidId, bid]) => ({ id: bidId, ...bid }))
                    .sort((a, b) => b.timestamp - a.timestamp);
                setBidHistory(bidsList);
            } else {
                setBidHistory([]);
            }
        });

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

        // Fetch users and sellers to map emails to names for old bids
        const usersRef = ref(database, 'users');
        const sellersRef = ref(database, 'sellers');

        get(usersRef).then(snapshot => {
            const map = {};
            if (snapshot.exists()) {
                Object.values(snapshot.val()).forEach(user => {
                    if (user.email) map[user.email.toLowerCase()] = user.name;
                });
            }
            get(sellersRef).then(sellerSnap => {
                if (sellerSnap.exists()) {
                    Object.values(sellerSnap.val()).forEach(seller => {
                        if (seller.email) map[seller.email.toLowerCase()] = seller.businessName || seller.sellerName;
                    });
                }
                setUserNamesMap(map);
            }).catch(err => console.warn("Sellers read denied: ", err.message));
        }).catch(err => console.warn("Users read denied: ", err.message));

        return () => {
            unsubscribeProduct();
            unsubscribeBids();
            unsubscribeAuctions();
        };
    }, [id]);

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setFieldError('');

        if (!auth.currentUser) {
            setError('Please log in to place a bid.');
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        if (!product) return;

        // Prevent seller from bidding on own product
        if (auth.currentUser.email === product.seller || auth.currentUser.uid === product.sellerId) {
            setError('You cannot bid on your own product.');
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

        // Validate bid amount
        const bidValidation = validateBidAmount(bidAmount, product.currentPrice);
        if (bidValidation) {
            setFieldError(bidValidation);
            return;
        }

        const bidValue = parseFloat(bidAmount);

        try {
            const productRef = ref(database, `auctions/${id}`);

            // Update the auction with new highest bid
            await update(productRef, {
                currentPrice: bidValue,
                highestBidder: auth.currentUser.email,
                highestBidderName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            });

            // Store bid in bid history
            const bidsRef = ref(database, `auctions/${id}/bids`);
            const newBidRef = push(bidsRef);
            await set(newBidRef, {
                bidder: auth.currentUser.email,
                bidderName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                amount: bidValue,
                timestamp: Date.now(),
            });

            // Notify the seller
            await notifyNewBid(
                product.seller,
                product.productName,
                bidValue,
                auth.currentUser.email
            );

            setSuccess('Bid placed successfully!');
            setBidAmount('');
        } catch (err) {
            setError('Failed to place bid: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="glass-loader">
                <div className="spinner-premium"></div>
                <h4 className="text-gray-600 mt-3">Loading Auction Details...</h4>
            </div>
        );
    }

    if (error && !product) {
        return (
            <div className="premium-container mt-5">
                <div className="premium-alert alert-danger-premium">
                    <i className="fas fa-exclamation-circle text-xl"></i>
                    <div>{error}</div>
                </div>
            </div>
        );
    }

    const imageSources = product?.images?.length > 0
        ? product.images
        : product?.image
            ? [product.image]
            : [];

    const currentTime = Date.now();
    const isAuctionActive = product && currentTime >= product.startTime && currentTime < product.endTime;
    const isAuctionEnded = product && currentTime >= product.endTime;

    return (
        <div className="place-bid-page">
            <div className="premium-container">
                <div className="product-split">
                    {/* LEFT PANE - Image Gallery */}
                    <div className="product-gallery">
                        {imageSources.length > 0 ? (
                            imageSources.length === 1 ? (
                                <div className="main-image-container group">
                                    <img
                                        src={imageSources[0] || "/placeholder.svg"}
                                        alt="Product"
                                        className="main-image"
                                        onError={(e) => (e.target.src = 'https://via.placeholder.com/600x450')}
                                    />
                                </div>
                            ) : (
                                <Carousel className="premium-carousel" indicators={true}>
                                    {imageSources.map((imageUrl, index) => (
                                        <Carousel.Item key={index}>
                                            <div className="main-image-container">
                                                <img
                                                    className="main-image"
                                                    src={imageUrl || "/placeholder.svg"}
                                                    alt={`Product ${index + 1}`}
                                                    onError={(e) => (e.target.src = 'https://via.placeholder.com/600x450')}
                                                />
                                            </div>
                                        </Carousel.Item>
                                    ))}
                                </Carousel>
                            )
                        ) : (
                            <div className="main-image-container flex items-center justify-center bg-gray-100">
                                <div className="text-center p-5 text-gray-500">
                                    <i className="fas fa-image text-4xl mb-3"></i>
                                    <p>No images available</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANE - Product Details & Bidding */}
                    <div className="product-info-panel">
                        <div className="glass-panel">
                            {/* Status Pill */}
                            <div className="mb-4">
                                <span className={`status-badge ${isAuctionActive ? 'status-active' : isAuctionEnded ? 'status-ended' : 'status-upcoming'}`}>
                                    {isAuctionActive && <i className="fas fa-circle text-xs"></i>}
                                    {isAuctionActive ? 'Live Auction' : isAuctionEnded ? 'Auction Ended' : 'Starts Soon'}
                                </span>
                            </div>

                            <h1 className="premium-title">{product?.productName || 'Loading...'}</h1>
                            <p className="premium-desc">{product?.description || 'No description available for this item.'}</p>

                            <div className="meta-grid">
                                <div className="meta-pill">
                                    <i className="fas fa-user-tag"></i>
                                    <span>Seller: <strong>{product?.seller?.split('@')[0]}</strong></span>
                                </div>
                                <div className="meta-pill">
                                    <i className="fas fa-calendar-alt"></i>
                                    <span>Ends: <strong>{product?.endTime ? new Date(product.endTime).toLocaleDateString() : 'N/A'}</strong></span>
                                </div>
                                <div className="meta-pill">
                                    <i className="fas fa-gavel"></i>
                                    <span>Bids: <strong>{bidHistory.length}</strong></span>
                                </div>
                            </div>

                            <div className="price-grid">
                                <div className="price-card">
                                    <h4 className="price-label">Starting Price</h4>
                                    <div className="price-value">
                                        <span className="price-currency">₹</span>
                                        {product?.startingPrice?.toLocaleString() || 'N/A'}
                                    </div>
                                </div>
                                <div className="price-card highlight">
                                    <h4 className="price-label">Current Highest Bid</h4>
                                    <div className={`price-value ${priceChanged ? 'price-pulse' : ''}`}>
                                        <span className="price-currency">₹</span>
                                        {product?.currentPrice?.toLocaleString() || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {isAuctionActive && (
                                <div className="premium-form mt-4">
                                    <form onSubmit={handlePlaceBid}>
                                        <div className="mb-4">
                                            <label htmlFor="bidAmount" className="input-label">Your Bid Amount (₹)</label>
                                            <input
                                                type="number"
                                                className="premium-input"
                                                id="bidAmount"
                                                value={bidAmount}
                                                onChange={(e) => {
                                                    setBidAmount(e.target.value);
                                                    setFieldError('');
                                                }}
                                                min={(product?.currentPrice || 0) + 1}
                                                placeholder={`Must be higher than ₹${((product?.currentPrice || 0) + Math.max(1, (product?.currentPrice || 0) * 0.01)).toFixed(0)}`}
                                                required
                                            />
                                            {fieldError && (
                                                <div className="text-red-500 text-sm mt-2 fw-bold"><i className="fas fa-exclamation-triangle me-1"></i>{fieldError}</div>
                                            )}
                                        </div>
                                        {error && <div className="premium-alert alert-danger-premium mb-4"><i className="fas fa-times-circle"></i>{error}</div>}
                                        {success && <div className="premium-alert alert-success-premium mb-4"><i className="fas fa-check-circle"></i>{success}</div>}

                                        <button type="submit" className="premium-btn">
                                            <i className="fas fa-gavel"></i> Place Bid Now
                                        </button>
                                    </form>
                                </div>
                            )}

                            {isAuctionEnded && (
                                <div className="premium-alert alert-info-premium mt-4">
                                    <i className="fas fa-trophy text-2xl"></i>
                                    <div>
                                        <strong className="d-block mb-1">Auction Closed</strong>
                                        Winning Bidder: <strong>
                                            {product?.highestBidderName ||
                                                (product?.highestBidder ? (userNamesMap[product.highestBidder.toLowerCase()] || product.highestBidder.split('@')[0]) : 'No bids placed')}
                                        </strong>
                                    </div>
                                </div>
                            )}

                            {!isAuctionActive && !isAuctionEnded && (
                                <div className="premium-alert alert-warning-premium mt-4">
                                    <i className="fas fa-clock text-2xl"></i>
                                    <div>
                                        <strong className="d-block mb-1">Auction Not Started</strong>
                                        Begins on: {product?.startTime ? new Date(product.startTime).toLocaleString() : 'N/A'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTTOM SECTION - Bid History & Live Auctions */}
                <div className="row mt-5 pt-4">
                    <div className="col-12">
                        {/* Bid History Table */}
                        {bidHistory.length > 0 && (
                            <div className="mb-6">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    {/* <h3 className="section-heading mb-0">
                                        <i className="fas fa-history"></i> Live Bid History
                                    </h3> */}
                                    <button
                                        className="btn btn-outline-primary rounded-pill px-4 premium-toggle-btn"
                                        onClick={() => setShowBidHistory(!showBidHistory)}
                                    >
                                        {showBidHistory ? (
                                            <><i className="fas fa-eye-slash me-2"></i> Hide History</>
                                        ) : (
                                            <><i className="fas fa-eye me-2"></i> View History</>
                                        )}
                                    </button>
                                </div>
                                {showBidHistory && (
                                    <div className="premium-table-container animate__animated animate__fadeIn">
                                        <table className="premium-table">
                                            <thead>
                                                <tr>
                                                    <th width="80">Rank</th>
                                                    <th>Bidder Name</th>
                                                    <th className="text-right">Amount Placed</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bidHistory.map((bid, index) => {
                                                    const parsedEmail = bid.bidder ? bid.bidder.toLowerCase() : '';
                                                    const fallbackName = bid.bidder ? bid.bidder.split('@')[0] : 'Unknown';
                                                    const displayName = bid.bidderName || userNamesMap[parsedEmail] || fallbackName;

                                                    return (
                                                        <tr key={bid.id}>
                                                            <td>
                                                                <span className="rank-badge">#{index + 1}</span>
                                                            </td>
                                                            <td>
                                                                <div className="bidder-name">
                                                                    <div className="bidder-avatar">
                                                                        {displayName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="font-medium">{displayName}</span>
                                                                </div>
                                                            </td>
                                                            <td className="bid-amount text-right">₹{bid.amount.toLocaleString()}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Other Live Auctions Grid */}
                        <div className="mt-5 pt-4">
                            <h3 className="section-heading">
                                <i className="fas fa-fire text-danger"></i> Hot Live Auctions
                            </h3>
                            {liveAuctions.length > 0 ? (
                                <div className="modern-grid">
                                    {liveAuctions.map((auction) => {
                                        const auctionImageSources = auction.images?.length > 0
                                            ? auction.images
                                            : auction.image
                                                ? [auction.image]
                                                : [];
                                        return (
                                            <Link to={`/place-bid/${auction.id}`} key={auction.id} className="text-decoration-none">
                                                <div className="auction-card">
                                                    <div className="ac-image-wrapper">
                                                        <img
                                                            src={auctionImageSources.length > 0 ? auctionImageSources[0] : 'https://via.placeholder.com/300'}
                                                            className="ac-image"
                                                            alt={auction.productName}
                                                            onError={(e) => (e.target.src = 'https://via.placeholder.com/300')}
                                                        />
                                                    </div>
                                                    <div className="ac-body">
                                                        <h5 className="ac-title text-truncate">{auction.productName}</h5>

                                                        <div className="ac-price-row">
                                                            <div>
                                                                <div className="ac-label">Current Bid</div>
                                                                <div className="ac-price">₹{auction.currentPrice?.toLocaleString()}</div>
                                                            </div>
                                                        </div>

                                                        <div className="ac-time mb-3">
                                                            <i className="far fa-clock"></i>
                                                            <span>Ends: {new Date(auction.endTime).toLocaleDateString()}</span>
                                                        </div>

                                                        <div className="ac-btn">View Auction <i className="fas fa-arrow-right ms-2 text-sm"></i></div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="glass-panel text-center py-5">
                                    <i className="fas fa-box-open text-4xl text-gray-400 mb-3"></i>
                                    <p className="text-gray-500 mb-0">No other live auctions are available right now.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaceBid;