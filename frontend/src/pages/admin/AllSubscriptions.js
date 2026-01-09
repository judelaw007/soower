import React, { useState, useEffect } from 'react';
import { subscriptionsAPI, projectsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AllSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', projectId: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [pagination.page, filter]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll({ limit: 100 });
      setProjects(response.data.data.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const params = { page: pagination.page, limit: 20 };
      if (filter.status) params.status = filter.status;
      if (filter.projectId) params.projectId = filter.projectId;

      const response = await subscriptionsAPI.getAllAdmin(params);
      setSubscriptions(response.data.data.subscriptions);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load subscriptions');
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
    <div className="all-subscriptions" style={{ maxWidth: '1100px' }}>
      <div className="page-header">
        <div>
          <h1>All Subscriptions</h1>
          <p>View all donor subscriptions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <select
          className="input"
          style={{ maxWidth: '200px' }}
          value={filter.status}
          onChange={(e) => {
            setFilter({ ...filter, status: e.target.value });
            setPagination({ ...pagination, page: 1 });
          }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>

        <select
          className="input"
          style={{ maxWidth: '250px' }}
          value={filter.projectId}
          onChange={(e) => {
            setFilter({ ...filter, projectId: e.target.value });
            setPagination({ ...pagination, page: 1 });
          }}
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {subscriptions.length === 0 ? (
        <div className="card empty-state">
          <h3>No subscriptions found</h3>
          <p>Subscriptions will appear here when donors subscribe to projects.</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Project</th>
                    <th>Amount</th>
                    <th>Interval</th>
                    <th>Next Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <div>
                          <p style={{ fontWeight: 500 }}>{sub.user?.firstName} {sub.user?.lastName}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{sub.user?.email}</p>
                        </div>
                      </td>
                      <td>{sub.project?.name}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(sub.amount)}</td>
                      <td>{sub.interval}</td>
                      <td>{sub.status === 'ACTIVE' ? formatDate(sub.nextPaymentDate) : '-'}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

export default AllSubscriptions;
