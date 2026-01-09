import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './MySubscriptions.css';

const MySubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    fetchSubscriptions();
  }, [filter, pagination.page]);

  const fetchSubscriptions = async () => {
    try {
      const params = { page: pagination.page, limit: 10 };
      if (filter !== 'ALL') params.status = filter;

      const response = await subscriptionsAPI.getAll(params);
      setSubscriptions(response.data.data.subscriptions);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id) => {
    if (!window.confirm('Are you sure you want to pause this subscription?')) return;
    try {
      await subscriptionsAPI.pause(id);
      toast.success('Subscription paused');
      fetchSubscriptions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to pause subscription');
    }
  };

  const handleResume = async (id) => {
    try {
      await subscriptionsAPI.resume(id);
      toast.success('Subscription resumed');
      fetchSubscriptions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resume subscription');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this subscription? This cannot be undone.')) return;
    try {
      await subscriptionsAPI.cancel(id);
      toast.success('Subscription cancelled');
      fetchSubscriptions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
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

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'badge-success',
      PAUSED: 'badge-warning',
      CANCELLED: 'badge-danger',
      EXPIRED: 'badge-info',
    };
    return badges[status] || 'badge-info';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="subscriptions-page">
      <div className="page-header">
        <div>
          <h1>My Subscriptions</h1>
          <p>Manage your recurring donations</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          + New Subscription
        </Link>
      </div>

      {/* Filters */}
      <div className="filters">
        {['ALL', 'ACTIVE', 'PAUSED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => {
              setFilter(status);
              setPagination({ ...pagination, page: 1 });
            }}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {subscriptions.length === 0 ? (
        <div className="card empty-state">
          <h3>No subscriptions found</h3>
          <p>Start supporting projects with recurring donations.</p>
          <Link to="/projects" className="btn btn-primary">Browse Projects</Link>
        </div>
      ) : (
        <>
          <div className="subscriptions-list">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="subscription-card card">
                <div className="sub-header">
                  <h3>{sub.project?.name}</h3>
                  <span className={`badge ${getStatusBadge(sub.status)}`}>{sub.status}</span>
                </div>

                <div className="sub-details">
                  <div className="sub-detail">
                    <span className="label">Amount</span>
                    <span className="value">{formatCurrency(sub.amount)}</span>
                  </div>
                  <div className="sub-detail">
                    <span className="label">Frequency</span>
                    <span className="value">{sub.interval}</span>
                  </div>
                  <div className="sub-detail">
                    <span className="label">Next Payment</span>
                    <span className="value">
                      {sub.status === 'ACTIVE' ? formatDate(sub.nextPaymentDate) : '-'}
                    </span>
                  </div>
                  <div className="sub-detail">
                    <span className="label">Started</span>
                    <span className="value">{formatDate(sub.startDate)}</span>
                  </div>
                </div>

                <div className="sub-actions">
                  {sub.status === 'ACTIVE' && (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => handlePause(sub.id)}>
                        Pause
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(sub.id)}>
                        Cancel
                      </button>
                    </>
                  )}
                  {sub.status === 'PAUSED' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => handleResume(sub.id)}>
                        Resume
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(sub.id)}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MySubscriptions;
