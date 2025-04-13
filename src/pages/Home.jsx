import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/index.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="background-elements">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="floating-shape"
            style={{
              width: `${Math.random() * 200 + 50}px`,
              height: `${Math.random() * 200 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 15}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
        {[...Array(15)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="particle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      <div className="content-wrapper">
        <div className="hero-section">
          <div className="platform-badge">
            <i className="fas fa-gavel"></i>
            <span>Online Auction Platform</span>
          </div>
          <h1 className="hero-title">Welcome to BidSphere!</h1>
          <p className="hero-text">
            Discover unique items & exciting auctions. Buy, sell, and bid with confidence on our trusted platform!
          </p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">
              <i className="fas fa-sign-in-alt"></i>
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              <i className="fas fa-user-plus"></i>
              Register
            </Link>
            <Link to="/auctions" className="btn btn-primary">
              <i className="fas fa-gavel"></i>
              Auctions
            </Link>
          </div>
        </div>
        <div className="features-section">
          <h2 className="section-title">Why Choose BidSphere</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3 className="feature-title">Secure Bidding</h3>
              <p className="feature-description">
                Safe and encrypted transactions for peace of mind with advanced security protocols.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h3 className="feature-title">Real-time Updates</h3>
              <p className="feature-description">
                Instant bid notifications and auction alerts so you never miss an opportunity.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-trophy"></i>
              </div>
              <h3 className="feature-title">Win Amazing Items</h3>
              <p className="feature-description">
                Unique collectibles & rare finds at great prices from sellers worldwide.
              </p>
            </div>
          </div>
        </div>
        <div className="how-it-works-section">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">
                <i className="fas fa-user-plus"></i>
              </div>
              <h3 className="step-title">Register</h3>
              <p className="step-description">
                Create an account to start bidding or selling on our platform.
              </p>
            </div>
            <div className="step-card">
              <div className="step-icon">
                <i className="fas fa-search"></i>
              </div>
              <h3 className="step-title">Find Items</h3>
              <p className="step-description">
                Browse or search for items you're interested in from our vast collection.
              </p>
            </div>
            <div className="step-card">
              <div className="step-icon">
                <i className="fas fa-gavel"></i>
              </div>
              <h3 className="step-title">Bid or Sell</h3>
              <p className="step-description">
                Place bids on items or list your own for auction and start earning.
              </p>
            </div>
          </div>
          <div className="final-cta">
            <Link to="/register" className="btn btn-primary btn-large">
              <i className="fas fa-user"></i>
              Get Started Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;