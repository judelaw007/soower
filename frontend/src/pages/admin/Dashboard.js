import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load dashboard</div>;
  }

  const { overview, recentPayments, recentDonors, projectStats } = stats;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of Soower platform</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid admin-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Donors</p>
            <p className="stat-value">{overview.totalDonors}</p>
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
            <p className="stat-label">Total Revenue</p>
            <p className="stat-value">{formatCurrency(overview.totalRevenue)}</p>
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
            <p className="stat-label">Monthly Revenue</p>
            <p className="stat-value">{formatCurrency(overview.monthlyRevenue)}</p>
            <p className={`stat-change ${overview.growthPercentage >= 0 ? 'positive' : 'negative'}`}>
              {overview.growthPercentage >= 0 ? '+' : ''}{overview.growthPercentage}% from last month
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
            </svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Active Subscriptions</p>
            <p className="stat-value">{overview.activeSubscriptions}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Payments */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Payments</h3>
            <Link to="/admin/payments" className="view-all">View All</Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="empty-state">No payments yet</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Project</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.user?.firstName} {payment.user?.lastName}</td>
                      <td>{payment.project?.name}</td>
                      <td className="amount">{formatCurrency(payment.amount)}</td>
                      <td>{formatDate(payment.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Donors */}
        <div className="card">
          <div className="card-header">
            <h3>New Donors</h3>
            <Link to="/admin/donors" className="view-all">View All</Link>
          </div>
          {recentDonors.length === 0 ? (
            <div className="empty-state">No donors yet</div>
          ) : (
            <div className="donors-list">
              {recentDonors.map((donor) => (
                <div key={donor.id} className="donor-item">
                  <div className="donor-avatar">
                    {donor.firstName[0]}{donor.lastName[0]}
                  </div>
                  <div className="donor-info">
                    <p className="donor-name">{donor.firstName} {donor.lastName}</p>
                    <p className="donor-email">{donor.email}</p>
                  </div>
                  <span className="donor-subs">{donor._count?.subscriptions || 0} subs</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Stats */}
        <div className="card full-width">
          <div className="card-header">
            <h3>Project Performance</h3>
            <Link to="/admin/projects" className="view-all">Manage Projects</Link>
          </div>
          {projectStats.length === 0 ? (
            <div className="empty-state">No projects yet</div>
          ) : (
            <div className="projects-stats-grid">
              {projectStats.map((project) => (
                <div key={project.id} className="project-stat-card">
                  <h4>{project.name}</h4>
                  <div className="project-stat-details">
                    <div className="project-stat-item">
                      <span className="label">Raised</span>
                      <span className="value">{formatCurrency(project.currentAmount)}</span>
                    </div>
                    {project.hasGoal && (
                      <div className="project-stat-item">
                        <span className="label">Goal</span>
                        <span className="value">{formatCurrency(project.goalAmount)}</span>
                      </div>
                    )}
                    <div className="project-stat-item">
                      <span className="label">Active Donors</span>
                      <span className="value">{project._count?.subscriptions || 0}</span>
                    </div>
                  </div>
                  {project.hasGoal && (
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(100, (parseFloat(project.currentAmount) / parseFloat(project.goalAmount)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
