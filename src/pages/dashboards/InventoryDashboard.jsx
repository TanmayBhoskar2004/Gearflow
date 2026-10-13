import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Card, Badge, Spinner, Alert,
  Button, Modal, Form, Table, ProgressBar, Dropdown, Tabs, Tab,
} from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const InventoryDashboard = () => {
  const { user } = useAuth();

  // -------- State --------
  const [stats, setStats] = useState(null);
  const [parts, setParts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Modals
  const [showAddPart, setShowAddPart] = useState(false);
  const [showEditPart, setShowEditPart] = useState(false);
  const [showStockIn, setShowStockIn] = useState(false);
  const [showPurchaseOrder, setShowPurchaseOrder] = useState(false);
  const [showReorderSettings, setShowReorderSettings] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);

  // Add/Edit Part Form
  const [partForm, setPartForm] = useState({
    name: '',
    brand: '',
    unitPrice: '',
    warrantyMonths: '',
    stockQuantity: 0,
    location: '',
    minStock: 5,
    maxStock: 100,
    category: 'Spare Part',
  });
  const [partFormError, setPartFormError] = useState('');
  const [partFormLoading, setPartFormLoading] = useState(false);

  // Stock-In Form
  const [stockInForm, setStockInForm] = useState({
    partId: '',
    quantity: 10,
    note: 'Purchase from supplier',
  });

  // Purchase Order Form
  const [poForm, setPoForm] = useState({
    vendor: '',
    partId: '',
    quantity: 50,
    unitPrice: '',
    expectedDelivery: '',
    notes: '',
  });
  const [purchaseOrders, setPurchaseOrders] = useState([
    {
      id: 'PO-1001',
      vendor: 'Bosch Auto Parts Ltd.',
      partName: 'Brake Pad',
      quantity: 50,
      unitPrice: 2500,
      total: 125000,
      status: 'IN_TRANSIT',
      expectedDelivery: '2026-10-20',
      createdDate: '2026-10-10',
    },
    {
      id: 'PO-1002',
      vendor: 'MRF Tyres Pvt. Ltd.',
      partName: 'Engine Oil Filter',
      quantity: 100,
      unitPrice: 800,
      total: 80000,
      status: 'DELIVERED',
      expectedDelivery: '2026-10-08',
      createdDate: '2026-10-05',
    },
  ]);

  // -------- Fetch --------
  const fetchData = async () => {
    try {
      const [statsRes, partsRes, txRes, lowStockRes, notifRes] = await Promise.all([
        api.get('/dashboard/inventory').catch(() => ({ data: null })),
        api.get('/parts/all').catch(() => ({ data: [] })),
        api.get('/inventory/transactions').catch(() => ({ data: [] })),
        api.get('/parts/low-stock?threshold=5').catch(() => ({ data: [] })),
        api.get('/notifications/my').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setParts(partsRes.data || []);
      setTransactions(txRes.data || []);
      setLowStock(lowStockRes.data || []);
      setNotifications(notifRes.data || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // -------- Handlers --------
  const handleAddPart = async (e) => {
    e.preventDefault();
    setPartFormError('');
    setPartFormLoading(true);
    try {
      await api.post('/parts', {
        name: partForm.name,
        brand: partForm.brand,
        unitPrice: parseFloat(partForm.unitPrice),
        warrantyMonths: parseInt(partForm.warrantyMonths, 10) || 0,
        stockQuantity: parseInt(partForm.stockQuantity, 10) || 0,
      });
      setShowAddPart(false);
      resetPartForm();
      fetchData();
    } catch (err) {
      setPartFormError(err.response?.data?.message || 'Failed to add part');
    } finally {
      setPartFormLoading(false);
    }
  };

  const handleEditPart = async (e) => {
    e.preventDefault();
    setPartFormError('');
    setPartFormLoading(true);
    try {
      await api.put(`/parts/${selectedPart.id}`, {
        name: partForm.name,
        brand: partForm.brand,
        unitPrice: parseFloat(partForm.unitPrice),
        warrantyMonths: parseInt(partForm.warrantyMonths, 10) || 0,
        stockQuantity: parseInt(partForm.stockQuantity, 10) || 0,
      });
      setShowEditPart(false);
      setSelectedPart(null);
      resetPartForm();
      fetchData();
    } catch (err) {
      setPartFormError(err.response?.data?.message || 'Failed to update part');
    } finally {
      setPartFormLoading(false);
    }
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/stock-in', {
        partId: parseInt(stockInForm.partId, 10),
        quantity: parseInt(stockInForm.quantity, 10),
        note: stockInForm.note,
      });
      setShowStockIn(false);
      setStockInForm({ partId: '', quantity: 10, note: 'Purchase from supplier' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add stock');
    }
  };

  const handleCreatePO = (e) => {
    e.preventDefault();
    const part = parts.find((p) => p.id === parseInt(poForm.partId, 10));
    const newPO = {
      id: 'PO-' + (1000 + purchaseOrders.length + 1),
      vendor: poForm.vendor,
      partName: part?.name || 'Unknown',
      quantity: parseInt(poForm.quantity, 10),
      unitPrice: parseFloat(poForm.unitPrice) || part?.unitPrice || 0,
      total: (parseInt(poForm.quantity, 10) * (parseFloat(poForm.unitPrice) || part?.unitPrice || 0)),
      status: 'PENDING',
      expectedDelivery: poForm.expectedDelivery,
      createdDate: new Date().toISOString().split('T')[0],
    };
    setPurchaseOrders([newPO, ...purchaseOrders]);
    setShowPurchaseOrder(false);
    setPoForm({ vendor: '', partId: '', quantity: 50, unitPrice: '', expectedDelivery: '', notes: '' });
  };

  const handleMarkPOReceived = (poId) => {
    setPurchaseOrders(
      purchaseOrders.map((po) =>
        po.id === poId ? { ...po, status: 'DELIVERED' } : po
      )
    );
  };

  const openEditPart = (part) => {
    setSelectedPart(part);
    setPartForm({
      name: part.name,
      brand: part.brand,
      unitPrice: part.unitPrice,
      warrantyMonths: part.warrantyMonths,
      stockQuantity: part.stockQuantity,
      location: `A-${part.id}`,
      minStock: 5,
      maxStock: 100,
      category: 'Spare Part',
    });
    setShowEditPart(true);
  };

  const resetPartForm = () => {
    setPartForm({
      name: '',
      brand: '',
      unitPrice: '',
      warrantyMonths: '',
      stockQuantity: 0,
      location: '',
      minStock: 5,
      maxStock: 100,
      category: 'Spare Part',
    });
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

  // -------- Derived --------
  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredParts = parts.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  const criticalStock = parts.filter((p) => p.stockQuantity < 5).length;

  // -------- Loading --------
  if (loading) {
    return (
      <div style={pageStyle}>
        <Container className="text-center" style={{ paddingTop: '200px' }}>
          <Spinner animation="border" variant="info" />
          <p className="mt-3 text-white">Loading inventory dashboard...</p>
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
        @keyframes pulseWarn {
          0%, 100% { box-shadow: 0 0 0 0 rgba(231,76,60,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(231,76,60,0); }
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

        /* Stock row */
        .stock-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-radius: 12px;
          background: white;
          margin-bottom: 8px;
          border-left: 4px solid #00b8d4;
          transition: all 0.2s ease;
        }
        .stock-row:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 16px rgba(0,184,212,0.15);
        }
        .stock-row.critical { border-left-color: #e74c3c; animation: pulseWarn 2s ease-in-out infinite; }
        .stock-row.low { border-left-color: #f39c12; }
        .stock-row.ok { border-left-color: #27ae60; }

        /* Alert card */
        .alert-card {
          border-radius: 14px;
          padding: 16px;
          background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
          border: 2px solid #e74c3c;
          margin-bottom: 12px;
        }
        .alert-card.warning {
          background: linear-gradient(135deg, #fffbf0 0%, #fff5d6 100%);
          border-color: #f39c12;
        }
        .alert-card.info {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-color: #00b8d4;
        }

        /* PO Card */
        .po-card {
          border-radius: 12px;
          background: white;
          padding: 16px;
          margin-bottom: 12px;
          border-left: 4px solid #00b8d4;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .po-card.pending { border-left-color: #f39c12; }
        .po-card.in_transit { border-left-color: #00b8d4; }
        .po-card.delivered { border-left-color: #27ae60; }
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
              <h2 className="fw-bold text-white mb-1">Welcome, {user.username}! 📦</h2>
              <Badge
                style={{
                  background: 'linear-gradient(135deg, #00b8d4, #0097a7)',
                  padding: '8px 16px',
                  fontSize: '13px',
                }}
              >
                INVENTORY MANAGER PORTAL
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
              <Button variant="outline-light" onClick={() => setShowPurchaseOrder(true)} style={glassBtn}>
                🧾 New Purchase Order
              </Button>
              <Button variant="outline-light" onClick={() => setShowStockIn(true)} style={glassBtn}>
                📥 Stock-In
              </Button>
              <Button
                variant="info"
                className="fw-bold"
                onClick={() => {
                  resetPartForm();
                  setShowAddPart(true);
                }}
                style={{ boxShadow: '0 8px 24px rgba(0,184,212,0.4)' }}
              >
                + Add Part
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* STATS */}
          <Row className="mb-4 g-3">
            {[
              { icon: '📦', label: 'Unique Parts', value: stats?.totalParts ?? parts.length },
              { icon: '🔢', label: 'Total Stock Units', value: stats?.totalStockQuantity ?? 0 },
              { icon: '💵', label: 'Inventory Value', value: `₹${(stats?.totalInventoryValue ?? 0).toLocaleString()}` },
              { icon: '⚠️', label: 'Critical Stock', value: criticalStock, danger: criticalStock > 0 },
            ].map((s, i) => (
              <Col md={6} lg={3} key={i}>
                <Card className="border-0 h-100" style={glassCard}>
                  <Card.Body>
                    <div style={{ fontSize: '32px' }}>{s.icon}</div>
                    <div
                      className="fw-bold mt-2"
                      style={{ fontSize: '28px', color: s.danger ? '#e74c3c' : '#00b8d4' }}
                    >
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
            <Tab eventKey="stock" title="📦 Stock Directory" />
            <Tab eventKey="alerts" title="⚠️ Alerts & Reorder" />
            <Tab eventKey="po" title="🧾 Purchase Orders" />
            <Tab eventKey="tx" title="📜 Transaction Log" />
          </Tabs>

          {/* ============ TAB 1: STOCK DIRECTORY ============ */}
          {activeTab === 'stock' && (
            <>
              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Body>
                  {/* Search + filters */}
                  <Row className="mb-3 g-2">
                    <Col md={6}>
                      <Form.Control
                        placeholder="🔍 Search by part name or brand..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <option value="ALL">All Categories</option>
                        <option value="Spare Part">Spare Parts</option>
                        <option value="Fluid">Fluids</option>
                        <option value="Consumable">Consumables</option>
                      </Form.Select>
                    </Col>
                    <Col md={3} className="text-end">
                      <Badge bg="info" style={{ padding: '10px 14px' }}>
                        {filteredParts.length} item(s)
                      </Badge>
                    </Col>
                  </Row>

                  {/* Stock rows */}
                  {filteredParts.length === 0 ? (
                    <p className="text-muted mb-0 text-center py-5">
                      No parts found. Try a different search or click <strong>+ Add Part</strong>.
                    </p>
                  ) : (
                    filteredParts.map((p) => {
                      const isCritical = p.stockQuantity < 5;
                      const isLow = p.stockQuantity >= 5 && p.stockQuantity < 15;
                      const rowClass = isCritical ? 'critical' : isLow ? 'low' : 'ok';
                      const pct = Math.min((p.stockQuantity / 100) * 100, 100);

                      return (
                        <div className={`stock-row ${rowClass}`} key={p.id}>
                          <div className="d-flex align-items-center gap-3 flex-grow-1">
                            <div>
                              <div className="fw-bold" style={{ color: '#2c3e50', fontSize: '15px' }}>
                                {p.name}
                                <span className="text-muted ms-2">({p.brand})</span>
                              </div>
                              <div className="text-muted small">
                                📍 Bin A-{p.id} · Warranty: {p.warrantyMonths} mo
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-4">
                            <div style={{ minWidth: '120px' }}>
                              <div className="text-muted small">Stock level</div>
                              <ProgressBar
                                now={pct}
                                variant={isCritical ? 'danger' : isLow ? 'warning' : 'success'}
                                style={{ height: '6px' }}
                              />
                              <div className="text-muted small mt-1">
                                {p.stockQuantity} / 100
                              </div>
                            </div>

                            <div className="text-end" style={{ minWidth: '80px' }}>
                              <div className="fw-bold" style={{ color: '#00b8d4' }}>
                                ₹{p.unitPrice}
                              </div>
                              <div className="text-muted small">per unit</div>
                            </div>

                            <Badge bg={isCritical ? 'danger' : isLow ? 'warning' : 'success'}>
                              {isCritical ? '⚠️ Critical' : isLow ? 'Low' : 'In Stock'}
                            </Badge>

                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => openEditPart(p)}
                            >
                              ✏️ Edit
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </Card.Body>
              </Card>
            </>
          )}

          {/* ============ TAB 2: ALERTS & REORDER ============ */}
          {activeTab === 'alerts' && (
            <>
              <h4 className="fw-bold text-white mb-3">⚠️ Automated Alerts & Reorder Points</h4>

              {/* Critical alerts */}
              {criticalStock > 0 && (
                <>
                  <h6 className="fw-bold text-white mb-2">
                    🚨 Critical Stock ({criticalStock})
                  </h6>
                  {parts.filter((p) => p.stockQuantity < 5).map((p) => (
                    <div className="alert-card" key={p.id}>
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                          <div className="fw-bold" style={{ color: '#c0392b', fontSize: '16px' }}>
                            ⚠️ {p.name} <span className="text-muted">({p.brand})</span>
                          </div>
                          <div className="text-muted small mt-1">
                            Only <strong>{p.stockQuantity}</strong> unit(s) left · Reorder point: <strong>5</strong>
                          </div>
                          <div className="text-muted small">
                            Recommendation: Order at least <strong>{50 - p.stockQuantity}</strong> units to reach max stock
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setPoForm({ ...poForm, partId: String(p.id), quantity: 50 });
                            setShowPurchaseOrder(true);
                          }}
                        >
                          🧾 Create PO Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Low stock */}
              {parts.filter((p) => p.stockQuantity >= 5 && p.stockQuantity < 15).length > 0 && (
                <>
                  <h6 className="fw-bold text-white mb-2 mt-4">
                    ⚡ Low Stock
                  </h6>
                  {parts.filter((p) => p.stockQuantity >= 5 && p.stockQuantity < 15).map((p) => (
                    <div className="alert-card warning" key={p.id}>
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                          <div className="fw-bold" style={{ color: '#b9770e', fontSize: '16px' }}>
                            ⚡ {p.name} <span className="text-muted">({p.brand})</span>
                          </div>
                          <div className="text-muted small mt-1">
                            Stock: <strong>{p.stockQuantity}</strong> unit(s) · Monitor closely
                          </div>
                        </div>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => {
                            setPoForm({ ...poForm, partId: String(p.id), quantity: 30 });
                            setShowPurchaseOrder(true);
                          }}
                        >
                          Reorder →
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {criticalStock === 0 && parts.filter((p) => p.stockQuantity < 15).length === 0 && (
                <div className="alert-card info">
                  <div className="text-center">
                    <div style={{ fontSize: '48px' }}>✅</div>
                    <div className="fw-bold mt-2" style={{ color: '#2c3e50' }}>All Stock Levels Healthy</div>
                    <div className="text-muted small">
                      No items are below reorder thresholds. Great job!
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============ TAB 3: PURCHASE ORDERS ============ */}
          {activeTab === 'po' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 className="fw-bold text-white mb-0">🧾 Vendor Purchase Orders</h4>
                <Button
                  variant="info"
                  className="fw-bold"
                  onClick={() => setShowPurchaseOrder(true)}
                >
                  + Create PO
                </Button>
              </div>

              {purchaseOrders.length === 0 ? (
                <Card className="border-0 text-center p-5" style={glassCard}>
                  <p className="text-muted mb-0">No purchase orders yet.</p>
                </Card>
              ) : (
                purchaseOrders.map((po) => (
                  <div className={`po-card ${po.status.toLowerCase()}`} key={po.id}>
                    <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                      <div>
                        <div className="fw-bold" style={{ color: '#2c3e50', fontSize: '16px' }}>
                          {po.id} — {po.partName}
                        </div>
                        <div className="text-muted small">
                          🏢 {po.vendor} · Created: {po.createdDate}
                        </div>
                      </div>
                      <Badge
                        bg={
                          po.status === 'DELIVERED'
                            ? 'success'
                            : po.status === 'IN_TRANSIT'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {po.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="d-flex gap-4 flex-wrap mb-3">
                      <div>
                        <div className="text-muted small">Quantity</div>
                        <div className="fw-bold">{po.quantity} units</div>
                      </div>
                      <div>
                        <div className="text-muted small">Unit Price</div>
                        <div className="fw-bold">₹{po.unitPrice}</div>
                      </div>
                      <div>
                        <div className="text-muted small">Total Value</div>
                        <div className="fw-bold" style={{ color: '#00b8d4' }}>
                          ₹{po.total?.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted small">Expected Delivery</div>
                        <div className="fw-bold">{po.expectedDelivery || '—'}</div>
                      </div>
                    </div>

                    {po.status !== 'DELIVERED' && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleMarkPOReceived(po.id)}
                      >
                        📥 Mark as Received (Log Inward)
                      </Button>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* ============ TAB 4: TRANSACTION LOG ============ */}
          {activeTab === 'tx' && (
            <>
              <h4 className="fw-bold text-white mb-3">📜 Inventory Transaction Log</h4>
              <Card className="border-0 mb-4" style={glassCard}>
                <Card.Body>
                  {transactions.length === 0 ? (
                    <p className="text-muted mb-0 text-center py-4">
                      No transactions yet.
                    </p>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr style={{ color: '#546e7a' }}>
                          <th>ID</th>
                          <th>Part</th>
                          <th>Type</th>
                          <th>Change</th>
                          <th>Job Ref</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id}>
                            <td>#{tx.id}</td>
                            <td>{tx.partName}</td>
                            <td>
                              <Badge
                                bg={
                                  tx.transactionType === 'PURCHASE'
                                    ? 'success'
                                    : tx.transactionType === 'ISSUE'
                                    ? 'info'
                                    : 'secondary'
                                }
                              >
                                {tx.transactionType}
                              </Badge>
                            </td>
                            <td>
                              <span
                                style={{
                                  color: tx.quantityChange > 0 ? '#27ae60' : '#e74c3c',
                                  fontWeight: 700,
                                }}
                              >
                                {tx.quantityChange > 0 ? '+' : ''}
                                {tx.quantityChange}
                              </span>
                            </td>
                            <td>{tx.jobCardId ? `#${tx.jobCardId}` : '—'}</td>
                            <td>{new Date(tx.transactionDate).toLocaleString()}</td>
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

      {/* ============ ADD PART MODAL ============ */}
      <Modal show={showAddPart} onHide={() => setShowAddPart(false)} centered>
        <Modal.Header closeButton><Modal.Title>➕ Add New Part</Modal.Title></Modal.Header>
        <Form onSubmit={handleAddPart}>
          <Modal.Body>
            {partFormError && <Alert variant="danger">{partFormError}</Alert>}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Part Name *</Form.Label>
                  <Form.Control
                    required
                    value={partForm.name}
                    onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                    placeholder="Brake Pad"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Brand *</Form.Label>
                  <Form.Control
                    required
                    value={partForm.brand}
                    onChange={(e) => setPartForm({ ...partForm, brand: e.target.value })}
                    placeholder="Bosch"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit Price (₹) *</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    value={partForm.unitPrice}
                    onChange={(e) => setPartForm({ ...partForm, unitPrice: e.target.value })}
                    placeholder="2500"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Warranty (months)</Form.Label>
                  <Form.Control
                    type="number"
                    value={partForm.warrantyMonths}
                    onChange={(e) => setPartForm({ ...partForm, warrantyMonths: e.target.value })}
                    placeholder="12"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Initial Stock</Form.Label>
                  <Form.Control
                    type="number"
                    value={partForm.stockQuantity}
                    onChange={(e) => setPartForm({ ...partForm, stockQuantity: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bin Location</Form.Label>
                  <Form.Control
                    value={partForm.location}
                    onChange={(e) => setPartForm({ ...partForm, location: e.target.value })}
                    placeholder="A-12"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Min Stock</Form.Label>
                  <Form.Control
                    type="number"
                    value={partForm.minStock}
                    onChange={(e) => setPartForm({ ...partForm, minStock: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Stock</Form.Label>
                  <Form.Control
                    type="number"
                    value={partForm.maxStock}
                    onChange={(e) => setPartForm({ ...partForm, maxStock: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group>
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={partForm.category}
                onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
              >
                <option>Spare Part</option>
                <option>Fluid</option>
                <option>Consumable</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddPart(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={partFormLoading}>
              {partFormLoading ? 'Saving...' : 'Add Part →'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ============ EDIT PART MODAL ============ */}
      <Modal show={showEditPart} onHide={() => setShowEditPart(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>✏️ Edit Part — {selectedPart?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditPart}>
          <Modal.Body>
            {partFormError && <Alert variant="danger">{partFormError}</Alert>}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Part Name *</Form.Label>
                  <Form.Control
                    required
                    value={partForm.name}
                    onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Brand *</Form.Label>
                  <Form.Control
                    required
                    value={partForm.brand}
                    onChange={(e) => setPartForm({ ...partForm, brand: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit Price (₹) *</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    value={partForm.unitPrice}
                    onChange={(e) => setPartForm({ ...partForm, unitPrice: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Warranty (months)</Form.Label>
                  <Form.Control
                    type="number"
                    value={partForm.warrantyMonths}
                    onChange={(e) => setPartForm({ ...partForm, warrantyMonths: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Alert variant="info">
              <strong>Note:</strong> Stock quantity can only be modified via Stock-In or PO receipt to maintain an audit trail.
              Current stock: <strong>{selectedPart?.stockQuantity}</strong>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditPart(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={partFormLoading}>
              {partFormLoading ? 'Saving...' : 'Save Changes →'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ============ STOCK-IN MODAL ============ */}
      <Modal show={showStockIn} onHide={() => setShowStockIn(false)} centered>
        <Modal.Header closeButton><Modal.Title>📥 Record Stock-In</Modal.Title></Modal.Header>
        <Form onSubmit={handleStockIn}>
          <Modal.Body>
            <Alert variant="info">
              Log incoming stock from a vendor shipment. This increases the part's quantity and creates a purchase transaction.
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>Part *</Form.Label>
              <Form.Select
                required
                value={stockInForm.partId}
                onChange={(e) => setStockInForm({ ...stockInForm, partId: e.target.value })}
              >
                <option value="">-- Select a part --</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.brand}) — Current stock: {p.stockQuantity}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantity Received *</Form.Label>
              <Form.Control
                required
                type="number"
                min="1"
                value={stockInForm.quantity}
                onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Note / Reference</Form.Label>
              <Form.Control
                value={stockInForm.note}
                onChange={(e) => setStockInForm({ ...stockInForm, note: e.target.value })}
                placeholder="e.g., PO-1001 from Bosch"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStockIn(false)}>Cancel</Button>
            <Button variant="info" type="submit" className="fw-bold">
              📥 Add Stock →
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ============ PURCHASE ORDER MODAL ============ */}
      <Modal show={showPurchaseOrder} onHide={() => setShowPurchaseOrder(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>🧾 Create Vendor Purchase Order</Modal.Title></Modal.Header>
        <Form onSubmit={handleCreatePO}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Vendor Name *</Form.Label>
              <Form.Control
                required
                value={poForm.vendor}
                onChange={(e) => setPoForm({ ...poForm, vendor: e.target.value })}
                placeholder="e.g., Bosch Auto Parts Ltd."
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Part *</Form.Label>
                  <Form.Select
                    required
                    value={poForm.partId}
                    onChange={(e) => {
                      const part = parts.find((p) => p.id === parseInt(e.target.value, 10));
                      setPoForm({
                        ...poForm,
                        partId: e.target.value,
                        unitPrice: part?.unitPrice || '',
                      });
                    }}
                  >
                    <option value="">-- Select a part --</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.brand}) — Stock: {p.stockQuantity}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity *</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    min="1"
                    value={poForm.quantity}
                    onChange={(e) => setPoForm({ ...poForm, quantity: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={poForm.unitPrice}
                    onChange={(e) => setPoForm({ ...poForm, unitPrice: e.target.value })}
                    placeholder="Auto-filled from part"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expected Delivery</Form.Label>
                  <Form.Control
                    type="date"
                    value={poForm.expectedDelivery}
                    onChange={(e) => setPoForm({ ...poForm, expectedDelivery: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group>
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={poForm.notes}
                onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                placeholder="Any special instructions..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPurchaseOrder(false)}>Cancel</Button>
            <Button variant="info" type="submit" className="fw-bold">
              🧾 Create PO →
            </Button>
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

export default InventoryDashboard;