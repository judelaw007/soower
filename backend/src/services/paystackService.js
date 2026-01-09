const paystackApi = require('../config/paystack');
const { generateReference, mapToPaystackInterval } = require('../utils/helpers');

// Create a Paystack customer
const createCustomer = async (email, firstName, lastName, phone) => {
  try {
    const response = await paystackApi.post('/customer', {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
    });
    return response.data;
  } catch (error) {
    console.error('Create customer error:', error.response?.data || error.message);
    throw error;
  }
};

// Create a subscription plan
const createPlan = async (name, amount, interval) => {
  try {
    const paystackInterval = mapToPaystackInterval(interval);
    const response = await paystackApi.post('/plan', {
      name,
      amount: Math.round(amount * 100), // Convert to kobo
      interval: paystackInterval,
      currency: 'NGN',
    });
    return response.data;
  } catch (error) {
    console.error('Create plan error:', error.response?.data || error.message);
    throw error;
  }
};

// Initialize a transaction (for one-time or subscription setup)
const initializeTransaction = async ({ email, amount, metadata, callback_url, plan }) => {
  try {
    const payload = {
      email,
      amount: Math.round(amount * 100), // Convert to kobo
      reference: generateReference(),
      callback_url,
      metadata,
    };

    if (plan) {
      payload.plan = plan;
    }

    const response = await paystackApi.post('/transaction/initialize', payload);
    return response.data;
  } catch (error) {
    console.error('Initialize transaction error:', error.response?.data || error.message);
    throw error;
  }
};

// Verify a transaction
const verifyTransaction = async (reference) => {
  try {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    console.error('Verify transaction error:', error.response?.data || error.message);
    throw error;
  }
};

// Create subscription
const createSubscription = async (customerCode, planCode, start_date) => {
  try {
    const response = await paystackApi.post('/subscription', {
      customer: customerCode,
      plan: planCode,
      start_date,
    });
    return response.data;
  } catch (error) {
    console.error('Create subscription error:', error.response?.data || error.message);
    throw error;
  }
};

// Get subscription
const getSubscription = async (subscriptionIdOrCode) => {
  try {
    const response = await paystackApi.get(`/subscription/${subscriptionIdOrCode}`);
    return response.data;
  } catch (error) {
    console.error('Get subscription error:', error.response?.data || error.message);
    throw error;
  }
};

// Enable subscription
const enableSubscription = async (code, token) => {
  try {
    const response = await paystackApi.post('/subscription/enable', {
      code,
      token,
    });
    return response.data;
  } catch (error) {
    console.error('Enable subscription error:', error.response?.data || error.message);
    throw error;
  }
};

// Disable subscription
const disableSubscription = async (code, token) => {
  try {
    const response = await paystackApi.post('/subscription/disable', {
      code,
      token,
    });
    return response.data;
  } catch (error) {
    console.error('Disable subscription error:', error.response?.data || error.message);
    throw error;
  }
};

// Charge authorization (for recurring payments)
const chargeAuthorization = async ({ email, amount, authorization_code, reference, metadata }) => {
  try {
    const response = await paystackApi.post('/transaction/charge_authorization', {
      email,
      amount: Math.round(amount * 100),
      authorization_code,
      reference: reference || generateReference(),
      metadata,
    });
    return response.data;
  } catch (error) {
    console.error('Charge authorization error:', error.response?.data || error.message);
    throw error;
  }
};

// List banks
const listBanks = async () => {
  try {
    const response = await paystackApi.get('/bank');
    return response.data;
  } catch (error) {
    console.error('List banks error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  createCustomer,
  createPlan,
  initializeTransaction,
  verifyTransaction,
  createSubscription,
  getSubscription,
  enableSubscription,
  disableSubscription,
  chargeAuthorization,
  listBanks,
};
