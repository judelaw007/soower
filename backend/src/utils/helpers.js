const crypto = require('crypto');

// Generate unique reference for payments
const generateReference = (prefix = 'SOW') => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${randomStr}`.toUpperCase();
};

// Calculate next payment date based on interval
const calculateNextPaymentDate = (interval, customDays = null, fromDate = new Date()) => {
  const date = new Date(fromDate);

  switch (interval) {
    case 'WEEKLY':
      date.setDate(date.getDate() + 7);
      break;
    case 'MONTHLY':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'QUARTERLY':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'ANNUALLY':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'CUSTOM':
      if (customDays) {
        date.setDate(date.getDate() + customDays);
      }
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }

  return date;
};

// Map interval to Paystack interval
const mapToPaystackInterval = (interval) => {
  const mapping = {
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    ANNUALLY: 'annually',
  };
  return mapping[interval] || 'monthly';
};

// Format currency
const formatCurrency = (amount, currency = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  generateReference,
  calculateNextPaymentDate,
  mapToPaystackInterval,
  formatCurrency,
  isValidEmail,
};
