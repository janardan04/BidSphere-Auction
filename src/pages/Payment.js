import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ref, get, set, push } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import { Button, Form, Alert } from 'react-bootstrap';
import '../styles/payment.css';

const Payment = () => {
  const [auction, setAuction] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(true);
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

    setLoading(true);

    const paymentsRef = ref(database, 'payments');
    const newPaymentRef = push(paymentsRef);

    const paymentData = {
      auctionId: auctionId,
      userId: auction.highestBidder,
      userEmail: auction.highestBidder,
      amount: auction.currentPrice,
      paymentStatus: 'Completed',
      paymentDate: Date.now(),
      sellerId: auction.sellerId || auction.seller, // Use sellerId if available, otherwise use seller email
      sellerEmail: auction.seller, // Store the seller's email
    };

    set(newPaymentRef, paymentData)
      .then(() => {
        setSuccess('Payment successful! Redirecting to receipt...');
        setTimeout(() => navigate(`/receipt?auctionId=${auctionId}`), 2000);
      })
      .catch((err) => {
        setError('Payment failed: ' + err.message);
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="container py-5">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="mb-4">Payment for {auction.productName}</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="card p-4">
        <h4>Amount: ₹{auction.currentPrice.toFixed(2)}</h4>
        <p>Seller: {auction.seller}</p>
        <p>Auction ID: {auction.id}</p>

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Select Payment Method</Form.Label>
            <Form.Check
              type="radio"
              label="UPI"
              name="paymentMethod"
              value="upi"
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <Form.Check
              type="radio"
              label="Credit/Debit Card"
              name="paymentMethod"
              value="card"
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <Form.Check
              type="radio"
              label="Net Banking"
              name="paymentMethod"
              value="netbanking"
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </Form.Group>

          <Button
            variant="success"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Payment;