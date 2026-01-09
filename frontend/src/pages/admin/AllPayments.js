import React, { useState, useEffect } from 'react';
import { paymentsAPI, projectsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AllPayments = () => {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', projectId: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, filter]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll({ limit: 100 });
      setProjects(response.data.data.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const params = { page: pagination.page, limit: 20 };
      if (filter.status) params.status = filter.status;
      if (filter.projectId) params.projectId = filter.projectId;

      const response = await paymentsAPI.getAllAdmin(params);
      setPayments(response.data.data.payments);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load payments');
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      SUCCESS: 'badge-success',
      PENDING: 'badge-warning',
      FAILED: 'badge-danger',
      REFUNDED: 'badge-info',
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
    <div className="all-payments" style={{ maxWidth: '1100px' }}>
      <div className="page-header">
        <div>
          <h1>All Payments</h1>
          <p>View all payment transactions</p>
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
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
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

      {payments.length === 0 ? (
        <div className="card empty-state">
          <h3>No payments found</h3>
          <p>Payments will appear here when donors make transactions.</p>
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
                    <th>Status</th>
                    <th>Date</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <div>
                          <p style={{ fontWeight: 500 }}>{payment.user?.firstName} {payment.user?.lastName}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{payment.user?.email}</p>
                        </div>
                      </td>
                      <td>{payment.project?.name}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(payment.amount)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>{payment.paidAt ? formatDate(payment.paidAt) : '-'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {payment.paystackReference || '-'}
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

export default AllPayments;
