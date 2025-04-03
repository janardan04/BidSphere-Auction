import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import { Button, Alert } from 'react-bootstrap';

const Receipt = () => {
  const [auction, setAuction] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const auctionId = queryParams.get('auctionId');

  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '600px',
      margin: '0 auto',
    },
    card: {
      padding: '2rem',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#ffffff',
    },
    heading: {
      marginBottom: '1.5rem',
      fontSize: '1.8rem',
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#333',
    },
    paragraph: {
      marginBottom: '0.8rem',
      fontSize: '1rem',
      color: '#555',
    },
    button: {
      marginTop: '1.5rem',
      display: 'block',
      width: '100%',
      padding: '0.8rem',
      fontSize: '1rem',
      fontWeight: 'bold',
      backgroundColor: '#007bff',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      textAlign: 'center',
    },
    spinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    },
  };

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

  if (loading) {
    return (
      <div style={styles.spinner}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div style={styles.container}>
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Payment Receipt</h2>
      <div style={styles.card}>
        <h4>Thank you for your purchase!</h4>
        <p style={styles.paragraph}>
          <strong>Product Name:</strong> {auction.productName}
        </p>
        <p style={styles.paragraph}>
          <strong>Amount Paid:</strong> ₹{auction.currentPrice.toFixed(2)}
        </p>
        <p style={styles.paragraph}>
          <strong>Seller Email:</strong> {auction.seller}
        </p>
        <p style={styles.paragraph}>
          <strong>Auction ID:</strong> {auction.id}
        </p>
        <p style={styles.paragraph}>
          <strong>Description:</strong> {auction.description}
        </p>
        <p style={styles.paragraph}>
          <strong>Auction End Time:</strong> {auction.endTime}
        </p>
        <p style={styles.paragraph}>
          <strong>Payment Status:</strong> {payment.paymentStatus}
        </p>
        <button style={styles.button} onClick={() => navigate('/profile')}>
          Back to Profile
        </button>
      </div>
    </div>
  );
};

export default Receipt;