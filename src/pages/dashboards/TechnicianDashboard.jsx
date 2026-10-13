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

// Valid status transitions for technicians
const VALID_TRANSITIONS = {
  RECEIVED: ['INSPECTION'],
  INSPECTION: ['REPAIRING'],
  REPAIRING: ['PARTS_REPLACEMENT', 'TESTING'],
  PARTS_REPLACEMENT: ['REPAIRING', 'TESTING'],
  TESTING: ['READY_FOR_DELIVERY', 'REPAIRING'],
  READY_FOR_DELIVERY: [],
  DELIVERED: [],
};

// Digital inspection checklist sections
const INSPECTION_SECTIONS = [
  {
    name: 'Safety Checks',
    items: [
      { id: 'brakes', label: 'Brake System' },
      { id: 'tires', label: 'Tire Condition & Pressure' },
      { id: 'lights', label: 'Lights & Signals' },
      { id: 'horn', label: 'Horn' },
    ],
  },
  {
    name: 'Suspension & Steering',
    items: [
      { id: 'shock', label: 'Shock Absorbers' },
      { id: 'alignment', label: 'Wheel Alignment' },
      { id: 'steering', label: 'Steering Play' },
    ],
  },
  {
    name: 'Fluids & Filters',
    items: [
      { id: 'engineoil', label: 'Engine Oil' },
      { id: 'coolant', label: 'Coolant' },
      { id: 'brakefluid', label: 'Brake Fluid' },
      { id: 'airfilter', label: 'Air Filter' },
    ],
  },
  {
    name: 'Electronics',
    items: [
      { id: 'battery', label: 'Battery Health' },
      { id: 'alternator', label: 'Alternator Output' },
      { id: 'ac', label: 'Air Conditioning' },
      { id: 'infotainment', label: 'Infotainment System' },
    ],
  },
];

const TechnicianDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [parts, setParts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('queue');

  // Modals
  const [showInspection, setShowInspection] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showPartsRequest, setShowPartsRequest] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Inspection state (map of item id -> 'GREEN'|'YELLOW'|'RED')
  const [inspectionResults, setInspectionResults] = useState({});
  const [inspectionNotes, setInspectionNotes] = useState('');

  // Status update
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Parts request
  const [partsRequest, setPartsRequest] = useState({
    partId: '',
    quantity: 1,
    warrantyNotes: '',
  });
  const [partsSearch, setPartsSearch] = useState('');
  const [partsRequestError, setPartsRequestError] = useState('');
  const [partsRequestLoading, setPartsRequestLoading] = useState(false);

  // Labor time tracker (per job id)
  const [timeTrackers, setTimeTrackers] = useState({});

  // -------- Fetch --------
  const fetchData = async () => {
    try {
      const [statsRes, jobsRes, partsRes, notifRes] = await Promise.all([
        api.get('/dashboard/technician').catch(() => ({ data: null })),
        api.get('/technicians/my-jobs').catch(() => ({ data: [] })),
        api.get('/parts/all').catch(() => ({ data: [] })),
        api.get('/notifications/my').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setJobs(jobsRes.data || []);
      setParts(partsRes.data || []);
      setNotifications(notifRes.data || []);

      // Initialize time trackers for each job (in seconds, 0)
      const trackers = {};
      (jobsRes.data || []).forEach((j) => {
        trackers[j.id] = { seconds: 0, running: false };
      });
      setTimeTrackers(trackers);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Tick timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTrackers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          if (next[id].running) {
            next[id] = { ...next[id], seconds: next[id].seconds + 1 };
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // -------- Handlers --------
  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setStatusLoading(true);
    try {
      await api.put(`/job-cards/${selectedJob.id}/status`, {
        status: newStatus,
        note: statusNote,
      });
      setShowStatusUpdate(false);
      setSelectedJob(null);
      setNewStatus('');
      setStatusNote('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePartsRequest = async () => {
    setPartsRequestError('');
    if (!partsRequest.partId || partsRequest.quantity <= 0) {
      setPartsRequestError('Please select a part and quantity');
      return;
    }
    setPartsRequestLoading(true);
    try {
      await api.post('/inventory/issue', {
        jobCardId: selectedJob.id,
        partId: parseInt(partsRequest.partId, 10),
        quantity: parseInt(partsRequest.quantity, 10),
        warrantyNotes: partsRequest.warrantyNotes,
      });
      setShowPartsRequest(false);
      setPartsRequest({ partId: '', quantity: 1, warrantyNotes: '' });
      fetchData();
      alert('Parts issued successfully!');
    } catch (err) {
      setPartsRequestError(err.response?.data?.message || 'Failed to issue parts');
    } finally {
      setPartsRequestLoading(false);
    }
  };

  const handleInspectionSubmit = async () => {
    // Count results by color
    const counts = { GREEN: 0, YELLOW: 0, RED: 0 };
    Object.values(inspectionResults).forEach((v) => {
      if (counts[v] !== undefined) counts[v] += 1;
    });
    // Update job status to REPAIRING (from INSPECTION)
    try {
      if (selectedJob?.status === 'INSPECTION') {
        await api.put(`/job-cards/${selectedJob.id}/status`, {
          status: 'REPAIRING',
          note: `Inspection complete. G:${counts.GREEN} Y:${counts.YELLOW} R:${counts.R}. ${inspectionNotes}`,
        });
      } else if (selectedJob?.status === 'RECEIVED') {
        await api.put(`/job-cards/${selectedJob.id}/status`, {
          status: 'INSPECTION',
          note: 'Inspection started',
        });
      }
      setShowInspection(false);
      setInspectionResults({});
      setInspectionNotes('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit inspection');
    }
  };

  const toggleTimer = (jobId) => {
    setTimeTrackers((prev) => ({
      ...prev,
      [jobId]: { ...prev[jobId], running: !prev[jobId].running },
    }));
  };

  const resetTimer = (jobId) => {
    setTimeTrackers((prev) => ({
      ...prev,
      [jobId]: { seconds: 0, running: false },
    }));
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
  const filteredParts = parts.filter((p) =>
    p.name?.toLowerCase().includes(partsSearch.toLowerCase()) ||
    p.brand?.toLowerCase().includes(partsSearch.toLowerCase())
  );

  // -------- Loading --------
  if (loading) {
    return (
      <div style={pageStyle}>
        <Container className="text-center" style={{ paddingTop: '200px' }}>
          <Spinner animation="border" variant="info" />
          <p className="mt-3 text-white">Loading technician dashboard...</p>
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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

        /* Job card on work queue */
        .work-card {
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.94);
          padding: 20px;
          margin-bottom: 16px;
          border-left: 6px solid #00b8d4;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }
        .work-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 184, 212, 0.25);
        }

        /* Timer button */
        .timer-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 24px;
          font-family: 'Courier New', monospace;
          font-weight: 700;
          font-size: 16px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .timer-btn.idle { background: #e9ecef; color: #546e7a; }
        .timer-btn.running {
          background: linear-gradient(135deg, #00b8d4, #0097a7);
          color: white;
          animation: pulse 2s ease-in-out infinite;
        }

        /* Inspection tri-state buttons */
        .inspect-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-radius: 10px;
          background: #f8f9fa;
          margin-bottom: 8px;
        }
        .tri-toggle {
          display: flex;
          gap: 6px;
        }
        .tri-btn {
          width: 44px;
          height: 36px;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          background: white;
          transition: all 0.2s ease;
        }
        .tri-btn:hover { transform: scale(1.1); }
        .tri-btn.green.active { background: #27ae60; color: white; border-color: #1e8449; }
        .tri-btn.yellow.active { background: #f39c12; color: white; border-color: #b9770e; }
        .tri-btn.red.active { background: #e74c3c; color: white; border-color: #a93226; }

        /* Priority badge */
        .priority-urgent { background: #e74c3c !important; }
        .priority-high { background: #f39c12 !important; }
        .priority-normal { background: #27ae60 !important; }
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
              <h2 className="fw-bold text-white mb-1">Welcome, {user.username}! 👨‍🔧</h2>
              <Badge
                style={{
                  background: 'linear-gradient(135deg, #00b8d4, #0097a7)',
                  padding: '8px 16px',
                  fontSize: '13px',
                }}
              >
                TECHNICIAN PORTAL
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
              <Button
                variant="outline-light"
                style={glassBtn}
                onClick={() => setShowPartsRequest(true)}
                disabled={jobs.length === 0}
              >
                📦 Request Parts
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* STATS */}
          <Row className="mb-4 g-3">
            {[
              { icon: '📋', label: 'Jobs Assigned', value: stats?.assignedJobCount ?? jobs.length },
              { icon: '⚙️', label: 'In Repair', value: stats?.myJobsByStatus?.REPAIRING ?? 0 },
              { icon: '🔍', label: 'Inspection', value: stats?.myJobsByStatus?.INSPECTION ?? 0 },
              { icon: '✅', label: 'Ready to Deliver', value: stats?.myJobsByStatus?.READY_FOR_DELIVERY ?? 0 },
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
            <Tab eventKey="queue" title="📋 Active Work Queue" />
            <Tab eventKey="timers" title="⏱️ Labor Time Tracker" />
            <Tab eventKey="history" title="📜 Completed Jobs" />
          </Tabs>

          {/* ============ TAB 1: WORK QUEUE ============ */}
          {activeTab === 'queue' && (
            <>
              <h4 className="fw-bold text-white mb-3">
                📋 Active Work Queue ({jobs.filter((j) => j.status !== 'DELIVERED').length})
              </h4>

              {jobs.filter((j) => j.status !== 'DELIVERED').length === 0 ? (
                <Card className="border-0 text-center p-5 mb-4" style={glassCard}>
                  <p className="text-muted mb-0">
                    No active jobs. All caught up! ✅
                  </p>
                </Card>
              ) : (
                jobs
                  .filter((j) => j.status !== 'DELIVERED')
                  .map((job) => {
                    const currentIdx = getStageIndex(job.status);
                    const availableTransitions = VALID_TRANSITIONS[job.status] || [];
                    const timer = timeTrackers[job.id] || { seconds: 0, running: false };

                    // Determine priority
                    let priority = 'Normal';
                    let priorityClass = 'priority-normal';
                    if (job.status === 'READY_FOR_DELIVERY') {
                      priority = 'Urgent';
                      priorityClass = 'priority-urgent';
                    } else if (job.status === 'TESTING' || job.status === 'PARTS_REPLACEMENT') {
                      priority = 'High';
                      priorityClass = 'priority-high';
                    }

                    return (
                      <div className="work-card" key={job.id}>
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <h5 className="fw-bold mb-0" style={{ color: '#2c3e50' }}>
                                #{job.id} — {job.registrationNumber}
                              </h5>
                              <Badge className={priorityClass}>{priority}</Badge>
                            </div>
                            <div className="text-muted small">
                              👤 {job.customerName} · Advisor: {job.advisorUsername}
                            </div>
                            <div className="text-muted small">
                              🕒 Estimated: {job.estimatedCompletion ?
                                new Date(job.estimatedCompletion).toLocaleString() : '—'}
                            </div>
                          </div>
                          <Badge bg={currentIdx >= 0 ? 'info' : 'secondary'} style={{ height: 'fit-content' }}>
                            {job.status?.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        {/* Symptoms */}
                        <div
                          className="mb-3 p-3"
                          style={{
                            background: '#f8f9fa',
                            borderRadius: '10px',
                            borderLeft: '3px solid #00b8d4',
                          }}
                        >
                          <div className="fw-semibold small mb-1" style={{ color: '#546e7a' }}>
                            📝 Reported Symptoms:
                          </div>
                          <div style={{ color: '#2c3e50', fontSize: '14px' }}>
                            {job.description || 'No symptoms reported'}
                          </div>
                        </div>

                        {/* Progress bar + stages */}
                        <ProgressBar
                          now={((currentIdx + 1) / STAGES.length) * 100}
                          style={{ height: '8px', marginBottom: '16px' }}
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
                                    minHeight: '70px',
                                  }}
                                >
                                  <div style={{ fontSize: '18px' }}>{stage.icon}</div>
                                  <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px', lineHeight: 1.1 }}>
                                    {stage.label}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Timer widget */}
                        <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                          <button
                            className={`timer-btn ${timer.running ? 'running' : 'idle'}`}
                            onClick={() => toggleTimer(job.id)}
                          >
                            <span>{timer.running ? '⏸️' : '▶️'}</span>
                            {formatTime(timer.seconds)}
                          </button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => resetTimer(job.id)}
                          >
                            ↺ Reset
                          </Button>
                          <div className="text-muted small ms-2">
                            Actual labor time · Est: 2.5 hrs
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => {
                              setSelectedJob(job);
                              setInspectionResults({});
                              setInspectionNotes('');
                              setShowInspection(true);
                            }}
                          >
                            🔍 Digital Inspection
                          </Button>
                          <Button
                            size="sm"
                            variant="info"
                            onClick={() => {
                              setSelectedJob(job);
                              setNewStatus(
                                (VALID_TRANSITIONS[job.status] || [])[0] || ''
                              );
                              setStatusNote('');
                              setShowStatusUpdate(true);
                            }}
                            disabled={availableTransitions.length === 0}
                          >
                            ▶️ Advance Stage
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-warning"
                            onClick={() => {
                              setSelectedJob(job);
                              setPartsRequest({ partId: '', quantity: 1, warrantyNotes: '' });
                              setPartsRequestError('');
                              setPartsSearch('');
                              setShowPartsRequest(true);
                            }}
                          >
                            📦 Request Parts
                          </Button>
                        </div>
                      </div>
                    );
                  })
              )}
            </>
          )}

          {/* ============ TAB 2: TIME TRACKER ============ */}
          {activeTab === 'timers' && (
            <>
              <h4 className="fw-bold text-white mb-3">⏱️ Labor Time Tracker</h4>
              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Body>
                  <p className="text-muted small">
                    Track time spent on each job. Compare against estimated durations.
                  </p>
                  <Table responsive hover>
                    <thead>
                      <tr style={{ color: '#546e7a' }}>
                        <th>Job</th>
                        <th>Vehicle</th>
                        <th>Status</th>
                        <th>Est. Duration</th>
                        <th>Actual Time</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.filter((j) => j.status !== 'DELIVERED').map((j) => {
                        const timer = timeTrackers[j.id] || { seconds: 0, running: false };
                        return (
                          <tr key={j.id}>
                            <td><strong>#{j.id}</strong></td>
                            <td>{j.registrationNumber}</td>
                            <td>
                              <Badge bg="info">{j.status?.replace(/_/g, ' ')}</Badge>
                            </td>
                            <td>2.5 hrs</td>
                            <td>
                              <span className="fw-bold" style={{ fontFamily: 'Courier New' }}>
                                {formatTime(timer.seconds)}
                              </span>
                            </td>
                            <td className="text-end">
                              <Button
                                size="sm"
                                variant={timer.running ? 'warning' : 'success'}
                                onClick={() => toggleTimer(j.id)}
                                className="me-1"
                              >
                                {timer.running ? '⏸️ Pause' : '▶️ Start'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => resetTimer(j.id)}
                              >
                                ↺ Reset
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}

          {/* ============ TAB 3: COMPLETED ============ */}
          {activeTab === 'history' && (
            <>
              <h4 className="fw-bold text-white mb-3">📜 Completed Jobs</h4>
              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Body>
                  {jobs.filter((j) => j.status === 'DELIVERED').length === 0 ? (
                    <p className="text-muted mb-0 text-center">No completed jobs yet.</p>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr style={{ color: '#546e7a' }}>
                          <th>Job #</th>
                          <th>Vehicle</th>
                          <th>Customer</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.filter((j) => j.status === 'DELIVERED').map((j) => (
                          <tr key={j.id}>
                            <td>#{j.id}</td>
                            <td>{j.registrationNumber}</td>
                            <td>{j.customerName}</td>
                            <td><Badge bg="success">DELIVERED</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Container>
      </div>

      {/* ============ INSPECTION CHECKLIST MODAL ============ */}
      <Modal show={showInspection} onHide={() => setShowInspection(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>🔍 Digital Inspection — Job #{selectedJob?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Alert variant="info">
            Tap each item to mark as <strong style={{ color: '#27ae60' }}>Green</strong> (OK),{' '}
            <strong style={{ color: '#f39c12' }}>Yellow</strong> (Monitor), or{' '}
            <strong style={{ color: '#e74c3c' }}>Red</strong> (Needs attention).
          </Alert>

          {INSPECTION_SECTIONS.map((section) => (
            <div key={section.name} className="mb-4">
              <h6 className="fw-bold mb-3" style={{ color: '#2c3e50', borderBottom: '2px solid #00b8d4', paddingBottom: '6px' }}>
                {section.name}
              </h6>
              {section.items.map((item) => (
                <div className="inspect-row" key={item.id}>
                  <span style={{ color: '#2c3e50', fontSize: '14px' }}>{item.label}</span>
                  <div className="tri-toggle">
                    <button
                      className={`tri-btn green ${inspectionResults[item.id] === 'GREEN' ? 'active' : ''}`}
                      onClick={() => setInspectionResults({ ...inspectionResults, [item.id]: 'GREEN' })}
                      title="OK"
                    >
                      ✓
                    </button>
                    <button
                      className={`tri-btn yellow ${inspectionResults[item.id] === 'YELLOW' ? 'active' : ''}`}
                      onClick={() => setInspectionResults({ ...inspectionResults, [item.id]: 'YELLOW' })}
                      title="Monitor"
                    >
                      !
                    </button>
                    <button
                      className={`tri-btn red ${inspectionResults[item.id] === 'RED' ? 'active' : ''}`}
                      onClick={() => setInspectionResults({ ...inspectionResults, [item.id]: 'RED' })}
                      title="Needs attention"
                    >
                      ✗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <Form.Group className="mt-3">
            <Form.Label className="fw-bold">Additional Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              placeholder="Any extra observations..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInspection(false)}>Cancel</Button>
          <Button variant="info" onClick={handleInspectionSubmit} className="fw-bold">
            Submit Inspection →
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ============ STATUS UPDATE MODAL ============ */}
      <Modal show={showStatusUpdate} onHide={() => setShowStatusUpdate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>▶️ Advance Job Status — #{selectedJob?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Current status: <strong>{selectedJob?.status?.replace(/_/g, ' ')}</strong>
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>New Status</Form.Label>
            <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {(VALID_TRANSITIONS[selectedJob?.status] || []).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Note (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Add a note for this status change..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusUpdate(false)}>Cancel</Button>
          <Button variant="info" onClick={handleStatusUpdate} disabled={statusLoading || !newStatus}>
            {statusLoading ? 'Updating...' : 'Update Status →'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ============ PARTS REQUEST MODAL ============ */}
      <Modal show={showPartsRequest} onHide={() => setShowPartsRequest(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📦 Parts Requisition — Job #{selectedJob?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {partsRequestError && <Alert variant="danger">{partsRequestError}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Search Parts</Form.Label>
            <Form.Control
              placeholder="Type part name or brand..."
              value={partsSearch}
              onChange={(e) => setPartsSearch(e.target.value)}
            />
          </Form.Group>

          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '10px' }}>
            {filteredParts.length === 0 ? (
              <div className="p-4 text-center text-muted">No parts found</div>
            ) : (
              filteredParts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 d-flex justify-content-between align-items-center"
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: partsRequest.partId === String(p.id) ? '#e3f7fb' : 'white',
                  }}
                  onClick={() => setPartsRequest({ ...partsRequest, partId: String(p.id) })}
                >
                  <div>
                    <div className="fw-bold" style={{ color: '#2c3e50' }}>
                      {p.name} <span className="text-muted">({p.brand})</span>
                    </div>
                    <div className="text-muted small">₹{p.unitPrice} · Warranty: {p.warrantyMonths} mo</div>
                  </div>
                  <Badge bg={p.stockQuantity < 5 ? 'danger' : 'success'}>
                    Stock: {p.stockQuantity}
                  </Badge>
                </div>
              ))
            )}
          </div>

          <Row className="mt-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={partsRequest.quantity}
                  onChange={(e) => setPartsRequest({ ...partsRequest, quantity: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Warranty / Notes</Form.Label>
                <Form.Control
                  value={partsRequest.warrantyNotes}
                  onChange={(e) => setPartsRequest({ ...partsRequest, warrantyNotes: e.target.value })}
                  placeholder="e.g., 6 months Bosch warranty"
                />
              </Form.Group>
            </Col>
          </Row>

          {partsRequest.partId && (
            <Alert variant="success" className="mt-3 mb-0">
              Selected: {parts.find((p) => p.id === parseInt(partsRequest.partId, 10))?.name}
              {' '}× {partsRequest.quantity}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPartsRequest(false)}>Cancel</Button>
          <Button variant="info" onClick={handlePartsRequest} disabled={partsRequestLoading} className="fw-bold">
            {partsRequestLoading ? 'Issuing...' : '📤 Issue Parts →'}
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

export default TechnicianDashboard;