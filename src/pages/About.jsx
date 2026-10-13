import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// 🔗 Background image URL
const BACKGROUND_IMG =
  'https://res.cloudinary.com/mltjg0qg/image/upload/v1791353809/Background_image.png';

// 🔗 Logo URL
const LOGO_URL =
  'https://res.cloudinary.com/mltjg0qg/image/upload/v1791351602/logo.png.png';

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: '🎯',
      title: 'Our Mission',
      desc: 'To provide transparent, reliable, and affordable vehicle service that keeps our customers safely on the road.',
    },
    {
      icon: '👁️',
      title: 'Our Vision',
      desc: 'To become the most trusted name in vehicle care — known for quality, integrity, and innovation.',
    },
    {
      icon: '💎',
      title: 'Our Values',
      desc: 'Honesty, craftsmanship, and customer-first thinking guide every service we perform.',
    },
  ];

  const milestones = [
    { year: '2015', title: 'Founded', desc: 'GearFlow opened its first service center with 5 technicians.' },
    { year: '2018', title: 'Expansion', desc: 'Grew to 15 technicians and added dedicated AC & electrical bays.' },
    { year: '2021', title: '10,000th Vehicle', desc: 'Crossed 10,000 vehicles serviced with a 4.8★ average rating.' },
    { year: '2024', title: 'Digital Transformation', desc: 'Launched our online booking & real-time tracking platform.' },
  ];

  const team = [
    { icon: '👨‍🔧', name: 'Rajesh Kumar', role: 'Head Technician', exp: '15+ years' },
    { icon: '👨‍🔧', name: 'Amit Sharma', role: 'Engine Specialist', exp: '12+ years' },
    { icon: '👩‍🔧', name: 'Priya Nair', role: 'Electrical Expert', exp: '10+ years' },
    { icon: '👨‍🔧', name: 'Vikram Singh', role: 'AC Technician', exp: '8+ years' },
  ];

  return (
    <div style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* ============ HERO ============ */}
      <section
        style={{
          backgroundImage: `linear-gradient(rgba(20, 30, 45, 0.75), rgba(20, 30, 45, 0.9)), url(${BACKGROUND_IMG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          minHeight: '60vh',
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
              About Us
            </h6>
            <h1
              className="fw-bold mb-3"
              style={{ fontSize: '3.5rem', letterSpacing: '-1px' }}
            >
              A Decade of Trusted Vehicle Care
            </h1>
            <p
              className="lead mx-auto"
              style={{ color: '#b0bec5', maxWidth: '700px' }}
            >
              Serving vehicle owners with reliable, honest, and professional
              service — since 2015.
            </p>
          </div>
        </Container>
      </section>

      {/* ============ OUR STORY ============ */}
      <section className="py-5" style={{ backgroundColor: 'transparent' }}>
        <Container>
          <Row className="align-items-center">
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
            <Col lg={6} className="mb-4 ps-lg-5">
              <h6
                className="fw-bold text-uppercase mb-2"
                style={{ color: '#00b8d4', letterSpacing: '2px' }}
              >
                Our Story
              </h6>
              <h2 className="fw-bold mb-4" style={{ color: '#2c3e50' }}>
                Built on Trust. Powered by Expertise.
              </h2>
              <p className="text-muted mb-3">
                At <strong>GearFlow</strong>, we started with a simple idea:
                vehicle service should be transparent, reliable, and accessible
                to everyone. Over the past decade, we've grown from a small
                garage into a full-service center trusted by thousands of
                vehicle owners.
              </p>
              <p className="text-muted mb-3">
                Our state-of-the-art facility is equipped with modern diagnostic
                tools and staffed by experienced technicians who treat every
                vehicle like their own.
              </p>
              <p className="text-muted mb-4">
                Whether it's a routine oil change or a major engine overhaul, we
                deliver the same level of care, precision, and transparency.
              </p>

              <Row className="text-center text-lg-start">
                <Col xs={4}>
                  <div
                    className="fw-bold"
                    style={{ fontSize: '32px', color: '#00b8d4' }}
                  >
                    10K+
                  </div>
                  <div className="text-muted small">Vehicles Serviced</div>
                </Col>
                <Col xs={4}>
                  <div
                    className="fw-bold"
                    style={{ fontSize: '32px', color: '#00b8d4' }}
                  >
                    25+
                  </div>
                  <div className="text-muted small">Technicians</div>
                </Col>
                <Col xs={4}>
                  <div
                    className="fw-bold"
                    style={{ fontSize: '32px', color: '#00b8d4' }}
                  >
                    4.8★
                  </div>
                  <div className="text-muted small">Rating</div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ============ MISSION / VISION / VALUES ============ */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h6
              className="fw-bold text-uppercase mb-2"
              style={{ color: '#00b8d4', letterSpacing: '2px' }}
            >
              What Drives Us
            </h6>
            <h2 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
              Mission, Vision & Values
            </h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              The principles behind every service we deliver
            </p>
          </div>

          <Row>
            {values.map((v, i) => (
              <Col md={4} key={i} className="mb-4">
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
                  <Card.Body className="p-4 text-center">
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background:
                          'linear-gradient(135deg, #2c3e50, #00b8d4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        fontSize: '38px',
                        boxShadow: '0 8px 24px rgba(0,184,212,0.3)',
                      }}
                    >
                      {v.icon}
                    </div>
                    <h5 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
                      {v.title}
                    </h5>
                    <p className="text-muted mb-0">{v.desc}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ============ OUR JOURNEY ============ */}
      <section className="py-5" style={{ backgroundColor: 'transparent' }}>
        <Container>
          <div className="text-center mb-5">
            <h6
              className="fw-bold text-uppercase mb-2"
              style={{ color: '#00b8d4', letterSpacing: '2px' }}
            >
              Our Journey
            </h6>
            <h2 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
              Milestones That Shaped Us
            </h2>
            <p className="text-muted">A decade of steady growth and trust</p>
          </div>

          <Row>
            {milestones.map((m, i) => (
              <Col md={6} lg={3} key={i} className="mb-4">
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
                      className="fw-bold mb-2"
                      style={{ fontSize: '32px', color: '#00b8d4' }}
                    >
                      {m.year}
                    </div>
                    <h5 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                      {m.title}
                    </h5>
                    <p className="text-muted mb-0">{m.desc}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ============ TEAM ============ */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h6
              className="fw-bold text-uppercase mb-2"
              style={{ color: '#00b8d4', letterSpacing: '2px' }}
            >
              Our Team
            </h6>
            <h2 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
              Meet the Experts
            </h2>
            <p className="text-muted">
              Certified professionals with years of experience
            </p>
          </div>

          <Row>
            {team.map((t, i) => (
              <Col md={6} lg={3} key={i} className="text-center mb-4">
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, #2c3e50, #00b8d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: '52px',
                    boxShadow: '0 12px 32px rgba(0,184,212,0.3)',
                  }}
                >
                  {t.icon}
                </div>
                <h5 className="fw-bold mb-1" style={{ color: '#2c3e50' }}>
                  {t.name}
                </h5>
                <p className="text-muted mb-1">{t.role}</p>
                <small style={{ color: '#00b8d4', fontWeight: 600 }}>
                  {t.exp}
                </small>
              </Col>
            ))}
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

export default About;