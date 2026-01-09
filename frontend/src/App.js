import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import DonorLayout from './components/layouts/DonorLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import PaymentCallback from './pages/PaymentCallback';

// Donor Pages
import DonorDashboard from './pages/donor/Dashboard';
import MySubscriptions from './pages/donor/MySubscriptions';
import MyPayments from './pages/donor/MyPayments';
import Profile from './pages/donor/Profile';
import Notifications from './pages/donor/Notifications';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageProjects from './pages/admin/ManageProjects';
import ManageDonors from './pages/admin/ManageDonors';
import AllSubscriptions from './pages/admin/AllSubscriptions';
import AllPayments from './pages/admin/AllPayments';
import Analytics from './pages/admin/Analytics';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetails />} />
      <Route path="/payment/callback" element={<PaymentCallback />} />

      {/* Donor Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="DONOR">
            <DonorLayout>
              <DonorDashboard />
            </DonorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <ProtectedRoute requiredRole="DONOR">
            <DonorLayout>
              <MySubscriptions />
            </DonorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute requiredRole="DONOR">
            <DonorLayout>
              <MyPayments />
            </DonorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DonorLayout>
              <Profile />
            </DonorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <DonorLayout>
              <Notifications />
            </DonorLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
              <ManageProjects />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/donors"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
              <ManageDonors />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subscriptions"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
              <AllSubscriptions />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
              <AllPayments />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
              <Analytics />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
