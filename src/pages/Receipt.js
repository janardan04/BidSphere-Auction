import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import '../styles/receipt.css';

const Receipt = () => {
  const [auction, setAuction] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const auctionId = queryParams.get('auctionId');

  useEffect(() => {
    if (auctionId) {
      const auctionRef = ref(database, `auctions/${auctionId}`);
      const paymentsRef = ref(database, `payments`);

      Promise.all([get(auctionRef), get(paymentsRef)])
        .then(([auctionSnapshot, paymentsSnapshot]) => {
          if (auctionSnapshot.exists()) {
            const data = auctionSnapshot.val();
            setAuction({
              id: auctionId,
              productName: data.productName,
              currentPrice: data.currentPrice,
              seller: data.seller,
              description: data.description,
              endTime: new Date(data.endTime).toLocaleString(),
              images: data.images && data.images.length > 0 ? data.images[0] : null,
            });

            if (paymentsSnapshot.exists()) {
              const payments = paymentsSnapshot.val();
              const payment = Object.values(payments).find(
                (p) => p.auctionId === auctionId
              );
              setPayment(payment || { paymentStatus: 'Pending' });
            } else {
              setPayment({ paymentStatus: 'Pending' });
            }
          } else {
            setError('Auction not found.');
          }
          setLoading(false);
        })
        .catch((err) => {
          setError('Error fetching receipt details: ' + err.message);
          setLoading(false);
        });
    } else {
      setError('No auction ID provided.');
      setLoading(false);
    }
  }, [auctionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="receipt-page">
        <div className="receipt-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading receipt...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="receipt-page">
        <div className="receipt-container">
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
    <div className="receipt-page">
      <div className="receipt-container">
        <div className="receipt-header">
          <h2>Payment Receipt</h2>
        </div>
        
        <div className="receipt-content">
          <div className="receipt-stamp">PAID</div>
          
          <div className="receipt-title">
            <i className="bi bi-check-circle-fill"></i>
            <h3>Thank you for your purchase!</h3>
          </div>
          
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
              <h4>{auction.productName}</h4>
              <div className="price-tag">₹{auction.currentPrice.toFixed(2)}</div>
            </div>
          </div>
          
          <div className="receipt-details">
            <div className="detail-row">
              <span className="detail-label">Seller:</span>
              <span className="detail-value">{auction.seller}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Auction ID:</span>
              <span className="detail-value">{auction.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{auction.description}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Auction End Time:</span>
              <span className="detail-value">{auction.endTime}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Payment Method:</span>
              <span className="detail-value">{payment.paymentMethod || 'Online Payment'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Payment Date:</span>
              <span className="detail-value">
                {payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="detail-row payment-status">
              <span className="detail-label">Payment Status:</span>
              <span className={`status-badge ${payment.paymentStatus === 'Completed' ? 'completed' : 'pending'}`}>
                {payment.paymentStatus}
              </span>
            </div>
          </div>
          
          <div className="receipt-actions">
            <button className="print-button" onClick={handlePrint}>
              <i className="bi bi-printer"></i> Print Receipt
            </button>
            <button className="back-button" onClick={() => navigate('/profile')}>
              <i className="bi bi-arrow-left"></i> Back to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
