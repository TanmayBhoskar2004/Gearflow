import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Card, Badge, Spinner, Alert,
  Button, Modal, Form, Table, ProgressBar, Dropdown, Tabs, Tab,
  ButtonGroup,
} from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const AdminDashboard = () => {
  const { user } = useAuth();

  // -------- State --------
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('analytics');
  const [timeRange, setTimeRange] = useState('MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // User form
  const [userForm, setUserForm] = useState({
    username: '', email: '', password: '', role: 'CUSTOMER',
  });
  const [userFormError, setUserFormError] = useState('');
  const [userFormLoading, setUserFormLoading] = useState(false);

  // Attendance tracking (demo, stored locally)
  const [attendance, setAttendance] = useState(() =>
    JSON.parse(localStorage.getItem('attendance') || '[]')
  );

  // Master settings (demo)
  const [settings, setSettings] = useState(() =>
    JSON.parse(localStorage.getItem('settings') || JSON.stringify({
      laborRate: 500,        // per hour
      taxPercent: 18,        // GST
      partsMarkup: 15,       // % on parts cost
      serviceCharge: 200,    // standard service charge
    }))
  );

  // Demo business metrics per range
  const businessMetrics = {
    DAY: { revenue: 48500, vehicles: 12, avgTurnaround: 1.8, bayUtilization: 68, margin: 32 },
    WEEK: { revenue: 328000, vehicles: 78, avgTurnaround: 1.9, bayUtilization: 72, margin: 34 },
    MONTH: { revenue: 1350000, vehicles: 312, avgTurnaround: 2.1, bayUtilization: 74, margin: 33 },
    QUARTER: { revenue: 4100000, vehicles: 940, avgTurnaround: 2.0, bayUtilization: 76, margin: 35 },
    YEAR: { revenue: 16400000, vehicles: 3780, avgTurnaround: 2.2, bayUtilization: 73, margin: 31 },
    CUSTOM: { revenue: 980000, vehicles: 220, avgTurnaround: 2.0, bayUtilization: 71, margin: 33 },
  };

  // -------- Fetch --------
  const fetchData = async () => {
    try {
      const res = await api.get('/dashboard/admin').catch(() => ({ data: null }));
      setStats(res.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // -------- Handlers --------
  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserFormError('');
    setUserFormLoading(true);
    try {
      await api.post('/auth/register', userForm);
      setShowUserModal(false);
      setUserForm({ username: '', email: '', password: '', role: 'CUSTOMER' });
      fetchData();
      alert('User created successfully!');
    } catch (err) {
      setUserFormError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleMarkAttendance = (userId, status) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = attendance.find(
      (a) => a.userId === userId && a.date === today
    );
    let updated;
    if (existing) {
      updated = attendance.map((a) =>
        a.userId === userId && a.date === today ? { ...a, status } : a
      );
    } else {
      updated = [...attendance, { userId, date: today, status }];
    }
    setAttendance(updated);
    localStorage.setItem('attendance', JSON.stringify(updated));
  };

  const getAttendanceStatus = (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const record = attendance.find(
      (a) => a.userId === userId && a.date === today
    );
    return record?.status || 'NOT_MARKED';
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('settings', JSON.stringify(settings));
    setShowSettingsModal(false);
    alert('Settings saved!');
  };

  const calculateSalary = (userId) => {
    // Demo salary calculation
    const baseSalary = 25000; // monthly
    const month = new Date().getMonth();
    const monthAttendance = attendance.filter((a) => {
      const d = new Date(a.date);
      return a.userId === userId && d.getMonth() === month && a.status === 'PRESENT';
    }).length;
    const workingDays = 26;
    const perDay = baseSalary / workingDays;
    const earned = Math.round(perDay * monthAttendance);
    const deduction = baseSalary - earned;
    return { baseSalary, presentDays: monthAttendance, earned, deduction };
  };

  const markAllRead = async () => { /* placeholder */ };

  // -------- Derived --------
  const currentMetrics = businessMetrics[timeRange] || businessMetrics.MONTH;
  const staffUsers = users.filter((u) =>
    ['SERVICE_ADVISOR', 'TECHNICIAN', 'INVENTORY_MANAGER'].includes(u.role?.name || u.role)
  );

  // -------- Loading --------
  if (loading) {
    return (
      <div style={pageStyle}>
        <Container className="text-center" style={{ paddingTop: '200px' }}>
          <Spinner animation="border" variant="info" />
          <p className="mt-3 text-white">Loading admin dashboard...</p>
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

        /* KPI card */
        .kpi-card {
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.94);
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          height: 100%;
        }
        .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,184,212,0.25); }
        .kpi-value { font-size: 30px; font-weight: 700; color: #00b8d4; margin-top: 8px; }
        .kpi-label { font-size: 13px; color: #90a4ae; text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-change { font-size: 12px; margin-top: 6px; }

        /* Bar chart */
        .bar-container {
          display: flex; align-items: flex-end;
          gap: 8px; height: 180px; margin-top: 20px;
        }
        .bar {
          flex: 1;
          background: linear-gradient(180deg, #00b8d4 0%, #0097a7 100%);
          border-radius: 6px 6px 0 0;
          position: relative;
          transition: all 0.3s ease;
          min-height: 4px;
        }
        .bar:hover { filter: brightness(1.15); }
        .bar-label {
          position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%);
          font-size: 10px; color: #90a4ae;
        }
        .bar-value {
          position: absolute; top: -18px; left: 50%; transform: translateX(-50%);
          font-size: 10px; color: #2c3e50; font-weight: 700; white-space: nowrap;
        }

        /* Range pill buttons */
        .range-btn {
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.3);
          background: transparent;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .range-btn:hover { background: rgba(255,255,255,0.1); }
        .range-btn.active {
          background: linear-gradient(135deg, #00b8d4, #0097a7);
          border-color: #00b8d4;
          box-shadow: 0 4px 12px rgba(0,184,212,0.4);
        }

        /* Attendance chip */
        .att-chip {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .att-present { background: #d4edda; color: #155724; }
        .att-absent { background: #f8d7da; color: #721c24; }
        .att-halfday { background: #fff3cd; color: #856404; }
        .att-leave { background: #cce5ff; color: #004085; }
        .att-not_marked { background: #e9ecef; color: #6c757d; }
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
              <h2 className="fw-bold text-white mb-1">Welcome, {user.username}! 👑</h2>
              <Badge
                style={{
                  background: 'linear-gradient(135deg, #00b8d4, #0097a7)',
                  padding: '8px 16px',
                  fontSize: '13px',
                }}
              >
                ADMIN PORTAL
              </Badge>
            </div>
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <Button variant="outline-light" onClick={() => setShowSettingsModal(true)} style={glassBtn}>
                ⚙️ Settings
              </Button>
              <Button
                variant="info"
                className="fw-bold"
                onClick={() => setShowUserModal(true)}
                style={{ boxShadow: '0 8px 24px rgba(0,184,212,0.4)' }}
              >
                + Add User
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* ============ TIME RANGE SELECTOR ============ */}
          <Card className="border-0 mb-4" style={glassCard}>
            <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex gap-2 flex-wrap">
                {['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM'].map((r) => (
                  <button
                    key={r}
                    className={`range-btn ${timeRange === r ? 'active' : ''}`}
                    onClick={() => setTimeRange(r)}
                  >
                    {r === 'DAY' ? '📅 1 Day' :
                     r === 'WEEK' ? '📆 1 Week' :
                     r === 'MONTH' ? '🗓️ 1 Month' :
                     r === 'QUARTER' ? '📊 1 Quarter' :
                     r === 'YEAR' ? '📈 1 Year' : '⚙️ Custom'}
                  </button>
                ))}
              </div>
              {timeRange === 'CUSTOM' && (
                <div className="d-flex gap-2 align-items-center">
                  <Form.Control type="date" size="sm" value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)} style={{ width: '140px' }} />
                  <span className="text-white">to</span>
                  <Form.Control type="date" size="sm" value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)} style={{ width: '140px' }} />
                </div>
              )}
            </Card.Body>
          </Card>

          {/* ============ EXECUTIVE KPIs ============ */}
          <h4 className="fw-bold text-white mb-3">📊 Executive KPIs — {timeRange}</h4>
          <Row className="mb-4 g-3">
            {[
              { icon: '💰', label: 'Gross Revenue', value: `₹${currentMetrics.revenue.toLocaleString()}`, change: '+12.4%', up: true },
              { icon: '🚗', label: 'Vehicle Throughput', value: currentMetrics.vehicles, change: '+8.2%', up: true },
              { icon: '⏱️', label: 'Avg Turnaround', value: `${currentMetrics.avgTurnaround} days`, change: '-0.3d', up: true },
              { icon: '🏭', label: 'Bay Utilization', value: `${currentMetrics.bayUtilization}%`, change: '+4.1%', up: true },
              { icon: '📈', label: 'Profit Margin', value: `${currentMetrics.margin}%`, change: '+1.2%', up: true },
            ].map((k, i) => (
              <Col md={6} lg={4} xl key={i}>
                <div className="kpi-card">
                  <div style={{ fontSize: '32px' }}>{k.icon}</div>
                  <div className="kpi-value">{k.value}</div>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-change" style={{ color: k.up ? '#27ae60' : '#e74c3c' }}>
                    {k.up ? '▲' : '▼'} {k.change} vs previous period
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* ============ REVENUE CHART ============ */}
          <Card className="border-0 mb-4" style={glassCard}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0" style={{ color: '#2c3e50' }}>
                  📈 Revenue Trend
                </h5>
                <Badge bg="info">{timeRange}</Badge>
              </div>
              <div className="bar-container">
                {[
                  { label: 'P1', value: 45 },
                  { label: 'P2', value: 62 },
                  { label: 'P3', value: 78 },
                  { label: 'P4', value: 55 },
                  { label: 'P5', value: 88 },
                  { label: 'P6', value: 72 },
                  { label: 'P7', value: 95 },
                  { label: 'P8', value: 68 },
                  { label: 'P9', value: 82 },
                  { label: 'P10', value: 91 },
                ].map((b, i) => (
                  <div
                    className="bar"
                    key={i}
                    style={{ height: `${b.value}%` }}
                  >
                    <span className="bar-value">₹{(b.value * 1000).toLocaleString()}</span>
                    <span className="bar-label">{b.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: '30px' }} />
            </Card.Body>
          </Card>

          {/* TABS */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
            style={{ borderBottom: 'none' }}
          >
            <Tab eventKey="analytics" title="📊 Analytics" />
            <Tab eventKey="users" title="👥 User Management" />
            <Tab eventKey="attendance" title="🕐 Attendance" />
            <Tab eventKey="salary" title="💵 Salary" />
            <Tab eventKey="settings" title="⚙️ Master Catalog" />
          </Tabs>

          {/* ============ TAB 1: ANALYTICS ============ */}
          {activeTab === 'analytics' && (
            <>
              {/* Users by Role */}
              {stats?.usersByRole && (
                <Card className="border-0 mb-4" style={glassCard}>
                  <Card.Header className="bg-white fw-bold">👥 Users by Role</Card.Header>
                  <Card.Body>
                    <Row>
                      {Object.entries(stats.usersByRole).map(([role, count]) => (
                        <Col md={3} key={role} className="mb-3">
                          <div className="d-flex justify-content-between border-bottom py-2">
                            <span style={{ color: '#546e7a' }}>{role.replace(/_/g, ' ')}</span>
                            <Badge bg="info">{count}</Badge>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Outstanding + Low Stock */}
              <Row>
                <Col md={6} className="mb-3">
                  <Card className="border-0" style={glassCard}>
                    <Card.Body>
                      <div className="text-muted small">Total Outstanding</div>
                      <div className="fw-bold" style={{ fontSize: '28px', color: '#e74c3c' }}>
                        ₹{stats?.totalOutstanding?.toLocaleString() ?? 0}
                      </div>
                      <div className="text-muted small mt-1">
                        💡 Follow up with customers
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-3">
                  <Card className="border-0" style={glassCard}>
                    <Card.Body>
                      <div className="text-muted small">Low Stock Parts</div>
                      <div className="fw-bold" style={{ fontSize: '28px', color: '#f39c12' }}>
                        {stats?.lowStockParts ?? 0}
                      </div>
                      <div className="text-muted small mt-1">
                        📦 Coordinate with inventory
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Business Insights */}
              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Header className="bg-white fw-bold">📈 Business Development Insights</Card.Header>
                <Card.Body>
                  <Row>
                    {[
                      { icon: '🎯', label: 'Top Service', value: 'General Service (42%)' },
                      { icon: '🏆', label: 'Top Technician', value: 'Rajesh Kumar' },
                      { icon: '💎', label: 'Highest Margin Service', value: 'AC Service (48%)' },
                      { icon: '📅', label: 'Busiest Day', value: 'Saturday' },
                      { icon: '🔁', label: 'Returning Customers', value: '68%' },
                      { icon: '⭐', label: 'Avg Rating', value: '4.8 / 5' },
                    ].map((b, i) => (
                      <Col md={4} key={i} className="mb-3">
                        <div className="d-flex align-items-center gap-3 p-3"
                          style={{ background: '#f8f9fa', borderRadius: '12px' }}>
                          <div style={{ fontSize: '28px' }}>{b.icon}</div>
                          <div>
                            <div className="text-muted small">{b.label}</div>
                            <div className="fw-bold" style={{ color: '#2c3e50' }}>{b.value}</div>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </>
          )}

          {/* ============ TAB 2: USER MANAGEMENT ============ */}
          {activeTab === 'users' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 className="fw-bold text-white mb-0">👥 User Management (RBAC)</h4>
                <Button variant="info" className="fw-bold" onClick={() => setShowUserModal(true)}>
                  + Add User
                </Button>
              </div>

              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr style={{ color: '#546e7a' }}>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            User list requires a backend endpoint.<br />
                            <small>Expected: GET /api/admin/users</small>
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id}>
                            <td>#{u.id}</td>
                            <td><strong>{u.username}</strong></td>
                            <td>{u.email}</td>
                            <td><Badge bg="info">{u.role?.replace(/_/g, ' ')}</Badge></td>
                            <td>
                              <Badge bg={u.enabled !== false ? 'success' : 'danger'}>
                                {u.enabled !== false ? 'Active' : 'Disabled'}
                              </Badge>
                            </td>
                            <td className="text-end">
                              <Button size="sm" variant="outline-primary" className="me-1">
                                ✏️ Edit
                              </Button>
                              <Button size="sm" variant="outline-warning">
                                🔒 Reset Password
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}

          {/* ============ TAB 3: ATTENDANCE ============ */}
          {activeTab === 'attendance' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 className="fw-bold text-white mb-0">🕐 Staff Attendance — Today</h4>
                <Badge bg="info" style={{ padding: '10px 16px' }}>
                  {new Date().toLocaleDateString()}
                </Badge>
              </div>

              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Body>
                  <p className="text-muted small">
                    Mark daily attendance for Advisors, Technicians, and Inventory Managers.
                  </p>
                  <Table responsive hover>
                    <thead>
                      <tr style={{ color: '#546e7a' }}>
                        <th>Staff Name</th>
                        <th>Role</th>
                        <th>Attendance</th>
                        <th className="text-end">Mark As</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-4">
                            No staff users found. Create Advisors/Technicians/Inventory Managers first.<br />
                            <small>For demo: try adding them via "+ Add User".</small>
                          </td>
                        </tr>
                      ) : (
                        staffUsers.map((u) => {
                          const status = getAttendanceStatus(u.id);
                          const chipClass = `att-${status.toLowerCase()}`;
                          return (
                            <tr key={u.id}>
                              <td><strong>{u.username}</strong></td>
                              <td><Badge bg="info">{u.role?.replace(/_/g, ' ')}</Badge></td>
                              <td>
                                <span className={`att-chip ${chipClass}`}>
                                  {status.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="text-end">
                                <ButtonGroup size="sm">
                                  <Button variant="success" onClick={() => handleMarkAttendance(u.id, 'PRESENT')}>
                                    ✓ Present
                                  </Button>
                                  <Button variant="warning" onClick={() => handleMarkAttendance(u.id, 'HALF_DAY')}>
                                    ½ Half
                                  </Button>
                                  <Button variant="info" onClick={() => handleMarkAttendance(u.id, 'LEAVE')}>
                                    🌴 Leave
                                  </Button>
                                  <Button variant="danger" onClick={() => handleMarkAttendance(u.id, 'ABSENT')}>
                                    ✗ Absent
                                  </Button>
                                </ButtonGroup>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}

          {/* ============ TAB 4: SALARY ============ */}
          {activeTab === 'salary' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 className="fw-bold text-white mb-0">💵 Salary Generation</h4>
                <Badge bg="info" style={{ padding: '10px 16px' }}>
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Badge>
              </div>

              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Body>
                  <p className="text-muted small">
                    Salary is calculated based on the number of <strong>PRESENT</strong> days marked
                    in the Attendance tab.
                  </p>
                  <Table responsive hover>
                    <thead>
                      <tr style={{ color: '#546e7a' }}>
                        <th>Staff Name</th>
                        <th>Role</th>
                        <th>Base Salary</th>
                        <th>Present Days</th>
                        <th>Earned</th>
                        <th>Deduction</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            No staff users found.
                          </td>
                        </tr>
                      ) : (
                        staffUsers.map((u) => {
                          const salary = calculateSalary(u.id);
                          return (
                            <tr key={u.id}>
                              <td><strong>{u.username}</strong></td>
                              <td><Badge bg="info">{u.role?.replace(/_/g, ' ')}</Badge></td>
                              <td>₹{salary.baseSalary.toLocaleString()}</td>
                              <td>
                                <Badge bg="success">{salary.presentDays} / 26</Badge>
                              </td>
                              <td className="fw-bold" style={{ color: '#27ae60' }}>
                                ₹{salary.earned.toLocaleString()}
                              </td>
                              <td style={{ color: '#e74c3c' }}>
                                -₹{salary.deduction.toLocaleString()}
                              </td>
                              <td className="text-end">
                                <Button size="sm" variant="outline-info" className="me-1">
                                  📄 Payslip
                                </Button>
                                <Button size="sm" variant="info">
                                  💸 Pay Now
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {/* Salary summary */}
              <Row>
                <Col md={4} className="mb-3">
                  <Card className="border-0" style={glassCard}>
                    <Card.Body>
                      <div className="text-muted small">Total Monthly Payroll</div>
                      <div className="fw-bold" style={{ fontSize: '26px', color: '#00b8d4' }}>
                        ₹{(staffUsers.length * 25000).toLocaleString()}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4} className="mb-3">
                  <Card className="border-0" style={glassCard}>
                    <Card.Body>
                      <div className="text-muted small">Staff Count</div>
                      <div className="fw-bold" style={{ fontSize: '26px', color: '#00b8d4' }}>
                        {staffUsers.length}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4} className="mb-3">
                  <Card className="border-0" style={glassCard}>
                    <Card.Body>
                      <div className="text-muted small">Avg Salary</div>
                      <div className="fw-bold" style={{ fontSize: '26px', color: '#00b8d4' }}>
                        ₹25,000
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* ============ TAB 5: MASTER CATALOG & SETTINGS ============ */}
          {activeTab === 'settings' && (
            <>
              <h4 className="fw-bold text-white mb-3">⚙️ Master Catalog & System Settings</h4>
              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
                        💰 Rate Configuration
                      </h6>
                      <Form.Group className="mb-3">
                        <Form.Label>Baseline Labor Rate (₹ / hour)</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.laborRate}
                          onChange={(e) => setSettings({ ...settings, laborRate: parseInt(e.target.value, 10) })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Standard Service Charge (₹)</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.serviceCharge}
                          onChange={(e) => setSettings({ ...settings, serviceCharge: parseInt(e.target.value, 10) })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <h6 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
                        📊 Tax & Markup
                      </h6>
                      <Form.Group className="mb-3">
                        <Form.Label>Tax Rate (GST %)</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.taxPercent}
                          onChange={(e) => setSettings({ ...settings, taxPercent: parseInt(e.target.value, 10) })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Parts Markup (%)</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.partsMarkup}
                          onChange={(e) => setSettings({ ...settings, partsMarkup: parseInt(e.target.value, 10) })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="text-end">
                    <Button variant="info" className="fw-bold" onClick={handleSaveSettings}>
                      💾 Save Settings
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Preview impact */}
              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Header className="bg-white fw-bold">🧮 Preview Impact</Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3} className="mb-3">
                      <div className="text-muted small">Sample Labor (2 hrs)</div>
                      <div className="fw-bold" style={{ fontSize: '20px', color: '#00b8d4' }}>
                        ₹{settings.laborRate * 2}
                      </div>
                    </Col>
                    <Col md={3} className="mb-3">
                      <div className="text-muted small">Sample Part ₹1000 + Markup</div>
                      <div className="fw-bold" style={{ fontSize: '20px', color: '#00b8d4' }}>
                        ₹{Math.round(1000 * (1 + settings.partsMarkup / 100))}
                      </div>
                    </Col>
                    <Col md={3} className="mb-3">
                      <div className="text-muted small">Tax on ₹5000</div>
                      <div className="fw-bold" style={{ fontSize: '20px', color: '#00b8d4' }}>
                        ₹{Math.round(5000 * settings.taxPercent / 100)}
                      </div>
                    </Col>
                    <Col md={3} className="mb-3">
                      <div className="text-muted small">Standard Service Fee</div>
                      <div className="fw-bold" style={{ fontSize: '20px', color: '#00b8d4' }}>
                        ₹{settings.serviceCharge}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </>
          )}
        </Container>
      </div>

      {/* ============ ADD USER MODAL ============ */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>👥 Add New User</Modal.Title></Modal.Header>
        <Form onSubmit={handleAddUser}>
          <Modal.Body>
            {userFormError && <Alert variant="danger">{userFormError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Username *</Form.Label>
              <Form.Control
                required
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                placeholder="e.g., advisor2"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                required
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="user@example.com"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password *</Form.Label>
              <Form.Control
                required
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="At least 6 characters"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Role *</Form.Label>
              <Form.Select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="CUSTOMER">Customer</option>
                <option value="SERVICE_ADVISOR">Service Advisor</option>
                <option value="TECHNICIAN">Technician</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="ADMIN">Administrator</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUserModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={userFormLoading}>
              {userFormLoading ? 'Creating...' : 'Create User →'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ============ SETTINGS MODAL ============ */}
      <Modal show={showSettingsModal} onHide={() => setShowSettingsModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>⚙️ System Settings</Modal.Title></Modal.Header>
        <Form onSubmit={handleSaveSettings}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Baseline Labor Rate (₹ / hour)</Form.Label>
              <Form.Control
                type="number"
                value={settings.laborRate}
                onChange={(e) => setSettings({ ...settings, laborRate: parseInt(e.target.value, 10) })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Standard Service Charge (₹)</Form.Label>
              <Form.Control
                type="number"
                value={settings.serviceCharge}
                onChange={(e) => setSettings({ ...settings, serviceCharge: parseInt(e.target.value, 10) })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tax Rate (GST %)</Form.Label>
              <Form.Control
                type="number"
                value={settings.taxPercent}
                onChange={(e) => setSettings({ ...settings, taxPercent: parseInt(e.target.value, 10) })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Parts Markup (%)</Form.Label>
              <Form.Control
                type="number"
                value={settings.partsMarkup}
                onChange={(e) => setSettings({ ...settings, partsMarkup: parseInt(e.target.value, 10) })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" className="fw-bold">💾 Save</Button>
          </Modal.Footer>
        </Form>
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

export default AdminDashboard;