import React, { useEffect, useState } from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const LOGO_URL =
  'https://res.cloudinary.com/mltjg0qg/image/upload/v1791351602/logo.png.png';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isHome = location.pathname === '/';
  const transparent = isHome && !scrolled;

  return (
    <Navbar
      expand="lg"
      fixed="top"
      style={{
        background: transparent ? 'transparent' : 'rgba(26, 37, 47, 0.95)',
        backdropFilter: transparent ? 'none' : 'blur(10px)',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
        padding: '14px 0',
        zIndex: 1050,
      }}
      variant="dark"
    >
      <Container>
        <Navbar.Brand
          as={Link}
          to="/"
          style={{
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <img
            src={LOGO_URL}
            alt="GearFlow"
            style={{
              height: '36px',
              width: 'auto',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
            }}
          />
          <span style={{ fontSize: '20px' }}>
            <span style={{ color: 'white' }}>Gear</span>
            <span style={{ color: '#00b8d4' }}>Flow</span>
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" />

        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" style={{ color: 'white', fontWeight: 500 }}>
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/about" style={{ color: 'white', fontWeight: 500 }}>
              About
            </Nav.Link>
            <Nav.Link as={Link} to="/services" style={{ color: 'white', fontWeight: 500 }}>
              Services
            </Nav.Link>
            <Nav.Link as={Link} to="/contact" style={{ color: 'white', fontWeight: 500 }}>
              Contact
            </Nav.Link>
            {user && (
              <Nav.Link as={Link} to="/dashboard" style={{ color: 'white', fontWeight: 500 }}>
                Dashboard
              </Nav.Link>
            )}
          </Nav>

          <Nav className="align-items-center">
            {user && (
              <>
                <Navbar.Text className="me-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {user.username}{' '}
                  <span style={{ color: '#00b8d4' }}>
                    ({user.role.replace(/_/g, ' ')})
                  </span>
                </Navbar.Text>
                <Button
                  variant="outline-light"
                  size="sm"
                  className="px-3"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(6px)',
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;