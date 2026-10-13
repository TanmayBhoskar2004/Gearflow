import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Card, Badge, Spinner, Alert,
  Button, Modal, Form, Table, ProgressBar, Dropdown, Tabs, Tab,
} from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

// 7-Stage pipeline
const STAGES = [
  { key: 'RECEIVED', label: 'Vehicle Received', icon: '🚗' },
  { key: 'INSPECTION', label: 'Inspection & Diagnostics', icon: '🔍' },
  { key: 'REPAIRING', label: 'Repair Started', icon: '🔧' },
  { key: 'PARTS_REPLACEMENT', label: 'Parts Replacement', icon: '⚙️' },
  { key: 'TESTING', label: 'Quality & Road Testing', icon: '🛣️' },
  { key: 'READY_FOR_DELIVERY', label: 'Ready for Pickup', icon: '✅' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🏁' },
];

const AdvisorDashboard = () => {
  const { user } = useAuth();

  // -------- State --------
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [parts, setParts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('jobs');

  // Modals
  const [showJobWizard, setShowJobWizard] = useState(false);
  const [showAssignTech, setShowAssignTech] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [showCommunication, setShowCommunication] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Job card wizard
  const [wizardStep, setWizardStep] = useState(1);
  const [jobForm, setJobForm] = useState({
    serviceRequestId: '',
    customerId: '',
    vehicleId: '',
    description: '',
    estimatedCompletion: '',
    laborCharge: 1500,
    otherCharges: 0,
    tax: 300,
    discount: 0,
    damagePhotos: [],
  });
  const [wizardError, setWizardError] = useState('');
  const [wizardLoading, setWizardLoading] = useState(false);

  // Technician selection
  const [selectedTechnician, setSelectedTechnician] = useState('');

  // Quotation builder
  const [quotationItems, setQuotationItems] = useState([
    { id: 1, label: 'Base Labor Charge', amount: 1500, type: 'Baseline' },
    { id: 2, label: 'Diagnostic Fee', amount: 500, type: 'Baseline' },
    { id: 3, label: 'Brake Pad Replacement', amount: 2500, type: 'Recommended' },
    { id: 4, label: 'AC Gas Refill', amount: 1200, type: 'Optional' },
  ]);

  // Communication message
  const [commMessage, setCommMessage] = useState(
    'We found additional issues during inspection. Please review and approve the following repairs:'
  );
  const [commChannel, setCommChannel] = useState('PORTAL');

  // -------- Fetch Data --------
  const fetchData = async () => {
    try {
      const [
        statsRes, jobsRes, requestsRes, techRes, custRes, vehRes, partsRes, notifRes,
      ] = await Promise.all([
        api.get('/dashboard/advisor').catch(() => ({ data: null })),
        api.get('/job-cards/all').catch(() => ({ data: [] })),
        api.get('/service-requests/pending').catch(() => ({ data: [] })),
        api.get('/technicians/all').catch(() => ({ data: [] })),
        api.get('/dashboard/advisor').catch(() => ({ data: null })),
        api.get('/vehicles/all').catch(() => ({ data: [] })),
        api.get('/parts/all').catch(() => ({ data: [] })),
        api.get('/notifications/my').catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setJobs(jobsRes.data || []);
      setRequests(requestsRes.data || []);
      setTechnicians(techRes.data || []);
      setVehicles(vehRes.data || []);
      setParts(partsRes.data || []);
      setNotifications(notifRes.data || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // -------- Handlers --------
  const handleCreateJobCard = async () => {
    setWizardError('');
    setWizardLoading(true);
    try {
      await api.post('/job-cards', {
        serviceRequestId: parseInt(jobForm.serviceRequestId, 10),
        estimatedCompletion: jobForm.estimatedCompletion,
        laborCharge: parseFloat(jobForm.laborCharge),
        otherCharges: parseFloat(jobForm.otherCharges),
        tax: parseFloat(jobForm.tax),
        discount: parseFloat(jobForm.discount),
      });
      setShowJobWizard(false);
      setWizardStep(1);
      setJobForm({
        serviceRequestId: '', customerId: '', vehicleId: '', description: '',
        estimatedCompletion: '', laborCharge: 1500, otherCharges: 0, tax: 300, discount: 0,
        damagePhotos: [],
      });
      fetchData();
    } catch (err) {
      setWizardError(err.response?.data?.message || 'Failed to create job card');
    } finally {
      setWizardLoading(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) return;
    try {
      await api.put(`/job-cards/${selectedJob.id}/assign-technician`, {
        technicianId: parseInt(selectedTechnician, 10),
      });
      setShowAssignTech(false);
      setSelectedJob(null);
      setSelectedTechnician('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign technician');
    }
  };

  const handleGenerateInvoice = async (job) => {
    try {
      await api.post(`/invoices/generate/${job.id}`);
      alert('Invoice generated successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const handleSendApproval = async () => {
    try {
      alert(`Approval request sent via ${commChannel}`);
      setShowCommunication(false);
    } catch (err) {
      alert('Failed to send approval request');
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

  const getStageIndex = (status) => STAGES.findIndex((s) => s.key === status);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const quotationTotal = quotationItems.reduce((s, i) => s + i.amount, 0);

  // -------- Loading --------
  if (loading) {
    return (
      <div style={pageStyle}>
        <Container className="text-center" style={{ paddingTop: '200px' }}>
          <Spinner animation="border" variant="info" />
          <p className="mt-3 text-white">Loading advisor dashboard...</p>
        </Container>
      </div>
    );
  }

  // -------- Render --------
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
        .bg-orb { position: absolute; border-radius: 50%; filter: blur(100px);
          animation: orbFloat 14s ease-in-out infinite; }
        .orb-1 { width: 600px; height: 600px; top: -200px; right: -200px;
          background: radial-gradient(circle, rgba(0,184,212,0.5) 0%, transparent 70%); }
        .orb-2 { width: 500px; height: 500px; bottom: -150px; left: -150px;
          background: radial-gradient(circle, rgba(102,126,234,0.4) 0%, transparent 70%); animation-delay: 4s; }
        .orb-3 { width: 400px; height: 400px; top: 40%; left: 50%;
          background: radial-gradient(circle, rgba(0,151,167,0.3) 0%, transparent 70%); animation-delay: 8s; }
        .bg-polygon { position: absolute; border: 1.5px solid rgba(0,184,212,0.25);
          animation: meshMove 16s ease-in-out infinite; }
        .poly-1 { width: 200px; height: 200px; top: 15%; left: 8%;
          transform: rotate(45deg);
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          background: linear-gradient(135deg, rgba(0,184,212,0.1), transparent); }
        .poly-2 { width: 150px; height: 150px; bottom: 20%; right: 10%;
          transform: rotate(-30deg);
          clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
          background: linear-gradient(135deg, rgba(102,126,234,0.1), transparent); animation-delay: 3s; }
        .poly-3 { width: 250px; height: 250px; top: 50%; right: 20%;
          transform: rotate(20deg);
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

        .stage-col { flex: 1; min-width: 0; }
        .stage-box { height: 100%; min-height: 90px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; padding: 8px 6px;
          border-radius: 12px; text-align: center; }
        .stage-row { display: flex; gap: 8px; flex-wrap: nowrap; }
        @media (max-width: 991px) {
          .stage-row { flex-wrap: wrap; }
          .stage-col { flex: 0 0 calc(25% - 8px); }
        }
        @media (max-width: 576px) {
          .stage-col { flex: 0 0 calc(50% - 8px); }
        }

        /* Technician board card */
        .tech-card {
          border-radius: 12px;
          padding: 14px;
          background: white;
          border-left: 4px solid #00b8d4;
          transition: all 0.2s ease;
          margin-bottom: 10px;
        }
        .tech-card:hover { box-shadow: 0 4px 16px rgba(0,184,212,0.25); }
        .tech-card.busy { border-left-color: #f39c12; }
        .tech-card.available { border-left-color: #27ae60; }

        /* Job wizard steps */
        .wizard-step {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e9ecef;
          color: #666;
          font-weight: 700;
          flex-shrink: 0;
        }
        .wizard-step.active { background: linear-gradient(135deg, #00b8d4, #0097a7); color: white; }
        .wizard-step.done { background: #27ae60; color: white; }
        .wizard-line {
          flex: 1;
          height: 3px;
          background: #e9ecef;
          margin: 0 8px;
        }
        .wizard-line.done { background: #27ae60; }
      `}</style>

      {/* 3D Background */}
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
              <h2 className="fw-bold text-white mb-1">Welcome, {user.username}! 🧑‍💼</h2>
              <Badge
                style={{
                  background: 'linear-gradient(135deg, #00b8d4, #0097a7)',
                  padding: '8px 16px',
                  fontSize: '13px',
                }}
              >
                SERVICE ADVISOR PORTAL
              </Badge>
            </div>
            <div className="d-flex gap-2 flex-wrap align-items-center">
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
                    padding: 0, border: 'none', borderRadius: '12px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center p-3"
                    style={{ borderBottom: '1px solid #eee', background: '#f8f9fa' }}>
                    <strong>Notifications</strong>
                    {unreadCount > 0 && (
                      <Button size="sm" variant="link" onClick={markAllRead} style={{ fontSize: '12px', padding: 0 }}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className="p-3"
                        style={{
                          borderBottom: '1px solid #f0f0f0',
                          background: n.read ? 'white' : '#e3f7fb',
                          cursor: 'pointer',
                        }}
                        onClick={() => markAsRead(n.id)}>
                        <div style={{ fontSize: '14px', color: '#2c3e50' }}>{n.message}</div>
                        <small className="text-muted">{new Date(n.createdAt).toLocaleString()}</small>
                      </div>
                    ))
                  )}
                </Dropdown.Menu>
              </Dropdown>
              <Button variant="outline-light" onClick={() => setShowCommunication(true)} style={glassBtn}>
                📢 Communication Hub
              </Button>
              <Button
                variant="info"
                className="fw-bold"
                onClick={() => setShowJobWizard(true)}
                style={{ boxShadow: '0 8px 24px rgba(0,184,212,0.4)' }}
              >
                + New Job Card
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* STATS */}
          <Row className="mb-4 g-3">
            {[
              { icon: '🧑‍💼', label: 'Total Customers', value: stats?.totalCustomers ?? 0 },
              { icon: '📋', label: 'Pending Requests', value: stats?.pendingServiceRequests ?? 0 },
              { icon: '🔧', label: 'Total Job Cards', value: stats?.totalJobCards ?? 0 },
              { icon: '💰', label: 'Unpaid Invoices', value: stats?.unpaidInvoices ?? 0 },
            ].map((s, i) => (
              <Col md={6} lg={3} key={i}>
                <Card className="border-0 h-100" style={glassCard}>
                  <Card.Body>
                    <div style={{ fontSize: '32px' }}>{s.icon}</div>
                    <div className="fw-bold mt-2" style={{ fontSize: '28px', color: '#00b8d4' }}>
                      {s.value}
                    </div>
                    <div className="text-muted small">{s.label}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* TABS */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
            style={{ borderBottom: 'none' }}
          >
            <Tab eventKey="jobs" title="🔧 Job Cards" />
            <Tab eventKey="requests" title="📋 Pending Requests" />
            <Tab eventKey="techs" title="👨‍🔧 Technician Board" />
            <Tab eventKey="quotes" title="💵 Quotations" />
          </Tabs>

          {/* ============ TAB 1: JOB CARDS ============ */}
          {activeTab === 'jobs' && (
            <>
              <h4 className="fw-bold text-white mb-3">🔧 Job Cards ({jobs.length})</h4>
              {jobs.length === 0 ? (
                <Card className="border-0 text-center p-5 mb-4" style={glassCard}>
                  <p className="text-muted mb-0">No job cards yet. Click <strong>+ New Job Card</strong> to create one.</p>
                </Card>
              ) : (
                jobs.map((job) => {
                  const currentIdx = getStageIndex(job.status);
                  return (
                    <Card key={job.id} className="border-0 mb-4" style={glassCard}>
                      <Card.Body>
                        <div className="d-flex justify-content-between mb-3 flex-wrap gap-2">
                          <div>
                            <h5 className="fw-bold mb-1" style={{ color: '#2c3e50' }}>
                              #{job.id} — {job.registrationNumber}
                            </h5>
                            <div className="text-muted small">
                              {job.customerName} · Advisor: {job.advisorUsername}
                            </div>
                            <div className="text-muted small">
                              {job.description?.slice(0, 80) || 'Service'}
                            </div>
                          </div>
                          <Badge bg={currentIdx >= 0 ? 'success' : 'secondary'} style={{ height: 'fit-content' }}>
                            {job.status?.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        <ProgressBar
                          now={((currentIdx + 1) / STAGES.length) * 100}
                          style={{ height: '8px', marginBottom: '20px' }}
                          variant="info"
                        />

                        <div className="stage-row mb-3">
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
                                  <div style={{ fontSize: '20px' }}>{stage.icon}</div>
                                  <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px', lineHeight: 1.2 }}>
                                    {stage.label}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline-info"
                            onClick={() => {
                              setSelectedJob(job);
                              setShowAssignTech(true);
                            }}
                          >
                            👨‍🔧 Assign Technician
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-warning"
                            onClick={() => {
                              setSelectedJob(job);
                              setShowQuotation(true);
                            }}
                          >
                            💵 Build Quotation
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => handleGenerateInvoice(job)}
                          >
                            🧾 Generate Invoice
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => setShowCommunication(true)}
                          >
                            📢 Send Approval
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })
              )}
            </>
          )}

          {/* ============ TAB 2: PENDING REQUESTS ============ */}
          {activeTab === 'requests' && (
            <>
              <h4 className="fw-bold text-white mb-3">📋 Pending Service Requests ({requests.length})</h4>
              {requests.length === 0 ? (
                <Card className="border-0 text-center p-5 mb-4" style={glassCard}>
                  <p className="text-muted mb-0">No pending requests.</p>
                </Card>
              ) : (
                <Card className="border-0 mb-4" style={glassCard}>
                  <Card.Body>
                    <Table responsive hover>
                      <thead>
                        <tr style={{ color: '#546e7a' }}>
                          <th>#</th>
                          <th>Vehicle</th>
                          <th>Customer</th>
                          <th>Description</th>
                          <th>Request Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((r) => (
                          <tr key={r.id}>
                            <td>#{r.id}</td>
                            <td><strong>{r.registrationNumber}</strong></td>
                            <td>{r.customerName}</td>
                            <td>{r.description?.slice(0, 50)}...</td>
                            <td>{new Date(r.requestDate).toLocaleDateString()}</td>
                            <td>
                              <Button
                                size="sm"
                                variant="info"
                                onClick={() => {
                                  setJobForm({
                                    ...jobForm,
                                    serviceRequestId: r.id,
                                    customerId: r.vehicleId,
                                    vehicleId: r.vehicleId,
                                    description: r.description,
                                  });
                                  setShowJobWizard(true);
                                }}
                              >
                                Convert to Job Card →
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}
            </>
          )}

          {/* ============ TAB 3: TECHNICIAN BOARD ============ */}
          {activeTab === 'techs' && (
            <>
              <h4 className="fw-bold text-white mb-3">👨‍🔧 Technician Dispatch Board</h4>
              <Row className="g-3 mb-4">
                {technicians.length === 0 ? (
                  <Col>
                    <Card className="border-0 text-center p-5" style={glassCard}>
                      <p className="text-muted mb-0">No technicians registered yet.</p>
                    </Card>
                  </Col>
                ) : (
                  technicians.map((t) => {
                    const isAvailable = t.availability;
                    const currentJob = jobs.find(
                      (j) => j.status !== 'DELIVERED' &&
                        j.technicianUsername === t.username
                    );
                    return (
                      <Col md={6} lg={4} key={t.id}>
                        <Card className="border-0 h-100" style={glassCard}>
                          <Card.Body>
                            <div className={`tech-card ${isAvailable ? 'available' : 'busy'}`}>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                  <div className="fw-bold" style={{ color: '#2c3e50' }}>
                                    👨‍🔧 {t.username}
                                  </div>
                                  <div className="text-muted small">{t.specialization}</div>
                                </div>
                                <Badge bg={isAvailable ? 'success' : 'warning'}>
                                  {isAvailable ? 'Available' : 'Busy'}
                                </Badge>
                              </div>
                              {currentJob ? (
                                <>
                                  <div className="text-muted small mt-2">
                                    Working on #{currentJob.id}
                                  </div>
                                  <div className="text-muted small">
                                    {currentJob.registrationNumber}
                                  </div>
                                </>
                              ) : (
                                <div className="text-muted small mt-2">
                                  No active job — ready for assignment
                                </div>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })
                )}
              </Row>
            </>
          )}

          {/* ============ TAB 4: QUOTATIONS ============ */}
          {activeTab === 'quotes' && (
            <>
              <h4 className="fw-bold text-white mb-3">💵 Preliminary Cost Calculation</h4>
              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Body>
                  <p className="text-muted small">
                    Automated quote builder pulls base labor rates and parts costs from the master catalog.
                  </p>
                  <Table borderless>
                    <thead>
                      <tr style={{ color: '#546e7a' }}>
                        <th>Item</th>
                        <th>Type</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotationItems.map((q) => (
                        <tr key={q.id}>
                          <td style={{ color: '#2c3e50' }}>{q.label}</td>
                          <td>
                            <Badge bg={
                              q.type === 'Baseline' ? 'secondary'
                                : q.type === 'Recommended' ? 'warning' : 'info'
                            }>
                              {q.type}
                            </Badge>
                          </td>
                          <td className="text-end fw-bold">₹{q.amount}</td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: '2px solid rgba(0,184,212,0.3)' }}>
                        <td colSpan={2} className="fw-bold">Total</td>
                        <td className="text-end fw-bold" style={{ color: '#00b8d4', fontSize: '18px' }}>
                          ₹{quotationTotal}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                  <div className="text-end">
                    <Button variant="info" className="fw-bold">
                      Send Quotation to Customer →
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </>
          )}

          {/* JOBS BY STATUS SUMMARY */}
          {stats?.jobsByStatus && (
            <>
              <h4 className="fw-bold text-white mb-3 mt-5">📊 Jobs by Status</h4>
              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Body>
                  <Row>
                    {Object.entries(stats.jobsByStatus).map(([status, count]) => (
                      <Col md={3} key={status} className="mb-3">
                        <div className="d-flex justify-content-between border-bottom py-2">
                          <span style={{ color: '#546e7a' }}>{status.replace(/_/g, ' ')}</span>
                          <Badge bg="info">{count}</Badge>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </>
          )}
        </Container>
      </div>

      {/* ============ JOB CARD WIZARD MODAL ============ */}
      <Modal show={showJobWizard} onHide={() => { setShowJobWizard(false); setWizardStep(1); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>🔧 Create Job Card — Step {wizardStep} of 3</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Wizard steps indicator */}
          <div className="d-flex align-items-center mb-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`wizard-step ${wizardStep === s ? 'active' : wizardStep > s ? 'done' : ''}`}>
                  {wizardStep > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`wizard-line ${wizardStep > s ? 'done' : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {wizardError && <Alert variant="danger">{wizardError}</Alert>}

          {/* Step 1: Vehicle & Customer */}
          {wizardStep === 1 && (
            <>
              <h6 className="fw-bold mb-3">Step 1: Vehicle & Customer</h6>
              <Form.Group className="mb-3">
                <Form.Label>Service Request ID *</Form.Label>
                <Form.Control
                  type="number"
                  value={jobForm.serviceRequestId}
                  onChange={(e) => setJobForm({ ...jobForm, serviceRequestId: e.target.value })}
                  placeholder="Enter the service request ID"
                  required
                />
                <Form.Text className="text-muted">
                  Enter the ID of the service request to convert to a job card.
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Reported Issues</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Describe the issues reported by the customer..."
                />
              </Form.Group>
            </>
          )}

          {/* Step 2: Scheduling & Costs */}
          {wizardStep === 2 && (
            <>
              <h6 className="fw-bold mb-3">Step 2: Scheduling & Estimates</h6>
              <Form.Group className="mb-3">
                <Form.Label>Estimated Completion Date *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={jobForm.estimatedCompletion}
                  onChange={(e) => setJobForm({ ...jobForm, estimatedCompletion: e.target.value })}
                  required
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Labor Charge (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      value={jobForm.laborCharge}
                      onChange={(e) => setJobForm({ ...jobForm, laborCharge: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Other Charges (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      value={jobForm.otherCharges}
                      onChange={(e) => setJobForm({ ...jobForm, otherCharges: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tax (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      value={jobForm.tax}
                      onChange={(e) => setJobForm({ ...jobForm, tax: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Discount (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      value={jobForm.discount}
                      onChange={(e) => setJobForm({ ...jobForm, discount: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </>
          )}

          {/* Step 3: Photos & Review */}
          {wizardStep === 3 && (
            <>
              <h6 className="fw-bold mb-3">Step 3: Damage Photos & Review</h6>
              <Form.Group className="mb-3">
                <Form.Label>Upload Damage Photos (optional)</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setJobForm({ ...jobForm, damagePhotos: Array.from(e.target.files) })}
                />
                <Form.Text className="text-muted">
                  {jobForm.damagePhotos.length} file(s) selected.
                </Form.Text>
              </Form.Group>
              <Alert variant="info">
                <strong>Review:</strong>
                <ul className="mb-0 mt-2">
                  <li>Service Request: #{jobForm.serviceRequestId}</li>
                  <li>Estimated Completion: {jobForm.estimatedCompletion || '—'}</li>
                  <li>Labor: ₹{jobForm.laborCharge} · Tax: ₹{jobForm.tax} · Other: ₹{jobForm.otherCharges}</li>
                  <li>Discount: ₹{jobForm.discount}</li>
                </ul>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            if (wizardStep > 1) setWizardStep(wizardStep - 1);
            else setShowJobWizard(false);
          }}>
            {wizardStep > 1 ? '← Back' : 'Cancel'}
          </Button>
          {wizardStep < 3 ? (
            <Button variant="info" onClick={() => setWizardStep(wizardStep + 1)}>
              Next →
            </Button>
          ) : (
            <Button variant="info" onClick={handleCreateJobCard} disabled={wizardLoading}>
              {wizardLoading ? 'Creating...' : '✓ Create Job Card'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* ============ ASSIGN TECHNICIAN MODAL ============ */}
      <Modal show={showAssignTech} onHide={() => setShowAssignTech(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>👨‍🔧 Assign Technician to Job #{selectedJob?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">Choose an available technician:</p>
          {technicians.length === 0 ? (
            <Alert variant="warning">No technicians registered.</Alert>
          ) : (
            technicians.map((t) => (
              <div
                key={t.id}
                className={`tech-card ${t.availability ? 'available' : 'busy'}`}
                style={{
                  cursor: 'pointer',
                  border: selectedTechnician === String(t.id)
                    ? '2px solid #00b8d4'
                    : undefined,
                }}
                onClick={() => setSelectedTechnician(String(t.id))}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold">{t.username}</div>
                    <div className="text-muted small">{t.specialization}</div>
                  </div>
                  <Badge bg={t.availability ? 'success' : 'warning'}>
                    {t.availability ? 'Available' : 'Busy'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignTech(false)}>Cancel</Button>
          <Button variant="info" onClick={handleAssignTechnician} disabled={!selectedTechnician}>
            Assign →
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ============ QUOTATION BUILDER MODAL ============ */}
      <Modal show={showQuotation} onHide={() => setShowQuotation(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>💵 Quotation Builder — Job #{selectedJob?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">
            Select items to include in the customer quote. Prices are pulled from the master catalog.
          </p>
          <Table borderless>
            <thead>
              <tr style={{ color: '#546e7a' }}>
                <th>Include</th>
                <th>Item</th>
                <th>Type</th>
                <th className="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {quotationItems.map((q, idx) => (
                <tr key={q.id}>
                  <td>
                    <Form.Check
                      checked={q.included !== false}
                      onChange={(e) => {
                        const newItems = [...quotationItems];
                        newItems[idx].included = e.target.checked;
                        setQuotationItems(newItems);
                      }}
                    />
                  </td>
                  <td>{q.label}</td>
                  <td>
                    <Badge bg={q.type === 'Baseline' ? 'secondary' : q.type === 'Recommended' ? 'warning' : 'info'}>
                      {q.type}
                    </Badge>
                  </td>
                  <td className="text-end fw-bold">₹{q.amount}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid rgba(0,184,212,0.3)' }}>
                <td colSpan={3} className="fw-bold">Total</td>
                <td className="text-end fw-bold" style={{ color: '#00b8d4', fontSize: '18px' }}>
                  ₹{quotationItems.filter((q) => q.included !== false).reduce((s, i) => s + i.amount, 0)}
                </td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQuotation(false)}>Cancel</Button>
          <Button variant="info" className="fw-bold" onClick={() => { alert('Quotation sent to customer!'); setShowQuotation(false); }}>
            Send Quotation →
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ============ COMMUNICATION HUB MODAL ============ */}
      <Modal show={showCommunication} onHide={() => setShowCommunication(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>📢 Customer Communication Hub</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Channel</Form.Label>
            <Form.Select value={commChannel} onChange={(e) => setCommChannel(e.target.value)}>
              <option value="PORTAL">Portal Notification</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={commMessage}
              onChange={(e) => setCommMessage(e.target.value)}
            />
          </Form.Group>
          <Alert variant="info">
            This message will be sent to the customer via the selected channel for approval.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCommunication(false)}>Cancel</Button>
          <Button variant="info" className="fw-bold" onClick={handleSendApproval}>
            Send via {commChannel} →
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Styles
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

export default AdvisorDashboard;