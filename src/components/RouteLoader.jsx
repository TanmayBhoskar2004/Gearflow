import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const RouteLoader = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show loader on route change
    setLoading(true);

    // Hide after a short delay (simulate page load)
    const timer = setTimeout(() => setLoading(false), 350);

    // Optional: force-hide after 3s max, to prevent infinite spinner
    const maxTimer = setTimeout(() => setLoading(false), 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(maxTimer);
    };
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(26, 37, 47, 0.95)',
        zIndex: 9998,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <img
        src="https://i.imgur.com/YOUR_IMAGE_ID.png"
        alt="Loading"
        style={{
          width: '140px',
          marginBottom: '20px',
          animation: 'pulse 1.4s ease-in-out infinite',
        }}
      />
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '4px solid rgba(255,255,255,0.15)',
          borderTopColor: '#00b8d4',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }}
      />
      <div
        style={{
          marginTop: '14px',
          color: '#90a4ae',
          fontSize: '13px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}
      >
        Loading...
      </div>
    </div>
  );
};

export default RouteLoader;