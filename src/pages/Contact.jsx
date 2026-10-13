import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

// 🔗 Background image URL
const BACKGROUND_IMG =
  'https://res.cloudinary.com/mltjg0qg/image/upload/v1791353809/Background_image.png';

const Contact = () => {
  return (
    <div style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* ============ HERO ============ */}
      <section
        style={{
          backgroundImage: `linear-gradient(rgba(20, 30, 45, 0.75), rgba(20, 30, 45, 0.9)), url(${BACKGROUND_IMG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          color: 'white',
          paddingTop: '120px',
          paddingBottom: '60px',
        }}
      >
        <Container>
          <div className="text-center">
            <h6
              className="fw-bold text-uppercase mb-3"
              style={{ color: '#00b8d4', letterSpacing: '3px' }}
            >
              Contact Us
            </h6>
            <h1
              className="fw-bold mb-3"
              style={{ fontSize: '3.2rem', letterSpacing: '-1px' }}
            >
              Visit Our Service Center
            </h1>
            <p
              className="lead mx-auto"
              style={{ color: '#b0bec5', maxWidth: '700px' }}
            >
              Walk-ins welcome, or book online for priority service
            </p>
          </div>
        </Container>
      </section>

      {/* ============ CONTACT CARDS ============ */}
      <section className="py-5" style={{ backgroundColor: 'transparent' }}>
        <Container>
          <Row className="justify-content-center">
            {/* Address */}
            <Col md={4} className="text-center mb-4">
              <Card
                className="h-100 border-0"
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                }}
              >
                <Card.Body className="p-4">
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2c3e50, #00b8d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      fontSize: '36px',
                      boxShadow: '0 8px 24px rgba(0,184,212,0.3)',
                    }}
                  >
                    📍
                  </div>
                  <h5 className="fw-bold" style={{ color: '#2c3e50' }}>
                    Address
                  </h5>
                  <p className="mb-0 text-muted">123 Auto Care Road</p>
                  <p className="text-muted">Your City, 400001</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Call Us */}
            <Col md={4} className="text-center mb-4">
              <Card
                className="h-100 border-0"
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                }}
              >
                <Card.Body className="p-4">
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2c3e50, #00b8d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      fontSize: '36px',
                      boxShadow: '0 8px 24px rgba(0,184,212,0.3)',
                    }}
                  >
                    📞
                  </div>
                  <h5 className="fw-bold" style={{ color: '#2c3e50' }}>
                    Call Us
                  </h5>
                  <p className="mb-0 text-muted">1800-123-4567</p>
                  <p className="text-muted">+91 98765 43210</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Email */}
            <Col md={4} className="text-center mb-4">
              <Card
                className="h-100 border-0"
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                }}
              >
                <Card.Body className="p-4">
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2c3e50, #00b8d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      fontSize: '36px',
                      boxShadow: '0 8px 24px rgba(0,184,212,0.3)',
                    }}
                  >
                    ✉️
                  </div>
                  <h5 className="fw-bold" style={{ color: '#2c3e50' }}>
                    Email
                  </h5>
                  <p className="mb-0 text-muted">service@gearflow.com</p>
                  <p className="text-muted">support@gearflow.com</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ============ MAP / INFO SECTION ============ */}
      <section className="py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4">
              <h6
                className="fw-bold text-uppercase mb-2"
                style={{ color: '#00b8d4', letterSpacing: '2px' }}
              >
                Working Hours
              </h6>
              <h2 className="fw-bold mb-4" style={{ color: '#2c3e50' }}>
                We're Here for You
              </h2>
              <p className="text-muted mb-3">
                Our service center is open six days a week, ready to help with
                everything from routine maintenance to complex repairs.
              </p>

              <Row className="mt-4">
                <Col xs={6}>
                  <div className="fw-bold" style={{ color: '#2c3e50' }}>
                    Monday – Friday
                  </div>
                  <p className="text-muted">9:00 AM – 7:00 PM</p>
                </Col>
                <Col xs={6}>
                  <div className="fw-bold" style={{ color: '#2c3e50' }}>
                    Saturday
                  </div>
                  <p className="text-muted">9:00 AM – 5:00 PM</p>
                </Col>
                <Col xs={6}>
                  <div className="fw-bold" style={{ color: '#2c3e50' }}>
                    Sunday
                  </div>
                  <p className="text-muted">Closed</p>
                </Col>
                <Col xs={6}>
                  <div className="fw-bold" style={{ color: '#2c3e50' }}>
                    Emergency
                  </div>
                  <p className="text-muted">24/7 (Call)</p>
                </Col>
              </Row>
            </Col>

            <Col lg={6} className="mb-4">
              <div
                style={{
                  width: '100%',
                  aspectRatio: '4 / 3',
                  borderRadius: '16px',
                  backgroundImage: `url(${BACKGROUND_IMG})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  backgroundRepeat: 'no-repeat',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                }}
              />
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
    </div>
  );
};

export default Contact;