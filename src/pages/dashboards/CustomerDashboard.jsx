import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Card, Badge, Spinner, Alert,
  Button, Modal, Form, Table, ProgressBar, Dropdown,
} from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const STAGES = [
  { key: 'RECEIVED', label: 'Vehicle Received', icon: '🚗' },
  { key: 'INSPECTION', label: 'Inspection & Diagnostics', icon: '🔍' },
  { key: 'REPAIRING', label: 'Repair Started', icon: '🔧' },
  { key: 'PARTS_REPLACEMENT', label: 'Parts Replacement', icon: '⚙️' },
  { key: 'TESTING', label: 'Quality & Road Testing', icon: '🛣️' },
  { key: 'READY_FOR_DELIVERY', label: 'Ready for Pickup', icon: '✅' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🏁' },
];

const CustomerDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Payment modal state
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState(null);

  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: '', make: '', model: '', year: '', vin: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [approvals, setApprovals] = useState({
    oilChange: true, brakePads: false, acService: false, alignment: false,
  });

  const fetchData = async () => {
    try {
      const [statsRes, vehiclesRes, jobsRes, invoicesRes, notifRes] = await Promise.all([
        api.get('/dashboard/customer').catch(() => ({ data: null })),
        api.get('/vehicles/my').catch(() => ({ data: [] })),
        api.get('/service-requests/my').catch(() => ({ data: [] })),
        api.get('/invoices/my').catch(() => ({ data: [] })),
        api.get('/notifications/my').catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setVehicles(vehiclesRes.data || []);
      setActiveJobs(jobsRes.data || []);
      setInvoices(invoicesRes.data || []);
      setNotifications(notifRes.data || []);

      const history = (jobsRes.data || []).filter((j) => j.status === 'DELIVERED');
      setServiceHistory(history);

      setProfile({
        username: user.username,
        role: user.role,
        email: `${user.username}@gearflow.com`,
        phone: '+91 98765 43210',
        address: '123 Main Street, Your City, 400001',
        joinedDate: '2024-01-15',
      });

      // Load receipts from localStorage (per user)
      const savedReceipts = JSON.parse(
        localStorage.getItem(`receipts_${user.username}`) || '[]'
      );
      setReceipts(savedReceipts);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/vehicles', {
        ...vehicleForm,
        year: parseInt(vehicleForm.year, 10),
      });
      setShowAddVehicle(false);
      setVehicleForm({ registrationNumber: '', make: '', model: '', year: '', vin: '' });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setFormLoading(false);
    }
  };

  // ============================================================
  // PAYMENT HANDLER — supports UPI / Net Banking / Cash
  // ============================================================
  const handlePayment = async (e) => {
    e.preventDefault();
    setPaymentProcessing(true);
    setPaymentMessage(null);

    try {
      if (paymentMethod === 'CASH') {
        // Cash payment — record and show message
        const receipt = {
          id: 'RCPT-' + Date.now(),
          invoiceId: selectedInvoice.invoiceId,
          amount: selectedInvoice.total,
          method: 'CASH',
          reference: 'PENDING-COUNTER',
          date: new Date().toISOString(),
          status: 'PENDING',
          message: 'Please pay and collect receipt from cash counter',
        };

        // Try to record the payment on the backend (may succeed or fail)
        try {
          await api.post('/payments', {
            invoiceId: selectedInvoice.invoiceId,
            amount: selectedInvoice.total,
            method: 'CASH',
            reference: 'CASH-PENDING',
          });
        } catch {
          /* ignore backend error — receipt is still shown */
        }

        // Save receipt
        const newReceipts = [receipt, ...receipts];
        setReceipts(newReceipts);
        localStorage.setItem(
          `receipts_${user.username}`,
          JSON.stringify(newReceipts)
        );

        setLastReceipt(receipt);
        setPaymentMessage({
          type: 'warning',
          text: 'Please pay and collect receipt from cash counter',
        });
        setPaymentProcessing(false);

        // Show the receipt modal after 1.5s
        setTimeout(() => {
          setShowReceiptModal(true);
        }, 1500);
        return;
      }

      // UPI / CARD / NET BANKING — simulate instant payment
      const reference =
        paymentReference.trim() || 'TXN' + Math.floor(Math.random() * 100000000);

      await api.post('/payments', {
        invoiceId: selectedInvoice.invoiceId,
        amount: selectedInvoice.total,
        method: paymentMethod,
        reference,
      });

      const receipt = {
        id: 'RCPT-' + Date.now(),
        invoiceId: selectedInvoice.invoiceId,
        amount: selectedInvoice.total,
        method: paymentMethod,
        reference,
        date: new Date().toISOString(),
        status: 'PAID',
        message: 'Payment successful',
      };

      const newReceipts = [receipt, ...receipts];
      setReceipts(newReceipts);
      localStorage.setItem(
        `receipts_${user.username}`,
        JSON.stringify(newReceipts)
      );

      setLastReceipt(receipt);
      setPaymentMessage({
        type: 'success',
        text: `Payment successful! Reference: ${reference}`,
      });
      setPaymentProcessing(false);

      // Refresh invoices so the paid one updates
      fetchData();

      setTimeout(() => {
        setShowPayment(false);
        setShowReceiptModal(true);
      }, 1500);
    } catch (err) {
      setPaymentMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Payment failed. Please try again.',
      });
      setPaymentProcessing(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const downloadReceipt = (receipt) => {
    const text = `
============================================
         GEARFLOW SERVICE CENTER
           PAYMENT RECEIPT
============================================

Receipt ID:      ${receipt.id}
Invoice ID:      INV-${receipt.invoiceId}
Date:            ${new Date(receipt.date).toLocaleString()}

CUSTOMER:        ${user.username}
Email:           ${user.username}@gearflow.com

--------------------------------------------
Amount Paid:     ₹${receipt.amount}
Payment Method:  ${receipt.method}
Reference:       ${receipt.reference}
Status:          ${receipt.status}
--------------------------------------------

${receipt.status === 'PAID'
  ? 'Thank you for your payment!'
  : 'Please collect receipt from cash counter.'}

============================================
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receipt.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStageIndex = (status) => STAGES.findIndex((s) => s.key === status);
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div style={pageStyle}>
        <Container className="text-center" style={{ paddingTop: '200px' }}>
          <Spinner animation="border" variant="info" />
          <p className="mt-3 text-white">Loading your dashboard...</p>
        </Container>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.45; }
          50% { transform: translate(-40px, 40px) scale(1.15); opacity: 0.65; }
        }
        @keyframes particleDrift {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.6; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
        @keyframes gridShift {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        @keyframes meshMove {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(30px, -30px) rotate(3deg); }
        }
        .bg-3d {
          position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none;
          background: linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 40%, #0d3b4a 100%);
        }
        .bg-grid {
          position: absolute; inset: -100px;
          background-image:
            linear-gradient(rgba(0,184,212,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,184,212,0.08) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridShift 20s linear infinite;
        }
        .bg-orb { position: absolute; border-radius: 50%; filter: blur(100px); animation: orbFloat 14s ease-in-out infinite; }
        .orb-1 { width: 600px; height: 600px; top: -200px; right: -200px;
          background: radial-gradient(circle, rgba(0,184,212,0.5) 0%, transparent 70%); }
        .orb-2 { width: 500px; height: 500px; bottom: -150px; left: -150px;
          background: radial-gradient(circle, rgba(102,126,234,0.4) 0%, transparent 70%); animation-delay: 4s; }
        .orb-3 { width: 400px; height: 400px; top: 40%; left: 50%;
          background: radial-gradient(circle, rgba(0,151,167,0.3) 0%, transparent 70%); animation-delay: 8s; }
        .bg-polygon { position: absolute; border: 1.5px solid rgba(0,184,212,0.25); animation: meshMove 16s ease-in-out infinite; }
        .poly-1 { width: 200px; height: 200px; top: 15%; left: 8%; transform: rotate(45deg);
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          background: linear-gradient(135deg, rgba(0,184,212,0.1), transparent); }
        .poly-2 { width: 150px; height: 150px; bottom: 20%; right: 10%; transform: rotate(-30deg);
          clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
          background: linear-gradient(135deg, rgba(102,126,234,0.1), transparent); animation-delay: 3s; }
        .poly-3 { width: 250px; height: 250px; top: 50%; right: 20%; transform: rotate(20deg);
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          background: linear-gradient(135deg, rgba(0,151,167,0.08), transparent); animation-delay: 6s; }
        .particle { position: absolute; width: 4px; height: 4px; border-radius: 50%;
          background: rgba(0,184,212,0.8); box-shadow: 0 0 12px rgba(0,184,212,0.9);
          animation: particleDrift 18s linear infinite; }
        .p-1 { left: 10%; bottom: 0; animation-delay: 0s; }
        .p-2 { left: 25%; bottom: 0; animation-delay: 2s; }
        .p-3 { left: 40%; bottom: 0; animation-delay: 4s; }
        .p-4 { left: 55%; bottom: 0; animation-delay: 6s; }
        .p-5 { left: 70%; bottom: 0; animation-delay: 8s; }
        .p-6 { left: 85%; bottom: 0; animation-delay: 10s; }
        .p-7 { left: 15%; bottom: 0; animation-delay: 12s; }
        .p-8 { left: 60%; bottom: 0; animation-delay: 14s; }
        .dashboard-content { position: relative; z-index: 1; }

        .vehicle-card { height: 100%; display: flex; flex-direction: column;
          transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .vehicle-card:hover { transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25) !important; }
        .vehicle-card .card-body { display: flex; flex-direction: column; justify-content: space-between; }

        .stage-col { flex: 1; min-width: 0; }
        .stage-box { height: 100%; min-height: 100px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; padding: 10px 6px;
          border-radius: 12px; text-align: center; }
        .stage-row { display: flex; gap: 8px; flex-wrap: nowrap; }
        @media (max-width: 991px) {
          .stage-row { flex-wrap: wrap; }
          .stage-col { flex: 0 0 calc(25% - 8px); }
        }
        @media (max-width: 576px) {
          .stage-col { flex: 0 0 calc(50% - 8px); }
        }

        /* Payment Method selector */
        .pay-method {
          border: 2px solid #dee2e6;
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          background: white;
        }
        .pay-method:hover { border-color: #00b8d4; }
        .pay-method.active {
          border-color: #00b8d4;
          background: #e3f7fb;
          box-shadow: 0 4px 16px rgba(0,184,212,0.3);
        }

        /* Receipt styling */
        .receipt-paper {
          background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
          border-radius: 12px;
          padding: 24px;
          font-family: 'Courier New', monospace;
          border-top: 6px dashed #00b8d4;
          border-bottom: 6px dashed #00b8d4;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
      `}</style>

      <div className="bg-3d">
        <div className="bg-grid" />
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
        <div className="bg-polygon poly-1" />
        <div className="bg-polygon poly-2" />
        <div className="bg-polygon poly-3" />
        <div className="particle p-1" />
        <div className="particle p-2" />
        <div className="particle p-3" />
        <div className="particle p-4" />
        <div className="particle p-5" />
        <div className="particle p-6" />
        <div className="particle p-7" />
        <div className="particle p-8" />
      </div>

      <div className="dashboard-content">
        <Container style={{ paddingTop: '100px', paddingBottom: '60px' }}>
          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div>
              <h2 className="fw-bold text-white mb-1">Welcome back, {user.username}! 👋</h2>
              <Badge
                style={{
                  background: 'linear-gradient(135deg, #00b8d4, #0097a7)',
                  padding: '8px 16px',
                  fontSize: '13px',
                }}
              >
                CUSTOMER PORTAL
              </Badge>
            </div>
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <Button variant="outline-light" onClick={() => setShowProfile(true)} style={glassBtn}>
                👤 Profile
              </Button>
              <Dropdown align="end">
                <Dropdown.Toggle
                  as={Button}
                  variant="outline-light"
                  style={{ ...glassBtn, position: 'relative' }}
                >
                  🔔 Notifications
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        background: '#e74c3c', color: 'white', borderRadius: '50%',
                        padding: '2px 7px', fontSize: '11px', fontWeight: 700,
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Dropdown.Toggle>
                <Dropdown.Menu
                  style={{
                    minWidth: '360px', maxHeight: '420px', overflowY: 'auto',
                    padding: 0, border: 'none',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.35)', borderRadius: '12px',
                  }}
                >
                  <div
                    className="d-flex justify-content-between align-items-center p-3"
                    style={{ borderBottom: '1px solid #eee', background: '#f8f9fa' }}
                  >
                    <strong>Notifications</strong>
                    {unreadCount > 0 && (
                      <Button size="sm" variant="link" onClick={markAllRead}
                        style={{ fontSize: '12px', padding: 0 }}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className="p-3"
                        style={{
                          borderBottom: '1px solid #f0f0f0',
                          background: n.read ? 'white' : '#e3f7fb',
                          cursor: 'pointer',
                        }}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div style={{ fontSize: '14px', color: '#2c3e50' }}>{n.message}</div>
                        <small className="text-muted">
                          {new Date(n.createdAt).toLocaleString()}
                        </small>
                      </div>
                    ))
                  )}
                </Dropdown.Menu>
              </Dropdown>
              <Button variant="outline-light" onClick={() => setShowBooking(true)} style={glassBtn}>
                📅 Book Service
              </Button>
              <Button
                variant="info"
                className="fw-bold"
                onClick={() => setShowAddVehicle(true)}
                style={{ boxShadow: '0 8px 24px rgba(0,184,212,0.4)' }}
              >
                + Add Vehicle
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* STATS */}
          <Row className="mb-4 g-3">
            {[
              { icon: '🚗', label: 'My Vehicles', value: stats?.vehicleCount ?? vehicles.length, color: '#00b8d4' },
              { icon: '🔧', label: 'Active Services', value: stats?.activeServiceCount ?? 0, color: '#00b8d4' },
              { icon: '✅', label: 'Completed', value: stats?.completedServiceCount ?? 0, color: '#00b8d4' },
              { icon: '💳', label: 'Unpaid Invoices', value: stats?.unpaidInvoiceCount ?? 0, color: '#e74c3c' },
            ].map((s, i) => (
              <Col md={6} lg={3} key={i}>
                <Card className="border-0 h-100" style={glassCard}>
                  <Card.Body>
                    <div style={{ fontSize: '32px' }}>{s.icon}</div>
                    <div className="fw-bold mt-2" style={{ fontSize: '28px', color: s.color }}>
                      {s.value}
                    </div>
                    <div className="text-muted small">{s.label}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* PROFILE */}
          <h4 className="fw-bold text-white mb-3 mt-5">👤 Your Profile</h4>
          <Card className="border-0 mb-4" style={glassCard}>
            <Card.Body>
              <Row className="align-items-center">
                <Col md={2} className="text-center mb-3 mb-md-0">
                  <div
                    style={{
                      width: '90px', height: '90px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00b8d4, #0097a7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto', fontSize: '40px', color: 'white', fontWeight: 700,
                      boxShadow: '0 8px 24px rgba(0,184,212,0.4)',
                    }}
                  >
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                </Col>
                <Col md={10}>
                  <Row>
                    <Col md={6}>
                      <div className="text-muted small">Username</div>
                      <div className="fw-bold" style={{ color: '#2c3e50' }}>{profile?.username}</div>
                    </Col>
                    <Col md={6}>
                      <div className="text-muted small">Email</div>
                      <div className="fw-bold" style={{ color: '#2c3e50' }}>{profile?.email}</div>
                    </Col>
                    <Col md={6} className="mt-2">
                      <div className="text-muted small">Phone</div>
                      <div className="fw-bold" style={{ color: '#2c3e50' }}>{profile?.phone}</div>
                    </Col>
                    <Col md={6} className="mt-2">
                      <div className="text-muted small">Member Since</div>
                      <div className="fw-bold" style={{ color: '#2c3e50' }}>{profile?.joinedDate}</div>
                    </Col>
                    <Col md={12} className="mt-2">
                      <div className="text-muted small">Address</div>
                      <div className="fw-bold" style={{ color: '#2c3e50' }}>{profile?.address}</div>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <div className="text-end mt-3">
                <Button variant="info" size="sm" onClick={() => setShowProfile(true)}>
                  Edit Profile
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* MY VEHICLES */}
          <h4 className="fw-bold text-white mb-3 mt-5">🚗 My Vehicles</h4>
          {vehicles.length === 0 ? (
            <Card className="border-0 text-center p-5 mb-4" style={glassCard}>
              <p className="text-muted mb-0">
                No vehicles yet. Click <strong>+ Add Vehicle</strong> to register one.
              </p>
            </Card>
          ) : (
            <Row className="g-3 mb-4">
              {vehicles.map((v) => (
                <Col md={6} lg={4} key={v.id} className="d-flex">
                  <Card className="border-0 vehicle-card w-100" style={glassCard}>
                    <Card.Body>
                      <div>
                        <div className="d-flex justify-content-between mb-3">
                          <Badge bg="info" style={{ fontSize: '13px', padding: '6px 12px' }}>
                            {v.registrationNumber}
                          </Badge>
                          <Badge bg="success" style={{ fontSize: '12px' }}>Active</Badge>
                        </div>
                        <h5 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
                          {v.make} {v.model}
                        </h5>
                      </div>
                      <div>
                        <div className="d-flex justify-content-between border-top pt-2">
                          <span className="text-muted small">Year</span>
                          <span className="fw-semibold" style={{ color: '#2c3e50' }}>
                            {v.year || '—'}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                          <span className="text-muted small">VIN</span>
                          <span className="fw-semibold" style={{ color: '#2c3e50', fontSize: '13px' }}>
                            {v.vin || '—'}
                          </span>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* LIVE SERVICE TRACKING */}
          <h4 className="fw-bold text-white mb-3 mt-5">📡 Live Service Tracking</h4>
          {activeJobs.length === 0 ? (
            <Card className="border-0 text-center p-5 mb-4" style={glassCard}>
              <p className="text-muted mb-0">
                No active services. Book a service to see live tracking.
              </p>
            </Card>
          ) : (
            activeJobs.slice(0, 2).map((job) => {
              const currentIdx = getStageIndex(job.status);
              return (
                <Card key={job.id} className="border-0 mb-4" style={glassCard}>
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-3 flex-wrap gap-2">
                      <div>
                        <h5 className="fw-bold mb-1" style={{ color: '#2c3e50' }}>
                          {job.registrationNumber || 'Vehicle'}
                        </h5>
                        <div className="text-muted small">
                          Job #{job.id} · {job.description || 'Service'}
                        </div>
                      </div>
                      <Badge bg={currentIdx >= 0 ? 'success' : 'secondary'}>
                        {job.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <ProgressBar
                      now={((currentIdx + 1) / STAGES.length) * 100}
                      style={{ height: '8px', marginBottom: '24px' }}
                      variant="info"
                    />
                    <div className="stage-row">
                      {STAGES.map((stage, idx) => {
                        const done = idx <= currentIdx;
                        const current = idx === currentIdx;
                        return (
                          <div className="stage-col" key={stage.key}>
                            <div
                              className="stage-box"
                              style={{
                                background: done
                                  ? 'linear-gradient(135deg, #00b8d4 0%, #0097a7 100%)'
                                  : 'rgba(0,0,0,0.04)',
                                color: done ? 'white' : '#546e7a',
                                border: current ? '3px solid #00b8d4' : '3px solid transparent',
                                boxShadow: current ? '0 8px 24px rgba(0,184,212,0.45)' : 'none',
                                transform: current ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.3s ease',
                              }}
                            >
                              <div style={{ fontSize: '22px' }}>{stage.icon}</div>
                              <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '6px', lineHeight: 1.2 }}>
                                {stage.label}
                              </div>
                              <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Step {idx + 1}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card.Body>
                </Card>
              );
            })
          )}

          {/* COST ESTIMATOR */}
          <h4 className="fw-bold text-white mb-3 mt-5">💰 Cost Estimator & Approvals</h4>
          <Card className="border-0 mb-4" style={glassCard}>
            <Card.Body>
              <p className="text-muted small">Approve or decline optional repairs before work begins.</p>
              <Table borderless responsive>
                <thead>
                  <tr style={{ color: '#546e7a' }}>
                    <th>Item</th><th>Type</th><th className="text-end">Amount</th><th className="text-center">Approve</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'oilChange', label: 'Engine Oil Change', type: 'Baseline', amount: 1500 },
                    { key: 'brakePads', label: 'Brake Pad Replacement', type: 'Recommended', amount: 2500 },
                    { key: 'acService', label: 'AC Gas Refill & Service', type: 'Optional', amount: 1200 },
                    { key: 'alignment', label: 'Wheel Alignment', type: 'Recommended', amount: 800 },
                  ].map((item) => (
                    <tr key={item.key}>
                      <td style={{ color: '#2c3e50', fontWeight: 500 }}>{item.label}</td>
                      <td>
                        <Badge bg={item.type === 'Baseline' ? 'secondary' : item.type === 'Recommended' ? 'warning' : 'info'}>
                          {item.type}
                        </Badge>
                      </td>
                      <td className="text-end fw-bold">₹{item.amount}</td>
                      <td className="text-center">
                        <Form.Check
                          type="switch"
                          checked={approvals[item.key]}
                          onChange={(e) => setApprovals({ ...approvals, [item.key]: e.target.checked })}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid rgba(0,184,212,0.3)' }}>
                    <td colSpan={2} className="fw-bold" style={{ color: '#2c3e50' }}>Total Approved</td>
                    <td className="text-end fw-bold" style={{ color: '#00b8d4', fontSize: '18px' }}>
                      ₹{Object.entries(approvals).filter(([, v]) => v).reduce((sum, [k]) => {
                        const item = { oilChange: 1500, brakePads: 2500, acService: 1200, alignment: 800 }[k];
                        return sum + item;
                      }, 0)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </Table>
              <div className="text-end">
                <Button variant="info" className="fw-bold">Send Approvals →</Button>
              </div>
            </Card.Body>
          </Card>

          {/* INVOICES */}
          <h4 className="fw-bold text-white mb-3 mt-5">🧾 Invoices & Payments</h4>
          <Card className="border-0 mb-4" style={glassCard}>
            <Card.Body>
              {invoices.length === 0 ? (
                <p className="text-muted mb-0 text-center">No invoices yet.</p>
              ) : (
                <Table borderless responsive>
                  <thead>
                    <tr style={{ color: '#546e7a' }}>
                      <th>Invoice #</th><th>Vehicle</th><th>Amount</th><th>Status</th><th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.invoiceId}>
                        <td>INV-{inv.invoiceId}</td>
                        <td>{inv.registrationNumber}</td>
                        <td className="fw-bold">₹{inv.total}</td>
                        <td>
                          <Badge bg={inv.paymentStatus === 'PAID' ? 'success' : 'danger'}>
                            {inv.paymentStatus}
                          </Badge>
                        </td>
                        <td className="text-end">
                          {inv.paymentStatus !== 'PAID' ? (
                            <Button
                              size="sm"
                              variant="info"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentMethod('UPI');
                                setPaymentReference('');
                                setPaymentMessage(null);
                                setShowPayment(true);
                              }}
                            >
                              Pay Now
                            </Button>
                          ) : (
                            <Badge bg="success">Paid</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          {/* ============ PAYMENT RECEIPTS ============ */}
          <h4 className="fw-bold text-white mb-3 mt-5">🎫 Payment Receipts</h4>
          {receipts.length === 0 ? (
            <Card className="border-0 text-center p-5 mb-4" style={glassCard}>
              <p className="text-muted mb-0">No receipts yet. Make a payment to see receipts here.</p>
            </Card>
          ) : (
            <Row className="g-3 mb-4">
              {receipts.map((r) => (
                <Col md={6} lg={4} key={r.id}>
                  <Card className="border-0 h-100" style={glassCard}>
                    <Card.Body>
                      <div className="d-flex justify-content-between mb-2">
                        <Badge bg={r.status === 'PAID' ? 'success' : 'warning'}>
                          {r.status}
                        </Badge>
                        <small className="text-muted">{r.id}</small>
                      </div>
                      <h5 className="fw-bold mb-1" style={{ color: '#2c3e50' }}>
                        ₹{r.amount}
                      </h5>
                      <div className="text-muted small mb-1">Invoice: INV-{r.invoiceId}</div>
                      <div className="text-muted small mb-1">Method: {r.method}</div>
                      <div className="text-muted small mb-1">Ref: {r.reference}</div>
                      <div className="text-muted small mb-3">
                        {new Date(r.date).toLocaleString()}
                      </div>
                      <Button size="sm" variant="outline-info" onClick={() => downloadReceipt(r)}>
                        Download Receipt
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </div>

      {/* ADD VEHICLE MODAL */}
      <Modal show={showAddVehicle} onHide={() => setShowAddVehicle(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add New Vehicle</Modal.Title></Modal.Header>
        <Form onSubmit={handleAddVehicle}>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Registration Number *</Form.Label>
              <Form.Control required value={vehicleForm.registrationNumber}
                onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                placeholder="MH12AB1234" />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Make *</Form.Label>
                  <Form.Control required value={vehicleForm.make}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                    placeholder="Honda" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Model *</Form.Label>
                  <Form.Control required value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    placeholder="City" />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Year *</Form.Label>
                  <Form.Control required type="number" value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                    placeholder="2020" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>VIN</Form.Label>
                  <Form.Control value={vehicleForm.vin}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })}
                    placeholder="VIN123456789" />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddVehicle(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={formLoading}>
              {formLoading ? 'Adding...' : 'Add Vehicle'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* PROFILE MODAL */}
      <Modal show={showProfile} onHide={() => setShowProfile(false)} centered>
        <Modal.Header closeButton><Modal.Title>👤 My Profile</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <div
              style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #00b8d4, #0097a7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto', fontSize: '44px', color: 'white', fontWeight: 700,
                boxShadow: '0 8px 24px rgba(0,184,212,0.4)',
              }}
            >
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <h5 className="mt-3 fw-bold">{user.username}</h5>
            <Badge bg="info">CUSTOMER</Badge>
          </div>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control defaultValue={profile?.email} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control defaultValue={profile?.phone} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control as="textarea" rows={2} defaultValue={profile?.address} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfile(false)}>Close</Button>
          <Button variant="info" onClick={() => setShowProfile(false)}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* BOOKING MODAL */}
      <Modal show={showBooking} onHide={() => setShowBooking(false)} centered>
        <Modal.Header closeButton><Modal.Title>📅 Book a Service Appointment</Modal.Title></Modal.Header>
        <Modal.Body>
          <Alert variant="info">Select a date and time. We'll confirm your appointment via notification.</Alert>
          <Form.Group className="mb-3">
            <Form.Label>Select Vehicle</Form.Label>
            <Form.Select>
              {vehicles.map((v) => (
                <option key={v.id}>{v.registrationNumber} — {v.make} {v.model}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Preferred Date</Form.Label>
            <Form.Control type="date" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Preferred Time</Form.Label>
            <Form.Control type="time" />
          </Form.Group>
          <Form.Group>
            <Form.Label>Service Type</Form.Label>
            <Form.Select>
              <option>General Service</option>
              <option>Oil Change</option>
              <option>Brake Check</option>
              <option>AC Service</option>
              <option>Full Inspection</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBooking(false)}>Cancel</Button>
          <Button variant="info" onClick={() => setShowBooking(false)}>Confirm Booking</Button>
        </Modal.Footer>
      </Modal>

      {/* ============ PAYMENT MODAL WITH METHOD SELECTION ============ */}
      <Modal show={showPayment} onHide={() => setShowPayment(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>💳 Pay Invoice</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePayment}>
          <Modal.Body>
            {selectedInvoice && (
              <>
                <Alert variant="info">
                  Invoice <strong>INV-{selectedInvoice.invoiceId}</strong>
                  &nbsp;·&nbsp; Amount: <strong>₹{selectedInvoice.total}</strong>
                </Alert>

                {paymentMessage && (
                  <Alert variant={paymentMessage.type}>
                    {paymentMessage.text}
                  </Alert>
                )}

                <h6 className="fw-bold mb-3">Select Payment Method</h6>
                <Row className="g-3 mb-4">
                  {[
                    { key: 'UPI', icon: '📱', label: 'UPI' },
                    { key: 'NET_BANKING', icon: '🏦', label: 'Net Banking' },
                    { key: 'CASH', icon: '💵', label: 'Cash' },
                  ].map((m) => (
                    <Col md={4} key={m.key}>
                      <div
                        className={`pay-method ${paymentMethod === m.key ? 'active' : ''}`}
                        onClick={() => setPaymentMethod(m.key)}
                      >
                        <div style={{ fontSize: '36px' }}>{m.icon}</div>
                        <div className="fw-bold mt-2">{m.label}</div>
                      </div>
                    </Col>
                  ))}
                </Row>

                {paymentMethod === 'UPI' && (
                  <Form.Group className="mb-3">
                    <Form.Label>UPI ID / Transaction Reference (Optional)</Form.Label>
                    <Form.Control
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="yourname@upi or TXN123456"
                    />
                  </Form.Group>
                )}

                {paymentMethod === 'NET_BANKING' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Transaction Reference (Optional)</Form.Label>
                    <Form.Control
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="NEFT/IMPS reference"
                    />
                  </Form.Group>
                )}

                {paymentMethod === 'CASH' && (
                  <Alert variant="warning" className="mb-0">
                    <strong>ⓘ Cash Payment:</strong> Please pay the amount at the
                    cash counter. Collect your receipt after payment.
                  </Alert>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPayment(false)} disabled={paymentProcessing}>
              Cancel
            </Button>
            <Button variant="info" type="submit" className="fw-bold" disabled={paymentProcessing}>
              {paymentProcessing
                ? 'Processing...'
                : paymentMethod === 'CASH'
                ? 'Confirm Cash Payment'
                : `Pay ₹${selectedInvoice?.total}`}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ============ RECEIPT MODAL (AUTO-SHOWN AFTER PAYMENT) ============ */}
      <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {lastReceipt?.status === 'PAID' ? '✅ Payment Successful' : '🧾 Payment Receipt'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {lastReceipt && (
            <>
              {lastReceipt.status === 'PAID' ? (
                <Alert variant="success" className="text-center">
                  <div style={{ fontSize: '48px' }}>✅</div>
                  <h5 className="mt-2 mb-1 fw-bold">Payment Successful!</h5>
                  <p className="mb-0">Your payment has been processed.</p>
                </Alert>
              ) : (
                <Alert variant="warning" className="text-center">
                  <div style={{ fontSize: '48px' }}>💵</div>
                  <h5 className="mt-2 mb-1 fw-bold">Cash Payment Selected</h5>
                  <p className="mb-0">
                    Please pay and collect receipt from cash counter.
                  </p>
                </Alert>
              )}

              <div className="receipt-paper mt-3">
                <div className="text-center mb-3">
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
                    GEARFLOW SERVICE CENTER
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    PAYMENT RECEIPT
                  </div>
                </div>

                <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                  <span>Receipt ID</span>
                  <strong>{lastReceipt.id}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                  <span>Invoice</span>
                  <strong>INV-{lastReceipt.invoiceId}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                  <span>Date</span>
                  <strong>{new Date(lastReceipt.date).toLocaleString()}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                  <span>Customer</span>
                  <strong>{user.username}</strong>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                  <span>Method</span>
                  <strong>{lastReceipt.method}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                  <span>Reference</span>
                  <strong>{lastReceipt.reference}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                  <span>Status</span>
                  <Badge bg={lastReceipt.status === 'PAID' ? 'success' : 'warning'}>
                    {lastReceipt.status}
                  </Badge>
                </div>
                <hr />
                <div className="d-flex justify-content-between" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  <span>TOTAL</span>
                  <span style={{ color: '#00b8d4' }}>₹{lastReceipt.amount}</span>
                </div>
                <div className="text-center mt-3" style={{ fontSize: '11px', color: '#999' }}>
                  {lastReceipt.status === 'PAID'
                    ? 'Thank you for your payment!'
                    : 'Please collect from cash counter.'}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReceiptModal(false)}>
            Close
          </Button>
          <Button
            variant="info"
            className="fw-bold"
            onClick={() => lastReceipt && downloadReceipt(lastReceipt)}
          >
            Download Receipt
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

const pageStyle = {
  minHeight: '100vh',
  position: 'relative',
  background: '#0a0e1a',
};

const glassCard = {
  background: 'rgba(255, 255, 255, 0.94)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  borderRadius: '16px',
};

const glassBtn = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderColor: 'rgba(255, 255, 255, 0.4)',
  color: 'white',
};

export default CustomerDashboard;