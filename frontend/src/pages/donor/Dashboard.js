import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionsAPI, paymentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeSubscriptions: 0,
    totalDonated: 0,
    monthlyTotal: 0,
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [subsResponse, paymentsResponse] = await Promise.all([
        subscriptionsAPI.getAll({ status: 'ACTIVE', limit: 5 }),
        paymentsAPI.getAll({ status: 'SUCCESS', limit: 5 }),
      ]);

      const activeSubs = subsResponse.data.data.subscriptions;
      const payments = paymentsResponse.data.data.payments;

      // Calculate stats
      const monthlyTotal = activeSubs.reduce((sum, sub) => {
        const amount = parseFloat(sub.amount);
        switch (sub.interval) {
          case 'WEEKLY': return sum + (amount * 4);
          case 'MONTHLY': return sum + amount;
          case 'QUARTERLY': return sum + (amount / 3);
          case 'ANNUALLY': return sum + (amount / 12);
          default: return sum + amount;
        }
      }, 0);

      const totalDonated = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      setStats({
        activeSubscriptions: subsResponse.data.data.pagination.total,
        totalDonated,
        monthlyTotal,
      });
      setSubscriptions(activeSubs);
      setRecentPayments(payments);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="donor-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName}!</h1>
        <p>Here's an overview of your donations</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
            </svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Active Subscriptions</p>
            <p className="stat-value">{stats.activeSubscriptions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Donated</p>
            <p className="stat-value">{formatCurrency(stats.totalDonated)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Monthly Commitment</p>
            <p className="stat-value">{formatCurrency(stats.monthlyTotal)}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Active Subscriptions */}
        <div className="card">
          <div className="card-header">
            <h3>Active Subscriptions</h3>
            <Link to="/subscriptions" className="view-all">View All</Link>
          </div>
          {subscriptions.length === 0 ? (
            <div className="empty-state">
              <p>No active subscriptions</p>
              <Link to="/projects" className="btn btn-primary btn-sm">Browse Projects</Link>
            </div>
          ) : (
            <div className="subscription-list">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="subscription-item">
                  <div className="sub-info">
                    <p className="sub-project">{sub.project?.name}</p>
                    <p className="sub-interval">{sub.interval}</p>
                  </div>
                  <div className="sub-amount">{formatCurrency(sub.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Payments</h3>
            <Link to="/payments" className="view-all">View All</Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="empty-state">
              <p>No payments yet</p>
            </div>
          ) : (
            <div className="payment-list">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="payment-item">
                  <div className="payment-info">
                    <p className="payment-project">{payment.project?.name}</p>
                    <p className="payment-date">{formatDate(payment.paidAt)}</p>
                  </div>
                  <div className="payment-amount">{formatCurrency(payment.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <Link to="/projects" className="action-card">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Browse Projects</span>
          </Link>
          <Link to="/subscriptions" className="action-card">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
            <span>Manage Subscriptions</span>
          </Link>
          <Link to="/payments" className="action-card">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            <span>View Payment History</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
