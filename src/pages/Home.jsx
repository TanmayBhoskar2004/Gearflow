import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Nav, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// 🔗 Background image URL
const BACKGROUND_IMG =
  'https://res.cloudinary.com/mltjg0qg/image/upload/v1791379027/Background_Image...png';

// 🔗 Logo URL
const LOGO_URL =
  'https://res.cloudinary.com/mltjg0qg/image/upload/v1791351602/logo.png.png';

const Home = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // Modal control
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    address: '',
  });
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState(null);

  // Google auth loading
  const [googleLoading, setGoogleLoading] = useState(false);

  const heroBackground = {
    backgroundImage: `linear-gradient(rgba(20, 30, 45, 0.55), rgba(20, 30, 45, 0.9)), url(${BACKGROUND_IMG})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    backgroundRepeat: 'no-repeat',
  };

  // ============ HANDLERS ============
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(loginForm.username, loginForm.password);
      setShowAuthModal(false);
      navigate('/dashboard');
    } catch (err) {
      setLoginError(
        err.response?.data?.message || 'Login failed. Check your credentials.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setRegisterLoading(true);
    try {
      await api.post('/auth/register', { ...registerForm, role: 'CUSTOMER' });
      setRegisterSuccess('Registration successful! You can now login.');
      setRegisterForm({
        firstName: '', lastName: '', email: '', phone: '',
        username: '', password: '', address: '',
      });
      setTimeout(() => setActiveTab('login'), 1500);
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setRegisterLoading(false);
    }
  };

  // -------- FORGOT PASSWORD --------
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    // TODO: Wire to backend `POST /api/auth/forgot-password`
    setForgotMessage({
      type: 'success',
      text: `If ${forgotEmail} is registered, a reset link has been sent to your email.`,
    });
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotMessage(null);
      setForgotEmail('');
    }, 3000);
  };

  // -------- GOOGLE AUTH (MOCK) --------
  /**
   * ⚠️ This is a MOCK Google login for demo purposes.
   *
   * To make it fully functional:
   * 1. Sign up at https://console.cloud.google.com
   * 2. Create OAuth 2.0 Client ID (Web Application)
   * 3. Add http://localhost:5173 to "Authorized JavaScript origins"
   * 4. Add the <script src="https://accounts.google.com/gsi/client" async defer></script>
   *    to index.html
   * 5. Replace this function with google.accounts.id.prompt() or use @react-oauth/google
   * 6. Backend: add POST /api/auth/google that validates the ID token and creates/signs in the user
   */
  const handleGoogleAuth = async (mode = 'login') => {
    setGoogleLoading(true);
    try {
      // Simulate network delay
      await new Promise((res) => setTimeout(res, 800));

      if (mode === 'login') {
        // MOCK: Log in as a demo Google user
        // In production, this token comes from Google, not hardcoded
        const mockToken = 'mock-google-token-' + Date.now();
        localStorage.setItem('token', mockToken);
        // Since we can't decode a fake JWT, set a mock user manually
        // In production, decode the real Google ID token
        alert(
          'Google login is set up (mock).\n\n' +
          'To make it real:\n' +
          '1. Add Google OAuth Client ID\n' +
          '2. Wire /api/auth/google on backend\n' +
          '3. Update handleGoogleAuth() to use the Google SDK'
        );
        setGoogleLoading(false);
        return;
      } else {
        // Register mode
        alert(
          'Google registration is set up (mock).\n\n' +
          'Same steps as Google login:\n' +
          '1. Google OAuth Client ID\n' +
          '2. Backend /api/auth/google endpoint'
        );
        setGoogleLoading(false);
        return;
      }
    } catch (err) {
      alert('Google authentication failed.');
      setGoogleLoading(false);
    }
  };

  // Frosted-glass input style
  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: 'white',
    borderRadius: '10px',
    padding: '12px 14px',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
  };

  const googleBtnStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    color: '#2c3e50',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '10px',
    padding: '10px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
  };

  return (
    <div style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* ============ HERO ============ */}
      <section
        style={{
          ...heroBackground,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          color: 'white',
          paddingTop: '100px',
          paddingBottom: '40px',
        }}
      >
        <Container>
          <Row className="justify-content-end">
            <Col lg={5} className="d-flex justify-content-end">
              {/* Top-right corner buttons */}
              {user ? (
                <Button
                  variant="info"
                  size="lg"
                  className="px-4 fw-bold"
                  onClick={() => navigate('/dashboard')}
                  style={{ boxShadow: '0 8px 24px rgba(0,184,212,0.4)' }}
                >
                  Go to Dashboard →
                </Button>
              ) : (
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-light"
                    size="lg"
                    className="px-4 fw-bold"
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      color: 'white',
                    }}
                    onClick={() => {
                      setActiveTab('login');
                      setShowAuthModal(true);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="info"
                    size="lg"
                    className="px-4 fw-bold"
                    style={{ boxShadow: '0 8px 24px rgba(0,184,212,0.4)' }}
                    onClick={() => {
                      setActiveTab('register');
                      setShowAuthModal(true);
                    }}
                  >
                    Register
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      {/* ============ FOOTER ============ */}
      <footer
        className="py-4 text-center"
        style={{
          backgroundColor: 'transparent',
          color: '#90a4ae',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <Container>
          <p className="mb-1" style={{ color: '#546e7a' }}>
            <strong>GearFlow</strong> &copy; {new Date().getFullYear()}
          </p>
          <small style={{ color: '#90a4ae' }}>
            Your trusted vehicle service center — Quality you can drive on.
          </small>
        </Container>
      </footer>

      {/* ============ AUTH MODAL ============ */}
      <Modal
        show={showAuthModal}
        onHide={() => setShowAuthModal(false)}
        centered
        size="lg"
        contentClassName="border-0"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        <div
          style={{
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0f1720 0%, #1a2530 100%)',
            color: 'white',
            border: '1px solid rgba(0,184,212,0.35)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,184,212,0.15)',
            position: 'relative',
          }}
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={() => setShowAuthModal(false)}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '20px',
              fontWeight: 400,
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(231,76,60,0.8)';
              e.currentTarget.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
            aria-label="Close"
          >
            ×
          </button>

          <div className="p-4" style={{ padding: '30px 40px' }}>
            {/* LOGO */}
            <div className="text-center mb-4">
              <img
                src={LOGO_URL}
                alt="GearFlow"
                style={{
                  height: '70px',
                  width: 'auto',
                  marginBottom: '8px',
                  filter: 'drop-shadow(0 4px 12px rgba(0,184,212,0.4))',
                }}
              />
              <h4 className="fw-bold mb-0">
                <span style={{ color: '#ffffff' }}>Gear</span>
                <span style={{ color: '#00b8d4' }}>Flow</span>
              </h4>
            </div>

            {/* TABS */}
            <Nav
              variant="pills"
              activeKey={activeTab}
              onSelect={(k) => {
                setActiveTab(k);
                setLoginError('');
                setRegisterError('');
                setRegisterSuccess('');
              }}
              className="mb-4"
              style={{
                gap: '6px',
                background: 'rgba(255,255,255,0.06)',
                padding: '4px',
                borderRadius: '12px',
              }}
            >
              <Nav.Item style={{ flex: 1 }}>
                <Nav.Link
                  eventKey="login"
                  className="text-center w-100"
                  style={{
                    background: activeTab === 'login' ? '#00b8d4' : 'transparent',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '10px 0',
                    fontWeight: 600,
                  }}
                >
                  Login
                </Nav.Link>
              </Nav.Item>
              <Nav.Item style={{ flex: 1 }}>
                <Nav.Link
                  eventKey="register"
                  className="text-center w-100"
                  style={{
                    background: activeTab === 'register' ? '#00b8d4' : 'transparent',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '10px 0',
                    fontWeight: 600,
                  }}
                >
                  Register
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {/* ============ LOGIN TAB ============ */}
            {activeTab === 'login' && (
              <>
                <Form onSubmit={handleLoginSubmit}>
                  {loginError && <Alert variant="danger">{loginError}</Alert>}

                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: '#cfd8dc', fontSize: '14px', fontWeight: 500 }}>
                      Username
                    </Form.Label>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '16px',
                          color: '#90a4ae',
                          pointerEvents: 'none',
                        }}
                      >
                        👤
                      </span>
                      <Form.Control
                        type="text"
                        placeholder="Enter your username"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        required
                        style={{ ...inputStyle, paddingLeft: '40px' }}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label style={{ color: '#cfd8dc', fontSize: '14px', fontWeight: 500 }}>
                      Password
                    </Form.Label>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '16px',
                          color: '#90a4ae',
                          pointerEvents: 'none',
                        }}
                      >
                        🔒
                      </span>
                      <Form.Control
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        style={{ ...inputStyle, paddingLeft: '40px' }}
                      />
                    </div>
                  </Form.Group>

                  {/* FORGOT PASSWORD LINK */}
                  <div className="text-end mb-3">
                    <Button
                      variant="link"
                      onClick={() => setShowForgotModal(true)}
                      style={{
                        color: '#00b8d4',
                        fontSize: '13px',
                        padding: 0,
                        textDecoration: 'none',
                      }}
                    >
                      Forgot Password?
                    </Button>
                  </div>

                  <Button
                    variant="info"
                    type="submit"
                    className="w-100 fw-bold mb-3"
                    size="lg"
                    disabled={loginLoading}
                    style={{ borderRadius: '10px' }}
                  >
                    {loginLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </Form>

                {/* DIVIDER */}
                <div className="d-flex align-items-center gap-2 my-3">
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                  <span style={{ color: '#90a4ae', fontSize: '12px', textTransform: 'uppercase' }}>
                    or continue with
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                </div>

                {/* GOOGLE LOGIN BUTTON */}
                <Button
                  onClick={() => handleGoogleAuth('login')}
                  disabled={googleLoading}
                  style={googleBtnStyle}
                >
                  <GoogleIcon />
                  {googleLoading ? 'Connecting...' : 'Continue with Google'}
                </Button>
              </>
            )}

            {/* ============ REGISTER TAB ============ */}
            {activeTab === 'register' && (
              <>
                <Form onSubmit={handleRegisterSubmit}>
                  {registerError && <Alert variant="danger">{registerError}</Alert>}
                  {registerSuccess && <Alert variant="success">{registerSuccess}</Alert>}

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: '#cfd8dc', fontSize: '14px', fontWeight: 500 }}>
                          First Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="First Name"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                          style={inputStyle}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: '#cfd8dc', fontSize: '14px', fontWeight: 500 }}>
                          Last Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Last Name"
                          value={registerForm.lastName}
                          onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                          style={inputStyle}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: '#cfd8dc', fontSize: '14px', fontWeight: 500 }}>
                      Email *
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="you@example.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                      style={inputStyle}
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: '#cfd8dc', fontSize: '14px', fontWeight: 500 }}>
                          Mobile No.
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Mobile No."
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          style={inputStyle}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ color: '#cfd8dc', fontSize: '14px', fontWeight: 500 }}>
                          Username *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Choose a username"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          required
                          style={inputStyle}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: '#cfd8dc', fontSize: '14px', fontWeight: 500 }}>
                      Password *
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Create a password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                      style={inputStyle}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label style={{ color: '#cfd8dc', fontSize: '14px', fontWeight: 500 }}>
                      Address
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Your address"
                      value={registerForm.address}
                      onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                      style={inputStyle}
                    />
                  </Form.Group>

                  <Button
                    variant="info"
                    type="submit"
                    className="w-100 fw-bold mb-3"
                    size="lg"
                    disabled={registerLoading}
                    style={{ borderRadius: '10px' }}
                  >
                    {registerLoading ? 'Registering...' : 'Register'}
                  </Button>
                </Form>

                {/* DIVIDER */}
                <div className="d-flex align-items-center gap-2 my-3">
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                  <span style={{ color: '#90a4ae', fontSize: '12px', textTransform: 'uppercase' }}>
                    or continue with
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                </div>

                {/* GOOGLE REGISTER BUTTON */}
                <Button
                  onClick={() => handleGoogleAuth('register')}
                  disabled={googleLoading}
                  style={googleBtnStyle}
                >
                  <GoogleIcon />
                  {googleLoading ? 'Connecting...' : 'Sign up with Google'}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* ============ FORGOT PASSWORD MODAL ============ */}
      <Modal
        show={showForgotModal}
        onHide={() => setShowForgotModal(false)}
        centered
        contentClassName="border-0"
      >
        <div
          style={{
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0f1720 0%, #1a2530 100%)',
            color: 'white',
            border: '1px solid rgba(0,184,212,0.35)',
            padding: '24px',
          }}
        >
          <h5 className="fw-bold mb-2">🔐 Reset Your Password</h5>
          <p className="text-muted small mb-3" style={{ color: '#90a4ae' }}>
            Enter your registered email and we'll send you a reset link.
          </p>

          {forgotMessage && (
            <Alert variant={forgotMessage.type}>{forgotMessage.text}</Alert>
          )}

          <Form onSubmit={handleForgotSubmit}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#cfd8dc', fontSize: '14px', fontWeight: 500 }}>
                Email Address
              </Form.Label>
              <Form.Control
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button
                variant="outline-light"
                onClick={() => setShowForgotModal(false)}
                className="flex-grow-1"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                Cancel
              </Button>
              <Button variant="info" type="submit" className="flex-grow-1 fw-bold">
                Send Reset Link
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

// ============================================================
// GOOGLE ICON (inline SVG — no external asset needed)
// ============================================================
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

export default Home;