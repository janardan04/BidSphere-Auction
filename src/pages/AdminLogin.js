import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Modal, Card, InputGroup } from 'react-bootstrap';
import { Eye, EyeSlash, Lock, Envelope, Shield } from 'react-bootstrap-icons'; // Updated imports
import '../styles/admin-login.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const navigate = useNavigate();

  // Hardcoded admin credentials
  const ADMIN_EMAIL = 'janardhanborse2003@gmail.com';
  const ADMIN_PASSWORD = 'admin123';

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      navigate('/admin-dashboard', { state: { isAuthenticated: true, email: ADMIN_EMAIL } });
    } else {
      setError('Invalid email or password. Only the admin can access this page.');
    }
  };

  const generateOtp = () => {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(generatedOtp);
    return generatedOtp;
  };

  const handleForgotPassword = () => {
    if (email !== ADMIN_EMAIL) {
      setError('Only the admin email (janardhanborse2003@gmail.com) can reset the password.');
      return;
    }
    const generatedOtp = generateOtp();
    setOtpSent(true);
    setResetStep(2);
    setShowForgotModal(true);
    console.log(`OTP sent to ${email}: ${generatedOtp}`);
  };

  const handleVerifyOtp = () => {
    if (enteredOtp !== otp) {
      setError('Invalid OTP. Please try again.');
      return;
    }
    setResetStep(3);
    setError('');
  };

  const handleResetPassword = () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    console.log(`Password reset to: ${newPassword}`);
    alert('Password reset successful. You can now login with your new password.');
    setShowForgotModal(false);
    setOtpSent(false);
    setError('');
    setEnteredOtp('');
    setNewPassword('');
    setOtp('');
    setResetStep(1);
  };

  const closeModal = () => {
    setShowForgotModal(false);
    setOtpSent(false);
    setError('');
    setEnteredOtp('');
    setNewPassword('');
    setOtp('');
    setResetStep(1);
  };

  return (
    <div className="admin-login-container">
      <Container className="login-wrapper">
        <div className="login-panel">
          <div className="login-content">
            <div className="login-header">
              <h1>Admin Portal</h1>
              <p className="subtitle">Enter your credentials to access the dashboard</p>
            </div>
            
            {error && <Alert variant="danger" className="animate-alert">{error}</Alert>}
            
            <Card className="login-card">
              <Card.Body>
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-4" controlId="formEmail">
                    <Form.Label>Email Address</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="input-icon"><Envelope /></InputGroup.Text> {/* Replaced Mail with Envelope */}
                      <Form.Control
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="custom-input"
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="formPassword">
                    <Form.Label>Password</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="input-icon"><Lock /></InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="custom-input"
                      />
                      <Button 
                        variant="light" 
                        className="password-toggle" 
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeSlash /> : <Eye />} {/* Replaced EyeOff with EyeSlash */}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <Button variant="primary" type="submit" className="login-btn">
                    Login
                  </Button>
                  
                  <div className="text-center mt-3">
                    <Button variant="link" onClick={handleForgotPassword} className="forgot-link">
                      Forgot Password?
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
            
            <div className="login-footer">
              <p>© {new Date().getFullYear()} Admin Portal. All rights reserved.</p>
            </div>
          </div>
        </div>
      </Container>

      <Modal 
        show={showForgotModal} 
        onHide={closeModal}
        centered
        className="reset-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {resetStep === 1 && "Reset Password"}
            {resetStep === 2 && "Verify OTP"}
            {resetStep === 3 && "Create New Password"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {resetStep === 1 && (
            <div className="verify-email-step">
              <div className="icon-container">
                <Envelope className="modal-icon" /> {/* Replaced Mail with Envelope */}
              </div>
              <p>Enter your email address to receive a verification code.</p>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </Form.Group>
            </div>
          )}
          
          {resetStep === 2 && (
            <div className="verify-otp-step">
              <div className="icon-container">
                <Shield className="modal-icon" />
              </div>
              <p>A 6-digit verification code has been sent to your email.</p>
              <Form.Group className="mb-3">
                <Form.Label>Enter OTP</Form.Label>
                <Form.Control
                  type="text"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                />
                <Form.Text className="text-muted">
                  For demo: Check console for OTP ({otp})
                </Form.Text>
              </Form.Group>
            </div>
          )}
          
          {resetStep === 3 && (
            <div className="new-password-step">
              <div className="icon-container">
                <Lock className="modal-icon" />
              </div>
              <p>Create a new password for your account.</p>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                  <Button 
                    variant="light" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlash /> : <Eye />} {/* Replaced EyeOff with EyeSlash */}
                  </Button>
                </InputGroup>
                <Form.Text>Password must be at least 6 characters long</Form.Text>
              </Form.Group>
            </div>
          )}
          
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          
          {resetStep === 1 && (
            <Button variant="primary" onClick={handleForgotPassword}>
              Send OTP
            </Button>
          )}
          
          {resetStep === 2 && (
            <Button variant="primary" onClick={handleVerifyOtp}>
              Verify OTP
            </Button>
          )}
          
          {resetStep === 3 && (
            <Button variant="success" onClick={handleResetPassword}>
              Reset Password
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminLogin;