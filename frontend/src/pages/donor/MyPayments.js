import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../../services/api';
import './MyPayments.css';

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    fetchPayments();
  }, [filter, pagination.page]);

  const fetchPayments = async () => {
    try {
      const params = { page: pagination.page, limit: 20 };
      if (filter !== 'ALL') params.status = filter;

      const response = await paymentsAPI.getAll(params);
      setPayments(response.data.data.payments);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to load payments:', error);
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
    <div className="payments-page">
      <div className="page-header">
        <div>
          <h1>Payment History</h1>
          <p>View all your past payments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        {['ALL', 'SUCCESS', 'PENDING', 'FAILED'].map((status) => (
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

      {payments.length === 0 ? (
        <div className="card empty-state">
          <h3>No payments found</h3>
          <p>Your payment history will appear here.</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
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
                      <td>{payment.project?.name}</td>
                      <td className="amount">{formatCurrency(payment.amount)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>{payment.paidAt ? formatDate(payment.paidAt) : '-'}</td>
                      <td className="reference">{payment.paystackReference || '-'}</td>
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

export default MyPayments;
