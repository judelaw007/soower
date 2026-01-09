import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './ManageDonors.css';

const ManageDonors = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [donorDetails, setDonorDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchDonors();
  }, [pagination.page, search]);

  const fetchDonors = async () => {
    try {
      const params = { page: pagination.page, limit: 20 };
      if (search) params.search = search;

      const response = await adminAPI.getDonors(params);
      setDonors(response.data.data.donors);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to load donors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonorDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const response = await adminAPI.getDonorDetails(id);
      setDonorDetails(response.data.data.donor);
    } catch (error) {
      toast.error('Failed to load donor details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDonor = (donor) => {
    setSelectedDonor(donor);
    fetchDonorDetails(donor.id);
  };

  const handleToggleStatus = async (id) => {
    try {
      await adminAPI.toggleDonorStatus(id);
      toast.success('Donor status updated');
      fetchDonors();
      if (selectedDonor?.id === id) {
        fetchDonorDetails(id);
      }
    } catch (error) {
      toast.error('Failed to update donor status');
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="manage-donors">
      <div className="page-header">
        <div>
          <h1>Manage Donors</h1>
          <p>View and manage registered donors</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          className="input"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="donors-layout">
        {/* Donors List */}
        <div className="card donors-list-card">
          {donors.length === 0 ? (
            <div className="empty-state">
              <h3>No donors found</h3>
              <p>Donors will appear here when they register.</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Donor</th>
                      <th>Subscriptions</th>
                      <th>Total Donated</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donors.map((donor) => (
                      <tr
                        key={donor.id}
                        className={selectedDonor?.id === donor.id ? 'selected' : ''}
                      >
                        <td>
                          <div className="donor-cell">
                            <div className="donor-avatar">
                              {donor.firstName[0]}{donor.lastName[0]}
                            </div>
                            <div>
                              <p className="donor-name">{donor.firstName} {donor.lastName}</p>
                              <p className="donor-email">{donor.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>{donor._count?.subscriptions || 0}</td>
                        <td>{formatCurrency(donor.totalDonated)}</td>
                        <td>
                          <span className={`badge ${donor.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {donor.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewDonor(donor)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

        {/* Donor Details Panel */}
        {selectedDonor && (
          <div className="card donor-details-card">
            <div className="details-header">
              <h3>Donor Details</h3>
              <button className="close-btn" onClick={() => setSelectedDonor(null)}>
                &times;
              </button>
            </div>

            {detailsLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : donorDetails ? (
              <div className="details-content">
                <div className="donor-profile">
                  <div className="donor-avatar large">
                    {donorDetails.firstName[0]}{donorDetails.lastName[0]}
                  </div>
                  <h4>{donorDetails.firstName} {donorDetails.lastName}</h4>
                  <p>{donorDetails.email}</p>
                  {donorDetails.phone && <p>{donorDetails.phone}</p>}
                </div>

                <div className="details-stats">
                  <div className="detail-stat">
                    <span className="label">Total Donated</span>
                    <span className="value">{formatCurrency(donorDetails.totalDonated)}</span>
                  </div>
                  <div className="detail-stat">
                    <span className="label">Member Since</span>
                    <span className="value">{formatDate(donorDetails.createdAt)}</span>
                  </div>
                </div>

                <div className="details-section">
                  <h5>Subscriptions</h5>
                  {donorDetails.subscriptions?.length === 0 ? (
                    <p className="empty-text">No subscriptions</p>
                  ) : (
                    <div className="mini-list">
                      {donorDetails.subscriptions?.map((sub) => (
                        <div key={sub.id} className="mini-item">
                          <span>{sub.project?.name}</span>
                          <span className={`badge badge-${sub.status === 'ACTIVE' ? 'success' : 'warning'}`}>
                            {sub.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="details-actions">
                  <button
                    className={`btn btn-block ${donorDetails.isActive ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => handleToggleStatus(donorDetails.id)}
                  >
                    {donorDetails.isActive ? 'Deactivate Donor' : 'Activate Donor'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageDonors;
