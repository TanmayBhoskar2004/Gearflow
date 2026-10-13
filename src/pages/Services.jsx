import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';

const BACKGROUND_IMG =
  'https://res.cloudinary.com/mltjg0qg/image/upload/v1791353809/Background_image.png';

const Services = () => {
  const services = [
    {
      icon: '🔧',
      title: 'General Service',
      desc: 'Complete periodic maintenance — engine oil, filters, fluids, and full vehicle checkup.',
      features: ['Oil change', 'Filter replacement', 'Fluid top-up', 'Multi-point inspection'],
      price: 'From ₹1,499',
    },
    {
      icon: '⚙️',
      title: 'Engine Repair',
      desc: 'Diagnostics and repair for engine performance issues, noises, and overheating.',
      features: ['Computer diagnostics', 'Timing belt', 'Overhaul', 'Performance tuning'],
      price: 'From ₹3,999',
    },
    {
      icon: '🛞',
      title: 'Brake & Suspension',
      desc: 'Brake pad replacement, disc servicing, shock absorbers, and wheel alignment.',
      features: ['Brake pads', 'Disc service', 'Shock absorbers', 'Wheel alignment'],
      price: 'From ₹1,999',
    },
    {
      icon: '❄️',
      title: 'AC Service',
      desc: 'AC gas refilling, cooling coil cleaning, compressor checkup, and repairs.',
      features: ['Gas refill', 'Coil cleaning', 'Compressor repair', 'Cabin filter'],
      price: 'From ₹1,299',
    },
    {
      icon: '🔋',
      title: 'Battery & Electrical',
      desc: 'Battery replacement, alternator service, wiring, lights, and electrical fault repair.',
      features: ['Battery check', 'Alternator', 'Wiring repair', 'Light fix'],
      price: 'From ₹899',
    },
    {
      icon: '🎨',
      title: 'Denting & Painting',
      desc: 'Scratch removal, dent repair, and full-body painting with premium finish.',
      features: ['Scratch removal', 'Dent repair', 'Full body paint', 'Ceramic coating'],
      price: 'From ₹2,499',
    },
  ];

  const trustBadges = [
    { icon: '⏱️', title: 'Same-Day Service', desc: 'Most jobs completed within 24 hours' },
    { icon: '🛡️', title: 'Service Warranty', desc: 'All work comes with a written warranty' },
    { icon: '💰', title: 'Transparent Pricing', desc: 'Upfront estimate before we start' },
    { icon: '👨‍🔧', title: 'Expert Technicians', desc: 'Certified professionals with years of experience' },
  ];

  return (
    <div style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* ============ HERO ============ */}
      <section
        style={{
          backgroundImage: `linear-gradient(rgba(20, 30, 45, 0.7), rgba(20, 30, 45, 0.92)), url(${BACKGROUND_IMG})`,
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
              What We Do
            </h6>
            <h1
              className="fw-bold mb-3"
              style={{ fontSize: '3.4rem', letterSpacing: '-1px' }}
            >
              Our Services
            </h1>
            <p
              className="lead mx-auto mb-4"
              style={{ color: '#b0bec5', maxWidth: '700px' }}
            >
              Complete care for your vehicle — from routine maintenance to complex
              repairs. Every service backed by transparent pricing and a written
              warranty.
            </p>
            <div
              className="d-flex justify-content-center gap-4 flex-wrap"
              style={{ color: '#90a4ae', fontSize: '14px' }}
            >
              <div>✓ Certified Technicians</div>
              <div>✓ Genuine Spare Parts</div>
              <div>✓ Service Warranty</div>
            </div>
          </div>
        </Container>
      </section>

      {/* ============ SERVICE CARDS ============ */}
      <section className="py-5" style={{ backgroundColor: 'transparent' }}>
        <Container>
          <div className="text-center mb-5">
            <h6
              className="fw-bold text-uppercase mb-2"
              style={{ color: '#00b8d4', letterSpacing: '2px' }}
            >
              Service Menu
            </h6>
            <h2 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
              Complete Vehicle Care
            </h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              Everything your vehicle needs, under one roof
            </p>
          </div>

          <Row>
            {services.map((s, i) => (
              <Col md={6} lg={4} key={i} className="mb-4">
                <Card
                  className="h-100 border-0"
                  style={{
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow =
                      '0 16px 40px rgba(0,0,0,0.16)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow =
                      '0 8px 32px rgba(0,0,0,0.08)';
                  }}
                >
                  {/* Colored top strip */}
                  <div
                    style={{
                      height: '6px',
                      background:
                        'linear-gradient(90deg, #2c3e50 0%, #00b8d4 100%)',
                    }}
                  />

                  <Card.Body className="p-4">
                    {/* Icon */}
                    <div
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '16px',
                        background:
                          'linear-gradient(135deg, #2c3e50, #00b8d4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '34px',
                        marginBottom: '20px',
                        boxShadow: '0 8px 20px rgba(0, 184, 212, 0.35)',
                      }}
                    >
                      {s.icon}
                    </div>

                    {/* Title */}
                    <h5
                      className="fw-bold mb-2"
                      style={{ color: '#2c3e50', fontSize: '1.25rem' }}
                    >
                      {s.title}
                    </h5>

                    {/* Description */}
                    <p className="text-muted mb-3" style={{ fontSize: '15px' }}>
                      {s.desc}
                    </p>

                    {/* Features */}
                    <ul
                      className="mb-3 ps-3"
                      style={{ color: '#546e7a', fontSize: '14px', lineHeight: 1.8 }}
                    >
                      {s.features.map((f, j) => (
                        <li key={j}>{f}</li>
                      ))}
                    </ul>

                    {/* Price tag */}
                    <div
                      className="d-flex align-items-center justify-content-between pt-3"
                      style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
                    >
                      <Badge
                        style={{
                          background:
                            'linear-gradient(135deg, #2c3e50, #00b8d4)',
                          padding: '8px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        {s.price}
                      </Badge>
                      <span
                        style={{
                          color: '#00b8d4',
                          fontWeight: 600,
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        Book Now →
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ============ WHY CHOOSE OUR SERVICES ============ */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h6
              className="fw-bold text-uppercase mb-2"
              style={{ color: '#00b8d4', letterSpacing: '2px' }}
            >
              Why Choose Us
            </h6>
            <h2 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
              Service You Can Trust
            </h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              Every job we do comes with these guarantees
            </p>
          </div>

          <Row>
            {trustBadges.map((b, i) => (
              <Col md={6} lg={3} key={i} className="text-center mb-4">
                <div
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: '42px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  }}
                >
                  {b.icon}
                </div>
                <h5 className="fw-bold" style={{ color: '#2c3e50' }}>
                  {b.title}
                </h5>
                <p className="text-muted">{b.desc}</p>
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

export default Services;