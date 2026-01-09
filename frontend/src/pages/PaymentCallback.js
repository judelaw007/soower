import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/layouts/Navbar';
import './PaymentCallback.css';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (reference) {
      verifyPayment(reference);
    } else {
      setStatus('failed');
      setMessage('No payment reference found');
    }
  }, [searchParams]);

  const verifyPayment = async (reference) => {
    try {
      const response = await paymentsAPI.verify(reference);
      if (response.data.success) {
        setStatus('success');
        setMessage('Payment successful! Your recurring donation has been set up.');
        toast.success('Payment successful!');
      } else {
        setStatus('failed');
        setMessage('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      setStatus('failed');
      setMessage(error.response?.data?.message || 'Payment verification failed');
      toast.error('Payment failed');
    }
  };

  return (
    <div className="callback-page">
      <Navbar />
      <div className="callback-container">
        <div className="callback-card">
          {status === 'verifying' && (
            <>
              <div className="spinner"></div>
              <h2>Verifying Payment</h2>
              <p>{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="status-icon success">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2>Payment Successful!</h2>
              <p>{message}</p>
              <div className="callback-actions">
                <button className="btn btn-primary" onClick={() => navigate('/subscriptions')}>
                  View My Subscriptions
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/projects')}>
                  Browse More Projects
                </button>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="status-icon failed">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <h2>Payment Failed</h2>
              <p>{message}</p>
              <div className="callback-actions">
                <button className="btn btn-primary" onClick={() => navigate('/projects')}>
                  Try Again
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
