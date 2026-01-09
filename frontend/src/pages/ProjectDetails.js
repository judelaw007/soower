import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, subscriptionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/layouts/Navbar';
import './ProjectDetails.css';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationData, setDonationData] = useState({
    amount: '',
    interval: 'MONTHLY',
    customIntervalDays: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await projectsAPI.getOne(id);
      setProject(response.data.data.project);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
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

  const calculateProgress = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(100, (parseFloat(current) / parseFloat(goal)) * 100);
  };

  const handleDonateClick = () => {
    if (!user) {
      toast('Please login to donate', { icon: 'info' });
      navigate('/login');
      return;
    }
    setShowDonateModal(true);
  };

  const handleSubmitDonation = async (e) => {
    e.preventDefault();

    if (!donationData.amount || parseFloat(donationData.amount) < 100) {
      toast.error('Minimum donation amount is ₦100');
      return;
    }

    if (donationData.interval === 'CUSTOM' && !donationData.customIntervalDays) {
      toast.error('Please specify custom interval days');
      return;
    }

    setSubmitting(true);
    try {
      const response = await subscriptionsAPI.create({
        projectId: id,
        amount: parseFloat(donationData.amount),
        interval: donationData.interval,
        customIntervalDays: donationData.interval === 'CUSTOM' ? parseInt(donationData.customIntervalDays) : undefined,
      });

      // Redirect to Paystack payment page
      window.location.href = response.data.data.paymentUrl;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="project-details-page">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="project-details-page">
      <Navbar />

      <div className="container project-details-container">
        <div className="project-details-grid">
          <div className="project-main">
            <div className="project-image-large">
              {project.imageUrl ? (
                <img src={project.imageUrl} alt={project.name} />
              ) : (
                <div className="project-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
              )}
            </div>

            <div className="project-info">
              <h1>{project.name}</h1>
              <p className="project-full-description">{project.description}</p>
            </div>
          </div>

          <div className="project-sidebar">
            <div className="card donate-card">
              {project.hasGoal && (
                <div className="funding-progress">
                  <div className="funding-amount">
                    <span className="current">{formatCurrency(project.currentAmount)}</span>
                    <span className="goal">raised of {formatCurrency(project.goalAmount)} goal</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${calculateProgress(project.currentAmount, project.goalAmount)}%` }}
                    ></div>
                  </div>
                  <p className="progress-percentage">
                    {calculateProgress(project.currentAmount, project.goalAmount).toFixed(1)}% funded
                  </p>
                </div>
              )}

              <div className="donor-count">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>{project._count?.subscriptions || 0} active donors</span>
              </div>

              <button className="btn btn-primary btn-block" onClick={handleDonateClick}>
                Start Recurring Donation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Donate Modal */}
      {showDonateModal && (
        <div className="modal-overlay" onClick={() => setShowDonateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Set Up Recurring Donation</h3>
              <button className="modal-close" onClick={() => setShowDonateModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitDonation}>
              <div className="modal-body">
                <p className="modal-subtitle">Supporting: {project.name}</p>

                <div className="input-group">
                  <label>Amount (NGN)</label>
                  <input
                    type="number"
                    className="input"
                    value={donationData.amount}
                    onChange={(e) => setDonationData({ ...donationData, amount: e.target.value })}
                    placeholder="Enter amount (min. ₦100)"
                    min="100"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Donation Frequency</label>
                  <select
                    className="input"
                    value={donationData.interval}
                    onChange={(e) => setDonationData({ ...donationData, interval: e.target.value })}
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUALLY">Annually</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                {donationData.interval === 'CUSTOM' && (
                  <div className="input-group">
                    <label>Custom Interval (days)</label>
                    <input
                      type="number"
                      className="input"
                      value={donationData.customIntervalDays}
                      onChange={(e) => setDonationData({ ...donationData, customIntervalDays: e.target.value })}
                      placeholder="Number of days"
                      min="1"
                      required
                    />
                  </div>
                )}

                <div className="amount-suggestions">
                  {[1000, 5000, 10000, 25000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`amount-btn ${donationData.amount === amount.toString() ? 'active' : ''}`}
                      onClick={() => setDonationData({ ...donationData, amount: amount.toString() })}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDonateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Continue to Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
