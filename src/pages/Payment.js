import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ref, get, set, push } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import '../styles/payment.css';

const Payment = () => {
  const [auction, setAuction] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const auctionId = queryParams.get('auctionId');

  useEffect(() => {
    if (auctionId) {
      const auctionRef = ref(database, `auctions/${auctionId}`);
      get(auctionRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setAuction({
              id: auctionId,
              productName: data.productName,
              currentPrice: data.currentPrice,
              seller: data.seller, // This is the seller's email
              sellerId: data.sellerId, // Add sellerId if available in auctions
              highestBidder: data.highestBidder || 'No bidder',
              images: data.images && data.images.length > 0 ? data.images[0] : null,
            });
          } else {
            setError('Auction not found.');
          }
          setLoading(false);
        })
        .catch((err) => {
          setError('Error fetching auction details: ' + err.message);
          setLoading(false);
        });
    } else {
      setError('No auction ID provided.');
      setLoading(false);
    }
  }, [auctionId]);

  const handlePayment = () => {
    if (!paymentMethod) {
      setError('Please select a payment method.');
      return;
    }

    setProcessing(true);
    setError('');

    const paymentsRef = ref(database, 'payments');
    const newPaymentRef = push(paymentsRef);

    const paymentData = {
      auctionId: auctionId,
      userId: auction.highestBidder,
      userEmail: auction.highestBidder,
      amount: auction.currentPrice,
      paymentMethod: paymentMethod,
      paymentStatus: 'Completed',
      paymentDate: Date.now(),
      sellerId: auction.sellerId || auction.seller, // Use sellerId if available, otherwise use seller email
      sellerEmail: auction.seller, // Store the seller's email
    };

    set(newPaymentRef, paymentData)
      .then(() => {
        setSuccess('Payment successful!');
        setTimeout(() => navigate(`/receipt?auctionId=${auctionId}`), 2000);
      })
      .catch((err) => {
        setError('Payment failed: ' + err.message);
        setProcessing(false);
      });
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="error-message">
            <i className="bi bi-exclamation-triangle"></i>
            <p>{error}</p>
            <button className="back-button" onClick={() => navigate('/profile')}>
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h2>Complete Your Payment</h2>
        </div>
        
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

        <div className="payment-content">
          <div className="product-summary">
            <div className="product-image">
              {auction.images ? (
                <img src={auction.images || "/placeholder.svg"} alt={auction.productName} />
              ) : (
                <div className="no-image">
                  <i className="bi bi-image"></i>
                </div>
              )}
            </div>
            <div className="product-details">
              <h3>{auction.productName}</h3>
              <div className="price-tag">₹{auction.currentPrice.toFixed(2)}</div>
              <p className="seller-info">
                <i className="bi bi-person"></i> Seller: {auction.seller}
              </p>
              <p className="auction-id">
                <i className="bi bi-tag"></i> Auction ID: {auction.id}
              </p>
            </div>
          </div>

          <div className="payment-methods">
            <h4>Select Payment Method</h4>
            
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  checked={paymentMethod === 'upi'}
                />
                <div className="option-content">
                  <i className="bi bi-phone"></i>
                  <span>UPI</span>
                </div>
              </label>
              
              <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  checked={paymentMethod === 'card'}
                />
                <div className="option-content">
                  <i className="bi bi-credit-card"></i>
                  <span>Credit/Debit Card</span>
                </div>
              </label>
              
              <label className={`payment-option ${paymentMethod === 'netbanking' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="netbanking"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  checked={paymentMethod === 'netbanking'}
                />
                <div className="option-content">
                  <i className="bi bi-bank"></i>
                  <span>Net Banking</span>
                </div>
              </label>
            </div>
          </div>

          <button
            className="pay-button"
            onClick={handlePayment}
            disabled={processing || !paymentMethod}
          >
            {processing ? (
              <>
                <span className="spinner small"></span>
                Processing...
              </>
            ) : (
              <>Pay Now ₹{auction?.currentPrice?.toFixed(2)}</>
            )}
          </button>
          
          <button className="back-button" onClick={() => navigate('/profile')}>
            <i className="bi bi-arrow-left"></i> Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
