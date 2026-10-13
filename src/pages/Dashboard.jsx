import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import CustomerDashboard from './dashboards/CustomerDashboard';
import AdvisorDashboard from './dashboards/AdvisorDashboard';
import TechnicianDashboard from './dashboards/TechnicianDashboard';
import InventoryDashboard from './dashboards/InventoryDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  switch (user.role) {
    case 'CUSTOMER':
      return <CustomerDashboard />;
    case 'SERVICE_ADVISOR':
      return <AdvisorDashboard />;
    case 'TECHNICIAN':
      return <TechnicianDashboard />;
    case 'INVENTORY_MANAGER':
      return <InventoryDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <Navigate to="/" replace />;
  }
};

export default Dashboard;